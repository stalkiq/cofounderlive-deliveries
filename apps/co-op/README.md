# Co-Op: Don't work with AI alone.

**Co-Op** is a Figma-meets-Terminal multiplayer canvas where human developers and AI agents co-author, co-pilot, and steer workflows in real-time. It transforms isolated, single-player AI chat threads into shared, immersive team workshops.

This repository implements **durable backend storage** and a **deployable single-page multiplayer console** for the platform concept.

---

## 🎨 Product Architecture & Design Specs

- **Left Panel (Workspaces & Control)**: Includes a kinetic brand thesis and an interactive **Launch Shared Session** panel. Whenever a session is deployed, it issues a `POST /api/memory` dispatch to store parameters in a local database.
- **Right Panel (Multiplayer Canvas stream)**: Features moving multi-colored human cursors (`Sarah (PM)`, `Alex (Dev)`) and a glowing green agent cursor (`DevAgent-3`) actively typing out Python refactoring runs.
- **Takeover Mechanic**: Incorporates an interactive steering bypass. Visitors can tap the **Takeover Agent** button (or press `ESC` on the keyboard) to pause the active AI run, submit redirect instructions, and watch the agent adapt in real-time.
- **Theme Palette**: Low-opacity dark backdrops (`#121214`), neon terminal borders, high-end sans-serif typography for humans, and stark monospace blocks for agent pipelines.

---

## 💾 Durable Storage API Endpoints

The backend supports standard, zero-secret JSON operations, persisting inputs directly to a local file (`memory.json`):

### 1. Retrieve Active Sessions
* **Endpoint**: `GET /api/memory`
* **Response**: Returns a JSON list of all active co-authoring threads, sorted by most recent first.

### 2. Append Collaborative Memory
* **Endpoint**: `POST /api/memory`
* **JSON Body Parameters**:
  ```json
  {
    "title": "Selected Agent Persona + Target Context",
    "body": "Detailed prompts or session redirect instructions",
    "persona": "DevAgent (Coding & Refactoring)",
    "repo": "github.com/co-op/auth-service",
    "access": "Engineering Core"
  }
  ```
* **Response**: JSON record of the freshly registered thread accompanied by a unique `id` and `createdAt` timestamp.

### 3. Evict Session Memory
* **Endpoint**: `DELETE /api/memory/:id`
* **Response**: Confirms removal of the local record, immediately syncing status back to `memory.json`.

---

## 🚀 Setting Up the Application Locally

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Express Web Server
```bash
npm start
```
The server will boot on port `3000`. Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🐳 Running with Docker

This repository includes a production-ready, lightweight Docker configuration.

### 1. Build the Docker Image
```bash
docker build -t co-op-multiplayer .
```

### 2. Run the Container
```bash
docker run -d -p 3000:3000 --name co-op-instance co-op-multiplayer
```
You can now access the interface inside the isolated container at **http://localhost:3000**.

To ensure **durable storage persistence** across container rebuilds, bind the container's `memory.json` to your local host folder using mounts:
```bash
docker run -d -p 3000:3000 -v $(pwd)/memory.json:/usr/src/app/memory.json --name co-op-instance co-op-multiplayer
```

---

## 🔗 Traceability & Spec Compliance
1. **Durable API Endpoint `/api/memory`**: Accomplished via `server.js` matching data payloads with standard file-system reads and writes to `memory.json`.
2. **Simple/Interactive UI Calls**: Accomplished via interactive AJAX `fetch` calls in `public/index.html` executing during session launch, manual page refreshes, and deletes.
3. **Multiplayer Live Simulation & Auditing**: Live Python refactoring typing loops and responsive stakeholder bypass prompts are implemented natively using pure Javascript.
4. **No embedded secrets/credentials**: Kept totally secure.
