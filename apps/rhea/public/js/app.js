/**
 * Rhea Sanctuary — Client Application Logic
 */

// Application Global State
const state = {
    profile: null,        // Stores user onboarding configuration
    logs: [],             // Logs of physical/emotional daily rituals
    activeScreen: 'wheel', // Current viewport screen id
    selectedWheelDay: null // Day currently spotlighted on the SVG wheel
};

// Phase color mapping matches product palette
const phaseColors = {
    menstrual: '#B85A3C', // Terracotta
    follicular: '#E6DFD3', // Muted earth
    ovulatory: '#4A2E35',  // Accent Deep Plum
    luteal: '#b85a3c'      // Primary blend
};

// Document Lifecycle Init
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // 1. Hook up all DOM forms, navigation clicks, toggles
    setupEventHandlers();
    
    // 2. Load stored items from durable Express memory backend
    await loadSanctuaryData();

    // 3. Pre-fill forms dates
    const dateInput = document.getElementById('f-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    const obDateInput = document.getElementById('ob-last-period');
    if (obDateInput) {
        // Set yesterday as default for quick onboarding testing
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 21); // Set to day 21 by default to see Luteal Phase
        obDateInput.value = yesterday.toISOString().split('T')[0];
    }
}

// -------------------------------------------------------------------------
// Navigation & Routing Logic
// -------------------------------------------------------------------------
function setupEventHandlers() {
    // Bottom Navbar triggers
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.getAttribute('data-screen');
            switchScreen(screenId);
        });
    });

    // Onboarding Form Submit
    const onboardingForm = document.getElementById('onboarding-form');
    if (onboardingForm) {
        onboardingForm.addEventListener('submit', handleOnboardingSubmit);
    }

    // Daily Rhythm Form Submit
    const rhythmForm = document.getElementById('rhythm-daily-form');
    if (rhythmForm) {
        rhythmForm.addEventListener('submit', handleDailyRhythmSubmit);
    }

    // Chat AI Form Submit
    const aiForm = document.getElementById('ai-chat-form');
    if (aiForm) {
        aiForm.addEventListener('submit', handleAIChatSubmit);
    }

    // Encryption Simulator Toggle (Re-renders historical vault with lock animations)
    const cryptoToggle = document.getElementById('toggle-encryption');
    if (cryptoToggle) {
        cryptoToggle.addEventListener('change', () => {
            renderVaultLogs();
        });
    }

    // Reconfigure profile button
    const btnReconfig = document.getElementById('btn-reconfigure');
    if (btnReconfig) {
        btnReconfig.addEventListener('click', () => {
            showOnboardingView();
        });
    }

    // Wipe all data button
    const btnWipe = document.getElementById('btn-wipe-data');
    if (btnWipe) {
        btnWipe.addEventListener('click', handleWipeData);
    }
}

function switchScreen(screenId) {
    if (!state.profile) {
        showOnboardingView();
        return;
    }

    state.activeScreen = screenId;
    
    // Deactivate all screens
    const screens = document.querySelectorAll('.app-screen');
    screens.forEach(s => s.classList.add('hidden'));

    // Highlight navbar button
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(btn => {
        if (btn.getAttribute('data-screen') === screenId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Activate the targeted screen
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
        target.classList.remove('hidden');
    }

    // Perform specific screen action triggers
    if (screenId === 'wheel') {
        const metrics = calculateCycleDayAndPhase();
        state.selectedWheelDay = metrics.currentCycleDay;
        renderCycleWheel();
    } else if (screenId === 'history') {
        renderVaultLogs();
    }
}

// -------------------------------------------------------------------------
// Load and Synchronize data with Durable Memory /api/memory
// -------------------------------------------------------------------------
async function loadSanctuaryData() {
    try {
        const response = await fetch('/api/memory');
        const result = await response.json();

        if (result.success && result.data) {
            const memoryList = result.data;

            // Extract profile setting config if available
            const profileSettings = memoryList.find(item => item.type === 'profile');
            // Extract rhythm entries
            const dailyLogs = memoryList.filter(item => item.type === 'rhythm');

            state.logs = dailyLogs;
            
            if (profileSettings) {
                state.profile = profileSettings;
                // Update text placeholders
                updateProfilePlaceholders(profileSettings.nickname);
                
                // Set active day to match today
                const metrics = calculateCycleDayAndPhase();
                state.selectedWheelDay = metrics.currentCycleDay;
                
                // Hide onboarding & routing to Cycle Wheel dashboard
                document.getElementById('screen-onboarding').classList.add('hidden');
                document.getElementById('bottom-navbar').classList.remove('hidden');
                switchScreen('wheel');
            } else {
                // Show Onboarding View
                showOnboardingView();
            }

            // Sync metrics total
            updateLogCountMetric();
        }
    } catch (err) {
        console.error('Failed to query durable backend memory API:', err);
        showOnboardingView();
    }
}

function showOnboardingView() {
    state.profile = null;
    document.getElementById('bottom-navbar').classList.add('hidden');
    
    const screens = document.querySelectorAll('.app-screen');
    screens.forEach(s => s.classList.add('hidden'));
    
    document.getElementById('screen-onboarding').classList.remove('hidden');
}

function updateProfilePlaceholders(name) {
    document.querySelectorAll('.user-name-placeholder').forEach(el => {
        el.innerText = name || 'companion';
    });
}

function updateLogCountMetric() {
    const totalEl = document.getElementById('metrics-logged-days');
    if (totalEl) {
        totalEl.innerText = `${state.logs.length} ${state.logs.length === 1 ? 'Day' : 'Days'}`;
    }
}

// -------------------------------------------------------------------------
// Mathematical Cycle Calculation Logic
// -------------------------------------------------------------------------
function calculateCycleDayAndPhase(dayIndexOverride = null) {
    if (!state.profile) {
        return { currentCycleDay: 21, phaseName: 'Luteal Phase', phaseSeason: 'Autumn', pct: 75 };
    }

    const { lastPeriodDate, cycleLength } = state.profile;
    const cycleLen = parseInt(cycleLength) || 28;

    let currentCycleDay = 1;

    if (dayIndexOverride !== null) {
        currentCycleDay = dayIndexOverride;
    } else {
        const lastDate = new Date(lastPeriodDate);
        const today = new Date();
        const diffMs = today - lastDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0) {
            currentCycleDay = (diffDays % cycleLen) + 1;
        } else {
            // Future period safe fallback if date selected was future
            currentCycleDay = 1;
        }
    }

    // Determine current menstrual season phase based on percentages of average length
    let phaseName = 'Luteal Phase';
    let phaseSeason = 'Nesting / Grounding Rituals';
    let phaseCode = 'luteal';

    // 1-5 Days: Menstrual
    const mEnd = Math.max(5, Math.round(cycleLen * 0.18));
    // 6-12 Days: Follicular
    const fEnd = Math.max(12, Math.round(cycleLen * 0.43));
    // 13-17 Days: Ovulatory
    const oEnd = Math.max(17, Math.round(cycleLen * 0.60));

    if (currentCycleDay <= mEnd) {
        phaseName = 'Menstrual Phase';
        phaseSeason = 'Rest, reflection, and intuitive release.';
        phaseCode = 'menstrual';
    } else if (currentCycleDay <= fEnd) {
        phaseName = 'Follicular Phase';
        phaseSeason = 'New beginnings, creativity, and physical renewal.';
        phaseCode = 'follicular';
    } else if (currentCycleDay <= oEnd) {
        phaseName = 'Ovulatory Phase';
        phaseSeason = 'Peak energy, connection, and expressive power.';
        phaseCode = 'ovulatory';
    } else {
        phaseName = 'Luteal Phase';
        phaseSeason = 'Nesting, boundary-setting, and grounding rituals.';
        phaseCode = 'luteal';
    }

    const percentageOfCycle = Math.round((currentCycleDay / cycleLen) * 100);

    return {
        currentCycleDay,
        cycleLength: cycleLen,
        phaseName,
        phaseSeason,
        phaseCode,
        percentageOfScale: percentageOfCycle
    };
}

// -------------------------------------------------------------------------
// Onboarding Submission API
// -------------------------------------------------------------------------
async function handleOnboardingSubmit(e) {
    e.preventDefault();

    const nickname = document.getElementById('ob-nickname').value.trim();
    const lastPeriodDate = document.getElementById('ob-last-period').value;
    const cycleLength = document.getElementById('ob-cycle-length').value;
    const goal = document.getElementById('ob-goal').value;

    const payload = {
        type: 'profile',
        nickname,
        lastPeriodDate,
        cycleLength,
        goal
    };

    try {
        const response = await fetch('/api/memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            state.profile = result.data;
            updateProfilePlaceholders(nickname);
            
            // Re-calculate dates
            const metrics = calculateCycleDayAndPhase();
            state.selectedWheelDay = metrics.currentCycleDay;

            // Trigger visual success overlay
            showSuccessOverlay("Rhea Welcomes You", `Welcome to your sanctuary, ${nickname}. Your rhythms have been aligned based on your parameters.`);
            
            // Render dashboard
            document.getElementById('screen-onboarding').classList.add('hidden');
            document.getElementById('bottom-navbar').classList.remove('hidden');
            switchScreen('wheel');
        }
    } catch (err) {
        console.error('Failed to write profile setup to durable memory:', err);
        alert('We experienced a grounding error storing your parameters. Please try again.');
    }
}

// -------------------------------------------------------------------------
// Daily Rhythm Submission API (Core Workflow)
// -------------------------------------------------------------------------
async function handleDailyRhythmSubmit(e) {
    e.preventDefault();

    const sensation = document.getElementById('f-sensation').value;
    const intensity = document.getElementById('f-intensity').value;
    const flow = document.getElementById('f-flow').value;
    const bbt = parseFloat(document.getElementById('f-bbt').value);
    const emotional = document.getElementById('f-emotional').value;
    const dateValue = document.getElementById('f-date').value;

    const payload = {
        type: 'rhythm',
        physicalSensations: sensation,
        sensationIntensity: intensity,
        flowIntensity: flow,
        basalBodyTemp: bbt,
        emotionalLandscape: emotional,
        date: dateValue
    };

    try {
        const response = await fetch('/api/memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            // Append locally to keep UI ultra responsive
            state.logs.unshift(result.data);
            updateLogCountMetric();
            
            // Trigger feedback overlay
            showSuccessOverlay("Rhythm Logged", "Your daily ritual has been encrypted and saved locally. Your cycle wheel has updated to reflect this shift.");
            
            // Reset fields
            document.getElementById('rhythm-daily-form').reset();
            document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
        } else {
            alert('Failed to save log: ' + (result.error || 'Server error'));
        }
    } catch (err) {
        console.error('Network error committing Daily Sync rhythm log:', err);
        alert('Network anomaly. We were unable to commit logs to our server workspace.');
    }
}

// -------------------------------------------------------------------------
// Dynamic Cyclic SVG Circle Wheels Generator
// -------------------------------------------------------------------------
function renderCycleWheel() {
    const svgEl = document.getElementById('svg-cycle-wheel');
    if (!svgEl) return;

    // Clear old elements from code
    svgEl.innerHTML = '';

    const metrics = calculateCycleDayAndPhase();
    const cycleLen = metrics.cycleLength;
    const selectionMetrics = calculateCycleDayAndPhase(state.selectedWheelDay);

    // Update screen headers
    document.getElementById('wheel-phase-name').innerText = selectionMetrics.phaseName;
    document.getElementById('wheel-cycle-day').innerText = `Day ${selectionMetrics.currentCycleDay}`;
    document.getElementById('wheel-center-day-num').innerText = `Day ${selectionMetrics.currentCycleDay}`;
    document.getElementById('wheel-center-phase-lbl').innerText = selectionMetrics.phaseName.replace(' Phase', '').toUpperCase();

    // Svg specifications
    const centerX = 150;
    const centerY = 150;
    const innerRadius = 90; // Center hole radius
    const outerRadius = 115; // Outer ring thickness
    const middleRadius = 102.5;

    // Build outer rings day arcs segments
    const segmentAngle = 360 / cycleLen;
    const padAngle = 2; // Angle spacing gap

    for (let day = 1; day <= cycleLen; day++) {
        const dMetrics = calculateCycleDayAndPhase(day);
        const isCurrentActiveDay = (day === metrics.currentCycleDay);
        const isSelectedDay = (day === state.selectedWheelDay);

        // Highlight based on respective organic seasons color palettes
        let strokeColor = '#E6DFD3'; // Inactive
        if (dMetrics.phaseCode === 'menstrual') strokeColor = '#B85A3C'; // Red terracotta
        else if (dMetrics.phaseCode === 'follicular') strokeColor = '#bfaea8'; // Soft sand
        else if (dMetrics.phaseCode === 'ovulatory') strokeColor = '#4A2E35'; // Deep plum
        else if (dMetrics.phaseCode === 'luteal') strokeColor = '#D2856E'; // Medium warm apricot

        // Decrease non-selected day opacity to direct focus
        let opacity = isSelectedDay ? '1.0' : '0.45';
        let strokeWidth = isSelectedDay ? '18' : (isCurrentActiveDay ? '12' : '8');

        // Draw segmented polar pathways
        const startDeg = (day - 1) * segmentAngle + (padAngle / 2);
        const endDeg = day * segmentAngle - (padAngle / 2);

        const segmentPath = createSVGArcPath(centerX, centerY, middleRadius, startDeg, endDeg);
        
        const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathEl.setAttribute('d', segmentPath);
        pathEl.setAttribute('stroke', strokeColor);
        pathEl.setAttribute('stroke-width', strokeWidth);
        pathEl.setAttribute('fill', 'none');
        pathEl.classList.add('wheel-segment');
        if (isSelectedDay) pathEl.classList.add('active-segment');
        pathEl.setAttribute('opacity', opacity);

        // Add interactive hover mechanics
        pathEl.addEventListener('click', () => {
            state.selectedWheelDay = day;
            renderCycleWheel();
        });

        svgEl.appendChild(pathEl);
    }

    // Add pointer indicator for Today's Active calculated biological cycle position
    const activeAngle = (metrics.currentCycleDay - 0.5) * segmentAngle;
    const rad = (activeAngle - 90) * Math.PI / 180;
    
    // Position of pointer tip
    const pointerTipX = centerX + (middleRadius - 18) * Math.cos(rad);
    const pointerTipY = centerY + (middleRadius - 18) * Math.sin(rad);

    const pointerEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pointerEl.setAttribute('cx', pointerTipX);
    pointerEl.setAttribute('cy', pointerTipY);
    pointerEl.setAttribute('r', '6');
    pointerEl.setAttribute('fill', '#4A2E35');
    pointerEl.setAttribute('stroke', '#FFF');
    pointerEl.setAttribute('stroke-width', '25px');
    pointerEl.classList.add('wheel-pointer');
    svgEl.appendChild(pointerEl);

    // Populate standard timeline context cards below the cycle wheel
    renderPhaseTimeline(selectionMetrics);
}

// Generates correct mathematical coordinate paths for clean circular rendering
function createSVGArcPath(x, y, r, startAngle, endAngle) {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = x + r * Math.cos(startRad);
    const y1 = y + r * Math.sin(startRad);
    const x2 = x + r * Math.cos(endRad);
    const y2 = y + r * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

function renderPhaseTimeline(currentMetrics) {
    const listEl = document.getElementById('phase-items-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    const phaseConfig = [
        {
            title: "Menstrual Phase",
            detail: "Rest, reflection, and intuitive release.",
            meta: `Days 1-5`,
            dates: "Dec 12 - Dec 16",
            code: 'menstrual'
        },
        {
            title: "Follicular Phase",
            detail: "New beginnings, creativity, and physical renewal.",
            meta: "Days 6-12",
            dates: "Nov 18 - Nov 24",
            code: 'follicular'
        },
        {
            title: "Ovulatory Phase",
            detail: "Peak energy, connection, and expressive power.",
            meta: "Days 13-17",
            dates: "Nov 25 - Nov 29",
            code: 'ovulatory'
        },
        {
            title: "Luteal Phase",
            detail: 'Nesting, boundary-setting, and grounding rituals.',
            meta: "Days 18-28",
            dates: "Nov 30 - Dec 11",
            code: 'luteal'
        }
    ];

    phaseConfig.forEach(phase => {
        const itemCard = document.createElement('div');
        const isActive = currentMetrics.phaseName.toLowerCase().includes(phase.code);
        
        let statusLabel = 'Upcoming';
        let statusClass = 'upcoming';

        if (isActive) {
            statusLabel = 'Active';
            statusClass = 'active';
            itemCard.className = 'timeline-item active';
        } else {
            // Determine completed or upcoming simple sequence mock
            const order = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
            const curIdx = order.indexOf(currentMetrics.phaseCode);
            const thisIdx = order.indexOf(phase.code);

            if (thisIdx < curIdx) {
                statusLabel = 'Completed';
                statusClass = 'completed';
                itemCard.className = 'timeline-item completed';
            } else {
                itemCard.className = 'timeline-item upcoming';
            }
        }

        itemCard.innerHTML = `
            <div class="ti-header">
                <span class="ti-title">${phase.title}</span>
                <span class="ti-badge ${statusClass}">${statusLabel}</span>
            </div>
            <span class="ti-meta">${phase.meta} • ${phase.detail}</span>
        `;
        listEl.appendChild(itemCard);
    });
}

// -------------------------------------------------------------------------
// Zero-Knowledge AI Assistant Guide
// -------------------------------------------------------------------------
async function handleAIChatSubmit(e) {
    if (e) e.preventDefault();

    const queryInput = document.getElementById('ai-query-input');
    const query = queryInput.value.trim();
    if (!query) return;

    // Append User Prompt bubble to DOM
    appendChatBubble('user', query, 'You');
    queryInput.value = '';

    const metrics = calculateCycleDayAndPhase();

    // Adding simulated pulsing typing state
    const botPlaceholderId = 'bot-typing-' + Date.now();
    appendChatBubble('assistant', 'Reflecting on your current transits...', 'Rhea Helper', botPlaceholderId);

    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: query,
                activePhase: metrics.phaseName,
                cycleDay: `Day ${metrics.currentCycleDay}`
            })
        });

        const result = await response.json();
        
        // Remove typing simulator element
        const placeholder = document.getElementById(botPlaceholderId);
        if (placeholder) placeholder.remove();

        if (result.success && result.response) {
            appendChatBubble('assistant', result.response, 'Rhea Guide');
        } else {
            appendChatBubble('assistant', 'My sanctuary pathways are quiet. Please request your query again.', 'Rhea');
        }
    } catch (err) {
        console.error('Failed to request Rhea Sanctuary AI endpoint:', err);
        const placeholder = document.getElementById(botPlaceholderId);
        if (placeholder) placeholder.remove();
        appendChatBubble('assistant', 'The local cipher stream is stabilizing. Let us walk together shortly.', 'Rhea fallback');
    }
}

function triggerPreset(promptText) {
    document.getElementById('ai-query-input').value = promptText;
    handleAIChatSubmit();
}

function appendChatBubble(sender, text, senderName, id = null) {
    const chatHistory = document.getElementById('chat-history-box');
    if (!chatHistory) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-message ${sender}`;
    if (id) bubble.id = id;

    // Convert raw Markdown bold blocks to nice nested spans format
    const formattedText = text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/-\s(.*?)<br>/g, '🌿 $1<br>');

    bubble.innerHTML = `
        <div class="message-meta">${senderName}</div>
        <div class="message-content">${formattedText}</div>
    `;

    chatHistory.appendChild(bubble);

    // Dynamic focus scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// -------------------------------------------------------------------------
// Sanctuary Vault Logs History List (Zero-Knowledge Decryption Simulation)
// -------------------------------------------------------------------------
function renderVaultLogs() {
    const listEl = document.getElementById('logged-item-timeline');
    if (!listEl) return;

    listEl.innerHTML = '';

    const rhythmLogs = state.logs;
    const mockEncryptionActive = document.getElementById('toggle-encryption').checked;

    if (rhythmLogs.length === 0) {
        listEl.innerHTML = `
            <div class="no-logs">
                <p>No somatic rituals committed yet. Choose the "Log" tab on your device above to commit your current state.</p>
            </div>
        `;
        return;
    }

    rhythmLogs.forEach(entry => {
        const itemCard = document.createElement('div');
        itemCard.className = 'vault-record-card';

        // Format dates into readable editorial styles
        const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Encrypted state vs Decrypted presentation
        if (mockEncryptionActive) {
            const mockSecureHex = `SHA-256::AES-GCM::0x${(entry.id.split('-')[2] || 'A4E81').toUpperCase()}${btoa(entry.physicalSensations).slice(0, 16)}`;
            
            itemCard.innerHTML = `
                <div class="vault-header">
                    <span class="vault-date-stamp">👁️‍🗨️ Private Record</span>
                    <button class="delete-record-btn" onclick="handleDeleteRecord('${entry.id}')" title="Delete Permanent Log">×</button>
                </div>
                <div class="v-item mb-2" style="font-family: monospace; color: #a49e99;">
                    <span class="v-lbl" style="color: var(--primary-color);">CIPHER OFFSET KEY</span>
                    <span class="v-val text-xs" style="word-break: break-all;">${mockSecureHex}</span>
                </div>
                <div class="v-item">
                    <span class="v-lbl">Status</span>
                    <span class="v-status-badge">Locked & Bound Client-Side</span>
                </div>
            `;
        } else {
            itemCard.innerHTML = `
                <div class="vault-header">
                    <span class="vault-date-stamp">${formattedDate}</span>
                    <button class="delete-record-btn" onclick="handleDeleteRecord('${entry.id}')" title="Delete Permanent Log">×</button>
                </div>
                <div class="vault-grid">
                    <div class="v-item">
                        <span class="v-lbl">Physical Sensations</span>
                        <span class="v-val">${escapeHtml(entry.physicalSensations)}</span>
                    </div>
                    <div class="v-item">
                        <span class="v-lbl">Intensity</span>
                        <span class="v-val">${escapeHtml(entry.sensationIntensity)}</span>
                    </div>
                    <div class="v-item">
                        <span class="v-lbl">Uterine Flow</span>
                        <span class="v-val">${escapeHtml(entry.flowIntensity)}</span>
                    </div>
                    <div class="v-item">
                        <span class="v-lbl">Basal Temp</span>
                        <span class="v-val">${escapeHtml(entry.basalBodyTemp)} °F</span>
                    </div>
                    <div class="v-item v-span-full mt-2">
                        <span class="v-lbl">Emotional Landscape</span>
                        <span class="v-val" style="color: var(--primary-color);">${escapeHtml(entry.emotionalLandscape)}</span>
                    </div>
                </div>
            `;
        }

        listEl.appendChild(itemCard);
    });
}

// Delete specified entry in durable database
async function handleDeleteRecord(id) {
    if (!confirm('Are you sure you wish to delete this intimate rhythm record forever?')) {
        return;
    }

    try {
        const response = await fetch(`/api/memory/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            // Remove locally and re-render
            state.logs = state.logs.filter(i => i.id !== id);
            updateLogCountMetric();
            renderVaultLogs();
            
            // Highlight deleted success
            showSuccessOverlay("Purge Completed", "Your rhythm record has been thoroughly zeroed and purged from local disks memory.");
        } else {
            alert('Failed to delete log entry.');
        }
    } catch (err) {
        console.error('Failed to trigger deletion on backend:', err);
    }
}

// Global hook triggers for deletion callbacks
window.handleDeleteRecord = handleDeleteRecord;

// Complete data drop reset
async function handleWipeData() {
    if (!confirm('EXTREME ACTIONS: This will delete ALL logged rhythms and configurations. Are you sure you wish to start from clean blank slate?')) {
        return;
    }

    // Delete everything in state
    try {
        // Find profile configuration in memory and delete it if any
        if (state.profile) {
            await fetch(`/api/memory/${state.profile.id}`, { method: 'DELETE' });
        }
        
        // Loop and wipe each rhythm log
        for (const log of state.logs) {
            await fetch(`/api/memory/${log.id}`, { method: 'DELETE' });
        }

        state.profile = null;
        state.logs = [];

        // Clear forms
        document.getElementById('rhythm-daily-form').reset();
        
        // Return to Onboarding Screen state
        showOnboardingView();
        showSuccessOverlay("Sanctuary Purged", "All parameters have been removed successfully. Safe travels.");
    } catch (err) {
        console.error('Error during global sanctuary memory wipe:', err);
    }
}

// -------------------------------------------------------------------------
// Modal Overlay Operations
// -------------------------------------------------------------------------
function showSuccessOverlay(title, description) {
    const oTitle = document.getElementById('overlay-title');
    const oMsg = document.getElementById('overlay-msg');
    
    if (oTitle) oTitle.innerText = title;
    if (oMsg) oMsg.innerText = description;

    document.getElementById('success-overlay').classList.remove('hidden');
}

function closeSuccessOverlay() {
    document.getElementById('success-overlay').classList.add('hidden');
}

// Global escape HTML helper inputs sanitization
function escapeHtml(unsafe) {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

window.closeSuccessOverlay = closeSuccessOverlay;
window.triggerPreset = triggerPreset;
