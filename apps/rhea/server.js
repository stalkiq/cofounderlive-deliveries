import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Ensure the persistent data storage directory structure exists
const dataDir = path.join('/tmp/ag-ep_mubffxrc-otkR1E', 'data');
const memoryFilePath = path.join(dataDir, 'memory.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(memoryFilePath)) {
  fs.writeFileSync(memoryFilePath, JSON.stringify([]), 'utf8');
}

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join('/tmp/ag-ep_mubffxrc-otkR1E', 'public')));

// Helpers for memory read/write
const readMemory = () => {
  try {
    const data = fs.readFileSync(memoryFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading memory file:', err);
    return [];
  }
};

const writeMemory = (data) => {
  try {
    fs.writeFileSync(memoryFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing memory file:', err);
    return false;
  }
};

// -------------------------------------------------------------
// Core Memory API Endpoints
// -------------------------------------------------------------

// GET /api/memory - Retrieve storage logs (rhythms, profile config, etc.)
app.get('/api/memory', (req, res) => {
  const memory = readMemory();
  res.json({ success: true, count: memory.length, data: memory });
});

// POST /api/memory - Store a new item/log
app.post('/api/memory', (req, res) => {
  const item = req.body;
  
  if (!item || typeof item !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid standard body payload' });
  }

  const memory = readMemory();

  // If we are posting setting/profile configuration, clean up old profiles to avoid clutter
  if (item.type === 'profile') {
    const filteredMemory = memory.filter(i => i.type !== 'profile');
    const newProfile = {
      id: 'profile-settings',
      type: 'profile',
      createdAt: new Date().toISOString(),
      ...item
    };
    filteredMemory.push(newProfile);
    writeMemory(filteredMemory);
    return res.json({ success: true, data: newProfile });
  }

  // Create standard daily rhythm entry with dynamic creation dates
  const newEntry = {
    id: 'rhythm-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    createdAt: new Date().toISOString(),
    ...item
  };

  memory.push(newEntry);
  const success = writeMemory(memory);

  if (success) {
    res.status(201).json({ success: true, data: newEntry });
  } else {
    res.status(500).json({ success: false, error: 'Failed to persist storage locally' });
  }
});

// DELETE /api/memory/:id - Delete a log record (Rhea's zero-knowledge total privacy control)
app.delete('/api/memory/:id', (req, res) => {
  const { id } = req.params;
  const memory = readMemory();
  const index = memory.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Log entry not found' });
  }

  memory.splice(index, 1);
  writeMemory(memory);

  res.json({ success: true, message: `Successfully deleted log with id: ${id}` });
});

// -------------------------------------------------------------
// Rhea Sanctuary AI Endpoints
// -------------------------------------------------------------
// POST /api/ai - Handles zero-knowledge responses with standard Gemini API integration
app.post('/api/ai', async (req, res) => {
  const { query, activePhase, cycleDay } = req.body;

  if (!query) {
    return res.status(400).json({ success: false, error: 'Query prompt is required' });
  }

  const currentPhase = activePhase || 'Luteal Phase';
  const currentDay = cycleDay || 'Day 21';

  // System instructions for Rhea
  const assistantSystemRole = `You are Rhea Holistic Guide, a sophisticated, warm, and natural cycle companion.
Your goal is to provide non-clinical, organic, evidence-based guidance on cycle syncing, nutrition, somatic rest, and emotional alignment.
Current context of the user: They are currently on ${currentDay} of their cycle, which is in the ${currentPhase}.
Always answer using fluid, empathetic tone. Ground your recommendations in natural tea infusions, menstrual physical rest, creative channeling, and mindful grounding.
Keep your responses short, under 3-4 paragraphs, and formatted with beautiful Markdown bullet points. Do not include clinical jargon; refer to cycle phases as seasons or somatic architectures.`;

  // Check if GEMINI_API_KEY is available
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      // Import the standard constructor
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `${assistantSystemRole}\n\nUser request: "${query}"`,
      });

      const responseText = response.text || "Your sanctuary is warm. Rhea is listening and gently aligning your rhythms.";
      return res.json({
        success: true,
        source: 'gemini-api',
        response: responseText
      });
    } catch (err) {
      console.error('Gemini API Error, falling back to local sanctuary guidance:', err);
    }
  }

  // High-fidelity fallback local guide
  const lowerQuery = query.toLowerCase();
  let fallbackText = '';

  if (lowerQuery.includes('nutrition') || lowerQuery.includes('eat') || lowerQuery.includes('food') || lowerQuery.includes('diet')) {
    if (currentPhase.includes('Menstrual')) {
      fallbackText = `During your **Menstrual Phase (Winter)**, your body undergoes intuitive release. Restorative and mineral-dense nutrition is paramount:
- **Warm, soothing stews and bone broths** supply essential amino acids and warmth to your core.
- **Iron and magnesium-rich inputs**: Focus on dark leafy greens (spinach, Swiss chard) mixed with seeds and warm infusions.
- **Hydration**: Warm chamomile, red raspberry leaf, or nettle leaf teas support uterine muscle relaxation.`;
    } else if (currentPhase.includes('Follicular')) {
      fallbackText = `As you enter your **Follicular Phase (Spring)**, estrogen is on the rise, bringing fresh creative energy:
- **Light, vibrant elements**: Incorporate crisp vegetables, raw salads, and lightly fermented vegetables like sauerkraut or kimchi.
- **Phytoestrogen support**: Flaxseeds, organic soy (tempeh), and sprouted pumpkin seeds assist optimal estrogen levels.
- **Lean proteins & healthy fats**: Energize your pathways with fresh avocado, cold-water salmon, and light grains like quinoa.`;
    } else if (currentPhase.includes('Ovulatory')) {
      fallbackText = `In your **Ovulatory Peak (Summer)**, hormones surge to their pinnacle, giving you radiant power:
- **Fiber-dense options**: Raw carrots, celery, and bitter cruciferous leafy greens support your liver in processing the peak estrogen load.
- **Hydrating, high-antioxidant foods**: Enjoy fresh berries (blueberries, raspberries), citrus, and dynamic fruit bowls.
- **Light proteins**: Grilled wild-caught fish, lentils, or sprouted legumes keep your metabolism humming smoothly without heavy digestive fatigue.`;
    } else { // Luteal Phase
      fallbackText = `During the **Luteal Transition (Autumn)**, progesterone rises to establish a grounding, restorative state:
- **Complex, sweet root vegetables**: Warm sweet potatoes, roasted butternut squash, and carrots stabilize blood sugar and soothe sugar cravings.
- **Magnesium abundance**: Enrich your evening with pumpkin seeds, rich dark leafy greens, or organic raw cacao (70%+).
- **Progesterone synthesis support**: Introduce healthy avocados, walnuts, sesame seeds, and warm ginger infusions.`;
    }
  } else if (lowerQuery.includes('movement') || lowerQuery.includes('exercise') || lowerQuery.includes('yoga') || lowerQuery.includes('walk')) {
    if (currentPhase.includes('Menstrual')) {
      fallbackText = `Your physical sanctuary asks for deep, sensory rest in the **Menstrual phase**:
- **Somatic Restoration**: Gentle, passive yin yoga poses using support cushions to ease pelvic dynamic flow.
- **Mindful Solitude**: Silent, slow paths through green parks or forest paths, moving only as fast as your lowest heartbeat.
- **Somatic release**: Lay in a legs-up-the-wall posture for 10 minutes to drain lower limbs fatigue.`;
    } else if (currentPhase.includes('Follicular')) {
      fallbackText = `Your energy is rising. Use this follicular dawn to build stamina and playful flow:
- **Cardio & Power Vinyasa**: Playful dance movements, light jogging, or structured, energetic vinyasa yoga loops.
- **Strength-building**: Moderate weight challenges or dynamic bodyweight strength activities.
- **Playful rhythms**: Dynamic movements that explore range and test your agility.`;
    } else if (currentPhase.includes('Ovulatory')) {
      fallbackText = `Your expressive engine is on maximum drive. Harness this natural summer:
- **High-Intensity Flow**: Expressive high-energy cardio, heavy interval rhythms, or power-building flows.
- **Social Movement**: Join group yoga circles, dance choreography streams, or collaborative sports.
- **Pilates & Core Dynamics**: Fire your center and activate full kinetic power.`;
    } else { // Luteal Phase
      fallbackText = `As progesterone levels rise, switch gears towards restorative muscle preservation:
- **Pilates & Slow Strength**: Focus on deep alignment, posture control, and deliberate isometric holds.
- **Restorative Yin & Hatha**: Calm the nervous response. Long, deep floor postures to address lower lumbar strain.
- **Steady-state walking**: Enjoy a calming 30-minute steady walk at sunset to lower circulating cortisol.`;
    }
  } else if (lowerQuery.includes('cramp') || lowerQuery.includes('pain') || lowerQuery.includes('hurt') || lowerQuery.includes('tension')) {
    fallbackText = `A gentle acknowledgement of your current somatic feedback. Here are some calming organic practices for your transition:
- **Castor Oil Packs & Warmth**: Apply a warm, moist castor oil pack or a simple organic heating pad to your lower womb space for 20 minutes.
- **Magnesium Rich Infusions**: Double-down on magnesium glycinate or red raspberry leaf tea to encourage smooth muscle release.
- **Gentle Releasing Posture**: Fold into an open-knee Child's Pose (Balasana) with a bolster supporting your chest, breathing softly into your back ribs.`;
  } else {
    // Elegant generic response tailored to active phase
    fallbackText = `Welcome to your **Rhea Sanctuary**. Standing in your **${currentPhase} (${currentDay})**, your architecture is transitioning:
- **The Emotional Call**: This phase asks for ${currentPhase.includes('Luteal') || currentPhase.includes('Menstrual') ? 'internal boundary setting, restorative nesting, and journaling' : 'externalizing your vision, collaboration, and high creative output'}.
- **Sanctuary Alignment**: To honor today's cycle, light an organic candle, drink a warm infusions tea, and let your body set the day's pace.
- **Next Practice**: Open your daily ritual diary and document your physical sensations to observe these shifts in real-time.`;
  }

  res.json({
    success: true,
    source: 'fallback-local',
    response: fallbackText
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Rhea Sanctuary running beautifully on http://localhost:${PORT}`);
});
