require('dotenv').config();

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg'); 
 
const app = express();
app.use(cors()); // Allows frontend to call the server
app.use(express.json());

// Reference values
const tempFolder = 'Resources/tmp';
const SRC_DIR = path.resolve(__dirname, '..');

const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING
});

// SETUP
const onDatabaseConnect = async () => {
    try {
        await initialiazeDatabase();
        console.log('Current root:', SRC_DIR);
        console.log('✅ Database connected and initialized');
    }
    catch (e) {
        console.error('❌ DB Error', e);
    }
}

// Connect once when server starts
const startServer = () => {
    onDatabaseConnect();
}

// === API Routes ===

// ----------- PRODUCT ROUTES -----------

// Get specific products
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const genericSplashLink = `../Resources/Images/generic_splash.png`; // Fallback image

        const result = await pool.query(`
            SELECT 
                id,
                title, 
                description, 
                release_date, 
                COALESCE(splash_art_link, $2) AS splash_art_link,
                txn_link
            FROM products
            WHERE id = $1
        `, [id, genericSplashLink]);

        const product = result.rows[0];

        if (!product) {
            return res.status(404).json({ error: 'Product does not exist!' });
        }

        res.json(product);
    } catch (e) {
        res.status(500).json({ error: `Product fetch failed: ${e.message}` });
    }
});

// Gets all existing products. Use category query to get only categories
app.get('/api/products', async (req, res) => {
    try {
        const { onlyTitles } = req.query;
        const selectArgs = (onlyTitles === 'true') ? 'title' : '*';
        const result = await pool.query(`SELECT ${selectArgs} FROM products`);

        // Return an array of titles if we only want titles
        if (selectArgs === 'title') {
            return res.json(result.rows.map(row => row.title));
        }
        
        res.json(result.rows);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Simple product item upload
app.post('/api/products', async (req, res) => {
    try {
        const { title, description, splash_art_link, txn_link } = req.body;
        const result = await pool.query(`
            INSERT INTO products (title, description, release_date, splash_art_link, txn_link)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [title, description, new Date().toISOString(Date.now()), splash_art_link, txn_link]);
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
})

// ----------- BLOG ROUTES ----------- 

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
            return res.status(404).json({ error: 'Blog not found' });
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
        res.status(500).json({ error: 'Failed to fetch blogs' });
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

// ----------- PORTFOLIO ROUTES -----------

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

// Simple portfolio item upload
app.post('/api/portfolio', async (req, res) => {
    try {
        const { title, type, lang_api, date, description, image_link, project_link } = req.body;
        const result = await pool.query(`
            INSERT INTO portfolio_items (title, type, lang_api, date, description, image_link, project_link)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [title, type, lang_api, date, description, image_link, project_link]);
        res.json(results.rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ----------- GALLERY ROUTES -----------

// Get gallery items -- Lazy method for now. Add filter when gallery grows too large
app.get('/api/gallery', async (req, res) => {
    try {
        const { category } = req.query;
        const requestParams = [];

        let query = `
            SELECT
                g.title,
                g.game_id,
                p.title AS category,
                g.caption,
                g.thumbnail_link,
                g.image_link,
                g.created_at
            FROM gallery_items g
            LEFT JOIN products p
              ON g.game_id = p.id
        `;

        if (category) {
            query += ' WHERE p.title = $1';
            requestParams.push(category);
        }

        // Order items last
        query += ' ORDER BY g.game_id, g.created_at DESC';

        const result = await pool.query(query, requestParams);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// For uploading pics to the gallery
app.post('/api/gallery/upload', async (req, res) => {
    const { container, thumbnail } = req.query;

    // TODO : Prepare actual thumbnail images from backend for storage
    // NOTE : Assume (for now) that thumbnails aren't actually generated yet

    const { tempPath, tempName, stream } = prepareTemp();
    
    req.pipe(stream);

    // Setup by making sure characters are legal for download
    const realName = decodeURIComponent(req.headers['x-file-name']);
    const realPath = path.join(SRC_DIR, req.headers['path']);
    const finalPath = path.join(realPath, realName);

    console.log('Final path:', finalPath);

    const addGalleryEntry = async () => {
        // Adding item to database
        const containerItems = JSON.parse(decodeURIComponent(container));
        console.log('Container:', containerItems);

        const items = { 
            title: containerItems.item.title, 
            gameID: containerItems.id, 
            caption: containerItems.item.caption,
            dateCreated: containerItems.item.date_created 
        };
        console.log('Items prepared:', items);

        return new Promise((resolve, reject) => {
            try {
                // Insert into DB
                const result = pool.query(`
                    INSERT INTO gallery_items (title, game_id, caption, thumbnail_link, image_link, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `, [items.title, items.gameID, items.caption, `preview_${realName}`, realName, items.dateCreated]);
                
                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    }

    console.log('Real Name:', realName);
    console.log('Real Path:', realPath);

    if (!fs.existsSync(path.dirname(realPath))) {
        fs.mkdirSync(path.dirname(realPath), { recursive: true });
    }

    stream.on('finish', async () => {
        try {
            // Move the temp file into its permanent location
            console.log('Moving temp file from:', path.join(tempPath, tempName));
            console.log('..to:', finalPath);
            
            let queryResult;

            // Only update DB when adding a full image
            if (container) {
                console.log('Container found. Updating database..');
                try {
                    queryResult = await addGalleryEntry();    
                } catch (e) {
                    console.error('Database upload failed..', e);
                    return res.status(500).json({
                        error: 'Failed to add gallery record to the database',
                        details: e.message
                    });
                }
            }
            
            try {
                await fs.promises.rename(path.join(tempPath, tempName), finalPath);
                console.log('File moved');
            } catch (e) {
                console.error(e);
            }
            
            const response = {
                message: `${(thumbnail) ? 'Thumbnail' : 'Image'} downloaded to gallery`,
                savedAs: thumbnail ? `preview_${realName}` : realName
            };

            if (queryResult) {
                response.object = queryResult.rows[0];
            }

            res.status(200).json(response);
        } catch (e) {
            console.error('Image download failed');
            res.status(500).json(e);
        }
    });
    
    // Error handling
    stream.on('error', () => {
        console.error('Something went wrong with the download..');
        res.status(500).json('Image download failed');
    });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(SRC_DIR, '../load_fail.html'));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🐭 Server running at http://localhost:${PORT}`));

// ----------- HELPER FUNCTIONS -----------

/**
 * 
 * @returns { Object(string, string fs.WriteStream) }
 */
const prepareTemp = () => {
    const tempName = `temp_${crypto.randomBytes(10).toString('hex')}.dat`;
    const tempPath = path.join(SRC_DIR, tempFolder);

    console.log('Temp Name:', tempName)
    console.log('Temporary Path:', tempPath);

    if (!fs.existsSync(tempPath)) {
        console.log('Temp folder does not exist. Creating new one...');
        fs.mkdirSync(tempPath, { recursive: true });
    }

    return { 
        tempPath: tempPath, 
        tempName: tempName, 
        stream: fs.createWriteStream(path.join(tempPath, tempName)) 
    };
}

/**
 * Ensures all DB tables exist and creates them if they don't.
 */
const initialiazeDatabase = async () => {
    // Table creation queries to run
    const queries = [
        {
            name: 'Blogs', 
            sql: `
                CREATE TABLE IF NOT EXISTS blogs(
                    id SERIAL PRIMARY KEY,
                    title TEXT,
                    author TEXT,
                    body TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    game_id INT,
                    FOREIGN KEY (game_id) REFERENCES products(id) ON DELETE SET DEFAULT
                );`
        },
        {
            name: 'Products', 
            sql: `
                CREATE TABLE IF NOT EXISTS products(
                    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                    title TEXT UNIQUE,
                    description TEXT,
                    release_date TIMESTAMP,
                    splash_art_link TEXT,
                    txn_link TEXT
                );`
        },
        {
            name: 'Portfolio Items',
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
        },
        {
            name: 'Gallery Items',
            sql: `
                CREATE TABLE IF NOT EXISTS gallery_items(
                    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                    title TEXT,
                    game_id INT,
                    caption TEXT,
                    thumbnail_link TEXT,
                    image_link TEXT,
                    created_at TIMESTAMP,
                    FOREIGN KEY (game_id) REFERENCES products(id) ON DELETE SET DEFAULT
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