# PELAGIC // Sovereign Ocean Compute Layer

> **Unbounded compute on the high seas.**

PELAGIC is a brutalist, terminal-inspired system dashboard and operation deployment pipeline built for sovereign AI founders and infrastructure engineers seeking unconstrained, high-density compute on oceanic barge flotillas. 

By utilizing direct-to-chip liquid cooling systems drawing from constant 4°C deep ocean water (depth >200m), PELAGIC cuts power usage effectiveness (PUE) down to **1.02** (a **29.6% net energy overhead reduction** compared to land-based HVAC cooling loops) with zero land-permitting bottlenecks, zero agricultural resource conflicts, and physical sovereignty protected by international maritime law (UNCLOS).

---

## 🛠️ Architecture & System Structure

The application is engineered as a lightweight, robust Node.js/Express service coupled with a highly responsive, zero-dependency, tactical client dashboard designed in mono-spaced brutalist typography.

```
/workspace/
├── server.js               # Express API and Gemini AI integration engine
├── package.json            # Node manifest and dependencies
├── Dockerfile              # Cached multi-layer Alpine deployment spec
├── data/
│   └── memory.json         # Persistent JSON flat-file storage (mount-ready)
└── public/
    ├── index.html          # Shell structural control dashboard
    ├── style.css           # CRT scanning lines, custom metrics grid, raw steel layout
    └── app.js              # Real-time state syncing, active canvas radar, math calculators
```

---

## 🌐 Endpoints (REST API Specification)

All database synchronization calls route through Express state pipelines directly persisting records inside the `/data` directory:

### 1. `GET /api/memory`
* **Description:** Reads and retrieves the list of all deployed/queued modular flotilla configurations.
* **Response Output:** `200 OK`
```json
[
  {
    "id": "mem_01",
    "title": "HULL-942 // DEPLOY_QUEUE",
    "body": "{\"coordinates\":\"37.7412 N, -25.6756 W\",\"pue\":\"1.020\",\"density\":\"1,000 Nodes (50MW)\",\"cooling\":\"Direct-to-Chip Deep Ocean Water\",\"status\":\"QUEUED // SEC_PROTO_ACTIVE\"}",
    "createdAt": "2026-08-30T11:47:30.000Z"
  }
]
```

### 2. `POST /api/memory`
* **Description:** Writes a new sovereign barge provisioning lock-on into persistent disk memory.
* **Payload Input:** `{ title: String, body: JSONString/String }`
* **Response Output:** `201 Created`
```json
{
  "id": "mem_x3p92a",
  "title": "HULL-129 // DEPLOY_QUEUE",
  "body": "{\"coordinates\":\"0.0000 N, -120.0000 W\",\"pue\":\"1.020\",\"density\":\"2,000 Nodes (100MW)\",\"cooling\":\"Closed-Loop Saltwater Heat Exchange\",\"status\":\"QUEUED // SEC_PROTO_ACTIVE\"}",
  "createdAt": "2026-08-30T11:51:14.231Z"
}
```

### 3. `DELETE /api/memory/:id`
* **Description:** Decommissions a running compute unit and purges its signature from persistent records.
* **Response Output:** `200 OK`

### 4. `POST /api/copilot`
* **Description:** Interacts with the **Pelagic Maritime AI Architect** copilot model. Supplying a `GEMINI_API_KEY` environmental variable feeds requests directly to `gemini-1.5-flash` with pre-defined system instructions. If no API key is specified, it gracefully falls back to a locally compiled marine physics/UNCLOS rule-based solver.
* **Payload Input:** `{ message: String }`
* **Response Output:** `200 OK`

---

## 💻 Micro-System Control Deck Elements

* **SYS_MONITOR_01**: High-fidelity readouts showcasing average PUE (1.02), thermal depth delta (4.2°C), total megawatts provisioned, and active secure satellite signals.
* **SYS_MONITOR_02 (Thermal Delta Calc)**: Slide calculation widget showing real-time carbon reduction curves and megawatt usage ratios compared directly to dry-land servers.
* **SYS_MONITOR_03 (Sonar Radar & Schematics)**: A raw HTML5 2D radar loop drawing sweeping arcs and blinking sensor indicators linked to your active/queued barge coordinates.
* **SYS_ALLOC_01 (Queue Barge Provision)**: Seamless coordination pipeline allowing automated copilot fill-ups or manual geo-coordinate registration. Submitting writes coordinates directly to storage.
* **SYS_COPILOT_01 (Maritime Copilot Room)**: Deep-dive query terminal supporting multi-line questions or hotkey questions relating to cupronickel alloy biofouling, Exclusive Economic Zones, or solar buoyancy gravity buffers.

---

## 🚀 Execution & Command-line Manual

### 1. Classical Local Development
Make sure you have [Node.js (v18+)](https://nodejs.org/) installed in your operating system environment.

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Launch development server (with hot reload):**
   ```bash
   npm run dev
   ```
3. **Launch in standard Production:**
   ```bash
   npm start
   ```

*To active real live Gemini operations, pass your credential on startup:*
```bash
GEMINI_API_KEY="your-gemini-api-key" PORT=3000 npm start
```

Open [http://localhost:3000](http://localhost:3000) inside your browser.

---

### 2. Containerized Deployment (Docker)
Ensure you have [Docker Desktop](https://www.docker.com/) running on your device.

1. **Build the PELAGIC container image:**
   ```bash
   docker build -t pelagic-core .
   ```

2. **Spin up container with durable host volume mapping:**
   ```bash
   docker run -d -p 3000:3000 -v $(pwd)/data:/app/data --name active-pelagic pelagic-core
   ```

3. **Verify running container status:**
   ```bash
   docker ps
   ```

4. **Access operations control panel:**
   Load [http://localhost:3000](http://localhost:3000) inside your web explorer.

To stop and decommission local container pods:
```bash
docker stop active-pelagic && docker rm active-pelagic
```

---

## 🔒 Security & Sovereignty Compliance
* **Zero Secrets**: Contains zero embedded passwords, API configurations, or private encryption seeds. 
* **State Durability**: Flat-file JSON structure within `/data` makes backups and persistent state syncing trivial during continuous container updates. Ensure the volume mount specifies `-v data-volume:/app/data` to retain logs.
* **Legal Shielding**: Standard coordinate feeds are aligned with sovereign buffers outside territorial limits.
