/* =========================================================================
   HOME SCREEN - PORTAL INTERFACE SCRIPTS
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  
  // STATE MANAGEMENT
  let appState = {
    submissions: [],
    selectedSubmissionId: null,
    activeTab: 'simulator',
    simulatedBaseCost: 1200.00,
    simulatedProjected2026: 12.00,
    simulatedTokensDaily: "1.2M",
    simulatedCategory: "Agentic Utility (Logistics, Money, Health)",
    activeSliderYear: 2024
  };

  // SVG CHART COORDINATES (Mapped by Year)
  const chartCoordinates = {
    2024: { x: 50, y: 30 },
    2025: { x: 225, y: 120 },
    2026: { x: 400, y: 165 },
    2027: { x: 575, y: 170 },
    2028: { x: 750, y: 172 }
  };

  // HTML ELEMENT SELECTORS
  const navButtons = document.querySelectorAll('.nav-btn');
  const panels = document.querySelectorAll('.screen-panel');
  const txtSizeBtns = document.querySelectorAll('.txt-size-btn');
  const clockDisplay = document.getElementById('clock-display');
  
  // Simulator Selectors
  const agentDescTextarea = document.getElementById('agent-desc');
  const btnSimulate = document.getElementById('btn-simulate');
  const btnLoadSample = document.getElementById('btn-load-sample');
  const deflationSlider = document.getElementById('deflation-slider');
  const timelineYearLabel = document.getElementById('timeline-year-label');
  
  const metricCurrentCost = document.getElementById('metric-current-cost');
  const metricProjectedCost = document.getElementById('metric-projected-cost');
  const metricTokenEst = document.getElementById('metric-token-est');
  const metricYearSub = document.getElementById('metric-year-sub');
  const metricFeasibility = document.getElementById('metric-feasibility');
  const metricProgressFill = document.getElementById('metric-progress-fill');
  
  const chartIndicator = document.getElementById('chart-indicator');
  const chartIndicatorText = document.getElementById('chart-indicator-text');
  const chartStatus = document.getElementById('chart-status');

  // Submission Form Selectors
  const submissionForm = document.getElementById('submission-form');
  const projectNameInput = document.getElementById('project-name');
  const projectCategorySelect = document.getElementById('project-category');
  const terminalOutputInput = document.getElementById('terminal-output');
  const btnTransmitPitch = document.getElementById('btn-transmit-pitch');
  const formStatusMsg = document.getElementById('form-status-msg');

  // Logs & Memory Selectors
  const transmissionsList = document.getElementById('transmissions-list');
  const transmissionCountBadge = document.getElementById('transmission-count');
  const instructionPlaceholder = document.getElementById('instruction-placeholder');
  const transViewerContent = document.getElementById('trans-viewer-content');
  const viewTitle = document.getElementById('view-title');
  const viewCategory = document.getElementById('view-category');
  const viewTime = document.getElementById('view-time');
  const viewCurrentCost = document.getElementById('view-current-cost');
  const viewProjectedCost = document.getElementById('view-projected-cost');
  const viewFeasibility = document.getElementById('view-feasibility');
  const viewBodyCode = document.getElementById('view-body-code');

  // 3D Device Screen Selectors
  const homeScreenBezel = document.getElementById('home-screen-bezel');
  const btnToggleTilt = document.getElementById('btn-toggle-tilt');
  const mobileIconGrid = document.getElementById('mobile-icon-grid');
  const phoneTime = document.getElementById('phone-time');


  // =========================================================================
  // 1. INITIALIZATION & DATA FETCHING (GET /api/memory)
  // =========================================================================
  
  async function fetchMemoryPool() {
    try {
      const response = await fetch('/api/memory');
      if (!response.ok) throw new Error("Could not pull memory pool");
      
      const data = await response.json();
      appState.submissions = data;
      
      // Update UI counts and sections
      transmissionCountBadge.textContent = data.length;
      renderTransmissionsList(data);
      updateMobileGridIcons(data);
    } catch (error) {
      console.error("Memory retrieval error:", error);
      transmissionsList.innerHTML = `<div class="terminal-loader" style="color: #ff3333">[ERR_OFFLINE: FAILED TO FETCH MEMORY DATABASE]</div>`;
    }
  }

  // =========================================================================
  // 2. TIMERS & METRIC UPDATE INTERVALS
  // =========================================================================
  
  function updateClocks() {
    const now = new Date();
    // UTC Clock in standard format
    const utcStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    clockDisplay.textContent = utcStr;

    // Mobile Phone Clock
    const hrs = String(now.getUTCHours()).padStart(2, '0');
    const mins = String(now.getUTCMinutes()).padStart(2, '0');
    phoneTime.textContent = `${hrs}:${mins}`;
  }
  
  setInterval(updateClocks, 1000);
  updateClocks();


  // =========================================================================
  // 3. NAVIGATION TAB ROUTER & TEXT SIZE DENSITIES
  // =========================================================================
  
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      
      // Toggle button states
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Toggle panel displays
      panels.forEach(p => {
        p.classList.remove('active');
        if (p.id === `screen-${target}`) {
          p.classList.add('active');
        }
      });
      
      appState.activeTab = target;
    });
  });

  // Handle Compact/Large density switches
  txtSizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      txtSizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (btn.dataset.size === 'large') {
        document.body.classList.add('txt-large');
      } else {
        document.body.classList.remove('txt-large');
      }
    });
  });


  // =========================================================================
  // 4. SIMULATOR CALCULATOR & INTERACTIVE SCROLLING GRAPH
  // =========================================================================
  
  // Live slider interaction updates numbers based on YoY 10x drops
  deflationSlider.addEventListener('input', (e) => {
    const selectedYear = parseInt(e.target.value);
    appState.activeSliderYear = selectedYear;
    recalculateDeflation(selectedYear);
  });

  function recalculateDeflation(year) {
    timelineYearLabel.textContent = `YEAR: ${year}`;
    metricYearSub.textContent = `For Year: ${year}`;
    
    // Scale current base price down by 10x each year
    // Year difference from 2024
    const diff = year - 2024;
    const deflationDivisor = Math.pow(10, diff);
    const deflatedCost = appState.simulatedBaseCost / deflationDivisor;

    // Projected cost formatting
    metricProjectedCost.textContent = `$${deflatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // Feasibility calculations scale logarithmically based on cost.
    // If deflated cost <= 1.00 (Mass Market target), feasibility limits at 100% or near that.
    let feasibilityRatio = 15.4;
    if (deflatedCost <= 1.0) {
      feasibilityRatio = 100 - (deflatedCost * 0.1);
      chartStatus.textContent = "[ STATUS: MASS MARKET UNLOCKED ]";
      chartStatus.className = "chart-status-unlocked";
      chartStatus.style.color = "var(--success-color)";
    } else {
      feasibilityRatio = 100 - (deflatedCost * 0.08); // logarithmic approximation
      feasibilityRatio = Math.max(15.4, Math.min(99.1, feasibilityRatio));
      chartStatus.textContent = "[ STATUS: PRE-FEASIBLE ]";
      chartStatus.className = "";
      chartStatus.style.color = "var(--accent-color)";
    }
    
    const formattedFeasibility = `${feasibilityRatio.toFixed(1)}%`;
    metricFeasibility.textContent = formattedFeasibility;
    metricProgressFill.style.width = formattedFeasibility;

    // Smoothly animate the SVG chart floating cursor coordinates
    const targetCoords = chartCoordinates[year];
    if (targetCoords) {
      chartIndicator.setAttribute('transform', `translate(${targetCoords.x}, ${targetCoords.y})`);
      chartIndicatorText.textContent = `$${deflatedCost.toFixed(2)}/mo`;
    }
  }

  // Submission call out to backend parser simulator
  btnSimulate.addEventListener('click', async () => {
    const description = agentDescTextarea.value.trim();
    if (!description) {
      alert("Please specify your agentic workflow characteristics before dispatching.");
      return;
    }

    const previousLabel = btnSimulate.textContent;
    btnSimulate.textContent = "[ DISPATCHING CONSOLE PROCESS... ]";
    btnSimulate.disabled = true;

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });

      if (!response.ok) throw new Error("Simulation endpoint failed");

      const data = await response.json();
      
      // Update our simulation numbers with returned analysis
      const numericVal = parseFloat(data.currentCost.replace(/[^0-9.-]+/g, ""));
      appState.simulatedBaseCost = numericVal;
      appState.simulatedTokensDaily = data.tokensPerDay;
      appState.simulatedCategory = data.category;

      metricCurrentCost.textContent = data.currentCost;
      metricTokenEst.textContent = `Est: ${data.tokensPerDay} tokens/day`;

      // Trigger recalculation on the slider's active marker
      recalculateDeflation(appState.activeSliderYear);
      
      // Flash a quick console success status in textarea border
      agentDescTextarea.style.borderColor = "var(--success-color)";
      setTimeout(() => { agentDescTextarea.style.borderColor = ""; }, 1500);

    } catch (err) {
      console.error(err);
      alert("Deflation simulation failed to compute on cluster nodes. Check logs.");
    } finally {
      btnSimulate.textContent = previousLabel;
      btnSimulate.disabled = false;
    }
  });

  // Pre-load default template samples
  btnLoadSample.addEventListener('click', () => {
    const sample = `Agentic Wealth Manager. Requires 1.2M tokens/day per user for continuous background reasoning and transactional analysis. Scans bank ledgers, tracks monthly recurring subscriptions, and negotiates bills downwards via simulated communication nodes.`;
    agentDescTextarea.value = sample;
    // Trigger live sim to make it snappy
    btnSimulate.click();
  });


  // =========================================================================
  // 5. SECURING BACKEND RECORD POOL (POST /api/memory)
  // =========================================================================
  
  submissionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = projectNameInput.value.trim();
    const category = projectCategorySelect.value;
    const body = terminalOutputInput.value.trim();

    if (!title || !body) {
      showStatus("All fields are strictly required for transmission.", "error");
      return;
    }

    // Capture simulated values from the active simulator to bundle technical parameters
    const mockMetrics = {
      currentCost: `$${appState.simulatedBaseCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      projected2026: `$${(appState.simulatedBaseCost / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      feasibility: metricFeasibility.textContent,
      timeline: appState.simulatedBaseCost > 100 ? "Mass Feasible: Q4 2026" : "Mass Feasible: Q1 2026"
    };

    btnTransmitPitch.disabled = true;
    btnTransmitPitch.textContent = "[ BROADCASTING TO PORTAL MATRIX... ]";

    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          category,
          metrics: mockMetrics
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to commit submission to file database.");
      }

      // Success effects
      showStatus(`[SUCCESS] TR_REF: ${resData.submission.id.toUpperCase()} WRITTEN TO LEDGERS`, "success");
      
      // Resets fields
      projectNameInput.value = "";
      terminalOutputInput.value = "";
      
      // Instantly pull newly saved database records
      await fetchMemoryPool();

      // Trigger automatic navigation to Transmissions Pool so they see it
      setTimeout(() => {
        const transmissionsNavBtn = document.querySelector('.nav-btn[data-target="transmissions"]');
        if (transmissionsNavBtn) transmissionsNavBtn.click();
        
        // Select newly added pitch
        selectAndLoadSubmission(resData.submission);
      }, 1500);

    } catch (error) {
      console.error(error);
      showStatus(`[TRANSMIT_FAILED] ${error.message}`, "error");
    } finally {
      btnTransmitPitch.disabled = false;
      btnTransmitPitch.textContent = "[ TRANSMIT TO HOME SCREEN LEDGER ]";
    }
  });

  function showStatus(text, type) {
    formStatusMsg.style.display = "block";
    formStatusMsg.className = `form-status ${type}`;
    formStatusMsg.textContent = text;

    // Clear after cooldown
    setTimeout(() => {
      formStatusMsg.style.display = "none";
    }, 6000);
  }


  // =========================================================================
  // 6. SYNCHRONIZED LIST RENDERERS & TRANSMISSIONS PORTAL
  // =========================================================================
  
  function renderTransmissionsList(submissions) {
    if (submissions.length === 0) {
      transmissionsList.innerHTML = `<div class="terminal-loader">[MEMORY DUMP VACANT - SUBMIT YOUR PORTAL RECORD]</div>`;
      return;
    }

    transmissionsList.innerHTML = "";
    submissions.forEach(sub => {
      const dateFormatted = new Date(sub.timestamp).getUTCHours() + ":" + 
                            String(new Date(sub.timestamp).getUTCMinutes()).padStart(2, '0') + 
                            " UTC";

      const item = document.createElement('div');
      item.className = 'transmission-item';
      item.dataset.id = sub.id;
      item.innerHTML = `
        <div class="trans-meta-row">
          <span>ID: ${sub.id.substring(0, 10).toUpperCase()}</span>
          <span>${dateFormatted}</span>
        </div>
        <div class="trans-title">${sub.title}</div>
        <div class="trans-brief">${sub.category} // Cost: ${sub.metrics.currentCost}</div>
      `;

      item.addEventListener('click', () => {
        // Toggle selected state
        document.querySelectorAll('.transmission-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        selectAndLoadSubmission(sub);
      });

      transmissionsList.appendChild(item);
    });
  }

  function selectAndLoadSubmission(sub) {
    appState.selectedSubmissionId = sub.id;

    // Display viewer pane
    instructionPlaceholder.style.display = "none";
    transViewerContent.style.display = "flex";

    viewTitle.textContent = sub.title;
    viewCategory.textContent = sub.category;
    viewTime.textContent = new Date(sub.timestamp).toLocaleString();
    viewCurrentCost.textContent = sub.metrics.currentCost;
    viewProjectedCost.textContent = sub.metrics.projected2026;
    viewFeasibility.textContent = sub.metrics.feasibility;
    viewBodyCode.textContent = sub.body;

    // Find if the corresponding grid icon exists in the phone; click it if so
    syncHighlightPhoneSlot(sub.title);
  }


  // =========================================================================
  // 7. 3D DECO PHONE GRID CONNECTOR
  // =========================================================================
  
  // Highlight phone slot matching clicked project
  function syncHighlightPhoneSlot(title) {
    const slots = document.querySelectorAll('.app-slot');
    slots.forEach(slot => {
      slot.classList.remove('active-occupied');
      if (slot.dataset.targetName && slot.dataset.targetName.toLowerCase() === title.toLowerCase()) {
        slot.classList.add('active-occupied');
      }
    });
  }

  // Populate phone grid index coordinates based on data memory submissions list
  function updateMobileGridIcons(submissions) {
    const totalSlotsLimit = 15; // 15 slots remaining (1st is ChatGPT)

    // Reset all slots to empty initial templates
    for (let i = 0; i < totalSlotsLimit; i++) {
       const slot = document.getElementById(`slot-${i}`);
       if (slot) {
         slot.classList.remove('active-occupied', 'occupied');
         slot.innerHTML = `<div class="app-icon empty-icon"><div class="plus-glow">+</div></div><div class="app-label">Empty Slot</div>`;
         slot.dataset.targetName = "Empty Slot";
       }
    }

    // Fill slots dynamically
    submissions.slice(0, totalSlotsLimit).forEach((sub, idx) => {
       const slot = document.getElementById(`slot-${idx}`);
       if (slot) {
         // Create short initials logo for brutalist icon
         const initials = sub.title
           .replace(/['"]+/g, '') // remove quotes in anonymous titles
           .split(' ')
           .map(w => w[0])
           .join('')
           .substring(0, 3)
           .toUpperCase();

         slot.classList.add('occupied');
         slot.dataset.targetName = sub.title;
         
         // Color mapping based on category for gorgeous visual aesthetics
         let iconColorStyle = "";
         if (sub.category.includes("Utility")) {
           iconColorStyle = "background-color: #261611; border-color: var(--accent-color);";
         } else if (sub.category.includes("Social")) {
           iconColorStyle = "background-color: #0b1521; border-color: #38bdf8;";
         } else {
           iconColorStyle = "background-color: #0f1c14; border-color: var(--success-color);";
         }

         slot.innerHTML = `
           <div class="app-icon" style="${iconColorStyle}">
             <span class="icon-avatar" style="font-size: 8px; font-weight:bold; color: #fff;">${initials}</span>
           </div>
           <div class="app-label">${sub.title}</div>
         `;

         // Click triggers viewing details on the active dashboard screen
         slot.addEventListener('click', () => {
           // Go to transmissions log pane
           const transNavBtn = document.querySelector('.nav-btn[data-target="transmissions"]');
           if (transNavBtn) transNavBtn.click();
           
           // Highlight item in left pane list
           const listItems = document.querySelectorAll('.transmission-item');
           listItems.forEach(li => {
             const subId = li.dataset.id;
             if (subId === sub.id) {
               li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
               li.click();
             }
           });
         });
       }
    });
  }

  // Toggler controls for 3D Perspective Angles
  btnToggleTilt.addEventListener('click', () => {
    homeScreenBezel.classList.toggle('flat');
    const isFlat = homeScreenBezel.classList.contains('flat');
    btnToggleTilt.textContent = isFlat 
      ? '[ TILT BACK TO 3D ORIENTATION ]' 
      : '[ TOGGLE 3D PERSPECTIVE TILT ]';
  });


  // =========================================================================
  // 8. LAUNCH APPARATUS
  // =========================================================================
  
  fetchMemoryPool();
  recalculateDeflation(appState.activeSliderYear);
});
