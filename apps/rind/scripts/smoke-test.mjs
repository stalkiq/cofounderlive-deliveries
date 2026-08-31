import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const PORT = 3500; // Use an alternate port for test sandbox to prevent conflicts
let serverProcess;

function log(msg) {
  console.log(`[SMOKE-TEST] ${msg}`);
}

function errorLog(msg) {
  console.error(`[SMOKE-TEST-ERROR] \x1b[31m${msg}\x1b[0m`);
}

// Main Runner
async function run() {
  log("Starting Rind Satiety Engine Smoke Tests...");

  // 1. Spawning Express Server
  serverProcess = spawn('node', ['server.js'], {
    cwd: rootDir,
    env: { ...process.env, PORT },
  });

  serverProcess.stdout.on('data', (data) => {
    // Pipe server stdout logs to debug console invisibly if needed
    const output = data.toString();
    if (output.includes('RIND METABOLIC SATIETY ENGINE initialized')) {
      log("Backend launched successfully!");
    }
  });

  serverProcess.stderr.on('data', (data) => {
    errorLog(`Server Stderr: ${data.toString()}`);
  });

  // Wait 1.5 seconds for complete Express setup
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const url = `http://localhost:${PORT}`;

  try {
    // 2. Querying Home Point (static client)
    log(`Pinging Home static client...`);
    const homeRes = await fetch(`${url}/`);
    if (homeRes.status !== 200) throw new Error(`Homepage returned status ${homeRes.status}`);
    log("✓ Homepage fetched successfully (200 OK).");

    // 3. Querying API Status endpoint
    log(`Pinging /api/status...`);
    const statusRes = await fetch(`${url}/api/status`);
    const statusResult = await statusRes.json();
    if (!statusResult.success || statusResult.status !== "healthy") {
      throw new Error(`Healthcheck endpoint is unhealthy: ${JSON.stringify(statusResult)}`);
    }
    log(`✓ API Status is healthy. Gemini connection state reported as: ${statusResult.env.geminiConnected}`);

    // 4. Testing POST /api/memory - Save mock assessment record
    log(`Pinging POST /api/memory (Submitting assessment)...`);
    const testPayload = {
      type: "assessment",
      payload: {
        satietySlider: "Level 1-3: Chronic Starvation State",
        dietaryPattern: "Standard Modern Diet (Processed-Heavy)",
        struggle: "Constant thoughts of food / food noise",
        fiberTarget: "Under 15g (Typical)",
        focusGroup: "Clean Lean Proteins"
      }
    };

    const saveRes = await fetch(`${url}/api/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    if (saveRes.status !== 201) {
      throw new Error(`POST /api/memory failed with status ${saveRes.status}`);
    }
    const saveResult = await saveRes.json();
    if (!saveResult.success || !saveResult.entry.id) {
       throw new Error(`Durable memory save missing ID: ${JSON.stringify(saveResult)}`);
    }
    const savedRecordId = saveResult.entry.id;
    log(`✓ POST /api/memory recorded profile successfully. Saved ID: ${savedRecordId}`);

    // 5. Testing GET /api/memory - Confirm database persistence & structural checks
    log(`Pinging GET /api/memory (Verifying persistence logic)...`);
    const memoryRes = await fetch(`${url}/api/memory`);
    const memoryResult = await memoryRes.json();
    if (!memoryResult.success || !memoryResult.data) {
       throw new Error("Failed to fetch state ledger properly.");
    }
    
    const matchedRecord = memoryResult.data.assessments.find(a => a.id === savedRecordId);
    if (!matchedRecord) {
      throw new Error(`Created assessment record ${savedRecordId} was not found inside persisted memory JSON!`);
    }
    log(`✓ GET /api/memory state persistence logic confirmed. Record ${savedRecordId} is persistent.`);

    // 6. Testing POST /api/satiety-plan - Core satiety calculator recommendation matching focus greens
    log("Pinging POST /api/satiety-plan (Requesting custom recipes)...");
    const aiPayload = {
      ingredients: "romanesco, mint, lemon, green pepper",
      focusGroup: "Cruciferous Vegetables & Greens",
      dietaryPattern: "Whole Food Plant-Based",
      struggle: "Inability to feel truly full",
      satietySlider: "42% Index Status"
    };

    const aiRes = await fetch(`${url}/api/satiety-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aiPayload)
    });

    if (aiRes.status !== 200) {
      throw new Error(`Recipe generator returned error status ${aiRes.status}`);
    }
    const aiResult = await aiRes.json();
    if (!aiResult.success || !aiResult.data.recipe.recipeName) {
      throw new Error(`Satiety recipe formatting issue: ${JSON.stringify(aiResult)}`);
    }
    log(`✓ POST /api/satiety-plan output: "${aiResult.data.recipe.recipeName}" with rating "${aiResult.data.recipe.satietyScore}"`);

    // Clean finish
    log("\x1b[32m======================================\x1b[0m");
    log("\x1b[32m ALL RIND METABOLIC ENGINE SMOKE TESTS PASSED \x1b[0m");
    log("\x1b[32m======================================\x1b[0m");
    shutdown(0);

  } catch (err) {
    errorLog("Smoke test failed!");
    errorLog(err.message);
    shutdown(1);
  }
}

function shutdown(exitCode) {
  if (serverProcess) {
    log("Tearing down testing Express instance...");
    serverProcess.kill('SIGINT');
  }
  setTimeout(() => {
    process.exit(exitCode);
  }, 500);
}

run();
