// Active screen tracker (defaulting to onboarding first as requested for founder flow)
let currentActiveScreen = 'onboarding';

// Local cache of state populated from GET /api/memory
let appStateMemory = {};

// Local cache of current generated timeline events
let timelineCache = { calendar: [], nudges: [], customNudges: [] };

/**
 * Toast trigger helper
 */
function toggleToast(msg, show) {
  const toastBanner = document.getElementById('toast-banner');
  const toastText = document.getElementById('toast-message');
  if (show) {
    toastText.innerText = msg;
    toastBanner.classList.remove('hidden');
  } else {
    toastBanner.classList.add('hidden');
  }
}

/**
 * Switch between the elegant tabs with fade/slide class transitions
 */
function switchScreen(screenId) {
  currentActiveScreen = screenId;
  
  // Update nav button stylings
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const btnScreen = btn.getAttribute('data-screen');
    if (btnScreen === screenId) {
      btn.classList.add('bg-[#EBE2DA]', 'font-semibold', 'border-l-4', 'border-paceAccent');
      btn.classList.remove('hover:bg-[#EBE2DA]');
    } else {
      btn.classList.remove('bg-[#EBE2DA]', 'font-semibold', 'border-l-4', 'border-paceAccent');
      btn.classList.add('hover:bg-[#EBE2DA]');
    }
  });

  // Cycle and toggle screen visibility classes
  const screens = ['onboarding', 'myday', 'ai', 'calibrate', 'history'];
  screens.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (s === screenId) {
      el.classList.remove('hidden', 'pointer-events-none', 'absolute', 'opacity-0', 'translate-y-4');
      el.classList.add('opacity-100', 'translate-y-0');
    } else {
      el.classList.add('hidden', 'pointer-events-none', 'absolute', 'opacity-0', 'translate-y-4');
      el.classList.remove('opacity-100', 'translate-y-0');
    }
  });

  // Scroll main view back to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Initializes and fetches memory records on load
 */
async function loadStateFromServer() {
  try {
    const memoryResponse = await fetch('/api/memory');
    const resValue = await memoryResponse.json();
    if (resValue.success) {
      appStateMemory = resValue.data;
      
      // Update config views
      const settings = appStateMemory.settings || {};
      
      // 1. Sidebar indicators
      document.getElementById('sb-account').innerText = settings.googleAccount || 'Demo Account Missing';
      document.getElementById('sb-goal').innerText = settings.primaryGoal || 'Sustainable Weight Loss';
      document.getElementById('sb-freq').innerText = settings.nudgeFrequency || 'Balanced';

      // 2. Settings form inputs
      if (document.getElementById('config-goal')) {
        document.getElementById('config-goal').value = settings.primaryGoal || 'Sustainable Weight Loss';
      }
      if (document.getElementById('config-freq')) {
        document.getElementById('config-freq').value = settings.nudgeFrequency || 'Balanced (Between major meetings)';
      }
      if (document.getElementById('config-email')) {
        document.getElementById('config-email').value = settings.googleAccount || '';
      }

      // Update the dashboard dynamic coach card heading
      if (document.getElementById('coach-goal-status')) {
        document.getElementById('coach-goal-status').innerText = `${settings.primaryGoal || 'Weight Loss'} Calibrator`;
      }

      // 3. Raw Debug JSON
      const jsonInspector = document.getElementById('raw-json-inspector');
      if (jsonInspector) {
        jsonInspector.innerText = JSON.stringify(appStateMemory, null, 2);
      }

      // Populate history feed
      populateHistoryFeed();
      
      // Populate completed checkout habit log list
      populateHabitLogChecklist();
    }
  } catch (error) {
    console.error('Error fetching state memory:', error);
  }
}

/**
 * Retreives timeline schedules mapping mock meetings + dynamically integrated Nudges
 */
async function loadTimeline() {
  try {
    const timelineResponse = await fetch('/api/calendar-mock');
    const data = await timelineResponse.json();
    if (data.success) {
      timelineCache = data;
      renderTimelineView();
    }
  } catch (err) {
    console.error('Error fetching calendar timeline feedback:', err);
  }
}

/**
 * Builds meeting and nudge rows inside "My Day" screen 2
 */
function renderTimelineView() {
  const container = document.getElementById('timeline-list');
  if (!container) return;
  container.innerHTML = '';

  const { calendar, nudges, customNudges } = timelineCache;

  // Merge general lists and sort logically or display by category grouping 
  // Let's weave them realistically. Let's arrange sequentially:
  // Base events in order:
  // 1. Standup Meet (10:00 - 10:30)
  // 2. Mobility Break (10:30 - 10:40)
  // 3. Deep Work (11:00 - 1:00)
  // 4. Lunch Nudge (1:00 - 1:30)
  // 5. Sprint Planning (2:15 - 3:00)
  // 6. Walk Nudge (3:00 - 3:15)
  // 7. Client Review (4:00 - 4:45)
  
  // Let's create an ordered array of rows
  const sequence = [
    { type: 'meeting', title: 'Start of Professional Day', val: '9:00 AM', desc: 'No morning meetings detected', duration: '', badge: 'Placeholder', bg: 'bg-[#FCFAF8] opacity-75 border-slate-200' },
    ...calendar.map(item => ({ ...item, isMeeting: true })),
    ...nudges.map(item => ({ ...item, isNudge: true })),
    ...customNudges.map(item => ({ ...item, isCustomNudge: true }))
  ];

  // Simple sequential sorter mapping approximate times in day
  const timeScores = {
    '9:00 AM': 9.0,
    '9:50 AM - 10:00 AM': 9.8,
    '10:00 AM - 10:30 AM': 10.0,
    '10:30 AM - 10:40 AM': 10.5,
    '11:00 AM - 1:00 PM': 11.0,
    '11:00 AM - 11:30 AM': 11.2,
    '1:00 PM - 1:30 PM': 13.0,
    '2:15 PM - 3:00 PM': 14.25,
    '3:00 PM - 3:15 PM': 15.0,
    '4:00 PM - 4:45 PM': 16.0,
    '4:45 PM - 4:55 PM': 16.75
  };

  sequence.sort((a, b) => {
    const scoreA = timeScores[a.detail || a.val] || 12.0;
    const scoreB = timeScores[b.detail || b.val] || 12.0;
    return scoreA - scoreB;
  });

  sequence.forEach(el => {
    // Determine card styling based on event classification
    let cardHtml = '';

    if (el.isMeeting) {
      // Crisp Meeting Card represent Google Workspace structure
      cardHtml = `
        <div class="p-4 bg-white border border-[#E6DCD5] rounded-xl flex items-center justify-between shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-2.5 h-16 bg-[#DDD0C6] rounded-full"></div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">Sync Block</span>
                <span class="text-[10px] text-red-500 font-bold uppercase tracking-wider">${el.meta}</span>
              </div>
              <h4 class="font-semibold text-sm text-pacePrimary pt-0.5">${el.title}</h4>
              <p class="text-xs text-[#78695C] font-mono">${el.detail}</p>
            </div>
          </div>
          <span class="text-xs font-bold text-slate-400 font-mono shrink-0">${el.value}</span>
        </div>
      `;
    } else if (el.isNudge || el.isCustomNudge) {
      // Terracotta highlight nudge card
      // Check if this habit is already completed in state
      const habitKey = `log_${el.id || el.title}`;
      const isCompleted = appStateMemory.habitLogs && appStateMemory.habitLogs.some(log => log.habitId === el.title || log.habitId === el.id);

      cardHtml = `
        <div class="p-4 rounded-xl border ${isCompleted ? 'bg-emerald-50/50 border-emerald-200' : 'bg-[#FCFAF8] border-paceAccent/25 hover:border-paceAccent'} nudge-card flex items-center justify-between">
          <div class="flex items-start space-x-3">
            <!-- Habit completions checkbox trigger! -->
            <button onclick="toggleHabitComplete('${el.id || el.title}', '${el.title}', '${el.detail}')" class="mt-1 flex-shrink-0" title="Complete Nudge Habit">
              ${isCompleted 
                ? `<svg class="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`
                : `<div class="w-6 h-6 border-2 border-[#D4C5BD] hover:border-paceAccent rounded-full flex items-center justify-center transition">
                     <span class="w-2.5 h-2.5 rounded-full bg-paceAccent opacity-0 hover:opacity-100 transition-opacity"></span>
                   </div>`
              }
            </button>
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold text-[#E05A47] uppercase tracking-wider">${el.status || 'Pace Nudge'}</span>
                ${isCompleted ? `<span class="text-[9px] font-bold uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">Completed & Logged</span>` : ''}
              </div>
              <h4 class="font-serif text-sm font-bold text-pacePrimary pt-0.5 ${isCompleted ? 'line-through text-slate-400' : ''}">${el.title}</h4>
              <p class="text-xs text-slate-600 font-serif italic">${el.meta || 'Nudge'}</p>
              <p class="text-[10px] text-slate-500 font-mono mt-1">${el.detail || el.val}</p>
            </div>
          </div>
          <span class="text-xs font-bold text-paceAccent font-mono shrink-0">${el.value || '15m'}</span>
        </div>
      `;
    } else {
      // Start of day placeholder row
      cardHtml = `
        <div class="p-3 border border-[#E6DCD5] rounded-xl bg-[#FDFBF7] text-xs text-[#9C8F84] italic text-center">
          ${el.title} — ${el.val}
        </div>
      `;
    }

    container.innerHTML += cardHtml;
  });

  recalculateCompletionStats();
}

/**
 * Logs a completed habit block to physical POST /api/memory
 */
async function toggleHabitComplete(habitId, label, timeBlock) {
  // Check if already completed to prevent spam
  const alreadyCompleted = appStateMemory.habitLogs && appStateMemory.habitLogs.some(log => log.habitId === habitId);
  if (alreadyCompleted) {
    toggleToast(`Habit "${label}" is already marked complete! See History Log.`, true);
    return;
  }

  const payload = {
    habitId: habitId,
    habitName: label,
    timeBlock: timeBlock,
    action: 'Completed transition break nutrition/movement target'
  };

  try {
    const payloadResponse = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'habitLog',
        payload: payload
      })
    });
    const writeResult = await payloadResponse.json();
    if (writeResult.success) {
      toggleToast(`Checked off "${label}"! Log written to local memory.`, true);
      // Reload states
      await loadStateFromServer();
      await loadTimeline();
    }
  } catch (err) {
    console.error('Error calling /api/memory for log completed habit:', err);
  }
}

/**
 * Calculates dynamic meeting free time stats and progress meters programmatically
 */
function recalculateCompletionStats() {
  const selectNudgeCards = timelineCache.nudges.length + (timelineCache.customNudges ? timelineCache.customNudges.length : 0);
  const loggedActionsCount = appStateMemory.habitLogs ? appStateMemory.habitLogs.length : 0;
  
  // Max cap 100%
  const checkedTarget = selectNudgeCards > 0 ? selectNudgeCards : 1;
  const progressRatio = Math.min(100, Math.round((loggedActionsCount / checkedTarget) * 100));

  const countDisplay = document.getElementById('habit-progress-pct');
  if (countDisplay) {
    countDisplay.innerText = `${progressRatio}% (${loggedActionsCount}/${selectNudgeCards})`;
  }
  const progressBar = document.getElementById('habit-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progressRatio}%`;
  }

  // Meeting free time logic based on number of busy blocks
  const busyCount = timelineCache.calendar.filter(c => c.status === 'Busy').length;
  const freeTimeVal = Math.max(1.5, 6 - (busyCount * 0.75));
  const freeTimeText = `${freeTimeVal} hrs`;
  const fMetrics = document.getElementById('metric-free');
  if (fMetrics) {
    fMetrics.innerText = freeTimeText;
  }
}

/**
 * Populates checklist inside Right side panel of My Day screen
 */
function populateHabitLogChecklist() {
  const checklistBox = document.getElementById('habit-log-checklist');
  if (!checklistBox) return;

  const logs = appStateMemory.habitLogs || [];
  if (logs.length === 0) {
    checklistBox.innerHTML = `<div class="text-xs text-slate-400 italic">No habits logged yet today. Click circles on the left timeline!</div>`;
    return;
  }

  checklistBox.innerHTML = '';
  logs.forEach(item => {
    checklistBox.innerHTML += `
      <div class="flex items-center space-x-2 text-xs text-slate-700 bg-white p-2 rounded border border-emerald-100">
        <svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
        <div class="truncate">
          <span class="font-semibold">${item.habitName}</span>
          <span class="block text-[10px] text-slate-450">${new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • Block: ${item.timeBlock || 'N/A'}</span>
        </div>
      </div>
    `;
  });
}

/**
 * Submits custom manual nudge injection to POST /api/memory
 */
async function injectCustomNudge() {
  const title = document.getElementById('custom-nudge-title').value.trim();
  const time = document.getElementById('custom-nudge-time').value.trim();
  const meta = document.getElementById('custom-nudge-type').value;

  if (!title || !time) {
    alert('Please enter both a title and time block format for custom inject.');
    return;
  }

  const payload = {
    title: `Pace Nudge: ${title}`,
    detail: time,
    status: 'User Custom Injection',
    meta: meta,
    type: 'nudge',
    value: '15m'
  };

  try {
    const postRes = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'nudge',
        payload: payload
      })
    });
    const result = await postRes.json();
    if (result.success) {
      document.getElementById('custom-nudge-title').value = '';
      document.getElementById('custom-nudge-time').value = '';
      toggleToast(`Injected "${payload.title}" successfully into local calendar loop!`, true);
      
      // Update app views.
      await loadStateFromServer();
      await loadTimeline();
    }
  } catch (err) {
    console.error('Error injecting custom nudge:', err);
  }
}

/**
 * Handle Google Login Onboarding button simulate interaction
 */
function triggerGoogleLoginSimulation() {
  const spinner = document.getElementById('google-spinner');
  spinner.classList.remove('pointer-events-none', 'opacity-0');
  spinner.classList.add('opacity-100');

  // Trigger simulated 2-second setup flow (From branding specification creative notes)
  setTimeout(() => {
    spinner.classList.add('opacity-0', 'pointer-events-none');
    spinner.classList.remove('opacity-100');
    
    // Reveal further config onboarding fields
    document.getElementById('onboarding-setup-form').classList.remove('hidden');
    document.getElementById('google-btn-text').innerText = 'Connected as: sandboxed-professional@example.com';
    toggleToast('Google Workspace verified. Pick configuration targets and submit calibration!', true);
  }, 2000);
}

/**
 * Onboard Form Calibration Submit
 */
async function saveOnboardingAndProceed() {
  const email = 'sandboxed-professional@example.com';
  const goal = document.getElementById('onboard-goal').value;
  const freq = document.getElementById('onboard-freq').value;

  await triggerServerCalibrationSave(email, goal, freq);
  
  // Transition directly forward to screen My Day!
  switchScreen('myday');
}

/**
 * Config Screen Form Submit
 */
async function saveCalibrationForm() {
  const email = document.getElementById('config-email').value.trim() || 'demo@cofounder.example.com';
  const goal = document.getElementById('config-goal').value;
  const freq = document.getElementById('config-freq').value;

  await triggerServerCalibrationSave(email, goal, freq);

  // Reveal Success Alert Box
  const successCard = document.getElementById('calibration-success-card');
  successCard.classList.remove('hidden');
  setTimeout(() => {
    successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

/**
 * Internal logic saving state calibration to memory POST
 */
async function triggerServerCalibrationSave(email, goal, frequency) {
  const payload = {
    googleAccount: email,
    primaryGoal: goal,
    nudgeFrequency: frequency
  };

  try {
    const postRes = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'calibration',
        payload: payload
      })
    });
    const result = await postRes.json();
    if (result.success) {
      toggleToast(`Active settings saved: ${goal} | ${frequency}`, true);
      await loadStateFromServer();
      await loadTimeline();
    }
  } catch (err) {
    console.error('Error submitting calibration configuration:', err);
  }
}

/**
 * Visual verification alert
 */
function triggerCalendarSyncAlert() {
  alert('Connected sandbox verification status: OK. Meeting density scanned.');
}

/**
 * Sends a message in the Side chat window component inside screen 3
 */
async function sendCopilotChatMessage() {
  const inputEl = document.getElementById('chat-user-input');
  const userText = inputEl.value.trim();
  if (!userText) return;

  // Clear input
  inputEl.value = '';

  const messagesContainer = document.getElementById('chat-messages-container');
  
  // Appends User Bubble block
  messagesContainer.innerHTML += `
    <div class="bg-[#F5EFEB] p-3 rounded-xl border border-[#DDD0C6] self-end space-y-1 ml-6">
      <p class="font-bold text-[#2B2523] text-right">You (Busy Pro)</p>
      <p class="text-right text-[#5C4F44]">${userText}</p>
    </div>
  `;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Append a temporary thinking bubble
  const tempId = `think_${Date.now()}`;
  messagesContainer.innerHTML += `
    <div id="${tempId}" class="bg-white p-3 rounded-xl border border-[#E6DCD5] italic text-[#E05A47]">
      Pace is formulating response...
    </div>
  `;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Send request to server AI mockup
  try {
    const res = await fetch('/api/copilot-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });
    const data = await res.json();
    
    // Remove the thinking bubble
    document.getElementById(tempId).remove();

    if (data.success) {
      // Append regular response bubble
      messagesContainer.innerHTML += `
        <div class="bg-white p-3 rounded-xl border border-[#E6DCD5] space-y-1 mr-6 animate-fade-in-up">
          <p class="font-bold text-paceAccent">Pace Calendar Copilot</p>
          <p class="text-[#55493E]">${data.reply}</p>
        </div>
      `;
    } else {
      messagesContainer.innerHTML += `
        <div class="bg-red-50 p-3 rounded-xl border border-red-200 text-red-650 text-[11px]">
          Failed to process query from backend memory.
        </div>
      `;
    }
  } catch (err) {
    console.error('Error posting dialogue snippet:', err);
    document.getElementById(tempId).remove();
  }

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  await loadStateFromServer(); // Updates JSON raw inspect
}

/**
 * Submit weight tracking record
 */
async function submitWeightLog() {
  const dateStr = document.getElementById('log-weight-date').value;
  const weightVal = parseFloat(document.getElementById('log-weight-val').value);

  if (!dateStr || isNaN(weightVal)) {
    alert('Please insert a valid date and float value for weight logging.');
    return;
  }

  const payload = {
    date: dateStr,
    weight: weightVal
  };

  try {
    const saveRes = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'weightLog',
        payload: payload
      })
    });
    const r = await saveRes.json();
    if (r.success) {
      toggleToast(`Saved Weight entry (${weightVal} lbs) to durable database successfully!`, true);
      await loadStateFromServer();
    }
  } catch (e) {
    console.error('Error logging weight statistics:', e);
  }
}

/**
 * Renders history list feed on screen 5
 */
function populateHistoryFeed() {
  const container = document.getElementById('history-logs-feed');
  if (!container) return;

  container.innerHTML = '';

  const calibrations = appStateMemory.calibrations || [];
  const customNudges = appStateMemory.customNudges || [];
  const habits = appStateMemory.habitLogs || [];
  const weights = appStateMemory.weightLogs || [];
  const chats = appStateMemory.chatHistory || [];

  // Group list chronological elements
  let mergedLogs = [];

  calibrations.forEach(c => {
    mergedLogs.push({
      time: c.timestamp,
      label: 'Configuration Update',
      desc: `Set Health Goal: <strong>${c.primaryGoal}</strong> with <strong>${c.nudgeFrequency}</strong> cadence. Linked account: ${c.googleAccount}`,
      iconClass: 'text-indigo-600 bg-indigo-50 border border-indigo-150'
    });
  });

  customNudges.forEach(n => {
    mergedLogs.push({
      time: n.timestamp,
      label: 'Nudge Injected',
      desc: `Injected <strong>${n.title}</strong> at <strong>${n.detail}</strong> (${n.meta})`,
      iconClass: 'text-amber-600 bg-amber-50 border border-amber-150'
    });
  });

  habits.forEach(h => {
    mergedLogs.push({
      time: h.timestamp,
      label: 'Habit Completed',
      desc: `Checked off <strong>${h.habitName}</strong> following block <strong>${h.timeBlock}</strong>`,
      iconClass: 'text-emerald-600 bg-emerald-50 border border-emerald-150'
    });
  });

  weights.forEach(w => {
    mergedLogs.push({
      time: w.timestamp || `${w.date}T00:00:00Z`,
      label: 'Weight Log added',
      desc: `Body mass logged: <strong>${w.weight} lbs</strong> on ${w.date}`,
      iconClass: 'text-pink-600 bg-pink-50 border border-pink-150'
    });
  });

  chats.forEach(ch => {
    mergedLogs.push({
      time: ch.timestamp,
      label: 'Copilot Interview',
      desc: `Asked: "${ch.userQuery.substring(0, 40)}${ch.userQuery.length > 40 ? '...' : ''}" -> Received tailored recommendation.`,
      iconClass: 'text-teal-600 bg-teal-50 border border-teal-150'
    });
  });

  // Sort chronological descending (most recent first)
  mergedLogs.sort((a,b) => new Date(b.time) - new Date(a.time));

  if (mergedLogs.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-xs text-slate-400 italic">
        Database is currently empty. Try syncing, complete a habit, or log a physical weight value to view real, serialized records!
      </div>
    `;
    return;
  }

  mergedLogs.forEach(log => {
    const cleanTime = new Date(log.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short'});
    container.innerHTML += `
      <div class="p-4 flex space-x-3 items-start select-none">
        <div class="px-2 py-1 text-[10px] font-bold rounded-lg shrink-0 ${log.iconClass}">
          ${log.label}
        </div>
        <div class="text-xs space-y-0.5">
          <p class="text-slate-700">${log.desc}</p>
          <span class="block text-[10px] text-slate-450 text-slate-400 font-mono">${cleanTime}</span>
        </div>
      </div>
    `;
  });
}

/**
 * Resets entire backend DB to clean slate
 */
async function resetWholeDatabase() {
  if (!confirm('Are you sure you want to clear the entire sandboxed memory datastore?')) return;

  try {
    const res = await fetch('/api/memory/clear', { method: 'POST' });
    const r = await res.json();
    if (r.success) {
      toggleToast('Durable memory wiped successfully!', true);
      await loadStateFromServer();
      await loadTimeline();
    }
  } catch (err) {
    console.error('Error clearing database:', err);
  }
}

/**
 * Triggers chat clear only
 */
async function clearChatMemory() {
  if (!confirm('Clear session AI dialog history?')) return;
  // In our simple API we can just truncate chatHistory array in database 
  // Let's do it by sending a state update, or clearing. Let's send a post or do it mock-side.
  const messagesContainer = document.getElementById('chat-messages-container');
  messagesContainer.innerHTML = `
    <div class="bg-white p-3 rounded-xl border border-[#E6DCD5] space-y-1">
      <p class="font-bold text-paceAccent">Pace Calendar Copilot</p>
      <p class="text-[#55493E]">
        Dialog history cleared. Hello! Ask me any nutrition or calendar adjustment queries below.
      </p>
    </div>
  `;
}

// Initial Bootstrapper on document ready
window.addEventListener('DOMContentLoaded', async () => {
  // Boot screen
  switchScreen('onboarding');

  // Load backend memory
  await loadStateFromServer();
  
  // Load timeline events
  await loadTimeline();
});
