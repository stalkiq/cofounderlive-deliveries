# GANTRY // OPERATIONAL EXECUTION ENGINE

> **"Stop prompting. Start executing."**
> A deterministic execution engine designed to replace brittle, multi-app manual workarounds with resilient, self-healing agent pipelines.

Gantry translates messy, conversational natural language operations into robust, structured state-machine JSON schemas, verifies them through sandbox dry-runs with built-in auto-recovery logic, and logs all transactional streams to a secure, durable memory network.

---

## 🛠️ What This App Does

In operations, manual chores (like reconciling stripe refunds with inventory and chat notices) are typically handled by support agents copy-pasting information across multiple apps. Brittle chatbot prompts and rigid Zapier flows break silently whenever API parameters change.

**Gantry solves this by acting as a self-healing pipeline architect:**
1. **Dynamic Compilation:** Translates unstructured manual chore descriptions into strict, 3-node state-machine blueprints (Trigger ➔ Action Validator ➔ Target Output).
2. **Built-In Resiliency (Auto-recovery):** Supports user-selected error-recovery protocols (exponential backoff self-healing, redundant server fallbacks, or paused manual overrides).
3. **Interactive Dry-runs:** Enables execution of compiled pipelines with simulated JSON mock payloads so you can visualize fault recovery in real-time.
4. **Durable Memory & Telmetry:** Stores pipelines and logs inside durable data endpoints, reporting average latency, recovery success ratios, and past runs.

---

## 🖥️ Screens

Gantry is designed as a single-page terminal console matching high-contrast monochrome layout schemes with mechanical status badges `[ OK ]` and pulsing connection indicators.

### 1. `SYS_ONBOARDING` (Screen 01)
* **Purpose:** Introduces the platform, configures operational boundary profiles (SaaS syncing, database hooks, P1 alert channels), and manages secure login.
* **Google Sign-In integrations:** Embeds official Google Sign-In JS buttons. If live Google credential client IDs are omitted in development, developers can click the **Instant Developer Sandbox Auth** button to simulate authentications and load custom profile metrics natively instantly.

### 2. `SCHEMA_COMPILER` (Screen 02)
* **Purpose:** The core operations workshop. Type custom manual chores in plain English or select one-click presets like *Stripe Refund Check*, *Vendor Invoice OCR Verification*, or *Renewal Sync*.
* **Interactive Blueprint Visualizer:** Generates an automated SVG system node mapping connection lines (`[TRIGGER Node]` ➔ `[VALIDATION Node]` ➔ `[TARGET Node]`).
* **Dry-Run Controller:** Edit test JSON payloads, choose error-recovery rules, and click `INITIALIZE DRY-RUN`. You can watch nodes pulsate and process sequences, see self-healing mechanisms trigger on simulated faults, and read results printed to the terminal console stream.

### 3. `NODE_LOGS_HISTORY` (Screen 03)
* **Purpose:** A centralized telemetry and log historian displaying execution histories saved across durable sessions.
* **State Inspector:** Select individual historical logs to inspect their decoded Gantry JSON state-machine variables stored inside the database, verifying cryptographic operational execution signatures.

---

## 💾 Durable Memory Architecture

Gantry persists all configurations, pipeline blueprints, and active execution run metrics to secure endpoints:

* **`GET /api/memory`** - Retrieves full state-machine configurations, past dry-run logs, and operator profile metrics. Called when loading any screen to populate log history tables and telemetry metrics (Success Rate, Avg Latency, Recovered Fault Counter).
* **`POST /api/memory`** - Saves and updates data on three channels:
  * `{ type: "run", payload: {...} }` - Appends a new transaction execution entry to logs.
  * `{ type: "schema", payload: {...} }` - Registers a newly generated state machine design.
  * `{ type: "user", payload: {...} }` - Updates notification metrics and operator credentials.

Every action in the main compiler or simulator calls `fetch('/api/memory')` behind the scenes, ensuring the application handles the details and saves entries instantly.

---

## 🚀 How To Try It

### Prerequisite
* Ensure Node.js (version 18 or higher) is installed.

### 1. Extract and Install
```bash
# Install core and developer server packages
npm install
```

### 2. Configure Environment (Optional AI Compilation)
By default, Gantry compiles workflows using a high-fidelity local keyword parser. To utilize live Google Gemini LLM generation, set your API key in a `.env` file at the root:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_goes_here
```

### 3. Start the Platform
```bash
# Fire up Express on localhost:3000
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** inside your browser.

* **Step A:** Go to **SYS_ONBOARDING** and click *Authorize as Developer Operator*.
* **Step B:** Switch to **SCHEMA_COMPILER**, select *Stripe Refund Verification*, and click *Compile*. Watch the visual blueprint nodes populate.
* **Step C:** Configure a recovery protocol and hit *Initialize Dry-Run* to trigger the sequence.
* **Step D:** Click on **NODE_LOGS_HISTORY** to view and copy the raw persisted JSON schematics.

---

## 🧪 Proof It Works

Gantry includes a complete automated smoke-test suite validating all key components of the backend and durable storage routines.

To execution testing checks, run:
```bash
npm run smoke/test
# OR: npm run smoke-test
```

### Smoke Test Output Sample:
```text
=================================================
🌌 GANTRY SMOKE-TEST SUITE: INTEGRITY SUITE
=================================================
[TEST-SETUP] Initializing Gantry Application Server on port: 3111
[TEST-SETUP] Gantry Application Server confirmed ready!

⚡ [TEST-01] GET /api/memory (Durable state retrieval)...
✅ [SUCCESS] GET /api/memory verified. Fetched 4 seeding logs.

⚡ [TEST-02] POST /api/memory (Durable state insertion)...
✅ [SUCCESS] POST /api/memory verified. Appended Log ID: RUN-1845

⚡ [TEST-03] POST /api/compile (Deterministic blueprint compiler fallback/AI)...
✅ [SUCCESS] POST /api/compile verified. Compiled by: Gantry Blueprint Synthesis (Local Fallback)
   --> Synthetic Step 1 (Trigger): Step 01: Event Listener (Trigger) - Intercept 'charge.refunded' webhook payload...
   --> Synthetic Step 2 (Action): Step 02: Verification Engine (Action) - Extract elements... real-time inventories from Shopify...
   --> Synthetic Step 3 (Target) : Step 03: Distributed Dispatcher (Target) - Post operations compliance audit card inside Slack...

⚡ [TEST-04] POST /api/run (Dry run simulator loop updates)...
✅ [SUCCESS] POST /api/run verified. Simulation runtime executed in: 1120ms
   --> Performance recovery metrics state: [ RECOVERED ]

⚡ [TEST-05] POST /api/auth/google (Identity gateway check)...
✅ [SUCCESS] POST /api/auth/google verified. Profile created for: Theo Gantry

[TEST-TEARDOWN] Killing Gantry active server thread on port 3111

=================================================
🎉 GANTRY INTEGRITY VERIFICATION: ALL PASSED (100%)
=================================================
```

---

## 🐋 Docker Containerization

To run Gantry inside an isolated Sandbox Docker container:

```bash
# Build Docker image
docker build -t gantry-engine .

# Run container on local port 3,000
docker run -p 3000:3000 gantry-engine
```
Once run, Gantry's terminal pipeline will be online on harbor port `3000`.
