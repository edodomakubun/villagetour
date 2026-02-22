// Game Engine Logic

let gameState = {
  game: null,
  studentName: "",
  currentIndex: 0,
  score: 0,
  answers: []
};

function initGameEngine(game, studentName) {
  gameState = {
    game: game,
    studentName: studentName,
    currentIndex: 0,
    score: 0,
    answers: []
  };

  const container = document.getElementById('gameContainer');
  container.innerHTML = '';

  if (game.type === 'quiz') {
    startQuiz();
  } else if (game.type === 'matching') {
    startMatching();
  } else if (game.type === 'fillBlank') {
    startFillBlank();
  }
}

// --- Quiz Engine ---

function startQuiz() {
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const container = document.getElementById('gameContainer');
  const question = gameState.game.questions[gameState.currentIndex];

  // Shuffle options
  const options = [...question.options].sort(() => Math.random() - 0.5);

  let html = `
    <h3 class="mb-4 text-center fw-bold">${t('questions')} ${gameState.currentIndex + 1}/${gameState.game.questions.length}</h3>
    <div class="card border-0 bg-light mb-4">
      <div class="card-body text-center">
        <h4 class="card-text py-3">${escapeHTML(question.question)}</h4>
      </div>
    </div>
    <div class="d-grid gap-3 col-md-8 mx-auto">
  `;

  options.forEach(opt => {
    html += `<button class="btn btn-outline-primary btn-lg quiz-option text-start" data-opt="${escapeHTML(opt)}" onclick="handleQuizAnswer(this, this.getAttribute('data-opt'))">${escapeHTML(opt)}</button>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function handleQuizAnswer(btn, selected) {
  const correct = gameState.game.questions[gameState.currentIndex].answer;
  // Disable all buttons
  document.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);

  if (selected === correct) {
    btn.classList.remove('btn-outline-primary');
    btn.classList.add('btn-success');
    gameState.score++;
  } else {
    btn.classList.remove('btn-outline-primary');
    btn.classList.add('btn-danger');
    // Highlight correct answer
    // (Optional logic to find correct button and highlight it)
  }

  setTimeout(() => {
    gameState.currentIndex++;
    if (gameState.currentIndex < gameState.game.questions.length) {
      renderQuizQuestion();
    } else {
      endGame();
    }
  }, 1500);
}

// --- Matching Engine ---

function startMatching() {
  const container = document.getElementById('gameContainer');
  const pairs = gameState.game.questions; // Array of {left, right}

  // Shuffle sides independently
  const lefts = pairs.map((p, i) => ({ text: p.left, id: i })).sort(() => Math.random() - 0.5);
  const rights = pairs.map((p, i) => ({ text: p.right, id: i })).sort(() => Math.random() - 0.5);

  let html = `
    <h3 class="mb-4 text-center fw-bold">${t('matching')}</h3>
    <p class="text-center text-muted mb-4">${t('dragDrop')}</p>
    <div class="row">
      <div class="col-6" id="leftColumn">
        ${lefts.map(l => `<div class="draggable-item" draggable="true" ondragstart="drag(event)" id="left-${l.id}" data-match="${l.id}">${escapeHTML(l.text)}</div>`).join('')}
      </div>
      <div class="col-6" id="rightColumn">
        ${rights.map(r => `<div class="drop-zone mb-3" ondrop="drop(event)" ondragover="allowDrop(event)" data-match="${r.id}">${escapeHTML(r.text)}</div>`).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function allowDrop(ev) {
  ev.preventDefault();
  ev.target.classList.add('drag-over');
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  ev.target.classList.remove('drag-over');
  var data = ev.dataTransfer.getData("text");
  var draggedElement = document.getElementById(data);

  // Check match
  const dragId = draggedElement.getAttribute('data-match');
  const dropId = ev.target.getAttribute('data-match');

  if (dragId === dropId) {
    // Correct
    ev.target.innerHTML = `<div class="alert alert-success m-0 w-100"><i class="fa-solid fa-check"></i> ${draggedElement.innerText} = ${ev.target.innerText}</div>`;
    ev.target.classList.remove('drop-zone');
    ev.target.classList.add('border-0', 'p-0');
    draggedElement.style.display = 'none'; // Hide left item
    gameState.score++;

    // Check if all matched
    const remaining = document.querySelectorAll('#leftColumn .draggable-item[style="display: none;"]').length;
    if (remaining === gameState.game.questions.length) {
      setTimeout(endGame, 1000); // Wait a bit then end
    } // Wait, length matches total questions
     if (document.querySelectorAll('#leftColumn .draggable-item:not([style*="display: none"])').length === 0) {
         setTimeout(endGame, 1000);
     }
  } else {
    // Incorrect
    ev.target.classList.add('bg-danger', 'text-white');
    setTimeout(() => {
      ev.target.classList.remove('bg-danger', 'text-white');
    }, 500);
  }
}

// --- Fill Blank Engine ---

function startFillBlank() {
  renderFillBlankQuestion();
}

function renderFillBlankQuestion() {
  const container = document.getElementById('gameContainer');
  const question = gameState.game.questions[gameState.currentIndex];

  // Replace ___ with input
  const sentenceHtml = escapeHTML(question.sentence).replace('___', `<input type="text" class="fill-blank-input mx-2" id="blankInput" autocomplete="off">`);

  let html = `
    <h3 class="mb-4 text-center fw-bold">${t('fillBlank')} ${gameState.currentIndex + 1}/${gameState.game.questions.length}</h3>
    <div class="card border-0 bg-light mb-5 py-5">
      <div class="card-body text-center">
        <div class="fill-blank-sentence">${sentenceHtml}</div>
      </div>
    </div>
    <div class="text-center">
      <button class="btn btn-primary btn-lg px-5 rounded-pill" onclick="checkFillBlankAnswer('${question.answer}')">Check Answer</button>
    </div>
    <div id="feedbackArea" class="mt-3 text-center" style="min-height: 24px;"></div>
  `;

  container.innerHTML = html;

  // Focus input
  setTimeout(() => document.getElementById('blankInput').focus(), 100);
}

async function checkFillBlankAnswer(correctAnswer) {
  const input = document.getElementById('blankInput');
  const studentAnswer = input.value.trim();
  const feedback = document.getElementById('feedbackArea');

  if (!studentAnswer) return;

  input.disabled = true;
  feedback.innerHTML = `<span class="spinner-border spinner-border-sm text-primary"></span> Checking...`;

  // Use AI Service for grading
  const result = await AIService.checkAnswer(studentAnswer, correctAnswer, gameState.game.questions[gameState.currentIndex].sentence);

  if (result.isCorrect || result.score >= 80) { // Threshold for "correct enough"
    input.classList.add('text-success', 'border-success');
    feedback.innerHTML = `<span class="text-success fw-bold"><i class="fa-solid fa-check"></i> Correct!</span>`;
    gameState.score++;
  } else {
    input.classList.add('text-danger', 'border-danger');
    feedback.innerHTML = `<span class="text-danger fw-bold"><i class="fa-solid fa-xmark"></i> Incorrect. Answer: ${correctAnswer}</span>`;
  }

  setTimeout(() => {
    gameState.currentIndex++;
    if (gameState.currentIndex < gameState.game.questions.length) {
      renderFillBlankQuestion();
    } else {
      endGame();
    }
  }, 2000);
}

// --- Game Over ---

function endGame() {
  const container = document.getElementById('gameContainer');
  const maxScore = gameState.game.questions.length;

  // Save result
  StorageManager.saveResult({
    gameId: gameState.game.id,
    gameTitle: gameState.game.topic || gameState.game.questions[0].sentence || "Untitled", // Fallback title
    gameType: gameState.game.type,
    studentName: gameState.studentName,
    score: gameState.score,
    maxScore: maxScore
  });

  let html = `
    <div class="text-center py-5">
      <i class="fa-solid fa-trophy fa-5x text-warning mb-4"></i>
      <h2 class="fw-bold mb-3">${t('gameOver')}</h2>
      <h4 class="mb-4">${t('score')}: <span class="text-primary">${gameState.score} / ${maxScore}</span></h4>

      <div class="d-flex justify-content-center gap-3">
        <button class="btn btn-outline-secondary rounded-pill px-4" onclick="location.reload()">${t('back')}</button>
        <button class="btn btn-primary rounded-pill px-4" onclick="initGameEngine(gameState.game, gameState.studentName)">${t('playAgain')}</button>
      </div>
    </div>
  `;
  // Note: location.reload() is a crude way to go back to dashboard/login.
  // Better: onclick="exitGame()" or similar.
  // I'll change location.reload() to exitGame() but exitGame logic needs to handle this state.
  // Actually, showView('dashboard') is better if teacher is logged in. But teacher might not be logged in if this is a shared device?
  // User requirements didn't specify strict auth.
  // I'll change back button to `showView('gamePlayer'); document.getElementById('studentLogin').classList.remove('d-none'); ...`

  html = html.replace('location.reload()', "showView('gamePlayer'); document.getElementById('gameInterface').classList.add('d-none'); document.getElementById('studentLogin').classList.remove('d-none');");

  container.innerHTML = html;
}

// Make global
window.initGameEngine = initGameEngine;
