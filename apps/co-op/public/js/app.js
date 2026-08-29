// Global App State
let currentSessionId = 'dev-agent-refactor';
let currentSessionData = null;
let lastCodeHash = '';
let activeTab = 'active-canvas';
let cursorIntervalId = null;

// DOM Elements
const menuList = document.getElementById('active-sessions-menu');
const sessionTitle = document.getElementById('session-title');
const metricHumans = document.getElementById('metric-humans');
const metricAgents = document.getElementById('metric-agents');
const metricLatency = document.getElementById('metric-latency');

const controlContext = document.getElementById('control-context');
const controlExecution = document.getElementById('control-execution');
const controlCost = document.getElementById('control-cost');

const messageStreamBox = document.getElementById('message-stream-box');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

const canvasFilename = document.getElementById('canvas-filename');
const canvasRepo = document.getElementById('canvas-repo');
const codeTextarea = document.getElementById('code-textarea');
const cursorsLayer = document.getElementById('editor-cursors-layer');
const takeoverOverlay = document.getElementById('takeover-overlay');
const takeoverBtn = document.getElementById('takeover-btn');

const deployForm = document.getElementById('deploy-agent-form');
const successBanner = document.getElementById('deployment-success-toast');
const goToSessionBtn = document.getElementById('go-to-session-btn');

const redirectBrainForm = document.getElementById('redirect-brain-form');
const redirectSessionSelect = document.getElementById('redirect-session-select');
const redirectDirective = document.getElementById('redirect-directive');

const agentQueueList = document.getElementById('agent-queue-list');

// Initialize Single Page Application
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  fetchSessions(true); // Hydrate initial sessions and load default
  
  // Set up polling intervals
  setInterval(() => fetchSessions(false), 3000); // Sync global workspace listings
  setInterval(pollActiveSession, 2000);         // Rapid sync active workspace
  
  // Handlers
  messageForm.addEventListener('submit', handleSendMessage);
  deployForm.addEventListener('submit', handleDeployAgent);
  takeoverBtn.addEventListener('click', () => triggerTakeover());
  redirectBrainForm.addEventListener('submit', handleRedirectSignal);
  goToSessionBtn.addEventListener('click', enterLiveCanvas);
  
  // Escape Key Tactile Hand-off Shortcut
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeTab === 'active-canvas') {
      e.preventDefault();
      triggerTakeover();
    }
  });

  // Debounced user code syncing during override
  codeTextarea.addEventListener('input', debounce(syncUserCode, 800));

  // Initialize cursor animation
  animateCollaboratorCursors();
});

// Tab Switch Logic
function setupTabs() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tabId = btn.getAttribute('data-tab');
      activeTab = tabId;
      
      document.querySelectorAll('.tab-content').forEach(sect => {
        sect.classList.remove('active');
      });
      document.getElementById(`tab-${tabId}`).classList.add('active');

      if (tabId === 'active-canvas') {
        setTimeout(scrollToBottom, 100);
      }
    });
  });
}

// Fetch listed sessions
async function fetchSessions(isFirstLoad = false) {
  try {
    const res = await fetch('/api/sessions');
    if (!res.ok) throw new Error("Network response error loading sessions");
    const sessions = await res.json();
    
    renderWorkspaceLists(sessions);
    renderQueueControlRoom(sessions);
    
    if (isFirstLoad && sessions.length > 0) {
      // Load first session or search for hash
      const savedSesh = localStorage.getItem('coop_selected_session');
      const target = sessions.find(s => s.id === savedSesh) || sessions[0];
      loadSession(target.id);
    }
  } catch (err) {
    console.error("Failed fetching sessions:", err);
  }
}

// Render sessions inside sidebar & dropdown selectors
function renderWorkspaceLists(sessions) {
  menuList.innerHTML = '';
  redirectSessionSelect.innerHTML = '';
  
  sessions.forEach(session => {
    // Sidebar list
    const li = document.createElement('li');
    li.classList.toggle('active-sesh', session.id === currentSessionId);
    li.innerHTML = `
      <span>${session.name}</span>
      ${session.isTakeoverActive ? '<span class="badge">LOCKED</span>' : ''}
    `;
    li.addEventListener('click', () => loadSession(session.id));
    menuList.appendChild(li);
    
    // Select dropdown in Control Room
    const opt = document.createElement('option');
    opt.value = session.id;
    opt.textContent = session.name;
    opt.selected = session.id === currentSessionId;
    redirectSessionSelect.appendChild(opt);
  });
}

// Render queue control panel
function renderQueueControlRoom(sessions) {
  agentQueueList.innerHTML = '';
  
  sessions.forEach(session => {
    const div = document.createElement('div');
    div.className = `track-item ${session.id === currentSessionId ? 'active' : ''}`;
    
    const isLocked = session.isTakeoverActive;
    const statusText = isLocked ? "Idle (Locked)" : "Running";
    const statusClass = isLocked ? "idle" : "running";
    const currentActivity = isLocked ? `Suspended by manual takeover of ${session.lastTakeoverUser}` : `Collaborating live under key context URL.`;
    
    div.innerHTML = `
      <div class="track-header">
        <span>${session.name} — ${session.persona}</span>
        <span class="status ${statusClass}">${statusText}</span>
      </div>
      <div class="track-detail">${currentActivity}</div>
    `;
    agentQueueList.appendChild(div);
  });
}

// Load session details
async function loadSession(id) {
  currentSessionId = id;
  localStorage.setItem('coop_selected_session', id);
  
  // Highlight active sidebar item
  document.querySelectorAll('#active-sessions-menu li').forEach(li => {
    li.classList.remove('active-sesh');
  });
  
  await pollActiveSession(true);
  
  // Instantly redirect tabs to canvas
  const activeBtn = document.querySelector(`.nav-btn[data-tab="active-canvas"]`);
  if (activeBtn) activeBtn.click();
}

// Poll Active Session info
async function pollActiveSession(forceEditorReload = false) {
  if (!currentSessionId) return;
  
  try {
    const res = await fetch(`/api/sessions/${currentSessionId}`);
    if (!res.ok) throw new Error("Could not fetch active session detail");
    const session = await res.json();
    
    currentSessionData = session;
    
    // Update Header Details & Metrics
    sessionTitle.textContent = session.name;
    metricHumans.textContent = session.metrics.activeHumans;
    metricAgents.textContent = session.metrics.activeAgents;
    metricLatency.textContent = session.metrics.syncLatency;
    
    controlContext.textContent = session.metrics.contextWindow;
    controlExecution.textContent = session.metrics.executionTime;
    controlCost.textContent = session.metrics.costSaved;

    canvasFilename.textContent = session.fileName;
    canvasRepo.textContent = session.repository;
    
    // Update Takeover lock status
    if (session.isTakeoverActive) {
      takeoverOverlay.classList.remove('hidden');
      takeoverBtn.innerHTML = `<span class="pulse-icon"></span> RELEASE CONTROL`;
      takeoverBtn.classList.add('takeover-on');
      codeTextarea.disabled = false; // Allow manual edit
    } else {
      takeoverOverlay.classList.add('hidden');
      takeoverBtn.innerHTML = `<span class="pulse-icon"></span> TAKEOVER AGENT`;
      takeoverBtn.classList.remove('takeover-on');
      // If no takeover and user doesn't have focus, let agent control the textarea
      codeTextarea.disabled = true;
    }
    
    // Render code in text editor ONLY if user is not editing, or force reload is flagged
    if (forceEditorReload || (!session.isTakeoverActive && document.activeElement !== codeTextarea)) {
      if (lastCodeHash !== hashString(session.fileContent)) {
        codeTextarea.value = session.fileContent;
        lastCodeHash = hashString(session.fileContent);
      }
    }
    
    // Render chat timeline stream
    renderTimeline(session.messages);
    
    // Position cursors overlay
    renderLiveCursors(session.cursors);
    
  } catch (err) {
    console.error("Poller active session failed:", err);
  }
}

// Render message timeline stream
function renderTimeline(messages) {
  // Save current scroll position to avoid snapping if user scrolled up
  const isNearBottom = messageStreamBox.scrollHeight - messageStreamBox.clientHeight - messageStreamBox.scrollTop < 100;
  
  messageStreamBox.innerHTML = '';
  messages.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${msg.role || 'human'}`;
    
    let textHTML = `<div class="msg-body">${escapeHTML(msg.text)}</div>`;
    if (msg.codeSnippet) {
      textHTML += `<pre class="embedded-code"><code>${escapeHTML(msg.codeSnippet)}</code></pre>`;
    }
    
    bubble.innerHTML = `
      <div class="msg-header">
        <span class="msg-sender">${escapeHTML(msg.sender)}</span>
        <span class="msg-time">${escapeHTML(msg.timestamp)}</span>
      </div>
      ${textHTML}
    `;
    messageStreamBox.appendChild(bubble);
  });
  
  if (isNearBottom || messageStreamBox.children.length <= 4) {
    scrollToBottom();
  }
}

// Render dynamic multiplayer cursors
function renderLiveCursors(cursors) {
  // Clear non-static cursors
  cursorsLayer.innerHTML = '';
  
  if (!currentSessionData) return;
  
  const textVal = codeTextarea.value || '';
  const lines = textVal.split('\n');
  const totalLines = Math.max(lines.length, 1);
  
  cursors.forEach(curs => {
    // If it's human takeover cursor, don't show custom overlay on top of our own mouse pointer
    if (currentSessionData.isTakeoverActive && curs.name === "Guest Hacker") return;
    
    // Convert line number & character offset into visual coordinates inside editor textarea
    const visualLine = Math.min(curs.line, totalLines);
    const lineContent = lines[visualLine - 1] || '';
    const visualCh = Math.min(curs.ch, Math.max(lineContent.length, 1));
    
    // Calculate approximate percentages for floating effect
    const topPct = (visualLine / totalLines) * 80 + 10; // offset bounds
    const maxCh = Math.max(...lines.map(l => l.length), 30);
    const leftPct = (visualCh / maxCh) * 85 + 5;
    
    const node = document.createElement('div');
    node.className = `cursor-node`;
    node.id = `cursor-${curs.name.replace(/\s+/g, '-')}`;
    node.setAttribute('style', `top: ${topPct}%; left: ${leftPct}%; --cursor-color: ${curs.color}`);
    
    node.innerHTML = `
      <div class="cursor-pointer"></div>
      <div class="cursor-flag">${escapeHTML(curs.name)}</div>
    `;
    cursorsLayer.appendChild(node);
  });
}

// Intermittently animate cursors hovering around code blocks to simulate multiplayer coding
function animateCollaboratorCursors() {
  if (cursorIntervalId) clearInterval(cursorIntervalId);
  
  cursorIntervalId = setInterval(() => {
    if (!currentSessionData || currentSessionData.isTakeoverActive) return;
    
    // Drift other players' cursors randomly by ±2 columns/lines
    const containerWidth = cursorsLayer.clientWidth;
    const containerHeight = cursorsLayer.clientHeight;
    
    currentSessionData.cursors.forEach(curs => {
      const el = document.getElementById(`cursor-${curs.name.replace(/\s+/g, '-')}`);
      if (!el) return;
      
      const parts = el.style.top.split('%');
      const topFloat = parseFloat(parts[0]);
      const leftFloat = parseFloat(el.style.left.split('%')[0]);
      
      // Introduce subtle organic micro-drifts
      const dTop = (Math.random() - 0.5) * 4;
      const dLeft = (Math.random() - 0.5) * 6;
      
      const finalTop = Math.max(5, Math.min(topFloat + dTop, 90));
      const finalLeft = Math.max(5, Math.min(leftFloat + dLeft, 90));
      
      el.style.top = `${finalTop}%`;
      el.style.left = `${finalLeft}%`;
    });
  }, 1200);
}

// Send Message Handler
async function handleSendMessage(e) {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  
  messageInput.value = '';
  
  try {
    const res = await fetch(`/api/sessions/${currentSessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: "You (Co-Author)",
        text: text,
        triggerAgent: true
      })
    });
    
    if (res.ok) {
      const session = await res.json();
      currentSessionData = session;
      renderTimeline(session.messages);
      if (session.fileContent) {
        codeTextarea.value = session.fileContent;
      }
      scrollToBottom();
    }
  } catch (err) {
    console.error("Error sending message:", err);
  }
}

// Deploy New Multiplayer Agent Form submit
async function handleDeployAgent(e) {
  e.preventDefault();
  
  const name = document.getElementById('agent-name').value.trim();
  const persona = document.getElementById('agent-persona').value;
  const repository = document.getElementById('context-url').value.trim();
  const access = document.getElementById('team-access').value;
  
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, persona, repository, access })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      alert(`Deployment failed: ${errData.error || "Internal Error"}`);
      return;
    }
    
    const newSession = await res.json();
    
    // Clear Form & Display success banner toast
    deployForm.reset();
    successBanner.classList.remove('hidden');
    
    // Save target session ID for redirection button
    goToSessionBtn.setAttribute('data-target', newSession.id);
    
    // Refresh sidebar list
    fetchSessions(false);
    
  } catch (err) {
    console.error("Error creating session:", err);
    alert("Connection to server failed. Session could not be launched.");
  }
}

// Go to Live Session action
function enterLiveCanvas() {
  const targetId = goToSessionBtn.getAttribute('data-target');
  if (targetId) {
    successBanner.classList.add('hidden');
    loadSession(targetId);
  }
}

// Handout Takeover Override Signal
async function triggerTakeover() {
  if (!currentSessionId) return;
  
  try {
    const res = await fetch(`/api/sessions/${currentSessionId}/takeover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: "You" })
    });
    
    if (res.ok) {
      const session = await res.json();
      currentSessionData = session;
      
      // Instantly refresh editor content view
      codeTextarea.value = session.fileContent;
      pollActiveSession(true);
      
      if (session.isTakeoverActive) {
        codeTextarea.focus();
      }
    }
  } catch (err) {
    console.error("Takeover trigger failed:", err);
  }
}

// Synchronize keyboard direct code editing in Takeover Lock mode
async function syncUserCode() {
  if (!currentSessionId || !currentSessionData || !currentSessionData.isTakeoverActive) return;
  
  const currentCode = codeTextarea.value;
  try {
    await fetch(`/api/sessions/${currentSessionId}/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: currentCode })
    });
    lastCodeHash = hashString(currentCode);
    
    // Send background position cursor update
    await fetch(`/api/sessions/${currentSessionId}/cursors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "You",
        color: "#00E5FF",
        line: codeTextarea.value.slice(0, codeTextarea.selectionStart).split("\n").length,
        ch: codeTextarea.selectionStart - codeTextarea.value.lastIndexOf("\n", codeTextarea.selectionStart - 1),
        file: currentSessionData.fileName
      })
    });
  } catch (err) {
    console.error("Failed to sync direct user code edits:", err);
  }
}

// Signal Direct Mental Redirection
async function handleRedirectSignal(e) {
  e.preventDefault();
  const selectSession = document.getElementById('redirect-session-select').value;
  const directiveText = redirectDirective.value.trim();
  
  if (!selectSession || !directiveText) {
    alert("Please choose a target workspace and specify the interrupt instructions.");
    return;
  }
  
  try {
    const res = await fetch(`/api/sessions/${selectSession}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: "Tech Lead Override",
        text: `🚨 [DIRECTIVE OVERRIDE] Interrupting current process to: "${directiveText}"`,
        triggerAgent: true
      })
    });
    
    if (res.ok) {
      redirectDirective.value = '';
      alert("Mental signal successfully injected into active agent session context. Live updates redirected.");
      loadSession(selectSession);
    }
  } catch (err) {
    console.error("Redirect brainstorm failed:", err);
  }
}

// Helpers
function scrollToBottom() {
  messageStreamBox.scrollTop = messageStreamBox.scrollHeight;
}

function debounce(func, delay) {
  let inDebounce;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  }
}

function hashString(str) {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
