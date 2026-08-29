const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'sessions.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Seed / Initial DB State
const SEED_SESSIONS = [
  {
    id: "dev-agent-refactor",
    name: "dev-agent-refactor",
    persona: "DevAgent (Coding & Refactoring)",
    repository: "github.com/co-op/auth-service",
    access: "Engineering Core",
    status: "Active",
    metrics: {
      activeHumans: "3",
      activeAgents: "2",
      syncLatency: "12ms",
      contextWindow: "128k",
      executionTime: "4.2h",
      costSaved: "$340"
    },
    cursors: [
      { name: "Sarah (PM)", color: "#FF007A", line: 12, ch: 15, file: "auth_service.py" },
      { name: "Alex (Dev)", color: "#00E5FF", line: 16, ch: 8, file: "auth_service.py" },
      { name: "DevAgent-3", color: "#CCFF00", line: 10, ch: 4, file: "auth_service.py", isAgent: true }
    ],
    fileContent: `# auth_service.py - OAuth2 Token Verification
import jwt
import datetime

ALGORITHM = 'HS256'
SECRET_KEY = 'co-op-shared-secret'

def verify_token(token: str) -> dict:
    """Verify token validity and expiration"""
    try:
        # DevAgent-3: starting refactoring here
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Sarah (PM): Make sure token expiration edge case is handled!
        return {"valid": True, "payload": payload}
    except jwt.ExpiredSignatureError:
        return {"valid": False, "reason": "Token expired"}
    except jwt.InvalidTokenError:
        return {"valid": False, "reason": "Invalid token"}
`,
    fileName: "auth_service.py",
    messages: [
      {
        id: "m1",
        sender: "Sarah (PM)",
        role: "human",
        text: "Hey team, we need to double check how the token expiration behaves edge cases. Sometimes expired signatures slip by if leeway isn't set.",
        timestamp: "10:42 AM"
      },
      {
        id: "m2",
        sender: "DevAgent-3",
        role: "agent",
        text: "Understood. I am starting to outline an execution plan to refactor auth_service.py. I'll add strict validation check bounds. Let me rewrite the token verification block.",
        timestamp: "10:43 AM",
        codeSnippet: `def verify_token(token: str, leeway_seconds: int = 10) -> dict:
    try:
        # DevAgent-3: Rewriting to include leeway bounds configuration list
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], leeway=leeway_seconds)
        return {"valid": True, "payload": payload}`
      },
      {
        id: "m3",
        sender: "Alex (Dev)",
        role: "human",
        text: "Sounds good DevAgent-3, make sure to add unit tests for that leeway edge case as well.",
        timestamp: "10:44 AM"
      }
    ],
    isTakeoverActive: false,
    lastTakeoverUser: null
  }
];

// Read DB Helper
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(SEED_SESSIONS, null, 2));
      return SEED_SESSIONS;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, returning seed data:", err);
    return SEED_SESSIONS;
  }
}

// Write DB Helper
function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Create default initial conditions based on selected persona
function getInitialPreset(persona) {
  if (persona.includes("QA-Agent")) {
    return {
      fileName: "test_auth_service.py",
      fileContent: `# test_auth_service.py - QA-Agent Test Suite
import unittest
from auth_service import verify_token

class TestAuthService(unittest.TestCase):
    def setUp(self):
        self.valid_token = "mock-valid-jwt"
        
    def test_verify_token_success(self):
        # QA-Agent: Starting to generate unit verification test cases
        pass
`
    };
  } else if (persona.includes("DocAgent")) {
    return {
      fileName: "COLLABORATION_GUIDE.md",
      fileContent: `# Co-Op Integration Playbook
Designed by DocAgent

This guide details the real-time hand-off protocols interface.
## Agent Interaction Rules
1. Multi-player cursors denote focus.
2. Hit "Takeover" to instantly command the session.
`
    };
  } else if (persona.includes("SalesAgent")) {
    return {
      fileName: "enterprise_deal_strategy.txt",
      fileContent: `## ENTERPRISE MULTIPLAYER AI STRATEGY
Authored by: SalesAgent
Target Market: Fortune 500 AI-Native Platforms

Value Proposition:
- Reduce code review cycles by 70% by going multiplayer.
- Live hand-offs instead of passive transcripts.
`
    };
  } else {
    // Default DevAgent
    return {
      fileName: "app.py",
      fileContent: `# app.py - Main collaborative workspace
import os

def init_app():
    # DevAgent ready to refactor
    print("Initializing Co-Op live workspace context.")

if __name__ == "__main__":
    init_app()
`
    };
  }
}

// Generate intelligent mock response based on persona and human input
function generateMockResponse(persona, contextFile, inputPrompt) {
  const isQA = persona.includes("QA-Agent");
  const isDoc = persona.includes("DocAgent");
  const isSales = persona.includes("SalesAgent");

  if (isQA) {
    return {
      text: `QA-Agent: Received prompt "${inputPrompt}". I will draft assertion checks for this context in ${contextFile}.`,
      code: `    def test_edge_case_${Math.floor(Math.random() * 1000)}(self):
        # Generative QA check for token edge cases
        res = verify_token("expired_token")
        self.assertFalse(res["valid"])
        self.assertEqual(res["reason"], "Token expired")`
    };
  } else if (isDoc) {
    return {
      text: `DocAgent: Updating API & documentation for the project path. Updating ${contextFile} structure now.`,
      code: `### Updated API Endpoint Specifications
- Endpoints now support WebSocket broadcast updates.
- Added takeover hooks and lock release callbacks.`
    };
  } else if (isSales) {
    return {
      text: `SalesAgent: Developing deal strategies and response hooks for: "${inputPrompt}".`,
      code: `1. Action item: Connect with Senior Director of Platform Engineering.
2. Present 'Figma-meets-Terminal' visual canvas pitch.
3. Offer trial instance deployment.`
    };
  } else {
    // DevAgent
    return {
      text: `DevAgent-3: Acknowledged prompt "${inputPrompt}". Let's rewrite the execution code block inside ${contextFile}. I'm doing step-by-step refactoring now.`,
      code: `def handle_coop_event(event_type: str, session_id: str) -> bool:
    # DevAgent-3: Dynamically refactoring collaboration listener hooks
    print(f"Co-Op Event triggered: {event_type} on {session_id}")
    if event_type == "TAKEOVER":
        return suspend_agent_flow(session_id)
    return True`
    };
  }
}

// REST APIs

// 1. GET /api/sessions: Lists all sessions
app.get('/api/sessions', (req, res) => {
  const db = readDB();
  res.json(db);
});

// 2. GET /api/sessions/:id: Retrieve session detail
app.get('/api/sessions/:id', (req, res) => {
  const db = readDB();
  const session = db.find(s => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json(session);
});

// 3. POST /api/sessions: Spin up/Launch a new session (the Core workflow)
app.post('/api/sessions', (req, res) => {
  const { name, persona, repository, access } = req.body;
  if (!name || !persona || !repository) {
    return res.status(400).json({ error: "Missing required fields (name, persona, repository)" });
  }

  const db = readDB();
  const cleanId = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  
  if (db.some(s => s.id === cleanId)) {
    return res.status(400).json({ error: `Session with name/ID "${cleanId}" already exists.` });
  }

  const preset = getInitialPreset(persona);

  // Set up random initial multiplayer cursors
  const activeHumanCount = Math.floor(Math.random() * 4) + 1;
  const cursors = [
    { name: "DevAgent-3", color: "#CCFF00", line: 4, ch: 0, file: preset.fileName, isAgent: true }
  ];
  if (activeHumanCount >= 1) cursors.push({ name: "Sarah (PM)", color: "#FF007A", line: 2, ch: 10, file: preset.fileName });
  if (activeHumanCount >= 2) cursors.push({ name: "Alex (Dev)", color: "#00E5FF", line: 5, ch: 12, file: preset.fileName });

  const newSession = {
    id: cleanId,
    name: name.startsWith('#') ? name : `#${name}`,
    persona,
    repository,
    access: access || "Engineering Core",
    status: "Active",
    metrics: {
      activeHumans: String(activeHumanCount),
      activeAgents: "1",
      syncLatency: `${Math.floor(Math.random() * 15) + 5}ms`,
      contextWindow: "128k",
      executionTime: "0.1h",
      costSaved: `$${Math.floor(Math.random() * 50) + 10}`
    },
    cursors,
    fileContent: preset.fileContent,
    fileName: preset.fileName,
    messages: [
      {
        id: "m0",
        sender: "System",
        role: "system",
        text: `Session created by team. ${persona} joined multiplayer stream linked to ${repository}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    isTakeoverActive: false,
    lastTakeoverUser: null
  };

  db.push(newSession);
  saveDB(db);
  res.status(201).json(newSession);
});

// 4. POST /api/sessions/:id/messages: Real-time chat & co-authoring stream
// Connects with Gemini to simulate 'Co-Op Agent Brain' OR utilizes highly targeted local model mocks.
app.post('/api/sessions/:id/messages', (req, res) => {
  const { sender, text, triggerAgent } = req.body;
  const sessionId = req.params.id;

  if (!sender || !text) {
    return res.status(400).json({ error: "Missing sender or message text" });
  }

  const db = readDB();
  const sessionIdx = db.findIndex(s => s.id === sessionId);
  if (sessionIdx === -1) {
    return res.status(404).json({ error: "Session not found" });
  }

  const session = db[sessionIdx];
  const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Add the human's message
  const userMsgId = 'msg-' + Date.now();
  const userMessage = {
    id: userMsgId,
    sender,
    role: "human",
    text,
    timestamp: timestampStr
  };
  session.messages.push(userMessage);

  // If agent is active and not currently suspended by "Takeover", trigger response
  if (triggerAgent && !session.isTakeoverActive) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      console.log(`GEMINI INTEGRATION: Querying Gemini API for agent response on session ${sessionId}...`);
      
      const assistantRole = `You are DevAgent-3 (or equivalent specified persona ${session.persona}), a highly collaborative coding agent working alongside human developers in a real-time multiplayer canvas. Respond to prompts by outlining your step-by-step execution plan, showing code blocks, and explicitly stating when you are handing control back to the human. Keep your answer brief, matching the Figma character limits. Base your edits on file context: ${session.fileName} containing content:\n${session.fileContent}`;

      const requestPayload = JSON.stringify({
        contents: [
          {
            parts: [{ text: `Human input: "${text}". Please write updated code blocks or action plans based on current workspace.` }]
          }
        ],
        systemInstruction: {
          parts: [{ text: assistantRole }]
        },
        generationConfig: {
          maxOutputTokens: 600,
          temperature: 0.7
        }
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestPayload)
        }
      };

      const gReq = https.request(options, (gRes) => {
        let responseData = '';
        gRes.on('data', (chunk) => { responseData += chunk; });
        gRes.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            let responseText = "";
            
            if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content && parsed.candidates[0].content.parts[0]) {
              responseText = parsed.candidates[0].content.parts[0].text;
            } else {
              console.error("Unexpected response from Gemini API:", responseData);
              responseText = `[Gemini System Event] Error processing query. Graceful Mock Mode activated: Ready to cooperate.`;
            }

            // Extract code snippets if returned in markdown
            const codeBlockRegex = /```[a-zA-Z]*\n([\s\S]*?)```/;
            const match = responseText.match(codeBlockRegex);
            const extractedCode = match ? match[1] : null;

            // Trim the text to look extremely conversational
            const cleanText = responseText.replace(codeBlockRegex, "").trim();

            const agentMessage = {
              id: 'agent-' + Date.now(),
              sender: "DevAgent-3",
              role: "agent",
              text: cleanText || "I've drafted the modifications. Control has been handed back to you.",
              codeSnippet: extractedCode || undefined,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            // Update code editor dynamically with AI response
            if (extractedCode) {
              session.fileContent = extractedCode;
              // Sync cursor position roughly to edit location
              const agentCursor = session.cursors.find(c => c.isAgent);
              if (agentCursor) {
                agentCursor.line = Math.floor(Math.random() * 10) + 5;
                agentCursor.ch = 4;
              }
            }

            session.messages.push(agentMessage);
            db[sessionIdx] = session;
            saveDB(db);

          } catch (err) {
            console.error("Failed to parse Gemini response:", err);
            // Fallback to local mockup
            fallbackAgentMock(session, text, db, sessionIdx);
          }
        });
      });

      gReq.on('error', (err) => {
        console.error("Gemini request error, falling back to mock:", err);
        fallbackAgentMock(session, text, db, sessionIdx);
      });

      gReq.write(requestPayload);
      gReq.end();

    } else {
      // Local highly-dynamic mock agent logic
      fallbackAgentMock(session, text, db, sessionIdx);
    }
  } else {
    // Save DB state (just human message)
    db[sessionIdx] = session;
    saveDB(db);
  }

  res.status(200).json(session);
});

// Helper for local mock responses
function fallbackAgentMock(session, text, db, sessionIdx) {
  setTimeout(() => {
    const mockAns = generateMockResponse(session.persona, session.fileName, text);
    const mockMsg = {
      id: 'agent-' + Date.now(),
      sender: "DevAgent-3",
      role: "agent",
      text: mockAns.text,
      codeSnippet: mockAns.code,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Replace key portion of file with mock generated code snippet or append it
    if (mockAns.code) {
      // Simple smart replacement
      const lines = session.fileContent.split('\n');
      let editLine = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("TODO") || lines[i].includes("starting refactoring") || lines[i].includes("Starting to generate")) {
          editLine = i;
          break;
        }
      }
      if (editLine !== -1) {
        lines[editLine] = `        # --- Co-Op Automated Hand-off ---\n${mockAns.code}\n        # -------------------------------`;
        session.fileContent = lines.join('\n');
      } else {
        session.fileContent += `\n\n# --- Co-Op Continuous Deployment ---\n${mockAns.code}\n`;
      }

      // Sync active agent cursor to highlight changes
      const agCursors = session.cursors.filter(c => c.isAgent);
      if (agCursors.length > 0) {
        agCursors[0].line = editLine === -1 ? lines.length : editLine;
        agCursors[0].ch = 8;
      }
    }

    session.messages.push(mockMsg);
    db[sessionIdx] = session;
    saveDB(db);
  }, 1000); // Simulate network latency/thinking time!
}

// 5. POST /api/sessions/:id/takeover: Interrupt Agent & command manually
app.post('/api/sessions/:id/takeover', (req, res) => {
  const { user } = req.body;
  const sessionId = req.params.id;

  const db = readDB();
  const sessionIdx = db.findIndex(s => s.id === sessionId);
  if (sessionIdx === -1) {
    return res.status(404).json({ error: "Session not found" });
  }

  const session = db[sessionIdx];
  
  // Toggle the takeover flag
  session.isTakeoverActive = !session.isTakeoverActive;
  session.lastTakeoverUser = session.isTakeoverActive ? (user || "Guest Hacker") : null;
  
  const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const logMessage = {
    id: 'takeover-' + Date.now(),
    sender: "System",
    role: "system",
    text: session.isTakeoverActive 
      ? `🚨 TAKEOVER ACTION ACTIVE: ${session.lastTakeoverUser} interrupted DevAgent-3 and locked the terminal!`
      : `🔄 CONTROL RELEASED: Control returned to ${session.persona}. Ready to co-author.`,
    timestamp: timestampStr
  };
  session.messages.push(logMessage);

  db[sessionIdx] = session;
  saveDB(db);

  res.json(session);
});

// 6. POST /api/sessions/:id/cursors: Update cursor locations in real-time
app.post('/api/sessions/:id/cursors', (req, res) => {
  const { name, color, line, ch, file } = req.body;
  const sessionId = req.params.id;

  const db = readDB();
  const sessionIdx = db.findIndex(s => s.id === sessionId);
  if (sessionIdx === -1) {
    return res.status(404).json({ error: "Session not found" });
  }

  const session = db[sessionIdx];
  const existingCursorIdx = session.cursors.findIndex(c => c.name === name);

  if (existingCursorIdx !== -1) {
    session.cursors[existingCursorIdx] = {
      ...session.cursors[existingCursorIdx],
      line,
      ch,
      file,
      color: color || session.cursors[existingCursorIdx].color
    };
  } else {
    session.cursors.push({
      name,
      color: color || '#FF007A',
      line,
      ch,
      file,
      isAgent: false
    });
  }

  db[sessionIdx] = session;
  saveDB(db);
  res.json(session.cursors);
});

// 7. POST /api/sessions/:id/code: Direct edits on the file (terminal or keyboard input)
app.post('/api/sessions/:id/code', (req, res) => {
  const { code } = req.body;
  const sessionId = req.params.id;

  const db = readDB();
  const sessionIdx = db.findIndex(s => s.id === sessionId);
  if (sessionIdx === -1) {
    return res.status(404).json({ error: "Session not found" });
  }

  db[sessionIdx].fileContent = code;
  saveDB(db);
  res.json({ success: true, fileContent: db[sessionIdx].fileContent });
});

// Catch-all route to serve the spa
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Co-Op Multiplayer Workspace running on http://localhost:${PORT}`);
  console.log(`📂 DB Saved inside workspace: ${DB_FILE}`);
  if (process.env.GEMINI_API_KEY) {
    console.log(`💡 Co-Op Agent Brain is POWERED by live Gemini API key!`);
  } else {
    console.log(`💡 Running in local mock mode. Live simulated AI responses active!`);
  }
  console.log(`===================================================`);
});
