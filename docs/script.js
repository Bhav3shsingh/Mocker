// --- STATE MANAGEMENT ---
let isReviewMode = false;
let currentIdx = 0;
let timeLeft = 60 * 60; 
let timerInterval;
let questions = []; 

// --- PERSISTENCE LOGIC (LOCAL STORAGE) ---
function saveToLocal() {
    if (questions.length === 0) return;
    const sessionData = {
        questions,
        timeLeft,
        currentIdx,
        isReviewMode
    };
    localStorage.setItem('mocker_session', JSON.stringify(sessionData));
}

function clearLocal() {
    localStorage.removeItem('mocker_session');
}

// --- TIMER LOGIC ---
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    if (isReviewMode) return; 

    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft % 5 === 0) saveToLocal(); // Auto-save every 5 seconds
        updateTimerUI();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishTest("TIME EXPIRED!");
        }
    }, 1000);
}

function updateTimerUI() {
    const clockDisplay = document.getElementById('timer-clock');
    if (!clockDisplay) return;

    if (isReviewMode) {
        clockDisplay.innerText = "REVIEW";
        clockDisplay.style.color = "var(--review)";
        return;
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    clockDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft < 300) {
        clockDisplay.style.color = "var(--unanswered)";
    } else {
        clockDisplay.style.color = "var(--text-main)";
    }
}

// --- SUBMISSION & REVIEW LOGIC ---
function finishTest(reason) {
    clearInterval(timerInterval);
    isReviewMode = true; 

    const total = questions.length;
    const correctCount = questions.filter(q => q.selectedOption === q.correct).length;
    const answered = questions.filter(q => q.selectedOption !== null).length;

    document.getElementById('submit-test-btn').style.display = 'none';
    document.getElementById('review-indicator').style.display = 'block';

    saveToLocal(); // Save final state
    alert(`${reason}\n\nReview Mode Active.\nScore: ${correctCount} / ${total}\nAnswered: ${answered}`);

    loadQuestion(0); 
}

document.getElementById('submit-test-btn').onclick = () => {
    if (confirm("Are you sure you want to submit the test?")) {
        finishTest("TEST SUBMITTED SUCCESSFULLY");
    }
};

// --- DATA INJECTION LOGIC ---
function processAndLoad(raw) {
    try {
        const startIndex = raw.indexOf('[');
        const endIndex = raw.lastIndexOf(']');

        if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
            throw new Error("No valid JSON array detected.");
        }

        let jsonString = raw.substring(startIndex, endIndex + 1);

        // --- MECHANICAL GRIT: Strip trailing commas to prevent SYNC_FAILED ---
        jsonString = jsonString.replace(/,[ \t\r\n]*([\]}])/g, '$1');

        const data = JSON.parse(jsonString);

        if (!Array.isArray(data)) {
            throw new Error("Pasted content is not an array.");
        }

        questions = data.map((q, i) => ({
            id: i + 1,
            text: q.text || `Question ${i + 1}`,
            image: q.image || null, // Capture diagram URLs if provided separately
            options: q.options || ["A", "B", "C", "D"],
            correct: q.correct !== undefined ? q.correct : null, 
            status: 'unvisited',
            selectedOption: null
        }));
        
        // UI Transitions
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('test-interface').style.display = 'block';
        document.getElementById('main-palette').style.display = 'block';

        isReviewMode = false;
        currentIdx = 0; 
        const userMins = document.getElementById('timer-minutes-input').value || 60;
        timeLeft = parseInt(userMins) * 60; 
        
        saveToLocal(); 
        init(); 
        
        sideMenu.classList.remove('active');

    } catch (err) {
        console.error("Sync Error Details:", err);
        alert("SYNC_FAILED: Invalid format. Ensure double-escaped backslashes and correct brackets.");
    }
}

// --- CORE MOCK LOGIC ---
function init() {
    renderPalette();
    loadQuestion(currentIdx);
    startTimer();
}

function renderPalette() {
    const grid = document.getElementById('palette-grid');
    if (!grid) return;
    grid.innerHTML = ''; 
    
    questions.forEach((q, i) => {
        const div = document.createElement('div');
        let stateClass = q.status;
        if (isReviewMode) {
            if (q.selectedOption === null) stateClass = "skipped";
            else if (q.selectedOption === q.correct) stateClass = "correct-mini";
            else stateClass = "wrong-mini";
        }
        div.className = `q-box ${stateClass}`;
        div.innerText = q.id;
        div.onclick = () => loadQuestion(i);
        grid.appendChild(div);
    });
}

function loadQuestion(index) {
    if (questions.length === 0) return;
    currentIdx = index;
    const q = questions[index];
    
    if (!isReviewMode && q.status === 'unvisited') q.status = 'unanswered';
    
    // --- SMART IMAGE EXTRACTION (Regex) ---
    const imgContainer = document.getElementById('q-image-container');
    const markdownImageRegex = /!\[.*?\]\((.*?)\)/;
    const match = q.text.match(markdownImageRegex);
    
    let displayBody = q.text;
    let imageUrl = q.image;

    // If no explicit image key exists, try to extract from Markdown in text
    if (!imageUrl && match && match[1]) {
        imageUrl = match[1];
        // Clean the raw Markdown tag out of the display text
        displayBody = q.text.replace(markdownImageRegex, '').trim();
    }

    // Update UI Headers
    document.querySelector('.q-number-label').innerText = `Question No. ${q.id}`;
    document.querySelector('.q-text-body').innerHTML = displayBody;

    // Apply extracted or direct image
    if (imageUrl) {
        imgContainer.innerHTML = `<img src="${imageUrl}" alt="Diagram">`;
        imgContainer.style.display = 'block';
    } else {
        imgContainer.style.display = 'none';
    }

    const container = document.getElementById('options-container');
    container.innerHTML = q.options.map((opt, i) => {
        let reviewClass = "";
        if (isReviewMode) {
            if (i === q.correct) reviewClass = "correct-row";
            else if (q.selectedOption === i && i !== q.correct) reviewClass = "wrong-row";
        }

        return `
            <div class="option-item ${reviewClass}" ${isReviewMode ? '' : `onclick="selectOption(${i})"`}>
                <input type="radio" name="opt" ${q.selectedOption === i ? 'checked' : ''} ${isReviewMode ? 'disabled' : ''}>
                <span>${opt}</span>
                ${isReviewMode && i === q.correct ? '<span class="feedback-tag" style="background: var(--answered)">CORRECT</span>' : ''}
                ${isReviewMode && q.selectedOption === i && i !== q.correct ? '<span class="feedback-tag" style="background: var(--unanswered)">WRONG</span>' : ''}
            </div>
        `;
    }).join('');
    
    document.getElementById('review-tick').checked = (q.status === 'review' || q.status === 'answered-review');
    document.getElementById('review-tick').disabled = isReviewMode;
    
    renderPalette();
    updateTimerUI();

    // Trigger MathJax to render LaTeX equations
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

function selectOption(optIndex) {
    if (isReviewMode) return;
    questions[currentIdx].selectedOption = optIndex;
    const isMarkedReview = (questions[currentIdx].status === 'review' || questions[currentIdx].status === 'answered-review');
    questions[currentIdx].status = isMarkedReview ? 'answered-review' : 'answered';
    
    saveToLocal();
    loadQuestion(currentIdx);
}

document.getElementById('review-tick').onchange = (e) => {
    if (isReviewMode) return;
    const q = questions[currentIdx];
    const isAnswered = q.selectedOption !== null;

    if (e.target.checked) {
        q.status = isAnswered ? 'answered-review' : 'review';
    } else {
        q.status = isAnswered ? 'answered' : 'unanswered';
    }
    saveToLocal();
    renderPalette();
};

document.getElementById('next-btn').onclick = () => {
    if (currentIdx < questions.length - 1) loadQuestion(currentIdx + 1);
};

document.getElementById('prev-btn').onclick = () => {
    if (currentIdx > 0) loadQuestion(currentIdx - 1);
};

// --- RESTORE SESSION ON LOAD ---
window.onload = () => {
    const saved = localStorage.getItem('mocker_session');
    if (saved) {
        const data = JSON.parse(saved);
        if (confirm("Previous session found. Resume test?")) {
            questions = data.questions;
            timeLeft = data.timeLeft;
            currentIdx = data.currentIdx;
            isReviewMode = data.isReviewMode;

            document.getElementById('welcome-screen').style.display = 'none';
            document.getElementById('test-interface').style.display = 'block';
            document.getElementById('main-palette').style.display = 'block';
            
            if (isReviewMode) {
                document.getElementById('submit-test-btn').style.display = 'none';
                document.getElementById('review-indicator').style.display = 'block';
            }
            
            init();
        } else {
            clearLocal();
        }
    }
};

// --- MENU TOGGLES & ACTIONS ---
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('side-menu');

hamburger.onclick = (e) => { e.stopPropagation(); sideMenu.classList.toggle('active'); };
document.onclick = (e) => { if (!sideMenu.contains(e.target) && e.target !== hamburger) sideMenu.classList.remove('active'); };

const applyFeederBtn = document.getElementById('apply-feeder');
applyFeederBtn.onclick = () => {
    const fileInput = document.getElementById('json-file-input');
    const textInput = document.getElementById('json-text-input');
    
    if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => processAndLoad(e.target.result);
        reader.readAsText(fileInput.files[0]);
    } else if (textInput.value.trim()) {
        processAndLoad(textInput.value.trim());
    } else {
        alert("Provide a JSON file or paste text.");
    }
};

window.onbeforeunload = function() {
    if (questions.length > 0 && !isReviewMode) {
        return "Active test in progress!";
    }
};

document.getElementById('new-test-btn').onclick = () => {
    if (confirm("This will clear all current progress and data. Start a new session?")) {
        localStorage.removeItem('mocker_session');
        window.location.reload();
    }
};
