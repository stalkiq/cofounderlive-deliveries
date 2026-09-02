# ⚡ SUPERCHARGED SOCIETY // THE HIGH-OCTANE CONTROL PANEL

Welcome to the **Supercharged Society**, an elite private, tech-enabled ecosystem designed specifically for affluent petrolheads, track-day regulars, and restomod collectors who value mechanical engineering as high art.

This workspace implements a fully synchronized, responsive, deployable Node.js + Express application featuring durable JSON state ledgers, interactive SVG instrumentation clusters, coordinate mapping systems, and an administrative sandbox deck.

---

## ⚡ WHAT THIS APP DOES

The Supercharged Control Panel provides members with a central dashboard to onboard high-performance vehicles into an immutable registry, view live trackside weather telemetry, coordinate paddock lineups on tactical maps, and simulate synchronized OBD-II CAN bus signals.

### Key Interactive Features:
1. **Interactive SVG Mechanical Tachometer**: A custom-designed vintage-style instrument cluster. Users can press and hold the "Throttle Engine" activator to hear and see the RPM needle spin towards the redline (+9000 RPM) with warning indicator lights.
2. **Tactical Circuit Network Map**: A dark-styled, high-contrast Leaflet.js map centered on **WeatherTech Raceway Laguna Seca** (Monterey, CA), equipped with interactive circuit toggle coordinates for Monterey, Willow Springs, and Thermal Club.
3. **Atmospheric Weather Instrumentation**: A dashboard tracking track temperatures, ambient air density indices, and available registry slots. Selecting a different circuit on the map instantly re-calibrates the weather metrics to match local telemetry.
4. **Verified Handshake Onboarding Form**: Connects directly to the backend durable database. Generates token IDs and verification cues.

---

## 📱 PRODUCT SCREENS

The workspace uses a compact sidebar-style layout tailored to high-density desktop monitoring:

*   **⚡ ONBOARDING**: Introduces the High-Octane Syndicate's guidelines and houses our custom animated SVG tachometer. Try clicking and holding the throttle button to rev the build.
*   **🏎️ DIGITAL GARAGE (DASHBOARD)**: Tracks real-time active metrics (Tire Pressures, Oil Temps, Lap Deltas, and OBD Link statuses) alongside the Registry Feed and public Syndicate track rsvp list.
*   **🗺️ CIRCUIT NETWORK**: Renders our custom dark Leaflet tactical map. Pinpoints approved racecourses and coordinates live atmospheric conditions.
*   **🔑 REGISTER VEHICLE (WORKFLOW)**: An extensive verification workflow matching the `product-spec.json` inputs exactly:
    *   *Vehicle Make & Model*
    *   *Chassis / VIN Number (Registry Tokenization)*
    *   *Primary Use Case Selection*
    *   *Telemetry Hardware ID (APEX-OBD Handshake)*
    *   *Next Scheduled Track Session (Date picker)*
*   **📂 REGISTRY LOG & SYSTEM BOX (HISTORY)**: A diagnostic dashboard that reads the raw contents of our durable persistent database (`data/memory.json`) in a neat table format. It includes simulator tools to approve pending applications or wipe and reset records to system factory baselines.

---

## 💾 DURABLE MEMORY ENDPOINTS

All entries submitted through the workflow form are instantly stored on disk using standard JSON block streams.

*   **Database Path**: `data/memory.json`
*   **REST API Handlers**:
    *   `GET /api/memory` - Retrieves all pre-loaded and newly register-verified vehicles.
    *   `POST /api/memory` - Validates, tokenizes, and writes incoming vehicle specifications into disk persistence.
    *   `POST /api/memory/approve` - Automated sandbox script that verifies and moves all pending "Reviewing Handshake" vehicles to fully "Verified" status.
    *   `POST /api/memory/reset` - Developer-only endpoint that purges registrations and reloads system default vehicles.

---

## 🚀 HOW TO TRY IT

### Option A: Local Run (Node.js)
1. **Ensure Node.js** (v18 or higher recommended) is installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Ignite the Server**:
   ```bash
   npm start
   ```
4. **Access the Client Dashboard**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Option B: Docker Containerization
1. **Build the Container Image**:
   ```bash
   docker build -t supercharged-society .
   ```
2. **Launch the Container**:
   ```bash
   docker run -p 3000:3000 supercharged-society
   ```
3. **Access Dashboard**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🧪 PROOF IT WORKS // IN-BUILT SMOKE TESTS

We have prepared a self-contained automatic integration smoke-test suite in `scripts/smoke-test.mjs`.

To execute the test sequence:
```bash
npm run smoke:test
```

### Script Execution Logic:
1. Spawns the Express app in a background thread on Port 3000.
2. Polls endpoints until the server is hot and active.
3. Fetches `GET /api/memory` and verifies pre-loaded baseline garage vehicles.
4. Performs `POST /api/memory` submitting a brand new custom vehicle payload:
   ```json
   {
     "vehicle": "1994 Porsche 911 (964) Turbo S Leichtbau",
     "vin": "WP0ZZZ96ZRS400512",
     "useCase": "Restomod Collector",
     "hardwareId": "APEX-OBD-SMOKE94",
     "nextSession": "2026-11-20"
   }
   ```
5. Asserts `201 Created` HTTP status response, validating assignments.
6. Re-queries the `GET` endpoint to make certain the vehicle is written to disk storage.
7. Shuts down the background process safely with standard process exits.
