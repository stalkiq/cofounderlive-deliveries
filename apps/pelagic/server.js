const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');

// Ensure memory data file and directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(MEMORY_FILE)) {
  // Populate with some initial mock active/queued deployments to showcase the interface immediately
  const initialData = [
    {
      id: "mem_1",
      title: "HULL-01 NORTH ATLANTIC INITIATION",
      body: JSON.stringify({
        coordinates: "LAT 37.7412 N, LON 25.6756 W",
        density: "1,000 Nodes (50MW)",
        cooling: "Direct-to-Chip Deep Ocean Water",
        status: "ACTIVE_MONITORING",
        timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
      }),
      createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
    },
    {
      id: "mem_2",
      title: "HULL-02 EQUATORIAL PACIFIC PROVISIONING",
      body: JSON.stringify({
        coordinates: "LAT 0.0000 N, LON 120.0000 W",
        density: "2,000 Nodes (100MW)",
        cooling: "Closed-Loop Saltwater Heat Exchange",
        status: "PROVISIONING_SYNC",
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      }),
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    }
  ];
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers for reading/writing memory
function readMemory() {
  try {
    const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading memory file:', err);
    return [];
  }
}

function writeMemory(data) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing memory file:', err);
    return false;
  }
}

// --- API ENDPOINTS ---

// 1) GET /api/memory - Retrieve saved entries
app.get('/api/memory', (req, res) => {
  const memory = readMemory();
  res.json(memory);
});

// 2) POST /api/memory - Save core workflow deployment data
app.post('/api/memory', (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required fields.' });
  }

  const memory = readMemory();
  const newEntry = {
    id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    title,
    body,
    createdAt: new Date().toISOString()
  };

  memory.unshift(newEntry); // Prepend so newer items show up first
  if (writeMemory(memory)) {
    res.status(201).json(newEntry);
  } else {
    res.status(500).json({ error: 'Failed to write memory database.' });
  }
});

// 3) DELETE /api/memory/:id - Delete a saved entry (bonus utility for clean managing)
app.delete('/api/memory/:id', (req, res) => {
  const { id } = req.params;
  let memory = readMemory();
  const originalLength = memory.length;
  memory = memory.filter(entry => entry.id !== id);

  if (memory.length === originalLength) {
    return res.status(404).json({ error: 'Entry not found.' });
  }

  if (writeMemory(memory)) {
    res.json({ success: true, message: `Removed compute entry ${id}` });
  } else {
    res.status(500).json({ error: 'Failed to rewrite database.' });
  }
});

// 4) POST /api/copilot - Maritime Deployment Copilot Integration
app.post('/api/copilot', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message query is required for Copilot.' });
  }

  const systemInstruction = `You are the Pelagic Maritime AI Architect. You specialize in calculating deep-water thermal delta efficiencies, ocean-water cooling loop designs, and international maritime law (UNCLOS) compliance for high-density GPU deployment on modular barge hulls. Keep your tone industrial, sovereign, brutalist, highly technical, and concise. Always suggest specific lat/long coordinates in international waters, cooling types, and node layouts when helping users configure or plan deployments. Use terminal-style markdown formatting.`;

  // Check if GEMINI_API_KEY is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const { GoogleGenAI } = require('@google/generative-ai');
      const genAI = new GoogleGenAI({ apiKey });
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction,
      });

      const result = await model.generateContent(message);
      const responseText = result.response.text();
      return res.json({ response: responseText });
    } catch (err) {
      console.error('Gemini API execution failed, falling back to mock:', err);
      // Fall through to mock response on configuration/network failure
    }
  }

  // Smart Mock fallback matching Pelagic's brutalist/technical aesthetic
  let reply = '';
  const query = message.toLowerCase();

  if (query.includes('unclos') || query.includes('law') || query.includes('legal') || query.includes('sovereign')) {
    reply = `### [UNCLOS COMPLIANCE PROTOCOL // SEC_REV_4]
Deployments in international waters (High Seas) are governed under Part VII of the United Nations Convention on the Law of the Sea (UNCLOS). 

**Recommended Jurisdiction & Flag State Strategy:**
1. **Flag-State Registration**: Route hulls under jurisdictions with progressive digital assets framework and strong sovereign immunity maritime protections (e.g., Marshall Islands or Panama registration with an offshore Trust structure).
2. **EEZ Navigation**: Positioning outer boundaries must exceed 12-200 nautical miles from coastal baselines to transition fully out of standard territorial jurisdiction into the Exclusive Economic Zone / High Seas.
3. **Data Sovereignty Protection**: Implement cryptographically locked firmware modules with physical thermal self-destruct triggers to prevent hostile physical intercept under UNCLOS Article 97 (jurisdiction in case of collision/incident resides with flag state).

*SUGGESTED DEPLOYMENT VECTOR:*
- **Sector**: Atlantic Trench Basin 4 (LAT 23.4500 N, LON 34.1200 W)
- **UNCLOS Code**: HIGH_SEAS_SEC_A1`;
  } else if (query.includes('cooling') || query.includes('thermal') || query.includes('biofouling') || query.includes('saltwater') || query.includes('pue')) {
    reply = `### [THERMAL DELTA ANALYSIS // THERMAL_LOOP_V4]
Ocean-water has a baseline ambient temperature of 4.2°C at depths exceeding 600m. This creates an unparalleled thermal heat sink for high-density compute.

**Saltwater Biofouling Mitigation Protocol:**
1. **Cupronickel Alloy Cladding**: Intake manifolds are constructed of 90-10 copper-nickel alloy which physically denies barnacle/algae adhesion.
2. **Electrolytic Chlorination**: Localized, micro-dosed chlorine generation at intake filters breaks down organic proteins prior to piping entry. Zero persistent chemical discharge.
3. **PUE Multiplier**: Net Power Usage Effectiveness drops from 1.45 (industry standard land HVAC) to **1.02** with direct deep-sea heat exchange.

*SUGGESTED DEPLOYMENT VECTOR:*
- **Architecture**: Direct-to-Chip Deep Ocean Water
- **Calculated PUE**: 1.018 (30% HVAC energy reclamation)
- **Target Location**: Equatorial Pacific (LAT 0.0000 N, LON 120.0000 W) - Deep Thermocline layer.`;
  } else if (query.includes('density') || query.includes('gpu') || query.includes('nodes') || query.includes('power')) {
    reply = `### [COMPUTE DENSITY MATRIX // HIGH_DENSITY_PROV]
Modular barge hulls are engineered to accommodate high-density GPU racks utilizing custom blind-mate liquid cooling blocks.

**Structural & Power Configurations:**
- **50MW Standard Hull (1,000 Nodes)**: Designed for secondary LLM fine-tuning loops. Features 120 liquid-cooled racks. Recommended for mid-depth shelves.
- **100MW Extended Hull (2,000 Nodes)**: Optimized for foundation model training cycles. Synchronized via private marine-hardened fiber-optic tethers.
- **200MW Super-Flotilla (4,000 Nodes)**: Interconnected cluster operating with sub-millisecond inter-hull communication fabric.

*SUGGESTED DEPLOYMENT CONFIGURATION:*
- **Compute Density**: 2,000 Nodes (100MW)
- **Hardware Profile**: Custom liquid-cooled B200 Superchips with optical interconnects.
- **Cooling Mode**: Closed-Loop Saltwater Heat Exchange`;
  } else {
    reply = `### [PELAGIC DEPLOYMENT COPILOT ONLINE // SYS_READY]
Welcome, Sovereign Operator. 

I am your Oceanic AI Architect. Input query relating to:
- **UNCLOS Compliance** and flag-state sovereignty protocols.
- **Deep Ocean Thermal Delta** calculations & biofouling loops.
- **Flotilla Scale Provisioning** matrices (50MW to 200MW compute density configurations).

*RECOMMENDED CONFIGURATION SEEDED:*
"LAT 37.74 N, LON 25.67 W // 1,000 Nodes (50MW) // Direct-to-Chip Deep Ocean Water"

Feel free to ask a specific question like:
* "How does the saltwater thermal exchange loop prevent biofouling?"
* "What flag-state jurisdiction is recommended for sovereign data hosting?"
* "Recommend a high-density deployment configuration for LLM training."`;
  }

  // Simulate a realistic processing delay for terminal immersion
  setTimeout(() => {
    res.json({ response: reply });
  }, 400);
});

// Run server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🌊 PELAGIC Backend Active on port ${PORT}...`);
  console.log(`📊 Memory database operating in ${MEMORY_FILE}`);
  console.log(`🌐 System URL: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
