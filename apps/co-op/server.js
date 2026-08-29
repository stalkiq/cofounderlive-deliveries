const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Sessions (GET & POST)
app.get('/api/sessions', (req, res) => {
  res.json(db.getSessions());
});

app.get('/api/sessions/:id', (req, res) => {
  const session = db.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json(session);
});

app.post('/api/sessions', (req, res) => {
  const { persona, repoUrl, accessLevel } = req.body;
  if (!persona || !repoUrl) {
    return res.status(400).json({ error: "Persona and target repository URL are required." });
  }

  const cleanRepo = repoUrl.replace(/^(https?:\/\/)?(www\.)?/, '');
  const id = uuidv4().substring(0, 8);
  const newSession = {
    id,
    name: `Active Canvas: #${id}`,
    description: `Multiplayer dashboard for ${persona} co-authoring context from ${cleanRepo}.`,
    persona,
    repoUrl: cleanRepo,
    accessLevel: accessLevel || "Entire Workspace",
    status: "active",
    activeHumans: 1,
    activeAgents: 1,
    syncLatency: "5ms",
    createdAt: new Date().toISOString()
  };

  db.createSession(newSession);

  // Initialize background messages
  db.createMessage({
    id: uuidv4(),
    sessionId: id,
    title: "Session initialized successfully",
    detail: `Multiplayer context bound to ${cleanRepo}`,
    status: "System",
    meta: "Now",
    value: "Ready",
    timestamp: new Date().toISOString()
  });

  db.createMessage({
    id: uuidv4(),
    sessionId: id,
    title: `${persona} entered the canvas`,
    detail: `Awaiting inputs or co-authoring instructions.`,
    status: "Agent",
    meta: "Now",
    value: "Idle",
    timestamp: new Date(Date.now() + 500).toISOString()
  });

  res.status(201).json(newSession);
});

// API: Messages (GET & POST with simulated AI updates)
app.get('/api/sessions/:id/messages', (req, res) => {
  res.json(db.getMessages(req.params.id));
});

// Simulate AI responses dynamically based on user prompts
function generateAIResponse(persona, prompt, currentCode) {
  const timestamp = new Date();
  const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let plan = "";
  let codeSnippet = "";
  let updatedCode = currentCode;

  if (persona.includes("DevAgent")) {
    plan = `1. Analyze human request: "${prompt}"\n2. Locate token caching path and optimize check logic.\n3. Implement explicit logging for authentication failures.`;
    codeSnippet = `    def authenticate_request(self, auth_header: str) -> bool:
        # DevAgent-3: Parsing header authorization...
        if not auth_header or not auth_header.startswith("Bearer "):
            print("[DevAgent-3] Authentication header missing or invalid format")
            return False
            
        token = auth_header.split(" ")[1]
        try:
            user_data = self.validate_token(token)
            print(f"[DevAgent-3] Token validation succeeded for user_id: {user_data.get('sub')}")
            return True
        except Exception as e:
            # DevAgent-3: Explicitly logging token verification failure
            print(f"[DevAgent-3 ERROR] Token error detail: {e}")
            return False`;
    updatedCode += `\n\n    # ---- Codegen by DevAgent-3 on auth_service.py ----\n` + codeSnippet;
  } else if (persona.includes("QA-Agent")) {
    plan = `1. Parse target function signatures.\n2. Write unit tests evaluating token failure exceptions.\n3. Validate mock configurations.`;
    codeSnippet = `def test_invalid_header_raises_exception():
    # QA-Agent: Validating auth header extraction
    validator = OAuth2Validator("https://auth.co-op.internal")
    # Verify unauthorized header formats raise standard errors
    with pytest.raises(Exception):
        validator.authenticate_request("Basic invalid_format_auth")`;
    updatedCode += `\n\n# ---- QA-Agent: Automated Test Coverage ----\n` + codeSnippet;
  } else if (persona.includes("DocAgent")) {
    plan = `1. Review auth flows.\n2. Document OAuth2 verification and exception flows for internal wiki.\n3. Output API specifications.`;
    codeSnippet = `### Co-Op Authentication Core Specs
- **Auth Scheme**: OAuth 2.0 Bearer Token
- **Validation**: Local JSON Web Key validation with fallback check
- **Failsafes**: Local thread cache with 60s expiration limit`;
    updatedCode += `\n\n"""\n` + codeSnippet + `\n"""`;
  } else {
    // SalesAgent or generic
    plan = `1. Conduct market positioning run.\n2. Review agent deployment strategy.\n3. Document integration ROI.`;
    codeSnippet = `// Co-Op Session Metrics Summary
Total Dev Run Saved: 4.2h
Estimated Compute Saved: $340
Direct Team Productivity Increase: 38%`;
    updatedCode += `\n\n# ---- Real-time Deal & ROI Assessment ----\n` + codeSnippet;
  }

  return { plan, codeSnippet, updatedCode, timeStr };
}

app.post('/api/sessions/:id/messages', (req, res) => {
  const { id } = req.params;
  const { title, detail, status, value, meta } = req.body;

  const session = db.getSession(id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const newMsg = {
    id: uuidv4(),
    sessionId: id,
    title,
    detail,
    status: status || "Human",
    meta: meta || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: value || "Active",
    timestamp: new Date().toISOString()
  };

  db.createMessage(newMsg);

  // If message is sent by a human, schedule an AI agent response to keep workflow alive.
  if (newMsg.status === "Human" && session.status !== "takeover") {
    setTimeout(() => {
      const currentCode = db.getCode(id);
      const aiResponse = generateAIResponse(session.persona, detail, currentCode);

      // Save the updated code with the AI's contribution
      db.saveCode(id, aiResponse.updatedCode);

      // Create a messaging update for DevAgent logic
      const agentMsgTitle = `${session.persona.split(" ")[0]} responded to request`;
      const agentMsgDetail = `Execution complete. Plan and generated blocks injected. Handing control back to teammates.`;
      
      db.createMessage({
        id: uuidv4(),
        sessionId: id,
        title: agentMsgTitle,
        detail: agentMsgDetail,
        status: "Agent",
        meta: aiResponse.timeStr,
        value: "Handed over",
        timestamp: new Date().toISOString()
      });

      // Add a sub-message explaining the plan
      db.createMessage({
        id: uuidv4(),
        sessionId: id,
        title: `Plan Executed:`,
        detail: aiResponse.plan,
        status: "AgentPlan",
        meta: aiResponse.timeStr,
        value: "Success",
        timestamp: new Date(Date.now() + 100).toISOString()
      });

    }, 1500);
  }

  res.status(201).json(newMsg);
});

// API: Code management (GET & POST)
app.get('/api/sessions/:id/code', (req, res) => {
  const { id } = req.params;
  const session = db.getSession(id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json({ code: db.getCode(id) });
});

app.post('/api/sessions/:id/code', (req, res) => {
  const { id } = req.params;
  const { code } = req.body;

  const session = db.getSession(id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  db.saveCode(id, code);
  res.json({ success: true, code: db.getCode(id) });
});

// API: Takeover (POST & GET logs)
app.post('/api/sessions/:id/takeover', (req, res) => {
  const { id } = req.params;
  const { operator, notes } = req.body;

  const session = db.getSession(id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Update session state: mark as standard status or customized takeover state
  const isTakeover = session.status !== "takeover";
  const newStatus = isTakeover ? "takeover" : "active";

  db.updateSession(id, {
    status: newStatus,
    activeAgents: isTakeover ? 0 : 2, // Agent pauses execution upon takeover
    syncLatency: "2ms"
  });

  const takeoverEvent = {
    id: uuidv4(),
    sessionId: id,
    operator: operator || "Alex (Dev)",
    action: isTakeover ? "Takeover" : "Release",
    notes: notes || (isTakeover ? "Manually pausing AI pipeline to make direct hot-fixes" : "Releasing manual lockout to auto-agent"),
    timestamp: new Date().toISOString()
  };

  db.createTakeover(takeoverEvent);

  // Push to stream
  db.createMessage({
    id: uuidv4(),
    sessionId: id,
    title: isTakeover ? `INTERRUPT: Takeover by ${takeoverEvent.operator}` : `RELEASE: ${takeoverEvent.operator} handoff to Agent`,
    detail: takeoverEvent.notes,
    status: "Interactive Action",
    meta: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: isTakeover ? "Manual Control" : "Auto Agent",
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, status: newStatus, takeover: takeoverEvent });
});

app.get('/api/sessions/:id/takeover', (req, res) => {
  res.json(db.getTakeovers(req.params.id));
});

// Wildcard routing to SPA index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Listen on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===========================================================`);
  console.log(`   Co-Op Collaborative Multiplayer AI Platform is online   `);
  console.log(`   Listening at http://localhost:${PORT}                   `);
  console.log(`===========================================================`);
});
