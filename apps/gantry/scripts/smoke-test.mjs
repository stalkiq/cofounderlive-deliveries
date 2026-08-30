import { spawn } from 'child_process';
import http from 'http';

console.log("==================================================");
console.log(" GANTRY SYSTEM v2.1 // STARTING SMOKE TESTS ");
console.log("==================================================");

// Start the Express server on port 5000 as a subprocess
const serverProcess = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: '5000' },
  stdio: 'inherit'
});

// Helper function to sleep/wait
const sleep = (ms) => new Promise((resolve) => setTimeout(ms, resolve));

// Perform request assertions
async function runTests() {
  let attempts = 0;
  let serverStarted = false;

  // Poll server status to check if port is scanning correctly
  while (attempts < 10) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:5000', (res) => {
          if (res.statusCode === 200) {
            serverStarted = true;
            resolve();
          } else {
            reject();
          }
        });
        req.on('error', reject);
        req.end();
      });
      if (serverStarted) break;
    } catch {
      attempts++;
      console.log(`> Server starting... Attempt ${attempts}/10`);
      await sleep(1000);
    }
  }

  if (!serverStarted) {
    console.error("❌ Failed to bind server within port limits.");
    serverProcess.kill('SIGTERM');
    process.exit(1);
  }

  console.log("✅ Server active on PORT 5000. Running API test suites...");

  try {
    // 1. Check GET /api/memory
    const getRes = await fetch('http://localhost:5000/api/memory');
    if (!getRes.ok) throw new Error(`GET /api/memory failed with status ${getRes.status}`);
    const memoryData = await getRes.json();
    
    console.log(`✅ GET /api/memory passed. Loaded ${memoryData.length} seed records.`);
    if (memoryData.length === 0) throw new Error("Expected seed values in DB but found none.");

    // 2. Check POST /api/memory
    const testPostPayload = {
      type: "dry_run",
      data: {
        triggerSource: "Custom Webhook (JSON Payload)",
        targetDestination: "PostgreSQL Database (Insert Record)",
        errorRecovery: "Self-Healing (Auto-retry with exponential backoff)",
        payload: '{"smoke_test": true}',
        status: "[ OK ]",
        latency: "140ms",
        logs: ["Smoke test log entry 1", "Smoke test log entry 2"]
      }
    };

    const postRes = await fetch('http://localhost:5000/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPostPayload)
    });

    if (!postRes.ok) throw new Error(`POST /api/memory failed with status ${postRes.status}`);
    const postedItem = await postRes.json();
    console.log("✅ POST /api/memory passed. Persistent record registered successfully:");
    console.log(`   - ID Check: ${postedItem.id}`);
    console.log(`   - Timestamp Check: ${postedItem.createdAt}`);

    // Verify GET contains our new logged item
    const verifyGetRes = await fetch('http://localhost:5000/api/memory');
    const updateMemoryData = await verifyGetRes.json();
    const found = updateMemoryData.find(item => item.id === postedItem.id);
    if (!found) {
      throw new Error(`Persistence failure: item ${postedItem.id} was not returned in subsequent list fetch.`);
    }
    console.log(`✅ Durable storage verified. Active state file synchronized.`);

    // 3. Check POST /api/compile
    const testCompilePayload = {
      prompt: "When Stripe payment fails, issue high alert inside Slack operations channel."
    };

    const compileRes = await fetch('http://localhost:5000/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCompilePayload)
    });

    if (!compileRes.ok) throw new Error(`POST /api/compile failed with status ${compileRes.status}`);
    const compiledItem = await compileRes.json();
    console.log("✅ POST /api/compile passed. Workflow compilation schema outputted:");
    console.log(`   - Schema Name: ${compiledItem.schema.data.name}`);
    console.log(`   - Discovered Nodes: ${compiledItem.schema.data.nodes.length}`);

    // All tests passed successfully
    console.log("==================================================");
    console.log(" ALL SMOKE TESTS COMPLETED SUCCESSFULLY // [ OK ] ");
    console.log("==================================================");
    serverProcess.kill('SIGTERM');
    process.exit(0);

  } catch (err) {
    console.error("❌ Smoke test sequence encountered failure error:");
    console.error(err);
    serverProcess.kill('SIGTERM');
    process.exit(1);
  }
}

runTests();
