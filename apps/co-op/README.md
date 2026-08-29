# Co-Op: Multiplayer AI Canvas ⚡

**Co-Op** is a high-fidelity, real-time "Figma-meets-Terminal" collaborative workspace that re-imagines how developers, PMs, and dynamic AI agents build software together. Instead of isolating AI interactions in single-player private chats, **Co-Op** runs shared multiplayer canvasses with real-time log streaming, active cooperative cursors, and an instant **Takeover** mechanic for frictionless human hand-offs.

## 🚀 Key Product Features

- **Split-Screen Interface:** A distinct narrative thesis detailing multiplayer agents on the left, paired with an interactive, running multiplayer canvas on the right.
- **Multidirectional Live Cursors:** Colorful cursors representing active human developers (`Alex (Dev)`, `Sarah (PM)`) and responsive agent brains (`DevAgent-3`), indicating real-time coordinate movements and block selections.
- **Active Typewriter Simulation:** Watch `DevAgent-3` write complex token validate functions character-by-character on the file layout.
- **Tactile Takeover Interruption:** Press `ESC` or click the **Takeover Now** button to suspend agent execution instantly and take human control of the terminal input.
- **Agent Control Room:** A simulated prompt playground aligned with prompt-response logic, allowing users to direct agents and view step-by-step execution trees.

---

## 💾 Durable Backend Memory API

This application is equipped with direct, persistent storage. The backend handles durable state management without requiring heavy database dependencies. It auto-creates and persists code-collaborative workspace sessions under `data/memory.json`.

### 1. `GET /api/memory`
Retrieves all saved multiplayer sessions. Consumed immediately by the frontend to populate, hot-swap, and review history.

* **Response Format:**
  ```json
  [
    {
      "id": "session-1",
      "title": "Active Canvas: #dev-agent-refactor",
      "body": "Refactoring oauth_service.py to support token caching and automated unit tests.",
      "agentPersona": "DevAgent (Coding & Refactoring)",
      "repoUrl": "github.com/co-op/auth-service",
      "teamAccess": "Engineering Core",
      "activeHumans": "3",
      "activeAgents": "2",
      "syncLatency": "12ms",
      "createdAt": "2026-08-29T10:42:00Z"
    }
  ]
  ```

### 2. `POST /api/memory`
Stores new interactive agent canvas sessions to persistent JSON storage. 

* **Request Format:**
  ```json
  {
    "title": "#custom-session-slug",
    "body": "Detailed technical instructions or custom requirement context to co-author.",
    "agentPersona": "QA-Agent (Test Generation)",
    "repoUrl": "github.com/my-org/my-repository",
    "teamAccess": "Entire Workspace"
  }
  ```

---

## 🛠️ Step-by-Step Launch Guide

### Option 1: Running Locally (Node.js)

Ensure you have **Node.js (v18+)** installed.

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Web Server:**
   ```bash
   npm start
   ```

3. **Visit Application:**
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

### Option 2: Running with Docker

Make sure **Docker** daemon is running.

1. **Build Docker Image:**
   ```bash
   docker build -t co-op-app .
   ```

2. **Run Docker Container:**
   ```bash
   docker run -p 3000:3000 --name co-op-container co-op-app
   ```

3. **Access Application:**
   Open [http://localhost:3000](http://localhost:3000).

---

## 🔒 Configuration & Security
- **No Secrets Required:** This application runs fully self-contained using secure simulated intelligence pipelines and locally persisted databases. No third-party api-keys or environment variables are needed for local operation.
- **Storage Path:** Direct schema logs are safely written to `data/memory.json`. Deleting this file will trigger automated seed rehydration with initial demo profiles.
