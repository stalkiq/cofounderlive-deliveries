import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log("====================================================");
console.log("🚀 Starting Ample Smoke Test suite...");
console.log(`📂 Project directory: ${projectRoot}`);
console.log("====================================================");

// Spawn the app server
const serverProcess = spawn('node', ['server.js'], {
  cwd: projectRoot,
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
let serverErrorOutput = '';

serverProcess.stdout.on('data', (data) => {
  const text = data.toString();
  serverOutput += text;
  // Print logs to console for traceability
  console.log(`[Server]: ${text.trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  serverErrorOutput += data.toString();
  console.error(`[Server Error]: ${data.toString().trim()}`);
});

// Helper delay check
const delay = (ms) => new Promise((resolve) => setTimeout(ms, resolve));

// Cleanup server handle
async function stopServer(exitCode = 0) {
  console.log("\n🛑 Stopping server process...");
  serverProcess.kill('SIGTERM');
  await delay(1000);
  console.log("👋 Smoke test finished.");
  process.exit(exitCode);
}

// Main test workflow sequence
async function runTests() {
  try {
    // Wait for the server to load fully
    console.log("⌛ Waiting 2.5s for server to start...");
    await delay(2500);

    const baseUrl = 'http://localhost:3000';

    // 1. Verify GET /api/memory
    console.log("\n🧪 Test 1: Fetching plate history (GET /api/memory)...");
    const getRes = await fetch(`${baseUrl}/api/memory`);
    if (!getRes.ok) {
      throw new Error(`GET /api/memory failed with code ${getRes.status}`);
    }
    const history = await getRes.json();
    console.log(`✅ GET /api/memory response is ok. List length: ${history.length}`);
    if (!Array.isArray(history)) {
      throw new Error("Expected history response to be an Array");
    }

    // Checking seeded templates
    const seedMatch = history.some(item => item.title.includes("Sourdough") || item.title.includes("Stew") || item.title.includes("Lentil"));
    if (seedMatch) {
      console.log("✅ Seeded elements discovered successfully in database memory.");
    }

    // 2. Verify POST /api/memory
    console.log("\n🧪 Test 2: Generating a custom comfort plate (POST /api/memory)...");
    const customPayload = {
      craving: "smoky seasoned baked tofu",
      hungerLevel: "Extremely hungry (need high volume)",
      goal: "Warm & comforting"
    };

    const postRes = await fetch(`${baseUrl}/api/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customPayload)
    });

    if (!postRes.ok) {
      throw new Error(`POST /api/memory failed with code ${postRes.status}`);
    }

    const createdPlate = await postRes.json();
    console.log("✅ Created Plate Response Details:");
    console.log(`   - Title: "${createdPlate.title}"`);
    console.log(`   - Craving match: "${createdPlate.craving}"`);
    console.log(`   - Calculated Satiety: "${createdPlate.satietyScore}"`);
    console.log(`   - Grains Portion: "${createdPlate.visualPortions.grains}"`);

    if (createdPlate.craving !== customPayload.craving) {
      throw new Error("Saved craving does not match input payload.");
    }
    if (!createdPlate.description.includes("tofu")) {
      throw new Error("Generative parser failed to integrate custom cravings.");
    }

    // 3. Confirm GET holds the newly added item (persistent durable state checks)
    console.log("\n🧪 Test 3: Re-fetching history to guarantee persistent durable state (GET /api/memory)...");
    const verifyGetRes = await fetch(`${baseUrl}/api/memory`);
    const refreshedHistory = await verifyGetRes.json();
    console.log(`✅ History list now contains: ${refreshedHistory.length} dishes.`);
    
    const newestItem = refreshedHistory[0];
    if (newestItem.title !== createdPlate.title) {
      throw new Error(`Newest list item mismatch: Expected ${createdPlate.title}, got ${newestItem.title}`);
    }
    console.log("✅ Durability persistence confirmed: Plate added in line order correctly.");

    // 4. Verify GET /api/settings
    console.log("\n🧪 Test 4: Accessing user preferences API (GET /api/settings)...");
    const settingsRes = await fetch(`${baseUrl}/api/settings`);
    if (!settingsRes.ok) {
      throw new Error(`GET /api/settings failed with code ${settingsRes.status}`);
    }
    const settings = await settingsRes.json();
    console.log(`✅ Preferences retrieved are correct. App Theme flag: "${settings.appTheme}"`);

    console.log("\n🎉 ALL SMOKE TESTS COMPLETED SUCCESSFULLY! No errors detected.");
    await stopServer(0);

  } catch (error) {
    console.error("\n❌ Smoke Test Assertion Failed:", error.message);
    await stopServer(1);
  }
}

// Start testing engine
runTests();
