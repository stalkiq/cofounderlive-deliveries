import { spawn } from "child_process";
import http from "http";

const PORT = 3001; // Run smoke test separate from default port
console.log("====================================================");
console.log("AEGIR SYSTEM TEST ROUTINE: STARTING UP SMOKE PROCESS");
console.log("====================================================");

// Start the Express server as a subprocess
const serverProcess = spawn("node", ["server.js"], {
  env: { ...process.env, PORT: PORT },
  stdio: "inherit"
});

// Helper function to wait
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  // Give the server time to start up and bind to Port
  await delay(1500);

  try {
    console.log("\n[TEST 1] VERIFY GET /api/memory LOAD BASELINE...");
    const getRes = await makeRequest("GET", "/api/memory");
    const getData = JSON.parse(getRes.body);

    if (getRes.statusCode !== 200 || !getData.success) {
      throw new Error(`GET /api/memory request failed with status: ${getRes.statusCode}`);
    }
    
    if (!Array.isArray(getData.vessels) || getData.vessels.length < 4) {
      throw new Error("Baseline vessels list is incomplete or malformed.");
    }
    
    if (!Array.isArray(getData.history) || !getData.settings) {
      throw new Error("Audit log history or system presets container missing.");
    }

    console.log(`>> SUCCESS: Loaded ${getData.vessels.length} default vessels and ${getData.history.length} telemetry system records.`);

    console.log("\n[TEST 2] VERIFY POST /api/memory VESSEL CREATION DISPATCH...");
    const demoPayload = {
      designation: "AEGIR-TEST-BETA",
      corridor: "Pacific Basin Node Beta (Hawaii)",
      config: "512x B200 Next-Gen Cluster",
      targetDate: "2026-09-15"
    };

    const postRes = await makeRequest("POST", "/api/memory", demoPayload);
    const postData = JSON.parse(postRes.body);

    if (postRes.statusCode !== 201 || !postData.success) {
      throw new Error(`POST /api/memory failed with status ${postRes.statusCode}: ${postData.error || ""}`);
    }

    // Assert that the created vessel actually registered inside vessels array
    const testVesselFound = postData.vessels.find(v => v.title === "AEGIR-TEST-BETA");
    if (!testVesselFound) {
      throw new Error("Registered test vessel callsign not active inside state vessels array.");
    }

    // Assert history logs got appended
    const lastHistoryItem = postData.history[0];
    if (!lastHistoryItem.message.includes("AEGIR-TEST-BETA")) {
      throw new Error("New dispatch action did not append to audit telemetry log.");
    }

    console.log(">> SUCCESS: Registered new vessel 'AEGIR-TEST-BETA' and verified audit feed updates.");

    console.log("\n[TEST 3] VERIFY SETTINGS UPDATE BIND...");
    const settingsPayload = {
      action: "update_settings",
      settings: {
        emergencyScuttleDepth: 420,
        thermalWarningThreshold: 13.9,
        alertTarget: "HQ Test Subsector Room",
        autoCoolingBoost: false
      }
    };

    const settingsRes = await makeRequest("POST", "/api/memory", settingsPayload);
    const settingsData = JSON.parse(settingsRes.body);

    if (settingsRes.statusCode !== 200 || !settingsData.success) {
      throw new Error(`POST Settings update failed with status ${settingsRes.statusCode}`);
    }

    if (settingsData.settings.emergencyScuttleDepth !== 420 || settingsData.settings.thermalWarningThreshold !== 13.9) {
      throw new Error("Changes to Emergency Presets failed to save correctly into persistent configuration.");
    }

    console.log(">> SUCCESS: Saved custom emergency submerge thresholds and verified updates.");

    console.log("\n====================================================");
    console.log("AEGIR TELEMETRY SYSTEM SMOKE TESTS PASSED SUCCESSFULLY! All codes nominal.");
    console.log("====================================================");

    shutdown(0);
  } catch (err) {
    console.error("\n❌ SMOKE TEST ROUTINE THREW EXCEPTION:");
    console.error(err.message);
    shutdown(1);
  }
}

// Helper utility to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : "";
    const options = {
      hostname: "localhost",
      port: PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    if (body) {
      options.headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

function shutdown(exitCode) {
  console.log("Terminating server subprocess...");
  serverProcess.kill();
  process.exit(exitCode);
}

runTests();
