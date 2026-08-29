// Co-Op Client Application State
let sessionsState = [];
let currentSessionId = "dev-agent-refactor"; // default to first seeded session
let activeFilter = "all";
let syncInterval = null;
let cursorSimulationInterval = null;

// DOM Elements
const sessionForm = document.getElementById('session-form');
const sessionsContainer = document.getElementById('sessions-container');
const sessionsTabsNav = document.getElementById('sessions-tabs-nav');
const statHumans = document.getElementById('stat-humans');
const statAgents = document.getElementById('stat-agents');
const statLatency = document.getElementById('stat-latency');
const terminalFilename = document.getElementById('terminal-filename');
const takeoverStatusBadge = document.getElementById('takeover-status-badge');
const badgeText = document.getElementById('badge-text');
const codeEditor = document.getElementById('code-editor');
const takeoverBtn = document.getElementById('takeover-btn');
const takeoverBtnText = document.getElementById('takeover-btn-text');
const eventLogsList = document.getElementById('event-logs-list');
const controlPromptForm = document.getElementById('control-prompt-form');
const promptInput = document.getElementById('prompt-input');
const filterButtons = document.querySelectorAll('.event-tab-btn');
const alertToast = document.getElementById('alert-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  fetchSessions();
  setupEventListeners();
  
  // Start dynamic background sync (every 2.5 seconds)
  syncInterval = setInterval(syncActiveWorkspace, 2500);

  // Start multiplayer cursor movements
  startCursorSimulation();
});

// Event Listeners Routing
function setupEventListeners() {
  // Session creation form
  sessionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const persona = document.getElementById('agent-persona').value;
    const repoUrl = document.getElementById('repo-url').value;
    const accessLevel = document.getElementById('team-access').value;

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, repoUrl, accessLevel })
      });

      if (!response.ok) throw new Error("Failed to create session");
      
      const newSession = await response.json();
      showToast("Session Launched!", `Dynamic channel #${newSession.id} is now online.`);
      sessionForm.reset();
      
      // Select new session
      currentSessionId = newSession.id;
      await fetchSessions();
    } catch (err) {
      console.error(err);
      showToast("Error", "Could not launch shared session.", true);
    }
  });

  // Prompt/message sending form
  controlPromptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageText = promptInput.value.trim();
    if (!messageText) return;

    try {
      const response = await fetch(`/api/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "User Prompt Issued",
          detail: messageText,
          status: "Human",
          value: "Active"
        })
      });

      if (!response.ok) throw new Error("Failed to post message");
      
      promptInput.value = '';
      showToast("Input Dispatched", "Forwarding code instruction directly to Co-Op agent.");
      
      // Perform immediate sync to show user message
      await syncActiveWorkspace();
    } catch (err) {
      console.error(err);
      showToast("Error", "Message transmit failed.", true);
    }
  });

  // Takeover Button Click
  takeoverBtn.addEventListener('click', () => {
    triggerTakeoverAction();
  });

  // Hotkey support: Esc triggers takeover
  document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      triggerTakeoverAction();
    }
  });

  // Real-time Code typing integration
  codeEditor.addEventListener('input', async () => {
    const isReadOnly = codeEditor.hasAttribute('readonly');
    if (isReadOnly) return;

    // Save user edits back to database memory
    try {
      await fetch(`/api/sessions/${currentSessionId}/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeEditor.value })
      });
    } catch (err) {
      console.error("Local draft sync failure:", err);
    }
  });

  // Stream message filters
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeFilter = e.target.getAttribute('data-filter');
      renderMessages();
    });
  });
}

// Fetch list of available sessions
async function fetchSessions() {
  try {
    const response = await fetch('/api/sessions');
    if (!response.ok) throw new Error("Could not fetch sessions list");
    sessionsState = await response.json();
    
    // Ensure selected session exists
    if (!sessionsState.some(s => s.id === currentSessionId) && sessionsState.length > 0) {
      currentSessionId = sessionsState[0].id;
    }

    renderSessionsList();
    renderTabs();
    await workspaceSelectionChanged();
  } catch (err) {
    console.error("Fetch sessions error:", err);
  }
}

// Render sessions list in the left-hand column
function renderSessionsList() {
  sessionsContainer.innerHTML = '';
  
  sessionsState.forEach(session => {
    const isSelected = session.id === currentSessionId;
    const isTakeover = session.status === "takeover";
    
    const row = document.createElement('div');
    row.className = `session-item-row ${isSelected ? 'active-selection' : ''}`;
    row.setAttribute('data-id', session.id);
    row.addEventListener('click', () => selectSession(session.id));

    const statusBadge = isTakeover 
      ? `<span class="session-item-badge badge-takeover">TAKEOVER</span>`
      : `<span class="session-item-badge badge-online">CO-OP ON</span>`;

    row.innerHTML = `
      <div class="session-item-title">
        <span>#${session.id} — ${session.persona.split(" ")[0]}</span>
        <span class="session-item-meta">${session.repoUrl}</span>
      </div>
      <div>
        ${statusBadge}
      </div>
    `;
    sessionsContainer.appendChild(row);
  });
}

// Render upper tabs
function renderTabs() {
  sessionsTabsNav.innerHTML = '';

  sessionsState.forEach(session => {
    const isSelected = session.id === currentSessionId;
    const btn = document.createElement('button');
    btn.className = `session-tab ${isSelected ? 'tab-active' : ''}`;
    btn.textContent = `#${session.id}`;
    btn.addEventListener('click', () => selectSession(session.id));
    sessionsTabsNav.appendChild(btn);
  });
}

// Switch current selected session
async function selectSession(id) {
  if (currentSessionId === id) return;
  currentSessionId = id;
  
  renderSessionsList();
  renderTabs();
  await workspaceSelectionChanged();
}

// Handle all UI state transitions when selected session changes
async function workspaceSelectionChanged() {
  const session = sessionsState.find(s => s.id === currentSessionId);
  if (!session) return;

  // Set file extensions in window decoration mock based on persona
  if (session.persona.includes("DocAgent")) {
    terminalFilename.textContent = "README_WIKI.md";
  } else if (session.persona.includes("QA-Agent")) {
    terminalFilename.textContent = "test_auth_flow.py";
  } else if (session.persona.includes("SalesAgent")) {
    terminalFilename.textContent = "mrr_projections.csv";
  } else {
    terminalFilename.textContent = "auth_service.py";
  }

  // Set prompt field placeholder based on agent persona
  promptInput.placeholder = `Prompt ${session.persona.split(" ")[0]} (e.g. 'add extra checks')`;

  // Update statistics
  statHumans.textContent = session.activeHumans;
  statAgents.textContent = session.activeAgents;
  statLatency.textContent = session.syncLatency;

  // Set visual mode for Takeover
  setTakeoverVisualState(session.status === "takeover");

  // Load backend memory code content
  await syncCode();

  // Load backend memory messages stream
  await syncMessages();
}

// Synchronize code viewport values from DB
async function syncCode() {
  // If human is actively typing/has taken control, we don't overwrite user terminal state
  const isTakeover = takeoverBtn.classList.contains('active-takeover');
  if (isTakeover && document.activeElement === codeEditor) {
    return; // Don't interrupt user direct typing stream
  }

  try {
    const response = await fetch(`/api/sessions/${currentSessionId}/code`);
    if (response.ok) {
      const data = await response.json();
      codeEditor.value = data.code;
    }
  } catch (err) {
    console.error("Code sync error:", err);
  }
}

// Synchronize message feeds from DB
async function syncMessages() {
  try {
    const response = await fetch(`/api/sessions/${currentSessionId}/messages`);
    if (response.ok) {
      const messages = await response.json();
      renderMessagesListWithData(messages);
    }
  } catch (err) {
    console.error("Message sync error:", err);
  }
}

// Helper to filter and render logs
function renderMessagesListWithData(messages) {
  eventLogsList.innerHTML = '';

  // Sort messages descending by timestamp
  const sorted = [...messages].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const filtered = sorted.filter(msg => {
    if (activeFilter === "takeovers") {
      return msg.status === "Interactive Action" || msg.title.includes("INTERRUPT") || msg.title.includes("RELEASE");
    }
    return true;
  });

  if (filtered.length === 0) {
    eventLogsList.innerHTML = `<div class="empty-state-logs">No matching activity inside current partition.</div>`;
    return;
  }

  filtered.forEach(msg => {
    const card = document.createElement('div');
    
    // Style left border color accordingly
    let subClass = "status-info";
    if (msg.status === "Human") subClass = "status-human";
    else if (msg.status === "Agent") subClass = "status-agent";
    else if (msg.status === "AgentPlan") subClass = "status-agentplan";
    else if (msg.status === "Interactive Action") subClass = "status-action";

    card.className = `log-message-card ${subClass}`;

    card.innerHTML = `
      <div class="log-msg-top">
        <span class="log-msg-title">${msg.title}</span>
        <span class="log-msg-meta">${msg.meta}</span>
      </div>
      <div class="log-msg-body">${msg.detail}</div>
      <div class="log-msg-bottom">
        <span class="log-msg-badge">${msg.status}</span>
        <span class="log-msg-val">${msg.value}</span>
      </div>
    `;
    eventLogsList.appendChild(card);
  });
}

// Periodic fast UI workspace sync
async function syncActiveWorkspace() {
  // Sync the master list of sessions to get current user sizes/latencies
  try {
    const response = await fetch('/api/sessions');
    if (response.ok) {
      sessionsState = await response.json();
      
      // Update selected stats in header
      const current = sessionsState.find(s => s.id === currentSessionId);
      if (current) {
        statHumans.textContent = current.activeHumans;
        statAgents.textContent = current.activeAgents;
        statLatency.textContent = current.syncLatency;
        setTakeoverVisualState(current.status === "takeover");
      }
    }
  } catch (err) {
    console.error("Master state polling error:", err);
  }

  await syncCode();
  await syncMessages();
}

// Trigger takeover post action to server
async function triggerTakeoverAction() {
  try {
    const isCurrentlyActive = takeoverBtn.classList.contains('active-takeover');
    const operator = "Alex (Dev)";
    const notes = isCurrentlyActive 
      ? "Releasing manual lockout to auto-agent pipeline." 
      : "Manually pausing AI pipeline to make direct hot-fixes in code workspace.";

    const response = await fetch(`/api/sessions/${currentSessionId}/takeover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, notes })
    });

    if (!response.ok) throw new Error("Takeover trigger action failed");
    const json = await response.json();

    const isTakeover = json.status === "takeover";
    setTakeoverVisualState(isTakeover);
    
    showToast(
      isTakeover ? "Takeover Activated" : "Handoff Complete",
      isTakeover ? "Auto pipelines paused. Direct write mode is selected." : "AI execution restored."
    );

    // Prompt immediate syncs to render intermediate events
    await syncActiveWorkspace();
  } catch (err) {
    console.error("Takeover failed:", err);
    showToast("Error", "Failed to switch control states.", true);
  }
}

// Toggle read only and CSS styles of takeover badges
function setTakeoverVisualState(isTakeover) {
  if (isTakeover) {
    takeoverBtn.classList.add('active-takeover');
    takeoverBtnText.textContent = "Release Control (Esc)";
    takeoverStatusBadge.className = "state-pill status-takeover";
    badgeText.textContent = "HUMAN INTERRUPTING";
    codeEditor.removeAttribute('readonly');
    // Change cursor color inside terminal overlay
    document.getElementById('user-agent').style.display = 'none';
  } else {
    takeoverBtn.classList.remove('active-takeover');
    takeoverBtnText.textContent = "Takeover Agent (Esc)";
    takeoverStatusBadge.className = "state-pill status-active";
    badgeText.textContent = "AGENT EXECUTING";
    codeEditor.setAttribute('readonly', 'true');
    document.getElementById('user-agent').style.display = 'flex';
  }
}

// Display elegant notifications toast
function showToast(title, message, isError = false) {
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  
  if (isError) {
    alertToast.style.borderColor = "var(--accent-color)";
    alertToast.querySelector('.toast-icon').textContent = "⚠️";
    alertToast.querySelector('.toast-icon').style.color = "var(--accent-color)";
  } else {
    alertToast.style.borderColor = "var(--primary-color)";
    alertToast.querySelector('.toast-icon').textContent = "⚡";
    alertToast.querySelector('.toast-icon').style.color = "var(--primary-color)";
  }

  alertToast.classList.remove('hidden');
  setTimeout(() => {
    alertToast.classList.add('hidden');
  }, 5000);
}

// Simulate multiple flying cursors inside web interface
function startCursorSimulation() {
  const userAlex = document.getElementById('user-alex');
  const userAgent = document.getElementById('user-agent');
  
  cursorSimulationInterval = setInterval(() => {
    // Read current mode
    const isTakeover = takeoverBtn.classList.contains('active-takeover');
    
    // Simulate Alex moving in the area
    if (userAlex) {
      const topX = Math.floor(Math.random() * 200) + 50;
      const leftX = Math.floor(Math.random() * 300) + 40;
      userAlex.style.top = `${topX}px`;
      userAlex.style.left = `${leftX}px`;
    }

    // Simulate Agent edits/movements when active
    if (userAgent && !isTakeover) {
      const topY = Math.floor(Math.random() * 180) + 120;
      const leftY = Math.floor(Math.random() * 280) + 80;
      userAgent.style.top = `${topY}px`;
      userAgent.style.left = `${leftY}px`;
    }
  }, 4000);
}
