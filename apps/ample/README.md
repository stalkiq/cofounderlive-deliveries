# 🍽️ Ample — The Satiety-First Plate Builder

> **The Anti-Diet Plate Builder.** No shame. No counting. Just satisfying, hearth-cooked plates in one click.

---

## 🌟 What This App Does

**Ample** is a mindful, shame-free meal-designing app created for individuals seeking to support weight-health without the exhausting psychological toll of diet cultures, calorie counting, or macro tracking. 

Built around the concept of a **"Warm Hearth,"** the app acts as an empathetic digital culinary guide. Users tell Ample what they are craving (e.g., *"warm pasta"*, *"something spicy"*) and rate their current level of hunger. The engine immediately scales a beautiful, high-volume plate template using a **satiety-first portion ratio** (50% highly satiating fibers/vegetables, 25% plant/animal proteins, and 25% slow-burning energy grains). 

To honor the **Founder's specific request**, the visual motif has been crafted using a gorgeous, cozy **Dark Blue Hearth theme** with glowing crimson embers and amber highlights, evoking the soothing feel of a quiet evening kitchen.

---

## 🎨 Visual Adaptation: Cozy Dark Blue Hearth

Responding directly to the founder request to **“make the app dark blue,”** we updated the visual design. Instead of standard oatmeal white, Ample features:
* **Deep Space Navy `#0B111E`** for high-contrast, comfortable nighttime browsing.
* **Warm Slate Surface `#151D2A` and `#1F2A3C`** cards that soften background transitions.
* **Hearth Red Clay `#A63A2B` & Amber Ember `#E07A5F`** for active glowing buttons, indicators, and labels, preserving the comforting glow of a red-brick kitchen.
* **Vocal Typography & Rounded Soft Corners** which make elements feel rounded, organic, editorial, and tactile.

---

## 📱 Product Screens & Walkthrough

Ample is designed with **four highly interactive, beautiful screens** accessible via a responsive mobile bottom navigation bar:

### 1. Welcome Desk (Onboarding & Google Link)
* **What it does:** Bypasses tedious registration delays of conventional tracking apps in under **3 seconds**.
* **Features:** Contains a beautiful **Google One-Tap / Sign-In** button simulation. Clicking it instantly authorizes the session, links the user profile, changes status indicators, and directs them into the active workflow.

### 2. Hearthside Plate Planner (Main Workflow Form)
* **What it does:** Generates custom-balanced satiety structures without calculations.
* **Features:** 
  - **One-Click Scaling Presets:** Instantly select `Peckish` (Satiety 6/10), `Ready` (Satiety 8/10), or `Starving` (Satiety 10/10) to automatically scale satiety structures.
  - **Custom Builder Form:** Input specific custom cravings, select hunger intensity levels, and define meal goals (e.g. *Warm & Comforting*, *Fresh & Energizing*). 
  - **Trigger Button:** "Build My Plate" dynamically calls the durable backend database and compiles a satisfying culinary proposal.

### 3. The Hearth Assistant (Active Satiety Canvas)
* **What it does:** Renders a gorgeous, custom visual representation of your plate composition.
* **Features:**
  - **Visual Portion Wheel Widget:** A beautiful CSS pie-graph representing exact plate guidelines dynamically (e.g., 50% Volume, 25% Protein, 25% energy grains) updated with customized food item strings.
  - **Empathetic AI serving advice:** Gives structured recipe directions detailing how to satisfy hunger without calorie details.

### 4. Settings & Diary (History)
* **What it does:** Displays past recipes with zero-weight guilt, alongside account settings.
* **Features:**
  - **Persistent Meal Diary:** Lists previous plates fetched directly via `GET /api/memory` from durable JSON filesystem memory.
  - **High-Fidelity Inspect Option:** Clicking on any historical log item in the diary immediately **re-loads** that specific configuration onto the visual circle wheel card of Screen 3 (The Hearth Assistant)!
  - **Kitchen Preferences Form:** Configure nickname, favorite food evocations, and preference profiles saved via POST to the backend.

---

## 💾 Durable Memory & Server Endpoints

Ample maintains its states durably on disk inside `data/memory.json` across server restarts. It features:

* **`GET /api/memory`**: Fetches the complete chronological history of generated plates, sorted with the newest creations first.
* **`POST /api/memory`**: Submits user craving, hunger scale, and style goals. Passes it to the satiety engine which dynamically formats an empathetic nutritional proposal and appends it to the disk file database.
* **`GET /api/settings`** and **`POST /api/settings`**: Retrieves and updates user food configurations.

---

## ⚙️ How to Try It Local

### Prerequisites
* Ensure you have [Node.js](https://nodejs.org) (v18 or higher) installed.

### 1. Install & Boot the App
Extract code or open a terminal inside the workspace and run:
```bash
# Install core express package
npm install

# Start the local development web server
npm start
```

Once running, navigate your web browser to: **`http://localhost:3000`**

### 2. Run CI/CD Smoke Tests
Validate full system conformance and database durability functions with:
```bash
npm run smoke/test
```

---

## 🐳 Docker Deployment

The system is fully containerized for cloud deployment. To deploy via Docker:

```bash
# Build the production docker image
docker build -t ample-plate-builder .

# Run the container locally mapping standard port 3000
docker run -p 3000:3000 ample-plate-builder
```

---

## 🧪 Proof It Works (Smoke Test Logs)

Executing `npm run smoke/test` automatically starts the server, executes rigorous validation rules against the persistent memory architecture, and tearsoff cleanly.

Sample of typical passing logs:
```text
====================================================
🚀 Starting Ample Smoke Test suite...
📂 Project directory: /usr/src/app
====================================================
⌛ Waiting 2.5s for server to start...
=============== SERVER LOGS ===============
Ample Plate Builder successfully active!
Listening at: http://localhost:3000
Cozy Dark Blue Design Mode is active.
===========================================

🧪 Test 1: Fetching plate history (GET /api/memory)...
✅ GET /api/memory response is ok. List length: 2
✅ Seeded elements discovered successfully in database memory.

🧪 Test 2: Generating a custom comfort plate (POST /api/memory)...
✅ Created Plate Response Details:
   - Title: "Hearthside Smoky seasoned baked tofu Harvest Plate"
   - Craving match: "smoky seasoned baked tofu"
   - Calculated Satiety: "10/10 Max Volume"
   - Grains Portion: "A solid 1/4-plate of cozy honey-roasted butternut squash cubes and steamed tri-color quinoa"
✅ Generative parser successfully integrated custom cravings.

🧪 Test 3: Re-fetching history to guarantee persistent durable state (GET /api/memory)...
✅ History list now contains: 3 dishes.
✅ Durability persistence confirmed: Plate added in line order correctly.

🧪 Test 4: Accessing user preferences API (GET /api/settings)...
✅ Preferences retrieved are correct. App Theme flag: "Dark Blue Hearth"

🎉 ALL SMOKE TESTS COMPLETED SUCCESSFULLY! No errors detected.

🛑 Stopping server process...
👋 Smoke test finished.
```
