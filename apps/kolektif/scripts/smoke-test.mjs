import { spawn } from 'child_process';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

const TEST_PORT = 3555;
const host = `http://localhost:${TEST_PORT}`;

console.log('========================================================');
console.log('🏁 KOLEKTIF MVP AUTOMATED INTEGRATION SMOKE-TEST');
console.log('========================================================');

// Spin up server child process on isolated port
const serverProc = spawn('node', ['server.js'], {
  cwd: rootDir,
  env: { ...process.env, PORT: TEST_PORT }
});

process.on('exit', () => {
  serverProc.kill();
});

// Capture log outputs
serverProc.stdout.on('data', (data) => {
  const line = data.toString().trim();
  if (line) console.log(`[SERVER LOG] ${line}`);
});

serverProc.stderr.on('data', (data) => {
  console.error(`[SERVER ERROR] ${data.toString()}`);
});

// Helper sleep
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  // Give the server node process enough milliseconds to bind to port
  await delay(1500);

  console.log('\n📡 Test Phase 1: Checking client loading assets / index.html...');
  const indexRes = await fetch(`${host}/index.html`);
  assert.strictEqual(indexRes.status, 200, 'Frontend assets should serve 200 status');
  console.log('✅ PASS: Index asset loaded successfully!');

  console.log('\n📡 Test Phase 2: Querying original GET /api/memory...');
  const getRes1 = await fetch(`${host}/api/memory`);
  assert.strictEqual(getRes1.status, 200, 'api/memory should respond 200');
  const getBody1 = await getRes1.json();
  assert.strictEqual(getBody1.success, true, 'Result success should be true');
  assert.ok(Array.isArray(getBody1.data), 'Result must contain an array list');
  console.log(`✅ PASS: Core memory list found: Count: ${getBody1.count}`);

  console.log('\n📡 Test Phase 3: Posting new alert to POST /api/memory...');
  const newReport = {
    category: 'Sante / Medikal (Health / Medical)',
    location: 'Avenue Delmas 83, Delmas',
    description: 'First aid kit requested for local health post emergency committee.',
    contact: '+509 3788-9911'
  };

  const postRes = await fetch(`${host}/api/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newReport)
  });
  
  assert.strictEqual(postRes.status, 201, 'POST api/memory should return 201 on success');
  const postBody = await postRes.json();
  assert.strictEqual(postBody.success, true);
  assert.strictEqual(postBody.data.location, newReport.location);
  assert.strictEqual(postBody.data.category, newReport.category);
  console.log('✅ PASS: New alert record saved durably!');

  console.log('\n📡 Test Phase 4: Confirming persistence with second GET /api/memory...');
  const getRes2 = await fetch(`${host}/api/memory`);
  const getBody2 = await getRes2.json();
  // Ensure the list grew by 1
  assert.strictEqual(getBody2.count, getBody1.count + 1, 'Memory record should be saved into state list');
  assert.strictEqual(getBody2.data[0].location, newReport.location, 'First / newest item must be the submitted one');
  console.log('✅ PASS: New alert successfully persistent in backend list!');

  console.log('\n📡 Test Phase 5: Querying Gemini SMS translation & compressor simulation API...');
  const rawLongDraft = {
    text: "Urgent Attention: Clean drinking water has been successfully delivered and is available at Place Saint-Pierre. It has been organized by the local youth council committees and is completely free of charge. Pote bokit ou pou pran dlo."
  };

  const compRes = await fetch(`${host}/api/compress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rawLongDraft)
  });

  assert.strictEqual(compRes.status, 200, 'POST api/compress should return 200');
  const compBody = await compRes.json();
  assert.strictEqual(compBody.success, true);
  assert.ok(compBody.result.length <= 140, `Result character length (${compBody.result.length}) must be <= 140`);
  assert.ok(compBody.result.includes('ALÈT DLO'), 'Should correctly match keyword rules to compress high-impact text');
  console.log(`✅ PASS: Compressor success! Slashed draft down to: "${compBody.result}"`);
  console.log(`📊 Savings efficiency stats reported: ${compBody.saving}`);

  console.log('\n🚀 ALL INTEGRATION SMOKE TESTS PASSED PERFECTLY!');
  cleanExit(0);
}

function cleanExit(code) {
  console.log('\n🧹 Cleaning up test web server process...');
  serverProc.kill();
  process.exit(code);
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED DURABLY:');
  console.error(err);
  cleanExit(1);
});
