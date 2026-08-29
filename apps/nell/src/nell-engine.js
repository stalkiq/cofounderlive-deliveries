const { GoogleGenAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are Nell, an enchanting, wise, and patient Socratic tutor inspired by the Young Lady's Illustrated Primer. Speak directly to a child with warmth, intellectual respect, and magical storytelling. Guide them to reason through questions rather than giving direct answers. Introduce gentle mathematical or logical puzzles woven into a fantasy narrative. Maintain an organic, leather-bound, golden-leaf ink aesthetic in your tone—bespoke, enchanting, and intellectual. Always encourage independent thought, offering supportive socratic cues instead of telling them the flat answer.`;

// Highly immersive Socratic Fallback Templates
// When offline/no API key, this generator crafts stunning, custom-tailored Socratic storylines.
const TEMPLATE_STORE = {
  "Socratic Logic & Cause-Effect": {
    story: (interest, milestone) => 
      `The sky of parchment deepens to an ink-pot blue, little finder. In the heart of our story, a towering, majestic creature made entirely of ${interest} stands perfectly still. It cannot move its limbs. Nearby, a traveler is troubled by ${milestone}, causing them to hide their face in shadow. "Look closely at the high gears of the creature," the old traveler whispers to you. "It only awakens when the warm winds blow, yet today the winds block the path."`,
    question: (interest) => 
      `Why do you suppose the ${interest} creature remains sleeping when its pathways are blocked, and what might happen if we gently blow warm breath upon its primary connection?`,
    inquiryTitle: "The Awakening Cause",
    inquiryDetail: "Discover the chain of actions that brings the dormant giant to life.",
    metrics: { socraticSpark: 95, concepts: "Cause & Effect" }
  },
  "Fractional Division & Sharing": {
    story: (interest, milestone) => 
      `Close your eyes and listen, little reader. Can you smell it? A warm hearth fire crackles, and upon it sits a freshly baked, golden loaf shaped like a ${interest}. A wandering clockwork sparrow and a tiny pixie are sitting on the stone floor. They are struggling with the challenge of ${milestone}. They have only this single, grand loaf to share between them, yet both are terribly hungry and starting to argue.`,
    question: (interest) => 
      `If we must feed both the clockwork sparrow and the pixie with our single ${interest} loaf so they feel entirely respected and filled, how should we slice it, and into how many equal portions?`,
    inquiryTitle: "The Shared Loaf of Abundance",
    inquiryDetail: "Divide the single source of energy equally to reconcile the woodland companions.",
    metrics: { socraticSpark: 96, concepts: "Fractional Division" }
  },
  "Ethical Decision Making": {
    story: (interest, milestone) => 
      `A soft chime rings through the living parchment. You find yourself standing at a crossroads carved from a solid, shimmering gem of ${interest}. A forest sprite is holding a secret box, crying out because they are facing the weight of ${milestone}. The sprite whispers: "If I keep this secret, I can keep the golden-leaf key for myself. But if I tell, my companion will share the light, though my key might dissolve."`,
    question: (interest) => 
      `If you were walking beside the sprite along this ${interest} path, what would you whisper in their ear about what makes a companion truly wealthy?`,
    inquiryTitle: "The Sprite's Crossroads",
    inquiryDetail: "Resolve the conflict between personal gain and communal trust.",
    metrics: { socraticSpark: 98, concepts: "Ethical Integrity" }
  },
  "Phonics & Spatial Reasoning": {
    story: (interest, milestone) => 
      `Look! The gold-leaf margins of our book begin to bloom. Before you sits a magnificent map made of ${interest}. Words are etched into the parchment, but some letters have danced away because of the shadows cast by ${milestone}. To read the secret map and find where the treasure is buried, we must arrange three wooden blocks marked with 'P', 'A', and 'T' in a row.`,
    question: (interest) => 
      `If we slide the block with the soft wind sound 'P' to the very beginning, and the flat tapping sound 'T' to the very tip, what word did we build to pat down the dust of our ${interest} map?`,
    inquiryTitle: "The Inscribed Map",
    inquiryDetail: "Piece together sounds and letters to orient the parchment compass.",
    metrics: { socraticSpark: 94, concepts: "Phonics & Shapes" }
  }
};

const DEFAULT_TEMPLATE = {
  story: (interest, milestone) => 
    `Inside the great cabinet of our leather-bound book, we discover a realm inspired entirely by ${interest}. Each corner is shaped by the great lesson of learning. A tiny clockwork sparrow is trying to understand ${milestone}, but it feels stuck.`,
  question: (interest) => 
    `How can we find the secret path to help the clockwork sparrow understand the magic of ${interest}?`,
  inquiryTitle: "The Journey of the Sparrow",
  inquiryDetail: "Assist the companion in integrating this new concept.",
  metrics: { socraticSpark: 92, concepts: "Conceptual Understanding" }
};

// Evaluate Child responses and provide smart simulated Socratic replies
function getSimulatedDialogueResponse(skill, dialogHistory, childMessage) {
  const normMessage = childMessage.toLowerCase();
  
  if (skill.includes("Division") || skill.includes("Sharing")) {
    if (normMessage.match(/(half|equal|split|share|divide| 2 |two|part|piece)/)) {
      return {
        text: "You have reasoned beautifully! Indeed, splitting it into two equal halves allows both to feast as equals. Now, as they sit side by side eating, the sparrow notices the pixie has no water. To continue our story, should the sparrow share its canteen, or run ahead to the next mountain?",
        milestoneRecorded: "Moral Choice: Divided Resource Shared",
        inquiryStatus: "Solved",
        solvedValue: "Two Equal Halves"
      };
    } else {
      return {
        text: "A thoughtful observation, little finder. But if we give the entire thing to only one of them, the other will go hungry and weep under the willow. How might we treat them both as equals so neither is left out?",
        milestoneRecorded: "Concept Breakthrough: Seeking Fairness",
        inquiryStatus: "Active Inquiry",
        solvedValue: ""
      };
    }
  } else if (skill.includes("Logic") || skill.includes("Cause")) {
    if (normMessage.match(/(blow|breath|wind|push|move|turn|cause|connect|gear|heat|sun|fire)/)) {
      return {
        text: "Ah, the ink on the page glows gold! Yes, the warm breath triggers the mechanical expansion, turning the gears! The colossal creature groans and begins to step forward, lifting the traveler out of the shadows. Do you believe all things in this world require a spark to begin their motion, or can something start to move entirely on its own?",
        milestoneRecorded: "Conceptual Breakthrough: Kinetic Agency",
        inquiryStatus: "Solved",
        solvedValue: "Thermal Expansion / Connection"
      };
    } else {
      return {
        text: "That is an intriguing guess. But observe the wheels once more—they are linked tightly together like teeth in a mouth. If the first one remains still, can the last one possibly dance? What must we do to start the initial turn?",
        milestoneRecorded: "Socratic Dialog: Pondering Gears",
        inquiryStatus: "Active Inquiry",
        solvedValue: ""
      };
    }
  } else if (skill.includes("Ethical") || skill.includes("Decision")) {
    if (normMessage.match(/(truth|tell|share|honesty|friend|together|helper|help|kind|love|speak)/)) {
      return {
        text: "Your words smell of sweet oil and wisdom. Yes, sharing the light of truth makes both companions truly rich, while a secret key kept in selfishness eventually rusts in the pocket. The sprite smiles, hands the key to their companion, and the path transforms into liquid gold. What do you think is harder: sharing your physical treasures, or sharing your secrets?",
        milestoneRecorded: "Moral Choice: Chose Honesty & Trust",
        inquiryStatus: "Solved",
        solvedValue: "Truth & Trust"
      };
    } else {
      return {
        text: "An honest shield for the mind. Yet, if the sprite keeps the key, they will walk alone in the dark with no one to share the road. Is there a way to let both of them step into the golden light together?",
        milestoneRecorded: "Socratic Dialog: Navigating Sprite's Choice",
        inquiryStatus: "Active Inquiry",
        solvedValue: ""
      };
    }
  } else if (skill.includes("Phonics") || skill.includes("Spatial")) {
    if (normMessage.match(/(pat|tap|p-a-t|word|spill|step)/)) {
      return {
        text: "Marvelous! 'P' - 'A' - 'T' sounds out 'PAT'! You have patted the dust from the parchment, and the golden-leaf map arises to point northward! A secret door in the trunk of the grandfather oak swings open. Shall we step inside, or study the carvings around the handle first?",
        milestoneRecorded: "Conceptual Breakthrough: Phoneme Blending",
        inquiryStatus: "Solved",
        solvedValue: "PAT"
      };
    } else {
      return {
        text: "A playful combination! Let's sound it slowly together. Put the 'P' (peee...) at the start, the soft 'A' (aaa...) in the middle, and 'T' (teee...) at the end. When they hold hands, what word do they sing?",
        milestoneRecorded: "Socratic Dialog: Phoneme Practice",
        inquiryStatus: "Active Inquiry",
        solvedValue: ""
      };
    }
  }

  // Generic fallback if skill not matched
  return {
    text: "How beautifully you look at this world! Nell is listening. Tell me more about what your heart feels as we watch this chapter unfold upon the parchment. What is the next small step we should take?",
    milestoneRecorded: "Socratic Dialog: Open Exploration",
    inquiryStatus: "Active Inquiry",
    solvedValue: ""
  };
}

/**
 * Generate a new chapter's initial Socratic story and prompt
 */
async function generateNewChapter(interest, skill, milestone) {
  const normSkill = Object.keys(TEMPLATE_STORE).find(k => skill.includes(k.split(' ')[0])) || "Default";
  const template = TEMPLATE_STORE[normSkill] || DEFAULT_TEMPLATE;

  // Let's check environment for Gemini Key
  if (process.env.GEMINI_API_KEY) {
    try {
      // Initialize the Gemini client
      const ai = new GoogleGenAI();
      const prompt = `We are starting a new learning chapter in "Nell".
Parent Context:
- Childhood Interest/Obsession: "${interest}"
- Target Cognitive Skill: "${skill}"
- Real-world Emotional Milestone or Sibling Challenge: "${milestone}"

As Nell, the wise, patient, Socratic tutor, craft:
1. A beautiful introductory fantasy story (2-3 paragraphs) that weaves these three components. Speak directly to the child.
2. A single magical, Socratic question that invites the child to reason about the concept instead of telling them the answer.
3. Suggest a beautiful name for this Active Chapter.
4. Provide a label for the "Active Inquiry" that will be placed on the child's screen.

Return your response in strict JSON format matching this schema:
{
  "chapterTitle": "The Tale of the...",
  "storyText": "Nell's opening narrative...",
  "questionText": "The Socratic question to end the story with...",
  "inquiryTitle": "Short title of the active puzzle/inquiry...",
  "inquiryDetail": "Description of the logical puzzle..."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text;
      const parsed = JSON.parse(responseText.trim());
      return {
        success: true,
        source: 'gemini',
        chapterTitle: parsed.chapterTitle || `The Chronicle of the ${interest}`,
        story: `${parsed.storyText}\n\n${parsed.questionText}`,
        inquiryTitle: parsed.inquiryTitle || (template.inquiryTitle || "Inquire"),
        inquiryDetail: parsed.inquiryDetail || (template.inquiryDetail || "A new mystery awaits."),
        meta: skill.split(' & ')[0],
        conceptsMasteredIncrement: 1
      };
    } catch (err) {
      console.warn("Gemini Generation failed, falling back to local Socratic templates:", err);
      // Fallback below
    }
  }

  // Use Local Socratic Templates if offline/no key or if Gemini failed
  const storyMain = template.story(interest, milestone);
  const question = template.question(interest);
  const chapterTitle = `The Legend of the ${interest.charAt(0).toUpperCase() + interest.slice(1)}`;
  
  return {
    success: true,
    source: 'local-templates',
    chapterTitle,
    story: `${storyMain}\n\n${question}`,
    inquiryTitle: template.inquiryTitle,
    inquiryDetail: template.inquiryDetail,
    meta: skill.split(' & ')[0],
    conceptsMasteredIncrement: 0 // Let child solve to get the bump
  };
}

/**
 * Handle progress of interactive Socratic dialogue with child
 */
async function respondToChild(skill, dialogHistory, childMessage) {
  // If Gemini is available, utilize full context dialogue
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI();
      const messagesForGemini = [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        ...dialogHistory.map(msg => ({
          role: msg.role === 'nell' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: childMessage }] }
      ];

      const promptExtra = `Analyze the child's response: "${childMessage}".
Generate Nell's Socratic, enchanting response. In addition, evaluate if this response shows a breakthrough or a moral choice that we can record in the parent's ledger.
Return your response in strict JSON format:
{
  "nellReply": "Nell's next spoken message...",
  "milestoneTitle": "If a milestone was achieved, short title (e.g., 'Moral Choice: Split Resource' or 'Breakthrough: Solar Logic'), otherwise null",
  "milestoneDetail": "If achieved, describe what the child showed or reasoned, otherwise null",
  "isPuzzleSolved": true/false (did they successfully answer our puzzle/inquiry?),
  "solvedValue": "If solved, the exact solution or summary of their answer, otherwise empty"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [...messagesForGemini, { role: 'user', parts: [{ text: promptExtra }] }],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text.trim());
      return {
        success: true,
        source: 'gemini',
        text: parsed.nellReply,
        milestoneRecorded: parsed.milestoneTitle ? {
          title: parsed.milestoneTitle,
          detail: parsed.milestoneDetail,
          status: parsed.isPuzzleSolved ? "Mastered" : "Recorded"
        } : null,
        inquiryStatus: parsed.isPuzzleSolved ? "Solved" : "Active Inquiry",
        solvedValue: parsed.solvedValue || ""
      };
    } catch (err) {
      console.warn("Gemini Socratic response failed, using offline heuristics:", err);
    }
  }

  // Offline Socratic Heuristics
  const simulation = getSimulatedDialogueResponse(skill, dialogHistory, childMessage);
  
  let milestoneRecorded = null;
  if (simulation.milestoneRecorded) {
    milestoneRecorded = {
      title: simulation.milestoneRecorded,
      detail: `Exhibited in thoughts in response to: "${childMessage}" under the guidance of Socratic skill "${skill}".`,
      status: simulation.inquiryStatus === "Solved" ? "Mastered" : "Recorded"
    };
  }

  return {
    success: true,
    source: 'local-heuristics',
    text: simulation.text,
    milestoneRecorded,
    inquiryStatus: simulation.inquiryStatus,
    solvedValue: simulation.solvedValue
  };
}

module.exports = {
  generateNewChapter,
  respondToChild
};
