import { spawn } from 'child_process';
import http from 'http';

// Configuration for smoke test port
const TEST_PORT = 3001;
process.env.PORT = TEST_PORT.toString();
// Ensure No Gemini key during testing to force fast consistent local heuristic testing
process.env.GEMINI_API_KEY = ""; 

console.log("🚀 Starting Ample Smoke Test server on port:", TEST_PORT);

// Fire up Node Express server in background
const serverProcess = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: TEST_PORT },
  stdio: 'inherit'
});

// Give the port a second to bind
await new Promise(resolve => setTimeout(resolve, 1500));

// Core client fetch helper
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', err => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  let passed = true;
  console.log("\n🧪 Running verification suite...");

  try {
    // TEST 1 — Verify GET /api/memory reads seeded presets
    console.log("-----------------------------------------");
    console.log("🔹 Test 1: Fetching initial memory list (GET /api/memory)...");
    const getRes = await request('GET', '/api/memory');
    console.log(`Response Code: ${getRes.statusCode}`);
    if (getRes.statusCode === 200 && Array.isArray(getRes.body)) {
      console.log(`✅ Success! Seed items found: ${getRes.body.length} records.`);
      console.log(`   First item: "${getRes.body[0].plateTitle}" (Score: ${getRes.body[0].satietyScore})`);
    } else {
      console.error("❌ Failed: Expecting seed array.");
      passed = false;
    }

    // TEST 2 — Verify POST /api/memory builds custom Satiety Plate
    console.log("-----------------------------------------");
    console.log("🔹 Test 2: Creating a custom Satiety Plate (POST /api/memory)...");
    const customMealPayload = {
      craving: "warm home-cooked lasagna",
      hungerLevel: "Extremely hungry (need high volume)",
      primaryGoal: "Warm & comforting",
      user: {
        name: "Test Founder",
        email: "founder@ample.foo",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
      }
    };

    const postRes = await request('POST', '/api/memory', customMealPayload);
    console.log(`Response Code: ${postRes.statusCode}`);
    let createdId = null;
    
    if (postRes.statusCode === 201 && postRes.body?.success) {
      const rec = postRes.body.record;
      createdId = rec.id;
      console.log(`✅ Success! Plate built and persisted into durable memory.`);
      console.log(`   Generated Title: "${rec.plateTitle}"`);
      console.log(`   Generated Detail: "${rec.plateDetail}"`);
      console.log(`   Assigned ID: ${createdId}`);
      console.log(`   Assigned Satiety Score: ${rec.satietyScore}`);
    } else {
      console.error("❌ Failed to create plate.");
      passed = false;
    }

    // TEST 3 — Verify updated ledger listings
    console.log("-----------------------------------------");
    console.log("🔹 Test 3: Checking if new record is inside GET list...");
    const checkRes = await request('GET', '/api/memory');
    const records = checkRes.body;
    const found = records.find(r => r.id === createdId);
    if (found) {
      console.log(`✅ Success! New plate verified inside DB.`);
    } else {
      console.error("❌ Failed: New record not returned from kitchen database GET query.");
      passed = false;
    }

    // TEST 4 — Verify DELETE /api/memory/:id removes record
    if (createdId) {
      console.log("-----------------------------------------");
      console.log(`🔹 Test 4: Removing test plate (DELETE /api/memory/${createdId})...`);
      const delRes = await request('DELETE', `/api/memory/${createdId}`);
      console.log(`Response Code: ${delRes.statusCode}`);
      if (delRes.statusCode === 200 && delRes.body?.success) {
        console.log(`✅ Success! Test plate cleanly cleaned from durable memory file.`);
      } else {
        console.error("❌ Failed to remove plate.");
        passed = false;
      }
    }

    console.log("-----------------------------------------");
    if (passed) {
      console.log("\n🎉 ALL SMOKE TESTS COMPLETED SUCCESSFULLY! Ample is ready for deployment. 🔥");
      cleanupAndExit(0);
    } else {
      console.error("\n💔 Some smoke tests failed. Review test execution logs.");
      cleanupAndExit(1);
    }

  } catch (err) {
    console.error("\n💥 Error during smoke test running:", err);
    cleanupAndExit(1);
  }
}

function cleanupAndExit(code) {
  console.log("Stopping smoke test server process...");
  serverProcess.kill('SIGTERM');
  setTimeout(() => {
    process.exit(code);
  }, 500);
}

runTests();
