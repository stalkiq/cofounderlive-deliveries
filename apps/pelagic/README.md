# PELAGIC // Sovereign Oceanic Compute Layer

> **Unbounded compute on the high seas.** Standardized, modular GPU data center flotillas operating in international waters with infinite deep ocean-water cooling, free from land-based regulatory and power hurdles.

PELAGIC Control Platform acts as the industrial maritime operations and telemetry bridge. This application is a fully completed, deployable Node.js + Express control console designed following structural brutalist terminal palettes (`#0B1011` base, `#FF5A1F` international orange highlight indicators).

---

## 🛰️ Architecture & Spec Alignment

This implementation fulfills all requirements of the **PELAGIC MVP spec** (`product-spec.json`):

1. **Durable Ledger Layer (`/api/memory`)**:
   - `GET /api/memory`: Fetches the persistent ledger state, including any live active hull deployment queues dynamically.
   - `POST /api/memory`: Adds verified `{title, body}` records into localized, persistent storage (`./memory.json`) synchronously.
2. **Industrial Control Console (`public/index.html`)**:
   - **`SYS_MONITOR`**: Real-time stats ticker displaying dynamic composite PUE, cumulative power draw, and sea-bottom thermal measurements. Contains an **interactive Canvas radar tracker overlay** depicting hardware node sweep coordinates, alongside an **on-the-fly Thermal Delta calculator** comparing energy compression profiles.
   - **`SYS_COPILOT`**: AI Copilot simulator mimicking a maritime structural engineer specializing in deep ocean-water thermodynamics, seawater biofouling mitigation (using cupronickel piping), and international waters jurisdiction (UNCLOS protocols). Gives immediate config proposals that can be locked directly into provisioning coordinates.
   - **`SYS_ALLOC`**: Full deployment sequence form mapping to `POST /api/memory` to record sovereign hull deployments, which automatically updates dashboard telemetry.
   - **`SYS_MEMORY_LOG`**: Explicit log terminal for manual commits and live, verified database inspection showing ledger storage synchronization status.
3. **Container-Ready Deployment**: Includes standard optimized `Dockerfile` ready for generic cloud containers or local testing.
4. **Absolute Security**: Contains no hardcoded APIs, tokens, or credentials.

---

## 🚀 Quick Start Guide

### Option A: Local Node.js Execution

Ensure Node.js (version 18 or above) is installed on your system.

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Launch server**:
   ```bash
   npm start
   ```

3. **Navigate interface**:
   Open browser at [http://localhost:3000](http://localhost:3000)

---

### Option B: Docker Container

1. **Build image**:
   ```bash
   docker build -t pelagic-control .
   ```

2. **Run container**:
   ```bash
   docker run -d -p 3000:3000 --name pelagic-instance pelagic-control
   ```

3. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🛠️ API Diagnostic Sheet

### 1. Retrieve Current Ledger Memory
* **Endpoint**: `GET /api/memory`
* **Response Output Structure**:
  ```json
  {
    "status": "success",
    "count": 2,
    "data": [
      {
        "id": "1",
        "title": "HULL-01 NORTH ATLANTIC CONFIGURATION",
        "body": "Modular compute hull deployed at LAT 37.74° N, LON 25.67° W...",
        "timestamp": "2026-08-30T11:51:47.000Z"
      }
    ]
  }
  ```

### 2. Force Write Memory Entry
* **Endpoint**: `POST /api/memory`
* **Request Header**: `Content-Type: application/json`
* **Request Payload Checklist**:
  ```json
  {
    "title": "SAT_LINK_UPGRADE",
    "body": "Replacing standard C-Band antenna arrays on Hull-02 to secure extra 10Gbps backup satellite feeds."
  }
  ```
