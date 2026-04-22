const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// In-memory user database
let users = [];
let nextId = 1;

// Parse request body
function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const data = body ? JSON.parse(body) : {};
            callback(null, data);
        } catch (e) {
            callback(e, null);
        }
    });
}

// Send JSON response
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// Serve static files
function serveStaticFile(res, filepath, contentType) {
    const fullPath = path.join(__dirname, filepath);
    
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 - File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

// Proxy function to fetch external APIs (bypass CORS)
async function proxyFetch(targetUrl, res) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        sendJSON(res, 200, data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        sendJSON(res, 500, { error: error.message, source: 'proxy' });
    }
}

// Handle requests
async function handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;
    
    // CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }
    
    // PROXY ENDPOINTS - bypass CORS for anime APIs
    // Proxy for Anime Quotes
    if (pathname === '/api/proxy/quote' && method === 'GET') {
        await proxyFetch('https://animechan.xyz/api/random', res);
        return;
    }
    
    // Proxy for Random Anime (Jikan)
    if (pathname === '/api/proxy/anime' && method === 'GET') {
        await proxyFetch('https://api.jikan.moe/v4/random/anime', res);
        return;
    }
    
    // GET /api/users - get all users
    if (pathname === '/api/users' && method === 'GET') {
        const usersToSend = users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email
        }));
        sendJSON(res, 200, usersToSend);
        return;
    }
    
    // POST /api/user - add new user
    if (pathname === '/api/user' && method === 'POST') {
        parseBody(req, (err, data) => {
            if (err) {
                sendJSON(res, 400, { message: 'Invalid JSON data' });
                return;
            }
            
            const { username, email, password } = data;
            
            // Validation
            if (!username || !email || !password) {
                sendJSON(res, 400, { message: 'All fields are required' });
                return;
            }
            
            if (username.length < 3) {
                sendJSON(res, 400, { message: 'Username must be at least 3 characters' });
                return;
            }
            
            const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
            if (!emailRegex.test(email)) {
                sendJSON(res, 400, { message: 'Please enter a valid email address' });
                return;
            }
            
            if (password.length < 8) {
                sendJSON(res, 400, { message: 'Password must be at least 8 characters' });
                return;
            }
            
            // Check if user already exists
            if (users.some(u => u.email === email)) {
                sendJSON(res, 400, { message: 'User with this email already exists' });
                return;
            }
            
            if (users.some(u => u.username === username)) {
                sendJSON(res, 400, { message: 'User with this username already exists' });
                return;
            }
            
            // Add user
            const newUser = {
                id: nextId++,
                username,
                email,
                password
            };
            users.push(newUser);
            
            sendJSON(res, 201, {
                message: 'User registered successfully',
                user: { id: newUser.id, username: newUser.username, email: newUser.email }
            });
        });
        return;
    }
    
    // DELETE /api/user/:id - delete user
    if (pathname.startsWith('/api/user/') && method === 'DELETE') {
        const id = parseInt(pathname.split('/')[3]);
        
        if (isNaN(id)) {
            sendJSON(res, 400, { message: 'Invalid ID' });
            return;
        }
        
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            sendJSON(res, 404, { message: 'User not found' });
            return;
        }
        
        users.splice(userIndex, 1);
        sendJSON(res, 200, { message: 'User deleted successfully' });
        return;
    }
    
    // Static files for PWA
    if (pathname === '/' || pathname === '/index.html') {
        serveStaticFile(res, 'index.html', 'text/html');
        return;
    }
    if (pathname === '/style.css') {
        serveStaticFile(res, 'style.css', 'text/css');
        return;
    }
    if (pathname === '/app.js') {
        serveStaticFile(res, 'app.js', 'application/javascript');
        return;
    }
    if (pathname === '/manifest.json') {
        serveStaticFile(res, 'manifest.json', 'application/json');
        return;
    }
    if (pathname === '/service-worker.js') {
        serveStaticFile(res, 'service-worker.js', 'application/javascript');
        return;
    }
    if (pathname === '/offline.html') {
        serveStaticFile(res, 'offline.html', 'text/html');
        return;
    }
    if (pathname.startsWith('/icons/')) {
        const iconPath = pathname.substring(1);
        serveStaticFile(res, iconPath, 'image/png');
        return;
    }
    
    // 404 - Page not found
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 - Page not found');
}

const server = http.createServer(handleRequest);
const PORT = 3000;

server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║     CYBERPWA TERMINAL - SERVER v2.0    ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  ➤ Server running on port: ${PORT}       ║`);
    console.log(`║  ➤ URL: http://localhost:${PORT}        ║`);
    console.log('║  ➤ Status: ONLINE                      ║');
    console.log('║  ➤ API endpoints:                      ║');
    console.log('║     GET  /api/users                    ║');
    console.log('║     POST /api/user                     ║');
    console.log('║     DELETE /api/user/:id               ║');
    console.log('║  ➤ Proxy endpoints (bypass CORS):      ║');
    console.log('║     GET  /api/proxy/quote              ║');
    console.log('║     GET  /api/proxy/anime              ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
});
