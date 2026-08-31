// ==========================================================================
// KOLEKTIF - INTERACTIVE CLIENT CONTROLLER (OFFLINE-FIRST DESIGN)
// ==========================================================================

// Seed data from the product specification
const SEED_ALERTS = [
  {
    id: "seed_1",
    category: "Dlo / Manje (Water / Food)",
    location: "Place Saint-Pierre, Pétion-Ville",
    description: "Distribisyon Dlo (Water Distribution): Safe drinking water available at Place Saint-Pierre. Organized by local youth committee.",
    contact: "+509 3888-2233",
    status: "Active Now",
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hr ago
    meta: "Pétion-Ville",
    value: "Free"
  },
  {
    id: "seed_2",
    category: "Sekirite / Wout (Security / Road Block)",
    location: "Avenue Delmas 31, Delmas",
    description: "Wout Bloke (Road Blockage): Debris blocking main passage near Avenue Delmas 31. Avoid transit.",
    contact: "N/A",
    status: "Urgent",
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hrs ago
    meta: "Delmas",
    value: "Avoid"
  },
  {
    id: "seed_3",
    category: "Sante / Medikal (Health / Medical)",
    location: "Rue Capois, Champ de Mars",
    description: "Sant Sante Louvri (Health Clinic Open): First-aid and basic triage operating with limited staff at Rue Capois.",
    contact: "#222 (Kout)",
    status: "Verified",
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 24 hrs ago
    meta: "Champ de Mars",
    value: "Medical"
  }
];

// App State
const state = {
  activeScreen: 'screen-onboarding',
  onboarded: false,
  username: 'Jean-Pierre Laguerre',
  userrole: 'Animatè Kominotè',
  userzone: 'Delmas',
  syncQueue: [], // Offline queue
  lowBandwidth: false
};

// DOM References
const bodyEl = document.body;
const btnCompleteOnboarding = document.getElementById('btn-complete-onboarding');
const inputOnboardName = document.getElementById('onboard-name');
const selectOnboardRole = document.getElementById('onboard-role');
const selectOnboardZone = document.getElementById('onboard-zone');
const bandwidthToggle = document.getElementById('bandwidth-toggle');
const lowBandwidthBanner = document.getElementById('low-bandwidth-banner');

const navTabs = document.querySelectorAll('.nav-tab');
const bottomNav = document.querySelector('.bottom-nav');
const screens = document.querySelectorAll('.screen');

// Sync & Metrics References
const btnManualSync = document.getElementById('btn-manual-sync');
const syncStatusText = document.getElementById('sync-status');
const networkLED = document.getElementById('network-led');
const valActiveAlertsCount = document.getElementById('val-active-alerts');
const queuePendingCountBadge = document.getElementById('queue-pending-count');

// Feed References
const alertsListContainer = document.getElementById('alerts-list-container');

// Compressor References
const btnCompressDraft = document.getElementById('btn-compress-draft');
const rawReportInput = document.getElementById('raw-report-input');
const compressionResultCard = document.getElementById('compression-result-card');
const resultSavingPct = document.getElementById('result-saving-pct');
const compressedTextView = document.getElementById('compressed-text');
const resultCharCount = document.getElementById('result-char-count');
const counterStatus = document.getElementById('counter-status');
const btnCopySMS = document.getElementById('btn-copy-sms');
const btnQueueFromCompressor = document.getElementById('btn-queue-from-compressor');
const tagSelectors = document.querySelectorAll('.tag-selector');

// Report View References
const formNewReport = document.getElementById('form-new-report');
const reportCategory = document.getElementById('report-category');
const reportLocation = document.getElementById('report-location');
const reportDescription = document.getElementById('report-description');
const reportContact = document.getElementById('report-contact');
const reportSuccessPane = document.getElementById('report-success-pane');
const btnBackToFeed = document.getElementById('btn-back-to-feed');
const btnAnotherReport = document.getElementById('btn-another-report');

// Settings & Debug References
const settingsUserName = document.getElementById('settings-user-name');
const settingsUserRole = document.getElementById('settings-user-role');
const btnResetOnboarding = document.getElementById('btn-reset-onboarding');
const btnRefreshMemoryDebug = document.getElementById('btn-refresh-memory-debug');
const jsonMemoryViewer = document.getElementById('json-memory-viewer');
const debugRecordCount = document.getElementById('debug-record-count');

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initLocalStorage();
  setupClickHandlers();
  checkOnboarding();
  refreshFeedAlerts();
  checkOnlineStatus();
});

// Load preferences and queue
function initLocalStorage() {
  // Low bandwidth state
  const cachedLB = localStorage.getItem('kolektif_low_bandwidth') === 'true';
  state.lowBandwidth = cachedLB;
  bandwidthToggle.checked = cachedLB;
  toggleLowBandwidthLayout(cachedLB);

  // Sync queue
  const cachedQueue = localStorage.getItem('kolektif_sync_queue');
  if (cachedQueue) {
    try {
      state.syncQueue = JSON.parse(cachedQueue);
    } catch(e) {
      state.syncQueue = [];
    }
  }
  updateQueueBadge();

  // User Profile
  if (localStorage.getItem('kolektif_user_name')) {
    state.username = localStorage.getItem('kolektif_user_name');
    state.userrole = localStorage.getItem('kolektif_user_role') || 'Animatè Kominotè';
    state.userzone = localStorage.getItem('kolektif_user_zone') || 'Delmas';
  }
}

// ==========================================================================
// NAVIGATION CONTROLLERS
// ==========================================================================
function switchScreen(screenId) {
  // Hide all screens
  screens.forEach(s => s.classList.add('hidden'));
  
  // Show target screen
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.remove('hidden');
    state.activeScreen = screenId;
  }

  // Update Navigation Active tab state
  navTabs.forEach(tab => {
    if (tab.getAttribute('data-target') === screenId) {
      tab.classList.add('active-tab');
    } else {
      tab.classList.remove('active-tab');
    }
  });

  // Action hook on navigation switches
  if (screenId === 'screen-feed') {
    refreshFeedAlerts();
  } else if (screenId === 'screen-settings') {
    refreshMemoryDebugList();
    syncQueueToServer();
  }
}

function checkOnboarding() {
  const done = localStorage.getItem('kolektif_onboarding_done') === 'true';
  state.onboarded = done;

  if (done) {
    // Hide Onboarding Screen, show Feed
    bottomNav.classList.remove('hidden');
    switchScreen('screen-feed');
  } else {
    // Force Onboarding Flow
    bottomNav.classList.add('hidden');
    switchScreen('screen-onboarding');
  }
}

// ==========================================================================
// LOW-BANDWIDTH CONTROLLER
// ==========================================================================
bandwidthToggle.addEventListener('change', (e) => {
  const active = e.target.checked;
  state.lowBandwidth = active;
  localStorage.setItem('kolektif_low_bandwidth', active);
  toggleLowBandwidthLayout(active);
});

function toggleLowBandwidthLayout(isActive) {
  if (activeScreenIsOnboarding() && !state.onboarded) {
    // Do not enforce heavy banner yet
  }

  if (isActive) {
    bodyEl.classList.add('low-bandwidth-active');
    lowBandwidthBanner.classList.remove('hidden');
  } else {
    bodyEl.classList.remove('low-bandwidth-active');
    lowBandwidthBanner.classList.add('hidden');
  }
}

function activeScreenIsOnboarding() {
  return state.activeScreen === 'screen-onboarding';
}

// ==========================================================================
// INTERACTIVE HANDLERS (ONBOARDING, FORMS, TRANSITIONS)
// ==========================================================================
function setupClickHandlers() {
  // Complete Onboarding
  btnCompleteOnboarding.addEventListener('click', () => {
    const name = inputOnboardName.value.trim();
    if (!name) {
      alert("Tanpri antre yon non oswa kontak pou pwofil la.");
      return;
    }

    state.username = name;
    state.userrole = selectOnboardRole.value;
    state.userzone = selectOnboardZone.value;

    localStorage.setItem('kolektif_user_name', state.username);
    localStorage.setItem('kolektif_user_role', state.userrole);
    localStorage.setItem('kolektif_user_zone', state.userzone);
    localStorage.setItem('kolektif_onboarding_done', 'true');
    
    state.onboarded = true;

    // Transition smoothly
    bottomNav.classList.remove('hidden');
    switchScreen('screen-feed');

    // Display welcome text
    showToast(`Pwofil sove! Byenveni ${state.username} (${state.userrole})`);
  });

  // Reset Onboarding Button
  btnResetOnboarding.addEventListener('click', () => {
    if (confirm("Èske ou vle efase pwofil la ak tout sa ki kach sou telefòn lan?")) {
      localStorage.clear();
      state.syncQueue = [];
      initLocalStorage();
      checkOnboarding();
    }
  });

  // Bottom Navigation tab clicks
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetScreen = tab.getAttribute('data-target');
      switchScreen(targetScreen);
    });
  });

  // Manual Sync trigger
  btnManualSync.addEventListener('click', () => {
    showToast("Ap senkronize...");
    syncQueueToServer();
  });

  // Quick Compressor suggestions tags
  tagSelectors.forEach(tag => {
    tag.addEventListener('click', () => {
      rawReportInput.value = tag.getAttribute('data-text');
      showToast("Egzanp chaje!");
    });
  });

  // Trigger compression simulation API
  btnCompressDraft.addEventListener('click', handleCompressDraft);

  // Copy compressed text to clipboard
  btnCopySMS.addEventListener('click', () => {
    const txt = compressedTextView.innerText;
    navigator.clipboard.writeText(txt).then(() => {
      showToast("📋 Kopye nan clipboard!");
    }).catch(err => {
      // Fallback
      alert("Mesaj: " + txt);
    });
  });

  // Transfer compressor output to report page
  btnQueueFromCompressor.addEventListener('click', () => {
    const txt = compressedTextView.innerText;
    
    // Auto populate the form fields
    reportCategory.value = "Sekirite / Wout (Security / Road Block)";
    reportLocation.value = "Pòtoprens, Ayiti";
    reportDescription.value = txt;
    reportContact.value = "";

    // Switch tab to Rapòte
    switchScreen('screen-report');
    showToast("📝 Chaje nan fòm nan!");
  });

  // Submit new report
  formNewReport.addEventListener('submit', handleNewReportSubmit);

  // Success button screens
  btnBackToFeed.addEventListener('click', () => {
    resetReportForm();
    switchScreen('screen-feed');
  });

  btnAnotherReport.addEventListener('click', () => {
    resetReportForm();
  });

  // Debug settings view log refreshing
  btnRefreshMemoryDebug.addEventListener('click', () => {
    refreshMemoryDebugList();
    showToast("Rasin Done yo mete a jou!");
  });
}

// ==========================================================================
// SIMULATE NETWORK SIGNAL / ONLINE STATUS DETECTION
// ==========================================================================
function checkOnlineStatus() {
  const isOnline = navigator.onLine;
  if (isOnline) {
    networkLED.className = 'led-indicator pulse-green';
    syncStatusText.innerText = "Siyal rezo 2G/WiFi OK. Tout done mwayen ak kat senkronize.";
  } else {
    networkLED.className = 'led-indicator pulse-yellow';
    syncStatusText.innerText = "Rezo Koupe ⚠️ Mode Offline Aktif. Nouvo alèt ap kach lokalman.";
  }

  // Auto trigger sync if online status shifts
  window.addEventListener('online', () => {
    networkLED.className = 'led-indicator pulse-green';
    syncStatusText.innerText = "Ki retounen! Ap voye kach alèt yo sove yo...";
    syncQueueToServer();
  });

  window.addEventListener('offline', () => {
    networkLED.className = 'led-indicator pulse-yellow';
    syncStatusText.innerText = "Siyal pedi. Done yo ap kach sou navigatè w-la.";
  });
}

// ==========================================================================
// WORKFLOW HANDLER: SUBMIT / CORE MEMORY
// ==========================================================================
async function handleNewReportSubmit(e) {
  e.preventDefault();

  const category = reportCategory.value;
  const location = reportLocation.value.trim();
  const description = reportDescription.value.trim();
  const contact = reportContact.value.trim() || state.username;

  if (!category || !location || !description) {
    alert("Tanpri ranpli tout jaden ki gen zetwal (*) yo.");
    return;
  }

  // Construct our new offline-first item structure
  const reportItem = {
    id: `local_${Date.now()}`,
    category,
    location,
    description,
    contact,
    timestamp: new Date().toISOString()
  };

  // 1. Caches locally first (Offline-First compliance)
  state.syncQueue.push(reportItem);
  saveQueueToLocalStorage();
  updateQueueBadge();

  // Try direct post sync to /api/memory
  showToast("Ap anrejistre alèt sa...");

  let result = null;
  try {
    const response = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: reportItem.category,
        location: reportItem.location,
        description: reportItem.description,
        contact: reportItem.contact
      })
    });

    result = await response.json();
  } catch (err) {
    console.warn("Server connection failed. Saved locally to sync later.", err);
  }

  // If successfully posted, we can mark or remove it from the local backlog queue immediately
  if (result && result.success) {
    // Succeeded, pull it out of queue
    state.syncQueue = state.syncQueue.filter(x => x.id !== reportItem.id);
    saveQueueToLocalStorage();
    updateQueueBadge();
    
    // Alert the list
    showToast("✅ Senkronize dirèkteman ak Kolektif Command!");
  }

  // Show the custom Success Banner
  formNewReport.classList.add('hidden');
  reportSuccessPane.classList.remove('hidden');

  // Trigger feed alerts recalculation
  refreshFeedAlerts();
}

function resetReportForm() {
  formNewReport.reset();
  formNewReport.classList.remove('hidden');
  reportSuccessPane.classList.add('hidden');
}

function saveQueueToLocalStorage() {
  localStorage.setItem('kolektif_sync_queue', JSON.stringify(state.syncQueue));
}

function updateQueueBadge() {
  const len = state.syncQueue.length;
  queuePendingCountBadge.innerText = `${len} Mwayen Anrejistre (${len === 0 ? 'Senkronize' : 'Offline Queue'})`;
  if (len > 0) {
    queuePendingCountBadge.className = 'badge accent-bg';
  } else {
    queuePendingCountBadge.className = 'badge';
  }
}

// ==========================================================================
// FEED PIPELINE: COMBINE SEEDS AND SERVER MEMORY RECORDS
// ==========================================================================
async function refreshFeedAlerts() {
  let serverAlerts = [];
  try {
    const res = await fetch('/api/memory');
    const body = await res.json();
    if (body && body.data) {
      serverAlerts = body.data;
    }
  } catch (err) {
    console.warn("An kachèt nou paka chaje done yo nan server a, n'ap konte sou lokal.", err);
  }

  // Merge: Local Offline Queue (not synced yet) + Live Server Memory Alerts + Static Seed Alerts
  const queueEntries = state.syncQueue.map(item => ({
    ...item,
    status: "Offline Queue",
    meta: item.location.split(',')[0],
    value: "Offline"
  }));

  const allAlerts = [...queueEntries, ...serverAlerts, ...SEED_ALERTS];

  // Render metrics counts
  valActiveAlertsCount.innerText = allAlerts.length;

  // Build HTMl timeline representation
  if (allAlerts.length === 0) {
    alertsListContainer.innerHTML = `<div class="tap-tap-border-card text-center">Pa gen anyen la pou kounye a. Yo tout pwòp!</div>`;
    return;
  }

  alertsListContainer.innerHTML = allAlerts.map(alert => {
    const isUrgent = alert.status === 'Urgent' || alert.category?.includes('Sekirite') || alert.status === 'Offline Queue';
    const parsedTime = new Date(alert.timestamp).toLocaleTimeString('ht-HT', { hour: '2-digit', minute: '2-digit' }) || 'Dènyèman';
    const displayCategory = alert.category || 'Alèt Kominotè';
    const textStatus = alert.status || 'Verifye';

    return `
      <div class="feed-item ${isUrgent ? 'urgent-item' : ''}" data-id="${alert.id}">
        <div class="feed-item-header">
          <span class="feed-title">${displayCategory}</span>
          <span class="feed-badge ${isUrgent ? 'urgent-badge' : ''}">${textStatus}</span>
        </div>
        <p class="feed-detail">${alert.description}</p>
        <div class="feed-detail-location" style="font-size:0.75rem; font-weight:bold; color:var(--primary); margin-top:2px;">
          📍 ${alert.location}
        </div>
        <div class="feed-item-footer">
          <span>Kontak: ${alert.contact || 'Kolektif'}</span>
          <span class="meta-zone">${alert.meta || parsedTime}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Ensure offline queue is flushed to server when possible
async function syncQueueToServer() {
  if (state.syncQueue.length === 0) {
    showToast("Pa gen anyen pou senkronize!");
    return;
  }

  let successCount = 0;
  const originalQueue = [...state.syncQueue];

  for (const reportItem of originalQueue) {
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: reportItem.category,
          location: reportItem.location,
          description: reportItem.description,
          contact: reportItem.contact
        })
      });
      const d = await response.json();
      if (d && d.success) {
        // Remove from memory state
        state.syncQueue = state.syncQueue.filter(x => x.id !== reportItem.id);
        successCount++;
      }
    } catch (_) {
      break; // Network failed again, pause queue processing
    }
  }

  // Update storage & display UI results
  saveQueueToLocalStorage();
  updateQueueBadge();
  refreshFeedAlerts();

  if (successCount > 0) {
    showToast(`✅ Senkronize ${successCount} nouvo rapò sou rezo a!`);
  } else {
    showToast("⚠️ Rezo poko konekte nèt. Sove jounal ou an sekirite.");
  }
}

// ==========================================================================
// GOOGLE CAPABILITY: SIMULATED GEMINI COMPRESSION ROUTE
// ==========================================================================
async function handleCompressDraft() {
  const textVal = rawReportInput.value.trim();
  if (!textVal) {
    alert("Tanpri bay yon ti tèks long anvan.");
    return;
  }

  showToast("Kolektif SMS Compressor ap kalkile...");

  try {
    const res = await fetch('/api/compress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textVal })
    });
    const data = await res.json();

    if (data && data.success) {
      // Display result box and fill text
      compressionResultCard.classList.remove('hidden');
      compressedTextView.innerText = data.result;
      resultSavingPct.innerText = `Sove ${data.saving} lèt`;
      resultCharCount.innerText = data.compressedLength;

      if (data.compressedLength <= 140) {
        counterStatus.innerText = "✅ Sifas SMS San Safe (<140 Chars)";
        counterStatus.className = "safe-status";
      } else {
        counterStatus.innerText = "⚠️ Depase limit 140 pou SMS!";
        counterStatus.className = "text-accent";
      }
    }
  } catch (err) {
    console.error("Gemini simulation API call lost connection", err);
    // Offline quick fallback translation
    compressionResultCard.classList.remove('hidden');
    const compText = `KOLEKTIF OFF: ${textVal.substring(0, 100)}... (Si siyal fèb, fòse kout)`;
    compressedTextView.innerText = compText;
    resultSavingPct.innerText = `-50% characters (Offline Mock)`;
    resultCharCount.innerText = compText.length;
  }
}

// ==========================================================================
// SYSTEM / DESIGN DATA DEBUG INSPECTOR
// ==========================================================================
async function refreshMemoryDebugList() {
  // Update Profile label card
  settingsUserName.innerText = state.username;
  settingsUserRole.innerText = state.userrole;

  try {
    const res = await fetch('/api/memory');
    const data = await res.json();
    
    // Pretty print the JSON inside the pre block
    jsonMemoryViewer.innerText = JSON.stringify(data, null, 2);
    debugRecordCount.innerText = data.count || 0;
  } catch(e) {
    jsonMemoryViewer.innerText = JSON.stringify({
      error: "Paka jwenn koneksyon ak api memwa a dirèkteman.",
      offlineQueue: state.syncQueue
    }, null, 2);
    debugRecordCount.innerText = state.syncQueue.length;
  }
}

// Helper to show brief user notices without alert dialogs
function showToast(msg) {
  // Build a little floating temporary indicator or simply print to console for simplicity/low-bandwidth
  console.log(`[KOLEKTIF ACTION] ${msg}`);
  
  // Custom overlay dynamic injection toast
  const t = document.createElement('div');
  t.style.position = 'fixed';
  t.style.bottom = '90px';
  t.style.left = '50%';
  t.style.transform = 'translateX(-50%)';
  t.style.backgroundColor = 'var(--text, #121212)';
  t.style.color = 'var(--background, #F4EFEA)';
  t.style.padding = '8px 16px';
  t.style.border = '2px solid var(--accent, #E0533C)';
  t.style.fontSize = '0.75rem';
  t.style.fontWeight = '900';
  t.style.zIndex = '99999';
  t.innerText = msg;
  
  document.body.appendChild(t);
  setTimeout(() => {
    t.remove();
  }, 3000);
}
