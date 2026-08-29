# Co-Op: Don't Work With AI Alone ⚡

Co-Op is a **"Figma-meets-Terminal" multiplayer canvas** where colorful human cursors and glowing agent cursors co-author code and documents in real-time. 

Rather than working with AI agents in private read-only boxes, Co-Op lets teams drop into shared live agent sessions directly. Watch agents work, redirect them on the fly, or hit **Takeover** to instantly assume manual control of the terminal.

This package implements a **durable backend storage layer, custom REST API design**, and a **gorgeous interactive split-screen Web UI** modeled directly after the concept spec.

---

## 🛠️ Tech Stack & Key Features

- **Runtime**: Node.js & Express API routing.
- **Durable Memory & Persistence**: Custom filesystem-backed JSON database (`database.js` ➔ `db.json`) persisting collaborative channels, simulated events stream, and code blocks. Pre-populated with immersive speculative session data (`#dev-agent-refactor`) so the system is immediately alive in high-fidelity!
- **Interactive Terminal Canvas UI**:
  - **Left column**: Bold brand manifesto, product thesis highlights, alongside the **Launch Shared Session** dashboard form.
  - **Right column**: High-end monospace multi-user editor viewport. Features animated human/agent cursors (`Sarah (PM)`, `DevAgent-3`) mimicking real-time collaboration. Includes system latency and teammate session metrics.
- **Dual-State Takeover Protocol**: Click the tactile **Takeover Agent** button or hit physical `Esc` key to instantly interrupt simulated AI loops. This unlocks the terminal to let you write and save code edits live.
- **Adaptive Agent Brain**: Ask the agent to implement codes in the prompt box, storing your text to the event stream, causing the agent to execute step-by-step plans and code updates!
- **No Secrets & No Setup Friction**: Out-of-the-box local sandbox code interpreter. Zero third-party cloud API keys are embedded or required.

---

## 🚀 Getting Started (Run Locally)

Make sure you have [Node.js](https://nodejs.org/) (v18+) installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Start public server
```bash
npm start
```
*For automatic server reload during development, you can run:* `npm run dev`

### 3. Open Web UI
Point your browser to: **[http://localhost:3000](http://localhost:3000)**

---

## 🐳 Docker Deployment

The application is fully containerized and ready to deploy in any local or cloud cluster via Docker.

### 1. Build Docker image
```bash
docker build -t co-op-multiplayer-ai .
```

### 2. Launch Container
```bash
docker run -d -p 3000:3000 --name co-op-session co-op-multiplayer-ai
```

---

## 📡 REST API Documentation

Co-Op exposes powerful endpoints to view or load live session frames:

### 1. Sessions Management
- **`GET /api/sessions`**: Retrieve lists of all active team canvases.
- **`GET /api/sessions/:id`**: Access specific channel configuration and metrics.
- **`POST /api/sessions`**: Spawn a brand new multiplayer canvas.
  - *Payload template*:
    ```json
    {
      "persona": "QA-Agent (Test Generation)",
      "repoUrl": "github.com/my-org/core-auth",
      "accessLevel": "Engineering Core"
    }
    ```

### 2. Work Stream Logs
- **`GET /api/sessions/:id/messages`**: Fetch full event histories, system join logs, teammate actions, and plans.
- **`POST /api/sessions/:id/messages`**: Post a developer command statement. Sending a message automatically triggers the selected agent persona to publish a response with an execution plan after ~1.5s!

### 3. Workspace Code Persistence
- **`GET /api/sessions/:id/code`**: Pull current file canvas contents.
- **`POST /api/sessions/:id/code`**: Directly post code character drafts (available in manual Takeover state).

### 4. Interactive Takeover System
- **`POST /api/sessions/:id/takeover`**: Toggle active takeover lockouts of the agent.
- **`GET /api/sessions/:id/takeover`**: Fetch complete historical audit trails of operator takeovers.
