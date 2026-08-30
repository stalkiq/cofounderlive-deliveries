import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path to durable memory storage
const MEMORY_FILE = path.join(__dirname, 'data', 'memory.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(MEMORY_FILE))) {
  fs.mkdirSync(path.dirname(MEMORY_FILE), { recursive: true });
}

// Pre-seeded meals matching product spec
const DEFAULT_PLATES = [
  {
    id: "seed-1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    craving: "warm stew",
    hungerLevel: "Ready for a full meal",
    primaryGoal: "Warm & comforting",
    plateTitle: "Slow-Simmered Tomato & White Bean Stew",
    plateDetail: "1/2 plate of rich tomato-herb broth & wilted garden greens, 1/4 plate creamy wood-fired white beans, 1/4 plate toasted artisan sourdough with a drizzle of cold-pressed olive oil.",
    satietyScore: "9.5/10",
    status: "Balanced",
    user: {
      name: "Morgan Hearth",
      email: "morgan@hearthside.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
    }
  },
  {
    id: "seed-2",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // yesterday
    craving: "crunchy fresh bowl",
    hungerLevel: "Extremely hungry (need high volume)",
    primaryGoal: "Fresh & energizing",
    plateTitle: "Roasted Red Pepper & Lentil Bowl",
    plateDetail: "Generous bed (1/2 plate) of wood-roasted peppers, zucchini, and baby spinach, topped with warmed spiced brown lentils (1/4 plate) and a dollop of creamy garlic tahini and fresh dill (1/4 plate).",
    satietyScore: "9/10",
    status: "Comforting",
    user: {
      name: "Morgan Hearth",
      email: "morgan@hearthside.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
    }
  }
];

// Helper to read memory
function readMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(DEFAULT_PLATES, null, 2));
      return DEFAULT_PLATES;
    }
    const data = fs.readFileSync(MEMORY_FILE, 'utf8');
    if (!data.trim()) {
      return DEFAULT_PLATES;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading memory file, using defaults:", err);
    return DEFAULT_PLATES;
  }
}

// Helper to write memory
function writeMemory(records) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(records, null, 2));
  } catch (err) {
    console.error("Error writing memory file:", err);
  }
}

// Heuristic fallback generator matching empathetic role
function generatePlateHeuristic(craving, hungerLevel, primaryGoal) {
  const normCraving = (craving || '').toLowerCase().trim();
  let title = "";
  let detail = "";
  let score = "9.5/10";
  let status = "Balanced";

  // Hunger volume mappings
  let sizeText = "satisfying normal plate";
  let vegPortion = "1/2 plate of warm, roasted and colorful harvest veggies";
  if (hungerLevel.includes("Extremely") || hungerLevel.includes("Starving") || hungerLevel.includes("high")) {
    sizeText = "extra-large warmth-packed plate";
    vegPortion = "nearly 2/3 plate stacked high with tender steamed greens, garden bell peppers, and slow-roasted butternut squash";
    score = "9.8/10";
    status = "Max Volume";
  } else if (hungerLevel.includes("peckish") || hungerLevel.includes("Light")) {
    sizeText = "gentle cozy plate";
    vegPortion = "1/2 plate of crisp, light roasted garden zucchini and sweet cherry tomatoes";
    score = "8.8/10";
    status = "Light Volume";
  }

  // Craving categories
  if (normCraving.includes("pasta") || normCraving.includes("noodle") || normCraving.includes("carb") || normCraving.includes("spaghetti")) {
    title = "Hearthside Sweet Tomato & Herb Pasta Platter";
    detail = `${vegPortion} tossed with fresh basil and cold-pressed olive oil. 1/4 plate of slow-simmered, tender garden tomato whole wheat pasta. 1/4 plate of creamy cannellini beans cooked with roasted garlic for high-fiber, warming satisfaction.`;
    status = "Comforting";
    score = "9.4/10";
  } else if (normCraving.includes("chicken") || normCraving.includes("turkey") || normCraving.includes("meat") || normCraving.includes("beef") || normCraving.includes("pork") || normCraving.includes("salmon") || normCraving.includes("fish")) {
    title = "Fire-Roasted Harvest Herb-Crusted Protein Plate";
    detail = `${vegPortion} with rosemary-drizzled root vegetables. 1/4 plate of juicy, slow-roasted savory breast or protein filet simmered in wood-hearth vegetable stock. 1/4 plate of cozy, fluffy wild rice cooked to soft perfection.`;
    status = "Nourishing";
    score = "9.6/10";
  } else if (normCraving.includes("salad") || normCraving.includes("fresh") || normCraving.includes("greens") || normCraving.includes("crunch")) {
    title = "The Golden Hearth Orchard Crunch Bowl";
    detail = `Over 1/2 plate of crisp romaine, wilted spinach, and warm roasted pumpkin seasoned with fresh apple-basil cider vinaigrette. 1/4 plate of rich, warm fiber-rich chickpeas. 1/4 plate of seasoned quinoa and toasted sunflower seeds for that nourishing, delicious crunch.`;
    status = "Fresh & Energizing";
    score = "9.1/10";
  } else if (normCraving.includes("soup") || normCraving.includes("stew") || normCraving.includes("chili") || normCraving.includes("bowl")) {
    title = "Slow-Simmered Autumn Vegetable & Lentil Marrow";
    detail = `1/2 plate rich tomato-herb broth packed with wilted garden greens, sweet carrots, and celery. 1/4 plate creamed hearth lentils cooked with cracked black pepper. 1/4 plate crusty rustic sourdough to gather up every warm drop.`;
    status = "Warm & Calming";
    score = "9.5/10";
  } else if (normCraving.includes("sweet") || normCraving.includes("fruit") || normCraving.includes("dessert") || normCraving.includes("chocolate") || normCraving.includes("oats") || normCraving.includes("breakfast")) {
    title = "Warm Baked Apple & Hearty Oat Hearth-Bowl";
    detail = `1/2 plate of slow-baked cinnamon apples, sweet pears, and raw blackberries. 1/4 plate of steel-cut rolled oats simmered in pure almond cream with vanilla bean. 1/4 plate of raw pumpkin seeds and toasted walnuts for high-fiber, deeply comforting satiety.`;
    status = "Warm Comfort";
    score = "9.2/10";
  } else {
    // Default generic masterpiece incorporating their craving word
    const itemWord = craving ? `"${craving}"` : "nourishing comfort";
    title = `The Red-Hearth Custom ${craving ? craving.charAt(0).toUpperCase() + craving.slice(1) : 'Satiety'} Skillet`;
    detail = `${vegPortion} cooked with aromatic herbs. 1/4 plate of fiber-rich slow-cooked brown lentils or chickpeas. 1/4 plate of toasted rustic grains or potato wedges to pair perfectly with your craving for ${itemWord}.`;
  }

  return { plateTitle: title, plateDetail: detail, satietyScore: score, status };
}

// Satiety-First Plate Generator with actual Gemini call if key present
async function generateSatietyPlate(craving, hungerLevel, primaryGoal) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No GEMINI_API_KEY found. Using high-fidelity heuristic generator matching Hearth guidelines.");
    return generatePlateHeuristic(craving, hungerLevel, primaryGoal);
  }

  const assistantRole = "An empathetic, nourishing culinary guide that builds satisfying, balanced plates focusing on volume, protein, and fiber, evoking the warmth and comfort of a home-cooked, nourishing red-hearth kitchen without mentioning calories or macros.";
  
  const systemPrompt = `You are a culinary AI designed to work as: ${assistantRole}
You will build a wonderful, highly satisfying, balanced plate recommendation based on these user inputs:
- What they are craving: "${craving || 'something warm and comforting'}"
- Current hunger level: "${hungerLevel}"
- Primary goal: "${primaryGoal}"

Return a single JSON object. Do NOT put Markdown block wrapping or any characters other than clean JSON.
The JSON object must match this schema exactly:
{
  "plateTitle": "A beautiful, comforting, evocative name for the meal",
  "plateDetail": "A detailed layout specifying: 1/2 of plate (volume/vegetables/fiber), 1/4 of plate (satiating protein or beans/lentils), 1/4 of plate (comforting whole grain or sourdough/potatoes). Must emphasize texture, temperature, and abundance. Keep tone empathetic and comforting, with zero calorie or macro counting.",
  "satietyScore": "A rating like '9.5/10' explaining briefly why it keeps them full (e.g. Satiety Score: 9.6/10 due to high fiber and protein volume)",
  "status": "A single word summarizing the style (e.g. Comforting, Balanced, Fresh, Warming)"
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!txt) {
      throw new Error("No text content returned from Gemini API");
    }

    // Clean JSON content if Gemini wrapped it in backticks despite instructions
    let cleanText = txt.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const result = JSON.parse(cleanText);
    return {
      plateTitle: result.plateTitle || "Comforting Hearthside Skillet",
      plateDetail: result.plateDetail || "Balanced plate constructed for your satiety.",
      satietyScore: result.satietyScore || "9.5/10",
      status: result.status || "Warm & Nourishing"
    };

  } catch (error) {
    console.error("Failed to generate plate via Gemini API, falling back to heuristic:", error);
    return generatePlateHeuristic(craving, hungerLevel, primaryGoal);
  }
}

// GET Memory list
app.get('/api/memory', (req, res) => {
  const records = readMemory();
  res.json(records);
});

// POST Memory (save entry & generate plate)
app.post('/api/memory', async (req, res) => {
  try {
    const { craving, hungerLevel, primaryGoal, user } = req.body;

    if (!hungerLevel || !primaryGoal) {
      return res.status(400).json({ error: "Missing required hungerLevel or primaryGoal" });
    }

    // Default mock user if not signed in or not provided
    const activeUser = user || {
      name: "Morgan Hearth",
      email: "morgan@hearthside.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
    };

    // Run satiety generator
    const generated = await generateSatietyPlate(craving, hungerLevel, primaryGoal);

    const newRecord = {
      id: "meal_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      craving: craving || "Nothing particular, surprised by hearth",
      hungerLevel,
      primaryGoal,
      plateTitle: generated.plateTitle,
      plateDetail: generated.plateDetail,
      satietyScore: generated.satietyScore,
      status: generated.status,
      user: activeUser
    };

    const records = readMemory();
    records.unshift(newRecord); // Prepend so latest shows first
    writeMemory(records);

    res.status(201).json({
      success: true,
      message: "Plate successfully constructed in Ample's memory!",
      record: newRecord
    });

  } catch (error) {
    console.error("Error creating plate:", error);
    res.status(500).json({ error: "Could not build plate due to internal server warmth error." });
  }
});

// DELETE single plate from memory log (Durable bonus feature)
app.delete('/api/memory/:id', (req, res) => {
  const { id } = req.params;
  let records = readMemory();
  const initialLength = records.length;
  records = records.filter(item => item.id !== id);

  if (records.length === initialLength) {
    return res.status(404).json({ error: "Meal record not found" });
  }

  writeMemory(records);
  res.json({ success: true, message: "Meal removed from kitchen ledger." });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🔥 Ample Hearthside Plate Builder is running!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📝 Backend memory connected: ${MEMORY_FILE}`);
  console.log(`===============================================`);
});
