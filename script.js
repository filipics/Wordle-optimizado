// ==================== Variables Globales ====================
let currentRow = 0;
let currentCol = 0;
let gameOver = false;
let isDailyMode = false; // Modo normal por defecto
const maxAttempts = 6;
const allowedLetters = "qwertyuiopasdfghjklñzxcvbnm";
let targetWord = "";

// Prioridad para actualizar el color de las teclas
const COLOR_PRIORITY = { unused: 0, absent: 1, present: 2, correct: 3 };

// ==================== Listas de Palabras ====================
const wordSelectionList = ["frase", "perro", "gatos", "nubes", "agita", "albor"];
const wordValidationList = ["abacá", "perro", "gatos", "ergos", "zuzos"].map(word => removeAccents(word));

// ==================== Funciones de Utilidad ====================
function removeAccents(word) {
  return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ==================== Modo Diario y Estado ====================
function loadDailyGameState() {
  const savedGame = JSON.parse(localStorage.getItem("dailyGameState"));
  if (savedGame && savedGame.lastPlayedDate === new Date().toDateString()) {
    currentRow = savedGame.currentRow || 0;
    // Restaurar el estado del tablero
    const cells = document.querySelectorAll(".cell");
    savedGame.boardState.forEach((cellData, index) => {
      cells[index].innerText = cellData.letter;
      cells[index].classList.remove("correct", "present", "absent");
      if (cellData.class) {
        cells[index].classList.add(cellData.class);
      }
    });
    // Restaurar el estado del teclado
    const keys = document.querySelectorAll(".key");
    savedGame.keyboardState.forEach(keyData => {
      const keyElement = document.getElementById(`key-${keyData.letter}`);
      if (keyElement) {
        keyElement.classList.remove("correct", "present", "absent");
        if (keyData.class) {
          keyElement.classList.add(keyData.class);
          keyElement.dataset.status = keyData.class;
        }
      }
    });
    if (currentRow >= maxAttempts) {
      disableKeyboard();
      gameOver = true;
    }
    return true;
  }
  return false;
}

function saveDailyGameState() {
  if (isDailyMode) {
    const cells = document.querySelectorAll(".cell");
    const boardState = Array.from(cells).map(cell => ({
      letter: cell.innerText,
      class: cell.classList.contains("correct")
        ? "correct"
        : cell.classList.contains("present")
        ? "present"
        : cell.classList.contains("absent")
        ? "absent"
        : ""
    }));
    const keys = document.querySelectorAll(".key");
    const keyboardState = Array.from(keys).map(key => ({
      letter: key.innerText.toLowerCase(),
      class: key.classList.contains("correct")
        ? "correct"
        : key.classList.contains("present")
        ? "present"
        : key.classList.contains("absent")
        ? "absent"
        : "unused"
    }));
    const gameState = {
      currentRow,
      boardState,
      keyboardState,
      lastPlayedDate: new Date().toDateString()
    };
    localStorage.setItem("dailyGameState", JSON.stringify(gameState));
  }
}

function disableKeyboard() {
  document.querySelectorAll(".key").forEach(key => key.style.pointerEvents = "none");
}

// ==================== Selección de Palabra ====================
function selectRandomWord() {
  const words = wordSelectionList.filter(word => word.length === 5);
  if (words.length > 0) {
    if (isDailyMode) {
      const savedWord = localStorage.getItem("dailyWord");
      const lastDate = localStorage.getItem("lastPlayedDate");
      if (savedWord && lastDate === new Date().toDateString()) {
        targetWord = savedWord;
      } else {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const index = seed % words.length;
        targetWord = words[index];
        localStorage.setItem("dailyWord", targetWord);
        localStorage.setItem("lastPlayedDate", new Date().toDateString());
      }
    } else {
      const index = Math.floor(Math.random() * words.length);
      targetWord = words[index];
    }
  } else {
    console.error("No hay palabras de 5 letras en la lista.");
    targetWord = "perro";
  }
}

// ==================== Validación y Reinicio ====================
function validateWord(word) {
  return wordValidationList.includes(removeAccents(word.toLowerCase()));
}

function resetGame() {
  if (isDailyMode) return;
  currentRow = 0;
  currentCol = 0;
  gameOver = false;
  document.getElementById("grid").innerHTML = "";
  document.getElementById("keyboard").innerHTML = "";
  document.getElementById("message").textContent = "";
  document.getElementById("reveal-word").textContent = "";
  generateGrid();
  generateKeyboard();
  selectRandomWord();
}

// ==================== Generación del Tablero ====================
function generateGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  for (let i = 0; i < maxAttempts * 5; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    // Para lograr que la celda sea cuadrada, usamos un <span> que se posiciona absolutamente.
    const span = document.createElement("span");
    cell.appendChild(span);
    grid.appendChild(cell);
  }
}

// ==================== Generación del Teclado ====================
function generateKeyboard() {
  const keyboard = document.getElementById("keyboard");
  keyboard.innerHTML = "";
  
  // Filas 1 y 2: se generan de forma clásica
  const row1 = document.createElement("div");
  row1.classList.add("keyboard-row", "row-1");
  "qwertyuiop".split("").forEach(letter => {
    const key = document.createElement("div");
    key.classList.add("key");
    key.textContent = letter;
    key.id = `key-${letter}`;
    key.dataset.status = "unused";
    key.addEventListener("click", () => handleKeyPress(letter));
    row1.appendChild(key);
  });
  keyboard.appendChild(row1);
  
  const row2 = document.createElement("div");
  row2.classList.add("keyboard-row", "row-2");
  "asdfghjklñ".split("").forEach(letter => {
    const key = document.createElement("div");
    key.classList.add("key");
    key.textContent = letter;
    key.id = `key-${letter}`;
    key.dataset.status = "unused";
    key.addEventListener("click", () => handleKeyPress(letter));
    row2.appendChild(key);
  });
  keyboard.appendChild(row2);
  
  // Fila 3: Usamos una cuadrícula de 10 celdas (como en las filas 1 y 2)
  const row3 = document.createElement("div");
  row3.classList.add("keyboard-row", "row-3");
  
  // 1ª celda: Placeholder invisible
  const placeholder = document.createElement("div");
  placeholder.classList.add("key", "placeholder");
  placeholder.textContent = "";
  row3.appendChild(placeholder);
  
  // 7 celdas para las letras de "zxcvbnm"
  "zxcvbnm".split("").forEach(letter => {
    const key = document.createElement("div");
    key.classList.add("key");
    key.textContent = letter;
    key.id = `key-${letter}`;
    key.dataset.status = "unused";
    key.addEventListener("click", () => handleKeyPress(letter));
    row3.appendChild(key);
  });
  
  // Botón de Backspace que ocupará 2 celdas
  const backspaceKey = document.createElement("div");
  backspaceKey.classList.add("key", "backspace");
  backspaceKey.textContent = "←";
  backspaceKey.id = "key-backspace";
  backspaceKey.addEventListener("click", () => handleKeyPress("backspace"));
  // Hace que este elemento se extienda a 2 columnas dentro del grid de 10
  backspaceKey.style.gridColumn = "span 2";
  row3.appendChild(backspaceKey);
  
  keyboard.appendChild(row3);
  
  // Generar la tecla Enter en el contenedor superior
  generateEnterKey();
}

function generateEnterKey() {
  const container = document.getElementById("enter-key-container");
  container.innerHTML = "";
  const enterKey = document.createElement("div");
  enterKey.classList.add("key");
  enterKey.textContent = "Enter";
  enterKey.id = "key-enter-top";
  enterKey.addEventListener("click", () => handleKeyPress("enter"));
  container.appendChild(enterKey);
}

// ==================== Manejo de Mensajes ====================
function showMessage(text) {
  const msgEl = document.getElementById("message");
  if (!msgEl) return;
  msgEl.textContent = text;
  setTimeout(() => { msgEl.textContent = ""; }, 2000);
}

// ==================== Manejo de Entrada del Usuario ====================
function handleKeyPress(key) {
  if (gameOver) return;
  key = key.toLowerCase();
  if (key === "enter") {
    if (currentCol === 5) {
      checkWord();
    } else {
      showMessage("Completa la palabra antes de enviar.");
    }
    return;
  }
  if (key === "backspace") {
    if (currentCol > 0) {
      currentCol--;
      const cells = document.querySelectorAll(".cell");
      cells[currentRow * 5 + currentCol].innerText = "";
    }
    return;
  }
  if (!allowedLetters.includes(key) || currentCol >= 5) return;
  const cells = document.querySelectorAll(".cell");
  cells[currentRow * 5 + currentCol].innerText = key.toUpperCase();
  currentCol++;
}

function checkWord() {
  let word = "";
  const cells = document.querySelectorAll(".cell");
  for (let i = 0; i < 5; i++) {
    word += cells[currentRow * 5 + i].innerText.toLowerCase();
  }
  if (!validateWord(word)) {
    showMessage("❌ Esa palabra no está en la DRAE.");
    return;
  }
  processWord(word);
}

// ==================== Procesamiento de la Palabra ====================
function processWord(inputWord) {
  const cells = document.querySelectorAll(".cell");
  let letterCount = {};
  for (let letter of targetWord) {
    letterCount[letter] = (letterCount[letter] || 0) + 1;
  }
  let tempCount = { ...letterCount };
  
  // Primera pasada: correctas
  for (let i = 0; i < inputWord.length; i++) {
    let cell = cells[currentRow * 5 + i];
    let letter = inputWord[i];
    let keyEl = document.getElementById(`key-${letter}`);
    if (letter === targetWord[i]) {
      cell.classList.add("correct");
      updateKeyColor(keyEl, "correct");
      tempCount[letter]--;
    }
  }
  
  // Segunda pasada: presentes o ausentes
  for (let i = 0; i < inputWord.length; i++) {
    let cell = cells[currentRow * 5 + i];
    let letter = inputWord[i];
    let keyEl = document.getElementById(`key-${letter}`);
    if (!cell.classList.contains("correct")) {
      if (targetWord.includes(letter) && tempCount[letter] > 0) {
        cell.classList.add("present");
        updateKeyColor(keyEl, "present");
        tempCount[letter]--;
      } else {
        cell.classList.add("absent");
        updateKeyColor(keyEl, "absent");
      }
    }
  }
  
  if (inputWord === targetWord) {
    showMessage("🎉 ¡Ganaste!");
    saveGameResult(true, currentRow + 1);
    gameOver = true;
    disableKeyboard();
  } else if (currentRow === maxAttempts - 1) {
    document.getElementById("reveal-word").innerText = `La palabra era: ${targetWord.toUpperCase()}`;
    saveGameResult(false, currentRow + 1);
    gameOver = true;
    disableKeyboard();
  }
  currentRow++;
  currentCol = 0;
  saveDailyGameState();
}

function updateKeyColor(key, newStatus) {
  if (!key) return;
  let currStatus = key.dataset.status || "unused";
  if (COLOR_PRIORITY[newStatus] > COLOR_PRIORITY[currStatus]) {
    key.classList.remove("correct", "present", "absent", "unused");
    key.classList.add(newStatus);
    key.dataset.status = newStatus;
  }
}

// ==================== Registro y Visualización del Historial ====================
function saveGameResult(won, attempts) {
  let history = JSON.parse(localStorage.getItem("gameHistory")) || [];
  let record = {
    date: new Date().toLocaleDateString(),
    word: targetWord,
    attempts: won ? attempts : maxAttempts,
    result: won ? "Ganó" : "Perdió"
  };
  history.push(record);
  localStorage.setItem("gameHistory", JSON.stringify(history));
  updateHistoryDisplay();
}

function toggleHistory() {
  const histEl = document.getElementById("history");
  if (histEl.style.display === "none" || histEl.style.display === "") {
    histEl.style.display = "block";
    updateHistoryDisplay();
  } else {
    histEl.style.display = "none";
  }
}

function updateHistoryDisplay() {
  const histEl = document.getElementById("history");
  if (!histEl) return;
  let history = JSON.parse(localStorage.getItem("gameHistory")) || [];
  histEl.innerHTML = "<h3>Historial de Partidas</h3>";
  if (history.length === 0) {
    histEl.innerHTML += "<p>Aún no hay partidas registradas.</p>";
    return;
  }
  history.slice(-10).forEach(game => {
    const entry = document.createElement("p");
    entry.innerText = `${game.date}: ${game.word} - ${game.result} en ${game.attempts} intentos`;
    histEl.appendChild(entry);
  });
}

// ==================== Inicialización ====================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modeToggle").addEventListener("click", () => {
    isDailyMode = !isDailyMode;
    document.getElementById("modeToggle").innerText = isDailyMode ? "Modo Diario" : "Modo Normal";
    if (isDailyMode) {
      const savedWord = localStorage.getItem("dailyWord");
      if (savedWord) { targetWord = savedWord; }
      if (loadDailyGameState()) return;
    }
    selectRandomWord();
    resetGame();
  });
  
  document.getElementById("reset-game").addEventListener("click", resetGame);
  document.getElementById("toggle-history").addEventListener("click", toggleHistory);
  
  document.addEventListener("keydown", event => {
    handleKeyPress(event.key);
  });
  
  selectRandomWord();
  generateGrid();
  generateKeyboard();
  updateHistoryDisplay();
});
