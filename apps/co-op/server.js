const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'memory.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory and database file exist with realistic seed data
function initializeDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const seedData = [
      {
        id: "session-1",
        title: "Active Canvas: #dev-agent-refactor",
        body: "Refactoring oauth_service.py to support token caching, verify edge cases, and automate unit test validation. Cursors moving in real-time.",
        agentPersona: "DevAgent (Coding & Refactoring)",
        repoUrl: "github.com/co-op/auth-service",
        teamAccess: "Engineering Core",
        activeHumans: "3",
        activeAgents: "2",
        syncLatency: "12ms",
        createdAt: "2026-08-29T10:42:00Z",
        logs: [
          { time: "10:42 AM", user: "Sarah (PM)", type: "human", text: "Joined the canvas stream config." },
          { time: "10:43 AM", user: "DevAgent-3", type: "agent", text: "Rewriting OAuth2 token validation logic step-by-step..." },
          { time: "10:44 AM", user: "Alex (Dev)", type: "human", text: "Highlighted lines 45-60 adding comment: 'Verify token expiration edge case'" }
        ]
      },
      {
        id: "session-2",
        title: "Simulation: #billing-stripe-module",
        body: "Constructing reliable webhooks and payment test environments. QA-Agent checking core subscriptions.",
        agentPersona: "QA-Agent (Test Generation)",
        repoUrl: "github.com/co-op/billing",
        teamAccess: "Product & QA",
        activeHumans: "2",
        activeAgents: "1",
        syncLatency: "15ms",
        createdAt: "2026-08-29T08:15:00Z",
        logs: [
          { time: "08:15 AM", user: "John (Dev)", type: "human", text: "Initiated subscription-v2 check." },
          { time: "08:16 AM", user: "QA-Agent", type: "agent", text: "Verifying dynamic webhook payload validation." },
          { time: "08:18 AM", user: "QA-Agent", type: "agent", text: "All 14 tests completed. Green pipeline." }
        ]
      }
    ];

    fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
    console.log("Memory database initialized with seed sessions.");
  }
}

initializeDatabase();

// Helper to read database
function readDB() {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading database file, returning empty array:", error);
    return [];
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error("Error writing to database file:", error);
    return false;
  }
}

// API Endpoints

// GET /api/memory - Retrieve saved agent sessions
app.get('/api/memory', (req, res) => {
  const data = readDB();
  res.json(data);
});

// POST /api/memory - Save/create a new agent session
app.post('/api/memory', (req, res) => {
  const { title, body, agentPersona, repoUrl, teamAccess } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Missing required fields 'title' and 'body'." });
  }

  const database = readDB();

  const newEntry = {
    id: `session-${Date.now()}`,
    title: title,
    body: body,
    agentPersona: agentPersona || "DevAgent (Coding & Refactoring)",
    repoUrl: repoUrl || "github.com/co-op/workspace",
    teamAccess: teamAccess || "Entire Workspace",
    activeHumans: Math.floor(Math.random() * 4 + 1).toString(),
    activeAgents: "1",
    syncLatency: `${Math.floor(Math.random() * 20 + 5)}ms`,
    createdAt: new Date().toISOString(),
    logs: [
      {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: "System Manager",
        type: "human",
        text: `Session created: ${title}`
      },
      {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: "Agent-1",
        type: "agent",
        text: `Ready to collaborate on ${repoUrl}`
      }
    ]
  };

  database.unshift(newEntry); // Prepend new sessions so they appear on top

  if (writeDB(database)) {
    res.status(201).json({ success: true, entry: newEntry });
  } else {
    res.status(500).json({ error: "Failed to persist memory database." });
  }
});

// Start active Web Server
app.listen(PORT, () => {
  console.log(`Co-Op server running at http://localhost:${PORT}`);
});
