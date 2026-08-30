import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parsing and CORS
app.use(express.json());
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// Define the durable memory storage path
const DATA_DIR = path.join(__dirname, "data");
const MEMORY_FILE = path.join(DATA_DIR, "memory.json");

// Default initial state matching product-spec.json requirements
const DEFAULT_STATE = {
  vessels: [
    {
      title: "AEGIR-01",
      name: "AEGIR-01 (Atlantic Alpha)",
      detail: "1024x H100 Cluster",
      status: "Active",
      load: "94% Load",
      pue: "1.01",
      temp: "11.2°C",
      coordinates: "38.7223° N, 27.2219° W",
      corridor: "North Atlantic Corridor Alpha (Azores)"
    },
    {
      title: "AEGIR-02",
      name: "AEGIR-02 (Atlantic Beta)",
      detail: "512x H100 Cluster",
      status: "Active",
      load: "78% Load",
      pue: "1.02",
      temp: "12.1°C",
      coordinates: "37.4512° N, 25.9102° W",
      corridor: "North Atlantic Corridor Alpha (Azores)"
    },
    {
      title: "AEGIR-03",
      name: "AEGIR-03",
      detail: "512x B200 Cluster",
      status: "Provisioning",
      load: "0% Load",
      pue: "N/A",
      temp: "11.4°C",
      coordinates: "38.7223° N, 27.2219° W",
      corridor: "North Atlantic Corridor Alpha (Azores)"
    },
    {
      title: "AEGIR-04",
      name: "AEGIR-04",
      detail: "256x H100 Cluster",
      status: "Transit",
      load: "Offline",
      pue: "N/A",
      temp: "En Route",
      coordinates: "In Transit (En Route)",
      corridor: "North Atlantic Corridor Alpha (Azores)"
    }
  ],
  history: [
    {
      timestamp: "2026-08-30T10:15:00Z",
      type: "SYSTEM_BOOT",
      message: "AEGIR Telemetry system authorized. Quantum-lattice connection secured."
    },
    {
      timestamp: "2026-08-30T11:00:00Z",
      type: "TELEMETRY_SYNC",
      message: "Sync established with 4 active ocean-flotilla hubs near the Azores."
    },
    {
      timestamp: "2026-08-30T12:05:22Z",
      type: "COOLING_ALERT",
      message: "Atlantic Corridor water intake at 11.4°C. Deep-water thermodynamics operating at 100% capacity."
    }
  ],
  settings: {
    emergencyScuttleDepth: 180, // meters
    thermalWarningThreshold: 14.5, // celsius
    alertTarget: "Operations Command Terminal A",
    bathymetricSubdivision: "10m contours",
    autoCoolingBoost: true
  }
};

// Helper function to read persistent state
function readState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(MEMORY_FILE)) {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(DEFAULT_STATE, null, 2), "utf-8");
      return DEFAULT_STATE;
    }
    const rawData = fs.readFileSync(MEMORY_FILE, "utf-8");
    return JSON.parse(rawData);
  } catch (err) {
    console.error("Error reading memory file, using defaults:", err);
    return DEFAULT_STATE;
  }
}

// Helper function to write persistent state
function writeState(state) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(state, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error saving memory file:", err);
    return false;
  }
}

/**
 * @api {get} /api/memory Retrieve state containing vessel telemetry, dispatch logs, and settings
 */
app.get("/api/memory", (req, res) => {
  const state = readState();
  res.json({
    success: true,
    vessels: state.vessels,
    history: state.history,
    settings: state.settings || DEFAULT_STATE.settings
  });
});

/**
 * @api {post} /api/memory Store/Register a new modular compute vessel deployment workflow
 */
app.post("/api/memory", (req, res) => {
  const { designation, corridor, config, targetDate, action, settings } = req.body;
  const state = readState();

  // If the body is settings-focused configuration
  if (action === "update_settings" && settings) {
    state.settings = { ...state.settings, ...settings };
    state.history.unshift({
      timestamp: new Date().toISOString(),
      type: "SETTING_CHANGE",
      message: `System operational presets modified: Scuttle Depth: ${state.settings.emergencyScuttleDepth}m, Thermal Threshold: ${state.settings.thermalWarningThreshold}°C.`
    });
    
    writeState(state);
    return res.status(200).json({
      success: true,
      message: "Emergency presets and telemetry settings synchronized successfully.",
      settings: state.settings,
      history: state.history
    });
  }

  // If the action is a reset request
  if (action === "reset_memory") {
    writeState(DEFAULT_STATE);
    return res.status(200).json({
      success: true,
      message: "Abyssal Fleet telemetric records reset to factory baseline.",
      vessels: DEFAULT_STATE.vessels,
      history: DEFAULT_STATE.history,
      settings: DEFAULT_STATE.settings
    });
  }

  // Otherwise, fallback to the main vessel deployment workflow
  if (!designation) {
    return res.status(400).json({
      success: false,
      error: "Vessel Designation registration identifier is required."
    });
  }

  // Verify that the vessel designation doesn't already exist to keep state elegant
  const duplicate = state.vessels.some(
    (v) => v.title.toUpperCase() === designation.toUpperCase()
  );
  if (duplicate) {
    return res.status(400).json({
      success: false,
      error: `Vessel registration "${designation}" already allocated. Select a unique callsign.`
    });
  }

  // Map latitude/longitude offsets based on selected corridor for realistic telemetry
  let coordinates = "In Transit (En Route)";
  let temp = "11.4°C";
  if (corridor.includes("Azores")) {
    const latOffset = (Math.random() * 2 - 1).toFixed(4);
    const lonOffset = (Math.random() * 2 - 1).toFixed(4);
    coordinates = `${(38.7223 + parseFloat(latOffset)).toFixed(4)}° N, ${(27.2219 + parseFloat(lonOffset)).toFixed(4)}° W`;
    temp = `${(10.5 + Math.random() * 2).toFixed(1)}°C`;
  } else if (corridor.includes("Hawaii")) {
    coordinates = `${(19.4561 + Math.random() * 0.5).toFixed(4)}° N, ${(154.9125 - Math.random() * 0.5).toFixed(4)}° W`;
    temp = `${(13.2 + Math.random() * 1.5).toFixed(1)}°C`;
  } else if (corridor.includes("Mediterranean")) {
    coordinates = `${(34.12 + Math.random() * 0.8).toFixed(4)}° N, ${(20.45 + Math.random() * 0.8).toFixed(4)}° E`;
    temp = `${(14.8 + Math.random() * 1.2).toFixed(1)}°C`;
  }

  const cleanConfig = config || "256x H100 Liquid-Cooled Cluster";

  const newVessel = {
    title: designation,
    name: `${designation} (${corridor.split(" ")[0]} Node)`,
    detail: cleanConfig,
    status: "Provisioning",
    load: "0% Load",
    pue: "N/A",
    temp: temp,
    coordinates: coordinates,
    corridor: corridor,
    launchDate: targetDate || new Date().toISOString().split("T")[0]
  };

  // Add vessel to the top of list (preserving existing defaults below)
  state.vessels.unshift(newVessel);

  // Add system action log
  const newLog = {
    timestamp: new Date().toISOString(),
    type: "MARITIME_DISPATCH",
    message: `Vessel allocation [${designation}] authorized for corridor [${corridor}]. Configured with [${cleanConfig}]. Departure planned for [${newVessel.launchDate}].`
  };
  state.history.unshift(newLog);

  // Save the states durably
  const saved = writeState(state);
  if (!saved) {
    return res.status(500).json({
      success: false,
      error: "Internal failure. Abyssal data stores could not commit telemetry changes."
    });
  }

  res.status(201).json({
    success: true,
    message: "Abyssal compute node dispatch authorization acknowledged. Tow vessels deployed.",
    vessels: state.vessels,
    history: state.history
  });
});

// Fallback to index.html for single page app direct routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AEGIR Telemetry Control Server operating on port ${PORT}`);
  console.log(`Persistent registry: ${MEMORY_FILE}`);
});
