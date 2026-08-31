import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const TEST_PORT = 9091;

console.log('========================================================');
console.log('🏁 STARTING SMOKE TEST FOR PACE ENGINE BACKEND & FRONTEND');
console.log('========================================================');

// Spawn server process on test port
const serverProc = spawn('node', ['server.js'], {
  cwd: projectRoot,
  env: { ...process.env, PORT: TEST_PORT }
});

let serverStdout = '';
serverProc.stdout.on('data', (data) => {
  serverStdout += data.toString();
  console.log(`[Server Stdout]: ${data.toString().trim()}`);
});

serverProc.stderr.on('data', (data) => {
  console.error(`[Server Stderr]: ${data.toString().trim()}`);
});

// Give server time to bind and run
await new Promise((resolve) => setTimeout(resolve, 2000));

let testFailed = false;

try {
  // Test 1: Verify Static Page serving
  console.log('🔍 Test 1: Checking static file delivery...');
  const resStatic = await fetch(`http://localhost:${TEST_PORT}/`);
  if (!resStatic.ok) throw new Error(`HTTP status failed: ${resStatic.status}`);
  const htmlContent = await resStatic.text();
  if (!htmlContent.includes('<title>Pace')) {
    throw new Error('Static UI is missing the specific header/title tags for app brand name.');
  }
  console.log('✅ Test 1 Passed: Server delivers landing pages correctly.');

  // Test 2: GET api/memory
  console.log('🔍 Test 2: Checking GET /api/memory endpoint...');
  const resGetMem = await fetch(`http://localhost:${TEST_PORT}/api/memory`);
  if (!resGetMem.ok) throw new Error(`GET API status: ${resGetMem.status}`);
  const memoryObj = await resGetMem.json();
  if (!memoryObj.success || !memoryObj.data) {
    throw new Error('GET memory did not return data correctly.');
  }
  console.log('✅ Test 2 Passed: GET /api/memory retrieval is online and fully valid.');

  // Test 3: POST api/memory (Save calibration)
  console.log('🔍 Test 3: Checking POST /api/memory (Calibration saving)...');
  const calibrationPayload = {
    googleAccount: 'smoke-engineer@test-environment.com',
    primaryGoal: 'Build Lean Muscle',
    nudgeFrequency: 'Active (Every transition period)'
  };
  const resPostCal = await fetch(`http://localhost:${TEST_PORT}/api/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'calibration',
      payload: calibrationPayload
    })
  });
  if (!resPostCal.ok) throw new Error(`POST calibration failed: ${resPostCal.status}`);
  const postCalRes = await resPostCal.json();
  if (!postCalRes.success || postCalRes.fullSettings.googleAccount !== 'smoke-engineer@test-environment.com') {
    throw new Error('Verification failed in post response configuration.');
  }
  console.log('✅ Test 3 Passed: Persistent configuration edits successfully registered.');

  // Test 4: POST /api/memory (Save experimental weight log)
  console.log('🔍 Test 4: Logging test experimental weight metric...');
  const weightPayload = {
    date: '2026-08-31',
    weight: 194.1
  };
  const resPostWeight = await fetch(`http://localhost:${TEST_PORT}/api/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'weightLog',
      payload: weightPayload
    })
  });
  const postWeightRes = await resPostWeight.json();
  if (!postWeightRes.success) {
    throw new Error('Logging weight stats failed.');
  }
  console.log('✅ Test 4 Passed: Weight tracker correctly writes serialization logs.');

  // Test 5: Verify persistent persistence (Re-fetch memory)
  console.log('🔍 Test 5: Validating persistence in database logs...');
  const resVerifyGet = await fetch(`http://localhost:${TEST_PORT}/api/memory`);
  const finalState = await resVerifyGet.json();
  const weightLogs = finalState.data.weightLogs || [];
  const foundWeight = weightLogs.some(log => log.weight === 194.1);
  if (!foundWeight) {
    throw new Error('Durable persistence failure: freshly posted weight record was not recovered in the subsequent read action!');
  }
  console.log('✅ Test 5 Passed: Record persisted durably across API channels.');

  // Test 6: Verify calendar mock dynamic nudges
  console.log('🔍 Test 6: Testing conditional /api/calendar-mock calculations due to nudge density modifications...');
  const resCalMock = await fetch(`http://localhost:${TEST_PORT}/api/calendar-mock`);
  const calMockData = await resCalMock.json();
  if (!calMockData.success || !calMockData.calendar || !calMockData.nudges) {
    throw new Error('Mock algorithm failed to deliver calendar structures.');
  }
  console.log(`✅ Test 6 Passed: Dynamic habit calendar is ready with ${calMockData.nudges.length} scheduled transition breaks.`);

} catch (err) {
  console.error('❌ SMOKE TEST ENCOUNTERED FAILURES:');
  console.error(err);
  testFailed = true;
} finally {
  console.log('🔌 Shutting down smoke test server subprocess...');
  serverProc.kill();
  
  if (testFailed) {
    console.log('========================================================');
    console.log('❌ SMOKE TEST STATUS: FAILED');
    console.log('========================================================');
    process.exit(1);
  } else {
    console.log('========================================================');
    console.log('🎉 SMOKE TEST STATUS: ALL CHECKS PASSED');
    console.log('========================================================');
    process.exit(0);
  }
}
