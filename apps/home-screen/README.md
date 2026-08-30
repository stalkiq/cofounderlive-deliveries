# 📱 HOME SCREEN // Hacker Portal v1.0.4

> **The race for the next billion-user icon.**

A brutalist, neon-coral terminal interface and deployment cockpit designed for maverick consumer founders tracking the cost deflation curves of consumer intelligence. Built for Node.js + Express with an interactive web dashboard, dynamic SVG cost simulators, and a durable ledger system.

---

## 🛠️ System Architecture & Workflow

This project is a complete, deployable Node + Express web application consisting of three main modules:

1. **Brutalist Terminal Front-end (`/public`)**: A single-page, compact interface matching the "Home Screen" brand guidelines (Sharp edges, TypeStyle `#mono`, Accent Color `#FF5A09`). Features:
   - **Agent Cost-Curve Simulator**: Animates real-time YoY 10x token devaluation curves using a dynamic dragging slider mapped directly to SVG path coordinate matrices.
   - **Token Deflation Ledger**: Renders development eras and cost benchmarks.
   - **Claim Icon Slot Platform**: A workflow-driven code/execution-log transmitter.
   - **Synchronized Decryptor logs**: Live lists reflecting memory updates instantly.
   - **3D Mobile device grid Mockup**: Angled using CSS `rotateX` perspectives to project a tactile glass iOS-style home screen. Claims empty slots with animated app shortcuts dynamically populated directly from database records.
2. **REST API server (`server.js`)**: Backed by secure, lightweight Express nodes. Coordinates token simulations and parses submissions.
   - Uses environmental variable **`GEMINI_API_KEY`** natively to evaluate user agent constructs if active.
   - Automatically fallback-coordinates to a complex procedural rule-based text indexer to ensure 100% operation offline even without active credentials.
3. **Durable File Database (`/data/submissions.json`)**: Realizes durable backend memory by initializing and appending structured JSON arrays inside an automated persistent file system.

---

## ⚙️ Fast Start Developer Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (Version >= 18.x recommended)
- NPM (packaged with Node)
- (Optional) [Docker](https://www.docker.com/)

---

### Method A: Native Host (NPM)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environments**: Ensure optionally configuring Gemini connections inside `.env` (a `.env` template file has been baked into the repository):
   ```ini
   PORT=3000
   GEMINI_API_KEY=AIzaSy...your_gemini_api_key...
   ```

3. **Spin up Dev Server**:
   ```bash
   npm run dev
   ```

4. **Spin up Production Server**:
   ```bash
   npm start
   ```

Open up your browser to: **`http://localhost:3000`**

---

### Method B: Containerized Deployment (Docker)

To run the Hacker Portal instantly inside container sandboxes:

1. **Build Container Image**:
   ```bash
   docker build -t homescreen-portal:1.0.4 .
   ```

2. **Run Container (Ephemeral Mode)**:
   ```bash
   docker run -p 3000:3000 homescreen-portal:1.0.4
   ```

3. **Run Container (Durable Volume Storage Mode - Recommended)**:
   Mount a standard host volume pointing to `/usr/src/app/data` to ensure submitted database records persist indefinitely across container restarts, teardowns, or updates:
   ```bash
   docker run -p 3000:3000 \
     -v $(pwd)/host_data:/usr/src/app/data \
     homescreen-portal:1.0.4
   ```

---

## 🛰️ REST API Endpoints

### 1. `GET /api/memory`
Retrieves a chronological list of committed project transmissions from the durable local JSON storage.
- **Response Shape**: `Array<JSON>`
  ```json
  [
    {
      "id": "pitch-1724956320000",
      "title": "Neon Health Agent",
      "body": "Proactive health loops running continuous acoustic analysis...",
      "category": "Agentic Utility (Logistics, Money, Health)",
      "metrics": {
        "currentCost": "$1,850.00",
        "projected2026": "$18.50",
        "feasibility": "94.2%",
        "timeline": "Mass Feasible: Q4 2026"
      },
      "timestamp": "2026-08-29T12:00:00.000Z"
    }
  ]
  ```

### 2. `POST /api/memory`
Appends a brand-new project pitch directly to the backend durable ledger.
- **Request Parameters**:
  - `title` (String, Required) - The Project Name.
  - `body` (String, Required) - Terminal outputs or Code loops.
  - `category` (String, Optional) - Market category label.
- **Payload Shape**: `{ title, body }`
- **Output**: Writes durably to `/data/submissions.json` and returns created records.

### 3. `POST /api/simulate`
Dispatches agent workflows to active Google flash model calculations (or falls back to procedural keyword indexers) to compute metrics.
- **Request Parameters**: `{ description: "A wealth manager that matches bills..." }`
- **Response**: Returns token scales, cost evaluations, and feasibility scales.

---

## 📂 Source Code Map

- `server.js` - Primary Express routing, HTTPS requests, Gemini integrations, and File Database I/O.
- `.env` - Environment and port templates.
- `Dockerfile` - Alpine production deploy configurations.
- `/data/submissions.json` - Durable local database file (seeded with mock submissions initially).
- `/public` - Landing and UI scripts.
  - `index.html` - Sidebar nodes, panels, and phone mockup.
  - `style.css` - Responsive flex grid layout, neon styling variables, 3D CSS matrices.
  - `app.js` - Clock managers, slider coordinate math, volume fetch loops.
