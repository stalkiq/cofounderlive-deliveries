# Pico — The Instant Cloud for Bespoke, Agent-Built Tools

Pico is a tactile digital workbench designed for the long tail of single-purpose, agent-generated tools. It collapses the massive complexity and overhead of incumbent clouds like AWS into a clean, zero-config, single-click container sharing experience. This workspace contains a fully functional, deployable Node/Express server and an immersive frontend that allows users to manage active sandbox slots, load code templates, and compile scripts durably.

## 🛠 Product Archetype & Design Motif
Follows the exact specifications in `product-spec.json`:
- **Audience:** AI-native developers and team leads building custom internal workflows.
- **Palette Style:** High contrast, digital workbench styling (`#121110` background, `#1C1A18` concrete surfaces, and `#FF5A00` neon molten-orange accent flags).
- **Key Sandbox Features:**
  - **AWS vs. Pico Complexity Toggle:** An interactive switcher that visualizes the difference between raw AWS overhead (ALB, private routes, NAT gateways, IAM policies) and Pico's lightweight, single-click shared container.
  - **Gemini Compiler Agent Shell:** An aesthetic terminal parsing widget displaying mock AST scan results, lint actions, and generating customized sliders/knobs for non-technical teammates based on the source code.
  - **Durable Memory Integration:** Dynamic creation, parsing, listing, pausing, and termination of active micro-app slots connected to the local API.

---

## 💾 API System Specification
Pico mounts full-fidelity backing stores to ensure your custom scripts are persisted across system restarts without losing track of your workbench tools.

### 1. Retrieve Active Sandbox Slots
* **Endpoint:** `GET /api/memory`
* **Response Payload:**
  ```json
  {
    "success": true,
    "count": 3,
    "data": [
      {
        "id": "pico_kz2t9a8",
        "title": "lead-scraper",
        "body": "{\"runtime\":\"Python 3.11 (Lightweight)\",\"access\":\"Team Access (Google Workspace Auth)\",\"code\":\"...\",\"status\":\"Live\",\"compute_time\":\"9.2s\",\"active_users\":2,\"detail\":\"...\"}",
        "createdAt": "2026-08-25T10:00:00.000Z"
      }
    ]
  }
  ```

### 2. Live Slot Provision / Save Memory
* **Endpoint:** `POST /api/memory`
* **Request Payload (Core JSON schema `{title, body}`):**
  ```json
  {
    "title": "slack-responder",
    "body": "{\"runtime\":\"Python 3.11 (Lightweight)\",\"access\":\"Public (Anyone with link)\",\"code\":\"import requests...\",\"status\":\"Live\",\"compute_time\":\"0.5s\",\"active_users\":0,\"detail\":\"Slack uploader\"}"
  }
  ```
* **Success Output:** `201 Created`

### 3. Kill Slot / Terminate Container Container
* **Endpoint:** `DELETE /api/memory/:id`
* **Success Output:** `200 OK`

---

## 🚀 Quick Start Instructions

This codebase has **no required secrets, environment variables, or third-party connections**, making it completely secure, self-contained, and ready to go.

### Running Locally with Node.js
First, ensure you have **Node.js (18+ or 20+)** installed on your system. Run these commands:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Launch development server (Auto reload watching enabled):**
   ```bash
   npm run dev
   ```

3. **Launch production mode server:**
   ```bash
   npm start
   ```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)** to view and test the complete workbench dashboard.

---

### Running in Containers with Docker
The repository includes a locked, microsecond-cached alpine secure container compilation mapping ready for container platforms.

1. **Compile and build the Pico container image:**
   ```bash
   docker build -t pico-cloud .
   ```

2. **Instantiate container in the background exposing standard port:**
   ```bash
   docker run -d -p 3000:3000 --name pico-workbench pico-cloud
   ```

Navigate to **`http://localhost:3000`** to interact with the containerized application.
All user apps configured inside are written to the Docker partition durably!
