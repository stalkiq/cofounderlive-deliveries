// Ample Client Application - Google One-Tap & Satiety Plate Builder

let activeUserSession = null;

// Initialize app when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Check local storage for authenticated Google session
  const savedSession = localStorage.getItem("ample_google_session");
  if (savedSession) {
    activeUserSession = JSON.parse(savedSession);
    updateGoogleSignInUI();
  }

  // Set up event listeners
  setupEventListeners();

  // Load ledger history on start
  loadKitchenHistoryLedger();

  // Draw initial Lucide Icons
  lucide.createIcons();
});

// App Tab / Screen Navigation
window.navigateToTab = function(tabId) {
  // Hide all screens
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));

  // Deactivate all nav buttons
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => btn.classList.remove('active'));

  // Activate target screen
  const targetScreen = document.getElementById(`screen-${tabId}`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }

  // Activate target nav button
  const targetNavBtn = document.getElementById(`nav-${tabId}`);
  if (targetNavBtn) {
    targetNavBtn.classList.add('active');
  }

  // Special hooks on navigating
  if (tabId === 'journal') {
    loadKitchenHistoryLedger();
  }

  // Retrigger icon generation for dynamically injected or altered DOM parts
  setTimeout(() => {
    lucide.createIcons();
  }, 50);
}

// Global Event Listeners setup
function setupEventListeners() {
  // 1) Google Auth Button
  const btnGoogle = document.getElementById("btn-google-signin");
  if (btnGoogle) {
    btnGoogle.addEventListener("click", () => {
      simulateGoogleSignIn();
    });
  }

  // 2) One-Click Plan Quick Scale buttons
  const hungerCards = document.querySelectorAll("#screen-planner .hunger-card");
  hungerCards.forEach(card => {
    const btn = card.querySelector(".select-volume-btn");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent card double trigger
        const hunger = card.getAttribute("data-hunger");
        const goal = card.getAttribute("data-goal");
        triggerOneClickPlan(hunger, goal);
      });
    }

    card.addEventListener("click", () => {
      const hunger = card.getAttribute("data-hunger");
      const goal = card.getAttribute("data-goal");
      triggerOneClickPlan(hunger, goal);
    });
  });

  // 3) Hearth Builder Form Submission
  const plateForm = document.getElementById("plate-builder-form");
  if (plateForm) {
    plateForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleBuildPlateFormSubmit();
    });
  }

  // 4) Reload Seed Button
  const btnReload = document.getElementById("btn-clear-demo");
  if (btnReload) {
    btnReload.addEventListener("click", () => {
      triggerLedgerReload();
    });
  }
}

// 1. Google One-Tap Auth Simulation
function simulateGoogleSignIn() {
  const googleMockUser = {
    name: "Morgan Hearth",
    email: "morgan@hearthside.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
  };

  activeUserSession = googleMockUser;
  localStorage.setItem("ample_google_session", JSON.stringify(googleMockUser));
  
  // Show header user profile Info badge
  updateGoogleSignInUI();

  showToast("Welcome Morgan! Google Security Sync active.");
  
  // Instantly redirect onboarding page to the Main Workflow Screen
  setTimeout(() => {
    navigateToTab('planner');
  }, 1000);
}

function updateGoogleSignInUI() {
  const profileDiv = document.getElementById("user-header-profile");
  if (profileDiv) {
    if (activeUserSession) {
      profileDiv.style.display = "flex";
      // Update google btn text if viewing onboarding
      const googleBtnSpan = document.querySelector("#btn-google-signin span");
      if (googleBtnSpan) {
        googleBtnSpan.textContent = "Google Session Linked";
      }
    } else {
      profileDiv.style.display = "none";
    }
  }
}


// 2. One-Click Plan Trigger (Saves instantly to memory)
async function triggerOneClickPlan(hunger, goal) {
  showToast(`Scaling a perfect plate for: "${hunger}"...`);

  // Simple cravings based on hunger
  let simulatedCraving = "Hearty skillet surprise";
  if (hunger.includes("peckish")) simulatedCraving = "Warming toast & light broth";
  if (hunger.includes("Starving")) simulatedCraving = "Filling volumetric fiber bowls";

  const payload = {
    craving: simulatedCraving,
    hungerLevel: hunger,
    primaryGoal: goal,
    user: activeUserSession
  };

  try {
    const response = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.success) {
      showToast("Plate constructed on Satiety-First principles!");
      
      // Load resulting details instantly into the assistant screen and navigate there
      displayGeneratedResult(result.record);
      
      setTimeout(() => {
        navigateToTab("assistant");
      }, 500);
    } else {
      showToast("Error creating plate. Try again.");
    }
  } catch (err) {
    console.error(err);
    showToast("Server connection failed. Offline mode active.");
  }
}


// 3. Custom Hearth Assistant Plate Builder Form Handler
async function handleBuildPlateFormSubmit() {
  const cravingVal = document.getElementById("craving-input").value;
  const hungerVal = document.getElementById("hunger-select").value;
  const goalVal = document.getElementById("goal-select").value;

  const btnText = document.getElementById("btn-text");
  const btnSpinner = document.getElementById("btn-spinner");
  const submitBtn = document.getElementById("build-plate-btn");

  // Show Loading Spinner state
  submitBtn.disabled = true;
  btnText.textContent = "Scaling Plate Portions...";
  btnSpinner.style.display = "inline-block";

  const payload = {
    craving: cravingVal,
    hungerLevel: hungerVal,
    primaryGoal: goalVal,
    user: activeUserSession
  };

  try {
    const response = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    // Hide Loading Spinner state
    submitBtn.disabled = false;
    btnText.textContent = "🔥 Build My Plate";
    btnSpinner.style.display = "none";

    if (data.success) {
      // Clear Craving Form Input
      document.getElementById("craving-input").value = "";
      
      // Display New Generated Satiety Card
      displayGeneratedResult(data.record);
      showToast("New plate logged in Kitchen History!");

      // Scroll to generated result view smoothly
      setTimeout(() => {
        const resultCard = document.getElementById("latest-result-container");
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } else {
      showToast("Server error when loading assistant guide.");
    }

  } catch (err) {
    console.error(err);
    submitBtn.disabled = false;
    btnText.textContent = "🔥 Build My Plate";
    btnSpinner.style.display = "none";
    showToast("Network error. Try setting up node server first!");
  }
}

// Render helper for results
function displayGeneratedResult(record) {
  const resultContainer = document.getElementById("latest-result-container");
  if (!resultContainer) return;

  const statusEl = document.getElementById("result-status");
  const scoreEl = document.getElementById("result-score");
  const titleEl = document.getElementById("result-title");
  const detailEl = document.getElementById("result-detail");
  const timeEl = document.getElementById("result-time");

  // Populate values
  if (statusEl) statusEl.textContent = record.status;
  if (scoreEl) scoreEl.textContent = `Satiety Score: ${record.satietyScore}`;
  if (titleEl) titleEl.textContent = record.plateTitle;
  if (detailEl) detailEl.textContent = record.plateDetail;
  if (timeEl) {
    const dt = new Date(record.timestamp);
    timeEl.textContent = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " (Just Now)";
  }

  // Handle visual volume guide colors depending on hunger level
  const portionVeg = resultContainer.querySelector(".portion-veg span");
  if (portionVeg) {
    if (record.hungerLevel.includes("Extremely") || record.status === "Max Volume") {
      portionVeg.textContent = "🥗 65% fiber greens";
    } else if (record.hungerLevel.includes("peckish") || record.status === "Light Volume") {
      portionVeg.textContent = "🥗 45% light volume";
    } else {
      portionVeg.textContent = "🥗 50% satiety fiber";
    }
  }

  resultContainer.style.display = "block";
}


// 4. Kitchen Ledgers Memory Core (Sync load from Server GET)
async function loadKitchenHistoryLedger() {
  const container = document.getElementById("history-stream-container");
  if (!container) return;

  try {
    const response = await fetch("/api/memory");
    if (!response.ok) {
      throw new Error(`Load ledger status failed: ${response.status}`);
    }

    const plates = await response.json();
    
    // Update live metrics counter on history page
    const totalMealsEl = document.getElementById("stats-total-meals");
    if (totalMealsEl) {
      totalMealsEl.textContent = plates.length;
    }

    if (plates.length === 0) {
      container.innerHTML = `
        <div class="history-placeholder">
          <p>No plates built yet! Tap 'One-Click' or 'Build Plate' to feed Ample's hearth ledger memory.</p>
        </div>
      `;
      return;
    }

    // Render entries
    container.innerHTML = plates.map(plate => {
      const createdTime = new Date(plate.timestamp);
      const timeStr = createdTime.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ", " + 
                      createdTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const avatarOutput = plate.user 
        ? `<div class="user-tag"><img src="${plate.user.avatar}" alt="user"> <span>${plate.user.name.split(' ')[0]}</span></div>`
        : `<div class="user-tag">🦖 <span>Demo Guest</span></div>`;

      return `
        <div class="stream-item" id="item-${plate.id}">
          <div class="stream-item-top">
            <div>
              <h4 class="stream-item-title">${plate.plateTitle}</h4>
              <div class="stream-meta-box">
                <span class="meta-micro">${plate.status}</span>
                <span class="meta-micro val-rating">Satiety ${plate.satietyScore.split('/')[0]}/10</span>
                <span class="meta-micro">${plate.hungerLevel.split(' ')[0]}</span>
              </div>
            </div>
            <!-- Delete Button (Sync Delete API calls) -->
            <button class="item-delete-btn" onclick="deletePlateRecord('${plate.id}')" title="Delete entry from kitchen ledger">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
          <p class="stream-item-body">${plate.plateDetail}</p>
          <div class="stream-item-footer">
            <span>${timeStr}</span>
            ${avatarOutput}
          </div>
        </div>
      `;
    }).join('');

    // Trigger Lucide icons generation for the newly created HTML buttons
    lucide.createIcons();

  } catch (err) {
    console.error("Ledger history fetch failed:", err);
    container.innerHTML = `
      <div class="history-placeholder" style="color: #A63A2B; border-color: rgba(166,58,43,0.3);">
        <p>Could not load database. Run <code class="code-badge">npm start</code> to fire up live database syncing!</p>
      </div>
    `;
  }
}

// 5. Delete specific plate record via fetch DELETE /api/memory/:id
window.deletePlateRecord = async function(id) {
  if (!confirm("Are you sure you want to remove this memory plate from your kitchen ledger?")) {
    return;
  }

  try {
    const response = await fetch(`/api/memory/${id}`, {
      method: "DELETE"
    });

    const result = await response.json();
    if (result.success) {
      // Remove element from DOM immediately with nice visual animation transition
      const element = document.getElementById(`item-${id}`);
      if (element) {
        element.style.transition = "all 0.3s ease-out";
        element.style.opacity = "0";
        element.style.transform = "scale(0.9)";
        setTimeout(() => {
          element.remove();
          // Reload counts & state list to keep values matching
          loadKitchenHistoryLedger();
        }, 300);
      }
      showToast("Meal removed from hearth ledger.");
    } else {
      showToast("Could not remove meal: " + result.error);
    }
  } catch (err) {
    console.error("Meal delete request failed:", err);
    showToast("Offline mode. Run Express backend server is required.");
  }
}

// 6. Reload seed presets tool
function triggerLedgerReload() {
  showToast("Re-linking ledger entries...");
  // Clear localStorage auth so guests can restart freshly if they like
  localStorage.removeItem("ample_google_session");
  activeUserSession = null;
  updateGoogleSignInUI();
  
  // Reload ledger page
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}


// Global custom Toast displayer
function showToast(message) {
  const toast = document.getElementById("toast");
  const toastText = document.getElementById("toast-text");
  if (!toast || !toastText) return;

  toastText.textContent = message;
  toast.classList.add("show");

  // Clear timeout to hide toast
  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }

  window.toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}
