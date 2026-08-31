import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Durable file persistence config
const DATA_DIR = path.join(__dirname, 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');

// Ensure memory directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(MEMORY_FILE)) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify([], null, 2), 'utf8');
}

// Helper to read memory
function readMemory() {
  try {
    const data = fs.readFileSync(MEMORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading memory file:', err);
    return [];
  }
}

// Helper to write memory
function writeMemory(data) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing memory file:', err);
    return false;
  }
}

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

/**
 * GET /api/memory
 * Retrieves all saved community alerts / reports
 */
app.get('/api/memory', (req, res) => {
  const alerts = readMemory();
  res.json({ success: true, count: alerts.length, data: alerts });
});

/**
 * POST /api/memory
 * Appends a new alert / report with auto-generated metadata
 */
app.post('/api/memory', (req, res) => {
  const { category, location, description, contact } = req.body;

  // Validation
  if (!category || !location || !description) {
    return res.status(400).json({
      success: false,
      error: 'Fields category, location, and description are required.'
    });
  }

  const alerts = readMemory();

  // Construct structured alert
  const newAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    category,
    location,
    description,
    contact: contact || 'N/A',
    status: 'Verified', // Default status for reports ingested
    timestamp: new Date().toISOString(),
    syncSource: req.headers['user-agent'] ? 'Web/Mobile Client' : 'API Script'
  };

  alerts.unshift(newAlert); // Newest first

  if (writeMemory(alerts)) {
    return res.status(201).json({
      success: true,
      message: 'Alert saved durably to local storage successfully.',
      data: newAlert
    });
  } else {
    return res.status(500).json({
      success: false,
      error: 'Error writing alert to disk.'
    });
  }
});

/**
 * POST /api/compress
 * Simulates the Gemini Haitian Creole Translation & Compression Assistant.
 * Takes a raw, possibly long feedback/update script and converts it into a Creole text under 140 chars.
 */
app.post('/api/compress', (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Text input string is required for SMS compression.'
    });
  }

  // A highly realistic rule-based compression engines geared towards Emergency Creole broadcast simulation
  // Under the hood, this simulates translation of French/English phrases into high-visibility Creole SMS format.
  let comp = text.trim();

  // Sample Translations & Summaries map for demo instructions/realistic text inputs:
  const knownScenarios = [
    {
      keywords: ['water', 'distribution', 'st pierre', 'distribisyon dlo', 'pierre'],
      creole: 'ALÈT DLO: Distribisyon dlo pwòp bò plas Saint-Pierre 2PM jodi a. Pote bokit ou. Kontak komite jenn: +509-3453-2211.'
    },
    {
      keywords: ['road', 'blocked', 'delmas', 'debris', 'bloke'],
      creole: 'SITASYON DELMAS: Delmas 31 bloke ak dekonb. Pa pase la. Sèvi ak lòt wout. Sekirite OK aktyèlman.'
    },
    {
      keywords: ['clinic', 'health', 'sante', 'rue capois'],
      creole: 'SANT SANTE LOUVRI: Rue Capois ap resevwa ka ijans lejè soti 8AM - 4PM. Ekip medikal prezan. Kontak kout: #222.'
    },
    {
      keywords: ['food', 'distribution', 'manje', 'distribution de nourriture'],
      creole: 'MANJE: Distribisyon diri bò katedral la demen maten 7è. Fanmi ak timoun priyoritè. Viv djanm!'
    }
  ];

  // Try to find matching known scenario
  let creoleBase = "";
  const lowercaseInput = comp.toLowerCase();
  for (const scenario of knownScenarios) {
    if (scenario.keywords.some(kw => lowercaseInput.includes(kw))) {
      creoleBase = scenario.creole;
      break;
    }
  }

  // If no matching manual mock scenario, perform a rule-based compression translation simulation:
  if (!creoleBase) {
    // Basic translation patterns
    let translated = comp;
    
    // Simple mock translation mapper from FR/EN key terms -> HC
    const translations = [
      { rx: /water distribution/gi, repl: "Dist. dlo" },
      { rx: /distribisyon dlo/gi, repl: "Dist. dlo" },
      { rx: /health clinic/gi, repl: "Sant Sante" },
      { rx: /road blockage/gi, repl: "Wout Bloke" },
      { rx: /road blocked/gi, repl: "Wout Bloke" },
      { rx: /attention/gi, repl: "ALÈT" },
      { rx: /emergency/gi, repl: "ALÈT ENPÒTAN" },
      { rx: /warning/gi, repl: "ATANSYON" },
      { rx: /please help/gi, repl: "Bezwen Èd" },
      { rx: /located at/gi, repl: "bò" },
      { rx: /operating on/gi, repl: "ap ouvri" },
      { rx: /need water/gi, repl: "Manke Dlo" },
      { rx: /closed/gi, repl: "fèmen" },
      { rx: /open/gi, repl: "louvri" },
      { rx: /hospital/gi, repl: "lopital" }
    ];

    translations.forEach(({ rx, repl }) => {
      translated = translated.replace(rx, repl);
    });

    // Strip common filler words to enforce absolute ultra-light 2G compression
    translated = translated
      .replace(/\b(the|is|are|a|an|in|on|at|and|of|for|to|with)\b/gi, '')
      .replace(/\b(le|la|les|en|sur|dans|pour|avec|et)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit translation snippet size
    if (translated.length > 100) {
      translated = translated.substring(0, 100) + '...';
    }

    creoleBase = `KOLEKTIF ALÈT: ${translated} (Kontak lokal pou info)`;
  }

  // Ensure strict SMS < 140 char limit
  const finalCreoleSMS = creoleBase.substring(0, 140);

  res.json({
    success: true,
    originalLength: text.length,
    compressedLength: finalCreoleSMS.length,
    saving: `${Math.round((1 - (finalCreoleSMS.length / Math.max(text.length, 1))) * 100)}%`,
    result: finalCreoleSMS,
    timestamp: new Date().toISOString()
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🚀 KOLEKTIF SERVER RUNNING`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Durable memory JSON: ${MEMORY_FILE}`);
  console.log(`========================================`);
});
