require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
app.use(cors());           // Allows frontend to call this server
app.use(express.json());

const client = new Client({
    connectionString: process.env.DB_CONNECTION_STRING
});

// SETUP
const onDatabaseConnect = async () => {
    // Ensure all db tables exist
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS blogs(
                id SERIAL PRIMARY KEY,
                title TEXT,
                author TEXT,
                body TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS products(
                id SERIAL PRIMARY KEY,
                title TEXT,
                creator TEXT,
                description TEXT,
                txn_link TEXT
            );
        `);
        console.log("Tables created and/or verified");
    } catch (e) {
        console.error("Table verification failed:", e);
    }
    
    console.log("✅ Database connected");
}

// Connect once when server starts
client.connect()
    .then(onDatabaseConnect)
    .catch(e => console.error("❌ DB Error", e));


// === API Routes ===
// Get target blog entry
app.get('/api/blogs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await client.query(`
            SELECT *
            FROM blogs
            WHERE id = $1
            LIMIT 1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Blog not found" });
        }

        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get blog entries - defaults to ALL if no limit or id is given
app.get('/api/blogs', async (req, res) => {
    try {
        const { limit } = req.query;
        const params = [];

        let queryText = `
            SELECT *
            FROM blogs
            ORDER BY created_at DESC
        `;

        // Only add LIMIT if user specifically asks for it
        if (limit !== undefined) {
            const upperRecentLimit = 15;

            const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), upperRecentLimit);
            queryText += ` LIMIT $1`;
            params.push(safeLimit);
        }

        const result = await client.query(queryText, params);

        res.json(result.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch blogs" });
    }
});

// Add blog entry
app.post('/api/blog', async (req, res) => {
    try {
        const { title, author, bodyText } = req.body;
        const result = await client.query(`
            INSERT INTO blogs (title, author, body)
            VALUES ($1, $2, $3)
            RETURNING *
            `, [title, author, bodyText]);
            
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🐭 Server running at http://localhost:${PORT}`));