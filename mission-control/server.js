const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8081;
const OPENCLAW_DIR = path.join(process.env.HOME, '.openclaw');

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
};

// Read JSON file safely
function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return null;
    }
}

// Get agent sessions data
function getAgentSessions() {
    const agentsDir = path.join(OPENCLAW_DIR, 'agents');
    const agents = {};
    
    try {
        const agentDirs = fs.readdirSync(agentsDir);
        for (const agentId of agentDirs) {
            const sessionsFile = path.join(agentsDir, agentId, 'sessions', 'sessions.json');
            const sessions = readJson(sessionsFile);
            if (sessions) {
                agents[agentId] = sessions;
            }
        }
    } catch (e) {
        // Agents dir may not exist
    }
    
    return agents;
}

// Get subagent runs
function getSubagentRuns() {
    const runsFile = path.join(OPENCLAW_DIR, 'subagents', 'runs.json');
    return readJson(runsFile) || { runs: [] };
}

// Get cron jobs
function getCronJobs() {
    const jobsFile = path.join(OPENCLAW_DIR, 'cron', 'jobs.json');
    return readJson(jobsFile) || { jobs: [] };
}

// Get system stats
function getSystemStats(callback) {
    exec('ps aux | grep openclaw | grep -v grep', (error, stdout) => {
        const processes = stdout.trim().split('\n').filter(Boolean).length;
        
        exec('free -m | grep Mem | awk \'{print $3, $2}\'', (err, memOutput) => {
            const memParts = memOutput.trim().split(' ');
            const memUsed = parseInt(memParts[0]) || 0;
            const memTotal = parseInt(memParts[1]) || 0;
            
            exec('uptime -p', (err2, uptime) => {
                callback({
                    processes,
                    memory: { used: memUsed, total: memTotal },
                    uptime: uptime.trim() || 'Unknown'
                });
            });
        });
    });
}

// Serve static files
function serveFile(res, filePath) {
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

// API endpoints
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const url = req.url.split('?')[0];
    
    // API endpoints
    if (url === '/api/agents') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getAgentSessions()));
        return;
    }
    
    if (url === '/api/subagents') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getSubagentRuns()));
        return;
    }
    
    if (url === '/api/cron') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getCronJobs()));
        return;
    }
    
    if (url === '/api/system') {
        getSystemStats((stats) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(stats));
        });
        return;
    }
    
    if (url === '/api/all') {
        getSystemStats((systemStats) => {
            const data = {
                agents: getAgentSessions(),
                subagents: getSubagentRuns(),
                cron: getCronJobs(),
                system: systemStats,
                timestamp: new Date().toISOString()
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        });
        return;
    }
    
    // Static files
    if (url === '/' || url === '/index.html') {
        serveFile(res, path.join(__dirname, 'index.html'));
        return;
    }
    
    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`Mission Control server running on http://localhost:${PORT}`);
    console.log(`Tailscale HTTPS: https://srv1405873.tailcd23a1.ts.net:8444`);
});
