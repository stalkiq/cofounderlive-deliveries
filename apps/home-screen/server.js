const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path to data file
const DATA_DIR = path.join(__dirname, 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'submissions.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default submissions to seed durable memory
const defaultSubmissions = [
  {
    id: "aura-mock-1",
    title: "Project 'Aura'",
    body: "Proactive health agent using continuous voice context. Monitors dietary cues, stress indicators in speaking voice, and runs lightweight contextual loops directly on edge/local threads, syncing to medical reasoning graphs daily.\n\n[LOG: VOICE STREAM ACTIVE]\n[INFO: Detected 82bpm pulse anomaly during presentation]\n[DECISION: Auto-schedule downtime block in Calendar]",
    category: "Agentic Utility (Logistics, Money, Health)",
    metrics: {
      currentCost: "$1,850.00",
      projected2026: "$18.50",
      feasibility: "94.2%",
      timeline: "Mass Feasible: Q4 2026"
    },
    timestamp: "2026-08-29T12:00:00Z"
  },
  {
    id: "blink-mock-2",
    title: "Project 'Blink'",
    body: "Micro-transaction negotiator running on local edge models. Constantly parses household appliance diagnostics, auto-negotiates energy-saving dynamic rates with utility brokers in microsecond intervals, and bids on waste-recycle coupons.\n\n[LOOP: UTILITY AUCTION START]\n[SUBSCRIBE: Grid price peak predicted at 18:30]\n[SOLVED: Shutting down water heater for 25 mins, saved $0.18]",
    category: "Agentic Utility (Logistics, Money, Health)",
    metrics: {
      currentCost: "$420.00",
      projected2026: "$4.20",
      feasibility: "99.1%",
      timeline: "Mass Feasible: Q1 2026"
    },
    timestamp: "2026-08-29T14:30:00Z"
  },
  {
    id: "wealth-mock-3",
    title: "Agentic Wealth Manager",
    body: "Requires 1.2M tokens/day per user for continuous background reasoning and transactional analysis. Scans bank ledgers, tracks monthly recurring subscriptions, and negotiates bills downwards via simulated communication nodes.\n\n[RUNNING: Subscription scan...]\n[ALERT: Gym membership hike identified (+15%)]\n[OUTBOUND: Auto-submitted standard hardship request... SUCCESS, rebate applied]",
    category: "Agentic Utility (Logistics, Money, Health)",
    metrics: {
      currentCost: "$1,200.00",
      projected2026: "$12.00",
      feasibility: "98.4%",
      timeline: "Mass Feasible: Q2 2026"
    },
    timestamp: "2026-08-29T16:15:00Z"
  }
];

if (!fs.existsSync(MEMORY_FILE)) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(defaultSubmissions, null, 2), 'utf8');
}

// Memory Endpoint: GET - Retrieves submissions
app.get('/api/memory', (req, res) => {
  try {
    const data = fs.readFileSync(MEMORY_FILE, 'utf8');
    const parsed = JSON.parse(data);
    res.json(parsed);
  } catch (error) {
    console.error("Error reading submissions:", error);
    res.status(500).json({ error: "Failed to read memory data" });
  }
});

// Memory Endpoint: POST - Appends a submission
app.post('/api/memory', (req, res) => {
  try {
    const { title, body, category, metrics } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Missing required parameters: title and body" });
    }

    const data = fs.readFileSync(MEMORY_FILE, 'utf8');
    const submissions = JSON.parse(data);

    // Calculate simulated metrics for standard submits if not provided by step 1
    const finalMetrics = metrics || calculateProceduralMetrics(body || title);

    const newSubmission = {
      id: "pitch-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      title: title.trim(),
      body: body.trim(),
      category: category || "Agentic Utility (Logistics, Money, Health)",
      metrics: {
        currentCost: finalMetrics.currentCost,
        projected2026: finalMetrics.projected2026,
        feasibility: finalMetrics.feasibility,
        timeline: finalMetrics.timeline
      },
      timestamp: new Date().toISOString()
    };

    submissions.unshift(newSubmission);
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(submissions, null, 2), 'utf8');

    res.status(201).json({
      success: true,
      message: "Transmission received and written to durable backend ledger.",
      submission: newSubmission
    });
  } catch (error) {
    console.error("Error saving submission:", error);
    res.status(500).json({ error: "Failed to commit submission to memory" });
  }
});

// AI Simulation Endpoint
app.post('/api/simulate', async (req, res) => {
  const { description } = req.body;
  if (!description || description.trim().length === 0) {
    return res.status(400).json({ error: "Please enter your agentic concept to simulate." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    console.log("Using Gemini API to evaluate concept cost-deflation trajectory...");
    try {
      const gResult = await simulateWithGemini(description, apiKey);
      if (gResult) {
        return res.json(gResult);
      }
    } catch (e) {
      console.warn("Gemini API call failed, falling back to local simulation:", e.message);
    }
  }

  // Fallback procedural analyzer
  console.log("Using procedural local simulator...");
  const metrics = calculateProceduralMetrics(description);
  res.json({
    ...metrics,
    source: "Procedural Deflation Engine"
  });
});

// Procedural Trajectory Calculator based on user input analysis
function calculateProceduralMetrics(text) {
  const normalized = text.toLowerCase();
  
  let tokenMultiplier = 1.0;
  let categoryLabel = "Transactional";
  let explanation = "Reasoning-dense transactional parsing.";

  if (normalized.includes("video") || normalized.includes("camera") || normalized.includes("stream") || normalized.includes("vision")) {
    tokenMultiplier = 4.2;
    categoryLabel = "Multimodal Streaming Intelligence";
    explanation = "Involves processing real-time frame packets, requiring dense context window pipelines.";
  } else if (normalized.includes("voice") || normalized.includes("audio") || normalized.includes("listen") || normalized.includes("speak") || normalized.includes("talk")) {
    tokenMultiplier = 2.0;
    categoryLabel = "Ambient Acoustic Reasoning";
    explanation = "Involves constant micro-frame acoustic ingestion and prompt token streaming.";
  } else if (normalized.includes("wealth") || normalized.includes("money") || normalized.includes("finance") || normalized.includes("negotiat") || normalized.includes("bill")) {
    tokenMultiplier = 1.2;
    categoryLabel = "Autonomous Econometrics";
    explanation = "High-precision financial risk parsing, bill template matching, and agentic multi-node negotiation cycles.";
  } else if (normalized.includes("health") || normalized.includes("medical") || normalized.includes("biometric") || normalized.includes("heart")) {
    tokenMultiplier = 1.6;
    categoryLabel = "Biometric Context Engine";
    explanation = "Involves streaming biometrics parsing, comparing values to health databases continuously.";
  } else if (normalized.includes("game") || normalized.includes("social") || normalized.includes("network") || normalized.includes("npc")) {
    tokenMultiplier = 0.9;
    categoryLabel = "Social Simulation Network";
    explanation = "Involves moderate reasoning density for character avatars and state-machine transitions.";
  }

  const tokensPerDay = tokenMultiplier * 1000000; // millions of tokens/day
  
  // Formulas that match the deflation curve. 
  // Current (2024 equivalent token costs are around $1,000 per million in heavy context chains, dropping 10x / year)
  // Let's assume typical users generate ~30 days of usage.
  // Base cost calculation mapping perfectly.
  const rawCurrent = Math.round(tokensPerDay * 0.001 * 1000 * 100) / 100; // Let's make it look authentic
  const currentCostVal = Math.max(120, Math.min(2500, rawCurrent * 1.2));
  
  // Cost falls 10x a year. 2024 to 2026 is 2 years = 100x cost drop.
  const projectedCostVal = currentCostVal / 100;

  // Feasibility is the ability to run under $1/month per user
  // If projectedCostVal <= 1, it's 100% mass feasible today.
  // If > 1, feasibility scale is calculated logarithmically.
  let feasibilityPct = 99.9;
  let timeline = "Feasible immediately";

  if (projectedCostVal > 1.0) {
    feasibilityPct = 100 - (projectedCostVal * 0.8);
    feasibilityPct = Math.max(15.4, Math.min(99.1, feasibilityPct));
    feasibilityPct = Math.round(feasibilityPct * 10) / 10;
    
    // Path estimation
    if (projectedCostVal > 20) {
      timeline = "Mass Feasible: Q4 2027";
    } else if (projectedCostVal > 10) {
      timeline = "Mass Feasible: Q2 2027";
    } else if (projectedCostVal > 5) {
      timeline = "Mass Feasible: Q4 2026";
    } else {
      timeline = "Mass Feasible: Q2 2026";
    }
  }

  return {
    tokensPerDay: `${(tokensPerDay / 1000000).toFixed(1)}M`,
    category: categoryLabel,
    explanation: explanation,
    currentCost: `$${currentCostVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    projected2026: `$${projectedCostVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    feasibility: `${feasibilityPct}%`,
    timeline: timeline,
    path: "10x Deflation Path"
  };
}

// Calls active Gemini LLM context
function simulateWithGemini(description, apiKey) {
  return new Promise((resolve, reject) => {
    // Structure a concise JSON structured generation prompt
    const systemPrompt = `You are the Home Screen Venture Partner. You analyze consumer AI pitches, calculate their token-deflation timeline (assuming a 10x cost reduction year-over-year, which is 100x reduction by 2026), and determine if they can capture the next billion-user icon slot.
Your task is to analyze the user's agent concept and respond with EXACTLY a JSON structure matching this shape. Do not put markdown blocks like \`\`\`json, return only raw JSON content:
{
  "tokensPerDay": "Estimated tokens used per active user daily (e.g., '1.4M')",
  "category": "Consumer category classification (e.g. 'Proactive Health Integration')",
  "explanation": "One-sentence technical rationale of model reasoning intensity.",
  "currentCost": "Total current estimated API token cost for this user/month (e.g., '$1,400.00')",
  "projected2026": "Estimated cost by late 2026 assuming 100x deflation ($1,400 becomes $14.00) (e.g., '$14.00')",
  "feasibility": "Mass-market feasibility percentage, where 100% is <$1/user/mo (e.g., '96.2%')",
  "timeline": "Feasibility timeline estimate (e.g., 'Mass Feasible: Q3 2026' or 'Feasible Q1 2027')",
  "path": "Deflation Trajectory Type (e.g., '10x Deflation Path')"
}`;

    const requestBody = JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nAnalyze this consumer agent concept description: "${description}"`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          const rawText = parsed.candidates[0].content.parts[0].text;
          const resultJson = JSON.parse(rawText.trim());
          resolve(resultJson);
        } catch (e) {
          reject(new Error("Failed to parse Gemini response: " + e.message + ". Raw output: " + responseData));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(requestBody);
    req.end();
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong in the console interface API" });
});

app.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`📡 HOME SCREEN Hacker Portal v1.0.4 Online`);
  console.log(`📂 Base Workspace: ${__dirname}`);
  console.log(`💾 Durable memory locked in: ${MEMORY_FILE}`);
  console.log(`🔗 Interface running locally: http://localhost:${PORT}`);
  console.log(`=============================================================\n`);
});
