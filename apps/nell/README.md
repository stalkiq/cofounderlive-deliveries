# 📖 Nell — The Living Socratic Primer

Nell is a digital "living book" tutoring application inspired by Neal Stephenson's sci-fi masterpiece, *The Diamond Age*. Designed for tech-forward parents and progressive educators, Nell molds itself recursively around a child's questions, interests, milestones, and challenges, providing a bespoke Socratic tutor at consumer scale.

This project delivers a complete, deployable Node.js + Express application featuring resilient/durable state synchronization, dual-pane dialogue spaces, parental context seeding workshop interfaces, and an elegant, gold-and-green leather-bound aesthetic.

---

## ✨ Features and Architecture

```
                                    +-----------------------+
                                    |     Parent Portal     |
                                    | (Inscribe New Context)|
                                    +-----------+-----------+
                                                |
                                                v
+-----------------------+           +-----------+-----------+           +-----------------------+
|                       |           |   Durable JSON Memory  |           |                       |
|   Socratic Dialogue   | <=======> |      (data/db.json)   | <=======> |   Ledger of Wisdom    |
|   (The Living Book)   |           +-----------+-----------+           |  (Milestone Timeline) |
|                       |                       |                       |                       |
+-----------------------+                       v                       +-----------------------+
                                    +-----------+-----------+
                                    |  Socratic GPT/Gemini  |
                                    | (Simulated / Live API)|
                                    +-----------------------+
```

### 🧠 Core Workflows & Memory System
1. **The Primer (The Living Parchment):**
   * **Left Pane (Interactive Dialogue):** A Chat interface where the child talks with Nell. Nell guides them with patience and storytelling to solve logical, mathematical, or ethical riddles.
   * **Right Pane (Active Inquiries):** A real-time updating list of active inquiries and prompt statuses (e.g. division, shadow length physics, Socratic logic). Includes a solver tool for quick evaluation!
2. **The Ledger (Ledger of Wisdom):**
   * A chronological record detailing child accomplishments, moral growth (e.g. sharing bread, choosing fairness), and conceptual developments.
   * Parents can manually log customized moral breakthroughs that are immediately preserved inside history!
3. **Inscribe (The Parent's Workshop):**
   * This is where parents seed Nell with the child's **current interests**, **target cognitive skill-sets**, and **real-world obstacles** (e.g., *Socratic Logic & Cause-Effect*, *sharing a new toy with a younger sibling*).
   * Submitting this dynamically adapts active chapters, introduces a magical story transitioning event in Nell's dialogue, and alters Socratic guidelines.

---

## 🛠️ API Documentation (POST / GET Memory)

Nell utilizes a robust, durable file-system-based storage synced under `data/db.json` which persists through container restarts and updates.

### `GET /api/state`
Returns the complete database payload containing current inscribed parent logs, the Socratic dialogue transcript, recorded cognitive/moral breakthroughs, open academic challenges, and operational metrics.

### `POST /api/inscribe`
Saves new parent context inputs recursively adapting Nell's focus.
* **Request Body:**
  ```json
  {
    "interest": "Dinosaur fossils",
    "skill": "Phonics & Spatial Reasoning",
    "challenge": "fear of the dark"
  }
  ```

### `POST /api/primer/message`
Processes the child's input, updates indices, triggers the Socratic engine, saves Nell's response, and updates metrics.
* **Request Body:**
  ```json
  {
    "message": "I think the heavier gear will pull the lighter gear upwards on the other side of the scale!"
  }
  ```

### `POST /api/milestones`
Allows parents or teachers to log specialized development choice alerts.
* **Request Body:**
  ```json
  {
    "title": "Division of the Toy Ship",
    "detail": "Decided to divisionally share the clockwork blocks by taking turns on alternating hours.",
    "meta": "Evening playtime"
  }
  ```

### `POST /api/inquiries/solve`
Resolves an open Socratic inquiry with a targeted answer.
* **Request Body:**
  ```json
  {
    "id": "inq-12345",
    "value": "Because gravity pulls water downwards, rotating the wheel paddles."
  }
  ```

### `POST /api/primer/reset`
Wipes the workspace, returning the Primer to pristine, factory default state.

---

## 🚀 Getting Started

### 📋 Prerequisites
* [Node.js](https://nodejs.org/en) (v18 or higher recommended)
* Optional: [Docker](https://www.docker.com/)

### 1️⃣ Run Locally with Node.js
Copy the environment variables template and configure your port/keys:
```bash
cp .env.example .env
```
*(If `GEMINI_API_KEY` is omitted, Nell utilizes an elegant, contextual fallback rules-engine to simulate conversational dialogues instantly so the app works beautifully out of the box!).*

Install dependencies and start the app:
```bash
npm install
npm start
```
Open your browser and navigate to: **`http://localhost:3000`**

---

## 🐳 Docker Deployment

To build and launch the application seamlessly inside a standardized sandbox:

### Build the Image
```bash
docker build -t nell-primer .
```

### Run the Container (Synchronizing Persistent Memory)
To ensure the living book keeps its memories safe, mount a volume mapping `data/` to your host computer:
```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/usr/src/app/data \
  --name nell-living-book \
  nell-primer
```

### Run the Container With Live Gemini Capabilities
You can pass your API key securely into the runtime context:
```bash
docker run -d \
  -p 3000:3000 \
  -e GEMINI_API_KEY="your_api_key_here" \
  -v $(pwd)/data:/usr/src/app/data \
  --name nell-living-book \
  nell-primer
```
📖 *Your living book is now active! Open `http://localhost:3000` to begin.*
