document.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.querySelector("#login-screen");
  const gameContainer = document.querySelector("#game-container");
  const playerForm = document.querySelector("#playerForm");

  playerForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevenir envío del formulario

    const playerName = document.querySelector("#playerName").value.trim();
    const playerAvatar = document.querySelector("#playerAvatar").value.trim();
    const characterEmoji = document
      .querySelector("#characterEmoji")
      .value.trim();

    // Validaciones
    if (!playerName) {
      alert("Por favor, ingresa un nombre de jugador");
      return;
    }

    if (playerAvatar && characterEmoji) {
      alert("Elige solo avatar o emoji, no ambos");
      return;
    }

    // Guardar datos del jugador
    localStorage.setItem("playerName", playerName);
    localStorage.setItem("playerAvatar", playerAvatar || "");
    localStorage.setItem("characterEmoji", characterEmoji || "💀");

    // Ocultar pantalla de login y mostrar juego
    loginScreen.style.display = "none";
    gameContainer.style.display = "block";

    // Iniciar juego
    initializeGame();
  });

  function initializeGame() {
    const playerName = localStorage.getItem("playerName");
    const characterEmoji = localStorage.getItem("characterEmoji") || "💀";
    const gameArea = document.querySelector("#game-area");
    const playerInfo = document.querySelector("#player-info");
    const enemyCount = document.querySelector("#enemy-count");
    const timeCount = document.querySelector("#time-count");
    const levelCount = document.querySelector("#level-count");

    // Limpiar área de juego
    gameArea.innerHTML = "";
    document.querySelector("#player").innerHTML = "";

    // Información del jugador
    playerInfo.innerHTML = `<h2>${playerName}</h2>`;
    enemyCount.textContent = "Enemigos: 0";
    timeCount.textContent = "Tiempo: 0s";
    levelCount.textContent = "Nivel: 1";

    // Crear personaje del jugador
    const player = document.createElement("div");
    player.id = "player-character";
    player.innerHTML = characterEmoji;
    document.querySelector("#player").appendChild(player);

    // Variables del juego
    let currentLevel = 1;
    let enemiesKilled = 0;
    let gameTime = 0;
    let gameTimer;
    let enemies = [];

    // Iniciar temporizador del juego
    gameTimer = setInterval(() => {
      gameTime++;
      timeCount.textContent = `Tiempo: ${gameTime}s`;
    }, 1000);

    // Función para generar enemigos
    function spawnEnemy() {
      const enemy = document.createElement("div");
      enemy.classList.add("enemy");
      enemy.innerHTML = "👾";
      enemy.style.left = `${Math.random() * 250}px`;
      gameArea.appendChild(enemy);

      // Mover enemigo
      function moveEnemy() {
        const currentTop = parseInt(enemy.style.top || "0");
        enemy.style.top = `${currentTop + currentLevel}px`;

        // Verificar game over
        if (currentTop > 500) {
          gameOver();
        }
      }

      const enemyInterval = setInterval(moveEnemy, 50);
    }

    // Generar enemigos periodicamente
    const spawnInterval = setInterval(spawnEnemy, 2000 - currentLevel * 100);

    // Función de game over
    function gameOver() {
      clearInterval(gameTimer);
      clearInterval(spawnInterval);

      const gameOverScreen = document.createElement("div");
      gameOverScreen.id = "game-over-screen";
      gameOverScreen.innerHTML = `
        <h2>Game Over</h2>
        <p>Jugador: ${playerName}</p>
        <p>Enemigos eliminados: ${enemiesKilled}</p>
        <p>Tiempo: ${gameTime} segundos</p>
        <button id="return-btn">Regresar</button>
      `;
      gameContainer.appendChild(gameOverScreen);

      document.getElementById("return-btn").addEventListener("click", () => {
        gameContainer.style.display = "none";
        loginScreen.style.display = "block";
        gameContainer.removeChild(gameOverScreen);
      });
    }
  }
});
