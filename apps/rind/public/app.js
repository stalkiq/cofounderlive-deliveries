// RIND MULTI-SCREEN CONTROLLER AND SATIETY GEOMETRY MORPHER

// State tracking
let currentScreen = 'assessment';
let currentSatietyIndex = 42; // Baseline from product-spec
let satietyMorphFactor = 0.2; // 0 = Chronic restriction (jagged), 1 = Optimal abundance (circle)
let memoryStore = { assessments: [], plans: [], notes: [] };

// Canvas Geometry configuration
const canvas = document.getElementById('satiety-canvas');
const ctx = canvas.getContext('2d');
let animationFrameId;

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  switchTab('assessment');
  fetchMemoryLedger();
  fetchSystemStatus();
  
  // Launch our canvas render cycle
  startSatietyMorphCycle();

  // Attach DOM Listeners
  document.getElementById('assessment-form').addEventListener('submit', reportAssessmentSubmission);
  document.getElementById('btn-generate-recipe').addEventListener('click', generateCustomSatietyRecipe);
  document.getElementById('btn-assess-to-planner').addEventListener('click', () => switchTab('engine'));

  // Watch select boxes to dynamically warp the Canvas Hunger Geometry
  document.getElementById('assess-satiety-slider').addEventListener('change', adjustMorphFactorFromInputs);
  document.getElementById('assess-fiber').addEventListener('change', adjustMorphFactorFromInputs);
  document.getElementById('assess-focus').addEventListener('change', adjustMorphFactorFromInputs);
});

// Update Satiety morph based on selected profile metrics
function adjustMorphFactorFromInputs() {
  const sliderVal = document.getElementById('assess-satiety-slider').value;
  const fiberVal = document.getElementById('assess-fiber').value;
  
  let tempFactor = 0.2;

  if (sliderVal.includes('Peak')) {
    tempFactor += 0.4;
  } else if (sliderVal.includes('Solid')) {
    tempFactor += 0.25;
  } else if (sliderVal.includes('Moderate')) {
    tempFactor += 0.1;
  }

  if (fiberVal.includes('25g to 40g')) {
    tempFactor += 0.4;
  } else if (fiberVal.includes('15g to 25g')) {
    tempFactor += 0.2;
  }

  // Cap factor between 0.1 and 1.0
  satietyMorphFactor = Math.min(Math.max(tempFactor, 0.1), 1.0);
}

// Draw and morph the physical satiety shape on an HTML5 canvas
function startSatietyMorphCycle() {
  let phase = 0;

  function draw() {
    if (!canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // The visual target radius is bounded
    const baselineRadius = 42;
    const numPoints = 28;
    
    ctx.beginPath();
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      
      // Calculate a secondary jitter to represent active metabolic noise / hunger signal spikes
      const noiseIntensity = (1.0 - satietyMorphFactor); // more jagged when morph factor is low
      const waveFreq = i % 2 === 0 ? 1 : -1;
      
      // Interpolate radius between jagged teeth (high noise) and solid circle (abundance)
      const dynamicJitter = Math.sin(phase + i * 1.5) * 8 * noiseIntensity;
      const staticTeeth = waveFreq * 16 * noiseIntensity;
      
      const currentRadius = baselineRadius + (staticTeeth + dynamicJitter) * (1 - satietyMorphFactor);
      
      const x = centerX + Math.cos(angle) * currentRadius;
      const y = centerY + Math.sin(angle) * currentRadius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    
    // Gradient coloring reflecting health: transition from red-orange to dense culinary green
    const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 60);
    
    if (satietyMorphFactor < 0.45) {
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.5, '#E6DCD3');
      gradient.addColorStop(1, '#D95032'); // Accent hot orange/red
      ctx.strokeStyle = '#D95032';
    } else {
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.6, '#E6DCD3');
      gradient.addColorStop(1, '#2C3E2B'); // Primary rich sage green
      ctx.strokeStyle = '#2C3E2B';
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw core center core
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#1C1C1C';
    ctx.fill();

    phase += 0.045; // shape shifts slowly in background
    animationFrameId = requestAnimationFrame(draw);
  }
  
  draw();
}

// Navigation flow tab switcher helper
function switchTab(screenName) {
  currentScreen = screenName;
  
  // Hide all screens
  document.querySelectorAll('.screen-view').forEach(elem => {
    elem.classList.add('hidden');
  });
  
  // Deactivate all nav options
  document.querySelectorAll('nav button').forEach(elem => {
    elem.classList.add('opacity-60');
    elem.classList.remove('opacity-100', 'text-rindAccent');
  });

  // Reveal targeted screen
  const targetView = document.getElementById(`screen-${screenName}`);
  if (targetView) targetView.classList.remove('hidden');

  // Highlight bottom navigation button
  const targetNavBtn = document.getElementById(`nav-btn-${screenName}`);
  if (targetNavBtn) {
    targetNavBtn.classList.remove('opacity-60');
    targetNavBtn.classList.add('opacity-100', 'text-rindAccent');
  }

  // Adjust visualization slider if switching screens
  if (screenName === 'engine' && satietyMorphFactor < 0.4) {
    // moderate enhancement of stomach state because they shifted to meal planning
    satietyMorphFactor = Math.max(satietyMorphFactor, 0.4);
  }
}

// API CALL: Load assessments and history from server database memory
async function fetchMemoryLedger() {
  try {
    const response = await fetch('/api/memory');
    const result = await response.json();
    
    if (result.success && result.data) {
      memoryStore = result.data;
      updateMemoryUI();
    }
  } catch (err) {
    console.error("Failed to reload memory repository endpoints:", err);
  }
}

// API CALL: Fetch backend node and gemini environment status
async function fetchSystemStatus() {
  try {
    const response = await fetch('/api/status');
    const status = await response.json();
    
    const badgeText = document.getElementById('api-status-text');
    const badgeContainer = document.getElementById('api-status-badge');
    
    if (status.success) {
      if (status.env.geminiConnected) {
        badgeText.textContent = "Gemini Active";
        badgeContainer.classList.add('border-green-600/30');
      } else {
        badgeText.textContent = "Offline Fallback";
        badgeContainer.classList.add('border-rindAccent/30');
      }
    }
  } catch (err) {
    console.warn("Could not query server status metrics.");
  }
}

// Synchronize memory store arrays onto page widgets
function updateMemoryUI() {
  // Update counts
  const countAssess = document.getElementById('count-assessments');
  const countPlans = document.getElementById('count-plans');
  if (countAssess) countAssess.textContent = memoryStore.assessments?.length || 0;
  if (countPlans) countPlans.textContent = memoryStore.plans?.length || 0;

  // Load configured preferences
  if (memoryStore.config) {
    const fiberGoalWidget = document.getElementById('settings-fiber-goal');
    if (fiberGoalWidget) fiberGoalWidget.value = memoryStore.config.dailyFiberGoal || 30;
  }

  // Populate Assessment index history
  const assessHistoryBox = document.getElementById('history-assessments');
  if (assessHistoryBox) {
    if (!memoryStore.assessments || memoryStore.assessments.length === 0) {
      assessHistoryBox.innerHTML = `<p class="text-[11px] italic text-rindText/60">No assessments completed.</p>`;
    } else {
      assessHistoryBox.innerHTML = memoryStore.assessments.map(item => `
        <div class="p-2 border-b border-rindSurface text-[11px] hover:bg-rindSurface/20">
          <div class="flex justify-between font-bold">
            <span class="text-rindAccent">${item.satietySlider.split(':')[0]}</span>
            <span class="opacity-70">${new Date(item.timestamp).toLocaleDateString()}</span>
          </div>
          <p class="text-[10px] text-rindText/80 mt-0.5">${item.focusGroup} | ${item.dietaryPattern}</p>
        </div>
      `).join('');
    }
  }

  // Populate generated meal plans listings inside settings accordion & meal logs
  const plansHistoryBox = document.getElementById('history-plans');
  const enginePlansBox = document.getElementById('recipe-history-log');

  if (plansHistoryBox) {
    if (!memoryStore.plans || memoryStore.plans.length === 0) {
      plansHistoryBox.innerHTML = `<p class="text-[11px] italic text-rindText/60">No meal plans calculated.</p>`;
      if (enginePlansBox) {
        enginePlansBox.innerHTML = `<p class="text-xs italic text-rindText/60 p-2 border border-dashed border-rindSurface">No custom calculations saved in database yet.</p>`;
      }
    } else {
      // Accordion lists
      plansHistoryBox.innerHTML = memoryStore.plans.map(p => {
        const r = p.recipe;
        return `
          <div class="p-2 border-b border-rindSurface text-[11px] flex justify-between items-center hover:bg-rindSurface/45 cursor-pointer" onclick="viewSavedHistoricalRecipe('${p.id}')">
            <div>
              <strong class="text-rindPrimary block">${r.recipeName}</strong>
              <span class="text-[9px] text-rindText/60">${new Date(p.timestamp).toLocaleDateString()} - Satiety Score: ${r.satietyScore}</span>
            </div>
            <span class="text-[9px] border border-rindAccent text-rindAccent px-1 font-bold">Load</span>
          </div>
        `;
      }).join('');

      // Engine logs list
      if (enginePlansBox) {
        enginePlansBox.innerHTML = memoryStore.plans.map(p => {
          const r = p.recipe;
          return `
            <div class="p-3 border border-rindSurface bg-rindSurface/10 flex justify-between items-start hover:border-rindAccent cursor-pointer" onclick="viewSavedHistoricalRecipe('${p.id}')">
              <div class="flex-1 pr-3">
                <span class="text-[9px] uppercase tracking-widest bg-rindPrimary/10 text-rindPrimary font-bold px-1.5 py-0.5">${r.satietyScore} Satiety</span>
                <h4 class="serif-text font-bold text-sm text-rindPrimary mt-1">${r.recipeName}</h4>
                <p class="text-[11px] text-rindText/70 mt-0.5 line-clamp-1">${r.description}</p>
              </div>
              <span class="text-[10px] text-rindAccent font-bold pt-1">Inspect →</span>
            </div>
          `;
        }).join('');
      }
    }
  }
}

// UI WORKFLOW POST: Submit metabolic profile details to durable storage
async function reportAssessmentSubmission(evt) {
  evt.preventDefault();
  
  const submitBtn = document.getElementById('btn-submit-assessment');
  submitBtn.disabled = true;
  submitBtn.textContent = "Processing Profile...";

  const payload = {
    satietySlider: document.getElementById('assess-satiety-slider').value,
    dietaryPattern: document.getElementById('assess-dietary-pattern').value,
    struggle: document.getElementById('assess-struggle').value,
    fiberTarget: document.getElementById('assess-fiber').value,
    focusGroup: document.getElementById('assess-focus').value
  };

  try {
    const response = await fetch('/api/memory', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "assessment",
        payload: payload
      })
    });

    const result = await response.json();
    if (result.success) {
      // Adjust values
      currentSatietyIndex = 42; // baseline default
      if (payload.satietySlider.includes("Peak")) currentSatietyIndex = 82;
      else if (payload.satietySlider.includes("Solid")) currentSatietyIndex = 65;
      else if (payload.satietySlider.includes("Moderate")) currentSatietyIndex = 51;

      document.getElementById('current-satiety-val').textContent = `${currentSatietyIndex}%`;
      
      // Trigger canvas circle stability
      satietyMorphFactor = Math.min(satietyMorphFactor + 0.35, 1.0);

      // Render success alert panel
      document.getElementById('assess-success-title').textContent = "Assessment Complete & Recorded";
      document.getElementById('assess-success-message').innerHTML = `
        Your Abundance Index is computed at <strong class="text-rindAccent">${currentSatietyIndex}%</strong>. Your metabolic profile indicates high caloric restriction fatigue.
        Based on your selection of <span class="underline">${payload.focusGroup}</span>, head directly to the Satiety Engine below to formulate high-volume, biological-rich meal plans.
      `;
      document.getElementById('assess-saved-time').textContent = new Date(result.entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      const responseBox = document.getElementById('assessment-response');
      responseBox.classList.remove('hidden');
      responseBox.scrollIntoView({ behavior: 'smooth' });

      // Reload memory arrays
      await fetchMemoryLedger();
    }
  } catch (err) {
    console.error("Failed to commit user assessment configuration to memory:", err);
    alert("Memory database is offline, assessment cannot be completed locally.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Generate Satiety Profile";
  }
}

// UI WORKFLOW POST: Request Satiety Planner to synthesize dynamic whole-food menu item
async function generateCustomSatietyRecipe() {
  const ingredientsInput = document.getElementById('engine-input-ingredients').value.trim();
  const selectFocus = document.getElementById('engine-select-focus').value;
  const selectDiet = document.getElementById('engine-select-diet').value;
  const selectStruggle = document.getElementById('engine-select-struggle').value;

  const generateBtn = document.getElementById('btn-generate-recipe');
  const loader = document.getElementById('spinner-loader');

  // Disable button & animate spinner
  generateBtn.disabled = true;
  loader.classList.remove('hidden');

  const payload = {
    ingredients: ingredientsInput || selectFocus,
    focusGroup: selectFocus,
    dietaryPattern: selectDiet,
    struggle: selectStruggle,
    satietySlider: currentSatietyIndex + "% Index Status"
  };

  try {
    const response = await fetch('/api/satiety-plan', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success && result.data) {
      renderRecipeTemplate(result.data.recipe, result.data.aiGenerated);
      
      // Animate satiety shape circle to beautiful balance rind (closer to 1.0 abundance)
      satietyMorphFactor = Math.min(satietyMorphFactor + 0.4, 0.95);

      // Refresh listings
      await fetchMemoryLedger();
    }
  } catch (err) {
    console.error("Recipe planner calculation error:", err);
    alert("The culinary satiety engine was unable to formulate your requirements. Please check connection.");
  } finally {
    generateBtn.disabled = false;
    loader.classList.add('hidden');
  }
}

// Render JSON recipe returned onto the planner viewer widget
function renderRecipeTemplate(recipe, fromAI) {
  document.getElementById('recipe-title').textContent = recipe.recipeName;
  document.getElementById('recipe-score').textContent = recipe.satietyScore;
  document.getElementById('recipe-prep').textContent = recipe.prepTime || "15 mins prep";
  document.getElementById('recipe-volume').textContent = recipe.volumeIndex || "Optimal Satiety";
  document.getElementById('recipe-description').textContent = recipe.description;
  
  // Biological fields
  document.getElementById('macro-fiber').textContent = recipe.macronutrientFocus?.fiber || "Under 15g";
  document.getElementById('macro-protein').textContent = recipe.macronutrientFocus?.protein || "Slow-absorb Protein";
  document.getElementById('macro-signal').textContent = recipe.macronutrientFocus?.satietyHormoneTrigger || "Peptide signaling";

  // Ingredients lists
  const ingredientsList = document.getElementById('recipe-ingredients-list');
  ingredientsList.innerHTML = '';
  recipe.ingredients.forEach(ing => {
    const li = document.createElement('li');
    li.textContent = ing;
    ingredientsList.appendChild(li);
  });

  // Steps
  const instructionsList = document.getElementById('recipe-instructions-list');
  instructionsList.innerHTML = '';
  recipe.instructions.forEach(step => {
    const li = document.createElement('li');
    li.className = "mb-1";
    li.textContent = step;
    instructionsList.appendChild(li);
  });

  // Rationale
  document.getElementById('recipe-rationale').textContent = recipe.culinaryRationale || "Volume crowd-outs cravings.";

  // Source descriptor
  document.getElementById('recipe-source-badge').textContent = fromAI ? 
    "Satiety Generation: Custom Gemini AI Planner Optimized" : 
    "Satiety Generation: Rind Rule-Based Expert Offline Engine";

  // Reveal block
  const wrapper = document.getElementById('generated-recipe-wrapper');
  wrapper.classList.remove('hidden');
  wrapper.scrollIntoView({ behavior: 'smooth' });
}

// Reload a previously saved recipe directly from client memory state
function viewSavedHistoricalRecipe(planId) {
  const plan = memoryStore.plans.find(p => p.id === planId);
  if (plan) {
    switchTab('engine');
    renderRecipeTemplate(plan.recipe, plan.aiGenerated);
    if (plan.timestamp) {
      document.getElementById('recipe-timestamp').textContent = new Date(plan.timestamp).toLocaleDateString();
    }
  }
}

// Catalog Editorial Drawer Actions
function openEditorialDetail(key) {
  const popup = document.getElementById('editorial-popup-drawer');
  const title = document.getElementById('popup-title');
  const body = document.getElementById('popup-body');
  const blocks = document.getElementById('popup-content-block');
  const eyebrow = document.getElementById('popup-eyebrow');

  popup.classList.remove('hidden');

  if (key === 'romanesco') {
    eyebrow.textContent = "Culinaria Chapter 4";
    title.textContent = "Charred Romanesco & Pistachio Gremolata";
    body.textContent = "A visually dramatic, geometry-defying brassica recipe. Slicing romanesco vertically into flat steak shapes maximizes the heat contact on cast iron, unleashing caramelized nuttiness. The high physical fiber mesh traps stomach resources, leading to incredibly gradual carbohydrate integration.";
    blocks.innerHTML = `
      <div class="grid grid-cols-2 gap-2 text-[10px]">
        <span class="font-bold text-rindAccent">SATIETY INDEX: 9.4/10</span>
        <span class="font-bold">PREP TIME: 15 Mins</span>
        <span>Fiber Volume: Outstanding</span>
        <span>Protein Source: Whole seeds</span>
      </div>
    `;
  } else if (key === 'salmon') {
    eyebrow.textContent = "Culinaria Chapter 12";
    title.textContent = "Slow-Roasted Salmon in Wild Sorrel Broth";
    body.textContent = "The perfect synthesis of amino acid fullness and gastric volume stretch. Slow-cooking fish tissue at very low heat limits protein coagulation, ensuring a meltingly tender mouthfeel. Prebiotic elements in wild sorrel supply double the digestion longevity.";
    blocks.innerHTML = `
      <div class="grid grid-cols-2 gap-2 text-[10px]">
        <span class="font-bold text-rindAccent">SATIETY INDEX: 8.9/10</span>
        <span class="font-bold">PREP TIME: 30 Mins</span>
        <span>Essential Omegas: Extremely High</span>
        <span>Stretch Trigger: Bone Broth Liquid</span>
      </div>
    `;
  } else if (key === 'science') {
    eyebrow.textContent = "Metabolic Science Dossier";
    title.textContent = "The Science of Volumetrics";
    body.textContent = "How do we reset weight loss permanently? Your intestine contains stretch receptors linked to your vagus nerve. By prioritizing high-water high-fiber intact whole ingredients ('crowding out'), we stimulate natural satiety hormones like PYY and GLP-1 fully before calorie totals get out of hand. Restriction triggers metabolic starvation reflexes; Food Abundance triggers biological peace.";
    blocks.innerHTML = `
      <div class="text-[10px] space-y-1">
        <strong>The Satiety Equation:</strong>
        <p class="font-serif italic bg-rindBg p-2 text-rindPrimary font-semibold">Satiety = (Water Mass + Intact Fiber) / Starch Velocity * Protein Leverage</p>
      </div>
    `;
  }

  popup.scrollIntoView({ behavior: 'smooth' });
}

function closeEditorialDrawer() {
  document.getElementById('editorial-popup-drawer').classList.add('hidden');
}

// Client configuration actions
async function saveConfigSettings() {
  const goal = parseInt(document.getElementById('settings-fiber-goal').value) || 30;
  
  try {
    const response = await fetch('/api/memory', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "config",
        payload: { dailyFiberGoal: goal }
      })
    });
    
    const result = await response.json();
    if (result.success) {
      alert("Configuration updated in durable storage successfully!");
      fetchMemoryLedger();
    }
  } catch (err) {
    alert("Connection to backend memory database interrupted.");
  }
}

// Clear mock / user memory storage file securely (sets defaults)
async function resetDataStore() {
  if (!confirm("Are you sure you want to clear your local assessment and recipe history?")) {
    return;
  }
  
  // Custom quick configuration memory write to clear arrays
  const emptyState = {
    assessments: [],
    plans: [],
    notes: [],
    config: { dailyFiberGoal: 30, userName: "Culinary Explorer" }
  };

  try {
    const response = await fetch('/api/memory', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "config",
        payload: emptyState
      })
    });
    
    // We force clear on backend side simple mock trick
    alert("Database state reset to baseline default successfully.");
    window.location.reload();
  } catch (err) {
    alert("Reset failed.");
  }
}

// Accordion toggle helper
function toggleAccordion(widgetId) {
  const el = document.getElementById(widgetId);
  if (el) {
    el.classList.toggle('hidden');
  }
}
