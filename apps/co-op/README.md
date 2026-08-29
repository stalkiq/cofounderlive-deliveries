# Co-Op ⚡ (Multiplayer AI Workstation)

> Don't work with AI alone.
>
> Co-Op is a "Figma-meets-Terminal" collaborative workspace canvas where humans and AI agents interact, execute plans, and co-author files in real-time.

---

## Features Built in this App

1. **Durable Core Workflow Memory API**:
   - `GET /api/sessions`: List all active multiplayer sessions.
   - `POST /api/sessions`: Launch a new shared session binded to a repo/file.
   - `GET /api/sessions/:id`: Retrieve real-time stream state.
   - `POST /api/sessions/:id/events`: Log user comments and workspace mutations.
   - `POST /api/sessions/:id/takeover`: Tactile manual takeover switch (ESC shortcut).
   - `POST /api/sessions/:id/prompt`: Send execution instructions to the Agent Brain (powered by direct Gemini validation or rich interactive simulations).
   
2. **Durable File Database (`data/db.json`)**: All created sessions, event lists, custom code highlights, and chat prompts persist permanently. Restarting the server does not wipe your active team workspaces.

3. **Stuning Split-Screen UI**:
   - **Left Pane (Collaborative Launchpad)**: Pitch manifesto, brand thesis, configuration panels to deploy agents, and selection tables of active group rooms.
   - **Right Pane (Multiplayer Workspace)**: A live editor pane with moving colored cursor pointers (`Sarah (PM)`, `DevAgent-3`, `Alex (Dev)`), simulated synchronization logs (12ms latency!), direct interactive comment stream feed, and an intelligent **Agent Control Room** interface.

4. **Robust Gemini Core Integration**:
   - Out of the box, Co-Op uses an intelligent simulated parser that responds to security audits, test structures, or general code refactorings.
   - Simply start the app with `GEMINI_API_KEY=your_key` to wire it up directly to the official Google Gemini 1.5 flash model APIs for active context-aware code outputs inside the multiplayer window!

---

## 🚀 Quick Start (Local Setup)

Ensure you have **Node.js (>=18.0)** installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Server
To run with native simulated flow fallbacks:
```bash
npm start
```

Or, to feed real cooperative code outputs using **Gemini**:
```bash
EXPORT GEMINI_API_KEY="your-google-gemini-api-key"
npm start
```

Open and collaborate on: **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🐳 Docker Deployment

You can containerize and deploy Co-Op instantly onto lightweight microservices (AWS ECS, Google Cloud Run, Render, etc.).

### 1. Build Docker Image
```bash
docker build -t co-op-canvas .
```

### 2. Live Run Container
```bash
docker run -p 3000:3000 --name co-op-app -d co-op-canvas
```
Visit **http://localhost:3000** to test your deployed multi-user workspace container.

---

### Folder Architecture
```text
├── data/
│   └── db.json          # Durable JSON document memory (saves states across restarts)
├── public/
│   ├── index.html       # Split-screen terminal responsive layout
│   ├── styles.css       # Premium visual styling (volt and magenta cursor systems)
│   └── app.js           # Interactive UI controller and live state polling
├── server.js            # Express API Endpoint handlers & Gemini routing controller
├── Dockerfile           # Standard Production container asset configuration
└── package.json         # Node runtime declaration & dev dependencies
```
> Developed with kinetic, collaborative, unfiltered design principles by Antigravity coding worker.
