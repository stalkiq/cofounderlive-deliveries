// Global Application State Holds
let activeSessionId = "dev-agent-refactor";
let sessionsCache = [];

// DOM Element Selectors
const sessionsList = document.getElementById("sessions-list");
const activeCanvasTitle = document.getElementById("active-canvas-title");
const sessionStatusBadge = document.getElementById("session-status-badge");
const liveCodeArea = document.getElementById("live-code-area");
const takeoverBtn = document.getElementById("takeover-btn");
const eventsStreamList = document.getElementById("events-stream-list");
const commentForm = document.getElementById("comment-form");
const commentInput = document.getElementById("comment-input");
const launchForm = document.getElementById("launch-session-form");
const activeHumansCount = document.querySelector(".metric-value.text-accent");
const promptForm = document.getElementById("agent-prompt-form");
const promptInput = document.getElementById("prompt-input");
const promptBtn = document.getElementById("prompt-btn");
const agentStatusLabel = document.querySelector(".agent-status");

// Simulated Multiplayer Cursors
const pmCursor = document.querySelector(".cursor-magenta");
const devCursor = document.querySelector(".cursor-indigo");
const agentCursor = document.getElementById("agent-cursor");

// Tab setup
const tabs = document.querySelectorAll(".pane-tab");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tc => t.classList.remove("active"));
    
    tab.classList.add("active");
    const targetTab = "tab-" + tab.getAttribute("data-tab");
    document.getElementById(targetTab).classList.add("active");
  });
});

// App Initialization
window.addEventListener("DOMContentLoaded", () => {
  fetchSessions();
  // Move simulated user cursors subtle coordinates to make page feel live
  setInterval(jitterCursors, 4000);
});

// Fetch all active sessions
async function fetchSessions() {
  try {
    const res = await fetch("/api/sessions");
    if (!res.ok) throw new Error("Database offline");
    const sessions = await res.json();
    sessionsCache = sessions;
    
    // Check if current active session exists, else select first from list
    if (sessions.length > 0) {
      const activeExists = sessions.find(s => s.id === activeSessionId);
      if (!activeExists) activeSessionId = sessions[0].id;
    }
    
    renderSessionsList();
    renderActiveSessionDetail();
  } catch (err) {
    console.error("Error fetching sessions:", err);
    sessionsList.innerHTML = `<div class="loading-spinner text-accent">Offline: Run server.js locally.</div>`;
  }
}

// Render left sidebar sessions list
function renderSessionsList() {
  if (sessionsCache.length === 0) {
    sessionsList.innerHTML = `<div class="loading-spinner">No active sessions. Create one above!</div>`;
    return;
  }
  
  sessionsList.innerHTML = "";
  sessionsCache.forEach(session => {
    const item = document.createElement("div");
    item.className = `session-row-item ${session.id === activeSessionId ? 'active' : ''}`;
    item.onclick = () => selectSession(session.id);
    
    const formattedDate = new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    item.innerHTML = `
      <div class="session-row-header">
        <span class="session-row-title">#${session.id}</span>
        <span class="session-row-badge">${session.status}</span>
      </div>
      <div class="session-row-meta">${session.agentPersona.split(' ')[0]}</div>
      <div class="session-row-meta" style="color: var(--primary-color)">${session.contextUrl}</div>
    `;
    sessionsList.appendChild(item);
  });
}

// Click callback to change active workspace
function selectSession(id) {
  activeSessionId = id;
  renderSessionsList();
  renderActiveSessionDetail();
}

// Render right multiplayer pane details based on activeSessionId
function renderActiveSessionDetail() {
  const session = sessionsCache.find(s => s.id === activeSessionId);
  if (!session) return;
  
  // Header details + code contents
  activeCanvasTitle.innerText = `Active Canvas: #${session.id}`;
  sessionStatusBadge.innerText = session.status;
  
  if (session.status === "Manual Takeover") {
    sessionStatusBadge.className = "mode-badge takeover";
    takeoverBtn.innerHTML = `<span class="btn-icon">🔓</span> Release Control to Agent`;
    takeoverBtn.className = "btn btn-primary";
    liveCodeArea.readOnly = false; // Unleash developer keyboard inside text area
    liveCodeArea.style.opacity = "1";
    liveCodeArea.style.border = "1px dashed var(--accent-color)";
  } else {
    sessionStatusBadge.className = "mode-badge";
    takeoverBtn.innerHTML = `<span class="btn-icon">⚡</span> Takeover Agent (ESC)`;
    takeoverBtn.className = "btn btn-accent btn-pulse";
    liveCodeArea.readOnly = false; // Always editable for simulation, but stylized nicely
    liveCodeArea.style.opacity = "0.9";
    liveCodeArea.style.border = "none";
  }
  
  liveCodeArea.value = session.code;
  
  // Render timeline logs
  renderEventsTimeline(session.events);
}

// Convert events into clean styled nodes
function renderEventsTimeline(events) {
  if (!events || events.length === 0) {
    eventsStreamList.innerHTML = `<p class="loading-spinner">No workspace events logged yet.</p>`;
    return;
  }
  
  eventsStreamList.innerHTML = "";
  events.forEach(evt => {
    const div = document.createElement("div");
    div.className = "timeline-item";
    
    // Determine badge style
    let badgeClass = "badge-system";
    if (evt.status === "Human") badgeClass = "badge-human";
    if (evt.status === "Agent") badgeClass = "badge-agent";
    if (evt.status === "Interactive Action") badgeClass = "badge-interactive";
    
    // Simple markdown highlighting for output code Blocks
    let formattedDetail = escapeHTML(evt.detail);
    formattedDetail = formattedDetail.replace(/```(?:python|javascript|js)?\n([\s\S]*?)```/g, '<pre>$1</pre>');
    formattedDetail = formattedDetail.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedDetail = formattedDetail.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    div.innerHTML = `
      <div class="item-header">
        <span class="item-title">${escapeHTML(evt.title)}</span>
        <div>
          <span class="item-source-badge ${badgeClass}">${evt.status}</span>
          <span class="item-meta">${evt.meta || ''}</span>
        </div>
      </div>
      <div class="item-payload">${formattedDetail}</div>
    `;
    eventsStreamList.appendChild(div);
  });
  
  // Auto-scroll timeline to active bottom
  eventsStreamList.scrollTop = eventsStreamList.scrollHeight;
}

// Escape HTML utility
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// -------------------------------------------------------------
// POSTS & MUTATIONS (Durable Memory interaction)
// -------------------------------------------------------------

// Post new collaborative comments
commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = commentInput.value.trim();
  if (!text) return;
  
  try {
    const res = await fetch(`/api/sessions/${activeSessionId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Alex (Dev) posted comment",
        detail: `[Alex (Dev) Cursor] commented: '${text}'`,
        status: "Human",
        value: "Active"
      })
    });
    
    if (res.ok) {
      commentInput.value = "";
      await fetchSessions(); // Re-fetch all and sync
    }
  } catch (err) {
    console.error("Failed to post comment:", err);
  }
});

// Post form launch session
launchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const agentPersona = document.getElementById("agent-persona").value;
  const contextUrl = document.getElementById("context-url").value.trim();
  const teamAccess = document.getElementById("team-access").value;
  
  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentPersona, contextUrl, teamAccess })
    });
    
    if (res.ok) {
      const newSession = await res.json();
      activeSessionId = newSession.id;
      // Reset input layout default
      document.getElementById("context-url").value = "github.com/co-op/";
      
      // Navigate browser back to Live Workspace Logs timeline
      document.querySelector(".pane-tab[data-tab='timeline']").click();
      
      await fetchSessions();
    }
  } catch (err) {
    console.error("Failed to launch new session:", err);
  }
});

// Takeover Toggle POST Click
takeoverBtn.addEventListener("click", triggerTakeover);

// Support ESC key shortcut for direct manual human takeover intervention
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    triggerTakeover();
  }
});

async function triggerTakeover() {
  try {
    const res = await fetch(`/api/sessions/${activeSessionId}/takeover`, { method: "POST" });
    if (res.ok) {
      await fetchSessions();
    }
  } catch (err) {
    console.error("Error executing takeover toggle:", err);
  }
}

// Local live code editing key up auto-logs/updates code data model
liveCodeArea.addEventListener("input", debounce(async () => {
  const currentCode = liveCodeArea.value;
  // Silently post event updating base codebase contents
  try {
    await fetch(`/api/sessions/${activeSessionId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Human updated workspace file",
        detail: `Co-author manually edited code block. Check active lines.`,
        status: "Human",
        value: "Editing"
      })
    });
    // Store current state also back to session's core block
    // Rather than separate endpoint, we can do it during prompt workspace save
  } catch (err) {
    console.error("Silent code sync failed", err);
  }
}, 3000));

// Prompt DevAgent Action Form
promptForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = promptInput.value.trim();
  const currentCode = liveCodeArea.value;
  if (!prompt) return;

  // Turn prompt interface into progress loader
  promptBtn.disabled = true;
  promptBtn.innerText = "DevAgent-3 thinking & drafting...";
  agentStatusLabel.innerText = "Executing steps & co-authoring...";
  agentStatusLabel.style.color = "var(--accent-color)";
  
  // Transition automatically to workspace timeline log to see output stream
  document.querySelector(".pane-tab[data-tab='timeline']").click();

  try {
    const res = await fetch(`/api/sessions/${activeSessionId}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, userCode: currentCode })
    });

    if (res.ok) {
      promptInput.value = "";
      await fetchSessions();
    }
  } catch (err) {
    console.error("Error prompting agent:", err);
  } finally {
    promptBtn.disabled = false;
    promptBtn.innerText = "Send Prompt to Agent Brain";
    agentStatusLabel.innerText = "Awaiting instruction...";
    agentStatusLabel.style.color = "var(--primary-color)";
  }
});

// Trigger suggestions directly into control room form
function quickPrompt(text) {
  // Switch to the control room tab
  document.querySelector(".pane-tab[data-tab='control-room']").click();
  promptInput.value = text;
  promptInput.focus();
}

// -------------------------------------------------------------
// HIGHEST QUALITY INTERACTIVE DETAIL SIMULATIONS (Cursors Jitter)
// -------------------------------------------------------------
function jitterCursors() {
  if (Math.random() > 0.3) {
    // Jitter PM Sarah cursor
    const x = Math.floor(Math.random() * 300) + 50;
    const y = Math.floor(Math.random() * 150) + 40;
    pmCursor.style.transform = `translate(${x}px, ${y}px)`;
  }
  
  if (Math.random() > 0.4) {
    // Jitter Engineer Alex cursor
    const x = Math.floor(Math.random() * 320) + 200;
    const y = Math.floor(Math.random() * 180) + 120;
    devCursor.style.transform = `translate(${x}px, ${y}px)`;
  }

  // Jitter agent cursor around active text edit ranges
  if (Math.random() > 0.5) {
    const x = Math.floor(Math.random() * 250) + 100;
    const y = Math.floor(Math.random() * 100) + 80;
    agentCursor.style.transform = `translate(${x}px, ${y}px)`;
  }
  
  // Randomly adjust online human counts dynamically inside the KPIs (eg. 3-4 users)
  const currentHumans = parseInt(activeHumansCount.innerText);
  const nextHumans = Math.random() > 0.5 ? (currentHumans === 3 ? 4 : 3) : currentHumans;
  activeHumansCount.innerText = nextHumans;
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
