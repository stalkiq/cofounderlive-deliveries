# Roamstead: Co-Pilot for Life on the Open Road

**Roamstead** is a rugged, nostalgic, yet highly dependable digital field guide tailored specifically for full-time digital nomads and active retirees navigating the US highways in Class A and Class B motorhomes. 

Designed on a vintage National Park WPA poster aesthetic, it provides safe route calculations, rig diagnostics calibration, and offline-first community road warnings ("Campfire Dispatch").

---

## 🌲 Visual Concept & Tone

Inspired by 1930s Federal Art Project posters of our National Parks, Roamstead balances a deep respect for the outdoors with tactical motorhome requirements. It features:
* **Organic Earth Tones:** Pine green (`#1B3B2B`), warm oatmeal sand (`#F0EAE1`), rust clay (`#C85A32`), and a warm vintage ivory background (`#FDFBF7`).
* **Tactile Paper Texture:** Soft CSS-driven fractal grain overlays to evoke traditional physical maps.
* **Serif Typeface:** Elegant literary serif styles (`Libre Baskerville` and `Lora`), paired with a rustic manual typewriter font (`Special Elite`) for stamps and field dispatches.
* **Interactive Elements:** Tactile retro switches, dial calibrations, and live diagnostic sweeps monitoring vital telemetry.

---

## ✨ Features Built in the App

This single-page, responsive application hosts three fully realized core screens accessible via an ergonomic bottom navigation layout:

1. **🗺️ RV-Safe Navigator (Scenic Route):** 
   An active route tracing Moab, UT, to Zion National Park, UT. This screen features:
   * A winding scenic path animated directly on an SVG map container.
   * Safety metrics critical to heavy rigs (low clearance warning checklists, mountain grade warnings, and propane-restricted tunnel alerts).
   
2. **🔌 Rig Telemetry & Maintenance (Dashboard):**
   Tactile analog dials tracking the motorhome's principal electrical, waste, water, and mechanical systems:
   * **Circular Sweping Gauges:** Real-time feedback for House Battery voltage, Generator running hours, Potable Fresh Water, and Galley Grey Water.
   * **Vintage Switches & Actions:** Fully-functioning on-off switches and button actions allowing physical calibration of propane and suspension sensors or resetting service schedules.

3. **🔥 Campfire Dispatch (Community Road-Ledger):**
   An offline-ready workflow allowing travelers to submit and review road dispatches (e.g. low overhangs, no cellular zones). Powered entirely by our robust, durable backend database system.

---

## 💾 Durable Memory API

Roamstead implements a completely durable, zero-dependency storage layer. It writes dispatches to `data/memory.json` locally on the server filesystem to persist reports through server restarts.

### 1. `GET /api/memory`
Retrieves a complete chronological list of verified community dispatches, ordered descending from latest submission.
* **Response Example:**
  ```json
  [
    {
      "id": "1724958300000",
      "title": "Low Clearance Hazard (< 13'6\") at UT-9 near East Entrance",
      "body": "Measured clearance approx 12'10\". Watch your AC units! (Date observed: 2026-08-29)",
      "timestamp": "2026-08-29T18:59:00.000Z"
    }
  ]
  ```

### 2. `POST /api/memory`
Persists a new community dispatch on the server, appending it to the JSON log system.
* **Headers:** `Content-Type: application/json`
* **JSON Payload Structure:**
  ```json
  {
    "title": "Report Type at Location / Mile Marker",
    "body": "Observed details (Date observed: YYYY-MM-DD)"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "id": "1724958428190",
    "title": "Cellular Dead Zone at US-191 North",
    "body": "No data bars on T-Mobile for 4 miles. (Date observed: 2026-08-29)",
    "timestamp": "2026-08-29T19:00:28.190Z"
  }
  ```

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* NPM (installed automatically with Node)

### 1. Installation
In the project directory, install dependencies:
```bash
npm install
```

### 2. Start the Server
Run the local development server:
```bash
npm start
```
The console will verify the server state:
```
===============================================
 Roamstead Co-Pilot Server is Live!           
 Running on port: http://localhost:3000      
 Durable database loaded at: .../data/memory.json
===============================================
```
Visit **[http://localhost:3000](http://localhost:3000)** in your browser to start exploring the open road!

---

## 🐳 Docker Deployment

The application is containerized and ready for fast cloud deployment or local sandboxing.

### 1. Build the Docker Image
```bash
docker build -t roamstead-copilot .
```

### 2. Run the Container
Map port `3000` to access the application, and mount a volume onto `/usr/src/app/data` to ensure stored memory survives container destruction:
```bash
docker run -d -p 3000:3000 -v roamstead-data:/usr/src/app/data --name roamstead-guide roamstead-copilot
```

---

## 🛠️ Project Structure
```
├── data/
│   └── memory.json       # Durable JSON database storage
├── public/
│   └── index.html        # Interactive Single-Page App containing styling and scripts
├── Dockerfile            # Container deployment blueprint
├── package.json          # Node dependency definition
├── server.js             # Express.js HTTP and API routing backend
└── README.md             # Project documentation (this file)
```
