const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MEMORY_FILE_PATH = path.join(__dirname, 'memory.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to load memory array
function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE_PATH)) {
      const rawData = fs.readFileSync(MEMORY_FILE_PATH, 'utf8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error('Error reading memory file, returning standard fallback:', error);
  }

  // Fallback initial core records representing existing deployments and specs
  const initialData = [
    {
      id: "1",
      title: "HULL-01 NORTH ATLANTIC CONFIGURATION",
      body: "Modular compute hull deployed at LAT 37.74° N, LON 25.67° W. Running 1,000 nodes (50MW) with Direct-to-Chip deep ocean-water cooling loop and titanium heat exchangers. PUE measured at 1.01.",
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
    },
    {
      id: "2",
      title: "HULL-02 EQUATORIAL PACIFIC SYSTEM LOCKED",
      body: "Deployment parameters synchronized: LAT 0.00° N, LON 120.00° W. Running 2,000 nodes (100MW) utilizing hybrid photovolatic-thermocline extraction loops. Flagged under UNCLOS Section 8 sovereign maritime hosting frameworks.",
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
    }
  ];

  try {
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write initial memory file:', e);
  }

  return initialData;
}

// Helper to save memory array
function saveMemory(memoryList) {
  try {
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(memoryList, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving memory to storage:', error);
    return false;
  }
}

// GET /api/memory - Retrieve saved memory records
app.get('/api/memory', (req, res) => {
  const currentLogs = loadMemory();
  res.json({
    status: 'success',
    count: currentLogs.length,
    data: currentLogs
  });
});

// POST /api/memory - Save a new memory record (Core Workflow validation: expects title and body)
app.post('/api/memory', (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed. Fields "title" and "body" are required.'
    });
  }

  const memoryList = loadMemory();
  const newRecord = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    title: String(title).toUpperCase().trim(),
    body: String(body).trim(),
    timestamp: new Date().toISOString()
  };

  memoryList.unshift(newRecord); // Prepend to show latest first
  const success = saveMemory(memoryList);

  if (!success) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to write record to the persistent layer.'
    });
  }

  res.status(201).json({
    status: 'success',
    message: 'Memory record successfully persisted.',
    data: newRecord
  });
});

// Mock/Interactive AI Copilot response generator (for Pelagic Maritime AI Architect experience)
app.post('/api/copilot', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      status: 'error',
      message: 'Message parameter is required.'
    });
  }

  const query = String(message).toLowerCase();
  let reply = "";
  let suggestedConfig = null;

  // Custom intelligent responses based on spec parameters
  if (query.includes('biofouling') || query.includes('saltwater') || query.includes('sea weed') || query.includes('marine growth')) {
    reply = "PELAGIC COPILOT RESPONSE:\n\nOur thermal loops utilize high-purity cupronickel (90-10 CuNi) alloys which natively resist marine colonization. Further, our design integrates localized electrolytic chlorination in the main sea-chests. We produce trace sodium hypochlorite from standard saltwater, neutralizing microscopic organic matter without releasing harmful heavy chemicals into the surrounding marine shelf.";
  } else if (query.includes('unclos') || query.includes('flag') || query.includes('jurisdiction') || query.includes('law') || query.includes('sovereign')) {
    reply = "PELAGIC COPILOT RESPONSE:\n\nTo preserve absolute digital jurisdiction, hulls operate outside national Exclusive Economic Zones (EEZ) under United Nations Convention on the Law of the Sea (UNCLOS) Article 87 (Freedom of the High Seas). Recommended registering states include registries offering digital security protections and decentralized IP licensing, effectively preventing physical asset search or seizure without international tribunal orders.";
  } else if (query.includes('pue') || query.includes('cooling') || query.includes('heat sink') || query.includes('efficiency') || query.includes('thermal')) {
    reply = "PELAGIC COPILOT RESPONSE:\n\nOcean depth temperature profiles offer a perpetual heat sink. At 250m depths, water is constant at 4.2°C. Direct ocean cooling guarantees a Power Usage Effectiveness (PUE) of 1.01 - 1.03, compared to land-based data center HVAC which operates at 1.45 PUE. This is an immediate energy footprint compression of ~30%, saving vast megawatts for purely computational workloads.";
  } else if (query.includes('where') || query.includes('coordinate') || query.includes('location') || query.includes('route')) {
    reply = "PELAGIC COPILOT RESPONSE:\n\nPrimary compute corridors are selected for: 1) Proximity to subsea telecom trunk cables for low latency (~45ms), 2) Ambient ocean-bottom currents, 3) Depths over 200m to secure deep thermocline layers. Optimal coordinate sectors include North Atlantic (37.74° N, 25.67° W) and Equatorial Pacific (0.00° N, 120.00° W).";
    suggestedConfig = {
      coordinates: "37.74° N, 25.67° W",
      density: "1,000 Nodes (50MW)",
      cooling: "Direct-to-Chip Deep Ocean Water"
    };
  } else {
    reply = `PELAGIC COPILOT RESPONSE:

Analyzing system logs and telemetry for command sequence: "${message}".
As the Pelagic Maritime AI Architect, I recommend deploying a standardized 50MW hull (1,000 high-density GPU units) to the North Atlantic. 

Would you like to initiate the deployment sequence using:
- Coordinates: LAT 37.7412 N, LON -25.6756 W
- Cooling architecture: Direct-to-Chip Deep Ocean Water
- Density scaling: 50MW Cluster?`;
    
    suggestedConfig = {
      coordinates: "37.7412 N, -25.6756 W",
      density: "1,000 Nodes (50MW)",
      cooling: "Direct-to-Chip Deep Ocean Water"
    };
  }

  res.json({
    status: 'success',
    reply,
    suggestedConfig
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`PELAGIC CONTROL PLATFORM ACTIVE`);
  console.log(`PORT: http://localhost:${PORT}`);
  console.log(`PERSISTENCE LAYER: ${MEMORY_FILE_PATH}`);
  console.log(`========================================`);
});
