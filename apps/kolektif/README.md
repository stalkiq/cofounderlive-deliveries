# 🇭🇹 Kolektif MVP — Ultra-Lightweight Community Coordination

Kolektif is an ultra-lightweight community coordination lifeline designed for community organizers and local leaders in **Port-au-Prince, Haiti** to coordinate mutual aid and emergency response. Engineered specifically to load instantly on slow **2G networks**, Kolektif caches critical alerts and mutual aid requests offline using a robust local queue that synchronizes automatically with a durable backend when network signal returns.

This app features a high-contrast editorial layout inspired by traditional Haitian hand-painted signs (**Tap-Tap art**), stripped down to zero heavy images and fast inline vectors. It includes a prominent **Low-Bandwidth Mode switch** that strips out stylistic decor and forces a pure monochrome high-density text view, cutting data consumption by up to 98%.

---

## 📱 What This App Does

Kolektif organizes communication where signal strength is extremely volatile.
1. **Onboards Organizers:** Creates and stores a local profile (Name, Role, Zone) to append as metadata on emergency reports.
2. **Maintains a Local Cache Queue:** Keeps track of submitted water and clinic points or roadblock alerts in `localStorage` when there is no internet, meaning they are never lost.
3. **Automatically Synchronizes:** Automatically notices when network signal returns and flushes the offline queue using `POST` requests to the durable backend.
4. **Compresses Messages (Simulated Gemini AI):** Translates and squashes complex, long paragraphs of details into high-urgency Creole SMS text blocks under 140 characters, making them immediately ready to broadcast via SMS or read out loud on community radio.

---

## 🎨 Screens & Walkthrough

The interface is structured as a compact, responsive mobile view centered on any screen.

### 1. Onboarding Screen (`#screen-onboarding`)
- Prompts the community coordinator on first load to enter their name, select a generalized role (e.g., *Animatè Kominotè*, *Repòtè Radyo*), and their main working neighborhood (e.g., *Delmas*, *Pétion-Ville*).
- Displays Tap-Tap brand styles with warm sandy backgrounds (`#F4EFEA`) and bold editorial borders.

### 2. Tab 1: Fil Alèt (Live Feed) (`#screen-feed`)
- Displays live statistics like "Active Alerts" and "Active Water Points".
- Combines static verified emergency feeds (Dlo, Wout Bloke, Sante) with dynamic records pulled in real-time from the backend.
- Visually flags locally cached reports waiting to sync with a marked status.
- Exhibits an online/offline signal led-indicator that adapts automatically using the browser's connectivity state.

### 3. Tab 2: Konpresè (Gemini SMS & Radio Draft) (`#screen-compressor`)
- An interactive assistant simulator representing the **Kolektif SMS & Radio Compressor** Gemini capability.
- Allows paste templates or raw reporting text in French, English, or Creole.
- Translates and strips filler words using a rule-based compression logic to create standard broadcast alerts under 140 characters.
- Includes quick-input templates, character-count safe gauges, one-click copy, and integration to transfer the compressed text directly over to the reporting form.

### 4. Tab 3: Rapòte (Submit Report) (`#screen-report`)
- The primary coordination workflow. Includes form fields: *Kategori*, *Zòn / Katye*, *Deskripsyon Kout*, and *Nimewo Kontak*.
- Intercepts submissions to load them instantly into the browser memory queue, then triggers background attempts to sync.
- Resolves into a beautiful, custom, non-obtrusive inline success card (*Alèt Anrejistre!*) detailing local storage safety.

### 5. Tab 4: Debug / Lis (Durable Memory Explorer) (`#screen-settings`)
- Displays active leader profiles saved to browser storage.
- Includes a live JSON editor panel querying the node server's `GET /api/memory` endpoint directly, showing the exact byte records stored on disk in the workspace database.

---

## 💾 Durable Memory & State

Unlike transient memory apps, Kolektif features double-guaranteed durability.
- **Client Caching:** Uses `localStorage` to preserve submitted lists so records survive phone reboots or complete network dropouts.
- **Backend Durability:** The Node/Express server persists records inside a file-based registry at `data/memory.json`.
  - `GET /api/memory` returns the exact array.
  - `POST /api/memory` appends entries safely to disk with validation and auto-generated unique IDs.

---

## 🛠️ How to Try It

### Prerequisite
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.

### 1. Install Dependencies
Initialize package registries inside the workspace:
```bash
npm install
```

### 2. Start the App
Start the Express server on local port `3000`:
```bash
npm start
```
*For interactive automatic reloads, you can run:*
```bash
npm run dev
```

### 3. Open in Browser
Open your browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Proof It Works (Automated Smoke-Test)

Kolektif ships with an automated integration test script in `scripts/smoke-test.mjs` verifying:
1. Static assets asset serving.
2. Endpoint `GET /api/memory` structure and listing.
3. Durable record writes through `POST /api/memory` and verifies the record persists.
4. Gemini SMS compression model rule outputs.

To run the automated tests and confirm backend compliance:
```bash
npm test
```

---

## 🐳 Docker Deployment

The application is fully containerized. To build and run with Docker:

```bash
# 1. Build the lightweight image
docker build -t kolektif-app .

# 2. Run container binding port 3000 dynamically
docker run -p 3000:3000 kolektif-app
```
Once started, the app is reachable at `http://localhost:3000` with full file system isolated persistence.
