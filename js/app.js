// Main Application Logic

let currentGame = null; // Store currently playing game
let currentQuestions = []; // Store generated questions in creator

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  const savedLang = localStorage.getItem('appLang') || 'id';
  changeLanguage(savedLang);

  const teacherName = localStorage.getItem('teacherName');
  if (teacherName) {
    updateUserDisplay(teacherName);
    showView('dashboard');
  } else {
    showView('login');
  }
}

// Navigation & View Switching
function showView(viewId) {
  document.querySelectorAll('.view-section').forEach(el => {
    el.classList.remove('active');
    el.classList.add('d-none');
  });

  const target = document.getElementById(viewId + 'View');
  if (target) {
    target.classList.remove('d-none');
    setTimeout(() => target.classList.add('active'), 10);

    // View specific logic
    if (viewId === 'dashboard') {
      loadDashboardGames();
    } else if (viewId === 'results') {
      loadResults();
    }
  }
}

// Authentication
function login() {
  const nameInput = document.getElementById('teacherNameInput');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const name = nameInput.value.trim();

  if (apiKeyInput && apiKeyInput.value.trim()) {
    localStorage.setItem('geminiApiKey', apiKeyInput.value.trim());
  }

  if (name) {
    localStorage.setItem('teacherName', name);
    updateUserDisplay(name);
    showView('dashboard');
  } else {
    alert(t('enterUsername'));
  }
}

function logout() {
  localStorage.removeItem('teacherName');
  document.getElementById('userSection').classList.add('d-none');
  showView('login');
}

function updateUserDisplay(name) {
  document.getElementById('userNameDisplay').textContent = name;
  document.getElementById('userSection').classList.remove('d-none');
}

// Language Handling
function changeLanguage(lang) {
  setLanguage(lang);
  document.getElementById('currentLangLabel').textContent = lang.toUpperCase();
  // Refresh current view if needed
  const activeView = document.querySelector('.view-section.active');
  if (activeView && activeView.id === 'dashboardView') {
      loadDashboardGames(); // Re-render to update text
  }
}

// --- Dashboard Logic ---

function loadDashboardGames() {
  const games = StorageManager.getGames();
  const container = document.getElementById('gamesList');
  container.innerHTML = '';

  if (games.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center text-muted py-5">
        <i class="fa-regular fa-folder-open fa-3x mb-3"></i>
        <p>${t('noGames')}</p>
      </div>`;
    return;
  }

  games.forEach(game => {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';
    card.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <span class="badge bg-primary rounded-pill">${t(game.type)}</span>
            <div class="dropdown">
              <button class="btn btn-link text-secondary p-0" data-bs-toggle="dropdown">
                <i class="fa-solid fa-ellipsis-vertical"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item text-danger" href="#" onclick="deleteGame('${game.id}')">${t('delete')}</a></li>
              </ul>
            </div>
          </div>
          <h5 class="card-title fw-bold">${game.topic}</h5>
          <p class="card-text text-muted small"><i class="fa-regular fa-clock me-1"></i> ${new Date(game.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="card-footer bg-white border-0 pb-3 pt-0">
          <button class="btn btn-outline-primary w-100 rounded-pill" onclick="prepareGame('${game.id}')">
            <i class="fa-solid fa-play me-2"></i> ${t('play')}
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function deleteGame(id) {
  if (confirm(t('confirmDelete'))) {
    StorageManager.deleteGame(id);
    loadDashboardGames();
  }
}

// --- Game Creator Logic ---

async function generateQuestions() {
  const topic = document.getElementById('topicInput').value.trim();
  const fileInput = document.getElementById('fileInput');
  const gameType = document.getElementById('gameTypeSelect').value;

  if (!topic && fileInput.files.length === 0) {
    alert(t('orInput'));
    return;
  }

  document.getElementById('loadingIndicator').classList.remove('d-none');
  document.getElementById('generatedContent').classList.add('d-none');

  try {
    let contextText = "";
    if (fileInput.files.length > 0) {
      contextText = await FileParser.extractText(fileInput.files[0]);
    }

    const questions = await AIService.generateQuestions(topic || "General Knowledge", contextText, gameType, currentLang);
    currentQuestions = questions;
    renderGeneratedQuestions(questions, gameType);

    document.getElementById('generatedContent').classList.remove('d-none');
  } catch (error) {
    console.error(error);
    alert(t('error') + ": " + error.message);
  } finally {
    document.getElementById('loadingIndicator').classList.add('d-none');
  }
}

function renderGeneratedQuestions(questions, type) {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';

  questions.forEach((q, index) => {
    const item = document.createElement('div');
    item.className = 'list-group-item border-0 shadow-sm mb-2 rounded';

    let content = `<div class="d-flex w-100 justify-content-between"><h6 class="mb-1 fw-bold">Q${index+1}</h6></div>`;

    if (type === 'quiz') {
      content += `<p class="mb-1">${escapeHTML(q.question)}</p>`;
      content += `<small class="text-muted">Ans: ${escapeHTML(q.answer)}</small>`;
    } else if (type === 'matching') {
      content += `<div class="row"><div class="col-5 border p-2 rounded">${escapeHTML(q.left)}</div><div class="col-2 text-center align-self-center"><i class="fa-solid fa-arrow-right"></i></div><div class="col-5 border p-2 rounded">${escapeHTML(q.right)}</div></div>`;
    } else if (type === 'fillBlank') {
      content += `<p class="mb-1">${escapeHTML(q.sentence).replace('___', '<span class="text-primary fw-bold">___</span>')}</p>`;
      content += `<small class="text-muted">Ans: ${escapeHTML(q.answer)}</small>`;
    }

    item.innerHTML = content;
    container.appendChild(item);
  });
}

function saveGame() {
  if (currentQuestions.length === 0) return;

  const topic = document.getElementById('topicInput').value.trim() || "Untitled Game";
  const gameType = document.getElementById('gameTypeSelect').value;

  const gameData = {
    topic: topic,
    type: gameType,
    questions: currentQuestions
  };

  StorageManager.saveGame(gameData);

  // Reset form
  document.getElementById('gameForm').reset();
  document.getElementById('generatedContent').classList.add('d-none');
  currentQuestions = [];

  showView('dashboard');
}

// --- Game Player Setup ---

function prepareGame(gameId) {
  currentGame = StorageManager.getGameById(gameId);
  if (currentGame) {
    showView('gamePlayer');
    document.getElementById('studentLogin').classList.remove('d-none');
    document.getElementById('gameInterface').classList.add('d-none');
    document.getElementById('studentNameInput').value = '';
  }
}

function startGameSession() {
  const studentName = document.getElementById('studentNameInput').value.trim();
  if (!studentName) {
    alert(t('studentName'));
    return;
  }

  document.getElementById('studentLogin').classList.add('d-none');
  document.getElementById('gameInterface').classList.remove('d-none');

  // Initialize Game Logic based on type
  initGameEngine(currentGame, studentName);
}

function exitGame() {
    if(confirm(t('confirmDelete'))) { // Use generic confirm? "Are you sure you want to quit?"
        showView('dashboard');
    }
}

// --- Results Logic ---

function loadResults() {
    const results = StorageManager.getResults();
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    if (results.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">${t('noGames')}</td></tr>`; // Using 'noGames' text for empty results too
        return;
    }

    results.forEach(r => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${r.studentName}</td>
            <td>${r.gameTitle}</td>
            <td><span class="badge bg-success">${r.score} / ${r.maxScore}</span></td>
            <td>${new Date(r.timestamp).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
    });
}

function exportToExcel() {
    StorageManager.exportResultsToExcel();
}

window.showView = showView; // Make globally accessible
