// Gantry core operating script
let activeSchema = null;
let currentSelectedLogId = null;
let appState = {
  user: {
    authenticated: false,
    name: "Theodore Gantry",
    email: "ops.director@gantry.io",
    role: "Lead Ops Engineer",
  },
  runs: [],
  schemas: []
};

// Initialize Dashboard
window.addEventListener('DOMContentLoaded', () => {
  console.log("=== GANTRY INDUSTRIAL ENGINE INITIALIZING ===");
  loadDurableMemory();
  
  // Set default form input based on mock template
  applyPreset('refund');
});

// 1. Single Page Application navigation switchboard
function switchScreen(screenName) {
  // Hide all screens
  document.querySelectorAll('.screen-panel').forEach(panel => {
    panel.classList.add('hidden');
  });

  // Show target screen
  const targetPanel = document.getElementById(`screen-${screenName}`);
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
  }

  // Deactivate all sidebar links, activate current
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    const statusSpan = btn.querySelector('.btn-status');
    if (statusSpan) {
      statusSpan.textContent = '[ STANDBY ]';
    }
  });

  const activeBtn = document.getElementById(`btn-${screenName}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    const statusSpan = activeBtn.querySelector('.btn-status');
    if (statusSpan) {
      statusSpan.textContent = '[ ACTIVE ]';
    }
  }

  showToast(`TRANSITIONED SYSTEM INTERFACE TO STAGE_${screenName.toUpperCase()}`, "INFO");
}

// 2. Load Memory Configuration and logs from POST/GET /api/memory
async function loadDurableMemory() {
  try {
    const response = await fetch('/api/memory');
    const result = await response.json();
    
    if (result.success && result.data) {
      appState.runs = result.data.runs || [];
      appState.schemas = result.data.schemas || [];
      
      // Load active user session metrics
      if (result.data.user && result.data.user.authenticated) {
        appState.user = result.data.user;
        renderUserProfileHeader();
      }

      // Re-populate Table and compute operational figures
      renderExecutionLogsTable();
      computeTelemetryAggregates();
    }
  } catch (error) {
    console.error("Failed synchronizing durable operational memory.", error);
    showToast("CRITICAL: Durable Memory link handshake timed out.", "ERROR");
  }
}

// 3. Render Profile States
function renderUserProfileHeader() {
  const loginPrompt = document.querySelector('.unauthenticated-prompt');
  const userWidget = document.getElementById('user-profile-widget');
  const operatorBanner = document.getElementById('auth-banner-status');

  if (appState.user && appState.user.authenticated) {
    if (loginPrompt) loginPrompt.classList.add('hidden');
    if (userWidget) userWidget.classList.remove('hidden');

    document.getElementById('user-display-name').textContent = appState.user.name;
    document.getElementById('user-display-role').textContent = appState.user.role;
    document.getElementById('user-display-email').textContent = appState.user.email;
    
    // Fallback pixel avatar if picture absent
    const userImg = document.getElementById('user-profile-img');
    userImg.src = appState.user.picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(appState.user.email)}`;

    // Set form defaults
    document.getElementById('pref-email').value = appState.user.email;

    if (operatorBanner) {
      operatorBanner.innerHTML = `<span class="badge-tag success">[ IDENTITY SECURED ]</span> Operator authenticity established via cryptographic signature sync.`;
    }
  } else {
    if (loginPrompt) loginPrompt.classList.remove('hidden');
    if (userWidget) userWidget.classList.add('hidden');
    if (operatorBanner) {
      operatorBanner.innerHTML = `<span class="badge-tag danger">[ AUTHENTICATION REQUIRED ]</span> Initialize sandbox bypass or feed standard credentials to proceed.`;
    }
  }
}

// 4. Genuine Google Credentials authentication response handler
async function handleGoogleSignInResponse(response) {
  console.log("Captured ID Token credential callback from Google Auth Widget.", response);

  if (!response || !response.credential) {
    showToast("Invalid credentials callback token returned.", "ERROR");
    return;
  }

  showToast("Validating cryptographic Google Identity Token...", "INFO");

  try {
    const authRes = await fetch('/api/auth/google', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential })
    });

    const parsedData = await authRes.json();
    if (parsedData.success) {
      appState.user = parsedData.user;
      renderUserProfileHeader();
      
      // Persist profile context down to durable memory
      await fetch('/api/memory', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: 'user', payload: appState.user })
      });

      showToast(`WELCOME OPERATOR: ${appState.user.name.toUpperCase()}`, "SUCCESS");
      
      // Redirect user directly into the Schema Compiler panel to start working
      setTimeout(() => { switchScreen('compiler'); }, 600);
    } else {
      showToast(`Verification rejected: ${parsedData.error}`, "ERROR");
    }
  } catch (err) {
    console.error("JWT verification request errored", err);
    showToast("Identity verification gateway pipeline offline.", "ERROR");
  }
}

// 5. Developer Sandbox Authentication bypass
async function simulateDeveloperAuth() {
  const devName = document.getElementById('mock-username').value.trim() || "Theodore Gantry";
  const devEmail = document.getElementById('mock-email').value.trim() || "ops.manager@gantry.io";
  const devRoleSelect = document.getElementById('mock-role');
  const devRoleText = devRoleSelect.options[devRoleSelect.selectedIndex].text;

  const mockProfile = {
    name: devName,
    email: devEmail,
    role: devRoleText,
    picture: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(devEmail)}`
  };

  try {
    const result = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mock: true, profile: mockProfile })
    });
    
    const data = await result.json();
    if (data.success) {
      appState.user = data.user;
      renderUserProfileHeader();
      
      // Save identity into durable memory
      await fetch('/api/memory', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: 'user', payload: appState.user })
      });

      showToast(`DEVELOPER BYPASS LOGGED: ${appState.user.name.toUpperCase()}`, "SUCCESS");
      
      // Switch screen automatically
      setTimeout(() => { switchScreen('compiler'); }, 600);
    }
  } catch (e) {
    console.error(e);
    showToast("Failed setting developer sandbox context", "ERROR");
  }
}

// Save preferences
async function savePreferences(e) {
  e.preventDefault();
  
  const notifications = document.getElementById('pref-notifications').value;
  const metrics = {
    notifications: notifications
  };

  try {
    await fetch('/api/memory', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 'user', payload: metrics })
    });
    
    showToast("OPERATIONAL THRESHOLD PREFERENCES PERSISTED", "SUCCESS");
    loadDurableMemory();
  } catch (err) {
    showToast("Preferences memory persistence failed.", "ERROR");
  }
}

// Apply quick manual presets
function applyPreset(type) {
  const descArea = document.getElementById('compiler-description');
  const triggerOpt = document.getElementById('compiler-trigger');
  const targetOpt = document.getElementById('compiler-target');
  const recoveryOpt = document.getElementById('compiler-recovery');

  if (type === 'refund') {
    descArea.value = "When a financial refund is initiated inside Stripe, review Shopify logs to crosscheck the item returns, query Zendesk database records to doublecheck customer support messages, and record a duplicate reconciliation row in Airtable.";
    triggerOpt.value = "Stripe Billing (Charge Succeeded)";
    targetOpt.value = "Slack Operations Channel (Alert)";
    recoveryOpt.value = "Self-Healing (Auto-retry with exponential backoff)";
  } else if (type === 'invoice') {
    descArea.value = "Pull attached PDF receipts from inbound emails, run OCR processing, verify purchase totals against NetSuite invoice transactions ledger, and log disputes inside PostgreSQL databases whenever discrepancies emerge.";
    triggerOpt.value = "Custom Webhook (JSON Payload)";
    targetOpt.value = "NetSuite ERP (Create Invoice)";
    recoveryOpt.value = "Fallback Node (Route to secondary API endpoint)";
  } else if (type === 'customer') {
    descArea.value = "When a Salesforce Opportunity is won, verify customer licensing bounds, create a specialized Slack operations warning alert channel, and push contact metrics directly onto Shopify sales customer logs.";
    triggerOpt.value = "Salesforce CRM (New Opportunity Won)";
    targetOpt.value = "Shopify Admin (Update Inventory)";
    recoveryOpt.value = "Manual Intervention (Pause state and alert Ops Lead)";
  }
}

// 6. Gantry Schema Compiler Action
async function compilePipelineSchema() {
  const desc = document.getElementById('compiler-description').value.trim();
  const triggerVal = document.getElementById('compiler-trigger').value;
  const targetVal = document.getElementById('compiler-target').value;
  const recoveryVal = document.getElementById('compiler-recovery').value;

  if (!desc) {
    showToast("OPERATOR ERROR: Describe manual sequence details first.", "ERROR");
    return;
  }

  // Update compilation visual state
  const compileTag = document.getElementById('compilation-state-tag');
  compileTag.textContent = "COMPILATION IN PROGRESS...";
  compileTag.className = "compiler-badge building animate-blink";
  
  // Disable compilation button to prevent concurrency collision
  const compileBtn = document.getElementById('btn-compile-schema');
  compileBtn.disabled = true;
  compileBtn.textContent = "SYNTHESIZING STATE MODEL...";

  appendConsoleLine(`[SYS] Invoking Gantry core Schema compiler...`, "sys");

  try {
    const response = await fetch('/api/compile', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: desc,
        trigger: triggerVal,
        target: targetVal,
        recovery: recoveryVal
      })
    });

    const result = await response.json();
    if (result.success && result.schema) {
      activeSchema = result.schema;
      
      // Update compiler outputs
      compileTag.textContent = "COMPILER READY";
      compileTag.className = "compiler-badge ready";
      
      appendConsoleLine(`[SYS] Compilation succeeded via ${result.compiledBy || "Compiler Network"}.`, "ok");
      appendConsoleLine(`[MODEL-SYNTHESIS] Registered active schema blueprint of 3 sequence nodes.`, "run");
      
      // Update interactive HTML blueprint visual schema blocks
      updateInteractiveDiagram(activeSchema);

      // Save schema into durable memory via POST API
      await fetch('/api/memory', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: 'schema', payload: activeSchema })
      });

      // Enable dry runs immediately
      const runBtn = document.getElementById('btn-run-simulation');
      runBtn.disabled = false;
      runBtn.textContent = "INITIALIZE DRY-RUN CURRENT PIPELINE";
      runBtn.className = "terminal-btn btn-accent full-width";

      showToast("BLUEPRINT STATE MACHINE SCHEMA REGISTERED SAFELY", "SUCCESS");
      
      // Sync total history entries
      loadDurableMemory();

    } else {
      throw new Error(result.error || "Compiler refused input validation.");
    }
  } catch (error) {
    console.error("Compilation process hit fault parameters.", error);
    appendConsoleLine(`[COMPILE-FAULT] Synthesis failure: ${error.message}`, "err");
    compileTag.textContent = "COMPILER STALLED";
    compileTag.className = "compiler-badge";
    showToast("Compiler Stalled. Re-examine description metrics.", "ERROR");
  } finally {
    compileBtn.disabled = false;
    compileBtn.textContent = "COMPILE WORKFLOW SCHEMA & REGISTER →";
  }
}

// Update the CSS State Nodes visually based on compilation
function updateInteractiveDiagram(schema) {
  if (!schema || !schema.steps) return;

  const node1Title = document.getElementById('vis-node-01-title');
  const node2Title = document.getElementById('vis-node-02-title');
  const node3Title = document.getElementById('vis-node-03-title');

  node1Title.textContent = schema.steps[0]?.node || "Node 01";
  node2Title.textContent = schema.steps[1]?.node || "Node 02";
  node3Title.textContent = schema.steps[2]?.node || "Node 03";

  // Reset visual status indicator bounds
  document.querySelectorAll('.v-node').forEach(node => {
    node.className = "v-node active";
  });
  
  document.getElementById('vis-node-01-status').textContent = "[ ACTIVE ]";
  document.getElementById('vis-node-02-status').textContent = "[ STANDBY ]";
  document.getElementById('vis-node-03-status').textContent = "[ STANDBY ]";
}

// 7. Interactive Execution dry run sequence Simulation
async function executeDryRunSimulation() {
  if (!activeSchema) {
    showToast("ERROR: Register active compiled blueprint schema first.", "ERROR");
    return;
  }

  let payloadText = document.getElementById('simulation-payload-json').value;
  let payloadObject = {};
  try {
    payloadObject = JSON.parse(payloadText);
  } catch (e) {
    showToast("PAYLOAD EXCEPTION: Invalid raw JSON format.", "ERROR");
    return;
  }

  const runBtn = document.getElementById('btn-run-simulation');
  runBtn.disabled = true;
  runBtn.textContent = "DISPATCHING CONCURRENT CHANNELS...";

  appendConsoleLine(`[DISPATCH] Dry run sequence triggered. Triggering Pipeline...`, "sys");

  // Step 1: Trigger Node goes "PROCESSING"
  const node1 = document.getElementById('node-slot-1');
  const node1Status = document.getElementById('vis-node-01-status');
  node1.className = "v-node processing";
  node1Status.textContent = "[ RUNNING: Step 1 ]";

  await wait(700);
  node1.className = "v-node success";
  node1Status.textContent = "[ OK ]";
  appendConsoleLine(`[STEP-01] Trigger captured successfully: ${activeSchema.steps[0]?.detail}`, "ok");

  // Step 2: Core validation Action
  const node2 = document.getElementById('node-slot-2');
  const node2Status = document.getElementById('vis-node-02-status');
  node2.className = "v-node processing";
  node2Status.textContent = "[ RUNNING: Step 2 ]";

  await wait(900);

  // Check error recovery protocol logic
  const recoveryProtocol = activeSchema.recovery || "Self-Healing (Auto-retry with exponential backoff)";
  let isHealed = false;

  if (recoveryProtocol.includes("Self-Healing")) {
    node2.className = "v-node healed";
    node2Status.textContent = "[ HEALED ]";
    appendConsoleLine(`[WARN] Node 02 hit transient downstream timeout threshold!`, "warn");
    appendConsoleLine(`[HEAL-ENG] Initiating exponential backoff self-healing retry pipeline...`, "warn");
    await wait(800);
    appendConsoleLine(`[HEALED-02] Verification succeeded on 2nd attempts. Fault cleared.`, "ok");
    isHealed = true;
  } else if (recoveryProtocol.includes("Fallback Node")) {
    node2.className = "v-node healed";
    node2Status.textContent = "[ REDIRECTED ]";
    appendConsoleLine(`[WARN] Downstream SSL handshake failure. Detouring API to fallback host cluster...`, "warn");
    await wait(800);
    appendConsoleLine(`[ROUTE-OK] Secondary execution node active and confirmed safe.`, "ok");
    isHealed = true;
  } else {
    node2.className = "v-node success";
    node2Status.textContent = "[ OK ]";
    appendConsoleLine(`[STEP-02] Action validation check cleared successfully: ${activeSchema.steps[1]?.detail}`, "ok");
  }

  // Step 3: Destination dispatcher target Node
  const node3 = document.getElementById('node-slot-3');
  const node3Status = document.getElementById('vis-node-03-status');
  node3.className = "v-node processing";
  node3Status.textContent = "[ RUNNING: Step 3 ]";

  await wait(800);
  node3.className = "v-node success";
  node3Status.textContent = "[ OK ]";
  appendConsoleLine(`[STEP-03] Dispatch successfully published: ${activeSchema.steps[2]?.detail}`, "ok");

  try {
    // Send run details to POST /api/run
    const runResult = await fetch('/api/run', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schema: activeSchema,
        payload: payloadObject
      })
    });

    const parsedRunResult = await runResult.json();
    if (parsedRunResult.success) {
      appendConsoleLine(`[COMPLETE] Dry-run execution finalized. Latency: ${parsedRunResult.performance.latency}. State: ${parsedRunResult.performance.status}`, "ok");
      showToast(`DRY-RUN EXECUTED SUCCESSFULLY IN ${parsedRunResult.performance.latency}`, "SUCCESS");
      
      // Reload the runs history and metrics
      loadDurableMemory();
    }
  } catch (error) {
    console.error("Failed storing run metric down to db.", error);
    showToast("Execution metrics logging lost. Main process run complete.", "ERROR");
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = "INITIALIZE DRY-RUN CURRENT PIPELINE";
  }
}

// 8. Render logs history list inside Table
function renderExecutionLogsTable() {
  const tableBody = document.getElementById('runs-table-body');
  if (!tableBody) return;

  if (appState.runs.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="table-loading-row">No active execution pipelines found in durable memory. Create one in Schema Compiler!</td></tr>`;
    return;
  }

  tableBody.innerHTML = '';
  
  appState.runs.forEach(run => {
    const row = document.createElement('tr');
    
    // Highlight if selected
    if (currentSelectedLogId === run.id) {
      row.className = 'selected-row';
    }

    row.onclick = () => selectLogRecord(run.id, run);

    const isOk = run.status.includes("OK");
    const statusClass = isOk ? 'status-cell-ok' : 'status-cell-healed';

    row.innerHTML = `
      <td class="col-id">${run.id}</td>
      <td class="col-title">
        <div><strong>${run.title}</strong></div>
        <div class="col-subtext" style="font-size:9x; color:var(--text-muted); margin-top:2px;">${run.detail}</div>
      </td>
      <td class="col-node">${run.meta}</td>
      <td class="col-latency" style="color:var(--accent-red);">${run.value}</td>
      <td class="col-status"><span class="${statusClass}">${run.status}</span></td>
    `;
    
    tableBody.appendChild(row);
  });

  // Automatically show the first log details
  if (appState.runs.length > 0 && !currentSelectedLogId) {
    selectLogRecord(appState.runs[0].id, appState.runs[0]);
  }
}

// Handle row selection for detailed JSON inspector preview
function selectLogRecord(id, run) {
  currentSelectedLogId = id;
  
  // Highlight selected visually
  document.querySelectorAll('#runs-history-table tbody tr').forEach(row => {
    row.classList.remove('selected-row');
  });

  renderExecutionLogsTable();

  document.getElementById('selected-log-id').textContent = `${run.id}_STATE_DUMP`;
  
  // Attempt to map structure
  const detailedLogJson = {
    gantry_event_id: run.id,
    pipeline_action: run.title,
    synopsys: run.detail,
    execution_latency: run.value,
    operational_status: run.status,
    registered_timestamp: run.timestamp,
    associated_operator: appState.user.email || "ops.lead@gantry-terminal.internal",
    secure_durable_signature: btoa(run.id + "_" + run.value)
  };

  document.getElementById('selected-log-json-output').textContent = JSON.stringify(detailedLogJson, null, 2);
}

// Clean durable memory database records
async function purgeMemoryStore() {
  const confirmAction = confirm("Are you sure you want to clean all stored logs inside Gantry's durable index?");
  if (!confirmAction) return;

  try {
    // In our scenario, we can override memory.runs with empty arrays to replicate purge
    // Let's implement this simply by updating user profile runs count
    appState.runs = [];
    renderExecutionLogsTable();
    computeTelemetryAggregates();
    document.getElementById('selected-log-json-output').textContent = `// Memory registry cleared.`;
    showToast("MEMORY RUN ARCHIVES PURGED CLEAN", "SUCCESS");
  } catch (err) {
    showToast("Purge execution request stalled.", "ERROR");
  }
}

// Helper: Calculate statistics
function computeTelemetryAggregates() {
  const successRateVal = document.getElementById('success-rate-val');
  const latencyVal = document.getElementById('latency-val');
  const faultsCount = document.getElementById('recovered-faults-val');
  
  const schemaCountSpan = document.getElementById('stat-schema-count');
  const runsCountSpan = document.getElementById('stat-runs-count');

  if (schemaCountSpan) schemaCountSpan.textContent = appState.schemas.length;
  if (runsCountSpan) runsCountSpan.textContent = appState.runs.length;

  if (appState.runs.length > 0) {
    // Math logic calculation
    let totalLatency = 0;
    let recoveredCount = 0;
    let successCount = 0;

    appState.runs.forEach(item => {
      const latStr = item.value.replace('ms', '');
      totalLatency += parseInt(latStr) || 120;

      if (item.status.includes('RECOVERED')) {
        recoveredCount++;
      }
      if (item.status.includes('OK') || item.status.includes('RECOVERED')) {
        successCount++;
      }
    });

    const averageLatencyResult = Math.floor(totalLatency / appState.runs.length);
    const successRateRatio = ((successCount / appState.runs.length) * 100).toFixed(2);

    if (latencyVal) latencyVal.textContent = `${averageLatencyResult}ms`;
    if (successRateVal) successRateVal.textContent = `${successRateRatio}%`;
    if (faultsCount) faultsCount.textContent = recoveredCount;
  }
}

// Trigger telemetry console injection lines
function appendConsoleLine(text, styleType) {
  const consoleBox = document.getElementById('sim-console-output');
  if (!consoleBox) return;

  const timestamp = new Date().toLocaleTimeString();
  const span = document.createElement('span');
  span.className = `console-ln-${styleType || 'sys'}`;
  span.textContent = `[${timestamp}] ${text}`;
  
  consoleBox.appendChild(span);
  consoleBox.scrollTop = consoleBox.scrollHeight;
}

// Copy schematics
function copyCurrentLogJSON() {
  const txt = document.getElementById('selected-log-json-output').textContent;
  navigator.clipboard.writeText(txt);
  showToast("COPIED STATE MACHINE PARAMETERS TO CLIPBOARD", "INFO");
}

// 9. Display temporary status indicator notifications toast popup
function showToast(message, type) {
  const toast = document.getElementById('system-notification');
  const titleSpan = toast.querySelector('.toast-title');
  const descSpan = document.getElementById('system-notification-message');

  toast.classList.remove('hidden');
  
  if (type === 'ERROR') {
    toast.style.borderColor = "#FF3D00";
    titleSpan.style.color = "#FF3D00";
    titleSpan.textContent = "// CRITICAL EXCEPTION";
  } else if (type === 'SUCCESS') {
    toast.style.borderColor = "var(--accent-color)";
    titleSpan.style.color = "var(--accent-color)";
    titleSpan.textContent = "// PIPELINE COMPILED [ OK ]";
  } else {
    toast.style.borderColor = "var(--primary-color)";
    titleSpan.style.color = "var(--primary-color)";
    titleSpan.textContent = "// GANTRY TELEMETRY REPORT";
  }

  descSpan.textContent = message;

  // Clear existing timer if any
  if (window.toastTimer) {
    clearTimeout(window.toastTimer);
  }

  window.toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

// Utility delay generator
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
