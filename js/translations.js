const translations = {
  en: {
    title: "EduGame Creator",
    welcome: "Welcome, Teacher!",
    login: "Login",
    register: "Create Account",
    username: "Username",
    enterUsername: "Enter your username",
    dashboard: "Dashboard",
    myGames: "My Games",
    createNew: "Create New Game",
    gameType: "Select Game Type",
    quiz: "Quiz",
    matching: "Matching Pairs",
    fillBlank: "Fill in the Blank",
    uploadFile: "Upload Material (PDF/DOCX)",
    orInput: "Or Type Subject/Topic",
    generate: "Generate with AI",
    saveGame: "Save Game",
    play: "Play",
    results: "Results",
    exportExcel: "Export to Excel",
    studentName: "Enter Student Name",
    score: "Score",
    back: "Back",
    loading: "Loading AI Generation...",
    success: "Success!",
    error: "Error occurred",
    delete: "Delete",
    edit: "Edit",
    logout: "Logout",
    instructions: "Instructions",
    dragDrop: "Drag items to match them!",
    selectAnswer: "Select the correct answer!",
    typeAnswer: "Type the missing word!",
    gameOver: "Game Over!",
    totalScore: "Total Score",
    playAgain: "Play Again",
    noGames: "No games created yet. Start by clicking 'Create New Game'!",
    language: "Language",
    questions: "Questions",
    addQuestion: "Add Manually",
    save: "Save",
    cancel: "Cancel",
    confirmDelete: "Are you sure you want to delete this game?",
    generatedQuestions: "AI Generated Questions (Review & Edit)",
    topicPlaceholder: "e.g. Solar System, Basic Math, History of Indonesia...",
    fileLabel: "Choose File",
    analyzing: "Analyzing document...",
    generating: "Generating questions...",
  },
  id: {
    title: "Pembuat EduGame",
    welcome: "Selamat Datang, Guru!",
    login: "Masuk",
    register: "Buat Akun",
    username: "Nama Pengguna",
    enterUsername: "Masukkan nama pengguna",
    dashboard: "Dasbor",
    myGames: "Permainan Saya",
    createNew: "Buat Permainan Baru",
    gameType: "Pilih Jenis Permainan",
    quiz: "Kuis",
    matching: "Pasangkan Gambar/Kata",
    fillBlank: "Isi Titik-Titik",
    uploadFile: "Unggah Materi (PDF/DOCX)",
    orInput: "Atau Ketik Subjek/Topik",
    generate: "Buat dengan AI",
    saveGame: "Simpan Permainan",
    play: "Mainkan",
    results: "Hasil",
    exportExcel: "Ekspor ke Excel",
    studentName: "Masukkan Nama Siswa",
    score: "Skor",
    back: "Kembali",
    loading: "Memuat Generasi AI...",
    success: "Berhasil!",
    error: "Terjadi Kesalahan",
    delete: "Hapus",
    edit: "Edit",
    logout: "Keluar",
    instructions: "Instruksi",
    dragDrop: "Tarik item untuk mencocokkan!",
    selectAnswer: "Pilih jawaban yang benar!",
    typeAnswer: "Ketik kata yang hilang!",
    gameOver: "Permainan Selesai!",
    totalScore: "Total Skor",
    playAgain: "Main Lagi",
    noGames: "Belum ada permainan. Mulai dengan klik 'Buat Permainan Baru'!",
    language: "Bahasa",
    questions: "Pertanyaan",
    addQuestion: "Tambah Manual",
    save: "Simpan",
    cancel: "Batal",
    confirmDelete: "Apakah Anda yakin ingin menghapus permainan ini?",
    generatedQuestions: "Pertanyaan Buatan AI (Tinjau & Edit)",
    topicPlaceholder: "cth. Tata Surya, Matematika Dasar, Sejarah Indonesia...",
    fileLabel: "Pilih File",
    analyzing: "Menganalisis dokumen...",
    generating: "Membuat pertanyaan...",
  }
};

let currentLang = 'id'; // Default to Indonesian

function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    updateUIText();
    localStorage.setItem('appLang', lang);
  }
}

function t(key) {
  return translations[currentLang][key] || key;
}

function updateUIText() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
        el.setAttribute('placeholder', translations[currentLang][key]);
      } else {
        el.textContent = translations[currentLang][key];
      }
    }
  });
  // Update direction if needed (not for ID/EN)
}

// Load saved language
const savedLang = localStorage.getItem('appLang');
if (savedLang) {
  currentLang = savedLang;
}
