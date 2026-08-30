# ⚡ GANTRY // OPERATIONAL EXECUTION ENGINE

> **"Stop prompting. Start executing."**
> Gantry is a compact, precise, and deterministic execution engine designed to replace brittle multi-app manual workarounds with resilient, self-healing agent pipelines. 

---

## 🏗️ What this app does
While most agent products are limited to conversational chatbots that merely spit out unstructured text, **Gantry** is built to take strict, automated action across real systems. 

It takes messy, natural language descriptions of operational chores (e.g. *"Stripe refunds matching Salesforce contacts"*), and compiles them into concrete JSON state-machine schemas. These schemas contain robust, automated error recovery triggers, which can then be dry-run in real-time inside our visual pipeline monitors. Every operation event, operator onboarding configuration, and dry-run telemetry execution is logged directly into a durable, local persistent storage container.

---

## 🖥️ Layout Screens

Gantry is structured around a terminal-esque sidebar blueprint navigation frame containing four compact monospace control rooms:

### 1. 📂 `ONBOARD_OPERATOR` (Onboarding Screen)
- **Purpose**: Establishes operator identification titles and registers the company workspace environment directly to global system files.
- **Controls**: Form fields to input `ORGANIZATION_NAME`, `OPERATOR_ROLE_OR_TITLE`, toggle automated checksum audits, select global `SYSTEM_RECOVERY_MODE` and set custom line buffer metrics.
- **Persistence**: Emits a `POST /api/memory` payload to lock operational metadata inside storage logs.

### 2. 🤖 `SCHEMA_COMPILER` (Gantry Schema Compiler)
- **Purpose**: Translates messy operations descriptions describing complex chores (like refund reconciliations, CRM validations, and inventory syncs) into schema matrices.
- **Features**: Features single-click quick-start prompt accelerators, a streaming compiling loader overlay rendering sequential node evaluations step-by-step, and an interactive state-machine flowchart.
- **Data output**: Generates structured, declarative JSON state-machine files complete with custom validation rules, processing limits, and auto-retry retry schemas.

### 3. 🧪 `DRY_RUN_SIMULATION` (Dry-Run Simulator)
- **Purpose**: Allows operators to execute live simulations of compiled pipelines and observe self-healing API integrations behavior.
- **Features**: Consists of configuration controls for Trigger source, Target destination, Error protection policies, and a live input Payload JSON block.
- **Visualization**: An interactive active pipeline monitor utilizing glowing state nodes (`TRIGGER` ➜ `INTEGRITY_CHECK` ➜ `EXECUTION_NODE` ➜ `TARGET_PERSIST`) linked by pulsing laser scanners that update color-states from `STANDBY` ➜ `ACTIVE` ➜ `OK` or `[ RECOVERED ]`.
- **System Shell**: Logs live execution stdout streams, recording exponential backoffs and fallback connections line-by-line before writing run results to `/api/memory`.

### 4. 📊 `ACTIVE_NODE_LOGS` (Settings & Archive Stacks)
- **Purpose**: A spreadsheet audit archive of previous simulation logs, schemas, and operator records pulling directly from Gantry memory.
- **Metrics Dashboard**: Computes overall real-time KPIs dynamically based on history mutations:
  - **RUN SUCCESS RATE**: Compares success rates vs SLA thresholds.
  - **AVERAGE LATENCY**: Real average milliseconds latency overhead.
  - **RECOVERED FAULTS**: Count of self-healing actions resolved.
- **System Tools**: Trigger immediate hardware diagnostic sweeps by refreshing raw database logs or purging storage arrays.

---

## ⚡ Durable Memory Storage

Persistence integrity is maintained in compliance with core requirements through standard endpoints:
- `GET /api/memory`: Recovers all stored operational transaction logs or filters history dynamically.
- `POST /api/memory`: Adds verified structural arrays directly to storage.

All updates append immediately to a file-backed JSON database [db_memory.json](file:///tmp/ag-ep_mtg5tj2q-bHullj/db_memory.json) located at root. This design ensures that restarting servers, redeploying containers, or refreshing tabs preserves every metric, compilation, and setup.

---

## ⚙️ How to try it

Running Gantry locally requires a standard Node setup ($v18.0.0$+), or a Docker runner. Follow these instructions:

### Local Execution (Manual Setup)
1. Install current production packages:
   ```bash
   npm install
   ```
2. Launch the Express Web Server:
   ```bash
   npm start
   ```
3. Open standard consoles in browser:
   ```text
   http://localhost:3000
   ```

### Local Testing Suite
To ensure execution pipelines, static resources, database writing, compile serialization, and API metrics verify flawlessly, run the integrated testing module:
```bash
npm run smoke-test
```

### Dockerized Execution (Container Build)
1. Compile Docker Image:
   ```bash
   docker build -t gantry-engine .
   ```
2. Start Container Environment:
   ```bash
   docker run -p 3000:3000 gantry-engine
   ```

---

## ✅ Proof it works

All core specifications have been thoroughly code-assembled and programmatically validated under strict diagnostic runs:
* **Terminal UI Structure**: Formulated according to spec styles (#0D0E10 background, orange `#FF6B00` highlights, green `#00E676` integrations indicators). All variables mapped inside [index.html](file:///tmp/ag-ep_mtg5tj2q-bHullj/public/index.html) and [style.css](file:///tmp/ag-ep_mtg5tj2q-bHullj/public/style.css).
* **Memory Integrity**: Backed by secure sync code inside [server.js](file:///tmp/ag-ep_mtg5tj2q-bHullj/server.js) mapping back to [db_memory.json](file:///tmp/ag-ep_mtg5tj2q-bHullj/db_memory.json).
* **Interactive Clients**: Wired with transition handlers, simulator clocks, and automatic fetch callbacks in [app.js](file:///tmp/ag-ep_mtg5tj2q-bHullj/public/app.js).
* **Automated Assurance**: Testing criteria matched by [smoke-test.mjs](file:///tmp/ag-ep_mtg5tj2q-bHullj/scripts/smoke-test.mjs).
