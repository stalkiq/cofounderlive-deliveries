import express from 'express';
import { spawn } from 'child_process';
import http from 'http';

// Automatically test endpoint capabilities natively
console.log("=================================================");
console.log("🌌 GANTRY SMOKE-TEST SUITE: INTEGRITY SUITE");
console.log("=================================================");

const TEST_PORT = 3111;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Dynamically start Gantry server for testing context
let serverProcess;

function startTestServer() {
  return new Promise((resolve, reject) => {
    // Import server.js programmatically to execute it inside this test process or run spawn node server.js
    console.log("[TEST-SETUP] Initializing Gantry Application Server on port:", TEST_PORT);
    
    serverProcess = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: TEST_PORT },
      stdio: 'pipe'
    });

    let stdoutData = '';
    serverProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      if (stdoutData.includes('🚀 GANTRY EXECUTION ENGINE READY')) {
        console.log("[TEST-SETUP] Gantry Application Server confirmed ready!");
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error("[SERVER-ERR]", data.toString());
    });

    serverProcess.on('error', (err) => {
      reject(err);
    });

    // Timeout safety
    setTimeout(() => {
      reject(new Error("Gantry server startup timed out in smoke-test."));
    }, 5000);
  });
}

async function runTests() {
  let failed = false;

  try {
    // 1. GET /api/memory Check
    console.log("\n⚡ [TEST-01] GET /api/memory (Durable state retrieval)...");
    const getMemRes = await fetch(`${BASE_URL}/api/memory`);
    const valGetMem = await getMemRes.json();
    
    if (valGetMem.success && Array.isArray(valGetMem.data.runs) && valGetMem.data.runs.length > 0) {
      console.log("✅ [SUCCESS] GET /api/memory verified. Fetched", valGetMem.data.runs.length, "seeding logs.");
    } else {
      throw new Error("Durable memory seed state structure returned invalid schema.");
    }

    // 2. POST /api/memory Check (Add dynamic log run)
    console.log("\n⚡ [TEST-02] POST /api/memory (Durable state insertion)...");
    const mockPostPayload = {
      type: "run",
      payload: {
        title: "RUN-TEST // Inbound API Handshake",
        detail: "Smoke test event logged successfully to verify persistence integrity loops.",
        status: "[ OK ]",
        meta: "Node 99",
        value: "45ms"
      }
    };
    
    const postMemRes = await fetch(`${BASE_URL}/api/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockPostPayload)
    });
    const valPostMem = await postMemRes.json();
    
    if (valPostMem.success && valPostMem.data.id && valPostMem.data.title.includes("RUN-TEST")) {
      console.log("✅ [SUCCESS] POST /api/memory verified. Appended Log ID:", valPostMem.data.id);
    } else {
      throw new Error(`State insertion declined payload validation. Response: ${JSON.stringify(valPostMem)}`);
    }

    // 3. POST /api/compile Check (Gantry Compiler pipeline)
    console.log("\n⚡ [TEST-03] POST /api/compile (Deterministic blueprint compiler fallback/AI)...");
    const mockCompilePayload = {
      description: "When an invoice is scanned inside Airtable, verify values against SQL database and trigger Slack channel outputs.",
      trigger: "Custom Webhook (JSON Payload)",
      target: "Slack Operations Channel (Alert)",
      recovery: "Self-Healing (Auto-retry with exponential backoff)"
    };

    const compileRes = await fetch(`${BASE_URL}/api/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockCompilePayload)
    });
    const valCompile = await compileRes.json();

    if (valCompile.success && valCompile.schema && valCompile.schema.steps.length === 3) {
      console.log("✅ [SUCCESS] POST /api/compile verified. Compiled by:", valCompile.compiledBy);
      console.log("   --> Synthetic Step 1 (Trigger):", valCompile.schema.steps[0].node, "-", valCompile.schema.steps[0].detail);
      console.log("   --> Synthetic Step 2 (Action):", valCompile.schema.steps[1].node, "-", valCompile.schema.steps[1].detail);
      console.log("   --> Synthetic Step 3 (Target) :", valCompile.schema.steps[2].node, "-", valCompile.schema.steps[2].detail);
    } else {
      throw new Error(`Compiler execution rejected payload compilation. Result: ${JSON.stringify(valCompile)}`);
    }

    // 4. POST /api/run Check (Simulated pipeline state-machine metrics)
    console.log("\n⚡ [TEST-04] POST /api/run (Dry run simulator loop updates)...");
    const runRes = await fetch(`${BASE_URL}/api/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schema: valCompile.schema,
        payload: { test_value: "99120" }
      })
    });
    const valRun = await runRes.json();

    if (valRun.success && valRun.performance && valRun.logDetails) {
      console.log("✅ [SUCCESS] POST /api/run verified. Simulation runtime executed in:", valRun.performance.latency);
      console.log("   --> Performance recovery metrics state:", valRun.performance.status);
    } else {
      throw new Error(`Dry run routing system collapsed. Result: ${JSON.stringify(valRun)}`);
    }

    // 5. POST /api/auth/google Check (Developer fallback SSO session verification)
    console.log("\n⚡ [TEST-05] POST /api/auth/google (Identity gateway check)...");
    const authRes = await fetch(`${BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mock: true,
        profile: {
          name: "Theo Gantry",
          email: "theo.ceo@gantry.io",
          role: "Operations Director"
        }
      })
    });
    const valAuth = await authRes.json();

    if (valAuth.success && valAuth.user.authenticated && valAuth.user.email === "theo.ceo@gantry.io") {
      console.log("✅ [SUCCESS] POST /api/auth/google verified. Profile created for:", valAuth.user.name);
    } else {
      throw new Error(`Sign in verification gateway rejected credential check. Result: ${JSON.stringify(valAuth)}`);
    }

  } catch (error) {
    console.error("\n❌ [FAIL] Smoke Testing suite encountered exception parameter errors!");
    console.error(error.message);
    failed = true;
  } finally {
    // Shutdown server programmatically
    if (serverProcess) {
      console.log("\n[TEST-TEARDOWN] Killing Gantry active server thread on port", TEST_PORT);
      serverProcess.kill();
    }
  }

  if (failed) {
    console.log("\n=================================================");
    console.log("❌ GANTRY INTEGRITY VERIFICATION: FAILED");
    console.log("=================================================");
    process.exit(1);
  } else {
    console.log("\n=================================================");
    console.log("🎉 GANTRY INTEGRITY VERIFICATION: ALL PASSED (100%)");
    console.log("=================================================");
    process.exit(0);
  }
}

// Start testing sequence
startTestServer()
  .then(runTests)
  .catch((err) => {
    console.error("Test server initialized with extreme fatal faults:", err);
    process.exit(1);
  });
