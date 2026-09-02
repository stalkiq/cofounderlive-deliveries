import { spawn } from 'child_process';
import http from 'http';

const PORT = 3000;
const URL_MEMORY = `http://localhost:${PORT}/api/memory`;

console.log("======================================================================");
console.log("🚀 STARTING AUTOMATED SMOKE-TEST: SUPERCHARGED CONTROL PANEL          ");
console.log("======================================================================");

// Launch the Express server in a background process
const serverProcess = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: PORT },
  stdio: 'inherit'
});

// Safeguard helper to ensure server is killed on exit
const cleanUp = () => {
  console.log("Stopping background control panel server...");
  serverProcess.kill('SIGTERM');
};

process.on('exit', cleanUp);
process.on('SIGINT', cleanUp);
process.on('SIGTERM', cleanUp);

// Poll server until it responds to GET /api/memory
const waitForServer = async (retries = 15, delay = 400) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(URL_MEMORY);
      if (res.ok) {
        console.log("✅ Control Panel Server online and listening!");
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error("❌ Server failed to respond within target boot duration.");
};

async function runTest() {
  try {
    await waitForServer();

    // Step 1: Test GET initial store value
    console.log("\n-> Step 1: Testing initial GET /api/memory...");
    let getResponse = await fetch(URL_MEMORY);
    let getData = await getResponse.json();
    
    if (!getData.success || !Array.isArray(getData.vehicles)) {
      throw new Error("Initial GET endpoint format is invalid.");
    }
    const initialCount = getData.count;
    console.log(`✅ Base registry contains ${initialCount} predefined vehicles.`);

    // Step 2: Test POST to onboard new custom vehicle
    console.log("\n-> Step 2: Testing POST /api/memory (Secure Handshake)...");
    const testVehicle = {
      vehicle: "1994 Porsche 911 (964) Turbo S Leichtbau",
      vin: "WP0ZZZ96ZRS400512",
      useCase: "Restomod Collector",
      hardwareId: "APEX-OBD-SMOKE94",
      nextSession: "2026-11-20"
    };

    const postResponse = await fetch(URL_MEMORY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testVehicle)
    });

    if (postResponse.status !== 201) {
      throw new Error(`Expected POST status 201, got ${postResponse.status}`);
    }

    const postData = await postResponse.json();
    if (!postData.success || postData.entry.vin !== testVehicle.vin) {
      throw new Error("Onboard vehicle body assertion mismatch.");
    }
    console.log(`✅ Onboard verified successfully: Assigned Token ID [${postData.tokenID}]`);

    // Step 3: Test GET registry to affirm persistent storage write
    console.log("\n-> Step 3: Verifying durable memory index updates...");
    getResponse = await fetch(URL_MEMORY);
    getData = await getResponse.json();

    if (getData.count !== initialCount + 1) {
      throw new Error(`Registry count mismatch. Expected ${initialCount + 1}, got ${getData.count}`);
    }

    const savedVehicle = getData.vehicles.find(v => v.vin === testVehicle.vin);
    if (!savedVehicle || savedVehicle.hardwareId !== testVehicle.hardwareId) {
      throw new Error("Persistent vehicle verification lookup failed in db storage.");
    }
    console.log(`✅ Custom vehicle successfully indexed locally inside memory database!`);

    console.log("\n======================================================================");
    console.log("🎉 SMOKE SHOKE-TEST SUCCESSFUL! All system nodes calibrated.         ");
    console.log("======================================================================");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ SMOKE TEST FAILURE DETECTED:");
    console.error(error.message);
    process.exit(1);
  }
}

// Fire tests
runTest();
