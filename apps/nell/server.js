require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./src/db');
const nellEngine = require('./src/nell-engine');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static frontend files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

/**
 * GET /api/state
 * Returns the entire durable memory structure for the app UI
 */
app.get('/api/state', (req, res) => {
  try {
    const data = db.getDatabase();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to read database state", details: err.message });
  }
});

/**
 * POST /api/inscribe
 * Core workflow endpoint: Parent guides the Primer's evolution.
 * Takes: { interest, cognitiveSkill, milestone }
 */
app.post('/api/inscribe', async (req, res) => {
  const { interest, cognitiveSkill, milestone } = req.body;

  if (!interest || !cognitiveSkill) {
    return res.status(400).json({ error: "Interest and Cognitive Skill are required fields." });
  }

  try {
    const database = db.getDatabase();

    // 1. Send elements to Nell Engine to generate chapter intro
    const newChapterResult = await nellEngine.generateNewChapter(interest, cognitiveSkill, milestone || "general development");
    
    // 2. Build inscription log
    const newInscription = {
      id: "seed-" + Date.now(),
      interest,
      cognitiveSkill,
      milestone: milestone || "None specified",
      timestamp: new Date().toISOString()
    };
    
    // 3. Update database state
    database.inscriptions.unshift(newInscription);
    database.activeChapter = newChapterResult.chapterTitle;
    
    // Bring initial Socratic Spark up and adjust metrics slightly
    database.socraticSpark = Math.min(100, database.socraticSpark + 2);
    database.conceptsMastered += newChapterResult.conceptsMasteredIncrement;
    database.hoursEngaged = parseFloat((database.hoursEngaged + 0.5).toFixed(1));

    // Clear old active inquiries and place the new one
    database.inquiries = [
      {
        id: "inq-" + Date.now(),
        title: newChapterResult.inquiryTitle,
        detail: newChapterResult.inquiryDetail,
        status: "Active Inquiry",
        meta: newChapterResult.meta,
        value: ""
      },
      ...database.inquiries.filter(i => i.status === "Solved").slice(0, 3) // keep some solved history
    ];

    // Reset dialogue stream with the opening of our new magical story
    database.dialogue = [
      {
        role: "nell",
        text: newChapterResult.story,
        timestamp: new Date().toISOString()
      }
    ];

    // Create a corresponding ledger milestone log that parent seed has been active
    database.ledger.unshift({
      id: "led-" + Date.now(),
      title: `Inscribed: ${newChapterResult.chapterTitle}`,
      detail: `Parent directed focus to '${cognitiveSkill}' utilizing your interest in '${interest}'.`,
      status: "In Progress",
      meta: "Just now",
      value: ""
    });

    // 4. Save and return updated state
    db.saveDatabase(database);
    res.json({
      success: true,
      message: "Nell has woven these elements into the living narrative.",
      state: database,
      source: newChapterResult.source
    });

  } catch (err) {
    console.error("Inscribe error:", err);
    res.status(500).json({ error: "Failed to weave the new chapter state.", details: err.message });
  }
});

/**
 * POST /api/dialogue/respond
 * Child answers Nell's active prompt.
 * Takes: { message }
 */
app.post('/api/dialogue/respond', async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  try {
    const database = db.getDatabase();
    
    // Create modern timestamp
    const nowStr = new Date().toISOString();

    // 1. Record child's response
    database.dialogue.push({
      role: "child",
      text: message,
      timestamp: nowStr
    });

    // 2. Fetch parent's last target skill from active inquiries or latest inscription
    const latestInscription = database.inscriptions[0] || { cognitiveSkill: "Socratic Logic & Cause-Effect" };
    const activeSkill = latestInscription.cognitiveSkill;

    // 3. Consult Nell Socratic Dialogue engine to yield response
    const analysis = await nellEngine.respondToChild(activeSkill, database.dialogue, message);

    // 4. Append Nell's reply
    database.dialogue.push({
      role: "nell",
      text: analysis.text,
      timestamp: new Date().toISOString()
    });

    // Increase engagement slightly
    database.hoursEngaged = parseFloat((database.hoursEngaged + 0.2).toFixed(1));

    // 5. If a milestone breakthrough was detected, append to Ledger
    if (analysis.milestoneRecorded) {
      database.ledger.unshift({
        id: "led-" + Date.now(),
        title: analysis.milestoneRecorded.title,
        detail: analysis.milestoneRecorded.detail,
        status: analysis.milestoneRecorded.status,
        meta: "Just now",
        value: analysis.solvedValue || ""
      });

      if (analysis.milestoneRecorded.status === "Mastered") {
        database.conceptsMastered += 1;
        database.socraticSpark = Math.min(100, database.socraticSpark + 3);
      }
    }

    // 6. Update active inquiries if solved
    if (analysis.inquiryStatus === "Solved") {
      database.inquiries = database.inquiries.map(inq => {
        if (inq.status === "Active Inquiry") {
          return {
            ...inq,
            status: "Solved",
            value: analysis.solvedValue || "Completed"
          };
        }
        return inq;
      });
    }

    db.saveDatabase(database);
    res.json({
      success: true,
      state: database,
      assessment: {
        source: analysis.source,
        milestoneRecorded: !!analysis.milestoneRecorded,
        inquirySolved: analysis.inquiryStatus === "Solved"
      }
    });

  } catch (err) {
    console.error("Dialogue response error:", err);
    res.status(500).json({ error: "Failed to generate dialogue response.", details: err.message });
  }
});

/**
 * POST /api/reset
 * Resets memory to starting state described in spec for simple sandboxing
 */
app.post('/api/reset', (req, res) => {
  try {
    const original = db.resetDatabase();
    res.json({ success: true, message: "Ledger and parchment restored to default state.", state: original });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset memory", details: err.message });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(` Nell Socratic Primer is shining on:`);
  console.log(` -> http://localhost:${PORT}`);
  console.log(`===============================================`);
});
