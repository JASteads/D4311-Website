import 'dotenv/config';

import fs from 'fs';
import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import argon2 from 'argon2';
import { Pool } from 'pg';
import type { Response as ExpressResponse } from 'express';
import { fileURLToPath } from 'url';

// Reference values
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempFolder = 'Resources/tmp';
const devEnvLink = 'http://localhost:5173';
const debugMode = process.env.DEV_MODE;
const SRC_DIR = path.resolve(__dirname, '..');
const SESSION_COOKIE = 'session';

const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING
});

// =========== SETUP ===========

const app = express();
app.use(express.json());
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

// =========== USER MANAGEMENT ROUTES ===========

app.get('api/user', async (req, res) => {
    try {
        const user = await requireUser(req, res);

        if (!user) {
            res.status(401).json('No user is currently logged in');
            return;
        }

        res.json({ alias: user.alias, email: user.email, type: user.type });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('api/user', async (req, res) => {
    try {
        const { username, password, alias, email } = req.body;
        const user = await getUser(username);

        if (user && user.username === username) {
            res.status(409).json({ error: 'Username has been taken' });
            return;
        }

        const hash = await argon2.hash(password);
        const result = await pool.query(
            `INSERT INTO users (username, password, alias, type, email)
                VALUES ($1, $2, $3, 'standard', $4)
                RETURNING *I
        `, [username, hash, alias, email]);
        res.json(result.rows[0]);
    } catch(e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('api/login', async (req, res) => {
    try {
        const { username, password, remember } = req.body;
        const user = await getUser(username);

        if (!(user && argon2.verify(password, user.password))) { 
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const [alias, type] = [user.alias, user.account_type];
        const session = await generateSession(user.username, remember);

        res.cookie(SESSION_COOKIE, session.rows[0].id, {
            httpOnly: true,
            secure: process.env.DEV_MODE === 'false',
            sameSite: 'lax' as const,
            path: '/',
            maxAge: daysToMS(remember)
        });
        res.json({ alias, type });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('api/logout', async (req, res) => {
    try {
        await removeItem('sessions', getSessionID(req));
        res.clearCookie(SESSION_COOKIE, {
            httpOnly: true,
            secure: process.env.DEBUG === 'false',
            sameSite: 'lax',
            path: '/'
        });
        res.json({ ok: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// For simple access requests
app.post('/api/admin_access', async (req, res) => {
    return res.send(await requireUser(req, res, 'admin'));
});

// =========== INJECTION ROUTES ===========

app.post('/api/admin_panel', async (req, res) => {
    const user = await requireUser(req, res, 'admin');
    const url = user ? 'admin_panel.html' : 'load_fail.html';

    return safeRedirect(res, url);
});

// TODO : Make this an addon for a general get_nav route that uses user info
app.post('/api/get_admin_nav', async (req, res) => {
    if (await requireUser(req, res, 'admin')) {
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

app.post('/api/image', async (req, res) => {
    if (!await requireUser(req, res, 'admin')) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
    }

    const { type, isThumbnail } = req.query;
    const { tempPath, tempName, stream } = prepareTemp();

    req.pipe(stream);

    // Setup by making sure characters are legal for download
    const realName = decodeURIComponent(req.headers['x-file-name'] as string);
    const realPath = path.join(SRC_DIR, `Resources/Images/${type}`);
    const finalPath = path.join(realPath, realName);

    console.log('Final path:', finalPath);
    console.log('Real Name:', realName);
    console.log('Real Path:', realPath);

    if (!fs.existsSync(realPath)) {
        fs.mkdirSync(realPath, { recursive: true });
    }

    stream.on('finish', async () => {
        try {
            // Move the temp file into its permanent location
            console.log('Moving temp file from:', path.join(tempPath, tempName));
            console.log('..to:', finalPath);

            await fs.promises.rename(path.join(tempPath, tempName), finalPath);
            console.log('File moved');
            
            const thumb = !(!isThumbnail) && isThumbnail;
            const response = {
                message: `${( thumb ? 'Thumbnail' : 'Image')} downloaded to gallery`,
                savedAs: thumb ? `preview_${realName}` : realName
            };

            res.status(200).json(response);
        } catch (e: any) {
            console.error('Image download failed');
            res.status(500).json(e);
        }
    });
    
    stream.on('error', () => {
        console.error('Something went wrong with the download..');
        res.status(500).json('Image download failed');
    });
});

// =========== PRODUCT ROUTES ===========

app.get('/api/product/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT id, title, description, hook, release_date, txn_link
            FROM products
            WHERE id = $1
        `, [id]);

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
        if (!await requireUser(req, res, 'admin')) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

        const { title, hook, description }: Record<string, string> = req.body;
        const result = await basicPost(
            'products', { title, hook, description, release_date: new Date().toISOString() }
        );

        res.json(result.rows[0]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/product', async (req, res) => {
    try {
        if (!await requireUser(req, res, 'admin')) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

        const { id, columns }: { id: number; columns: Record<string, string> } = req.body;
        const { title, hook, description, release_date } = columns;

        res.json(await basicPut('products', id, { title, hook, description, release_date }));
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('api/product/:id', async (req, res) => {
    try {
        if (!await requireUser(req, res, 'admin')) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

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
        const { title, body } = req.body;
        const user = await requireUser(req, res, 'admin');

        if (!user) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

        const result = await basicPost('blogs', { title, body, author: user.alias });
        res.json(result.rows[0]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/blog', async (req, res) => {
    try {
        const user = await requireUser(req, res, 'admin');
        if (!user) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

        const { id, columns }: { id: number; columns: Record<string, string> } = req.body;
        const { title, body } = columns;

        res.json(await basicPut('blogs', id, { title, body }));
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/blog/:id', async (req, res) => {
    try {
        if (! await requireUser(req, res, 'admin')) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

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

        let queryText = 'SELECT id, title, author, body, created_at, game_id, hook FROM blogs';

        if (game_id) {
            params.push(`${game_id}`);
            queryText += ` WHERE game_id = $${params.length}`;
        }
        queryText += ' ORDER BY id DESC';

        if (limit) {
            const upperRecentLimit = 15;

            const safeLimit = Math.min(Math.max(parseInt(limit as string) || 10), upperRecentLimit);
            params.push(safeLimit);
            queryText += ` LIMIT $${params.length}`;
        }
        const result = await pool.query(queryText, params);

        res.json(result.rows);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});

// =========== PORTFOLIO ROUTES ===========

app.get('/api/portfolio', async (_, res) => {
    try {
        const result = await pool.query(`
            SELECT id, title, lang_api, date, description, project_link
            FROM portfolio_items
            ORDER BY id DESC
        `);
        res.json(result.rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/portfolio', async (req, res) => {
    try {
        if (!await requireUser(req, res, 'admin')) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

        const { title, lang_api, date, description, project_link } = req.body;
        const result = await basicPost('portfolio_items', {
            title, lang_api, date, description, project_link
        });
        
        res.json(result.rows[0]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/portfolio', async (req, res) => {
    try {
        if (!await requireUser(req, res, 'admin')) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

        const { id, columns }: { id: number; columns: Record<string, string> } = req.body;
        const { title, lang_api, date, description, project_link } = columns;

        res.json(await basicPut('portfolio_items', id, {
            title, lang_api, date, description, project_link
        }));
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/portfolio/:id', async (req, res) => {
    try {
        if (!await requireUser(req, res, 'admin')) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

        const { id } = req.params;
        res.json(await removeItem('portfolio_items', id));
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// =========== GALLERY ROUTES ===========

// Get gallery items -- Lazy method for now. Add filter when gallery grows too large
app.get('/api/gallery', async (req, res) => {
    try {
        const { id, category } = req.query;
        const requestParams = [];

        let query = `
            SELECT g.id, g.title, g.game_id, p.title AS category, g.caption, g.created_at
            FROM gallery_items g
            LEFT JOIN products p
              ON g.game_id = p.id
        `;

        if (id) {
            requestParams.push(id);
            query += ` WHERE g.id = $${requestParams.length}`;
        }

        if (category) {
            requestParams.push(category);
            query += ` ${(requestParams.length > 0 ? 'AND' : 'WHERE')} p.title = $${requestParams.length}`;
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
    try {
        if (!await requireUser(req, res, 'admin')) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

        const { title, caption, created_at, game_id } = req.body;
        const result = await basicPost('gallery_items', {
            title, caption, created_at, game_id
        });
        
        res.json(result.rows[0]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }6
});

app.put('/api/gallery', async (req, res) => {
    try {
        if (!await requireUser(req, res, 'admin')) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

        const { id, columns }: { id: number; columns: Record<string, string> } = req.body;
        const { title, caption, created_at, game_id } = columns;

        res.json(await basicPut('gallery_items', id, {
            title, caption, created_at, game_id
        }));
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/gallery/:id', async (req, res) => {
    try {
        if (!await requireUser(req, res, 'admin')) {
            res.status(403).json({ error: 'You must be an admin to perform this action' });
            return;
        }

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

    return { tempPath: tempPath, tempName: tempName, 
        stream: fs.createWriteStream(path.join(tempPath, tempName)) 
    };
}

const basicPost = async (tableName: string, columns: Record<string, string>) => {
    const keys = Object.keys(columns).filter(k => columns[k] !== undefined);
    const values = Object.values(columns).filter(v => v !== undefined);

    return await pool.query(`
        INSERT INTO ${tableName} (${keys.join(', ')})
        VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')})
        RETURNING *
    `, values);
}

const basicPut = async (tableName: string, id: number, columns: Record<string, string>) => {
    const setClauses: string[] = [];
    const queryParams: any[] = [];

    console.log(columns);
    console.log('Columns...');

    for (const [column, value] of Object.entries(columns)) {
        if (value === undefined) { continue; }

        setClauses.push(`${column} = $${queryParams.length + 1}`);
        queryParams.push(value);
    }

    console.log(`
        UPDATE ${tableName} SET ${setClauses.join(', ')}
        WHERE id = ${id} RETURNING *
    `);
    console.log(queryParams);

    return await pool.query(`
        UPDATE ${tableName} SET ${setClauses.join(', ')}
        WHERE id = ${id} RETURNING *`, queryParams
    );
}

const removeItem = async (tableName: string, targetID: string) => {
    const result = await pool.query(
        `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`,
    [targetID]);

    console.log('Deleted item', result.rows[0]);

    return({ message: 
        `${tableName} #${targetID}: ${result.rows[0].title} has been deleted.` 
    });
}

const parseCookie = (header: string | undefined) => {
    const result: Record<string, string> = {};

    if (!header) { return result; }

    // Read through each piece of the cookie
    for (const piece of header.split(';')) {
        const [key, ...content] = piece.trim().split('=');

        if (!key) { continue; }

        result[decodeURIComponent(key)] = decodeURIComponent(content.join('='));
    }

    return result;
}

const getUser = async (username: string): Promise<Record<string, string> | null> => {
    const user = await pool.query(`SELECT username FROM users WHERE username = $1`, [username]);

    return user && user.rows.length > 0 ? user.rows[0] : null;
}

const REMEMBER_DURATION = 21; // 21 Days
const daysToMS = (remember: boolean) => 1000 * 60 * 60 * 24 * (remember ? REMEMBER_DURATION : 1);

const getSessionID = (req: express.Request) => parseCookie(req.headers.cookie)[SESSION_COOKIE];

const generateSession = async (username: string, remember: boolean) => {
    const query = `INSERT INTO sessions (id, username, created_at, expires_at, remember)
        VALUES($1, $2, $3, $4, $5) 
        RETURNING *`;
    const id = crypto.randomBytes(16).toString('hex'); // Random session number to obfuscate
    const now = new Date();
    const expiry = new Date(Date.now() + daysToMS(remember));
    
    return await pool.query(query, [id, username, now, expiry, remember]);
}

const renewSession = async (id: string, remember: boolean) => {
    await pool.query(`
        UPDATE sessions 
        SET expires_at = $2 
        WHERE id = $1`, [id, new Date(Date.now() + daysToMS(remember))]
    );
}

const requireUser = async (req: express.Request, res: ExpressResponse, accountType?: string) => {
    const id = getSessionID(req);
    
    if (!id) { return null; }

    const users = await pool.query(`
        SELECT u.username, u.alias, u.account_type AS type, s.remember
        FROM sessions s
        INNER JOIN users u
           ON u.username = s.username
        WHERE s.id = $1
          AND s.expires_at > NOW()
    `, [id]);

    // Remove the cookie from the request if no valid user
    if (!(users && users.rows.length > 0)) {
        res.clearCookie(SESSION_COOKIE, {
            httpOnly: true,
            secure: process.env.DEBUG === 'true',
            sameSite: 'lax',
            path: '/'
        });

        return null;
    }
    const user = users.rows[0]; // Get the target user from DB

    // Authorize user if necessary
    if (accountType && !(user.type === accountType || user.type === 'admin')) { return null; }
    
    await renewSession(id, user.remember); // Authorized -- refresh session
    res.cookie(SESSION_COOKIE, id, {
        httpOnly: true,
        secure: process.env.DEV_MODE === 'false',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: daysToMS(user.remember)
    });

    return user;
}

/**
 * Ensures all DB tables exist and creates them if they don't.
 */
const initialiazeDatabase = async () => {
    // Table creation queries to run
    const queries = [
        { name: 'Blogs', sql: 
            `CREATE TABLE IF NOT EXISTS blogs(
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
        { name: 'Products', sql: 
            `CREATE TABLE IF NOT EXISTS products(
                id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                title TEXT UNIQUE,
                description TEXT,
                hook TEXT,
                release_date TIMESTAMP,
                txn_link TEXT,
                is_locked BOOLEAN
            );`
        },
        { name: 'Portfolio Items', sql: 
            `CREATE TABLE IF NOT EXISTS portfolio_items(
                id SERIAL PRIMARY KEY,
                title TEXT,
                type TEXT,
                lang_api TEXT,
                date TEXT,
                description TEXT,
                project_link TEXT
            );`
        },
        { name: 'Gallery Items', sql: 
            `CREATE TABLE IF NOT EXISTS gallery_items(
                id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                title TEXT,
                game_id INT,
                caption TEXT,
                created_at TIMESTAMP,
                FOREIGN KEY (game_id) REFERENCES products(id) ON DELETE SET DEFAULT
            );`
        },
        { name: 'Users', sql: 
            `CREATE TABLE IF NOT EXISTS users(
                username TEXT PRIMARY KEY,
                password TEXT,
                alias TEXT,
                type TEXT,
                email TEXT,
                salt TEXT
            );`
        },
        { name: 'Sessions', sql:
            `CREATE TABLE IF NOT EXISTS sessions(
                id INT PRIMARY KEY,
                username TEXT,
                created_at TIMESTAMPTZ,
                expires_at TIMESTAMPTZ,
                FOREIGN KEY (username) REFERENCES users(username) ON DELETE SET DEFAULT
            );` // TIMESTAMPTZ considers timezone
        }
    ];

    // Run all queries in parallel and verify results
    const results = await Promise.allSettled(queries.map(q => pool.query(q.sql)));
    
    if (!results.every((result) => result.status === 'fulfilled')) {
        throw new Error('Failed to connect to the database');
    }
}

startServer();