# Rind — Metabolic Satiety Engine 🍊

> **METABOLIC SATIETY ENGINE**  
> *"Weight loss through food abundance, not restriction."*

Rind is a premium digital weight loss application designed as a high-end, editorial culinary magazine. Instead of pushing dieters into starvation states, Rind leverages deep volumetric satiety science (high fiber, cell-hydration, and protein density) to expand stomach stretch receptors, activate GLP-1 satiety hormones, and permanently crowd out ultra-processed food cravings.

---

## 📖 Key Architectural Screens

Rind is executed as a responsive, polished mobile application experience featuring elegant serif typography, generous whitespace, and sharp element radiuses:

1. **The Abundance Assessment (Onboarding & Evaluation Area)**  
   Calculate your baseline metabolic satiety profile. Includes custom HTML5 canvas **Metabolic hunger geometry** that morphs interactively from a sharp jagged starvation-star into a smooth circular concentric "Rind" loop as users optimize dietary fibers.
2. **Culinary Satiety Planner (The Satiety Engine)**  
   Input active cravings or ingredients to generate highly-detailed culinary recipes with specific macronutrient targets, vagus-stretch mechanisms, and Masterclass instructions. Persists and reloads past generated profiles directly from backend storage.
3. **The Abundant Table (Editorial Library, Settings, & Ledger History)**  
   Reads premium, magazine-grade structural food guides (e.g. *Charred Romanesco*, *Slow-Roasted Salmon*, *Science of Volumetrics*) and provides quick-access toggles to inspect saved history logs, edit baseline fiber goals, or reset database states.

---

## 💾 Durable Memory & API Design

To provide unbreakable state-handling, all assessments, meal formulas, and engine settings are recorded directly to a local file database on your backend: `/data/memory.json`.

### Endpoints
* **`GET /api/memory`**: Fetches the structured JSON containing all saved assessments, plans, and config settings:
```json
{
  "success": true,
  "data": {
    "assessments": [...],
    "plans": [...],
    "config": {
      "dailyFiberGoal": 30
    }
  }
}
```
* **`POST /api/memory`**: Appends or stores records safely into durable storage:
  * Body: `{ type: "assessment" | "recipe" | "config", payload: { ... } }`
* **`GET /api/status`**: Yields operational diagnostic telemetry, node specifications and whether Gemini API systems are actively connected.
* **`POST /api/satiety-plan`**: Triggers the custom Satiety nutritionist generation system.
  * Deep-integration with Gemini (`gemini-1.5-flash`) using user dietary struggles and raw ingredients.
  * If no `GEMINI_API_KEY` is present, it auto-reverts to a premium, high-integrity rule-based expert parser that synthesizes pristine editorial satiety cards offline. No failures.

---

## 🚀 How to Try It

### 1. Installation
Rind is lightweight and contains zero external compilation steps.

```bash
# Clone or navigate to the directory
cd rind-satiety-engine

# Install dependencies Node-side
npm install
```

### 2. Connect Gemini (Optional)
If you want live Gemini AI response generation:
```bash
export GEMINI_API_KEY="your_actual_key_here"
```
*(If omitted, Rind operates beautifully on its multi-faceted expert rule database).*

### 3. Launching Server
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** inside your browser of choice to begin planning whole-food abundance.

---

## ⚖ Proof It Works — Automated Smoke Testing

Rind comes with a fully customized, asynchronous smoke test that validates all core features, routes, and JSON layouts on a mock port, then safely turns down.

Run the test suite using:
```bash
npm run smoke-test
```

### Sample Output Log:
```txt
[SMOKE-TEST] Starting Rind Satiety Engine Smoke Tests...
[SMOKE-TEST] Backend launched successfully!
[SMOKE-TEST] Pinging Home static client...
[SMOKE-TEST] ✓ Homepage fetched successfully (200 OK).
[SMOKE-TEST] Pinging /api/status...
[SMOKE-TEST] ✓ API Status is healthy. Gemini connection state reported as: false
[SMOKE-TEST] Pinging POST /api/memory (Submitting assessment)...
[SMOKE-TEST] ✓ POST /api/memory recorded profile successfully. Saved ID: rec_9f8sja2
[SMOKE-TEST] Pinging GET /api/memory (Verifying persistence logic)...
...
[SMOKE-TEST] ✓ GET /api/memory state persistence logic confirmed.
[SMOKE-TEST] Pinging POST /api/satiety-plan (Requesting custom recipes)...
[SMOKE-TEST] ✓ POST /api/satiety-plan output: "Charred Romanesco Wedge with Basil Sesame Gremolata" with rating "9.5 Satiety Rating"
[SMOKE-TEST] ======================================
[SMOKE-TEST]  ALL RIND METABOLIC ENGINE SMOKE TESTS PASSED 
[SMOKE-TEST] ======================================
[SMOKE-TEST] Tearing down testing Express instance...
```
