# Nell — The Living Socratic Primer
> **"The living book that teaches your child how to think."**

Inspired by the interactive educational masterpiece in Neal Stephenson's *The Diamond Age*, **Nell** is an intellectual heirloom in software form. Nell goes beyond facts and spelling drills—she engages children in active, open-ended **Socratic Dialogue** wrapped inside fantasy fairy tales to cultivate reasoning, scientific inquiry, critical logic, and ethical boundaries.

This directory comprises a fully completed, deployable **Node.js/Express** workspace providing durable state representation, a magical medieval responsive UI, and actual **Google Gemini AI Integration** with robust local fallback capabilities.

---

## ✦ Key Architectural Features

1. **Durable Backend Memory**:
   - Fully local file-based database engine (`src/db.js`) persisting state to `data/db.json`. 
   - State variables are conserved strictly across application reboots or container redeployments (via container volumes).

2. **The Living Parchment Web UI (`public/`)**:
   - Styled perfectly to match the brand identity: blackboard-green backgrounds (`#121612`), deep sage surfaces (`#1C221C`), gold-leaf filigree accents (`#D4AF37`), and classic serif literature typography (`Cinzel`, `EB Garamond`).
   - Includes real-time Socratic Dialogue feedback, interactive active inquires tracker, and a parent's Scriptorium dashboard.

3. **Hybrid Socratic Reasoning (Nell Engine)**:
   - **Gemini Engine Integration**: When a `GEMINI_API_KEY` is provided, Nell coordinates fully conversational, context-aware storytelling and response grading.
   - **Premium Local Fallback**: When offline or run without a key, a highly sophisticated local rules-engine serves customized, thematic scenarios according to parent inscriptions, evaluating kid inputs for breakthroughs using logical grammar heurism.

---

## 📘 Core Workflow Screen Guides

* **The Primer Tab**: The primary interface for kids. Engage in dialogue with Nell on the left; track active division, logic, or spatial puzzles on the right.
* **The Ledger of Wisdom**: Chronological logbook of intellectual milestones, empathetic breakthroughs, and concepts mastered, populated live based on Socratic responses. Includes live statistics indicators.
* **Inscribe Tab**: The parent dashboard. Direct Nell's narrative trajectory by defining current real-world obsessions (e.g. *dinosaurs*), target educational skills (e.g. *Fractional Division*), and brother/sister challenges.

---

## 📡 API Endpoints (POST / GET Memory)

| Endpoint | Method | Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/state` | **GET** | *None* | Fetches full, durable database state (current chapter, statistics, chats list, active logical inquiries, ledger timeline). |
| `/api/inscribe` | **POST** | `{"interest": "...", "cognitiveSkill": "...", "milestone": "..."}` | **Parent Control Core Workflow.** Directs Nell to weave a new chapter and dialog. Resets the Socratic chat to start the generated tale. |
| `/api/dialogue/respond`| **POST** | `{"message": "..."}` | **Socratic Response Core Workflow.** Submits child feedback. Runs evaluation for breakthroughs, saves state, and yields follow-up questions from Nell. |
| `/api/reset` | **POST** | *None* | Overwrites backend database with original initial sandbox data values specified in `product-spec.json` for easy user sandboxing. |

---

## 🛠 Setup & Run Instructions

Ensure [Node.js (v18+)](https://nodejs.org/) or [Docker](https://www.docker.com/) is installed.

### 1. Local Development
Install dependencies and initiate the local server:
```bash
# Install NPM modules (Express, CORS, Dotenv, @google/generative-ai)
npm install

# Start the application
npm start
```
Access the application locally at **[http://localhost:3000](http://localhost:3000)**.

### 2. Using Google Gemini AI Capabilities
To unlock true AI-powered Socratic Storytelling, add your Gemini API Key. Use an `.env` file in the root workspace, or export it in your bash environment:
```bash
# Create .env file content
GEMINI_API_KEY=AIzaSy...your_gemini_key_here...

# Run the server which reads environmental configs
npm start
```

### 3. Docker Deployment
A secure, minimal Alpine-based Dockerfile is cooked in with volume mappings:

```bash
# Build the Docker image
docker build -t nell-primer .

# Start the container with durable storage volume mapping
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name nell-living-primer \
  nell-primer
```
Mapping `-v $(pwd)/data:/app/data` ensures your dialogue logs, parent inscriptions, and milestones survive container restarts.

---

## 📁 Workspace Contents

```
├── Dockerfile                  # Secure minimal Alpine container assembly instructions
├── README.md                   # This instruction documentation
├── package.json                # Project dependency requirements
├── server.js                   # Express server config and core REST memory route endpoints
├── product-spec.json           # Initial product instructions and palettes spec
├── data/
│   └── db.json                 # Durable JSON-based flat file database storage
├── src/
│   ├── db.js                   # Local file database wrapper & original seed state
│   └── nell-engine.js          # Socratic conversational storyteller and heurism evaluation engine
└── public/
    ├── index.html              # Medieval layout comprising tabs, panels and chat logs
    ├── style.css               # Vintage gold-leaf serif typography and layout styles
    └── app.js                  # Frontend interface controller and API bridge
```

---

*Made with ✦ and ink-stained gold-leaf parchment on Cofounder Live.*
