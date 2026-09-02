import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Path to durable local memory JSON
const MEMORY_FILE_PATH = path.join(__dirname, 'data', 'memory.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial mock data to bootstrap high-fidelity automotive syndicate registry
const INITIAL_REGISTRY = [
  {
    id: "token-0964",
    vehicle: "1993 Porsche 964 Singer Restomod",
    vin: "WP0AA296PS450964",
    useCase: "Restomod Collector",
    hardwareId: "APEX-OBD-964SGR",
    nextSession: "2026-10-12",
    status: "Verified",
    meta: "420 HP // 2,425 lbs // 4.0L Flat-Six",
    registeredAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    isMock: true
  },
  {
    id: "token-4001",
    vehicle: "2021 Porsche GT3 RS",
    vin: "WP0AC2A8MS24001",
    useCase: "Track-Day Regular",
    hardwareId: "APEX-OBD-GT3RSP",
    nextSession: "2026-09-18",
    status: "Track Ready",
    meta: "1:32.45 @ Laguna Seca // 502 HP",
    registeredAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    isMock: true
  }
];

// Helper to read database
function readMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE_PATH)) {
      fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(INITIAL_REGISTRY, null, 2), 'utf-8');
      return INITIAL_REGISTRY;
    }
    const raw = fs.readFileSync(MEMORY_FILE_PATH, 'utf-8');
    if (!raw.trim()) {
      return INITIAL_REGISTRY;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading durable registry file, falling back to mock:", err);
    return INITIAL_REGISTRY;
  }
}

// Helper to write database
function writeMemory(data) {
  try {
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Error writing durable registry file:", err);
    return false;
  }
}

// GET /api/memory - Retrieve current syndicate garage registry and verification history
app.get('/api/memory', (req, res) => {
  const data = readMemory();
  res.json({
    success: true,
    count: data.length,
    vehicles: data
  });
});

// POST /api/memory - Submit new vehicle, generate digital token & handshake telemetry OBD-II
app.post('/api/memory', (req, res) => {
  const { vehicle, vin, useCase, hardwareId, nextSession } = req.body;

  if (!vehicle || !vin || !useCase || !hardwareId) {
    return res.status(400).json({
      success: false,
      error: "Missing required onboard credentials. Please supply vehicle name, chassis VIN, use case, and OBD hardware handshake ID."
    });
  }

  const currentRegistry = readMemory();

  // Generate cryptographically-themed dashboard registry token ID
  const hash = Math.floor(1000 + Math.random() * 9000);
  const tokenID = `token-${hash}`;

  const newEntry = {
    id: tokenID,
    vehicle,
    vin,
    useCase,
    hardwareId,
    nextSession: nextSession || "TBD",
    status: "Reviewing Handshake", // Cryptographic handshake sequence initialized
    meta: "OBD Sync Queued // Pending Verification",
    registeredAt: new Date().toISOString(),
    isMock: false
  };

  currentRegistry.push(newEntry);
  writeMemory(currentRegistry);

  res.status(201).json({
    success: true,
    message: "Verification protocol initialized. Your telemetry handshake queue token has been generated.",
    tokenID: tokenID,
    entry: newEntry
  });
});

// Optional utility endpoint to clear memory/reset to factory defaults (useful for testing/demoing)
app.post('/api/memory/reset', (req, res) => {
  writeMemory(INITIAL_REGISTRY);
  res.json({
    success: true,
    message: "Syndicate Registry reset to system default standards.",
    vehicles: INITIAL_REGISTRY
  });
});

// Optional utility endpoint to verify all pending handshake vehicles in persistent storage
app.post('/api/memory/approve', (req, res) => {
  const currentRegistry = readMemory();
  let updatedCount = 0;
  
  const updatedRegistry = currentRegistry.map(veh => {
    if (veh.status === 'Reviewing Handshake') {
      veh.status = 'Verified';
      veh.meta = 'OBD-II hardware handshake sequence complete. Encryption token verified.';
      updatedCount++;
    }
    return veh;
  });

  if (updatedCount > 0) {
    writeMemory(updatedRegistry);
  }

  res.json({
    success: true,
    message: `Verification sequence finalized. Approved ${updatedCount} pending vehicle handshakes.`,
    count: updatedCount,
    vehicles: updatedRegistry
  });
});


// Start listening safely
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡  SUPERCHARGED SOCIETY CONTROL PANEL ONLINE          ⚡`);
  console.log(`⚡  PORT: ${PORT}                                       ⚡`);
  console.log(`⚡  SYSTEM TIME: ${new Date().toISOString()}          ⚡`);
  console.log(`=======================================================`);
});
