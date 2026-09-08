# Kinward: Privacy-First Eldercare Ring Shield 🛡️👵
> **Dignity for parents. Peace of mind for you.**

Kinward is a privacy-respecting caregiving portal designed for Gen X caregivers managing the safety and independence of aging parents. Instead of subjecting parents to invasive, uncomfortable raw video surveillance inside their homes, Kinward connects to standard Ring home cameras or doorbell sensors, intercepts telemetry and doorbell logs, and translates them into ambient, frosted silhouette heatmaps and comforting, natural-language daily updates.

---

## 📖 Table of Contents
1. [What This App Does](#-what-this-app-does)
2. [Interface & Screens](#-interface--screens)
3. [Durable Backend Memory](#-durable-backend-memory)
4. [How to Try It](#-how-to-try-it)
5. [Proof It Works (Automated Smoke Tests)](#-proof-it-works)
6. [Docker Standalone Deployment](#-docker-deployment)

---

## 🌟 What This App Does
- **Intercepts Raw Feeds:** Represents an intervention layer between actual Ring streams and caregiver eyes.
- **Applies Client-Side Backdrop Lenses:** Renders real-time silhouettes using CSS backdrop filters to blur features and maintain parental privacy.
- **Simulates Telemetry Events:** Features interactive triggers simulating kitchen movements, doorbell activities, and resting armchair triggers.
- **Translates Activity with Gemini:** A simulated AI Care Assistant interprets telemetry events into friendly summaries, confirming that Mom/Dad is safe and on-schedule.
- **Speaks Hands-Free Updates (TTS):** Leverages Web Speech Synthesis so caregivers can play hands-free audio digests during commutes or busy work segments.

---

## 📱 Interface & Screens
Kinward uses an SPA pattern wrapped in a mobile simulator frame.

1. **Onboarding Screen (`Onboarding`)**
   - Welcomes the caregiver.
   - Sets caregiver and parent names to customize all analysis profiles.
   - Contrasts the privacy risk of raw camera feeds side-by-side with Kinward's protective filtered ambient lenses.

2. **Main Configuration Workflow Screen (`Shield Config`)**
   - Standard field inputs mapping the MVP spec parameters:
     - **Ring Device Name:** Allows identifying camera rooms.
     - **Privacy Filter Level:** Toggles between *Frosted Glass (High Privacy)*, *Ambient Heatmap (Medium Privacy)*, or *Motion Only (Maximum Privacy)*.
     - **Daily Monitoring Window:** Set 24h, Daytime, or Nighttime monitoring parameters.
     - **Caregiver Notification Trigger:** Fine-tune alerts matching deviations or digests.
   - **Interactive Live Lens Simulator:** Features a simulated parent moving around in the background while users click lens toggles (Frosted, Heatmap, Motion) to see the glassmorphic rendering overlay update dynamically.

3. **Privacy-Filtered Timeline Screen (`Timeline`)**
   - Renders state indicators: *Shield Status* and *Routine Match*.
   - Includes the **Interactive Ring Simulator** which lets users generate new motion alerts across sensors.
   - Dynamically appends real-time events translated into friendly language logs.

4. **Care Assistant Screen (`AI Assistant`)**
   - **Ambient Pattern Analyzer:** Synthesizes multiple sensor entries into single paragraphs emphasizing safety and routine.
   - **Reassurance Voice Briefing:** Text-to-speech speaker box playing audio updates with active CSS waveform visualizers animating while the speaker runs.

---

## 💾 Durable Backend Memory
All configurations, telemetry configurations, and AI summaries are read and durably written to a filesystem database located at `data/memory.json`.

### Endpoints Supported:
- **`GET /api/memory`**
  Returns the complete active state configuration, history lists, and profile parameters.
- **`POST /api/memory`**
  Handles client input streams. Expects body schema:
  ```json
  {
    "type": "configuration" | "event" | "summary" | "onboarding",
    "payload": { ... }
  }
  ```
  Writes updates durably and returns `201 Created` with the newly integrated data block.
- **`POST /api/ai-analyze`**
  Core simulated Gemini analysis engine. Dynamically parses all loaded timeline logs, injects custom LLM roles emphasizing parental dignity, produces summaries, writes them durably to database archives, and returns reports as JSON payloads.

---

## 🚀 How to Try It

### Prerequisites
- Node.js (version 18 or above loaded)
- npm

### 1. Install Dependencies
Navigate to the root project workspace path and install dependencies:
```bash
npm install
```

### 2. Run Locally
Boot the Kinward Express local application environment:
```bash
npm start
```
*The app is active and accessible via browser at [http://localhost:3000](http://localhost:3000).*

---

## 🧪 Proof It Works
The suite includes an automated smoke test testing backend services, assets, API endpoints, and database interactions.

Run the test suite using:
```bash
npm test
```

### Expected Output Console Logs on Success:
```text
=== KINWARD CARE PORTAL: RUNNING SYSTEM SMOKE TEST ===
[Spawn] Starting Express server on port 3001...
[Test 1] Requesting index.html static asset...
✅ Success: Index page loaded correctly.
[Test 2] Testing database bootstrap at GET /api/memory...
✅ Success: Memory database retrieved. Loaded 2 camera configurations.
[Test 3] Testing POST /api/memory write configuration durability...
✅ Success: New camera config durably written and re-read from root memory file store.
[Test 4] Testing Gemini simulated pattern analyzer endpoint...
✅ Success: Pattern analyzer successfully synthesized and durably archived the latest status report.
[Shutdown] Shutting down active server...

⭐️ ALL SERVICES OPERATE CORRECTLY. SMOKE TEST PASSED!
```

---

## 🐳 Standalone Docker Deployment
You can also package Kinward inside containers using standard operations:

### 1. Build Image
```bash
docker build -t kinward-app .
```

### 2. Launch Container
```bash
docker run -p 3000:3000 --name kinward-portal kinward-app
```
*Navigate to [http://localhost:3000](http://localhost:3000) to view the containerized portal.*
