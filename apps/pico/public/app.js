// Templates mapping
const TEMPLATES = {
  slack: {
    name: 'slack-responder',
    runtime: 'Python 3.11 (Lightweight)',
    detail: 'Quick-start template to post structured payloads to Slack channels.',
    code: `import os\nimport requests\n\nSLACK_WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL", "https://hooks.slack.com/services/...")\n\ndef main():\n    print("Slack Webhook Alert initialised.")\n    payload = {"text": "⚠️ Attention: Backup script triggered successfully on sandbox context."}\n    response = requests.post(SLACK_WEBHOOK_URL, json=payload)\n    print(f"Post response received: {response.status_code}")\n\nif __name__ == '__main__':\n    main()`
  },
  csv: {
    name: 'csv-parser',
    runtime: 'Node.js 20 (Alpine)',
    detail: 'Lightweight utility to transform and clean uploaded CSV data.',
    code: `// CSV to JSON cleaner\nimport fs from 'fs';\n\nconst csvContent = \`id,name,role\\n1,Pete,Founder\\n2,Theo,Worker\\n3,Alice,Agent\`;\n\nfunction parseCSV(raw) {\n  const lines = raw.trim().split('\\n');\n  const headers = lines[0].split(',');\n  return lines.slice(1).map(line => {\n    const vals = line.split(',');\n    return headers.reduce((acc, h, i) => ({ ...acc, [h]: vals[i] }), {});\n  });\n}\n\nconsole.log("Parsing sample CSV payload...");\nconst result = parseCSV(csvContent);\nconsole.log("JSON generated:", JSON.stringify(result));`
  },
  s3: {
    name: 's3-uploader',
    runtime: 'Bash Script (Secure Sandbox)',
    detail: 'Securely pipe files to an external S3 bucket with minimal configuration.',
    code: `#!/bin/bash\necho "Initialising secure S3 directory sync..."\nAWS_S3_BUCKET="s3://pico-backups-bucket"\n\nif [ -z "$AWS_ACCESS_KEY_ID" ]; then\n  echo "Error: AWS credentials missing. Please map environment variables."\n  exit 1\nfi\n\necho "Backing up raw logs archive into \${AWS_S3_BUCKET}/logs..."\n# aws s3 sync ./logs \${AWS_S3_BUCKET}/logs\necho "Logs sync finished successfully. Status: 0"`
  }
};

// Application state and selectors
const complexityToggle = document.getElementById('complexity-toggle');
const awsDiagram = document.getElementById('aws-diagram');
const picoDiagram = document.getElementById('pico-diagram');
const awsLabel = document.querySelector('.aws-label');
const picoLabel = document.querySelector('.pico-label');

const slotsMetric = document.getElementById('slots-metric');
const deployForm = document.getElementById('deploy-form');
const templateBtns = document.querySelectorAll('.template-btn');
const beautifyCodeBtn = document.getElementById('beautify-code-btn');
const analyzeScriptBtn = document.getElementById('analyze-script-btn');
const provisionOverlay = document.getElementById('provision-overlay');

const appNameInput = document.getElementById('app-name');
const appRuntimeSelect = document.getElementById('app-runtime');
const appAccessSelect = document.getElementById('app-access');
const appCodeTextarea = document.getElementById('app-code');
const appDetailInput = document.getElementById('app-detail');

const compilerOutput = document.getElementById('compiler-output');
const knobsSection = document.getElementById('knobs-section');
const inferredEnvSpan = document.getElementById('inferred-env');
const knobSlider = document.getElementById('knob-slider');
const knobSliderVal = document.getElementById('knob-slider-val');

const totalComputeSpan = document.getElementById('total-compute');
const activeUsersSpan = document.getElementById('active-users');
const listLoading = document.getElementById('list-loading');
const deployedAppsContainer = document.getElementById('deployed-apps-container');

// View code modal elements
const viewCodeModal = document.getElementById('view-code-modal');
const modalAppTitle = document.getElementById('modal-app-title');
const modalAppRuntime = document.getElementById('modal-app-runtime');
const modalAppAccess = document.getElementById('modal-app-access');
const modalAppDate = document.getElementById('modal-app-date');
const modalCodeBody = document.getElementById('modal-code-body');
const closeModalBtn = document.getElementById('close-modal-btn');

// State trackers
let allApps = [];

// Init Hook
window.addEventListener('DOMContentLoaded', () => {
  fetchApps();
  setupEventListeners();
  loadDefaultNumbers();
});

// Setup Events
function setupEventListeners() {
  // Complexity toggle switcher
  complexityToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      awsDiagram.classList.add('hidden');
      picoDiagram.classList.remove('hidden');
      awsLabel.classList.remove('active');
      picoLabel.classList.add('active');
      printTerminalLine('sys-toggle --mode pico', 'Switched Workbench context to Pico mode: Enterprise overhead collapsed.', 'info');
    } else {
      awsDiagram.classList.remove('hidden');
      picoDiagram.classList.add('hidden');
      awsLabel.classList.add('active');
      picoLabel.classList.remove('active');
      printTerminalLine('sys-toggle --mode aws', 'Switched Workbench context to AWS mode: 6 decoupled stack micro-services live.', 'output');
    }
  });

  // Template select buttons
  templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-template');
      const data = TEMPLATES[type];
      if (data) {
        appNameInput.value = data.name;
        appRuntimeSelect.value = data.runtime;
        appCodeTextarea.value = data.code;
        appDetailInput.value = data.detail;
        
        printTerminalLine(`load-template --type ${type}`, `Fetched template code. Applied ${data.runtime} sandbox settings.`, 'info');
        
        // Auto-run analysis animation as smart visual
        runAnalysisDiagnostics(false);
      }
    });
  });

  // Beautify button
  beautifyCodeBtn.addEventListener('click', () => {
    const raw = appCodeTextarea.value;
    if (!raw.trim()) return;
    try {
      if (appRuntimeSelect.value.includes('Node.js')) {
        // Mock mini-beautifier for Javascript formatting
        appCodeTextarea.value = raw.split('\n').map(line => line.trim() ? line : '').join('\n');
        printTerminalLine('beautify --lang js', 'Formatted JavaScript code indentation.', 'info');
      } else {
        printTerminalLine('beautify --lang python', 'Normalized script indentation tags.', 'info');
      }
    } catch(e){}
  });

  // Compiler analysis trigger button
  analyzeScriptBtn.addEventListener('click', () => {
    runAnalysisDiagnostics(true);
  });

  // UI Knob sliders
  knobSlider.addEventListener('input', (e) => {
    knobSliderVal.textContent = `${e.target.value} Pages`;
  });

  // Form submit handler (Saves durably via POST /api/memory)
  deployForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = appNameInput.value.trim().toLowerCase();
    const runtime = appRuntimeSelect.value;
    const access = appAccessSelect.value;
    const code = appCodeTextarea.value;
    const detail = appDetailInput.value.trim() || `Tactile micro-app script running securely on ${runtime}`;

    if (!name || !code) return;

    // Show provision visual modal
    provisionOverlay.classList.remove('hidden');

    const bodyPayload = {
      runtime,
      access,
      code,
      detail,
      status: "Live",
      compute_time: (0.5 + Math.random() * 9).toFixed(1) + "s",
      active_users: Math.floor(Math.random() * 5),
    };

    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name,
          body: JSON.stringify(bodyPayload)
        })
      });

      const result = await response.json();
      
      // Keep loader on screen for 1.2s for physical tactile satisfaction
      setTimeout(() => {
        provisionOverlay.classList.add('hidden');
        if (result.success) {
          printTerminalLine(`provision --success pico.run/${name}`, `Container successfully mapped to secure runtime subdomain.`, 'info');
          
          // Clear inputs
          deployForm.reset();
          knobsSection.classList.add('hidden');
          
          // Trigger list reload
          fetchApps();
        } else {
          alert(`Failed to save: ${result.error}`);
        }
      }, 1200);

    } catch (err) {
      console.error(err);
      provisionOverlay.classList.add('hidden');
      alert("Error saving sandbox micro-app to durable backend.");
    }
  });

  // Code Modal Close trigger
  closeModalBtn.addEventListener('click', () => {
    viewCodeModal.classList.add('hidden');
  });

  // Close modal when typing Escape or clicking outer dark cover
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') viewCodeModal.classList.add('hidden');
  });
  viewCodeModal.addEventListener('click', (e) => {
    if (e.target === viewCodeModal) viewCodeModal.classList.add('hidden');
  });
}

// Fetch files from DB backend (GET /api/memory)
async function fetchApps() {
  listLoading.classList.remove('hidden');
  
  try {
    const response = await fetch('/api/memory');
    const result = await response.json();
    
    if (result.success) {
      allApps = result.data;
      renderAppsList(result.data);
    }
  } catch (err) {
    console.error("Error reading apps list memory:", err);
    deployedAppsContainer.innerHTML = `<div class="error-slate">⚠️ Backend memory storage is unreachable. Serve check needed.</div>`;
  } finally {
    listLoading.classList.add('hidden');
  }
}

// Render dynamic elements to browser
function renderAppsList(apps) {
  deployedAppsContainer.innerHTML = '';
  
  if (apps.length === 0) {
    deployedAppsContainer.innerHTML = `
      <div class="empty-slate" style="text-align: center; padding: 2rem; color: #726E6A; border: 1px dashed var(--border)">
        No micro-apps are currently compiled. Paste script code above to spin up your very first container.
      </div>`;
    slotsMetric.textContent = "0/10";
    totalComputeSpan.textContent = "0.0s";
    activeUsersSpan.textContent = "0";
    return;
  }

  slotsMetric.textContent = `${apps.length} / 10`;

  let sumCompute = 0;
  let sumUsers = 0;

  apps.forEach(app => {
    let parsedBody = {};
    try {
      parsedBody = JSON.parse(app.body);
    } catch (e) {
      // Handle instances where body is saved as plain string by general testing API
      parsedBody = {
        runtime: "Python 3.11 (Lightweight)",
        access: "Private (Only Me)",
        code: app.body,
        detail: "Legacy migrated script context.",
        status: "Live",
        compute_time: "1.2s",
        active_users: 1
      };
    }

    const isLive = parsedBody.status === "Live";
    
    // Increment metrics
    if (isLive) {
      const compVal = parseFloat(parsedBody.compute_time) || 0;
      sumCompute += compVal;
      sumUsers += (parsedBody.active_users || 0);
    }

    const appRow = document.createElement('div');
    appRow.className = `app-row-item`;
    
    appRow.innerHTML = `
      <div class="app-details">
        <div class="app-title-line">
          <a href="#" class="app-url" data-id="${app.id}">pico.run/${app.title}</a>
          <span class="app-status-pill ${isLive ? 'live' : 'paused'}">${parsedBody.status || 'Live'}</span>
        </div>
        <p class="app-desc-snippet">${parsedBody.detail || 'No description provided.'}</p>
        <div class="app-meta-indicators">
          <span class="app-engine-badge">Engine: ${parsedBody.runtime || 'Container Sandbox'}</span>
          <span>•</span>
          <span>Access: ${parsedBody.access || 'Private'}</span>
          <span>•</span>
          <span>Active: ${parsedBody.active_users || 0} user(s)</span>
        </div>
      </div>
      
      <div class="app-actions">
        <button class="btn btn-status-toggle" data-id="${app.id}" data-current="${parsedBody.status}">
          ${isLive ? 'Pause' : 'Resume'}
        </button>
        <button class="btn btn-show-code" data-id="${app.id}">View Code</button>
        <button class="btn-delete-slot" data-id="${app.id}" title="Kill Slot and Erase Subdomain">×</button>
      </div>
    `;

    deployedAppsContainer.appendChild(appRow);
  });

  // Update overall catalog metrics
  totalComputeSpan.textContent = `${sumCompute.toFixed(1)}s`;
  activeUsersSpan.textContent = sumUsers;

  // Add click handlers for action buttons
  setupActionListeners();
}

// Manage dynamic click listeners for rows
function setupActionListeners() {
  // 1. Delete slot trigger
  document.querySelectorAll('.btn-delete-slot').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.getAttribute('data-id');
      const targetApp = allApps.find(a => a.id === id);
      const name = targetApp ? targetApp.title : 'Selected slot';
      
      if (confirm(`Are you sure you want to terminate container and wipe the path pico.run/${name}?`)) {
        try {
          const response = await fetch(`/api/memory/${id}`, { method: 'DELETE' });
          const result = await response.json();
          if (result.success) {
            printTerminalLine(`kill-slot --id ${id}`, `Wiped app path pico.run/${name} from memory space.`, 'output');
            fetchApps();
          }
        } catch (err) {
          alert('Failed to delete container space.');
        }
      }
    });
  });

  // 2. Status toggle Live / Paused
  document.querySelectorAll('.btn-status-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const current = btn.getAttribute('data-current') || 'Live';
      const targetApp = allApps.find(a => a.id === id);
      if (!targetApp) return;

      let bodyData = {};
      try {
        bodyData = JSON.parse(targetApp.body);
      } catch (e) {
        bodyData = { code: targetApp.body };
      }

      // Toggle state
      const nextStatus = current === "Live" ? "Paused" : "Live";
      bodyData.status = nextStatus;
      if (nextStatus === "Paused") {
        bodyData.active_users = 0;
      } else {
        bodyData.active_users = Math.floor(Math.random() * 4) + 1;
      }

      try {
        const response = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: targetApp.title,
            body: JSON.stringify(bodyData)
          })
        });

        const result = await response.json();
        if (result.success) {
          printTerminalLine(
            `toggle-status --id ${nextStatus}`, 
            `Server instance pico.run/${targetApp.title} is now ${nextStatus.toUpperCase()}.`, 
            nextStatus === 'Live' ? 'info' : 'output'
          );
          fetchApps();
        }
      } catch (err) {
        alert("Failed to modify slot status.");
      }
    });
  });

  // 3. View code trigger
  document.querySelectorAll('.btn-show-code, .app-url').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const targetApp = allApps.find(a => a.id === id);
      if (!targetApp) return;

      let bodyData = {};
      try {
        bodyData = JSON.parse(targetApp.body);
      } catch (e) {
        bodyData = {
          code: targetApp.body,
          runtime: "Python 3.11",
          access: "Private",
          status: "Live"
        };
      }

      modalAppTitle.textContent = `pico.run/${targetApp.title}`;
      modalAppRuntime.textContent = bodyData.runtime || 'Container Sandbox';
      modalAppAccess.textContent = bodyData.access || 'Private';
      
      const createdDate = targetApp.createdAt ? new Date(targetApp.createdAt) : new Date();
      modalAppDate.textContent = createdDate.toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
      modalCodeBody.textContent = bodyData.code || targetApp.body;

      viewCodeModal.classList.remove('hidden');
    });
  });
}

// Simulate Gemini Code Diagnostics and API Interface compiler wrapper
function runAnalysisDiagnostics(isUserClick) {
  const code = appCodeTextarea.value;
  if (!code.trim()) {
    if (isUserClick) {
      alert("Please paste some raw script code inside the editor first.");
    }
    return;
  }

  // Clear compile console output
  compilerOutput.innerHTML = '';
  knobsSection.classList.add('hidden');

  printTerminalLine('pico-compiler --scan-ast', 'Initialising Gemini Reasoning Sandbox parser...', 'info');

  // Multi-step diagnostic simulation
  setTimeout(() => {
    printTerminalLine('compiler --lint', 'Scanning abstract parameters & imports checklist...');
  }, 350);

  setTimeout(() => {
    // Basic structural regex check
    let inferredEnv = "SCRAPER_API_KEY";
    let inputUrl = "https://news.ycombinator.com";
    let uiLabel = "Max Scraping Pages";

    if (code.includes('SLACK_WEBHOOK_URL')) {
      inferredEnv = "SLACK_WEBHOOK_URL";
      uiLabel = "Max Notify Limit";
    } else if (code.includes('AWS_ACCESS_KEY_ID') || code.includes('AWS_S3_BUCKET')) {
      inferredEnv = "AWS_ACCESS_KEY_ID";
      uiLabel = "Secure Sync Speed (KB/s)";
    } else if (code.includes('csv')) {
      inferredEnv = "CLEANER_STRICT_MODE";
      uiLabel = "Validation Level";
    }

    inferredEnvSpan.textContent = inferredEnv;
    
    printTerminalLine('compiler --infer-variables', `FOUND REQUIRED PARAMETER REFERENCE: \`process.env.${inferredEnv}\``, 'info');
    printTerminalLine('compiler --sandbox-wrap', 'Synthesizing standard sandbox UI knobs structure for non-technical team members.', 'info');
    
    // Reveal Inferred controller inputs
    knobsSection.classList.remove('hidden');
  }, 750);
}

// Util writer for simulated console
function printTerminalLine(command, msg, type = 'output') {
  const promptLine = document.createElement('span');
  promptLine.className = 'term-line prompt';
  promptLine.textContent = command;

  const respLine = document.createElement('span');
  respLine.className = `term-line response ${type === 'info' ? 'info' : 'output'}`;
  respLine.innerHTML = msg;

  compilerOutput.appendChild(promptLine);
  compilerOutput.appendChild(respLine);

  // Scroll to bottom
  compilerOutput.scrollTop = compilerOutput.scrollHeight;
}

// Fast metric placeholders generators
function loadDefaultNumbers() {
  printTerminalLine('system --status', 'Pico CLI Sandbox Daemon listening on docker.sock.', 'info');
}
