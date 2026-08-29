const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing and URL-encoded parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public/ folder
app.use(express.static(path.join(__dirname, 'public')));

// Path to persistent data storage
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'memory.json');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial high-fidelity seed data representing the user experience
const seedData = [
  {
    id: "1",
    title: "Low Clearance Hazard (< 13'6\") at UT-9 near Zion East Entrance",
    body: "Measured clearance approx 12'10\" near Zion East Entrance. Watch your AC units!",
    timestamp: new Date().toISOString()
  },
  {
    id: "2",
    title: "Cellular Dead Zone at Coalpits Wash",
    body: "Zero bars on Verizon and AT&T for a 3-mile stretch. Great for off-grid but no remote work access.",
    timestamp: new Date().toISOString()
  }
];

// Initialize JSON database if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf8');
}

// Memory database helper functions
function readDatabase() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
  }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
}

// GET API endpoint: Fetch all road reports / memory entries
app.get('/api/memory', (req, res) => {
  const db = readDatabase();
  // Sort descending by timestamp so latest dispatches are at the top
  const sorted = [...db].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(sorted);
});

// POST API endpoint: Save a new road report / memory entry
app.post('/api/memory', (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Missing required fields 'title' and 'body'." });
  }

  const db = readDatabase();
  const newEntry = {
    id: Date.now().toString(),
    title: title.trim(),
    body: body.trim(),
    timestamp: new Date().toISOString()
  };

  db.push(newEntry);
  const success = writeDatabase(db);

  if (success) {
    res.status(201).json(newEntry);
  } else {
    res.status(500).json({ error: "Failed to persist memory entry on server." });
  }
});

// Explicit health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Fallback to index.html for SPAs
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Roamstead Co-Pilot Server is Live!           `);
  console.log(` Running on port: http://localhost:${PORT}      `);
  console.log(` Durable database loaded at: ${DB_FILE}        `);
  console.log(`===============================================`);
});
