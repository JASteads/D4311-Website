import 'dotenv/config';

import fs from 'fs';
import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { Pool, type QueryResult } from 'pg';
import type { Response as ExpressResponse } from 'express';
import { fileURLToPath } from 'url';
 
const app = express();
app.use(cors()); // Allows frontend to call the server
app.use(express.json());

// Reference values
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempFolder = 'Resources/tmp';
const devEnvLink = 'http://localhost:5173';
const debugMode = process.env.DEV_MODE;
const SRC_DIR = path.resolve(__dirname, '..');

const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING
});

// =========== SETUP ===========

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const onDatabaseConnect = async () => {
    try {
        await initialiazeDatabase();
        console.log('Current root:', SRC_DIR);
        console.log('Debug Mode:', debugMode);
        console.log('✅ Database connected and initialized');
    }
    catch (e: any) {
        console.error('❌', e);
    }
}

// Connect once when server starts
const startServer = () => {
    onDatabaseConnect();
};

// === API Routes ===

// =========== INJECTION ROUTES ===========

// TODO : Make this a more robust authentication
const authenticate = (session: string) => {
    return session === 'true';
};

const getSession = (req: any) => {
    const { session } = req.body;

    return session;
};

// For simple access requests
app.post('/api/admin_access', async (req, res) => {
    return res.send(authenticate(getSession(req)));
});

app.post('/api/admin_panel', async (req, res) => {
    // TODO : Replace with real authentication and account info
    const session = getSession(req);

    if (authenticate(session)) {
        return safeRedirect(res, 'admin_panel.html');
    } else {
        return safeRedirect(res, 'load_fail.html');
    }
});

app.post('/api/get_admin_nav', async (req, res) => {
    const session = getSession(req);

    if (authenticate(session)) {
        const panelButtonStr = ' <button id="admin-panel-button">Admin Panel</button>';
        const portalButtonStr = ' <button id="admin-portal-button">Upload Portal</button>';
        const html = panelButtonStr.concat(portalButtonStr);

        return res.send(html);
    } else {
        return res.send();
    }
});

// =========== GENERAL ROUTES ===========

app.get('/api/redirect', async (req, res) => {
    const { file } = req.query;
    
    return safeRedirect(res, file as string);
});

// =========== PRODUCT ROUTES ===========

app.get('/api/product/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const genericSplashLink = `../Resources/Images/generic_splash.png`; // Fallback image

        const result = await pool.query(`
            SELECT 
                id, title, description, hook, release_date, 
                COALESCE(splash_art_link, $2) AS splash_art_link,
                library_doll_link, icon_link, txn_link
            FROM products
            WHERE id = $1
        `, [id, genericSplashLink]);

        const product = result.rows[0];

        if (!product) {
            return res.status(404).json({ error: 'Product does not exist!' });
        }

        res.json(product);
    } catch (e: any) {
        res.status(500).json({ error: `Product fetch failed: ${e.message}` });
    }
});

app.post('/api/product', async (req, res) => {
    try {
        const { title, description, splash_art_link, txn_link } = req.body;
        const result = await pool.query(`
            INSERT INTO products (title, description, release_date, splash_art_link, txn_link)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [title, description, new Date(Date.now()).toISOString(), splash_art_link, txn_link]);
        res.json(result.rows[0]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('api/product', async (req, res) => {
    try {
        const { id, columns } = req.body;
        const result = await updateItem('products', id, columns);
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('api/product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await removeItem('products', id);

        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
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
    catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// =========== BLOG ROUTES =========== 

// Get target blog entry
app.get('/api/blog/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT id, title, author, body, created_at, game_id
            FROM blogs
            WHERE id = $1
            LIMIT 1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        res.json(result.rows[0]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
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
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/blog', async (req, res) => {
    try {
        const { id, columns } = req.body;
        const result = await updateItem('blogs', id, columns);

        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/blog/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await removeItem('blogs', id);

        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get blog entries - defaults to ALL if no limit or id is given
app.get('/api/blogs', async (req, res) => {
    try {
        const { limit, game_id } = req.query;
        const params = [];

        let queryText = `
            SELECT id, title, author, body, created_at, game_id, cover_link, hook
            FROM blogs
        `;
        let queryCount = 0;

        if (game_id) {
            queryText += ` WHERE game_id = $${++queryCount}`;
            params.push(parseInt(game_id as string));
        }

        queryText += ' ORDER BY created_at DESC';

        // Only add LIMIT if user specifically asks for it
        if (limit) {
            const upperRecentLimit = 15;

            const safeLimit = Math.min(Math.max(parseInt(limit as string) || 10), upperRecentLimit);
            queryText += ` LIMIT $${++queryCount}`;
            params.push(safeLimit);
        }

        const result = await pool.query(queryText, params);

        res.json(result.rows);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});

// =========== PORTFOLIO ROUTES ===========

// Get portfolio items
app.get('/api/portfolio', async (_, res) => {
    try {
        const result = await pool.query(`
            SELECT title, type, lang_api, date, description, image_link, project_link
            FROM portfolio_items
        `);
        res.json(result.rows);
    } catch (e: any) {
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
        res.json(result.rows[0]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/blog/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await removeItem('portfolio_items', id);

        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// =========== GALLERY ROUTES ===========

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
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// For uploading pics to the gallery
app.post('/api/gallery', async (req, res) => {
    const { container, thumbnail } = req.query;
    const { tempPath, tempName, stream } = prepareTemp();
    
    req.pipe(stream);

    // Setup by making sure characters are legal for download
    const realName = decodeURIComponent(req.headers['x-file-name'] as string);
    const realPath = path.join(SRC_DIR, req.headers['path'] as string);
    const finalPath = path.join(realPath, realName);

    console.log('Final path:', finalPath);

    const addGalleryEntry = async (): Promise<QueryResult> => {
        // Adding item to database
        const containerItems = JSON.parse(decodeURIComponent(container as string));
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
            } catch (e: any) {
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
            
            let queryResult: QueryResult | null = null;

            // Only update DB when adding a full image
            if (container) {
                console.log('Container found. Updating database..');
                try {
                    queryResult = await addGalleryEntry();    
                } catch (e: any) {
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
            } catch (e: any) {
                console.error(e);
            }
            
            const response: any = {
                message: `${(thumbnail) ? 'Thumbnail' : 'Image'} downloaded to gallery`,
                savedAs: thumbnail ? `preview_${realName}` : realName
            };

            if (queryResult) {
                response.object = queryResult.rows[0];
            }

            res.status(200).json(response);
        } catch (e: any) {
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

app.delete('/api/gallery/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await removeItem('gallery_items', id);

        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.use((_, res) => {
    safeRedirect(res, 'load_fail.html');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🐭 Server running at http://localhost:${PORT}`));

// =========== HELPER FUNCTIONS ===========

const getSafeLink = (file: string) => {
    return (debugMode === 'true') ? `${devEnvLink}/${file}` : path.join(SRC_DIR, file);
}

const safeRedirect = (res: ExpressResponse, file: string) => {
    const link = getSafeLink(file);

    if (debugMode === 'true') {
        return res.json({ redirectTo: link });
    } else {
        return res.status(404).sendFile(link);
    }
}

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

const updateItem = async (tableName: string, id: number, columns: any) => {
    try {
            let count = 0; // Tally for each param added
            let query = `UPDATE ${tableName} SET `;
            const queryParams = [];

            for (const column of columns) {
                query += `${column.name} = $${++count}, `;
                queryParams.push(column.value);
            }
            queryParams.push(id);
            query += `WHERE id = $${++count}`;

            await pool.query(`${query} RETURNING *`, queryParams);

            return { message: `${tableName} #${id} has been updated.` };
    } catch (e: any) {
        return { error: e.message };
    }
}

const removeItem = async (tableName: string, targetID: string) => {
    try {
        const result = await pool.query(
            `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`,
        [targetID]);

        console.log('Deleted item', result.rows[0]);

        return({ 
            message: `${tableName} #${targetID}: ${result.rows[0].title} has been deleted.` 
        });
    } catch (e: any) {
        return { error: e.message };
    }
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
                    subject TEXT, -- Short description used in blips
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
                    hook TEXT,
                    release_date TIMESTAMP,
                    splash_art_link TEXT,
                    library_doll_link TEXT,
                    icon_link TEXT,
                    txn_link TEXT,
                    is_locked BOOLEAN
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

    // Run all queries in parallel and verify results
    const results = await Promise.allSettled(queries.map(q => pool.query(q.sql)));
    
    if (!results.every((result) => result.status === 'fulfilled')) {
        throw new Error('Failed to connect to the database');
    }
}

startServer();