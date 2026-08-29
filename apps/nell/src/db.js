const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

const INITIAL_STATIONERY = {
  activeChapter: "The Golden Gear",
  socraticSpark: 94,
  conceptsMastered: 18,
  moralCompass: "Altruistic",
  hoursEngaged: 42.5,
  inquiries: [
    {
      id: "inq-1",
      title: "Why does the water wheel turn only when the river flows?",
      detail: "Nell prompts you to think about cause, effect, and continuous motion.",
      status: "Active Inquiry",
      meta: "Logic & Physics",
      value: ""
    },
    {
      id: "inq-2",
      title: "How many golden apples are left if the dragon takes half of eight?",
      detail: "A narrative introduction to division and fractions.",
      status: "Solved",
      meta: "Arithmetic",
      value: "4"
    }
  ],
  ledger: [
    {
      id: "led-1",
      title: "Socratic Inquiry: Cause & Effect",
      detail: "Reasoned why shadows grow longer as the sun sets during the 'Valley of Whispers' chapter.",
      status: "In Progress",
      meta: "Today",
      value: ""
    },
    {
      id: "led-2",
      title: "Moral Choice: The Shared Loaf",
      detail: "Chose to divide resources equally with the clockwork sparrow instead of keeping them for the journey.",
      status: "Recorded",
      meta: "Yesterday",
      value: ""
    },
    {
      id: "led-3",
      title: "The Concept of Zero",
      detail: "Discovered through the story of the Empty Treasure Chest of the Pixie King.",
      status: "Mastered",
      meta: "2 days ago",
      value: ""
    }
  ],
  dialogue: [
    {
      role: "nell",
      text: "Greetings, little finder. See how the embers glow on this parchment? I have been waiting for your return to tell you a story about a clockwork sparrow who lost its key, and ask you a question to help me figure out how to balance the scales to wind it up.",
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      role: "child",
      text: "Is the sparrow sad because it cannot fly without the key?",
      timestamp: new Date(Date.now() - 3000000).toISOString()
    },
    {
      role: "nell",
      text: "It is indeed still, waiting. If we put a brass weight of size three on one scale, but the key requires balance with a weight of size five, what must we place alongside our sparrow to make the weights equal on both sides?",
      timestamp: new Date(Date.now() - 2400000).toISOString()
    }
  ],
  inscriptions: [
    {
      id: "seed-init",
      interest: "Clockwork gears",
      cognitiveSkill: "Ethical Decision Making",
      milestone: "Sharing toys with a younger sibling",
      timestamp: new Date(Date.now() - 86400000).toISOString()
    }
  ]
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getDatabase() {
  ensureDir(path.dirname(DB_PATH));
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_STATIONERY, null, 2), 'utf-8');
    return INITIAL_STATIONERY;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, returning default memory:", err);
    return INITIAL_STATIONERY;
  }
}

function saveDatabase(data) {
  ensureDir(path.dirname(DB_PATH));
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function resetDatabase() {
  ensureDir(path.dirname(DB_PATH));
  fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_STATIONERY, null, 2), 'utf-8');
  return INITIAL_STATIONERY;
}

module.exports = {
  getDatabase,
  saveDatabase,
  resetDatabase
};
