const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'memory.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize file if not exists
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    calibrations: [],
    customNudges: [],
    chatHistory: [],
    habitLogs: [],
    weightLogs: [
      { id: 'w-1', date: '2026-08-25', weight: 198.5 },
      { id: 'w-2', date: '2026-08-28', weight: 197.6 },
      { id: 'w-3', date: '2026-08-30', weight: 196.8 }
    ],
    // Setup initial calibration if empty
    settings: {
      primaryGoal: 'Sustainable Weight Loss',
      nudgeFrequency: 'Balanced (Between major meetings)',
      googleAccount: 'cal-sync-demo@cofounder.example.com',
      calibratedAt: '2026-08-31 02:13Z'
    }
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
}

// Read database utility
function readMemory() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading memory file:', error);
    return {
      calibrations: [],
      customNudges: [],
      chatHistory: [],
      habitLogs: [],
      weightLogs: [],
      settings: {}
    };
  }
}

// Write database utility
function writeMemory(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing memory file:', error);
    return false;
  }
}

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * GET /api/memory
 * Gets the entire memory or filtered items
 */
app.get('/api/memory', (req, res) => {
  const data = readMemory();
  res.json({
    success: true,
    data: data
  });
});

/**
 * POST /api/memory
 * Saves or updates structured memory data based on 'type' parameter
 */
app.post('/api/memory', (req, res) => {
  const { type, payload } = req.body;
  
  if (!type || !payload) {
    return res.status(400).json({
      success: false,
      message: "Missing 'type' or 'payload' in POST parameters."
    });
  }

  const data = readMemory();
  const timestamp = new Date().toISOString();
  const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const record = {
    id,
    timestamp,
    ...payload
  };

  switch (type) {
    case 'calibration':
      data.calibrations.push(record);
      data.settings = {
        primaryGoal: payload.primaryGoal || data.settings.primaryGoal,
        nudgeFrequency: payload.nudgeFrequency || data.settings.nudgeFrequency,
        googleAccount: payload.googleAccount || data.settings.googleAccount,
        calibratedAt: timestamp
      };
      break;

    case 'nudge':
      data.customNudges.push(record);
      break;

    case 'chat':
      data.chatHistory.push(record);
      break;

    case 'habitLog':
      data.habitLogs.push(record);
      break;

    case 'weightLog':
      data.weightLogs.push(record);
      break;

    default:
      return res.status(400).json({
        success: false,
        message: `Unknown record type: '${type}'. Supported types: calibration, nudge, chat, habitLog, weightLog.`
      });
  }

  if (writeMemory(data)) {
    res.json({
      success: true,
      message: `Successfully saved record of type: ${type}`,
      record: record,
      fullSettings: data.settings
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to write record to durable database.'
    });
  }
});

/**
 * POST /api/memory/clear
 * Utility endpoint to reset memory state (clean slate testing)
 */
app.post('/api/memory/clear', (req, res) => {
  const resetData = {
    calibrations: [],
    customNudges: [],
    chatHistory: [],
    habitLogs: [],
    weightLogs: [],
    settings: {
      primaryGoal: 'Sustainable Weight Loss',
      nudgeFrequency: 'Balanced (Between major meetings)',
      googleAccount: '',
      calibratedAt: ''
    }
  };
  
  if (writeMemory(resetData)) {
    res.json({
      success: true,
      message: 'Database memory cleared.'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to empty database.'
    });
  }
});

/**
 * GET /api/calendar-mock
 * Dynamically constructs calendar events and corresponding habit nudges
 * tailored to user settings. Allows full interactiveness in frontend!
 */
app.get('/api/calendar-mock', (req, res) => {
  const data = readMemory();
  const settings = data.settings || {};
  const frequency = settings.nudgeFrequency || 'Balanced (Between major meetings)';

  // Mock standard day calendar with gaps
  const baseCalendar = [
    {
      id: 'cal-1',
      title: 'Standup Meeting (Google Meet)',
      detail: '10:00 AM - 10:30 AM',
      status: 'Busy',
      meta: 'High cognitive load',
      type: 'meeting',
      value: '30m'
    },
    {
      id: 'cal-2',
      title: 'Deep Work Block',
      detail: '11:00 AM - 1:00 PM',
      status: 'Focus',
      meta: 'Hydration reminder active',
      type: 'focus',
      value: '2h'
    },
    {
      id: 'cal-3',
      title: 'Sprint Planning (Google Meet)',
      detail: '2:15 PM - 3:00 PM',
      status: 'Busy',
      meta: 'Medium cognitive load',
      type: 'meeting',
      value: '45m'
    },
    {
      id: 'cal-4',
      title: 'Client Review (Google Meet)',
      detail: '4:00 PM - 4:45 PM',
      status: 'Busy',
      meta: 'External call',
      type: 'meeting',
      value: '45m'
    }
  ];

  // Dynamic habit nudges generated based on settings Nudge Frequency
  let nudges = [];

  if (frequency.includes('Gentle')) {
    // Fewer nudges, only long gaps
    nudges = [
      {
        id: 'nudge-1',
        title: 'Pace Nudge: High-Protein Lunch',
        detail: '1:00 PM - 1:30 PM',
        status: 'Recommended',
        meta: 'Calibrated to your 1PM gap. High Protein helps minimize PM slump.',
        type: 'nudge',
        value: '30m'
      },
      {
        id: 'nudge-2',
        title: 'Pace Nudge: Hydration Check-in',
        detail: '3:00 PM - 3:15 PM',
        status: 'Recommended',
        meta: 'Gulp 400ml ice water preceding afternoon tasks.',
        type: 'nudge',
        value: '15m'
      }
    ];
  } else if (frequency.includes('Active')) {
    // Lots of small nudges, filling every transition
    nudges = [
      {
        id: 'nudge-1',
        title: 'Pace Nudge: Glass of Water',
        detail: '9:50 AM - 10:00 AM',
        status: 'Recommended',
        meta: 'Prep for standup with hydration.',
        type: 'nudge',
        value: '10m'
      },
      {
        id: 'nudge-2',
        title: 'Pace Nudge: 10-Min Mobility Break',
        detail: '10:30 AM - 10:40 AM',
        status: 'Recommended',
        meta: 'Post-meeting transitions: Neck rolls and quad stretch.',
        type: 'nudge',
        value: '10m'
      },
      {
        id: 'nudge-3',
        title: 'Pace Nudge: Deep Work Standing',
        detail: '11:00 AM - 11:30 AM',
        status: 'Recommended',
        meta: 'Raise desk to active standing posture.',
        type: 'nudge',
        value: '30m'
      },
      {
        id: 'nudge-4',
        title: 'Pace Nudge: High-Protein Lunch',
        detail: '1:00 PM - 1:30 PM',
        status: 'Recommended',
        meta: 'Calibrated to your 1PM gap. 30g+ protein target.',
        type: 'nudge',
        value: '30m'
      },
      {
        id: 'nudge-5',
        title: 'Pace Nudge: Afternoon Walk Nudge',
        detail: '3:00 PM - 3:15 PM',
        status: 'Recommended',
        meta: '15-min brisk walk scheduled during 3 PM gap to reset posture.',
        type: 'nudge',
        value: '15m'
      },
      {
        id: 'nudge-6',
        title: 'Pace Nudge: Deep Breathing Reset',
        detail: '4:45 PM - 4:55 PM',
        status: 'Recommended',
        meta: 'Transition to evening, trigger recovery mode.',
        type: 'nudge',
        value: '10m'
      }
    ];
  } else {
    // Balanced
    nudges = [
      {
        id: 'nudge-1',
        title: 'Pace Nudge: 10-Min Mobility Break',
        detail: '10:30 AM - 10:40 AM',
        status: 'Recommended',
        meta: 'Post-meeting transition: dynamic shoulders and core extension.',
        type: 'nudge',
        value: '10m'
      },
      {
        id: 'nudge-2',
        title: 'Pace Nudge: High-Protein Lunch',
        detail: '1:00 PM - 1:30 PM',
        status: 'Recommended',
        meta: 'Calibrated to your 1PM gap. Boost thermogenesis with protein.',
        type: 'nudge',
        value: '30m'
      },
      {
        id: 'nudge-3',
        title: 'Pace Nudge: 15-Min Brisk Walk',
        detail: '3:00 PM - 3:15 PM',
        status: 'Recommended',
        meta: 'Simulated PM slump metabolic hack. Boost glucose clearing.',
        type: 'nudge',
        value: '15m'
      }
    ];
  }

  // Combine into standard chrono layout.
  // We can sort them or return separately so frontend merges them beautifully.
  res.json({
    success: true,
    calendar: baseCalendar,
    nudges: nudges,
    customNudges: data.customNudges || []
  });
});

/**
 * POST /api/copilot-chat
 * A warm, scientific, deliberate Copilot chatbot simulator.
 * Returns smart answers matching user calendar, health goals, and questions.
 */
app.post('/api/copilot-chat', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const memory = readMemory();
  const goal = (memory.settings && memory.settings.primaryGoal) || 'Sustainable Weight Loss';
  const frequency = (memory.settings && memory.settings.nudgeFrequency) || 'Balanced';

  // Warm, scientific, deliberate replies
  let responseText = "";
  const msgLower = message.toLowerCase();

  if (msgLower.includes('protein') || msgLower.includes('eat') || msgLower.includes('lunch') || msgLower.includes('food') || msgLower.includes('calorie')) {
    responseText = `Pace Calendar Copilot: Scientific consensus points toward 30g of protein before your high-cognition meetings. Since your health goal is "${goal}", taking your lunch in the 1:00 PM Gap helps keep insulin levels incredibly stable. I suggest a roasted turkey breast wrap or high-protein Greek yogurt with pumpkin seeds right before your 2:15 PM meeting to maximize satiety. Will you be cooking today, or ordering in?`;
  } else if (msgLower.includes('exercise') || msgLower.includes('walk') || msgLower.includes('move') || msgLower.includes('step') || msgLower.includes('stretch')) {
    responseText = `Pace Calendar Copilot: Our analysis shows back-to-back strain around 2:15 PM. To optimize fat oxidation without fatigue, I recommend doing a 15-minute brisk walk during your scheduled 3:00 PM break. Studies show walking briefly right after or between stressful sessions reduces cortisol spikes by 24%. It fits perfectly before your next Client Review at 4:00 PM. Should we set a mobile push alert?`;
  } else if (msgLower.includes('hydrate') || msgLower.includes('water') || msgLower.includes('drink')) {
    responseText = `Pace Calendar Copilot: Hydration boosts thermogenesis directly! For active ${goal} focus, you have a Hydration Target of 3/4 Liters. Let's schedule a 250ml glass intake during the 10:30 AM transition. I've logged this setup under your current profile. Do you keep a bottle at your desk?`;
  } else if (msgLower.includes('goal') || msgLower.includes('weight') || msgLower.includes('lose')) {
    responseText = `Pace Calendar Copilot: Targeting "${goal}" with a "${frequency}" behavioral cadence is a highly sustainable, science-based approach. Since you live in a meeting-dense calendar, focusing on micro-activities prevents the willpower exhaustion that leads to evening overeating. Your current weight trend indicates consistent positive adaptation of about 0.8 lbs loss per 3-day block. We are calibrating correctly!`;
  } else {
    responseText = `Pace Calendar Copilot: I have calibrated your Google Calendar gaps for today. Based on your goal "${goal}", I highly recommend keeping the 10-Min Mobility Break at 10:30 AM and the 15-Min Walk at 3:00 PM. These micro-breaks keep metabolic rate elevated while preserving cognitive capacity for your deep work sessions. Is there any specific calendar adjustment you'd like me to solve?`;
  }

  // Save conversation snippet to memory store
  const data = readMemory();
  const timestamp = new Date().toISOString();
  const idChat = `rec_${Date.now()}`;
  data.chatHistory.push({
    id: idChat,
    timestamp,
    userQuery: message,
    copilotResponse: responseText
  });
  writeMemory(data);

  res.json({
    success: true,
    reply: responseText,
    historyLen: data.chatHistory.length
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`PACE WEIGHT LOSS ENGINE RUNNING ON PORT ${PORT}`);
  console.log(`DB File: ${DATA_FILE}`);
  console.log(`===============================================`);
});
