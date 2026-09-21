import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 3001; // Run test server on a separate port to avoid conflicts
let serverProcess = null;

console.log('=============== RHEA SANCTUARY SMOKE TEST ===============');

// Helper to make HTTP requests
const makeRequest = (method, urlPath, payload = null) => {
  return new Promise((resolve, reject) => {
    const dataString = payload ? JSON.stringify(payload) : '';
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: urlPath,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(responseBody)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (payload) {
      req.write(dataString);
    }
    req.end();
  });
};

const runSmokeTest = async () => {
  try {
    // 1. Fire up Express server in background
    console.log('📌 Starting Rhea test server...');
    serverProcess = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: PORT },
      stdio: 'pipe'
    });

    // Wait for server to boot up
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Test server startup timed out after 5.0 seconds.'));
      }, 5000);

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        // console.log(`[Server stdout]: ${output}`);
        if (output.includes('Rhea Sanctuary running')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error(`[Server stderr]: ${data.toString()}`);
      });
    });

    console.log('✅ Server started and listening!');

    // 2. Test GET /api/memory (Expect success response)
    console.log('\n📌 Diagnostic 1: Fetching initial backend memory state (GET /api/memory)...');
    const getRes1 = await makeRequest('GET', '/api/memory');
    if (getRes1.statusCode !== 200 || !getRes1.body.success) {
      throw new Error(`GET /api/memory failed with status ${getRes1.statusCode}`);
    }
    console.log(`✅ Success. Initial record inventory count: ${getRes1.body.count}`);

    // 3. Test POST /api/memory (Configuring Profile)
    console.log('\n📌 Diagnostic 2: Writing Onboarding settings profile (POST /api/memory)...');
    const profilePayload = {
      type: 'profile',
      nickname: 'Helena Test',
      lastPeriodDate: '2026-09-01',
      cycleLength: '30',
      goal: 'Hormonal Cycle Syncing'
    };
    const postRes1 = await makeRequest('POST', '/api/memory', profilePayload);
    if (postRes1.statusCode !== 200 || !postRes1.body.success || postRes1.body.data.id !== 'profile-settings') {
      throw new Error(`Profile setup writing failed: ${JSON.stringify(postRes1.body)}`);
    }
    console.log('✅ Success. Setup write validated! Saved Profile Nickname:', postRes1.body.data.nickname);

    // 4. Test POST /api/memory (Logging a Daily Ritual Rhythm)
    console.log('\n📌 Diagnostic 3: Saving a custom Daily Rhythm log (POST /api/memory)...');
    const rhythmPayload = {
      type: 'rhythm',
      physicalSensations: 'Grounded & Energetic',
      sensationIntensity: 'Resonant / Grounding',
      flowIntensity: 'None',
      basalBodyTemp: 97.82,
      emotionalLandscape: 'Dynamic & Focused',
      date: '2026-09-21'
    };
    const postRes2 = await makeRequest('POST', '/api/memory', rhythmPayload);
    if (postRes2.statusCode !== 211 && postRes2.statusCode !== 201 || !postRes2.body.success) {
      throw new Error(`Daily sync writing failed: ${JSON.stringify(postRes2.body)}`);
    }
    const newlyCreatedId = postRes2.body.data.id;
    console.log(`✅ Success. Log created with ID: ${newlyCreatedId}`);

    // 5. Test GET /api/memory verifying storage durabilities
    console.log('\n📌 Diagnostic 4: Re-querying state to verify durability...');
    const getRes2 = await makeRequest('GET', '/api/memory');
    const foundRhythm = getRes2.body.data.find(item => item.id === newlyCreatedId);
    if (!foundRhythm) {
      throw new Error(`Durable file memory verification failed! Created record ID ${newlyCreatedId} cannot be retrieved.`);
    }
    console.log(`✅ Success. New record accurately retrieved! Target BBT recorded: ${foundRhythm.basalBodyTemp}°F`);

    // 6. Test POST /api/ai (AI Guide Query)
    console.log('\n📌 Diagnostic 5: Querying Rhea Sanctuary AI companion (POST /api/ai)...');
    const aiPayload = {
      query: 'What herbal tea and warm nutrition supports peak Progesterone during Luteal Phase?',
      activePhase: 'Luteal Phase',
      cycleDay: 'Day 21'
    };
    const aiRes = await makeRequest('POST', '/api/ai', aiPayload);
    if (aiRes.statusCode !== 200 || !aiRes.body.success || !aiRes.body.response) {
      throw new Error(`AI Sanctuary endpoint failed: ${JSON.stringify(aiRes.body)}`);
    }
    console.log('✅ Success. Chat response generated!');
    console.log(`💬 AI response citation (${aiRes.body.source}):\n---`);
    console.log(aiRes.body.response.slice(0, 200) + '...\n---');

    // 7. Cleanup the rhythm log created via DELETE endpoint
    console.log('\n📌 Diagnostic 6: Housekeeping test record (DELETE /api/memory)...');
    const delRes = await makeRequest('DELETE', `/api/memory/${newlyCreatedId}`);
    if (delRes.statusCode !== 200 || !delRes.body.success) {
      throw new Error(`Failsafe deletion failed for ID: ${newlyCreatedId}`);
    }
    console.log('✅ Success. Test data gracefully purged.');

    console.log('\n======================================================');
    console.log('🎊 ALL SYSTEM SMOKE TESTS PASSED GLORIOUSLY! 🎊');
    console.log('======================================================\n');
    cleanupAndExit(0);

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE RUNNING RE-ENTRY:');
    console.error(err);
    cleanupAndExit(1);
  }
};

function cleanupAndExit(code) {
  if (serverProcess) {
    console.log('🔌 Killing test server backplane process...');
    serverProcess.kill('SIGINT');
  }
  process.exit(code);
}

runSmokeTest();
