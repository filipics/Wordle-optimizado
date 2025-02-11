/************************************************************
 * script.js - Wordle Adaptable con Historial y Modo Diario
 ************************************************************/

/* ==================== Variables Globales ==================== */
let currentRow = 0;
let currentCol = 0;
let gameOver = false;
let isDailyMode = false; // Modo normal por defecto
const maxAttempts = 6;
const allowedLetters = "qwertyuiopasdfghjklñzxcvbnm";
let targetWord = "";

// Prioridad para actualizar el color de las teclas
const COLOR_PRIORITY = { unused: 0, absent: 1, present: 2, correct: 3 };

/* ==================== Listas de Palabras ==================== */
const wordSelectionList = ["perro", "gatos", "nubes", "agita", "albor", "frase"];
const wordValidationList = wordSelectionList.slice();

/* ==================== Funciones de Utilidad ==================== */
function removeAccents(word) {
  return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/* ==================== Modo Diario y Historial ==================== */
function loadDailyGameState() {
  const savedGame = JSON.parse(localStorage.getItem("dailyGameState"));
  if (savedGame && savedGame.lastPlayedDate === new Date().toDateString()) {
    currentRow = savedGame.currentRow || 0;
    // Restaurar el tablero
    const cells = document.querySelectorAll(".cell span");
    savedGame.boardState.forEach((cellData, index) => {
      cells[index].innerText = cellData.letter;
      cells[index].parentElement.classList.remove("correct", "present", "absent");
      if (cellData.class) {
        cells[index].parentElement.classList.add(cellData.class);
      }
    });
    // Restaurar el teclado
    const keys = document.querySelectorAll(".key");
    savedGame.keyboardState.forEach(keyData => {
      const keyElement = document.getElementById("key-" + keyData.letter);
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
    const cells = document.querySelectorAll(".cell span");
    const boardState = Array.from(cells).map(cell => ({
      letter: cell.innerText,
      class: cell.parentElement.classList.contains("correct")
        ? "correct"
        : cell.parentElement.classList.contains("present")
        ? "present"
        : cell.parentElement.classList.contains("absent")
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

function updateHistoryDisplay() {
  const histEl = document.getElementById("history");
  histEl.innerHTML = "<h3>Historial de Partidas</h3>";
  let history = JSON.parse(localStorage.getItem("gameHistory")) || [];
  if (history.length === 0) {
    histEl.innerHTML += "<p>No hay partidas registradas.</p>";
    return;
  }
  history.slice(-10).forEach(game => {
    const p = document.createElement("p");
    p.innerText = `${game.date}: ${game.word} - ${game.result} en ${game.attempts} intentos`;
    histEl.appendChild(p);
  });
}

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

function disableKeyboard() {
  document.querySelectorAll(".key").forEach(key => key.style.pointerEvents = "none");
}

/* ==================== Selección de Palabra ==================== */
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
    console.error("No hay palabras de 5 letras.");
    targetWord = "perro";
  }
}

/* ==================== Validación y Procesamiento ==================== */
function validateWord(word) {
  return wordValidationList.includes(word);
}

function resetGame() {
  if (isDailyMode) return;
  currentRow = 0;
  currentCol = 0;
  gameOver = false;
  document.getElementById("grid").innerHTML = "";
  document.getElementById("keyboard").innerHTML = "";
  document.getElementById("message").innerText = "";
  document.getElementById("reveal-word").innerText = "";
  generateGrid();
  generateKeyboard();
  selectRandomWord();
}

function generateGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  for (let i = 0; i < maxAttempts * 5; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    const span = document.createElement("span");
    cell.appendChild(span);
    grid.appendChild(cell);
  }
}

/* ==================== Generar Teclado ==================== */
function generateKeyboard() {
  // Se asume que en el HTML existen tres contenedores con clases "row row-1", "row row-2" y "row row-3"
  const row1Container = document.querySelector(".row.row-1");
  const row2Container = document.querySelector(".row.row-2");
  const row3Container = document.querySelector(".row.row-3");
  
  // Limpiar contenedores
  row1Container.innerHTML = "";
  row2Container.innerHTML = "";
  row3Container.innerHTML = "";
  
  // Fila 1
  ["q","w","e","r","t","y","u","i","o","p"].forEach(letter => {
    createKey(letter, row1Container);
  });
  
  // Fila 2
  ["a","s","d","f","g","h","j","k","l","ñ"].forEach(letter => {
    createKey(letter, row2Container);
  });
  
  // Fila 3: Se crearán 10 celdas en total:
  // 1ª celda: Placeholder invisible
  createKey("", row3Container, true);
  // 7 celdas: Letras de "zxcvbnm"
  ["z","x","c","v","b","n","m"].forEach(letter => {
    createKey(letter, row3Container);
  });
  // Última celda: Botón de Backspace (ocupando 2 celdas en escritorio)
  createKey("backspace", row3Container, false, true);
}

function createKey(letter, container, isPlaceholder = false, isBackspace = false) {
  const keyDiv = document.createElement("div");
  keyDiv.classList.add("key");
  if (isPlaceholder) {
    keyDiv.classList.add("placeholder");
    keyDiv.textContent = "";
  } else if (isBackspace) {
    keyDiv.classList.add("backspace");
    keyDiv.textContent = "⌫";
    keyDiv.style.gridColumn = "span 2";
    keyDiv.addEventListener("click", () => handleKeyPress("backspace"));
  } else {
    keyDiv.textContent = letter;
    keyDiv.id = "key-" + letter;
    keyDiv.dataset.status = "unused";
    keyDiv.addEventListener("click", () => handleKeyPress(letter));
  }
  container.appendChild(keyDiv);
}

function generateEnterKey() {
  // Insertar la tecla Enter en un contenedor superior.
  let container = document.getElementById("enter-key-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "enter-key-container";
    document.body.insertBefore(container, document.getElementById("grid"));
  }
  container.innerHTML = "";
  const enterKey = document.createElement("div");
  enterKey.classList.add("key");
  enterKey.textContent = "Enter";
  enterKey.id = "key-enter-top";
  enterKey.addEventListener("click", () => handleKeyPress("enter"));
  container.appendChild(enterKey);
}

/* ==================== Manejo de Teclado Físico ==================== */
function handleKeyPress(key) {
  if (gameOver) return;
  key = key.toLowerCase();
  if (key === "enter") {
    if (currentCol === 5) {
      checkWord();
    } else {
      showMessage("Faltan letras.");
    }
    return;
  }
  if (key === "backspace" || key === "delete") {
    if (currentCol > 0) {
      currentCol--;
      const cells = document.querySelectorAll(".cell span");
      cells[currentRow * 5 + currentCol].innerText = "";
    }
    return;
  }
  if (!allowedLetters.includes(key)) return;
  if (currentCol < 5) {
    const cells = document.querySelectorAll(".cell span");
    cells[currentRow * 5 + currentCol].innerText = key.toUpperCase();
    currentCol++;
  }
}

/* ==================== Validar y Procesar Palabra ==================== */
function checkWord() {
  const cells = document.querySelectorAll(".cell span");
  let word = "";
  for (let i = 0; i < 5; i++) {
    word += cells[currentRow * 5 + i].innerText.toLowerCase();
  }
  if (!wordValidationList.includes(word)) {
    showMessage("❌ No está en la lista.");
    return;
  }
  processWord(word);
}

function processWord(inputWord) {
  const cells = document.querySelectorAll(".cell span");
  const letterCount = {};
  for (let char of targetWord) {
    letterCount[char] = (letterCount[char] || 0) + 1;
  }
  let tempCount = { ...letterCount };
  
  // Primera pasada: correctas
  for (let i = 0; i < inputWord.length; i++) {
    const letter = inputWord[i];
    if (letter === targetWord[i]) {
      cells[currentRow * 5 + i].parentElement.classList.add("correct");
      updateKeyColor(document.getElementById("key-" + letter), "correct");
      tempCount[letter]--;
    }
  }
  
  // Segunda pasada: presentes o ausentes
  for (let i = 0; i < inputWord.length; i++) {
    const letter = inputWord[i];
    const cellDiv = cells[currentRow * 5 + i].parentElement;
    if (!cellDiv.classList.contains("correct")) {
      if (targetWord.includes(letter) && tempCount[letter] > 0) {
        cellDiv.classList.add("present");
        updateKeyColor(document.getElementById("key-" + letter), "present");
        tempCount[letter]--;
      } else {
        cellDiv.classList.add("absent");
        updateKeyColor(document.getElementById("key-" + letter), "absent");
      }
    }
  }
  
  if (inputWord === targetWord) {
    showMessage("¡Ganaste!");
    revealWord("La palabra era: " + targetWord.toUpperCase());
    gameOver = true;
    saveGameResult(true, currentRow + 1);
    return;
  }
  
  if (currentRow === maxAttempts - 1) {
    showMessage("¡Se acabaron los intentos!");
    revealWord("La palabra era: " + targetWord.toUpperCase());
    gameOver = true;
    saveGameResult(false, currentRow + 1);
    return;
  }
  
  currentRow++;
  currentCol = 0;
}

function updateKeyColor(keyEl, newStatus) {
  if (!keyEl) return;
  const priority = { unused: 0, absent: 1, present: 2, correct: 3 };
  let currStatus = "unused";
  if (keyEl.classList.contains("correct")) currStatus = "correct";
  else if (keyEl.classList.contains("present")) currStatus = "present";
  else if (keyEl.classList.contains("absent")) currStatus = "absent";
  
  if (priority[newStatus] > priority[currStatus]) {
    keyEl.classList.remove("correct", "present", "absent", "unused");
    keyEl.classList.add(newStatus);
  }
}

function showMessage(msg) {
  const msgEl = document.getElementById("message");
  msgEl.innerText = msg;
  setTimeout(() => { msgEl.innerText = ""; }, 2000);
}

function revealWord(text) {
  document.getElementById("reveal-word").innerText = text;
}

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

function updateHistoryDisplay() {
  const histEl = document.getElementById("history");
  histEl.innerHTML = "<h3>Historial de Partidas</h3>";
  let history = JSON.parse(localStorage.getItem("gameHistory")) || [];
  if (history.length === 0) {
    histEl.innerHTML += "<p>No hay partidas registradas.</p>";
    return;
  }
  history.slice(-10).forEach(game => {
    const p = document.createElement("p");
    p.innerText = `${game.date}: ${game.word} - ${game.result} en ${game.attempts} intentos`;
    histEl.appendChild(p);
  });
}

function resetGame() {
  selectRandomWord();
  generateGrid();
  // Reiniciar colores de las teclas
  document.querySelectorAll(".key").forEach(k => {
    k.classList.remove("correct", "present", "absent");
  });
}

/* ==================== Inicialización ==================== */
document.addEventListener("DOMContentLoaded", () => {
  // Insertar el botón de Modo Diario/Modo Normal si no existe
  if (!document.getElementById("modeToggle")) {
    const modeToggle = document.createElement("button");
    modeToggle.id = "modeToggle";
    modeToggle.classList.add("button");
    modeToggle.innerText = "Modo Normal";
    document.body.insertBefore(modeToggle, document.getElementById("grid"));
    modeToggle.addEventListener("click", () => {
      isDailyMode = !isDailyMode;
      modeToggle.innerText = isDailyMode ? "Modo Diario" : "Modo Normal";
      if (isDailyMode) {
        const savedWord = localStorage.getItem("dailyWord");
        if (savedWord) { targetWord = savedWord; }
        if (loadDailyGameState()) return;
      }
      selectRandomWord();
      resetGame();
    });
  }
  
  // Evento para el botón de reiniciar
  document.getElementById("reset-game").addEventListener("click", resetGame);
  
  // Evento para teclado físico
  document.addEventListener("keydown", (event) => {
    handleKeyPress(event.key);
  });
  
  selectRandomWord();
  generateGrid();
  generateKeyboard();
  updateHistoryDisplay();
});
