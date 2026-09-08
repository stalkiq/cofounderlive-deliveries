import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Setup directories and JSON Database
const DATA_DIR = path.join(__dirname, 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial realistic data for the Kinward Care Portal
const INITIAL_MEMORY = {
  configurations: [
    {
      id: "conf_initial",
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 36 hours ago
      deviceName: "Mom's Living Room Camera",
      filterLevel: "Ambient Heatmap (Medium Privacy - Color Blobs Only)",
      monitoringWindow: "24 Hours (Continuous)",
      trigger: "Only on unusual deviations from routine"
    },
    {
      id: "conf_latest",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      deviceName: "Mom's Kitchen Camera",
      filterLevel: "Frosted Glass (High Privacy - Silhouette Only)",
      monitoringWindow: "Daytime Only (7:00 AM - 9:00 PM)",
      trigger: "On every major movement transition"
    }
  ],
  telemetryEvents: [
    {
      id: "event_1",
      timestamp: "08:45 AM",
      sensor: "Living Room Motion",
      detail: "Gentle movement detected near the armchair. [Style: Ambient Heatmap - Soft Green]",
      status: "Resting",
      value: "Active (Heatmap)",
      category: "livingroom"
    },
    {
      id: "event_2",
      timestamp: "10:30 AM",
      sensor: "Front Door Motion",
      detail: "Mail delivery detected. Mom did not open the inner door. [Style: Frosted Glass Silhouette]",
      status: "Secure",
      value: "Verified (Frosted)",
      category: "frontdoor"
    },
    {
      id: "event_3",
      timestamp: "12:14 PM",
      sensor: "Kitchen Motion",
      detail: "Mom is up and active near the dining table. [Style: Ambient Heatmap - Warm Amber]",
      status: "Reassuring",
      value: "Active (Heatmap)",
      category: "kitchen"
    }
  ],
  aiSummaries: [
    {
      id: "summary_1",
      timestamp: new Date().toISOString(),
      summaryText: "Mom's morning is off to a peaceful and steady start. She was awake and resting in her favorite living room armchair by 8:45 AM. Around 10:30 AM, a brief front-door detection was recorded (matching the routine mail run), and she remained safely inside. Most recently, at 12:14 PM, we observed warm kitchen level warmth, indicating she is moving about and preparing her lunch as normal. Dignity remains completely respected—no video or sound was recorded."
    }
  ],
  onboarding: {
    caregiverName: "Sarah",
    parentName: "Eleanor (Mom)",
    completed: true
  }
};

// Help load memory
function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(INITIAL_MEMORY, null, 2), 'utf-8');
      return INITIAL_MEMORY;
    }
    const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading memory file, using in-memory model or resetting:", err);
    return INITIAL_MEMORY;
  }
}

// Help save memory
function saveMemory(data) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Error writing to memory file:", err);
    return false;
  }
}

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoints

// 1. GET /api/memory -> Retrieves all database records
app.get('/api/memory', (req, res) => {
  const data = loadMemory();
  res.json(data);
});

// 2. POST /api/memory -> Durably writes configurations or custom events
app.post('/api/memory', (req, res) => {
  const data = loadMemory();
  const { type, payload } = req.body;

  if (!type || !payload) {
    return res.status(400).json({ error: "Invalid format. Expected JSON: { type: 'string', payload: { ... } }" });
  }

  switch (type) {
    case 'configuration':
      const newConfig = {
        id: `conf_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...payload
      };
      data.configurations.unshift(newConfig); // Newest first
      break;

    case 'event':
      const newEvent = {
        id: `event_${Date.now()}`,
        ...payload
      };
      data.telemetryEvents.push(newEvent);
      break;

    case 'summary':
      const newSummary = {
        id: `summary_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...payload
      };
      data.aiSummaries.unshift(newSummary);
      break;

    case 'onboarding':
      data.onboarding = {
        ...data.onboarding,
        ...payload,
        completed: true
      };
      break;

    default:
      return res.status(400).json({ error: "Unknown payload type. Supported: 'configuration', 'event', 'summary', 'onboarding'" });
  }

  const success = saveMemory(data);
  if (success) {
    res.status(201).json({ message: "Memory registered successfully", data });
  } else {
    res.status(500).json({ error: "Failed to persist memory securely." });
  }
});

// 3. POST /api/ai-analyze -> Custom endpoint for Ambient Pattern Analyzer (Simulated Gemini)
app.post('/api/ai-analyze', (req, res) => {
  const data = loadMemory();
  const events = data.telemetryEvents;
  
  // Custom prompt construction mirroring instructions
  const assistantRole = "You are Kinward's reassuring AI Care Assistant. Your job is to analyze raw Ring motion/doorbell logs and translate them into warm, privacy-respecting, natural-language updates for a caregiver. Emphasize safety, routine, and dignity. Never describe raw video details; focus entirely on activity patterns and reassurance.";
  
  // High fidelity summary builder representing "Gemini AI" Ambient Pattern Analyzer
  let generatedSummary = "";
  const recentEvents = [...events].reverse().slice(0, 5); // Latest events
  
  if (recentEvents.length === 0) {
    generatedSummary = "No raw telemetry observations have been logged today. Your parent's privacy filter is active, and their home is fully secured.";
  } else {
    const parent = data.onboarding?.parentName || "Mom";
    const eventsStr = recentEvents.map(e => `- [${e.timestamp}] Room: ${e.sensor}, State: ${e.status}, Detail: "${e.detail}"`).join("\n");
    
    generatedSummary = `Based on the latest ${recentEvents.length} filtered Ring sensor readings, ${parent} is doing excellently, and her privacy remains strictly shielded. 

` + 
    `Our sensors captured movement in the following areas:\n${eventsStr}\n\n` + 
    `Every observation perfectly aligns with her regular daily routine. Her privacy is being kept 100% intact through our custom Frosted Glass filter—absolutely no video feeds or identifiable audio is leaving her local Ring router or cellular hub. Rest easy knowing she has been active and secure.`;
  }

  // Save the generated summary into the database to satisfy durability requirements
  const newSummary = {
    id: `summary_${Date.now()}`,
    timestamp: new Date().toISOString(),
    summaryText: generatedSummary
  };
  data.aiSummaries.unshift(newSummary);
  saveMemory(data);

  res.json({ success: true, summary: newSummary });
});

// Serve frontend app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Kinward running on port ${PORT}`);
});
