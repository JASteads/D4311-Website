require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');


const app = express();
app.use(cors()); // Allows frontend to call the server
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING
});

// SETUP
const onDatabaseConnect = async () => {
    try {
        await initialiazeDatabase();
        console.log("✅ Database connected and initialized");
    }
    catch (e) {
        console.error("❌ DB Error", e);
    }
}

// Connect once when server starts
const startServer = () => {
    onDatabaseConnect();
}

// === API Routes ===
// Get target blog entry
app.get('/api/blogs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
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

        const result = await pool.query(queryText, params);

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
        const result = await pool.query(`
            INSERT INTO blogs (title, author, body)
            VALUES ($1, $2, $3)
            RETURNING *
            `, [title, author, bodyText]);
            
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get portfolio items
app.get('/api/portfolio', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT title, type, lang_api, date, description, image_link, project_link
            FROM portfolio_items
        `);

        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, './src/load_fail.html'));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🐭 Server running at http://localhost:${PORT}`));

/**
 * Ensures all DB tables exist and creates them if they don't.
 */
const initialiazeDatabase = async () => {
    // Table creation queries to run
    const queries = [
        {
            name: "Blogs", 
            sql: `
                CREATE TABLE IF NOT EXISTS blogs(
                    id SERIAL PRIMARY KEY,
                    title TEXT,
                    author TEXT,
                    body TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );`
        },
        {
            name: "Products", 
            sql: `
                CREATE TABLE IF NOT EXISTS products(
                    id SERIAL PRIMARY KEY,
                    title TEXT,
                    creator TEXT,
                    description TEXT,
                    txn_link TEXT
                );`
        },
        {
            name: "Portfolio Items",
            sql: `
                CREATE TABLE IF NOT EXISTS portfolio_items(
                    id SERIAL PRIMARY KEY,
                    title TEXT,
                    type TEXT,
                    lang_api TEXT,
                    date TEXT,
                    description TEXT,
                    image_link TEXT,
                    project_link TEXT
                );`
        }
    ];

    // Run all queries in parallel and log results
    const results = await Promise.allSettled(queries.map(q => pool.query(q.sql)));
    results.forEach((result, i) => {
        const qName = queries[i].name;

        if (result.status === 'fulfilled')  
            console.log(`Verified ${qName} table`);
        else
            console.error(`${qName} table verification failed:`, result.reason);
    });
}

startServer();