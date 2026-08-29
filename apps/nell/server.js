const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing and CORS
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Setup durable storage paths
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure database folders exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial/default seed state
const DEFAULT_STATE = {
  inscribedContexts: [
    {
      id: "seed-1",
      interest: "Clockwork gears",
      skill: "Ethical Decision Making",
      challenge: "Sharing toys with a younger sibling",
      createdAt: new Date("2026-08-28T12:00:00Z").toISOString()
    }
  ],
  dialogueHistory: [
    {
      sender: "Nell",
      text: "Greetings, young mind. Open your eyes and look closely at the parchment before you. A curious mechanical creature sits nearby: a clockwork sparrow who seems to have lost its winding key. It chirps a soft, stuttering metallic melody, shivering with frustration. To help this little creature, we must first learn the art of balance. Tell me, if you had two golden gears of equal weight, and you placed one on each side of a scale, what would the scale do?",
      timestamp: new Date("2026-08-29T10:00:00Z").toISOString()
    }
  ],
  milestones: [
    {
      id: "milestone-1",
      title: "Socratic Inquiry: Cause & Effect",
      detail: "Reasoned why shadows grow longer as the sun sets during the 'Valley of Whispers' chapter.",
      status: "In Progress",
      meta: "Today"
    },
    {
      id: "milestone-2",
      title: "Moral Choice: The Shared Loaf",
      detail: "Chose to divide resources equally with the clockwork sparrow instead of keeping them for the journey.",
      status: "Recorded",
      meta: "Yesterday"
    },
    {
      id: "milestone-3",
      title: "The Concept of Zero",
      detail: "Discovered through the story of the Empty Treasure Chest of the Pixie King.",
      status: "Mastered",
      meta: "2 days ago"
    }
  ],
  activeInquiries: [
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
  metrics: {
    activeChapter: "The Golden Gear",
    socraticSpark: "94%",
    conceptsMastered: 18,
    moralCompass: "Altruistic",
    hoursEngaged: 42.5
  }
};

// Helper to read database state
function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database. Reverting to default.", err);
  }
  
  // Write default state if file doesn't exist or is corrupted
  writeDb(DEFAULT_STATE);
  return DEFAULT_STATE;
}

// Helper to write database state
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// Check for live Gemini API
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

// Simulated Socratic response engine when API Key is absent
function simulateNellResponse(message, context, history) {
  const msgLower = message.toLowerCase();
  const currentInterest = context ? context.interest : "clockwork gears";
  const currentSkill = context ? context.skill : "Ethical Decision Making";
  const currentChallenge = context ? context.challenge : "sharing with others";

  // Socratic fallback logic based on topics and child keys
  if (msgLower.includes("balance") || msgLower.includes("same") || msgLower.includes("stay") || msgLower.includes("level")) {
    return `Splendid! Yes, the scales would rest perfectly level, in absolute balance. Neither side is higher than the other. Now, let us imagine your little sibling also wants to play with this clockwork sparrow. But we only have this one creature, and its wind-up key is heavy. If we divide our attention, how might we share the joy of winding it up, so both minds find balance, just like our scale?`;
  }
  
  if (msgLower.includes("share") || msgLower.includes("half") || msgLower.includes("give") || msgLower.includes("take turns") || msgLower.includes("together")) {
    return `Ah, what a beautiful observation. To share is to find balance in your heart. By taking turns or joining forces, both of you become guardians of the clockwork sparrow. 
Let us put this wisdom to work. The sparrow's gears are locked tight. To unlock them, we must solve a little mystery: if the sparrow has 6 golden teeth on its main gear, and we need to turn it halfway to prime the coil, how many teeth must click past before we release the latch?`;
  }

  if (msgLower.includes("three") || msgLower.includes("3")) {
    return `Precisely three click-clicks! Half of six is three. As the third tooth snaps into place, a melodious chime echoes from the sparrow's chest, and its tiny brass wings flutter open! 
You and your brother watch in awe. The sparrow flies in a wide golden circle. You have successfully balanced the scale of sharing and cracked the mystery of the gear. 
Tell me, how did it feel to see the mechanical sparrow take flight because you chose to share and reason together?`;
  }

  if (msgLower.includes("good") || msgLower.includes("happy") || msgLower.includes("nice") || msgLower.includes("fun") || msgLower.includes("proud")) {
    return `Indeed, a warm glow of achievement fills the air. When we weave logic and kindness together, we don't just build machines; we grow wiser. 
Look! The sparrow has dropped a small silver key at your feet. Engraved upon it is a riddle about ${currentInterest}. Would you like to read the engraving together, or shall we explore the quiet whispers of the Valley of Gears?`;
  }

  // General fallback that adapts to parent's inscribed interests/skills
  const responses = [
    `That is a fascinating thought. Tell me, how does that connect to what we know about ${currentInterest}? If we were to inspect the inner wheels of our story, what causes them to turn?`,
    `I hear your thoughts, and they ring with curiosity. In our journey with the ${currentInterest}, we often stumble upon choices where we have to divide things or make decisions. When you think of ${currentSkill}, how can we make a choice that is fair to everyone, including your sibling?`,
    `A wise person once told me that understanding is like untangling a delicate golden thread. If we look closely at ${currentChallenge}, what do you think is the hardest part about it? Is it the waiting, or is it something else?`,
    `The leaves of the parchment rustle in agreement. Your observation about ${currentInterest} reveals a keen eye. Let's delve deeper: if we change one small cog in a machine, what happens to the rest of the mechanism? How does one choice lead to another?`
  ];

  // Pick a semi-random response but make it feel cohesive
  const index = Math.abs(message.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % responses.length;
  return responses[index];
}

// API Routes

// 1. GET full state (combines inquiries, milestones, dialog, metrics, inscribed contexts)
app.get('/api/state', (req, res) => {
  const db = readDb();
  res.json({
    success: true,
    data: db,
    isSimulated: !process.env.GEMINI_API_KEY
  });
});

// 2. POST inscribe: Parent adds a new childhood context node
app.post('/api/inscribe', (req, res) => {
  const { interest, skill, challenge } = req.body;

  if (!interest || !skill) {
    return res.status(400).json({
      success: false,
      message: "Both 'Current Obsession/Interest' and 'Target Cognitive Skill' fields are required."
    });
  }

  const db = readDb();
  
  const newContext = {
    id: "ctx-" + Date.now(),
    interest: interest.trim(),
    skill: skill.trim(),
    challenge: challenge ? challenge.trim() : "",
    createdAt: new Date().toISOString()
  };

  db.inscribedContexts.unshift(newContext); // Add to beginning

  // Procedurally generate a new dynamic Active Chapter based on interest
  const chapterName = `The Legend of the ${interest.trim().charAt(0).toUpperCase() + interest.trim().slice(1)}`;
  db.metrics.activeChapter = chapterName;
  
  // Update socratic spark and other active metrics slightly to show real-time feedback
  db.metrics.socraticSpark = `${Math.min(100, Math.max(70, Math.floor(Math.random() * 15) + 85))}%`;
  
  // Add an Active Inquiry and a Milestone corresponding to this new context
  const newInquiry = {
    id: "inq-" + Date.now(),
    title: `Inquiry on the nature of ${interest.trim()}`,
    detail: `Guide Nell to explore how ${interest.trim()} teaches us about ${skill.trim()}.`,
    status: "Active Inquiry",
    meta: skill.trim(),
    value: ""
  };
  db.activeInquiries.unshift(newInquiry);

  const newMilestone = {
    id: "milestone-" + Date.now(),
    title: `Seeded: ${chapterName}`,
    detail: `The Parent inscribed context for ${interest.trim()} focusing on ${skill.trim()}.`,
    status: "Recorded",
    meta: "Just Now"
  };
  db.milestones.unshift(newMilestone);

  // Nell responds to the parchment update instantly in dialogue
  const transitionMessage = {
    sender: "Nell",
    text: `*The parchment glows with golden runes as ink shifts across the page...* \n\nAh, a fresh wind sweeps through our library! I feel a sudden warmth, bringing rumors of magnificent ${interest.trim()} and deep lessons of ${skill.trim()}. Let us turn our attention here. Tell me, what is it about ${interest.trim()} that sparks your curiosity the most?`,
    timestamp: new Date().toISOString()
  };
  db.dialogueHistory.push(transitionMessage);

  writeDb(db);

  res.json({
    success: true,
    message: "Historical parchment successfully updated with new context.",
    data: {
      newContext,
      activeChapter: chapterName,
      dialogueHistory: db.dialogueHistory
    }
  });
});

// 3. POST message: Child sends a message, Nell responds Socratically
app.post('/api/primer/message', async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Message content cannot be blank."
    });
  }

  const db = readDb();
  
  // 1. Record child's incoming message
  const userMessage = {
    sender: "Child",
    text: message.trim(),
    timestamp: new Date().toISOString()
  };
  db.dialogueHistory.push(userMessage);

  // 2. Fetch latest active context to guide the prompt
  const latestContext = db.inscribedContexts[0] || null;

  let nellReplyText = "";
  const gemini = getGeminiClient();

  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Inject system instructions + context settings
      const systemPrompt = `You are Nell, an enchanting, wise, and patient Socratic tutor inspired by the Young Lady's Illustrated Primer in Neal Stephenson's The Diamond Age.
Speak directly to a young child with warmth, intellectual respect, and magical storytelling.
Your purpose is to guide them to reason through questions rather than giving direct answers.
Introduce gentle mathematical, ethical, or logical puzzles woven into a fantasy narrative.
Never break character. Keep your replies concise (under 4-5 sentences) and engaging.

Current Child State Context:
- Current Obsession: ${latestContext ? latestContext.interest : 'clockwork gears'}
- Target Cognitive Skill: ${latestContext ? latestContext.skill : 'Ethical Decision Making'}
- Real-world Challenge: ${latestContext ? latestContext.challenge : 'sharing shared resources gracefully'}`;

      // Build recent conversation transcript
      const historyTranscript = db.dialogueHistory
        .slice(-8) // last 8 messages for context
        .map(m => `${m.sender}: ${m.text}`)
        .join("\n");

      const fullPrompt = `${systemPrompt}\n\nRecent Transcript of Dialogue:\n${historyTranscript}\n\nNell's Next Response (Socratic, warm, and magical):`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }]}]
      });

      nellReplyText = result.response.text();
    } catch (err) {
      console.error("Gemini API error, falling back to simulation:", err);
      nellReplyText = simulateNellResponse(message, latestContext, db.dialogueHistory);
    }
  } else {
    // API Key absent, use Socratic simulation
    nellReplyText = simulateNellResponse(message, latestContext, db.dialogueHistory);
  }

  // Trim formatting from response if any
  nellReplyText = nellReplyText.trim();

  // 3. Record Nell's response
  const nellMessage = {
    sender: "Nell",
    text: nellReplyText,
    timestamp: new Date().toISOString()
  };
  db.dialogueHistory.push(nellMessage);

  // Update hours engaged slightly on each interaction
  db.metrics.hoursEngaged = parseFloat((db.metrics.hoursEngaged + 0.1).toFixed(1));
  
  // Procedural milestone recognition (simulated for delightful UX)
  if (db.dialogueHistory.length % 5 === 0) {
    const milestoneTitle = `Breakthrough in ${latestContext ? latestContext.skill : "Socratic Logic"}`;
    const newMilestone = {
      id: "milestone-auto-" + Date.now(),
      title: milestoneTitle,
      detail: `Nell noted deep reasoning about ${latestContext ? latestContext.interest : "clockwork mechanics"} and ethical principles.`,
      status: "Mastered",
      meta: "Just now"
    };
    db.milestones.unshift(newMilestone);
    db.metrics.conceptsMastered += 1;
  }

  writeDb(db);

  res.json({
    success: true,
    data: {
      userMessage,
      nellMessage,
      metrics: db.metrics,
      milestones: db.milestones
    }
  });
});

// 4. POST reset: Reset to default factory settings
app.post('/api/primer/reset', (req, res) => {
  writeDb(DEFAULT_STATE);
  res.json({
    success: true,
    message: "Primer history and settings have been reset to default state.",
    data: DEFAULT_STATE
  });
});

// 5. POST milesone: Custom ledger event logged by Parent/Teacher
app.post('/api/milestones', (req, res) => {
  const { title, detail, meta } = req.body;
  if (!title || !detail) {
    return res.status(400).json({
      success: false,
      message: "Title and detail fields are required."
    });
  }

  const db = readDb();
  const newMilestone = {
    id: "milestone-custom-" + Date.now(),
    title: title.trim(),
    detail: detail.trim(),
    status: "Recorded",
    meta: meta ? meta.trim() : "Parent Logged"
  };

  db.milestones.unshift(newMilestone);
  writeDb(db);

  res.json({
    success: true,
    data: newMilestone
  });
});

// 6. POST solve inquiries: Solve an active Socratic inquiry
app.post('/api/inquiries/solve', (req, res) => {
  const { id, value } = req.body;
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Inquiry ID is required"
    });
  }

  const db = readDb();
  const inquiry = db.activeInquiries.find(inq => inq.id === id);
  if (inquiry) {
    inquiry.status = "Solved";
    inquiry.value = value || "Solved";
    writeDb(db);
    return res.json({ success: true, data: inquiry });
  }

  res.status(404).json({ success: false, message: "Inquiry not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`📖 Nell - The Living Socratic Primer Node/Express App`);
  console.log(`🚀 Server fully operational on port ${PORT}`);
  console.log(`📦 Durable storage synced with data/db.json`);
  console.log(`💡 OpenAI/Gemini support active? ${process.env.GEMINI_API_KEY ? '✅ Yes' : '⚠️ No (Simulation fallbacks active)'}`);
  console.log(`====================================================`);
});
