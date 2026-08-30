# 🌊 AEGIR // SYSTEM TELEMETRY & SOVEREIGN OCEAN COMPUTE DASHBOARD

`AEGIR` is a brutalist maritime-telemetry interface designed for sovereign investors and deep-tech operators deploying standardized, high-density GPU server-barges in international waters. By taking compute offshore, AEGIR bypasses terrestrial approvals, high grid connection times, and power limits, using the open ocean as an infinite heat-sink.

This repository contains the complete fully-runnable operations control center, telemetry dashboard, persistent backend storage engine, and a test suite.

---

## 🛠️ Operational Core Features

*   **Compact Brutalist Maritime Styling:** High-density, mono-spaced telemetry visuals styled with safety-sea international maritime orange (`#ff4f00`), sonar green (`#00ff66`), and deep abyssal slate.
*   **Vector Sonar Simulation:** Real-time CSS-driven rotating sweep animation mapping flotilla spatial positioning. Clicking on sonar hubs reveals details instantly.
*   **Durable State Engine:** Active flotilla nodes, audit logs, and system presets are committed durably using Express backend storage.
*   **Tactical Web Audio:** An integrated retro acoustic wave synthesizer for tactile telemetry actions.

---

## 🖥️ Screen-by-Screen Walkthrough

### 1. Onboarding Screen (`Auth Securities Clearance`)
*   **Purpose:** Welcomes sovereign investors and operators with a thesis background regarding electrical grids shortages and thermodynamic water cooling.
*   **Features:** Interactive credential handshake and UNCLOS maritime legal validation checks that unlock system level interfaces upon authorization.

### 2. Operating Control Deck (`Main Workflow`)
*   **Purpose:** The central operations grid. Displays synchronized flotilla components.
*   **Components:**
    *   *Radar Telemetry Sweeper:* Dynamically visualizes modular compute barges as active blinking targets.
    *   *Environmental Conditions:* Monitors real-time water temp intake, wave metrics, and storm warnings near the Mid-Atlantic corridor (38.72° N, 27.22° W).
    *   *Vessel Registry Grid:* A compact table listing cluster hardware, active loads, PUE profiles, and temperatures.
    *   *Deploy Vessel Form (Workflow):* Prompts operators to log coordinates, name identifiers, configuration specs (H100 vs. B200 clusters), and launch dates.
    *   *Success Acknowledgment Banner:* Provides real-time authorization callbacks confirmation based on `product-spec.json` requirements.

### 3. Settings & History Audits (`Control Terminal`)
*   **Purpose:** Configures server safety protocols and lists incident timelines.
*   **Features:**
    *   *Emergency Submerge Presets:* Set critical depth (in meters) and water manifold warnings thresholds. Persists configurations immediately to server.
    *   *Historical Event logs:* chronological stream of security alarms, dispatch notices, and cooling ratings.
    *   *System Reset Module:* Purges database records, immediately restoring defaults.

---

## 💾 Durable Backend Memory Endpoints

The system implements fully-persistent files storage utilizing a schema-validated database located at `data/memory.json`.

*   **`GET /api/memory`**
    *   Retrieves all registerable vessel flotillas, historic audit feeds, and threshold configurations.
*   **`POST /api/memory`**
    *   Invoked by the vessel workflow to commission new assets.
    *   Invoked by system operators to modify safety scuttle depths and warning alarms thresholds.
    *   Invoked to wipe and restore default baseline arrays.

---

## 🚀 How to Try It

### Prerequisite Checklist
*   [Node.js (v18 or higher)](https://nodejs.org/) installed, OR
*   [Docker](https://www.docker.com/) installed.

### Option A: Local Run (Fastest)

1.  **Retrieve Dependencies:**
    ```bash
    npm install
    ```
2.  **Activate Telemetry Server:**
    ```bash
    npm start
    ```
3.  **Explore Interface:**
    Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

### Option B: Containerized Run (Production-Ready Docker)

1.  **Build Docker Image:**
    ```bash
    docker build -t aegir-dashboard .
    ```
2.  **Deploy Container:**
    ```bash
    docker run -d -p 3000:3000 --name aegir-telemetry aegir-dashboard
    ```
3.  **Explore Dashboard:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Proof It Works (Automated Smoke Test)

We have bundled a robust automated test runner inside `scripts/smoke-test.mjs` that launches a test server, asserts proper endpoint logic, validates persistent changes, and exits cleanly.

### Execute the Smoke Suite
To run the automated smoke tests, execute:
```bash
npm run test
```

### Assertions Performed
1.  **GET Baseline Check:** Verifies original vessels (AEGIR-01 through AEGIR-04) load successfully with healthy status.
2.  **POST Deployment Dispatch:** Spawns a brand new vessel (`AEGIR-TEST-BETA`) in the Pacific Corridor, validating response statuses (`201 Created`) and checking that history logs and array dimensions are accurately updated.
3.  **POST Settings Update:** Alters critical scuttle depths to `420m` and verifies the system saves changes to the persistent database.
