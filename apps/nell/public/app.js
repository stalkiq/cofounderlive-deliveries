// Application State Handler
let currentAppState = null;

// DOM Elements
const elements = {
  activeChapterName: document.getElementById('activeChapterName'),
  socraticSparkValue: document.getElementById('socraticSparkValue'),
  socraticSparkBar: document.getElementById('socraticSparkBar'),
  conceptsMasteredValue: document.getElementById('conceptsMasteredValue'),
  hoursEngagedValue: document.getElementById('hoursEngagedValue'),
  
  dialogueStream: document.getElementById('dialogueStream'),
  dialogueForm: document.getElementById('dialogueForm'),
  dialogueInput: document.getElementById('dialogueInput'),
  
  inquiriesList: document.getElementById('inquiriesList'),
  
  moralCompassState: document.getElementById('moralCompassState'),
  activeLearningFocus: document.getElementById('activeLearningFocus'),
  timelineContainer: document.getElementById('timelineContainer'),
  
  inscribeForm: document.getElementById('inscribeForm'),
  interestField: document.getElementById('interestField'),
  skillField: document.getElementById('skillField'),
  milestoneField: document.getElementById('milestoneField'),
  
  successOverlay: document.getElementById('successOverlay'),
  successCloseBtn: document.getElementById('successCloseBtn'),
  resetBtn: document.getElementById('resetBtn')
};

// Start Setup on Windows Load
window.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  fetchAppState();
  setupEventHandlers();
});

/**
 * Configure Sidebar Tab Navigation
 */
function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active classes
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      // Add active state to selected
      tab.classList.add('active');
      const targetId = `tab-${tab.getAttribute('data-tab')}`;
      document.getElementById(targetId).classList.add('active');

      // If switching to Primer, scroll dialogue automatically
      if (tab.getAttribute('data-tab') === 'primer') {
        scrollToBottom(elements.dialogueStream);
      }
    });
  });
}

/**
 * Configure Forms and Actions
 */
function setupEventHandlers() {
  // Socratic Dialogue Response Submission
  elements.dialogueForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = elements.dialogueInput.value.trim();
    if (!msg) return;

    // optimist rendering
    appendLocalChildMessage(msg);
    elements.dialogueInput.value = '';
    scrollToBottom(elements.dialogueStream);

    setDialogueLoading(true);

    try {
      const response = await fetch('/api/dialogue/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await response.json();
      if (data.success) {
        updateDOM(data.state);
        // Highlight active inquiries or let child know if they solved
        if (data.assessment && data.assessment.inquirySolved) {
          playSolveSoundEffect();
        }
      } else {
        alert("Nell's wisdom was obscured: " + data.error);
      }
    } catch (err) {
      console.error("Error sending response to Nell:", err);
    } finally {
      setDialogueLoading(false);
    }
  });

  // Parent Inscribe Form Submission
  elements.inscribeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const interest = elements.interestField.value.trim();
    const skill = elements.skillField.value;
    const milestone = elements.milestoneField.value.trim();

    const submitBtn = document.getElementById('inscribeSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = "Weaving new world into parchment...";

    try {
      const response = await fetch('/api/inscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interest, cognitiveSkill: skill, milestone })
      });
      const data = await response.json();
      if (data.success) {
        updateDOM(data.state);
        // Display beautiful parchment overlay
        elements.successOverlay.classList.remove('hidden');
      } else {
        alert("Failed to inscribe: " + data.error);
      }
    } catch (err) {
      console.error("Inscribe submission error:", err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Inscribe into the Primer";
    }
  });

  // Close Success Overlay and head back to book screen
  elements.successCloseBtn.addEventListener('click', () => {
    elements.successOverlay.classList.add('hidden');
    // Force transition to Primer tab
    document.querySelector('[data-tab="primer"]').click();
  });

  // Database Reset Button
  elements.resetBtn.addEventListener('click', async () => {
    if (!confirm("Are you sure you want to restore original default settings on the parchment? All current dialogue chapters and ledger metrics will reload.")) return;
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        updateDOM(data.state);
        elements.dialogueInput.value = '';
        alert("Sandboxed state recovered successfully.");
      }
    } catch (err) {
      console.error("Failed to restore default state:", err);
    }
  });
}

/**
 * Fetch Current State from Durable Express Server
 */
async function fetchAppState() {
  try {
    const response = await fetch('/api/state');
    const state = await response.json();
    updateDOM(state);
  } catch (err) {
    console.error("Failed to fetch initial application state:", err);
    elements.dialogueStream.innerHTML = `<div class="loading-spinner" style="color: #ff6b6b">Could not establish contact with Nell's library. Please verify the server is running.</div>`;
  }
}

/**
 * Bind current memory parameters into user interface
 */
function updateDOM(state) {
  currentAppState = state;

  // Bind Metrics Header
  elements.activeChapterName.textContent = state.activeChapter;
  elements.socraticSparkValue.textContent = `${state.socraticSpark}%`;
  elements.socraticSparkBar.style.width = `${state.socraticSpark}%`;
  elements.conceptsMasteredValue.textContent = state.conceptsMastered;
  elements.hoursEngagedValue.textContent = `${state.hoursEngaged}h`;

  // Bind Ledgers metadata summaries
  elements.moralCompassState.textContent = state.moralCompass || "Altruistic";
  // Determine current focus by checking the latest inscription
  const activeFocus = state.inscriptions?.[0]?.cognitiveSkill || "Socratic Logic";
  elements.activeLearningFocus.textContent = activeFocus;

  // Render Sub-Sections
  renderDialogue(state.dialogue);
  renderInquiries(state.inquiries);
  renderLedger(state.ledger);
}

/**
 * Dynamic Renderers
 */
function renderDialogue(dialogue) {
  elements.dialogueStream.innerHTML = '';
  
  if (!dialogue || dialogue.length === 0) {
    elements.dialogueStream.innerHTML = '<div class="loading-spinner">Parchment is blank. Seed a new chapter in context!</div>';
    return;
  }

  dialogue.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', msg.role);
    
    // Support markdown newlines/spacing roughly
    const textHtml = msg.text.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
    bubble.innerHTML = textHtml;

    // Timestamp subtitle
    const metaSpan = document.createElement('span');
    metaSpan.classList.add('chat-meta');
    metaSpan.textContent = formatFriendlyTime(msg.timestamp);
    bubble.appendChild(metaSpan);

    elements.dialogueStream.appendChild(bubble);
  });

  scrollToBottom(elements.dialogueStream);
}

function renderInquiries(inquiries) {
  elements.inquiriesList.innerHTML = '';

  if (!inquiries || inquiries.length === 0) {
    elements.inquiriesList.innerHTML = '<div style="color: rgba(244,239,230,0.4); text-align: center; font-style: italic;">No inquiries open.</div>';
    return;
  }

  inquiries.forEach(inq => {
    const card = document.createElement('div');
    card.classList.add('inquiry-item');
    if (inq.status === 'Active Inquiry') card.classList.add('active');

    const stateClass = inq.status === 'Active Inquiry' ? 'active-status' : 'solved-status';

    card.innerHTML = `
      <div class="inquiry-status-row">
        <span class="inquiry-meta">${inq.meta || 'Chapter concept'}</span>
        <span class="inquiry-status-badge ${stateClass}">${inq.status}</span>
      </div>
      <h4>${inq.title}</h4>
      <p>${inq.detail}</p>
      ${inq.status === 'Solved' ? `<span class="solved-stamp">✔ Mastered Response: "${inq.value}"</span>` : ''}
    `;

    elements.inquiriesList.appendChild(card);
  });
}

function renderLedger(ledger) {
  elements.timelineContainer.innerHTML = '';

  if (!ledger || ledger.length === 0) {
    elements.timelineContainer.innerHTML = '<p style="color: rgba(244,239,230,0.4); font-style: italic;">The chronicler is sleeping. No milestones entered yet.</p>';
    return;
  }

  ledger.forEach(node => {
    const entry = document.createElement('div');
    const isMastered = node.status === 'Mastered';
    const isRecorded = node.status === 'Recorded';
    const nodeClass = isMastered ? 'mastered' : 'in-progress';
    const markerChar = isMastered ? '✦' : (isRecorded ? '✔' : '✒');
    
    entry.classList.add('timeline-node', nodeClass);

    entry.innerHTML = `
      <div class="timeline-marker">${markerChar}</div>
      <div class="timeline-card">
        <div class="timeline-header-row">
          <span class="timeline-category">${node.status}</span>
          <span class="timeline-time">${node.meta || 'Today'}</span>
        </div>
        <h3>${node.title}</h3>
        <p>${node.detail}</p>
        ${node.value ? `<span class="achievement-val">Inscribed Solution: "${node.value}"</span>` : ''}
      </div>
    `;

    elements.timelineContainer.appendChild(entry);
  });
}

/**
 * Helper Utilities
 */
function appendLocalChildMessage(text) {
  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble', 'child');
  bubble.innerHTML = text.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
  
  const label = document.createElement('span');
  label.classList.add('chat-meta');
  label.textContent = "Writing...";
  bubble.appendChild(label);
  
  elements.dialogueStream.appendChild(bubble);
}

function setDialogueLoading(isLoading) {
  if (isLoading) {
    const bubble = document.createElement('div');
    bubble.id = 'dialogueBubbleLoader';
    bubble.classList.add('chat-bubble', 'nell');
    bubble.innerHTML = `<em style="color: rgba(244,239,230,0.5);">Nell is listening and formulating a Socratic response through the ink...</em>`;
    elements.dialogueStream.appendChild(bubble);
    scrollToBottom(elements.dialogueStream);
  } else {
    const loader = document.getElementById('dialogueBubbleLoader');
    if (loader) loader.remove();
  }
}

function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

function formatFriendlyTime(isoString) {
  if (!isoString) return "Recently";
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  
  // simple calendar format helper
  if (diffHrs < 48) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function playSolveSoundEffect() {
  // Gentle high-pitch sine audio notification to let kids know a milestone registered
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (err) {
    // browser blocked audio or not supported, ignore gracefully
  }
}
