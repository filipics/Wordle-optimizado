/************************************************************
 * script.js - Ejemplo de Wordle con teclado flexible
 ************************************************************/

/* ==================== Variables Globales ==================== */
let currentRow = 0;
let currentCol = 0;
let gameOver = false;

const maxAttempts = 6;   // 6 intentos
const allowedLetters = "qwertyuiopasdfghjklñzxcvbnm";
let targetWord = "";

// Lista de palabras candidatas (simplemente ejemplos)
const wordSelectionList = ["frase", "perro", "gatos", "nubes", "agita", "albor"];
// Lista de palabras que se consideran “válidas”
const wordValidationList = ["frase", "perro", "gatos", "nubes", "agita", "albor"];

/* ==================== Inicialización del Juego ==================== */
document.addEventListener("DOMContentLoaded", () => {
  // Vinculamos botón Reiniciar
  document.getElementById("reset-game").addEventListener("click", resetGame);
  
  // Vinculamos teclado físico
  document.addEventListener("keydown", (event) => {
    handleKeyPress(event.key);
  });
  
  // Inicial
  selectRandomWord();
  generateGrid();
  generateKeyboard();
});

/* ==================== Selección de Palabra Aleatoria ==================== */
function selectRandomWord() {
  // Filtra para que sean de 5 letras
  const words = wordSelectionList.filter(w => w.length === 5);
  if (words.length === 0) {
    console.error("No hay palabras de 5 letras en la lista.");
    targetWord = "perro";
    return;
  }
  const index = Math.floor(Math.random() * words.length);
  targetWord = words[index].toLowerCase();
}

/* ==================== Generar el Tablero (6 filas x 5 columnas) ==================== */
function generateGrid() {
  currentRow = 0;
  currentCol = 0;
  gameOver = false;
  
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  
  // Creamos 6 * 5 = 30 celdas
  for (let i = 0; i < maxAttempts * 5; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    const span = document.createElement("span");
    cell.appendChild(span);
    grid.appendChild(cell);
  }
}

/* ==================== Generar el Teclado con Flex ==================== */
function generateKeyboard() {
  const keyboardLayout = [
    // Fila 1
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    // Fila 2
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"],
    // Fila 3 (incluimos backspace y enter al final)
    ["z", "x", "c", "v", "b", "n", "m", "backspace", "enter"]
  ];
  
  const keyboardDiv = document.getElementById("keyboard");
  keyboardDiv.innerHTML = "";  // Limpia si ya existía
  
  // Construimos fila por fila
  keyboardLayout.forEach((rowKeys) => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("row");
    
    rowKeys.forEach((keyVal) => {
      const keyEl = document.createElement("div");
      keyEl.classList.add("key");
      
      // Texto a mostrar
      if (keyVal === "backspace") {
        keyEl.textContent = "⌫";
      } else if (keyVal === "enter") {
        keyEl.textContent = "Enter";
      } else {
        keyEl.textContent = keyVal;
      }
      
      // ID para cada tecla
      keyEl.id = "key-" + keyVal;
      
      // Evento de click
      keyEl.addEventListener("click", () => handleKeyPress(keyVal));
      
      rowDiv.appendChild(keyEl);
    });
    
    keyboardDiv.appendChild(rowDiv);
  });
}

/* ==================== Manejo de Inputs ==================== */
function handleKeyPress(key) {
  if (gameOver) return;
  
  // Normaliza a minúsculas
  key = key.toLowerCase();
  
  // Enter
  if (key === "enter") {
    if (currentCol === 5) {
      checkWord();
    } else {
      showMessage("Completa las 5 letras antes de enviar.");
    }
    return;
  }
  
  // Backspace
  if (key === "backspace" || key === "delete") {
    if (currentCol > 0) {
      currentCol--;
      const cells = document.querySelectorAll(".cell span");
      cells[currentRow * 5 + currentCol].textContent = "";
    }
    return;
  }
  
  // Solo letras permitidas
  if (!allowedLetters.includes(key)) return;
  
  // Llenar la celda
  if (currentCol < 5) {
    const cells = document.querySelectorAll(".cell span");
    cells[currentRow * 5 + currentCol].textContent = key.toUpperCase();
    currentCol++;
  }
}

/* ==================== Validar Palabra y Revisar ==================== */
function checkWord() {
  let word = "";
  const cells = document.querySelectorAll(".cell span");
  
  // Recolecta la palabra ingresada en la fila actual
  for (let i = 0; i < 5; i++) {
    const letter = cells[currentRow * 5 + i].textContent.toLowerCase();
    word += letter;
  }
  
  // Verifica si la palabra está en la lista de palabras válidas
  if (!wordValidationList.includes(word)) {
    showMessage("❌ Esa palabra no está en la lista.");
    return;
  }
  
  // Procesa coincidencias
  processWord(word);
}

/* ==================== Mostrar Mensajes ==================== */
function showMessage(text) {
  const msgEl = document.getElementById("message");
  if (!msgEl) return;
  msgEl.innerText = text;
  setTimeout(() => {
    msgEl.innerText = "";
  }, 2000);
}

/* ==================== Procesar la Palabra ==================== */
function processWord(inputWord) {
  const cells = document.querySelectorAll(".cell span");
  // Conteo de letras en la palabra objetivo
  let letterCount = {};
  for (let letter of targetWord) {
    letterCount[letter] = (letterCount[letter] || 0) + 1;
  }
  
  // Paso 1: marcar "correct"
  for (let i = 0; i < 5; i++) {
    const letter = inputWord[i];
    if (letter === targetWord[i]) {
      // Marca la celda
      cells[currentRow * 5 + i].parentElement.classList.add("correct");
      // Marca la tecla
      updateKeyColor(document.getElementById("key-" + letter), "correct");
      letterCount[letter]--;
    }
  }
  
  // Paso 2: marcar "present" o "absent"
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
  
  // ¿Ganó?
  if (inputWord === targetWord) {
    showMessage("🎉 ¡Ganaste!");
    gameOver = true;
    revealWord(`La palabra era: ${targetWord.toUpperCase()}`);
    return;
  }
  
  // ¿Se acabaron los intentos?
  if (currentRow === maxAttempts - 1) {
    showMessage("❌ ¡Se acabaron los intentos!");
    revealWord(`La palabra era: ${targetWord.toUpperCase()}`);
    gameOver = true;
    return;
  }
  
  // Si sigue el juego, pasa a la siguiente fila
  currentRow++;
  currentCol = 0;
}

/* ==================== Colorear Teclas ==================== */
function updateKeyColor(keyEl, statusClass) {
  if (!keyEl) return;
  // Priorizamos correct > present > absent
  const priority = { "unused": 0, "absent": 1, "present": 2, "correct": 3 };
  const currentClass = keyEl.classList.contains("correct")
    ? "correct"
    : keyEl.classList.contains("present")
    ? "present"
    : keyEl.classList.contains("absent")
    ? "absent"
    : "unused";
  
  if (priority[statusClass] > priority[currentClass]) {
    keyEl.classList.remove("correct", "present", "absent", "unused");
    keyEl.classList.add(statusClass);
  }
}

/* ==================== Mostrar la Palabra Final ==================== */
function revealWord(text) {
  const revealEl = document.getElementById("reveal-word");
  if (revealEl) {
    revealEl.innerText = text;
  }
}

/* ==================== Reiniciar el Juego ==================== */
function resetGame() {
  // Limpia mensaje y palabra revelada
  document.getElementById("message").innerText = "";
  document.getElementById("reveal-word").innerText = "";
  
  // Nueva palabra
  selectRandomWord();
  
  // Nueva grilla
  generateGrid();
  
  // Quitar marcados de las teclas
  document.querySelectorAll(".key").forEach(k => {
    k.classList.remove("correct", "present", "absent");
  });
}
