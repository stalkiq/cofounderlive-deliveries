import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parse middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Path to data file for durable state memory
const MEMORY_FILE_PATH = path.join(__dirname, 'data', 'memory.json');

// Ensure parent data directory exists
const ensureDataDir = () => {
  const dir = path.dirname(MEMORY_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Read plates history from memory JSON database
const readMemory = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(MEMORY_FILE_PATH)) {
      // Seed with some initial cozy meals so the experience looks great out of the box
      const initialSeed = [
        {
          id: "seed-1",
          title: "Slow-Simmered Tomato & White Bean Stew",
          craving: "warm hearty soup",
          hungerLevel: "Ready for a full meal",
          goal: "Warm & comforting",
          description: "1/2 plate of warm stew filled with rich tomato-herb broth, soft wilted kale, and roasted garlic. 1/4 plate of creamy white cannellini beans for rich fiber and plant protein. 1/4 plate of grilled, thick-sliced sourdough bread brushed with extra virgin olive oil to absorb the luxurious broth.",
          visualPortions: {
            vegetables: "50% Greens & Savory Tomato Broth",
            protein: "25% Slow-Simmered Cannellini Beans",
            grains: "25% Charcoal-Grilled Sourdough Bread"
          },
          satietyScore: "9.5/10",
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString() // 3 hours ago
        },
        {
          id: "seed-2",
          title: "Roasted Red Pepper & Lentil Bowl",
          craving: "something spicy and filling",
          hungerLevel: "Extremely hungry (need high volume)",
          goal: "Fresh & energizing",
          description: "A gigantic, deep-blue ceramic bowl piled with a 1/2-plate base of flame-roasted bell peppers, charred zucchini rounds, and crisp baby spinach. 1/4 plate is topped with warm-spiced brown lentils slow-cooked with cumin and coriander. The remaining 1/4 plate features a fluffy scoop of wild rice, all topped with a rich, velvety drizzle of raw sesame tahini sauce and sea salt.",
          visualPortions: {
            vegetables: "50% Char-Grilled Sweet Bell Peppers & Spinach Base",
            protein: "25% Warm Spiced Earthy Brown Lentils",
            grains: "25% Steaming Fragrant Wild Rice with Tahini Drizzle"
          },
          satietyScore: "10/10",
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString() // Yesterday
        }
      ];
      fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(initialSeed, null, 2), 'utf8');
      return initialSeed;
    }
    const data = fs.readFileSync(MEMORY_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading from memory file, returning empty array:", err);
    return [];
  }
};

// Write plates history to memory JSON database
const writeMemory = (data) => {
  try {
    ensureDataDir();
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing to memory file:", err);
    return false;
  }
};

// Satiety-First Plate Generator (Emulates Gemini Assistant behavior with high empathy and zero counting)
const generateSatietyPlate = (craving, hungerLevel, goal) => {
  // Clean empty cravings
  const userCraving = craving && craving.trim() !== '' ? craving.trim() : 'something warm and filling';
  
  // Custom empathetic plate generators
  const titleOptions = [
    `Hearthside ${userCraving.charAt(0).toUpperCase() + userCraving.slice(1)} Harvest Plate`,
    `Warm Country Style ${userCraving.charAt(0).toUpperCase() + userCraving.slice(1)} Bowl`,
    `Simmered Red-Hearth ${userCraving.charAt(0).toUpperCase() + userCraving.slice(1)} Skillet`,
    `Satisfying Fire-Roasted ${userCraving.charAt(0).toUpperCase() + userCraving.slice(1)} Banquet`
  ];
  
  const selectedTitle = titleOptions[Math.floor(Math.random() * titleOptions.length)];

  // Scale portion explanations and details according to Hunger Level
  let veggiePart = "";
  let proteinPart = "";
  let energyPart = "";
  let satietyScore = "";
  let plateBonus = "";

  if (hungerLevel.includes("Extremely") || hungerLevel.includes("Starving") || hungerLevel.includes("10/10")) {
    veggiePart = "A massive 1/2-plate mound of highly satisfying roasted fibrous vegetables—such as sea-salt charred broccoli, steam-softened dark chard, and caramelized balsamic onions—providing absolute crunch, warmth, and belly-filling cell-hydration.";
    proteinPart = "A generous 1/4-plate serving of rich, plant-powered black lentils and slow-braised pulled chicken (or garlic-herb edamame tofu) for solid, slow-burning protein blocks.";
    energyPart = "A solid 1/4-plate of cozy honey-roasted butternut squash cubes and steamed tri-color quinoa, providing steady, comforting satisfaction.";
    satietyScore = "10/10 Max Volume";
    plateBonus = "Includes a warm mug of soothing herbal-infused miso mineral broth on the side to thoroughly ground and soothe digestional nerves.";
  } else if (hungerLevel.includes("Ready") || hungerLevel.includes("Balanced") || hungerLevel.includes("8/10")) {
    veggiePart = "A comfortable 1/2-plate medley of roasted sweet red pepers, tender grilled asparagus, and high-volume leafy garden greens with a warm apple cider splash.";
    proteinPart = "A standard 1/4-plate serving of savory oven-roasted salmon steak (or rich rosemary-infused marinated white heirloom beans).";
    energyPart = "A 1/4-plate portion of nutty red rice or crusty, hearth-baked artisanal grain sourdough toast to perfectly hold savory spreads.";
    satietyScore = "8.5/10 Comforting Volume";
    plateBonus = "Features a final drizzle of nourishing roasted pumpkin seed pesto across the center to bind all textures together deliciously.";
  } else {
    // Peckish / Light
    veggiePart = "A refreshing 1/2-plate balance of chilled sliced cucumbers, raw sweet baby carrots, and warm roasted portobello mushrooms for a delightful savory snap.";
    proteinPart = "A soft 1/4-plate portion of rich organic hardboiled farm egg slices or seasoned whipped chickpea puree.";
    energyPart = "A light 1/4-plate side of whole grain sea-salt crackers or steamed sweet potato coins.";
    satietyScore = "7.0/10 Light Satiety";
    plateBonus = "Topped with a pinch of dynamic hemp hearts and a fragrant squeeze of fresh lemon wedge.";
  }

  const volumeDescriptor = hungerLevel.includes("Extremely") ? "high-volume, highly-satisfying" : "beautifully balanced, shame-free";

  const description = `Designed specifically to honor your craving for: "${userCraving}". Built on a large, comforting ceramic plate. ${veggiePart} ${proteinPart} ${energyPart} ${plateBonus} Enjoy this ${volumeDescriptor} plating sequence, crafted to support weight-health and ultimate belly satisfaction without tracking database scales, calories, or micro-percentages.`;

  return {
    id: 'plate-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    title: selectedTitle,
    craving: userCraving,
    hungerLevel: hungerLevel,
    goal: goal || "Warm & comforting",
    description: description,
    visualPortions: {
      vegetables: veggiePart.split(".")[0], // capture the main sentence
      protein: proteinPart.split(".")[0],
      grains: energyPart.split(".")[0]
    },
    satietyScore: satietyScore,
    timestamp: new Date().toISOString()
  };
};

// GET API: Retrieve user's plate planner history
app.get('/api/memory', (req, res) => {
  const memory = readMemory();
  // Return the entire array, sorted by date descending (latest first)
  const sortedMemory = [...memory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(sortedMemory);
});

// POST API: Create a new plate draft, saving to persistent JSON database
app.post('/api/memory', (req, res) => {
  const { craving, hungerLevel, goal } = req.body;

  if (!hungerLevel) {
    return res.status(400).json({ error: "hungerLevel field is required to adjust plate density." });
  }

  // Generate a comforting satiety-driven plate
  const newPlate = generateSatietyPlate(craving, hungerLevel, goal);

  // Read current history, prepend the new entry, write back
  const currentMemory = readMemory();
  currentMemory.unshift(newPlate);
  writeMemory(currentMemory);

  res.status(201).json(newPlate);
});

// GET Settings - Endpoint for retrieving current user preferences
app.get('/api/settings', (req, res) => {
  ensureDataDir();
  const settingsPath = path.join(__dirname, 'data', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return res.json(data);
    } catch (e) {
      // fallback
    }
  }
  // Default values
  const defaults = {
    displayName: "Theo Ample",
    favoriteFlavors: ["Savory & Herbal", "Smoky & Roasted"],
    appTheme: "Dark Blue Hearth",
    dietaryExclude: "None (All Foods Welcome)",
    googleLinked: true,
    hapticFeedback: true
  };
  fs.writeFileSync(settingsPath, JSON.stringify(defaults, null, 2), 'utf8');
  res.json(defaults);
});

// POST Settings - Update profile configurations
app.post('/api/settings', (req, res) => {
  ensureDataDir();
  const settingsPath = path.join(__dirname, 'data', 'settings.json');
  try {
    const updated = req.body;
    fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2), 'utf8');
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: "Could not save settings profile data." });
  }
});

// Fallback index.html for single page client architecture
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  Ample Plate Builder successfully active!`);
  console.log(`  Listening at: http://localhost:${PORT}`);
  console.log(`  Cozy Dark Blue Design Mode is active.`);
  console.log(`===============================================`);
});
