const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parser and static host
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure db directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial seed data
const initialSessions = [
  {
    id: "dev-agent-refactor",
    agentPersona: "DevAgent (Coding & Refactoring)",
    contextUrl: "github.com/co-op/auth-service",
    teamAccess: "Engineering Core",
    createdAt: new Date().toISOString(),
    status: "Running",
    code: `import jwt
import time
import os

# OAuth2 Token Validation Flow
def validate_token(token):
    # TODO: Verify token expiration edge case
    try:
        # Hardcoded verification key - needs upgrade!
        payload = jwt.decode(token, "secret_key_123", algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return {"error": "Token expired"}
    except jwt.InvalidTokenError:
        return {"error": "Invalid token"}
`,
    events: [
      {
        id: "evt_1",
        title: "Sarah (PM) joined the session",
        detail: "[Sarah (PM) Cursor] active on line 5 of auth_service.py",
        status: "Human",
        meta: "10:42 AM",
        value: "Active"
      },
      {
        id: "evt_2",
        title: "DevAgent-3 started refactoring",
        detail: "[DevAgent-3 Cursor] rewriting OAuth2 token validation logic",
        status: "Agent",
        meta: "10:43 AM",
        value: "Executing"
      },
      {
        id: "evt_3",
        title: "Alex (Dev) highlighted lines 6-10",
        detail: "[Alex (Dev) Cursor] adding comment: 'Verify token expiration edge case'",
        status: "Human",
        meta: "10:44 AM",
        value: "Active"
      }
    ]
  }
];

// Helper to load db
function loadData() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ sessions: initialSessions }, null, 2));
    return { sessions: initialSessions };
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading DB file, resetting:", err);
    return { sessions: initialSessions };
  }
}

// Helper to save db
function saveData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing DB file:", err);
  }
}

// REST GET API: List all shared sessions
app.get('/api/sessions', (req, res) => {
  const data = loadData();
  res.json(data.sessions);
});

// REST GET API: Get single session details
app.get('/api/sessions/:id', (req, res) => {
  const data = loadData();
  const session = data.sessions.find(s => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json(session);
});

// REST POST API: Launch a new shared session
app.post('/api/sessions', (req, res) => {
  const { agentPersona, contextUrl, teamAccess } = req.body;
  if (!agentPersona || !contextUrl) {
    return res.status(400).json({ error: "Missing required fields (agentPersona, contextUrl)" });
  }

  const data = loadData();
  const newID = "sess_" + Math.random().toString(36).substring(2, 9);
  
  // Default code based on selected persona
  let initialCode = "";
  if (agentPersona.includes("DevAgent")) {
    initialCode = `# Co-Op Interactive Dev Session\ndef main():\n    print("Hello Human!")\n`;
  } else if (agentPersona.includes("QA-Agent")) {
    initialCode = `# QA Automation Framework\ndef test_feature_suite():\n    assert True, "Initialization pass"\n`;
  } else if (agentPersona.includes("DocAgent")) {
    initialCode = `# Technical Architecture Documentation\n# Core architecture details below...\n`;
  } else {
    initialCode = `# Strategic Workspace Draft\n# Details loaded from context...\n`;
  }

  const newSession = {
    id: newID,
    agentPersona,
    contextUrl,
    teamAccess: teamAccess || "Entire Workspace",
    createdAt: new Date().toISOString(),
    status: "Running",
    code: initialCode,
    events: [
      {
        id: "evt_init_" + Date.now(),
        title: "Session Initialized",
        detail: `Shared Workspace created bound to context: ${contextUrl}`,
        status: "System",
        meta: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: "Ready"
      },
      {
        id: "evt_joined_" + Date.now(),
        title: `${agentPersona.split(' ')[0]} joined the canvas`,
        detail: "Waiting for human prompt or manual editing takeover style.",
        status: "Agent",
        meta: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: "Idle"
      }
    ]
  };

  data.sessions.unshift(newSession);
  saveData(data);
  res.status(201).json(newSession);
});

// REST POST API: Add standard user event (like comments, cursor highlights)
app.post('/api/sessions/:id/events', (req, res) => {
  const { title, detail, status, value } = req.body;
  if (!title || !detail) {
    return res.status(400).json({ error: "Missing action title or detail" });
  }

  const data = loadData();
  const sessionIndex = data.sessions.findIndex(s => s.id === req.params.id);
  if (sessionIndex === -1) {
    return res.status(404).json({ error: "Session not found" });
  }

  const newEvent = {
    id: "evt_" + Math.random().toString(36).substring(2, 9),
    title,
    detail,
    status: status || "Human",
    meta: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: value || "Logged"
  };

  data.sessions[sessionIndex].events.push(newEvent);
  saveData(data);
  res.status(201).json(newEvent);
});

// REST POST API: Trigger takeover action
app.post('/api/sessions/:id/takeover', (req, res) => {
  const data = loadData();
  const sessionIndex = data.sessions.findIndex(s => s.id === req.params.id);
  if (sessionIndex === -1) {
    return res.status(404).json({ error: "Session not found" });
  }

  const session = data.sessions[sessionIndex];
  const previousStatus = session.status;
  const isTakingOver = previousStatus !== "Manual Takeover";
  session.status = isTakingOver ? "Manual Takeover" : "Running";

  const takeoverEvent = {
    id: "evt_tk_" + Math.random().toString(36).substring(2, 9),
    title: isTakingOver ? "Human Interrupted Agent - Takeover!" : "Human Handed Back Control to Agent",
    detail: isTakingOver 
      ? "Terminal is locked to single-player human mode. DevAgent-3 operations paused." 
      : "DevAgent-3 is now authorized to resume automatic execution.",
    status: "Interactive Action",
    meta: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: isTakingOver ? "Takeover Active" : "Agent Resumed"
  };

  session.events.push(takeoverEvent);
  saveData(data);
  res.json({ status: session.status, event: takeoverEvent });
});

// REST POST API: Prompt agent / redirect execution - powered by Gemini (with simulated fallbacks)
app.post('/api/sessions/:id/prompt', async (req, res) => {
  const { prompt, userCode } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const data = loadData();
  const sessionIndex = data.sessions.findIndex(s => s.id === req.params.id);
  if (sessionIndex === -1) {
    return res.status(404).json({ error: "Session not found" });
  }

  const session = data.sessions[sessionIndex];

  // Update session code state if the user sends intermediate code edits
  if (userCode !== undefined) {
    session.code = userCode;
  }

  // Create event for user prompt
  const userPromptEvent = {
    id: "evt_p_" + Math.random().toString(36).substring(2, 9),
    title: `Human redirected agent`,
    detail: prompt,
    status: "Human",
    meta: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: "Prompted"
  };
  session.events.push(userPromptEvent);

  let responseText = "";
  let updatedCode = session.code;

  // Let's try calling Gemini if the API Key is supplied.
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      // Import and create client GoogleGenerativeAI
      // Direct call using official standard SDK
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const systemInstruction = "You are DevAgent-3, a highly collaborative coding agent working alongside human developers in a real-time multiplayer canvas. Respond to prompts by listing your step-by-step Execution Plan layout, displaying a generated code snippet block, and ending with an explicit handover notice like 'Control Hand-off: [Description]'. Provide only standard python or applicable language snippets in ``` blocks.";
      
      const contentPrompt = `${systemInstruction}\n\nCurrent code context:\n${session.code}\n\nHuman developer request:\n${prompt}`;
      
      const result = await model.generateContent(contentPrompt);
      responseText = result.response.text();

      // Extract updated code block from Gemini output if present
      const codeBlockMatch = responseText.match(/```(?:python|javascript|js)?\n([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        updatedCode = codeBlockMatch[1].trim();
      }
    } catch (err) {
      console.error("Gemini API Error, falling back to smart generator:", err);
      // Fallback below
    }
  }

  // Smart simulated mock responses if API Key is not set or failed
  if (!responseText) {
    const isPython = session.code.includes("def ") || session.code.includes("import ");
    const personaName = session.agentPersona.split(' ')[0] || "DevAgent-3";

    if (prompt.toLowerCase().includes("secure") || prompt.toLowerCase().includes("key") || prompt.toLowerCase().includes("auth")) {
      responseText = `### DevAgent-3 Execution Plan:
1. **Security Audit**: Identified hardcoded verification secrets in the authorization flow.
2. **Environment Bound**: Abstracted secret to dynamic system environment retrieval.
3. **Robust Hand-off**: Added warning logs in case environment constants are missing.

Here's the secure updated schema refactor:`;
      
      if (isPython) {
        updatedCode = `import jwt
import time
import os
import logging

# Configured logging & secret fetch
JWT_SECRET = os.environ.get("JWT_SIGNING_KEY", "prod_fallback_secret_7654")

def validate_token(token):
    # Active human check requested: Secure authentication
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        logging.warning("Failed authentication: Expired token provided")
        return {"error": "Token expired"}
    except jwt.InvalidTokenError:
        return {"error": "Invalid token"}
`;
        responseText += `\n\n\`\`\`python\n${updatedCode}\n\`\`\`\n\n**Control Hand-off**: The authentication codebase has been secured and refactored. Manual takeover is now open for custom validation checks. Let me know if you would like me to write a comprehensive PyTest validation module!`;
      } else {
        updatedCode = `const jwt = require('jsonwebtoken');

// Fetch JWT signing secret dynamically
const JWT_SECRET = process.env.JWT_SIGNING_KEY || "prod_fallback_secret_7654";

function validateToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return { error: "Token expired" };
        }
        return { error: "Invalid token" };
      }
}
`;
        responseText += `\n\n\`\`\`javascript\n${updatedCode}\n\`\`\`\n\n**Control Hand-off**: The authentication controller logic is now integrated. Control handed back to human. Click 'Takeover' to audit.`;
      }
    } else if (prompt.toLowerCase().includes("test") || prompt.toLowerCase().includes("qa")) {
      responseText = `### QA-Agent-1 Execution Plan:
1. **Mock Payload**: Construct a validation test payload with active parameters.
2. **Assertions Setup**: Mock positive and expired JWT signatures to assert success and secure error handling.
3. **Execution**: Prepared suite for automated runner.`;

      if (isPython) {
        const testCode = `import unittest
from auth_service import validate_token

class TestAuthService(unittest.TestCase):
    def test_invalid_token(self):
        # Trigger validation with fake payload
        res = validate_token("invalid.mock.token")
        self.assertEqual(res.get("error"), "Invalid token")

if __name__ == "__main__":
    unittest.main()
`;
        responseText += `\n\n\`\`\`python\n${testCode}\n\`\`\`\n\n**Control Hand-off**: Generated test cases ready for integration into your CI pipeline. Let me know if you'd like to integrate integration tests!`;
      } else {
        const testCode = `const { validateToken } = require('./authService');
const assert = require('assert');

describe('Auth Validation Service', () => {
    it('returns an error on an invalid signature', () => {
        const result = validateToken('fake.jwt.token');
        assert.deepStrictEqual(result, { error: 'Invalid token' });
    });
});
`;
        responseText += `\n\n\`\`\`javascript\n${testCode}\n\`\`\`\n\n**Control Hand-off**: Mocha unit tests initialized. Control transferred to human.`;
      }
    } else {
      // Dynamic generic code adaptation based on prompt
      const commentLine = isPython ? `# Refactored by ${personaName}: ${prompt}` : `// Refactored by ${personaName}: ${prompt}`;
      updatedCode = `${commentLine}\n${session.code}`;
      
      responseText = `### ${personaName} Execution Plan:
1. **Acknowledge prompt**: "${prompt}"
2. **Real-time inline inject**: Appended action log reference.
3. **Code synchronized**: Code modifications generated in the live workspace view.

\`\`\`
${updatedCode}
\`\`\`

**Control Hand-off**: Handing session controls back to the group canvas. Please click 'Takeover' to refine directly.`;
    }
  }

  // Update session code
  session.code = updatedCode;

  // Append response event from agent
  const agentResponseEvent = {
    id: "evt_ar_" + Math.random().toString(36).substring(2, 9),
    title: `${session.agentPersona.split(' ')[0]} Response Complete`,
    detail: responseText,
    status: "Agent",
    meta: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: "Hand-off"
  };
  session.events.push(agentResponseEvent);

  saveData(data);
  res.json({
    responseText,
    code: updatedCode,
    event: agentResponseEvent
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Co-Op Canvas server runs securely on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your web browser`);
});
