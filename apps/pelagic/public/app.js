// PELAGIC OPERATIONAL CONTROL INTERFACE

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const sysClock = document.getElementById('sys-clock');
  const hdrCoords = document.getElementById('hdr-coords');
  
  const calcCapacity = document.getElementById('calc-capacity');
  const calcCapacityVal = document.getElementById('calc-capacity-val');
  const calcPelagicPower = document.getElementById('calc-pelagic-power');
  const calcLandPower = document.getElementById('calc-land-power');
  const calcSavedPower = document.getElementById('calc-saved-power');
  const calcCarbonSaved = document.getElementById('calc-carbon-saved');

  const copilotRecom = document.getElementById('copilot-recom');
  const formLat = document.getElementById('form-lat');
  const formLon = document.getElementById('form-lon');
  const formDensity = document.getElementById('form-density');
  const formCooling = document.getElementById('form-cooling');
  const deploymentForm = document.getElementById('deployment-form');

  const chatLogs = document.getElementById('chat-logs');
  const chatInput = document.getElementById('chat-input');
  const copilotChatForm = document.getElementById('copilot-chat-form');
  const copilotChips = document.querySelectorAll('.copilot-chip');

  const memoryLoading = document.getElementById('memory-loading');
  const memoryList = document.getElementById('memory-list');
  const btnRefreshMemory = document.getElementById('btn-refresh-memory');
  const syncStatus = document.getElementById('sync-status');

  // Static telemetry indicators
  const mPue = document.getElementById('m-pue');
  const mMw = document.getElementById('m-mw');
  const mTemp = document.getElementById('m-temp');
  const mUptime = document.getElementById('m-uptime');

  // --- Real-Time Clocks & Telemetry Jitter ---
  const updateSystemClock = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = now.getUTCFullYear();
    const mm = pad(now.getUTCMonth() + 1);
    const dd = pad(now.getUTCDate());
    const hh = pad(now.getUTCHours());
    const min = pad(now.getUTCMinutes());
    const ss = pad(now.getUTCSeconds());
    sysClock.textContent = `UTC ${yyyy}-${mm}-${dd} // ${hh}:${min}:${ss}`;
  };
  setInterval(updateSystemClock, 1000);
  updateSystemClock();

  // Floating GPS coordinates jitter
  let currentLat = 37.7412;
  let currentLon = -25.6756;
  setInterval(() => {
    // Add tiny decimal jitter to simulate active GPS sensors drifting on ocean swells
    currentLat += (Math.random() - 0.5) * 0.0001;
    currentLon += (Math.random() - 0.5) * 0.0001;
    
    const latDir = currentLat >= 0 ? 'N' : 'S';
    const lonDir = currentLon >= 0 ? 'E' : 'W';
    
    // Lat/Lon formatting
    hdrCoords.textContent = `LAT: ${Math.abs(currentLat).toFixed(4)}°${latDir} || LON: ${Math.abs(currentLon).toFixed(4)}°${lonDir}`;
  }, 1200);

  // --- Thermal Delta Calculator ---
  const updateThermalDeltaCalculator = () => {
    const capacityVal = parseInt(calcCapacity.value);
    calcCapacityVal.textContent = `${capacityVal} MW`;

    // Formulas:
    // PUE = Total energy / IT energy
    // Overhead = (PUE - 1.0) * IT energy
    const pelagicOverhead = (1.02 - 1.0) * capacityVal; // 2% overhead
    const landOverhead = (1.45 - 1.0) * capacityVal;    // 45% overhead
    const netConserved = landOverhead - pelagicOverhead;
    const carbonSavedVal = Math.round(netConserved * 4380); // ~4380 TCO2/MW/Year savings factor

    calcPelagicPower.textContent = `${pelagicOverhead.toFixed(1)} MW`;
    calcLandPower.textContent = `${landOverhead.toFixed(1)} MW`;
    calcSavedPower.textContent = `${netConserved.toFixed(1)} MW (29.6% Net Power Saved)`;
    calcCarbonSaved.textContent = `${carbonSavedVal.toLocaleString()} TONS CO2 / YEAR`;
  };
  calcCapacity.addEventListener('input', updateThermalDeltaCalculator);
  updateThermalDeltaCalculator();

  // --- Form Auto-Population Recommendation Logic ---
  copilotRecom.addEventListener('change', () => {
    const val = copilotRecom.value;
    if (val === 'azores') {
      formLat.value = "37.7412 N";
      formLon.value = "-25.6756 W";
      formDensity.value = "1,000 Nodes (50MW)";
      formCooling.value = "Direct-to-Chip Deep Ocean Water";
    } else if (val === 'pacific') {
      formLat.value = "0.0000 N";
      formLon.value = "-120.0000 W";
      formDensity.value = "2,000 Nodes (100MW)";
      formCooling.value = "Closed-Loop Saltwater Heat Exchange";
    } else if (val === 'subpolar') {
      formLat.value = "50.0000 N";
      formLon.value = "-165.0000 W";
      formDensity.value = "4,000 Nodes (200MW)";
      formCooling.value = "Hybrid Surface/Deep Thermocline";
    } else {
      // Manual reset
      formLat.value = "";
      formLon.value = "";
    }
  });

  // --- Dynamic Canvas Radar Sweeper ---
  const canvas = document.getElementById('radarCanvas');
  const ctx = canvas.getContext('2d');
  let angle = 0;
  let detectedBlips = []; // Coordinates mapped to radar space

  const drawRadar = () => {
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const r = cx - 5;

    // Clear and background
    ctx.fillStyle = '#06090a';
    ctx.fillRect(0, 0, width, height);

    // Drawing coordinate grids
    ctx.strokeStyle = '#182b22';
    ctx.lineWidth = 1;

    // Concentric grid circles
    for (let d = r / 4; d <= r; d += r / 4) {
      ctx.beginPath();
      ctx.arc(cx, cy, d, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(5, cy);
    ctx.lineTo(width - 5, cy);
    ctx.moveTo(cx, 5);
    ctx.lineTo(cx, height - 5);
    ctx.stroke();

    // Draw active & queued blips
    detectedBlips.forEach(blip => {
      // Check if blip has a mapped location on radar (mocked from actual coords)
      if (!blip.x || !blip.y) {
        // Compute mock radial coordinates on radar grid based off real coordinates hash
        const hash = Math.abs(hashCode(blip.title));
        const theta = (hash % 360) * Math.PI / 180;
        const radiusDist = (r / 3) + (hash % Math.floor(r * 0.5));
        blip.x = cx + Math.cos(theta) * radiusDist;
        blip.y = cy + Math.sin(theta) * radiusDist;
      }

      ctx.beginPath();
      ctx.arc(blip.x, blip.y, 4, 0, Math.PI * 2);
      if (blip.isQueued) {
        ctx.fillStyle = 'rgba(255, 90, 31, 0.8)';
        ctx.shadowColor = '#FF5A1F';
      } else {
        ctx.fillStyle = 'rgba(0, 255, 102, 0.8)';
        ctx.shadowColor = '#00FF66';
      }
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    });

    // Draw scanning sweeper line
    const sx = cx + Math.cos(angle) * r;
    const sy = cy + Math.sin(angle) * r;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx, sy);
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Radar face glow following the sweeping hand
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle - 0.25, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 255, 102, 0.04)';
    ctx.fill();

    angle += 0.015;
    if (angle >= Math.PI * 2) {
      angle = 0;
    }

    requestAnimationFrame(drawRadar);
  };

  // Hash helper to seed steady radar point locations
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  // --- Durable State Register Fetch Functions (GET /api/memory) ---
  const syncMemoryData = async () => {
    try {
      memoryLoading.style.display = 'block';
      memoryList.style.display = 'none';

      const response = await fetch('/api/memory');
      if (!response.ok) {
        throw new Error("HTTP connection threshold breached.");
      }

      const memories = await response.json();
      renderMemoryItems(memories);

      // Flash "SYNCHRONIZED" status box
      syncStatus.textContent = "SYNCHRONIZED";
      syncStatus.style.borderColor = "var(--accent)";
      syncStatus.style.color = "var(--accent)";
      syncStatus.style.backgroundColor = "rgba(0, 255, 102, 0.08)";

    } catch (err) {
      console.error(err);
      syncStatus.textContent = "SYNC_FAILED";
      syncStatus.style.borderColor = "var(--error)";
      syncStatus.style.color = "var(--error)";
      syncStatus.style.backgroundColor = "rgba(255, 59, 48, 0.08)";
    } finally {
      memoryLoading.style.display = 'none';
      memoryList.style.display = 'block';
    }
  };

  const renderMemoryItems = (memories) => {
    memoryList.innerHTML = '';
    detectedBlips = [];

    if (memories.length === 0) {
      memoryList.innerHTML = `
        <div class="loading-indicator text-muted" style="border: none;">
          -- REGISTER EMTPY // NO OFFSHORE HULLS QUEUED --
        </div>
      `;
      // Update telemetry globals
      mPue.textContent = "1.00";
      mTemp.textContent = "---";
      mMw.textContent = "0 MW";
      return;
    }

    let totalMw = 0;
    let averagePue = 0;

    memories.forEach(mem => {
      const date = new Date(mem.createdAt);
      const timeStr = date.toISOString().replace('T', ' ').substr(0, 19);

      let parsedBody = {};
      try {
        parsedBody = JSON.parse(mem.body);
      } catch (e) {
        // Fallback for unstructured string body
        parsedBody = {
          coordinates: "COORDINATES_LOST_REDUNDANCY",
          cooling: "Direct Exchange Block v1",
          density: "Raw Storage Unit",
          pue: "1.08",
          status: "LOGICAL_STORED_MEM"
        };
      }

      // Add to radar tracking array
      const isQueued = String(parsedBody.status || '').includes("QUEUED") || String(mem.title || '').includes("QUEUE");
      detectedBlips.push({
        title: mem.title,
        isQueued: isQueued
      });

      // Calculate total capacity
      if (parsedBody.density) {
        const mwFound = parsedBody.density.match(/(\d+)MW/);
        if (mwFound && mwFound[1]) {
          totalMw += parseInt(mwFound[1]);
        } else {
          totalMw += 50; // Fallback
        }
      } else {
        totalMw += 50;
      }

      // Calculate average PUE
      const floatPue = parseFloat(parsedBody.pue || "1.02");
      averagePue += floatPue;

      const card = document.createElement('div');
      card.className = 'memory-item';

      const tagStatus = parsedBody.status || "NOMINAL";
      const displayTag = tagStatus.includes("//") ? tagStatus.split("//")[0].trim() : tagStatus;

      card.innerHTML = `
        <span class="memory-status-tag">${displayTag}</span>
        <div class="memory-content-box">
          <div class="memory-title-line">
            <span class="memory-title">${mem.title}</span>
            <button class="btn-decom" data-id="${mem.id}">DECOMMISSION</button>
          </div>
          <div class="memory-body-data">
            <div class="memory-kv">
              <span class="text-muted">COORDS:</span>
              <span class="memory-v">${parsedBody.coordinates || parsedBody.coords || 'ERR_ABSENT_POS'}</span>
            </div>
            <div class="memory-kv">
              <span class="text-muted">COOLING_ARCH:</span>
              <span class="memory-v">${parsedBody.cooling || 'Fresh counterloop'}</span>
            </div>
            <div class="memory-kv">
              <span class="text-muted">NODES:</span>
              <span class="memory-v">${parsedBody.density || 'Generic array'}</span>
            </div>
            <div class="memory-kv">
              <span class="text-muted">PUE:</span>
              <span class="memory-v text-accent">${parsedBody.pue || '1.02'}</span>
            </div>
          </div>
          <div style="font-size: 8px; color: var(--text-muted); margin-top: 4px; border-top: 1px dotted rgba(255,255,255,0.02); padding-top: 2px;">
            SECURE_SHA_HASH: ${mem.id} // LOGGED_ON: ${timeStr}
          </div>
        </div>
      `;

      memoryList.appendChild(card);
    });

    // Compute and display metrics based on active items
    const globalPueVal = memories.length > 0 ? (averagePue / memories.length) : 1.02;
    mPue.textContent = globalPueVal.toFixed(3);
    mMw.textContent = `${totalMw} MW`;
    mTemp.textContent = memories.length > 0 ? "4.2°C" : "15.0°C"; // Sea depth or surface temp

    // Setup decommissioning event listeners
    const btnDecoms = memoryList.querySelectorAll('.btn-decom');
    btnDecoms.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        e.target.textContent = "CLOSING_SYS...";
        e.target.disabled = true;

        try {
          const res = await fetch(`/api/memory/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error("Faulty decommission sequence.");
          
          await syncMemoryData();
        } catch (err) {
          alert(`ERR: Unable to execute shutdown sequence. ${err.message}`);
          e.target.textContent = "DECOMMISSION";
          e.target.disabled = false;
        }
      });
    });
  };

  // Form Submit Execution (POST /api/memory)
  deploymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const latVal = formLat.value.trim();
    const lonVal = formLon.value.trim();
    const densityVal = formDensity.value;
    const coolingVal = formCooling.value;

    const uniqueHullId = "HULL-" + Math.floor(100 + Math.random() * 900);
    const titleVal = `${uniqueHullId} // DEPLOY_QUEUE`;

    const bodyObj = {
      coordinates: `${latVal}, ${lonVal}`,
      pue: "1.020",
      density: densityVal,
      cooling: coolingVal,
      status: "QUEUED // SEC_PROTO_ACTIVE"
    };

    const submitBtn = document.getElementById('btn-submit-deployment');
    const origText = submitBtn.innerHTML;
    submitBtn.innerHTML = "LOCKING_CONFIG_SECTORS <span class='blinking'>...</span>";
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: titleVal,
          body: JSON.stringify(bodyObj)
        })
      });

      if (!res.ok) {
        throw new Error("Durable disk write exception.");
      }

      // Add immediate system message in copilot confirming initialization
      appendChatLog("SYS", `[SEC_CONN // FLOTILLA LOCKED] - Queue entry successfully registered in the secure database. Synchronized with terminal layout. Coordinating satellite lock-on for target latitude/longitude ${latVal}, ${lonVal}.`);

      // Reset form variables
      formLat.value = "";
      formLon.value = "";
      copilotRecom.value = "manual";

      // Sync updated memory registry
      await syncMemoryData();

    } catch (err) {
      alert(`ERR: Provision execution aborted. ${err.message}`);
    } finally {
      submitBtn.innerHTML = origText;
      submitBtn.disabled = false;
    }
  });


  // --- COPILOT Chat Logic (POST /api/copilot) ---
  const appendChatLog = (sender, text) => {
    const msg = document.createElement('div');
    msg.className = sender === 'SYS' ? 'system-chat-message' : 'client-chat-message';

    const date = new Date();
    const tsStr = `[${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}]`;

    const roleName = sender === 'SYS' ? 'PELAGIC_AI_ARCHITECT:' : 'ENGINEER_OPERATIVE:';
    const tagClass = sender === 'SYS' ? 'text-primary' : 'text-accent';

    msg.innerHTML = `
      <span class="chat-timestamp">${tsStr}</span>
      <span class="chat-role ${tagClass}">${roleName}</span>
      <span class="chat-text">${formatMarkdownText(text)}</span>
    `;

    chatLogs.appendChild(msg);
    chatLogs.scrollTop = chatLogs.scrollHeight;
  };

  // Heavy duty text formatter to render nested lists or bold elements for console look-and-feel
  const formatMarkdownText = (text) => {
    let clean = text;
    // Bold parsing
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    clean = clean.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code parsing
    clean = clean.replace(/`(.*?)`/g, '<code>$1</code>');
    // Bullet tags
    clean = clean.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
    // Wrap lists if present
    if (clean.includes('<li>')) {
      // Find list clusters and wrap them. For simplicity, just wrap if any exist.
    }
    return clean;
  };

  const handleCopilotQuery = async (query) => {
    if (!query) return;

    appendChatLog('USER', query);
    chatInput.value = '';

    // Create a typing loading indicator
    const typeIndicator = document.createElement('div');
    typeIndicator.className = 'system-chat-message';
    typeIndicator.id = 'type-indicator-cop';
    typeIndicator.innerHTML = `
      <span class="chat-timestamp">[SYS]</span>
      <span class="chat-role text-primary">PELAGIC_AI_ARCHITECT:</span>
      <span class="chat-text blinking">COMPUTING_ALGORITHMIC_VECTORS_ON_OCEAN_THERMO_GRID...</span>
    `;
    chatLogs.appendChild(typeIndicator);
    chatLogs.scrollTop = chatLogs.scrollHeight;

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: query })
      });

      if (!response.ok) {
        throw new Error("AIS packet loss. API response error.");
      }

      const result = await response.json();
      
      // Remove typing placeholder
      const placeholder = document.getElementById('type-indicator-cop');
      if (placeholder) placeholder.remove();

      appendChatLog('SYS', result.response);

    } catch (err) {
      const placeholder = document.getElementById('type-indicator-cop');
      if (placeholder) placeholder.remove();
      
      appendChatLog('SYS', `[CONNECTION_INTERRUPTED] - Terminal pipeline error: ${err.message}`);
    }
  };

  // Submit on chat form
  copilotChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (query) {
      handleCopilotQuery(query);
    }
  });

  // Handle preset queries
  copilotChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      handleCopilotQuery(q);
    });
  });

  // Manual Trigger Refresh Register Sync Button
  btnRefreshMemory.addEventListener('click', syncMemoryData);

  // --- Initial System Boot Sequence ---
  drawRadar();
  syncMemoryData();
});
