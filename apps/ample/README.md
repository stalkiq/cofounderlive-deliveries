# 🪵 Ample — Satiety-First, Shame-Free Plate Planner

Welcome to **Ample**! Built on the **Warm Hearth** motif specifically designed for overweight people or busy adults tired of guilt-tripping diet apps who want a friction-free way to plan satisfying, nourishing weight-conscious meals. 

Ample is an **Anti-Diet Plate Builder**: no calorie tracking, no protein/carb counting, and absolutely no shame. Users simply tap or speak their hunger levels or raw pantry cravings, and our empathy-first assistant scales delicious, high-volume plates emphasizing proteins and fiber.

---

## 🌟 What This App Does

1. **Shame-Free Satiety Planning**: Completely avoids numbers. Instead, builds proportional visual plates (e.g. 50% fiber-rich volume, 25% protein, 25% healthy whole grain carbs).
2. **Google OAuth Simulation**: Features a mock secure One-Tap authentication. Linking Google bypasses friction and loads customized preferences instantly.
3. **Dual-Model Plate Generator**:
   - **Local Heuristics Engine**: Instantly generates rich, cozy culinary suggestions themed on cravings and hunger level even without configuration.
   - **Gemini AI Integration**: If optional `GEMINI_API_KEY` is provided, contacts the core `gemini-2.5-flash` model using our empathetic, nourishing home-cooked food instructor system instructions.
4. **Durable Ledger Store**: Saves plates dynamically inside server JSON store (`data/memory.json`). You can add, load, view, and clear dishes.

---

## 📱 Interactive Screens

Our experience utilizes a responsive **Mobile Dashboard Bottom Navigation** container layout mimicking a premium native cellular utility:

*   **🏡 Welcome & Onboarding Screen**: Explains philosophy, features metrics (3s Onboarding, No Calorie Focusing), and houses the Google secure auth sign-in button.
*   **⚡ One-Click Plan Screen**: Scale foods instantly based on physical state. Simple buttons (**Peckish**, **Ready to Eat**, or **Starving**) immediately compute appropriate satiety levels and record them in the database ledger.
*   **🍳 Hearth Assistant Screen**: Input exactly what you're craving (e.g. *pasta*, *warm chicken*, *salad*, *stew*). The assistant visualizes your food on a 10" plate and displays instructions.
*   **📖 Journal Log & Settings Screen**: Views your persistent food log stream, displays culinary average metrics, allows removing log entries, and toggles custom modes (e.g. Anti-Diet toggle & Hearth Voice ambiance).

---

## ⚙️ How to Try It

Ample is clean, modular, and does not require complex database links.

### Option A: Local Run (Fastest)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run Server**:
   ```bash
   npm start
   ```

3. **Open browser**:
   Go to **[http://localhost:3000](http://localhost:3000)** and interact with the physical plate planner!

---

## 💾 Durable Memory Endpoints

Persistence is backed by a fully local, clean JSON transaction database located at `data/memory.json`. 

*   **`GET /api/memory`**: Checks and loads previous meal log records. Returns pre-seeded dishes on very first run to populate the journal automatically.
*   **`POST /api/memory`**: Takes `craving`, `hungerLevel`, and `primaryGoal` coordinates. Triggers Gemini or heuristic processor, prepends result to ledger, and persists record permanently on disk.
*   **`DELETE /api/memory/:id`**: Removes record and updates journal stream.

---

## 🚢 Docker Container Release

We have included a production-ready alpine-weight `Dockerfile`. To containerize and ship:

```bash
# 1. Build image
docker build -t ample-hearth .

# 2. Spin container on host port 8080
docker run -p 8080:3000 ample-hearth
```

---

## 🧪 Proof It Works (Smoke Tests)

We provide an automated testing suite at `scripts/smoke-test.mjs` verifying backend connections, post creation, heuristic parsing, and record deletion.

Run verification suite:
```bash
npm test
```

### Healthy Execution Output Trace:
```text
🧪 Running verification suite...
-----------------------------------------
🔹 Test 1: Fetching initial memory list (GET /api/memory)...
Response Code: 200
✅ Success! Seed items found: 2 records.
   First item: "Slow-Simmered Tomato & White Bean Stew" (Score: 9.5/10)
-----------------------------------------
🔹 Test 2: Creating a custom Satiety Plate (POST /api/memory)...
Response Code: 201
✅ Success! Plate built and persisted into durable memory.
   Generated Title: "Hearthside Sweet Tomato & Herb Pasta Platter"
   Generated Detail: "nearly 2/3 plate stacked high with tender steamed greens, garden bell peppers... "
   Assigned ID: meal_1710928472911
-----------------------------------------
🔹 Test 3: Checking if new record is inside GET list...
✅ Success! New plate verified inside DB.
-----------------------------------------
🔹 Test 4: Removing test plate (DELETE /api/memory/meal_1710928472911)...
Response Code: 200
✅ Success! Test plate cleanly cleaned from durable memory file.
-----------------------------------------

🎉 ALL SMOKE TESTS COMPLETED SUCCESSFULLY! Ample is ready for deployment. 🔥
```
