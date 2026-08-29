const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MEMORY_FILE = path.join(__dirname, 'memory.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Default seed memories to match the Co-Op product spec
const defaultMemories = [
  {
    id: '1',
    title: 'DevAgent-3: Refactoring auth_service.py',
    body: 'Persona: Coding & Refactoring. Context Repository: github.com/co-op/auth-service. Running OAuth2 validation checks and writing unit tests for token expiration edge cases.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    persona: 'DevAgent (Coding & Refactoring)',
    repo: 'github.com/co-op/auth-service',
    access: 'Engineering Core'
  },
  {
    id: '2',
    title: 'QA-Agent: Verifying edge-case boundaries',
    body: 'Persona: Test Generation. Context Repository: github.com/co-op/auth-service. Waiting for DevAgent-3 to hand over the terminal session before running API suite regression tests.',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    persona: 'QA-Agent (Test Generation)',
    repo: 'github.com/co-op/auth-service',
    access: 'Product & QA'
  },
  {
    id: '3',
    title: 'DocAgent: API Endpoint Documentation Update',
    body: 'Persona: Technical Writing. Context Repository: github.com/co-op/api-docs. Auto-generating markdown endpoints summary for the newly introduced shared session structures.',
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
    persona: 'DocAgent (Technical Writing)',
    repo: 'github.com/co-op/api-docs',
    access: 'Entire Workspace'
  }
];

// Helper to read memory from the JSON file
function readMemories() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(defaultMemories, null, 2));
      return defaultMemories;
    }
    const data = fs.readFileSync(MEMORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading memory file, using defaults:', err);
    return defaultMemories;
  }
}

// Helper to write memory to the JSON file
function writeMemories(memories) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing memory file:', err);
    return false;
  }
}

// GET /api/memory - retrieves all stored collaborative agent sessions/memories
app.get('/api/memory', (req, res) => {
  const memories = readMemories();
  res.json(memories);
});

// POST /api/memory - appends a new agent session/memory
app.post('/api/memory', (req, res) => {
  const { title, body, persona, repo, access } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required properties.' });
  }

  const memories = readMemories();
  
  const newMemory = {
    id: Date.now().toString(),
    title,
    body,
    persona: persona || 'General Agent',
    repo: repo || 'Local Context',
    access: access || 'Entire Workspace',
    createdAt: new Date().toISOString()
  };

  memories.unshift(newMemory); // Add to the front of the list
  const success = writeMemories(memories);

  if (success) {
    res.status(201).json(newMemory);
  } else {
    res.status(500).json({ error: 'Failed to write session memory data to storage.' });
  }
});

// DELETE /api/memory/:id - deletes a specific session/memory (Clean look)
app.delete('/api/memory/:id', (req, res) => {
  const { id } = req.params;
  let memories = readMemories();
  const initialLength = memories.length;
  memories = memories.filter(m => m.id !== id);
  
  if (memories.length === initialLength) {
    return res.status(404).json({ error: 'Memory session not found.' });
  }
  
  const success = writeMemories(memories);
  if (success) {
    res.json({ message: 'Session memory deleted successfully.', id });
  } else {
    res.status(500).json({ error: 'Failed to update memory store.' });
  }
});

// Fallback to deliver the main single page web app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Co-Op Collaborative Backend Live!`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Memory file path: ${MEMORY_FILE}`);
  console.log(`========================================`);
});
