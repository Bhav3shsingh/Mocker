// --- STATE MANAGEMENT ---
let isReviewMode = false;
let currentIdx = 0;
let timeLeft = 60 * 60; 
let timerInterval;

// --- TIMER LOGIC ---
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    if (isReviewMode) return; // No timer in review mode

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishTest("TIME EXPIRED!");
        }
    }, 1000);
}

function updateTimerUI() {
    const clockDisplay = document.getElementById('timer-clock');
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

    // Calculate Score
    const total = questions.length;
    const correctCount = questions.filter(q => q.selectedOption === q.correct).length;
    const answered = questions.filter(q => q.selectedOption !== null).length;

    // UI Updates
    document.getElementById('submit-test-btn').style.display = 'none';
    document.querySelector('.test-container').style.pointerEvents = 'auto';
    document.querySelector('.test-container').style.opacity = '1';

    alert(`${reason}\n\nReview Mode Active.\nScore: ${correctCount} / ${total}\nAnswered: ${answered}`);

    loadQuestion(0); // Restart at Q1 for review
}

document.getElementById('submit-test-btn').onclick = () => {
    if (confirm("Are you sure you want to submit the test?")) {
        finishTest("TEST SUBMITTED SUCCESSFULLY");
    }
};

// --- DATA INJECTION LOGIC ---
function processAndLoad(raw) {
    try {
        const data = JSON.parse(raw);
        questions = data.map((q, i) => ({
            id: i + 1,
            text: q.text || `Question ${i + 1}`,
            options: q.options || ["Option A", "Option B", "Option C", "Option D"],
            correct: q.correct !== undefined ? q.correct : null, 
            status: 'unvisited',
            selectedOption: null
        }));
        
        isReviewMode = false;
        currentIdx = 0; 
        const userMins = document.getElementById('timer-minutes-input').value || 60;
        timeLeft = parseInt(userMins) * 60; 

        document.querySelector('.test-container').style.pointerEvents = 'auto';
        document.querySelector('.test-container').style.opacity = '1';
        document.getElementById('submit-test-btn').style.display = 'block';
        
        init(); 
        
        sideMenu.classList.remove('active');
        feederControls.style.display = 'none';
        initialMenu.style.display = 'block';
    } catch (err) {
        alert("JSON Error: Check your format.");
    }
}

// --- CORE MOCK LOGIC ---
let questions = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    text: `Sample Question #${i + 1}: What is 1 + ${i}?`,
    options: [`${1+i}`, "5", "10", "2"],
    correct: 0,
    status: 'unvisited',
    selectedOption: null
}));

function init() {
    renderPalette();
    loadQuestion(currentIdx);
    startTimer();
}

function renderPalette() {
    const grid = document.getElementById('palette-grid');
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
    
    document.getElementById('q-title').innerHTML = `
        <div class="q-number-label">Question No. ${q.id}</div>
        <div class="q-text-body">${q.text}</div>
    `;

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
                ${isReviewMode && i === q.correct ? '<span class="feedback-tag">CORRECT</span>' : ''}
                ${isReviewMode && q.selectedOption === i && i !== q.correct ? '<span class="feedback-tag">WRONG</span>' : ''}
            </div>
        `;
    }).join('');
    
    document.getElementById('review-tick').checked = (q.status === 'review' || q.status === 'answered-review');
    document.getElementById('review-tick').disabled = isReviewMode;
    
    renderPalette();
    updateTimerUI();
}

function selectOption(optIndex) {
    if (isReviewMode) return;
    questions[currentIdx].selectedOption = optIndex;
    
    const isMarkedReview = (questions[currentIdx].status === 'review' || questions[currentIdx].status === 'answered-review');
    questions[currentIdx].status = isMarkedReview ? 'answered-review' : 'answered';
    
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
    renderPalette();
};

document.getElementById('next-btn').onclick = () => {
    if (currentIdx < questions.length - 1) loadQuestion(currentIdx + 1);
};

document.getElementById('prev-btn').onclick = () => {
    if (currentIdx > 0) loadQuestion(currentIdx - 1);
};

// --- MENU TOGGLES ---
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('side-menu');
const initialMenu = document.getElementById('initial-menu');
const feederControls = document.getElementById('feeder-controls');

hamburger.onclick = (e) => { e.stopPropagation(); sideMenu.classList.toggle('active'); };
document.onclick = (e) => { if (!sideMenu.contains(e.target) && e.target !== hamburger) sideMenu.classList.remove('active'); };
document.getElementById('open-feeder').onclick = () => { initialMenu.style.display = 'none'; feederControls.style.display = 'block'; };
document.getElementById('back-to-menu').onclick = () => { feederControls.style.display = 'none'; initialMenu.style.display = 'block'; };

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
        alert("Please provide a JSON file or text.");
    }
};

init();
