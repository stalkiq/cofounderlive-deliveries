/* ==========================================================================
   KINWARD: PRIVACY-FIRST ELDERCARE - CLIENT APPLICATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Global State Variable
  let state = {
    onboardingCompleted: false,
    caregiverName: "Sarah",
    parentName: "Eleanor (Mom)",
    configurations: [],
    telemetryEvents: [],
    aiSummaries: [],
    selectedLensStyle: "glass" // glass, heatmap, motion
  };

  // UI Element Selectors
  const screens = {
    onboarding: document.getElementById('screen-onboarding'),
    configure: document.getElementById('screen-configure'),
    timeline: document.getElementById('screen-timeline'),
    assistant: document.getElementById('screen-assistant')
  };

  const navButtons = document.querySelectorAll('.app-nav .nav-item');
  const btnStartOnboarding = document.getElementById('btn-start-onboarding');
  const btnApplyShield = document.getElementById('btn-apply-shield');
  const btnGenerateAI = document.getElementById('btn-generate-ai');
  const btnPlayVoice = document.getElementById('btn-play-voice');
  const btnPanelModify = document.getElementById('btn-panel-modify');

  const inputCaregiver = document.getElementById('input-caregiver');
  const inputParent = document.getElementById('input-parent');

  const shieldDevice = document.getElementById('shield-device');
  const shieldFilter = document.getElementById('shield-filter');
  const shieldWindow = document.getElementById('shield-window');
  const shieldTrigger = document.getElementById('shield-trigger');

  const statLastActivity = document.getElementById('stat-last-activity');
  const statRoutineMatch = document.getElementById('stat-routine-match');
  const timelineEventsList = document.getElementById('timeline-events-list');
  const aiSummaryOutput = document.getElementById('ai-summary-output');
  const aiSpinner = document.getElementById('ai-spinner');
  const voiceWavesContainer = document.getElementById('voice-waves-container');

  const bottomConfigPanel = document.getElementById('bottom-active-config-panel');
  const footerDevice = document.getElementById('footer-device');
  const footerPrivacyLevel = document.getElementById('footer-privacy-level');
  const syncParentLabel = document.getElementById('sync-parent-label');

  const successShieldMessage = document.getElementById('success-shield-message');
  const activeLiveLensLabel = document.getElementById('active-live-lens');
  const interactiveLens = document.getElementById('interactive-lens');
  const lensTextOverlay = document.getElementById('lens-text-overlay');

  /* ==========================================================================
     1. INITIALIZATION & DATA FETCHING
     ========================================================================== */

  // Load state from durable back-end database
  async function syncState() {
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      
      state.configurations = data.configurations || [];
      state.telemetryEvents = data.telemetryEvents || [];
      state.aiSummaries = data.aiSummaries || [];
      state.onboardingCompleted = (data.onboarding && data.onboarding.completed);
      
      if (data.onboarding) {
        state.caregiverName = data.onboarding.caregiverName || state.caregiverName;
        state.parentName = data.onboarding.parentName || state.parentName;
        inputCaregiver.value = state.caregiverName;
        inputParent.value = state.parentName;
      }

      renderUI();
    } catch (err) {
      console.error("Critical error syncing memory state:", err);
    }
  }

  /* ==========================================================================
     2. UI RENDER FUNCTIONS
     ========================================================================== */

  function renderUI() {
    // Sync names
    syncParentLabel.innerText = state.parentName;

    // Show correct screen on startup
    if (!state.onboardingCompleted) {
      switchScreen('onboarding');
      bottomConfigPanel.classList.add('hidden');
    } else {
      bottomConfigPanel.classList.remove('hidden');
    }

    // Render active config
    if (state.configurations.length > 0) {
      const activeConf = state.configurations[0]; // latest first
      footerDevice.innerText = `${activeConf.deviceName} Shielded`;
      footerPrivacyLevel.innerText = `Lens: ${activeConf.filterLevel.split(' (')[0]}`;
      document.getElementById('badge-config-status').innerText = "Calibrated";
      
      // Update form preset
      shieldDevice.value = activeConf.deviceName;
      shieldFilter.value = activeConf.filterLevel;
      shieldWindow.value = activeConf.monitoringWindow;
      shieldTrigger.value = activeConf.trigger;
    } else {
      document.getElementById('badge-config-status').innerText = "Unconfigured";
    }

    // Render Activity Timeline Items
    timelineEventsList.innerHTML = '';
    const sortedEvents = [...state.telemetryEvents].reverse(); // newest top

    if (sortedEvents.length === 0) {
      timelineEventsList.innerHTML = '<p class="placeholder-text">No active Ring telemetry received yet. Tap one of the simulator buttons above to trigger ambient motion logs!</p>';
    } else {
      sortedEvents.forEach(evt => {
        const item = document.createElement('div');
        const isSecure = evt.status === 'Secure';
        item.className = `timeline-item ${isSecure ? 'secure' : ''}`;
        
        item.innerHTML = `
          <div class="timeline-item-header">
            <span class="timeline-title">${evt.sensor}</span>
            <span class="timeline-time">${evt.timestamp}</span>
          </div>
          <p class="timeline-desc">${evt.detail}</p>
          <div class="timeline-tags">
            <span class="timeline-tag-status">${evt.status}</span>
            <span class="timeline-tag-filter">${state.configurations[0]?.filterLevel.split(' (')[0] || 'Frosted Glass'} Active</span>
          </div>
        `;
        timelineEventsList.appendChild(item);
      });
    }

    // Refresh last activity label
    if (sortedEvents.length > 0) {
      statLastActivity.innerText = "Just Now";
    } else {
      statLastActivity.innerText = "None today";
    }

    // Render generated AI Summaries
    if (state.aiSummaries.length > 0) {
      const latestSummaryObj = state.aiSummaries[0];
      const dateText = new Date(latestSummaryObj.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      aiSummaryOutput.innerHTML = `
        <div style="margin-bottom: 8px; font-size: 11px; color: var(--primary);">✦ Generated text-summary (${dateText})</div>
        <p class="ai-output-bold">${latestSummaryObj.summaryText}</p>
      `;
    } else {
      aiSummaryOutput.innerHTML = '<p class="placeholder-text">No daily summaries synthesized yet. Press the Analyzer button above to compile raw telemetry.</p>';
    }
  }

  function switchScreen(screenKey) {
    // Hide all screens
    Object.keys(screens).forEach(key => {
      screens[key].classList.add('hidden');
    });
    // Show selected
    screens[screenKey].classList.remove('hidden');

    // Update bottom nav active state
    navButtons.forEach(btn => {
      if (btn.dataset.screen === screenKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Hide active config banner if back to onboarding or configuring
    if (screenKey === 'onboarding') {
      bottomConfigPanel.classList.add('hidden');
    } else {
      bottomConfigPanel.classList.remove('hidden');
    }
  }

  /* ==========================================================================
     3. INTERACTIVE LENS STYLE PREVIEW (WORKFLOW FEEDBACK)
     ========================================================================= */

  const previewButtons = document.querySelectorAll('.selector-btn');
  previewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      previewButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const lensStyle = btn.dataset.style;
      state.selectedLensStyle = lensStyle;

      // Reset
      interactiveLens.className = 'skinward-lens-overlay';

      if (lensStyle === 'glass') {
        interactiveLens.classList.add('lens-glass');
        activeLiveLensLabel.innerText = "Frosted Glass";
        lensTextOverlay.innerText = "Frosted Glass Lens - High Privacy";
      } else if (lensStyle === 'heatmap') {
        interactiveLens.classList.add('lens-heatmap');
        activeLiveLensLabel.innerText = "Ambient Heatmap";
        lensTextOverlay.innerText = "Ambient Heatmap - Medium Privacy";
      } else if (lensStyle === 'motion') {
        interactiveLens.classList.add('lens-motion-only');
        activeLiveLensLabel.innerText = "Motion Only";
        lensTextOverlay.innerText = "Telemetry Mode - Video Blocked";
      }
    });
  });

  /* ==========================================================================
     4. EVENT HANDLERS & API MUTATIONS
     ========================================================================== */

  // A. Onboarding Flow Submit
  btnStartOnboarding.addEventListener('click', async () => {
    const cgVal = inputCaregiver.value.trim();
    const prVal = inputParent.value.trim();

    if (!cgVal || !prVal) {
      alert("Please enter names to personalize the interface.");
      return;
    }

    state.caregiverName = cgVal;
    state.parentName = prVal;

    // Send onboarding completion to durable backend memory
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'onboarding',
          payload: {
            caregiverName: state.caregiverName,
            parentName: state.parentName
          }
        })
      });
      const data = await res.json();
      state.onboardingCompleted = true;
      switchScreen('configure');
      syncState();
    } catch (err) {
      console.error("Failed persisting onboarding details limit:", err);
    }
  });

  // B. Workflow Form - Apply Ring Privacy Configuration
  btnApplyShield.addEventListener('click', async () => {
    const deviceName = shieldDevice.value.trim();
    const filterLevel = shieldFilter.value;
    const monitoringWindow = shieldWindow.value;
    const trigger = shieldTrigger.value;

    if (!deviceName) {
      alert("Please enter a valid Ring camera name.");
      return;
    }

    const payload = {
      deviceName,
      filterLevel,
      monitoringWindow,
      trigger
    };

    try {
      // POST Configuration details to backend memory endpoint
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'configuration',
          payload
        })
      });

      if (res.ok) {
        successShieldMessage.classList.remove('hidden');
        setTimeout(() => {
          successShieldMessage.classList.add('hidden');
        }, 5500);

        // Sync local variables & render changes
        await syncState();
        
        // Auto navigate smoothly to timeline after configuring
        setTimeout(() => {
          switchScreen('timeline');
        }, 2000);
      } else {
        alert("Failed to save camera shield details.");
      }
    } catch (err) {
      console.error("Network error during configuration save:", err);
    }
  });

  // C. Interactive Event Simulator Widgets
  const simButtons = document.querySelectorAll('.sim-btn');
  simButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const sensor = btn.dataset.event;
      const detail = btn.dataset.desc;
      const status = btn.dataset.status;
      const style = btn.dataset.style;
      
      const payload = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sensor,
        detail,
        status,
        value: `Active (${style})`
      };

      try {
        const res = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'event',
            payload
          })
        });

        if (res.ok) {
          // Sync with server immediately
          await syncState();
          
          btn.animate([
            { borderColor: 'var(--border)' },
            { borderColor: 'var(--accent)', backgroundColor: 'rgba(78,159,61,0.2)' },
            { borderColor: 'var(--border)' }
          ], { duration: 500 });
        }
      } catch (err) {
        console.error("Telemetry post failed:", err);
      }
    });
  });

  // D. AI Daily Pattern Analyzer (Simulated Gemini)
  btnGenerateAI.addEventListener('click', async () => {
    aiSpinner.classList.remove('hidden');
    btnGenerateAI.disabled = true;

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (data.success) {
        await syncState();
      } else {
        alert("Failed to analyze pattern.");
      }
    } catch (err) {
      console.error("Error calling pattern analysis engine:", err);
    } finally {
      aiSpinner.classList.add('hidden');
      btnGenerateAI.disabled = false;
    }
  });

  // E. Hands-free Reassurance Voice Briefing (Browser SpeechSynthesis API)
  btnPlayVoice.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      alert("Your browser does not support hands-free Text-to-Speech playback. Try Chrome or Safari.");
      return;
    }

    // If already speaking, cancel it
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      voiceWavesContainer.classList.add('hidden');
      btnPlayVoice.innerText = "Play Audio Briefing";
      return;
    }

    // Fetch the latest generated report or fallback to spec target speech
    let narrativeToSpeak = "Your parent's privacy filter is active, and their home is fully secured. No activity detected.";
    if (state.aiSummaries.length > 0) {
      narrativeToSpeak = state.aiSummaries[0].summaryText;
    } else if (state.telemetryEvents.length > 0) {
      narrativeToSpeak = `${state.parentName} was active today. Kitchen detection happened at 12:14 PM confirming lunch is secure. Direct video remains strictly blocked.`;
    }

    const reportSpeech = new SpeechSynthesisUtterance(narrativeToSpeak);
    reportSpeech.lang = 'en-US';
    reportSpeech.rate = 1.0;
    reportSpeech.pitch = 1.05;

    // Trigger visualizer
    reportSpeech.onstart = () => {
      voiceWavesContainer.classList.remove('hidden');
      btnPlayVoice.innerText = "Stop Playing";
    };

    reportSpeech.onend = () => {
      voiceWavesContainer.classList.add('hidden');
      btnPlayVoice.innerText = "Play Audio Briefing";
    };

    reportSpeech.onerror = () => {
      voiceWavesContainer.classList.add('hidden');
      btnPlayVoice.innerText = "Play Audio Briefing";
    };

    window.speechSynthesis.speak(reportSpeech);
  });

  // F. Switch from bottom panel widget back to Modify Config Form
  btnPanelModify.addEventListener('click', () => {
    switchScreen('configure');
  });

  // G. Bind navigation buttons
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const screenKey = btn.dataset.screen;
      switchScreen(screenKey);
    });
  });

  /* ==========================================================================
     5. LIGHTWEIGHT CANVAS BACK-END AMBIENT HEATMAP GLOW
     ========================================================================== */

  const canvas = document.getElementById('ambient-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Orb status representing Ring telemetry warmth
    let orbs = [
      { x: Math.random() * canvas.width, y: Math.random() * canvas.height, rx: 1.2, ry: 0.9, size: 280, color: 'rgba(255,140,66,0.1)' },
      { x: Math.random() * canvas.width, y: Math.random() * canvas.height, rx: -0.8, ry: 1.1, size: 220, color: 'rgba(78,159,61,0.08)' }
    ];

    function animateOrbs() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      orbs.forEach(orb => {
        // Move
        orb.x += orb.rx;
        orb.y += orb.ry;

        // Bounce
        if (orb.x < -100 || orb.x > canvas.width + 100) orb.rx *= -1;
        if (orb.y < -100 || orb.y > canvas.height + 100) orb.ry *= -1;

        // Draw radial glow
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'rgba(18,17,16,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animateOrbs);
    }

    animateOrbs();
  }

  // Active load state on system bootstrap
  syncState();
});
