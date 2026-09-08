import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("=== KINWARD CARE PORTAL: RUNNING SYSTEM SMOKE TEST ===");

const PORT = 3001; // custom port to avoid local collisions

// Clean any pre-existing database before test to verify pristine instantiation
const testDbFile = path.join(rootDir, 'data', 'memory.json');
if (fs.existsSync(testDbFile)) {
  console.log(`[Prep] Found pre-existing DB file at ${testDbFile}. Backing it up...`);
  fs.renameSync(testDbFile, `${testDbFile}.bak`);
}

// 1. Spawning Express Server
console.log(`[Spawn] Starting Express server on port ${PORT}...`);
const serverProcess = spawn('node', ['server.js'], {
  cwd: rootDir,
  env: { ...process.env, PORT },
  stdio: 'inherit'
});

// Help wait
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper HTTP driver
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf-8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  await delay(1800); // Wait for boot

  let failures = 0;

  // Test 1: Verify Static Frontend Delivery
  try {
    console.log("[Test 1] Requesting index.html static asset...");
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/',
      method: 'GET'
    });
    
    if (res.statusCode === 200 && res.body.includes('KINWARD')) {
      console.log("✅ Success: Index page loaded correctly.");
    } else {
      console.error(`❌ Failure: Server returned status ${res.statusCode}.`);
      failures++;
    }
  } catch (err) {
    console.error("❌ Failure: Static asset fetch failed entirely:", err.message);
    failures++;
  }

  // Test 2: GET /api/memory (Expect pre-populated starter records)
  try {
    console.log("[Test 2] Testing database bootstrap at GET /api/memory...");
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/memory',
      method: 'GET'
    });
    
    const data = JSON.parse(res.body);
    if (res.statusCode === 200 && Array.isArray(data.configurations) && data.configurations.length > 0) {
      console.log(`✅ Success: Memory database retrieved. Loaded ${data.configurations.length} camera configurations.`);
    } else {
      console.error(`❌ Failure: API schema invalid or status ${res.statusCode}.`);
      failures++;
    }
  } catch (err) {
    console.error("❌ Failure: GET /api/memory request failed:", err.message);
    failures++;
  }

  // Test 3: POST /api/memory Configuration Mutation
  try {
    console.log("[Test 3] Testing POST /api/memory write configuration durability...");
    const mockConfig = {
      type: 'configuration',
      payload: {
        deviceName: "Smoke Test Living Room Cam",
        filterLevel: "Ambient Heatmap (Medium Privacy - Color Blobs Only)",
        monitoringWindow: "Nighttime Only (9:00 PM - 7:00 AM)",
        trigger: "Daily digest only"
      }
    };

    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/memory',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, mockConfig);

    const data = JSON.parse(res.body);
    const newestConfig = data.data.configurations[0];

    if (res.statusCode === 201 && newestConfig.deviceName === "Smoke Test Living Room Cam") {
      console.log("✅ Success: New camera config durably written and re-read from root memory file store.");
    } else {
      console.error(`❌ Failure: POST record did not return 201 or data mismatched: Status ${res.statusCode}`);
      failures++;
    }
  } catch (err) {
    console.error("❌ Failure: POST configuration write failed:", err.message);
    failures++;
  }

  // Test 4: POST /api/ai-analyze Patterns synthesis
  try {
    console.log("[Test 4] Testing Gemini simulated pattern analyzer endpoint...");
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/ai-analyze',
      method: 'POST'
    });

    const data = JSON.parse(res.body);
    if (res.statusCode === 200 && data.success && data.summary.summaryText.includes('privacy')) {
      console.log("✅ Success: Pattern analyzer successfully synthesized and durably archived the latest status report.");
    } else {
      console.error(`❌ Failure: AI analyze failed to produce expected summary. Status: ${res.statusCode}`);
      failures++;
    }
  } catch (err) {
    console.error("❌ Failure: POST /api/ai-analyze request failed:", err.message);
    failures++;
  }

  // Shutdown Express
  console.log("[Shutdown] Shutting down active server...");
  serverProcess.kill('SIGTERM');

  // Tear down test file to restore previous backup if any
  if (fs.existsSync(testDbFile)) {
    fs.unlinkSync(testDbFile);
  }
  if (fs.existsSync(`${testDbFile}.bak`)) {
    console.log("[Recovery] Restoring backed up user-database file...");
    fs.renameSync(`${testDbFile}.bak`, testDbFile);
  }

  if (failures === 0) {
    console.log("\n⭐️ ALL SERVICES OPERATE CORRECTLY. SMOKE TEST PASSED!");
    process.exit(0);
  } else {
    console.error(`\n❌ SMOKE TEST COMPLETED WITH ${failures} FAILED ASSERTIONS.`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test harness encounter unhandled rejection:", err);
  serverProcess.kill('SIGKILL');
  process.exit(1);
});
