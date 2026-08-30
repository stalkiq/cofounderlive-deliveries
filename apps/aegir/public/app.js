document.addEventListener("DOMContentLoaded", () => {
  // Global Operational State
  let appState = {
    vessels: [],
    history: [],
    settings: {},
    currentOperator: "GUEST_OPERATOR",
    currentRole: "Fleet Operations Chief",
    soundEnabled: false,
    focusedVesselTitle: null
  };

  // Audio Context for Retro Sonar Synthesizer
  let audioCtx = null;

  // Cache DOM Elements
  const onboardingScreen = document.getElementById("onboarding-screen");
  const controlDeckScreen = document.getElementById("control-deck-screen");
  const settingsHistoryScreen = document.getElementById("settings-history-screen");
  const mainNav = document.getElementById("main-nav");
  const navTabs = document.querySelectorAll(".nav-tab");
  const operatorBadgeName = document.getElementById("operator-badge-name");

  // Forms
  const onboardingForm = document.getElementById("onboarding-form");
  const dispatchForm = document.getElementById("dispatch-form");
  const settingsForm = document.getElementById("settings-form");

  // Success Notification Panel
  const flowSuccessLayer = document.getElementById("flow-success-layer");
  const successHeader = document.getElementById("success-header");
  const successMsg = document.getElementById("success-msg");
  const successRef = document.getElementById("success-ref");
  const btnDismissSuccess = document.getElementById("btn-dismiss-success");

  // Telemetry Metrics
  const countActiveEl = document.getElementById("count-active");
  const computePowerEl = document.getElementById("compute-power");
  const pueValEl = document.getElementById("pue-val");
  const topLatencyEl = document.getElementById("telemetry-latency");
  const topTempEl = document.getElementById("telemetry-temp");

  // Sound Button
  const btnSound = document.getElementById("btn-sound");

  // Lists & Streams
  const vesselListTable = document.getElementById("vessel-list");
  const auditLogStream = document.getElementById("audit-log-stream");
  const logCounter = document.getElementById("log-counter");
  const sonarDotsContainer = document.getElementById("sonar-dots");

  // Buttons inside forms
  const btnResetDb = document.getElementById("btn-reset-db");

  // Default next target launch date config (setup to default to +48 hours)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const targetDateInput = document.getElementById("target-date");
  if (targetDateInput) {
    targetDateInput.value = tomorrow.toISOString().split("T")[0];
  }

  // Set Default Callsign Suffix on designations dynamically
  const designateInput = document.getElementById("vessel-designation");

  // ----------------------------------------------------
  // SCREEN ROUTING & TABS NAVIGATION
  // ----------------------------------------------------
  function switchScreen(targetTabId) {
    // Hide all view screens
    onboardingScreen.style.display = "none";
    controlDeckScreen.style.display = "none";
    settingsHistoryScreen.style.display = "none";
    
    // Remove active class
    onboardingScreen.classList.remove("active-screen");
    controlDeckScreen.classList.remove("active-screen");
    settingsHistoryScreen.classList.remove("active-screen");

    if (targetTabId === "onboarding") {
      onboardingScreen.style.display = "block";
      onboardingScreen.classList.add("active-screen");
      mainNav.style.display = "none";
    } else if (targetTabId === "control-deck") {
      controlDeckScreen.style.display = "block";
      controlDeckScreen.classList.add("active-screen");
      mainNav.style.display = "flex";
    } else if (targetTabId === "settings-history") {
      settingsHistoryScreen.style.display = "block";
      settingsHistoryScreen.classList.add("active-screen");
      mainNav.style.display = "flex";
    }
    
    playBeep(440, 0.08); // Feedback sound
  }

  // Set up click handlers for top bar navigation tabs
  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.getAttribute("data-tab");
      navTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      switchScreen(targetTab);
    });
  });

  // ----------------------------------------------------
  // ONBOARDING SIGN IN CONTROL
  // ----------------------------------------------------
  onboardingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const callsign = document.getElementById("operator-callsign").value.trim();
    const role = document.getElementById("operator-role").value;
    
    appState.currentOperator = callsign.toUpperCase();
    appState.currentRole = role;

    operatorBadgeName.textContent = `${appState.currentOperator} [${role.substring(0, 15).toUpperCase()}]`;
    
    // Trigger transition sounds
    playBeep(520, 0.1);
    setTimeout(() => playBeep(659, 0.12), 120);
    setTimeout(() => playBeep(784, 0.15), 240);

    // Swap to main view
    switchScreen("control-deck");
    // Retrieve memory baseline
    fetchState();
  });

  // ----------------------------------------------------
  // AUDIO EFFECT NODE SYNTHESIZER
  // ----------------------------------------------------
  function playBeep(frequency, duration) {
    if (!appState.soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (err) {
      console.warn("Audio Context block:", err);
    }
  }

  // Periodic sonar signal sound beep
  setInterval(() => {
    if (appState.soundEnabled && controlDeckScreen.style.display !== "none") {
      playBeep(987, 0.05);
      setTimeout(() => playBeep(1200, 0.03), 80);
    }
  }, 10000);

  btnSound.addEventListener("click", () => {
    appState.soundEnabled = !appState.soundEnabled;
    btnSound.textContent = appState.soundEnabled ? "SOUND FX: OSC-ON" : "SOUND FX: STATIC";
    btnSound.classList.toggle("green", appState.soundEnabled);
    playBeep(600, 0.1);
  });

  // ----------------------------------------------------
  // API INTEGRATION (GET/POST /api/memory)
  // ----------------------------------------------------
  async function fetchState() {
    try {
      const response = await fetch("/api/memory");
      if (!response.ok) throw new Error("Faulty response from Abyssal Satellite grid.");
      const data = await response.json();
      
      if (data.success) {
        appState.vessels = data.vessels;
        appState.history = data.history;
        appState.settings = data.settings;
        
        // Synchronize elements
        renderVessels();
        renderHistory();
        renderMetrics();
        syncSettingsForm();
        setNextVesselPlaceholder();
      }
    } catch (err) {
      console.error("Telemetry fetch error:", err);
    }
  }

  function renderMetrics() {
    if (!appState.vessels || appState.vessels.length === 0) return;

    // Total H100 counts and Active calculations
    let activeCount = 0;
    let totalH100s = 0;
    let sumLoadPercentage = 0;
    let computedVesselsCount = 0;

    appState.vessels.forEach((v) => {
      if (v.status === "Active") {
         activeCount++;
      }
      
      // Calculate capacity from detail string
      if (v.detail) {
        // e.g., "1024x H100 Cluster" or "512x H100 Liquid-Cooled Cluster"
        const match = v.detail.match(/(\d+)x/);
        if (match && match[1]) {
          totalH100s += parseInt(match[1]);
        }
      }

      // Calculate aggregated average load percentage
      if (v.load && v.load.includes("%")) {
        const loadVal = parseInt(v.load);
        sumLoadPercentage += loadVal;
        computedVesselsCount++;
      }
    });

    // Write to DOM
    countActiveEl.textContent = `${activeCount} Vessels`;
    computePowerEl.textContent = `${totalH100s.toLocaleString()} Clusters`;
    
    // Set dynamic top bar values
    const currentActiveBarge = appState.vessels.find(v => v.title === appState.focusedVesselTitle) || appState.vessels[0];
    if (currentActiveBarge) {
      topLatencyEl.textContent = currentActiveBarge.status === "Active" ? "8.4ms" : "Offline";
      topTempEl.textContent = currentActiveBarge.temp || "11.4°C";
    }
  }

  function setNextVesselPlaceholder() {
    // Determine last index integer
    let maxNum = 4;
    appState.vessels.forEach(v => {
      const match = v.title.match(/AEGIR-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    
    // Set placeholder suggest to maxNum + 1
    const nextNumString = String(maxNum + 1).padStart(2, "0");
    designateInput.placeholder = `e.g., AEGIR-${nextNumString}`;
    designateInput.value = `AEGIR-${nextNumString}`;
  }

  function renderVessels() {
    vesselListTable.innerHTML = "";
    sonarDotsContainer.innerHTML = "";

    appState.vessels.forEach((v) => {
      const tr = document.createElement("tr");
      if (v.title === appState.focusedVesselTitle) {
        tr.classList.add("selected-row");
      }

      // Identify badges
      let statusClass = "badge-transit";
      if (v.status === "Active") statusClass = "badge-active";
      if (v.status === "Provisioning" || v.status === "Pending") statusClass = "badge-provision";

      // Parse numerical load representation
      const loadNum = parseInt(v.load) || 0;

      tr.innerHTML = `
        <td>
          <div class="vessel-title-cell">
            <span>${v.title}</span>
            <span class="vessel-subdetail">${v.name || '(No Call-Sign Code)'}</span>
          </div>
        </td>
        <td>${v.detail}</td>
        <td>${v.corridor}</td>
        <td><span class="${loadNum > 80 ? 'text-orange' : 'text-green'}">${v.temp}</span></td>
        <td>
          <div class="metric-load-outer">
            <div class="metric-load-inner" style="width: ${loadNum}%"></div>
          </div>
          <span class="load-text">${v.load}</span>
        </td>
        <td><span class="status-badge ${statusClass}">${v.status}</span></td>
      `;

      // Set click listener to select and focus
      tr.addEventListener("click", () => {
        appState.focusedVesselTitle = v.title;
        renderVessels();
        renderMetrics();
        playBeep(700, 0.05);
      });

      vesselListTable.appendChild(tr);

      // Create a sonar marker spot
      const dot = document.createElement("div");
      dot.className = `radar-dot ${v.status === 'Active' ? 'active-dot' : (v.status === 'Transit' ? 'transit-dot' : 'warning-dot')}`;
      
      // Plot dots spread dynamically under polar coordinate mocks
      let topPercent = 50;
      let leftPercent = 50;

      if (v.title === "AEGIR-01") { topPercent = 38; leftPercent = 45; }
      else if (v.title === "AEGIR-02") { topPercent = 58; leftPercent = 54; }
      else if (v.title === "AEGIR-03") { topPercent = 28; leftPercent = 32; }
      else if (v.title === "AEGIR-04") { topPercent = 70; leftPercent = 25; }
      else {
        // Pseudo-random but consistent coordinate allocation
        const hash = v.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        topPercent = 20 + (hash % 60);
        leftPercent = 20 + ((hash * 7) % 60);
      }

      dot.style.top = `${topPercent}%`;
      dot.style.left = `${leftPercent}%`;
      dot.title = `${v.title}: ${v.detail} [${v.status}]`;

      dot.addEventListener("click", (ev) => {
        ev.stopPropagation();
        appState.focusedVesselTitle = v.title;
        renderVessels();
        renderMetrics();
        playBeep(850, 0.08);
      });

      sonarDotsContainer.appendChild(dot);
    });
  }

  function renderHistory() {
    auditLogStream.innerHTML = "";
    logCounter.textContent = `${appState.history.length} TELEMETRY EVENTS RECORDED`;

    appState.history.forEach((h) => {
      const item = document.createElement("div");
      item.className = "log-item";

      // Formatted datetime
      const dateStr = new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      item.innerHTML = `
        <div class="log-meta">
          <span class="log-type ${h.type}">${h.type}</span>
          <span>${dateStr} // STREAM-UP</span>
        </div>
        <div class="log-text">${h.message}</div>
      `;
      auditLogStream.appendChild(item);
    });
  }

  function syncSettingsForm() {
    if (!appState.settings) return;
    document.getElementById("scuttle-depth").value = appState.settings.emergencyScuttleDepth || 180;
    document.getElementById("thermal-threshold").value = appState.settings.thermalWarningThreshold || 14.5;
    document.getElementById("alert-target").value = appState.settings.alertTarget || "Operations Command Terminal A";
    document.getElementById("auto-cooling-boost").checked = !!appState.settings.autoCoolingBoost;
  }

  // ----------------------------------------------------
  // DISPATCH FORM SUBMISSION (WORKFLOW ACTION)
  // ----------------------------------------------------
  dispatchForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const designation = document.getElementById("vessel-designation").value.trim();
    const corridor = document.getElementById("target-corridor").value;
    const config = document.getElementById("compute-configuration").value;
    const targetDate = document.getElementById("target-date").value;

    if (!designation) {
      alert("Verification critical. Valid vessel designation required.");
      return;
    }

    try {
      const response = await fetch("/api/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          designation,
          corridor,
          config,
          targetDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unresolved collision in high-seas ledger.");
      }

      if (data.success) {
        // Play epic success dispatch sequence sound
        playBeep(450, 0.15);
        setTimeout(() => playBeep(600, 0.15), 150);
        setTimeout(() => playBeep(900, 0.3), 300);

        // Populate and display Success Notification overlay
        successHeader.textContent = "Deployment sequence authorized";
        successMsg.innerHTML = `
          Vessel sequence allocated for corridor <strong>${corridor}</strong> with cluster payload <strong>${config}</strong>.<br><br>
          Autonomous towing tugs and maritime legal clearance protocols have been fully activated for immediate dispatch.
        `;
        successRef.textContent = `SAT-SEC-ALLOC:${Math.floor(100000 + Math.random() * 900000)}`;
        
        flowSuccessLayer.style.display = "block";
        dispatchForm.style.display = "none";

        // Update main state variables
        appState.vessels = data.vessels;
        appState.history = data.history;
        appState.focusedVesselTitle = designation; // Focus the newly created vessel!

        // Re-render
        renderVessels();
        renderHistory();
        renderMetrics();
      }
    } catch (err) {
      alert(`AUTH REJECTED: ${err.message}`);
    }
  });

  // Dismiss workflow success block, restore form
  btnDismissSuccess.addEventListener("click", () => {
    flowSuccessLayer.style.display = "none";
    dispatchForm.style.display = "flex";
    dispatchForm.reset();
    setNextVesselPlaceholder();
    if (targetDateInput) {
      targetDateInput.value = tomorrow.toISOString().split("T")[0];
    }
    playBeep(500, 0.08);
  });

  // ----------------------------------------------------
  // SETTINGS FORM SUBMISSION
  // ----------------------------------------------------
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const depth = parseInt(document.getElementById("scuttle-depth").value);
    const threshold = parseFloat(document.getElementById("thermal-threshold").value);
    const alertTarget = document.getElementById("alert-target").value.trim();
    const autoCooling = document.getElementById("auto-cooling-boost").checked;

    try {
      const response = await fetch("/api/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "update_settings",
          settings: {
            emergencyScuttleDepth: depth,
            thermalWarningThreshold: threshold,
            alertTarget: alertTarget,
            autoCoolingBoost: autoCooling
          }
        })
      });

      if (!response.ok) throw new Error("Could not update telemetry settings.");
      const data = await response.json();

      if (data.success) {
        appState.settings = data.settings;
        appState.history = data.history;
        
        renderHistory();
        playBeep(880, 0.15);
        alert("Operation configurations successfully saved to the deep-water network.");
      }
    } catch (err) {
      alert(`CONFIGURATION SAVING REJECTED: ${err.message}`);
    }
  });

  // Reset database back to baseline (defaults)
  btnResetDb.addEventListener("click", async () => {
    if (!confirm("Are you certain you wish to purge the entire tactical registry and history stream? This is irreversible.")) return;

    try {
      const response = await fetch("/api/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "reset_memory"
        })
      });

      if (!response.ok) throw new Error("Could not clear persistent records.");
      const data = await response.json();

      if (data.success) {
        appState.vessels = data.vessels;
        appState.history = data.history;
        appState.settings = data.settings;
        appState.focusedVesselTitle = null;

        renderVessels();
        renderHistory();
        renderMetrics();
        syncSettingsForm();
        setNextVesselPlaceholder();
        
        playBeep(300, 0.5);
        alert("Sovereign fleet database cleared and restored to default baseline state.");
      }
    } catch (err) {
      alert(`RESET FAILED: ${err.message}`);
    }
  });
});
