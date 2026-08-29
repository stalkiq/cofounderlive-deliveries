const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// Standard initial datasets to make the application immediately useful and visually rich
const DEFAULT_SESSIONS = [
  {
    id: "dev-agent-refactor",
    name: "Active Canvas: #dev-agent-refactor",
    description: "Real-time stream of human inputs and DevAgent-3 actions. Watch live edits or hit Takeover.",
    persona: "DevAgent (Coding & Refactoring)",
    repoUrl: "github.com/co-op/auth-service",
    accessLevel: "Engineering Core",
    status: "active",
    activeHumans: 3,
    activeAgents: 2,
    syncLatency: "12ms",
    createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: "qa-agent-verify",
    name: "Collaborative Suite: #qa-test-verification",
    description: "QA-Agent verifying newly written test endpoints with manual developer interruption.",
    persona: "QA-Agent (Test Generation)",
    repoUrl: "github.com/co-op/auth-service",
    accessLevel: "Product & QA",
    status: "active",
    activeHumans: 2,
    activeAgents: 1,
    syncLatency: "18ms",
    createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  }
];

const DEFAULT_MESSAGES = [
  {
    id: "msg-1",
    sessionId: "dev-agent-refactor",
    title: "Sarah (PM) joined the session",
    detail: "[Sarah (PM) Cursor] active on line 12 of auth_service.py",
    status: "Human",
    meta: "10:42 AM",
    value: "Active",
    timestamp: new Date(Date.now() - 3000000).toISOString()
  },
  {
    id: "msg-2",
    sessionId: "dev-agent-refactor",
    title: "DevAgent-3 started refactoring",
    detail: "[DevAgent-3 Cursor] rewriting OAuth2 token validation logic",
    status: "Agent",
    meta: "10:43 AM",
    value: "Executing",
    timestamp: new Date(Date.now() - 2800000).toISOString()
  },
  {
    id: "msg-3",
    sessionId: "dev-agent-refactor",
    title: "Alex (Dev) highlighted lines 45-60",
    detail: "[Alex (Dev) Cursor] adding comment: 'Verify token expiration edge case'",
    status: "Human",
    meta: "10:44 AM",
    value: "Active",
    timestamp: new Date(Date.now() - 2500000).toISOString()
  }
];

const DEFAULT_TAKEOVERS = [];

const DEFAULT_CODE = {
  "dev-agent-refactor": `class OAuth2Validator:
    def __init__(self, provider_url: str):
        self.provider_url = provider_url
        self.cache = {}

    def validate_token(self, token: str) -> dict:
        # DevAgent-3: Checking token signature and expiration...
        if not token:
            raise ValueError("Token cannot be empty")
        
        # Verify token against cached public keys
        decoded = self._decode_and_verify(token)
        return decoded

    def _decode_and_verify(self, token: str) -> dict:
        # TODO: Implement token decoding and signature validation
        # Sarah (PM): Make sure to log expired token errors separately
        pass`,
  "qa-agent-verify": `import pytest
from auth_service import OAuth2Validator

def test_empty_token_raises_value_error():
    validator = OAuth2Validator("https://auth.co-op.internal")
    with pytest.raises(ValueError):
        validator.validate_token("")

def test_expired_token_handling():
    # QA-Agent: Generating mock token assertions...
    pass`
};

class Database {
  constructor() {
    this.data = {
      sessions: [...DEFAULT_SESSIONS],
      messages: [...DEFAULT_MESSAGES],
      takeovers: [...DEFAULT_TAKEOVERS],
      codes: { ...DEFAULT_CODE }
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          sessions: parsed.sessions || [...DEFAULT_SESSIONS],
          messages: parsed.messages || [...DEFAULT_MESSAGES],
          takeovers: parsed.takeovers || [...DEFAULT_TAKEOVERS],
          codes: parsed.codes || { ...DEFAULT_CODE }
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.error("Failed to load database, using defaults:", err);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error("Failed to save database:", err);
    }
  }

  // Sessions CRUD
  getSessions() {
    return this.data.sessions;
  }

  getSession(id) {
    return this.data.sessions.find(s => s.id === id);
  }

  createSession(session) {
    this.data.sessions.push(session);
    if (!this.data.codes[session.id]) {
      this.data.codes[session.id] = `# Welcome to the new ${session.persona} session.\n# Bounded to: ${session.repoUrl}\n\ndef start():\n    print("Co-Op workspace is live!")\n`;
    }
    this.save();
    return session;
  }

  updateSession(id, updates) {
    const session = this.getSession(id);
    if (session) {
      Object.assign(session, updates);
      this.save();
    }
    return session;
  }

  // Messages CRUD
  getMessages(sessionId) {
    return this.data.messages.filter(m => m.sessionId === sessionId);
  }

  createMessage(message) {
    this.data.messages.push(message);
    this.save();
    return message;
  }

  // Takeovers CRUD
  getTakeovers(sessionId) {
    return this.data.takeovers.filter(t => t.sessionId === sessionId);
  }

  createTakeover(takeover) {
    this.data.takeovers.push(takeover);
    this.save();
    return takeover;
  }

  // Code persistence
  getCode(sessionId) {
    return this.data.codes[sessionId] || '';
  }

  saveCode(sessionId, content) {
    this.data.codes[sessionId] = content;
    this.save();
    return content;
  }
}

module.exports = new Database();
