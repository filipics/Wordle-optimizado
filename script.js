// ==================== Variables Globales ====================
let currentRow = 0;
let currentCol = 0;
let gameOver = false;
let isDailyMode = false; // Modo normal por defecto
const maxAttempts = 6;
const allowedLetters = "qwertyuiopasdfghjklñzxcvbnm";
let targetWord = "";

// Prioridad para colores
const COLOR_PRIORITY = { unused: 0, absent: 1, present: 2, correct: 3 };

// ==================== Listas de Palabras ====================
const wordSelectionList = ["frase", "perro", "gatos", "nubes", "agita", "albor"];
const wordValidationList = ["abacá", "perro", "gatos", "ergos", "zuzos"].map(word => removeAccents(word));

// ==================== Funciones de Utilidad ====================
function removeAccents(word) {
  return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// (Las funciones loadDailyGameState, saveDailyGameState, disableKeyboard, selectRandomWord, validateWord, resetGame, generateGrid, etc. se mantienen iguales que en tu versión anterior, ya que las filas 1 y 2 no deben cambiar.)

// ==================== Generación del Teclado ====================
function generateKeyboard() {
  const keyboard = document.getElementById("keyboard");
  keyboard.innerHTML = "";
  
  // Fila 1
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
  
  // Fila 2
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
  
  // Fila 3 (usamos grid; ya definida en CSS como 10 columnas)
  const row3 = document.createElement("div");
  row3.classList.add("keyboard-row", "row-3");
  
  // 1° celda: placeholder invisible
  const placeholder = document.createElement("div");
  placeholder.classList.add("key", "placeholder");
  placeholder.textContent = "";
  row3.appendChild(placeholder);
  
  // 7 letras de "zxcvbnm"
  "zxcvbnm".split("").forEach(letter => {
    const key = document.createElement("div");
    key.classList.add("key");
    // Para row 3 usamos un <span> para centrar el texto (por la técnica de padding-top)
    const span = document.createElement("span");
    span.textContent = letter;
    key.appendChild(span);
    key.id = `key-${letter}`;
    key.dataset.status = "unused";
    key.addEventListener("click", () => handleKeyPress(letter));
    row3.appendChild(key);
  });
  
  // Botón de Backspace que ocupará 2 columnas
  const backspace = document.createElement("div");
  backspace.classList.add("key", "backspace");
  const spanB = document.createElement("span");
  spanB.textContent = "←";
  backspace.appendChild(spanB);
  backspace.id = "key-backspace";
  backspace.addEventListener("click", () => handleKeyPress("backspace"));
  backspace.style.gridColumn = "span 2";
  row3.appendChild(backspace);
  
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

// (El resto de funciones, manejo de mensajes, entrada del usuario, etc., se mantienen iguales)
