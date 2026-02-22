// Storage Management

const STORAGE_KEYS = {
  GAMES: 'edugame_games',
  RESULTS: 'edugame_results'
};

const StorageManager = {
  // Game Operations
  saveGame: (gameData) => {
    const games = StorageManager.getGames();
    const newGame = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...gameData
    };
    games.push(newGame);
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
    return newGame;
  },

  getGames: () => {
    try {
      const games = localStorage.getItem(STORAGE_KEYS.GAMES);
      return games ? JSON.parse(games) : [];
    } catch (e) {
      console.error("Error parsing games from local storage", e);
      return [];
    }
  },

  getGameById: (id) => {
    const games = StorageManager.getGames();
    return games.find(g => g.id === id);
  },

  deleteGame: (id) => {
    let games = StorageManager.getGames();
    games = games.filter(g => g.id !== id);
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
  },

  // Result Operations
  saveResult: (resultData) => {
    const results = StorageManager.getResults();
    const newResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...resultData
    };
    results.push(newResult);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    return newResult;
  },

  getResults: () => {
    try {
      const results = localStorage.getItem(STORAGE_KEYS.RESULTS);
      return results ? JSON.parse(results) : [];
    } catch (e) {
      console.error("Error parsing results from local storage", e);
      return [];
    }
  },

  // Excel Export
  exportResultsToExcel: () => {
    if (typeof XLSX === 'undefined') {
      alert("Excel library not loaded properly.");
      return;
    }

    const results = StorageManager.getResults();
    if (results.length === 0) {
      alert("No results to export."); // Simple message
      return;
    }

    // Format data for Excel
    const data = results.map(r => ({
      "Student Name": r.studentName,
      "Game Title": r.gameTitle,
      "Game Type": r.gameType || "N/A",
      "Score": r.score,
      "Max Score": r.maxScore,
      "Percentage": ((r.score / r.maxScore) * 100).toFixed(2) + "%",
      "Date": new Date(r.timestamp).toLocaleString()
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Results");

    // Save file
    XLSX.writeFile(wb, `EduGame_Results_${new Date().toISOString().slice(0,10)}.xlsx`);
  }
};

// Make it global
window.StorageManager = StorageManager;
