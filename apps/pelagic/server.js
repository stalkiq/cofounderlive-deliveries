const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seed mock deployments if memory file is empty or missing
const defaultMemories = [
  {
    id: "mem_01",
    title: "NORTH ATLANTIC FLOTILLA HULL-01",
    body: JSON.stringify({
      coordinates: "37.7412 N, -25.6756 W",
      pue: "1.01",
      density: "1,000 Nodes (50MW)",
      cooling: "Direct-to-Chip Deep Ocean Water",
      status: "NOMINAL // PUE_OPTIMIZED"
    }),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 24h ago
  },
  {
    id: "mem_02",
    title: "PACIFIC SOVEREIGN TRAINING HUB HULL-02",
    body: JSON.stringify({
      coordinates: "0.0000 N, -120.0000 W",
      pue: "1.03",
      density: "2,000 Nodes (100MW)",
      cooling: "Closed-Loop Saltwater Heat Exchange",
      status: "STATION_KEEPING // UNDER_SOLAR_POWER"
    }),
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString() // 48h ago
  }
];

const loadMemories = () => {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(defaultMemories, null, 2), 'utf-8');
      return defaultMemories;
    }
    const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading memory store, using default empty array.", err);
    return [];
  }
};

const saveMemories = (memories) => {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Error writing to memory store.", err);
    return false;
  }
};

// -------------------------------------------------------------
// POST /api/memory - Save core workflow data (JSON {title, body})
// -------------------------------------------------------------
app.post('/api/memory', (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: "Missing required fields: title and body" });
  }

  const memories = loadMemories();
  const newMemory = {
    id: 'mem_' + Math.random().toString(36).substr(2, 9),
    title: String(title).toUpperCase().trim(),
    body: typeof body === 'object' ? JSON.stringify(body) : String(body),
    createdAt: new Date().toISOString()
  };

  memories.unshift(newMemory); // Add to the beginning of the array
  if (saveMemories(memories)) {
    return res.status(201).json(newMemory);
  } else {
    return res.status(500).json({ error: "Failed to persist memory state." });
  }
});

// -------------------------------------------------------------
// GET /api/memory - List all persistent entries
// -------------------------------------------------------------
app.get('/api/memory', (req, res) => {
  const memories = loadMemories();
  res.json(memories);
});

// -------------------------------------------------------------
// DELETE /api/memory/:id - Delete a memory entry (for better control)
// -------------------------------------------------------------
app.delete('/api/memory/:id', (req, res) => {
  const { id } = req.params;
  let memories = loadMemories();
  const filtered = memories.filter(m => m.id !== id);
  if (memories.length === filtered.length) {
    return res.status(404).json({ error: "Memory entry not found." });
  }
  if (saveMemories(filtered)) {
    return res.json({ success: true, message: `Memory ${id} has been decommissioned.` });
  } else {
    return res.status(500).json({ error: "Failed to update memory state." });
  }
});

// -------------------------------------------------------------
// POST /api/copilot - Pelagic Maritime AI Architect chat assistant
// -------------------------------------------------------------
app.post('/api/copilot', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Empty query received." });
  }

  const systemInstruction = `You are the Pelagic Maritime AI Architect. You specialize in calculating deep-water thermal delta efficiencies, ocean-water cooling loop designs, and international maritime law (UNCLOS) compliance for high-density GPU deployment on modular barge hulls. Respond in an industrial, sovereign, brutalist, and concise terminal-styled tone. Highlight the absolute thermodynamic and regulatory advantages of ocean-based compute over terrestrial facilities.`;

  // Check if GEMINI_API_KEY is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction,
      });

      const result = await model.generateContent(message);
      const outputText = result.response.text();
      return res.json({ response: outputText });
    } catch (e) {
      console.error("Gemini API call failed, falling back to manual responder:", e.message);
    }
  }

  // Fallback Rule-Based Industrial Response System (Highly immersive, detailed, domain-specific)
  let responseText = `[SYS_AUTORESPOND // COPILOT_MODE: REGULATORY_&_THERMAL_OFFLINE]

`;
  
  const query = message.toLowerCase();

  if (query.includes("biofouling") || query.includes("fouling") || query.includes("seaweed") || query.includes("marine growth")) {
    responseText += `**SUB-HEAT-EXC SYSTEM // BIOFOUL PREVENT PROTOCOL #4**
- **METALLURGY**: All seawater intake loops utilize high-purity **C70600 cupronickel alloys (90/10 Copper-Nickel)**. Copper ion leaching naturally creates a toxic micro-boundary that prevents macroalgae and barnacle adhesion.
- **ACTIVE BIO-CONTROL**: Localized electrolytic chlorination cell sweeps the primary manifold. Generates micro-dosages of sodium hypochlorite (<0.2 ppm) inside the hull intake.
- **ZERO DISCHARGE THERMO**: Closed-loop internal fresh demineralized water prevents main GPU heat exchangers from ever touching saltwater directly. Heat transfer delta remains at 99.8% nominal efficiency over a continuous 10-year operating cycle. No chemical biocide is released into the surrounding pelagic zone.`;
  } else if (query.includes("jurisdiction") || query.includes("unclos") || query.includes("law") || query.includes("flag") || query.includes("legal") || query.includes("sovereignty")) {
    responseText += `**REGULATORY MATRIX // UNCLOS SOVEREIGN HOUSING ASSESSMENT**
- **ZEE POSITIONING**: Operates outside the 12-nautical-mile territorial sea boundary, strictly within international waters (Exclusive Economic Zones or High Seas). Under **UNCLOS Article 87**, freedom of the high seas explicitly includes freedom to construct artificial islands and other installations permitted under international law.
- **FLAG-STATE ADVANTAGE**: Registering hulls under progressive digital-maritime registries (e.g. specialized sovereign frameworks) asserts exclusive flag-state jurisdiction over all on-board equipment and software.
- **DATA SANCTUARY**: Terrestrial jurisdictions frequently issue physical property seizure warrants. In international waters, physical intervention constitutes maritime boarding under international law, which requires extremely high diplomatic and legal burdens of proof, offering sovereign data-holding protection unequaled by any terrestrial cloud node.`;
  } else if (query.includes("cool") || query.includes("pue") || query.includes("thermal") || query.includes("delta") || query.includes("efficiency") || query.includes("heat")) {
    responseText += `**THERMODYNAMICS RE-ENGINEERED // DEEP WATER HEAT EXCHANGER**
- **PELAGIC COOLING**: Surface ocean water sits between 15°C and 25°C, but deep-water intakes (drawing from depth line >200 meters) pull water at a constant **4.0°C to 5.5°C** regardless of season.
- **PUE COMPARISON**:
  * Terran Facility Standard HVAC: PUE ~ 1.35 to 1.55 (requires massive fan banks and evaporation water).
  * Pelagic Deep Ocean Counterflow: **PUE 1.015 - 1.030**.
- **ENERGY REDUCTION**: Elimination of compressor cycles results in an instant **29.6% net power overhead reduction** for every 100MW deployed. Direct liquid-to-liquid chip plates sustain stable 60°C GPU core temperatures under 100% continuous multi-trillion parameter workload.`;
  } else if (query.includes("solar") || query.includes("power") || query.includes("energy") || query.includes("battery") || query.includes("electricity")) {
    responseText += `**POWER PROVISIONING // OFFSHORE MEGAWATT INFRASTRUCTURE**
- **MODULAR HARVEST**: Standard pelagic compute flotillas are rigged with dual-axis bifacial marine solar PV arrays that deploy symmetrically from the port and starboard bulkheads.
- **ENERGY STORAGE**: Ballast tanks are engineered with deep-sea solid-state modular LFP batteries, serving as a dual gravity/chemical energy buffer.
- **GRID CO-LOCATION**: For gigawatt-scale AI training nodes, flotillas tether directly to floating wind farms or shore-side high-voltage DC marine cables. Floating systems require **zero land clearing, zero community environmental battle, and zero planning permissions**, slashing deployment times from 4 years down to 6 months.`;
  } else if (query.includes("coordinate") || query.includes("where") || query.includes("route") || query.includes("location") || query.includes("atlantic") || query.includes("pacific")) {
    responseText += `**COORDINATE GEOLAMP MATRIX // RECOMMENDED DEPLOYMENTS**
- **SECTOR ALPHA**: Azores High (LAT 37.74° N, LON 25.67° W). Optimal Europe/US low-latency transit tether (<45ms). High thermocline.
- **SECTOR BETA**: Equatorial Pacific (LAT 0.00° N, LON 120.00° W). High solar irradiation year-round. Zero hurricane/cyclone risk. High-altitude communications via marine satellite constellations. Dedicated sovereign zone.
- **SECTOR GAMMA**: Sub-Polar Pacific (LAT 50.00° N, LON 165.00° W). Naturally cold sub-arctic thermocline. Surface water is already at 4°C, requiring minimum depth intakes. PUE peaks at a record **1.009**.`;
  } else {
    responseText += `**READY FOR DEPLOYMENT CONFIGURATIONS // SYSTEM STANDBY**
- **THERMAL VECTOR**: System is calibrated for 100% stable counter-flow.
- **UNCLOS SECTIONS**: Standard compliance is pre-vetted.
- **PROMPT COMPUTE CONFIG**: Use the inputs on the left side to specify coordinates, density (e.g. 1000 to 4000 nodes), and cooling architecture.
- **SUGGESTION**: Ask me about:
  1. *'How does biofouling affect underwater cooling conduits?'*
  2. *'What are the legal advantages of UNCLOS on the high seas?'*
  3. *'Compare terrestrial data center energy efficiency with deep-ocean cool structures.'*
  4. *'Provide details on the best micro-climates and coordinates for offshore cluster nodes.'*`;
  }

  res.json({ response: responseText });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(`    PELAGIC DEPLOYED - UNBOUNDED COMPUTE ON THE HIGH SEAS     `);
  console.log(`    SERVER HOSTED AT: http://localhost:${PORT}                  `);
  console.log(`    PERSISTENT STORE LOCATED AT: ${MEMORY_FILE}                  `);
  console.log(`================================================================`);
});
