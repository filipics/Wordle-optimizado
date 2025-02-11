/************************************************************
 * script.js - Ejemplo Wordle (simplificado) con teclado 
 * que NO pasa teclas a la segunda fila.
 * Cada fila está en un solo contenedor flex-wrap: nowrap.
 ************************************************************/

/* ==================== Variables Globales ==================== */
let currentRow = 0;
let currentCol = 0;
let gameOver = false;

const maxAttempts = 6;   // 6 intentos (Wordle)
const allowedLetters = "qwertyuiopasdfghjklñzxcvbnm";
let targetWord = "";

// Palabras de ejemplo (todas de 5 letras)
const wordSelectionList = ["perro", "gatos", "nubes", "agita", "albor", "frase"];
// Lista de validación (puedes ampliarla)
const wordValidationList = wordSelectionList.slice(); // Reutilizo las mismas

/* ==================== Inicialización ==================== */
document.addEventListener("DOMContentLoaded", () => {
  // Generar Tablero (6 filas x 5 columnas)
  generateGrid();

  // Generar Teclado (3 filas, una sola línea c/u)
  generateKeyboard();

  // Seleccionar palabra al azar
  selectRandomWord();
  
  // Manejo de teclado físico
  document.addEventListener("keydown", (event) => {
    handleKeyPress(event.key);
  });

  // Botón para reiniciar
  document.getElementById("reset-game").addEventListener("click", resetGame);
});

/* ==================== Selecciona Palabra Aleatoria ==================== */
function selectRandomWord() {
  const words = wordSelectionList.filter(w => w.length === 5);
  if (words.length === 0) {
    console.error("No hay palabras de 5 letras.");
    targetWord = "perro";
    return;
  }
  const randomIndex = Math.floor(Math.random() * words.length);
  targetWord = words[randomIndex];
}

/* ==================== Generar Tablero ==================== */
function generateGrid() {
  currentRow = 0;
  currentCol = 0;
  gameOver = false;
  document.getElementById("message").innerText = "";
  document.getElementById("reveal-word").innerText = "";

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
  // Filas de letras
  const row1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
  const row2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"];
  const row3 = ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"];

  // Limpiamos cada fila
  document.querySelector(".row-1").innerHTML = "";
  document.querySelector(".row-2").innerHTML = "";
  document.querySelector(".row-3").innerHTML = "";

  // Construimos cada fila en una sola línea
  row1.forEach(letter => createKey(letter, document.querySelector(".row-1")));
  row2.forEach(letter => createKey(letter, document.querySelector(".row-2")));
  row3.forEach(letter => createKey(letter, document.querySelector(".row-3")));
}

function createKey(letter, rowContainer) {
  const keyDiv = document.createElement("div");
  keyDiv.classList.add("key");
  if (letter === "backspace") {
    keyDiv.classList.add("backspace");
    keyDiv.textContent = "⌫";
  } else if (letter === "enter") {
    keyDiv.textContent = "Enter";
  } else {
    keyDiv.textContent = letter;
  }
  
  // ID opcional para poder colorear luego
  keyDiv.id = "key-" + letter;
  
  // Evento al hacer click
  keyDiv.addEventListener("click", () => handleKeyPress(letter));
  
  rowContainer.appendChild(keyDiv);
}

/* ==================== Manejo de Entrada de Teclas ==================== */
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
      cells[currentRow * 5 + currentCol].textContent = "";
    }
    return;
  }
  
  if (!allowedLetters.includes(key)) return;
  
  if (currentCol < 5) {
    const cells = document.querySelectorAll(".cell span");
    cells[currentRow * 5 + currentCol].textContent = key.toUpperCase();
    currentCol++;
  }
}

/* ==================== Validar y Procesar la Palabra ==================== */
function checkWord() {
  const cells = document.querySelectorAll(".cell span");
  let word = "";
  
  for (let i = 0; i < 5; i++) {
    word += cells[currentRow * 5 + i].textContent.toLowerCase();
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
  
  // Primera pasada: correct
  for (let i = 0; i < 5; i++) {
    const letter = inputWord[i];
    if (letter === targetWord[i]) {
      cells[currentRow * 5 + i].parentElement.classList.add("correct");
      updateKeyColor(document.getElementById("key-" + letter), "correct");
      letterCount[letter]--;
    }
  }
  
  // Segunda pasada: present / absent
  for (let i = 0; i < 5; i++) {
    const letter = inputWord[i];
    const cellDiv = cells[currentRow * 5 + i].parentElement;
    if (!cellDiv.classList.contains("correct")) {
      if (targetWord.includes(letter) && letterCount[letter] > 0) {
        cellDiv.classList.add("present");
        updateKeyColor(document.getElementById("key-" + letter), "present");
        letterCount[letter]--;
      } else {
        cellDiv.classList.add("absent");
        updateKeyColor(document.getElementById("key-" + letter), "absent");
      }
    }
  }
  
  // Verificar victoria
  if (inputWord === targetWord) {
    showMessage("¡Ganaste!");
    revealWord("La palabra era: " + targetWord.toUpperCase());
    gameOver = true;
    return;
  }
  
  // Verificar si se acabaron los intentos
  if (currentRow === maxAttempts - 1) {
    showMessage("¡Se acabaron los intentos!");
    revealWord("La palabra era: " + targetWord.toUpperCase());
    gameOver = true;
    return;
  }
  
  // Siguiente intento
  currentRow++;
  currentCol = 0;
}

/* ==================== Actualizar Color de Teclas ==================== */
function updateKeyColor(keyEl, newStatus) {
  if (!keyEl) return;

  // Prioridades
  const priority = { unused: 0, absent: 1, present: 2, correct: 3 };
  // Detecta el estado actual
  let currStatus = "unused";
  if (keyEl.classList.contains("correct")) currStatus = "correct";
  else if (keyEl.classList.contains("present")) currStatus = "present";
  else if (keyEl.classList.contains("absent")) currStatus = "absent";

  if (priority[newStatus] > priority[currStatus]) {
    keyEl.classList.remove("correct", "present", "absent", "unused");
    keyEl.classList.add(newStatus);
  }
}

/* ==================== Mostrar Mensajes ==================== */
function showMessage(msg) {
  const msgEl = document.getElementById("message");
  msgEl.innerText = msg;
  setTimeout(() => {
    msgEl.innerText = "";
  }, 2000);
}

function revealWord(text) {
  const revealEl = document.getElementById("reveal-word");
  revealEl.innerText = text;
}

/* ==================== Reiniciar ==================== */
function resetGame() {
  selectRandomWord();
  generateGrid();
  // Quitar colores de teclas
  document.querySelectorAll(".key").forEach(k => {
    k.classList.remove("correct", "present", "absent");
  });
}
