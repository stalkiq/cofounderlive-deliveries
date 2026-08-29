// Client-side script for Nell - The Living Primer

document.addEventListener('DOMContentLoaded', () => {
    // STATE Variables
    let appState = null;

    // DOM Elements
    const navButtons = document.querySelectorAll('.nav-btn');
    const screenSections = document.querySelectorAll('.screen-section');
    const resetBtn = document.getElementById('reset-button');
    const geminiStatus = document.getElementById('gemini-status');

    // Screen 1 Elements
    const chatHistory = document.getElementById('chat-history-container');
    const chatForm = document.getElementById('chat-input-form');
    const chatInput = document.getElementById('chat-message-input');
    const inquiriesContainer = document.getElementById('inquiries-container');
    const solveSelect = document.getElementById('solve-inquiry-select');
    const solveForm = document.getElementById('solve-inquiry-form');
    const solveValue = document.getElementById('solve-inquiry-value');

    // Metrics (Header & Ledger)
    const metricChapter = document.getElementById('metric-chapter');
    const metricSpark = document.getElementById('metric-spark');
    const ledgerConcepts = document.getElementById('ledger-metric-concepts');
    const ledgerMoral = document.getElementById('ledger-metric-moral');
    const ledgerHours = document.getElementById('ledger-metric-hours');

    // Screen 2 Elements
    const timelineContainer = document.getElementById('timeline-container');
    const milestoneForm = document.getElementById('milestone-form');

    // Screen 3 Elements
    const inscribeForm = document.getElementById('inscribe-form');
    const inscribeHistory = document.getElementById('inscryptions-history-container');

    // Toast Notification Container
    const toastContainer = document.getElementById('notification-container');

    // =========================================================================
    // Core Navigation
    // =========================================================================
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            
            // Toggle sidebar button styles
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle screens
            screenSections.forEach(scr => {
                if (scr.id === target) {
                    scr.classList.add('active');
                    scr.dispatchEvent(new Event('show')); // Custom trigger for view refreshment if needed
                } else {
                    scr.classList.remove('active');
                }
            });
        });
    });

    // =========================================================================
    // Helper: Show Beautiful Toast Notification
    // =========================================================================
    function showNotification(title, message) {
        const toast = document.createElement('div');
        toast.className = 'notification';
        toast.innerHTML = `
            <span class="notification-title">⚜️ ${title}</span>
            <span class="notification-message">${message}</span>
        `;
        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.5s ease';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }

    // =========================================================================
    // API Synchronizers
    // =========================================================================
    
    // Fetch state from server and update all panels
    async function refreshState() {
        try {
            const res = await fetch('/api/state');
            const result = await res.json();
            if (result.success) {
                appState = result.data;
                
                // Update Socratic Dialogue system status
                if (result.isSimulated) {
                    geminiStatus.classList.add('simulated');
                    geminiStatus.querySelector('.status-text').textContent = 'Dialogue Engine: Simulated';
                } else {
                    geminiStatus.classList.remove('simulated');
                    geminiStatus.querySelector('.status-text').textContent = 'Dialogue Engine: Live Gemini';
                }

                renderAll();
            }
        } catch (err) {
            console.error('Error fetching Nell state:', err);
            showNotification('Sync Interrupted', 'Could not sync the living book with durable storage.');
        }
    }

    // Render entire DOM based on the appState
    function renderAll() {
        if (!appState) return;

        // 1. Render Metrics
        metricChapter.textContent = appState.metrics.activeChapter;
        metricSpark.textContent = appState.metrics.socraticSpark;
        ledgerConcepts.textContent = appState.metrics.conceptsMastered;
        ledgerMoral.textContent = appState.metrics.moralCompass;
        ledgerHours.textContent = `${appState.metrics.hoursEngaged}h`;

        // 2. Render Chat History
        renderChat();

        // 3. Render Inquiries Pane & Solve Selector
        renderInquiries();

        // 4. Render Ledger Milestones Timeline
        renderMilestones();

        // 5. Render Historical Inscriptions (Workshop)
        renderInscriptions();
    }

    // Render Socratic conversation bubbles
    function renderChat() {
        chatHistory.innerHTML = '';
        appState.dialogueHistory.forEach(msg => {
            const bubble = document.createElement('div');
            const isNell = msg.sender.toLowerCase() === 'nell';
            bubble.className = `chat-bubble ${isNell ? 'nell' : 'child'}`;
            
            // Format timestamps slightly nicer
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            bubble.innerHTML = `
                <div class="meta">${msg.sender} • ${timeStr}</div>
                <div class="text-content">${formatText(msg.text)}</div>
            `;
            chatHistory.appendChild(bubble);
        });
        
        // Auto Scroll to Bottom of Dialogue
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Helper to format linebreaks and markdown bolding
    function formatText(text) {
        // Simple markdown formatter
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        return formatted;
    }

    // Render inquiries right panel & dropdown lists
    function renderInquiries() {
        inquiriesContainer.innerHTML = '';
        solveSelect.innerHTML = '<option value="" disabled selected>Select Inquiry</option>';

        if (appState.activeInquiries.length === 0) {
            inquiriesContainer.innerHTML = `<p class="system-message">No active inquiries recorded.</p>`;
            return;
        }

        appState.activeInquiries.forEach(inq => {
            const isSolved = inq.status.toLowerCase() === 'solved';
            
            const item = document.createElement('div');
            item.className = `inquiry-item ${isSolved ? 'solved' : ''}`;
            
            item.innerHTML = `
                <div class="inquiry-row">
                    <span class="inquiry-title">${inq.title}</span>
                    <span class="inquiry-status ${isSolved ? 'status-solved' : 'status-active'}">${inq.status}</span>
                </div>
                <p class="inquiry-detail">${inq.detail}</p>
                ${isSolved ? `<div class="inquiry-solution">💡 Resolved: <em>${inq.value}</em></div>` : ''}
                <span class="inquiry-meta">${inq.meta}</span>
            `;
            inquiriesContainer.appendChild(item);

            // Add unsolved inquiries to quick-solve dropdown selector
            if (!isSolved) {
                const opt = document.createElement('option');
                opt.value = inq.id;
                opt.textContent = inq.title;
                solveSelect.appendChild(opt);
            }
        });
    }

    // Render milestones list
    function renderMilestones() {
        timelineContainer.innerHTML = '';
        if (appState.milestones.length === 0) {
            timelineContainer.innerHTML = `<p class="system-message">No developmental milestones registered yet.</p>`;
            return;
        }

        appState.milestones.forEach(m => {
            const isMastered = m.status.toLowerCase() === 'mastered';
            const item = document.createElement('div');
            item.className = 'timeline-item';
            
            item.innerHTML = `
                <div class="timeline-header">
                    <span class="timeline-title">${m.title}</span>
                    <span class="timeline-meta">${m.meta}</span>
                </div>
                <div class="timeline-detail">${m.detail}</div>
                <span class="timeline-status ${isMastered ? 'status-mastered' : 'status-recorded'}">${m.status}</span>
            `;
            timelineContainer.appendChild(item);
        });
    }

    // Render parent's inscriptions history
    function renderInscriptions() {
        inscribeHistory.innerHTML = '';
        if (appState.inscribedContexts.length === 0) {
            inscribeHistory.innerHTML = `<p class="system-message">No parent contextual seeds registered yet.</p>`;
            return;
        }

        appState.inscribedContexts.forEach(ctx => {
            const card = document.createElement('div');
            card.className = 'inscryp-card';
            
            const dateStr = new Date(ctx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            card.innerHTML = `
                <div class="inscryp-header">
                    <span class="inscryp-interest">${ctx.interest}</span>
                    <span class="inscryp-date">${dateStr}</span>
                </div>
                <div class="inscryp-row"><strong>Focus Skill:</strong> ${ctx.skill}</div>
                ${ctx.challenge ? `<div class="inscryp-row"><strong>Challenge:</strong> ${ctx.challenge}</div>` : ''}
            `;
            inscribeHistory.appendChild(card);
        });
    }

    // =========================================================================
    // Forms Handling
    // =========================================================================

    // 1. Submit Socratic Dialogue Message
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        chatInput.disabled = true;

        // Optimistically append user bubble instantly
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble child';
        userBubble.innerHTML = `
            <div class="meta">Child • Just now</div>
            <div class="text-content">${formatText(text)}</div>
        `;
        chatHistory.appendChild(userBubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Scroll indicator
        const temporarySystemMsg = document.createElement('div');
        temporarySystemMsg.className = 'system-message temp-loading';
        temporarySystemMsg.textContent = 'Nell is reading your heart...';
        chatHistory.appendChild(temporarySystemMsg);

        try {
            const res = await fetch('/api/primer/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const result = await res.json();
            temporarySystemMsg.remove();
            chatInput.disabled = false;

            if (result.success) {
                // Instantly update local memory state
                appState.dialogueHistory.push(result.data.nellMessage);
                appState.metrics = result.data.metrics;
                appState.milestones = result.data.milestones;
                
                renderAll();
                chatInput.focus();
            } else {
                showNotification('Error', result.message || 'The dialogue engine had a mechanical issue.');
            }
        } catch (err) {
            console.error('Dialogue API Error:', err);
            chatInput.disabled = false;
            temporarySystemMsg.remove();
            showNotification('Timeout', 'Nell is silent. Verify your engine connections.');
        }
    });

    // 2. Submit Inquiry Solution (Right panel solver)
    solveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inqId = solveSelect.value;
        const value = solveValue.value.trim();

        if (!inqId || !value) return;

        try {
            const res = await fetch('/api/inquiries/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: inqId, value: value })
            });

            const result = await res.json();
            if (result.success) {
                solveValue.value = '';
                showNotification('Deciphered!', 'Your solution has been verified and logged.');
                refreshState();
            } else {
                showNotification('Error', result.message);
            }
        } catch (err) {
            console.error('Solve inquiry failed:', err);
            showNotification('Error', 'Check server connection.');
        }
    });

    // 3. Log Custom Parent Milestone
    milestoneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('m-title').value.trim();
        const detail = document.getElementById('m-detail').value.trim();
        const meta = document.getElementById('m-meta').value.trim();

        if (!title || !detail) return;

        try {
            const res = await fetch('/api/milestones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, detail, meta })
            });

            const result = await res.json();
            if (result.success) {
                document.getElementById('m-title').value = '';
                document.getElementById('m-detail').value = '';
                document.getElementById('m-meta').value = 'Recorded Now';

                showNotification('Ledger Inscribed', 'Custom milestone recorded successfully.');
                refreshState();
            } else {
                showNotification('Error', result.message);
            }
        } catch (err) {
            console.error('Failed to save custom milestone:', err);
            showNotification('Error', 'Server failed to save.');
        }
    });

    // 4. Inscribe New Parent Workshop Context (Sensing next chapter)
    inscribeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const interest = document.getElementById('i-interest').value.trim();
        const skill = document.getElementById('i-skill').value;
        const challenge = document.getElementById('i-challenge').value.trim();

        if (!interest || !skill) return;

        try {
            const res = await fetch('/api/inscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interest, skill, challenge })
            });

            const result = await res.json();
            if (result.success) {
                // Clear fields
                document.getElementById('i-interest').value = '';
                document.getElementById('i-challenge').value = '';

                showNotification('Parchment Updated ⚜️', `Nell has woven ${interest} and ${skill} into the living book.`);
                
                // Immediately update local UI
                refreshState();

                // Swap tabs back to Screen 1: The Parchment so they can interact with the updated story!
                setTimeout(() => {
                    const firstBtn = document.querySelector('.nav-btn[data-target="screen-primer"]');
                    if (firstBtn) firstBtn.click();
                }, 1000);
            } else {
                showNotification('Error', result.message);
            }
        } catch (err) {
            console.error('Failed to inscribe workshop fields:', err);
            showNotification('Error', 'Inscription service failed.');
        }
    });

    // 5. Reset All Book Memories
    resetBtn.addEventListener('click', async () => {
        if (!confirm('Are you absolutely certain you wish to wipe clean the Ledger of Wisdom and revert the Primer to its factory defaults? This is irreversible.')) {
            return;
        }

        try {
            const res = await fetch('/api/primer/reset', { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                showNotification('Memory Wiped Clean', 'The Primer has returned to its pristine, original pages.');
                refreshState();
            }
        } catch (err) {
            console.error('Reset error:', err);
            showNotification('Wipe Error', 'Could not clear the memory correctly.');
        }
    });

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    refreshState();
});
