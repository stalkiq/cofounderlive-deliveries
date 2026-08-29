# Co-Op: Multiplayer AI Canvas ▢

> **"Don't work with AI alone."**
> The collaborative canvas where teams and AI agents co-author, hand off, and build in real-time.

---

## 📖 The Multiplayer AI Thesis

The best work tools of the last two decades won by going multiplayer. Google Docs replaced Microsoft Word. Figma beat Photoshop. They turned solo actions into spaces where teams build together in real-time.

But AI hasn't had its multiplayer moment yet. Working with AI agents is largely single-player: you prompt in private boxes, and the best you can do is email links to read-only transcripts.

**Co-Op changes that.** As AI runs tasks taking hours/days, anyone on a team can drop into the same live agent session to watch progress, redirect its objectives, or take over control. This turns private threads into a shared, living thing.

---

## ⚡ Key Product Features

1. **Figma-meets-Terminal Workspace Canvas**: Live, absolute overlay cursors indicating what teammates (`Sarah (PM)`) or AI agents (`DevAgent-3`) are actively focusing on inside the code editor.
2. **Tactile Interactive Takeover Interrupt Hook**: Tap the glowing **TAKEOVER AGENT** button or strike the `ESC` key to instantly freeze agent behavior, lock the terminal stream, and command manual co-authoring layout directly.
3. **Durable File Memory Persistence**: Express endpoints read and write state directly to a local, database file (`sessions.json`), saving workspace contexts safely across restarts.
4. **Adaptive Co-Author Agent Brain**:
   - **Local Mock Mode (Default)**: Intelligently generates step-by-step terminal refactors, unit tests, or deal strategies matching the selected persona (`DevAgent`, `QA-Agent`, `DocAgent`, `SalesAgent`).
   - **Live Gemini Integration (Optional)**: Provide a `GEMINI_API_KEY` to hook up actual Google Gemini intelligence to synthesize edits directly on the collaborative canvas file text.

---

## 🛠️ Durable Backend Memory API Reference

The backend uses standard JSON file structures to durably persist sessions and work events:

### Sessions Registry
* **`GET /api/sessions`**: Fetches the registry of deployed multiplayer sessions.
* **`GET /api/sessions/:id`**: Retrieves full metrics state, cursors layer, edit logs, and file content of a specific session.
* **`POST /api/sessions`** *(Core Launch Workflow)*: Spins up a new channel.
  * **Payload fields**:
    ```json
    {
      "name": "oauth-refactor",
      "persona": "DevAgent (Coding & Refactoring)",
      "repository": "github.com/co-op/auth-service",
      "access": "Engineering Core"
    }
    ```

### Live Canvas Interactions
* **`POST /api/sessions/:id/messages`**: Add workspace communications, prompts, and file edit instructions to trigger agent activity.
* **`POST /api/sessions/:id/takeover`**: Lock or release agent control levels instantaneously.
* **`POST /api/sessions/:id/code`**: Sync direct user editor inputs in override lock status.
* **`POST /api/sessions/:id/cursors`**: Sync dynamic human coordinates in the workspace.

---

## 🚀 Running the Application

### 1. Locally on your Machine

First, ensure you have **Node.js (18+)** installed.

```bash
# Install dependencies
npm install

# Start the collaborative server
npm start
```

Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**.

To enable **live Gemini capabilities**, run with your Google API Key:
```bash
GEMINI_API_KEY="your-gemini-api-key-here" npm start
```

### 2. Containerized via Docker

A lightweight `Dockerfile` is pre-configured for instant deployment.

```bash
# Build the Co-Op Docker image
docker build -t co-op .

# Run the container exposing port 3000
docker run -p 3000:3000 co-op
```

To run with live AI in docker:
```bash
docker run -p 3000:3000 -e GEMINI_API_KEY="your_api_key" co-op
```

---

## 📂 Project Structure

```
├── Dockerfile              # Production-ready multi-stage container deployment
├── README.md               # Product concept guides & running instructions
├── package.json            # Node/Express dependencies description
├── product-spec.json       # Original conceptual specification file
├── server.js               # Durable JSON backend controller & APIs
├── sessions.json           # File-based DB (auto-seeded upon initialization)
└── public/                 # Static single-page application directory
    ├── index.html          # Split-screen live interface layout
    ├── css/
    │   └── style.css       # stark black, neon volt, magenta accent styles
    └── js/
        └── app.js          # Interactive SPA controller, canvas, & cursor drift loop
```
