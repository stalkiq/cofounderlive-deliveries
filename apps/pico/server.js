import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parse and CORS
app.use(express.json());
app.use(cors());

// Serve static elements
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default templates representing Pete's ideas
const DEFAULTS = [
  {
    id: "lead-scraper-id",
    title: "lead-scraper",
    body: JSON.stringify({
      runtime: "Python 3.11 (Lightweight)",
      access: "Team Access (Google Workspace Auth)",
      code: `import os\nimport requests\nfrom bs4 import BeautifulSoup\n\nSCRAPER_API_KEY = os.environ.get("SCRAPER_API_KEY")\n\ndef main():\n    print("Extracting weekly leads from target directories...")\n    # Scrape data\n    resp = requests.get("https://news.ycombinator.com")\n    soup = BeautifulSoup(resp.text, 'html.parser')\n    # Process elements and notify\n    print("Found 15 high-quality leads. Dispatching to Slack.")\n\nif __name__ == '__main__':\n    main()`,
      status: "Live",
      compute_time: "9.2s",
      active_users: 2,
      detail: "Extracts weekly leads from target directories and pushes to Slack."
    }),
    createdAt: new Date("2026-08-25T10:00:00Z").toISOString()
  },
  {
    id: "sprint-burndown-id",
    title: "sprint-burndown",
    body: JSON.stringify({
      runtime: "Node.js 20 (Alpine)",
      access: "Public (Anyone with link)",
      code: `// Node.js Sprint Burndown SVG Generator\nimport fs from 'fs';\n\nexport async function run(csvData) {\n  console.log("Generating custom SVG burndown charts...");\n  // Parsing and calculations\n  const points = [140, 110, 90, 75, 40, 10];\n  return \`<svg width="400" height="200">...\u0060;\n}`,
      status: "Live",
      compute_time: "1.4s",
      active_users: 4,
      detail: "Generates custom SVG burndown charts from raw Jira CSV exports."
    }),
    createdAt: new Date("2026-08-26T14:30:00Z").toISOString()
  },
  {
    id: "pdf-redactor-id",
    title: "pdf-redactor",
    body: JSON.stringify({
      runtime: "Node.js 20 (Alpine)",
      access: "Private (Only Me)",
      code: `import { PDFDocument } from 'pdf-lib';\n\nasync function redactPII(pdfBuffer) {\n  console.log("Locally redacting PII from uploaded PDF...");\n  // regex scanning of pages and black-box canvas overlaps\n  return redactedPdf;\n}`,
      status: "Paused",
      compute_time: "0.0s",
      active_users: 0,
      detail: "Locally redacts PII from uploaded PDFs using lightweight regex."
    }),
    createdAt: new Date("2026-08-28T09:15:00Z").toISOString()
  }
];

// Helper to read memory from file
function readMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      writeMemory(DEFAULTS);
      return DEFAULTS;
    }
    const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading memory file, returning default schema:", err);
    return DEFAULTS;
  }
}

// Helper to write memory to file
function writeMemory(data) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing memory file:", err);
  }
}

// --- API ENDPOINTS ---

// GET /api/memory
app.get('/api/memory', (req, res) => {
  const memory = readMemory();
  res.json({ success: true, count: memory.length, data: memory });
});

// POST /api/memory
app.post('/api/memory', (req, res) => {
  try {
    const { title, body } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields 'title' and 'body'. Payload must be JSON: {title, body}" 
      });
    }

    const memory = readMemory();
    
    // Check if item with this app name (title) already exists to allow update/overwrite
    const existingIndex = memory.findIndex(item => item.title.toLowerCase() === title.toLowerCase());
    
    const newItem = {
      id: existingIndex !== -1 ? memory[existingIndex].id : "pico_" + Date.now().toString(36),
      title: title.trim(),
      body: typeof body === 'string' ? body : JSON.stringify(body),
      createdAt: existingIndex !== -1 ? memory[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      // Overwrite existing app definition
      memory[existingIndex] = newItem;
    } else {
      // Push new
      memory.unshift(newItem);
    }
    
    writeMemory(memory);
    
    res.status(201).json({
      success: true,
      message: "Durable memory saved successfully.",
      data: newItem
    });
  } catch (err) {
    console.error("Error processing POST /api/memory:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/memory/:id (for robust management capability)
app.delete('/api/memory/:id', (req, res) => {
  try {
    const { id } = req.params;
    let memory = readMemory();
    const beforeLength = memory.length;
    memory = memory.filter(item => item.id !== id);
    
    if (memory.length === beforeLength) {
      return res.status(404).json({ success: false, error: "Memory item not found" });
    }
    
    writeMemory(memory);
    res.json({ success: true, message: "Memory slot removed successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve public index.html for any remaining routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pico Workbench Server running live on http://localhost:${PORT}`);
});
