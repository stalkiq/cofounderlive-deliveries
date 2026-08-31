import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configure Environment and Paths
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON Parsing
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path to durable memory storage
const MEMORY_FILE_PATH = path.join(__dirname, 'data', 'memory.json');

// Ensure data directory and memory.json exists
function initMemoryStore() {
  const dir = path.dirname(MEMORY_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(MEMORY_FILE_PATH)) {
    const defaultData = {
      assessments: [],
      plans: [],
      notes: [],
      config: {
        dailyFiberGoal: 30,
        userName: "Culinary Explorer"
      }
    };
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}
initMemoryStore();

// Helper to read memory
function readMemory() {
  try {
    initMemoryStore();
    const data = fs.readFileSync(MEMORY_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading memory file, returning empty state:", err);
    return { assessments: [], plans: [], notes: [] };
  }
}

// Helper to write memory
function writeMemory(data) {
  try {
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Error writing to memory file:", err);
    return false;
  }
}

// REST API Endpoints

// 1. GET /api/memory - Retrieves all saved assessments, recipes, and user settings
app.get('/api/memory', (req, res) => {
  const memory = readMemory();
  res.json({
    success: true,
    data: memory
  });
});

// 2. POST /api/memory - Saves new entries (assessments, plans, configuration changes)
app.post('/api/memory', (req, res) => {
  const { type, payload } = req.body;
  if (!type || !payload) {
    return res.status(400).json({
      success: false,
      message: "Missing 'type' or 'payload' in request body."
    });
  }

  const memory = readMemory();
  const timestamp = new Date().toISOString();
  const recordId = 'rec_' + Math.random().toString(36).substr(2, 9);
  const newEntry = { id: recordId, timestamp, ...payload };

  if (type === 'assessment') {
    memory.assessments.unshift(newEntry);
  } else if (type === 'plan' || type === 'recipe') {
    memory.plans.unshift(newEntry);
  } else if (type === 'notes') {
    memory.notes.unshift(newEntry);
  } else if (type === 'config') {
    memory.config = { ...memory.config, ...payload };
  } else {
    return res.status(400).json({
      success: false,
      message: `Unsupported record type: ${type}`
    });
  }

  const success = writeMemory(memory);
  if (success) {
    res.status(201).json({
      success: true,
      message: `Successfully saved ${type} record`,
      entry: newEntry
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Failed to write record to file memory."
    });
  }
});

// 3. GET /api/status - Status information of backend processes
app.get('/api/status', (req, res) => {
  const memory = readMemory();
  const apiKeyLoaded = !!process.env.GEMINI_API_KEY;
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: {
      geminiConnected: apiKeyLoaded,
      nodeVersion: process.version
    },
    counts: {
      assessments: memory.assessments?.length || 0,
      plans: memory.plans?.length || 0,
      notes: memory.notes?.length || 0
    }
  });
});

// 4. POST /api/satiety-plan - Core Gemini Capability
// Generates personalized culinary satiety recipe plans matching the requested archetype
app.post('/api/satiety-plan', async (req, res) => {
  const { ingredients, dietaryPattern, struggle, focusGroup, satietySlider } = req.body;

  if (!ingredients && !focusGroup) {
    return res.status(400).json({
      success: false,
      message: "Please input ingredients or select a focus whole food group."
    });
  }

  const promptIngredients = ingredients || focusGroup || "Seasonal whole foods";
  const systemRole = "A premium culinary nutritionist specializing in high-volume, whole-food satiety science. You design satisfying, fiber-and-protein-dense meals that align with the Rind philosophy of abundance over restriction.";

  const userPrompt = `
    Create an exquisite, magazine-grade culinary recipe matching the 'Rind' metabolic sufficiency core philosophy: WEIGHT LOSS THROUGH ABUNDANCE.
    The meal must maximize cell-hydration, high fiber, protein volume, and metabolic satiety to curb cravings.

    Input Ingredients/Cravings: ${promptIngredients}
    Primary Dietary Pattern: ${dietaryPattern || 'Unspecified'}
    User's Main Metabolic Struggle: ${struggle || 'General Cravings'}
    Current Satiety Slider Level: ${satietySlider || 'Unspecified'}

    Return JSON schema strictly formatted so our high-end editorial layouts can render it perfectly.
    The response MUST be valid JSON containing exactly:
    {
      "recipeName": "Title of the Recipe (be poetic, e.g., 'Charred Heirloom Romanesco with Pistachio Gremolata')",
      "satietyScore": "A rating out of 10 (e.g. 9.4/10)",
      "volumeIndex": "e.g., 'Extremely High Satiety Density'",
      "prepTime": "e.g., '20 mins prep'",
      "description": "An attractive, editorial magazine-quality culinary overview or hook describing the sensory pleasure and richness of this dish.",
      "macronutrientFocus": {
        "fiber": "e.g., 18g",
        "protein": "e.g., 28g",
        "hydrationVolume": "92% Water Content",
        "satietyHormoneTrigger": "GLP-1 activation from fermentable fiber and slow amino release"
      },
      "ingredients": ["Array of beautiful, specific, high-volume whole ingredients"],
      "instructions": ["Step-by-step editorial masterclass preparation guide"],
      "culinaryRationale": "A quick explanation of why this crowds out ultra-processed cravings through bulk nourishment rather than starvational restriction."
    }
  `;

  let finalRecipe = null;
  let usedGemini = false;

  // Retrieve API key if available
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "MOCK_KEY") {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      console.log("Contacting Gemini API for recipe generation...");
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: systemRole
      });

      const responseText = result.response.text();
      finalRecipe = JSON.parse(responseText);
      usedGemini = true;
    } catch (err) {
      console.warn("Gemini API call failed, reverting to culinary rule-based expert generator:", err.message);
    }
  }

  // Fallback Rule-Based Expert Satiety Recipe Engine
  if (!finalRecipe) {
    finalRecipe = generateMockSatietyRecipe(promptIngredients, dietaryPattern, focusGroup, struggle);
    usedGemini = false;
  }

  // Save the newly generated recipe in local JSON storage automatically so history persists
  const memory = readMemory();
  const timestamp = new Date().toISOString();
  const recordId = 'plan_' + Math.random().toString(36).substr(2, 9);
  
  const savedPlan = {
    id: recordId,
    timestamp,
    input: { ingredients, dietaryPattern, struggle, focusGroup },
    aiGenerated: usedGemini,
    recipe: finalRecipe
  };

  memory.plans.unshift(savedPlan);
  writeMemory(memory);

  res.json({
    success: true,
    data: savedPlan
  });
});

// Mock Satiety Recipe Database & Matching Generator to keep application 100% operational offline
function generateMockSatietyRecipe(ingredients, pattern, focusGroup, struggle) {
  const cleanIngredients = ingredients.toLowerCase();
  
  // Decide which culinary archetype to build based on inputs
  if (cleanIngredients.includes('salmon') || cleanIngredients.includes('fish') || cleanIngredients.includes('seafood') || focusGroup === 'Clean Lean Proteins') {
    return {
      recipeName: "Slow-Roasted Salmon in Wild Sorrel & Kombu Broth",
      satietyScore: "9.3 Satiety Rating",
      volumeIndex: "High Water & Protein Satiety Density",
      prepTime: "25 mins",
      description: "A tender, slow-cooked king salmon filet nested inside a high-volume sea mineral bone broth spiked with wild garden greens. The rich omega fats combined with immediate enzymatic liquid fullness suppresses late-day 'food noise' completely.",
      macronutrientFocus: {
        fiber: "6g (from fresh greens and sea vegetables)",
        protein: "38g (high-density, slow-emptying wild protein)",
        hydrationVolume: "High Liquid Weight (Spurs Vagus Nerve stretch receptors)",
        satietyHormoneTrigger: "Peptide YY (PYY) stimulation & CCK release from healthy salmon lipids."
      },
      ingredients: [
        "180g Wild King Salmon (rich in anti-inflammatory omega-3 acids)",
        "3 cups Rich Chicken Bone Broth (natural collagen base)",
        "1 big cup Fresh Wild Sorrel or Watercress leaves",
        "100g Sliced Daikon Radish and Shiitake Caps",
        "1 strip Organic Kombu Sea Vegetable (high iodine, dynamic savory taste)",
        "Drizzle of pressed pumpkin seed oil"
      ],
      instructions: [
        "Construct the foundation: Combine bone broth, kombu strip, and shiitake mushrooms in a heavy shallow pot. Simmer softly for 15 minutes to extract earthy nucleotides.",
        "Nurture the salmon: Heat oven to a gentle 120°C (250°F). Season salmon patch with coarse Celtic salt. Moisten with a brush of pumpkin seed oil.",
        "Slow-bake: Roast on a non-reactive flat tray for 12 to 14 minutes until slow muscle fiber turns velvety and pink.",
        "Embellish: Drop the daikon radish and raw garden greens into the hot broth. Swirl once until vibrant green.",
        "Platter: Siphon the steaming broth into a wide artisanal stone bowl. Anchor the salmon tenderly at the center. Finish with a squeeze of fresh lemon."
      ],
      culinaryRationale: "This recipe leverages amino acid density to trigger the pyloric stretch response while delivering long-term hormonal fullness via healthy fats."
    };
  }

  if (cleanIngredients.includes('broccoli') || cleanIngredients.includes('romanesco') || cleanIngredients.includes('cauliflower') || cleanIngredients.includes('cabbage') || focusGroup === 'Cruciferous Vegetables & Greens') {
    return {
      recipeName: "Charred Romanesco Crown with Roasted Pistachio Gremolata",
      satietyScore: "9.5 Satiety Rating",
      volumeIndex: "Ultra High Plant Volume Density",
      prepTime: "18 mins",
      description: "A towering, deeply charred romanesco crowns a pool of rich, fiber-heavy mint-pistachio drizzle. Romanesco is a physical miracle of volumetrics—its fractal stems hold micro-air pockets that swell with water inside the stomach.",
      macronutrientFocus: {
        fiber: "14g (Premium prebiotic fuel)",
        protein: "12g (from plant sources and seed gremolata)",
        hydrationVolume: "84% Hydration (High cellular puffiness)",
        satietyHormoneTrigger: "Satiety hormone GLP-1 boosted through short-chain fatty acid conversion on the intestinal wall."
      },
      ingredients: [
        "1 whole Romanesco head (sliced into dense, steak-like vertical wedges)",
        "30g Roasted Unsalted Green Pistachios (chopped fine)",
        "Huge bundle of fresh mint, curly parsley, and local chives",
        "1 Lemon (zested and squeezed)",
        "2 cloves Raw Garlic (minced finely with volcanic salt)",
        "10g Extra Virgin Olive Oil (cold-extracted)"
      ],
      instructions: [
        "Ignite the fire: Bring a flat cast-iron skillet to smoking temperature. Dry-temper the romanesco wedges directly till edges blacken in deep architectural patterns.",
        "Bake structure: Drop heat to medium-low, cover the pan, and allow the fractal stems to steam-soften in their own cellular moisture for 6 minutes.",
        "Foretell the Gremolata: Mash pistachios, mint leaves, parsley, lemon zest, garlic, and cold-pressed olive oil in an old-style mortar.",
        "Assembling the abundancy: Lay flat wedges onto our light background plates. Sieve a liberal cascade of green oil and crunchy pistachio crust on top.",
        "Enjoy instantly: Savor the deep crunch. Chew slowly to allow dietary volume signals to reach the hypothalamus."
      ],
      culinaryRationale: "By roasting complex plant architecture without high fat pools, you get towering, stunning volumetric portions that completely dwarf standard industrial starch equivalents."
    };
  }

  if (cleanIngredients.includes('bean') || cleanIngredients.includes('lentil') || cleanIngredients.includes('hummus') || focusGroup === 'Legumes & Resistant Starches') {
    return {
      recipeName: "Smoked Crimson Lentil Stew with Warm Sunchoke Tapenade",
      satietyScore: "9.1 Satiety Rating",
      volumeIndex: "Starch-Heavy Second-Meal Effect",
      prepTime: "30 mins",
      description: "Saturated, creamy crimson lentils slow-cooked with double smoked paprika and raw herbs, topped with a crisp, prebiotic-dense tapenade. Prebiotic inulin in sunchokes acts as a metabolic handbrake, ensuring stable fuel release over hours.",
      macronutrientFocus: {
        fiber: "19g (Outstanding metabolic abundance)",
        protein: "22g (Sustainable plant protein block)",
        hydrationVolume: "Hydrated Legumes (Heavy weight, slow metabolic transit)",
        satietyHormoneTrigger: "Peptide YY (PYY) and deep gut microbiome fermentative signaling."
      },
      ingredients: [
        "1 cup Crimson Lentils (thoroughly triple rinsed with filtered water)",
        "3 big Sunchokes / Jerusalem Artichokes (peeled and diced fine)",
        "1 Red Onion and 3 Celery stalks (the aromatic bases)",
        "1 tablespoon Smoked Paprika (Oakwood dried)",
        "50g Raw Fennel (shaved like parchment paper)",
        "Fresh apple cider vinegar and cold water"
      ],
      instructions: [
        "Initiate lentils: Simmer lentils in plenty of salted water with red onion and celery for 20 minutes until they achieve a luxurious, velvety porridge texture.",
        "Smoked core: Fold in premium oakwood smoked paprika and a touch of black pepper at the last minute.",
        "Sunchoke crisp: Boil sunchoke cubes for 5 minutes, then crisp them in a dry skillet with a mist of vinegar. Mix with raw fennel ribbons for the crunch factor.",
        "Presentation: Platter the warm crimson stew. Generously heap the cool sunchoke and fennel tapenade across the crown.",
        "Aesthetic finish: Top with freshly cracked sea-salt crystals and high-grade olive oil drops."
      ],
      culinaryRationale: "Slow-release complex starches activate highly robust natural satiety pathways, curbing both short-term crashes and mid-afternoon cravings."
    };
  }

  // General default high-volume satiety meal
  return {
    recipeName: "The Sovereign Satiety Bowl (Tempered Greens & High-Density Protein)",
    satietyScore: "9.2 Satiety Rating",
    volumeIndex: "Macro Satiety Balance",
    prepTime: "20 mins",
    description: "An elegant, towering plate of steamed cruciferous greens, crisp radishes and cold-pressed seeds, with premium skin-on chicken breast or sprouted organic tofu. Tailored precisely to counter restriction stress.",
    macronutrientFocus: {
      fiber: "11g (Soluble & insoluble network)",
      protein: "32g (Protein leverage trigger)",
      hydrationVolume: "High cell weight with high density mineral broth",
      satietyHormoneTrigger: "Multi-hormone trigger cascades (PYY, CCK, GLP1) due to clean proteins and heavy plant hulls."
    },
    ingredients: [
      "150g Organic Chicken Breast or Firm Sprouted Tofu",
      "2 cups Cut Dino Kale (stalks removed, cut into fine strips)",
      "1 cup Crisp Steamed Sugar Snap Peas",
      "3 Red Radishes (shaved super thin)",
      "2 tablespoons Hemp Hearts (healthy fats & proteins)",
      "Citrus-Ginger emulsion"
    ],
    instructions: [
      "Singe the Protein: Lightly sear your chicken strips or tofu cubes over extreme high heat to seal in rich natural glutamates.",
      "Green steam-wilt: Toss dinosaur kale and sugar snaps with 3 tablespoons of filtered mineral water in a pan, lock the lid for 2 minutes to cook lightly.",
      "Vaguest stretch preparation: Mound physical leaves in our sharp-radius editorial bowl. Layer chicken/tofu in clean diagonal slices.",
      "Decorate: Spray freshly blended ginger juice, lemon zest, and scatter raw hemp seeds.",
      "Mindful eating: Drink a warm glass of lemon water during ingestion to swell the fiber matrix further."
    ],
    culinaryRationale: "Features double-protein density with raw seed lipids, ensuring robust appetite regulation without caloric or restriction anxiety."
  };
}

// Global Exception handler
app.use((err, req, res, next) => {
  console.error("Unhandled error encountered:", err);
  res.status(500).json({
    success: false,
    message: "A metabolic error occurred within the engine. Our culinary team is fixing it."
  });
});

// Launch server
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`  RIND METABOLIC SATIETY ENGINE initialized dynamically on port ${PORT}`);
  console.log(`  Visual Theme: High-end Editorial Culinary Magazine`);
  console.log(`  Durable local storage: ${MEMORY_FILE_PATH}`);
  console.log(`  Interactive Satiety Planner active and listening safely.`);
  console.log(`================================================================`);
});
