document.addEventListener("DOMContentLoaded", function () {
  // Recuperar datos del jugador
  const playerName = localStorage.getItem("playerName") || "Jugador";
  const playerAvatar = localStorage.getItem("playerAvatar");
  const characterEmoji = localStorage.getItem("characterEmoji") || "💀";

  const gameContainer = document.getElementById("game-container");
  const startButton = document.getElementById("play-button");
  const gameBoard = document.getElementById("game-board");
  const winMessage = document.getElementById("win-message");
  const loseMessage = document.getElementById("lose-message");

  // Mostrar nombre del jugador
  const playerNameDisplay = document.createElement("div");
  playerNameDisplay.id = "player-name-display";
  playerNameDisplay.textContent = playerName;
  gameBoard.appendChild(playerNameDisplay);

  // Crear elementos de UI
  const enemyCountDisplay = document.createElement("div");
  enemyCountDisplay.id = "enemy-count-display";
  enemyCountDisplay.textContent = "Enemigos: 0";
  gameBoard.appendChild(enemyCountDisplay);

  const timeDisplay = document.createElement("div");
  timeDisplay.id = "time-display";
  timeDisplay.textContent = "Tiempo: 0s";
  gameBoard.appendChild(timeDisplay);

  const levelDisplay = document.createElement("div");
  levelDisplay.id = "level-display";
  levelDisplay.textContent = "Nivel: 1";
  gameBoard.appendChild(levelDisplay);

  // Crear calavera/personaje
  const skull = document.createElement("div");
  skull.id = "skull";
  skull.innerHTML = characterEmoji || "💀";
  gameBoard.appendChild(skull);

  let skullPositionX = 125;
  let currentLevel = 1;
  let canShoot = true;
  let enemySpeed = 1;
  let enemiesKilled = 0;
  let gameTime = 0;
  let gameTimer;
  let canStartGame = true;

  // Configuraciones de niveles
  const levelConfig = {
    1: { enemySpeed: 1, spawnRate: 2000, enemiesForNextLevel: 5 },
    2: { enemySpeed: 2, spawnRate: 1800, enemiesForNextLevel: 10 },
    3: { enemySpeed: 3, spawnRate: 1600, enemiesForNextLevel: 15 },
    4: { enemySpeed: 4, spawnRate: 1400, enemiesForNextLevel: 20 },
    5: { enemySpeed: 5, spawnRate: 1200, enemiesForNextLevel: 25 },
    6: { enemySpeed: 6, spawnRate: 1000, enemiesForNextLevel: 30 },
    7: { enemySpeed: 7, spawnRate: 800, enemiesForNextLevel: 35 },
    8: { enemySpeed: 8, spawnRate: 600, enemiesForNextLevel: 40 },
    9: { enemySpeed: 9, spawnRate: 400, enemiesForNextLevel: 45 },
    10: { enemySpeed: 10, spawnRate: 200, enemiesForNextLevel: 50 },
  };

  // Iniciar temporizador de juego
  function startGameTimer() {
    gameTimer = setInterval(() => {
      gameTime++;
      timeDisplay.textContent = `Tiempo: ${gameTime}s`;
    }, 1000);
  }

  // Mostrar pantalla de game over
  function showGameOverScreen() {
    clearInterval(gameTimer);
    canStartGame = false;

    // Crear pantalla de game over
    const gameOverScreen = document.createElement("div");
    gameOverScreen.id = "game-over-screen";
    gameOverScreen.innerHTML = `
          <div class="game-over-content">
              <h2>¡PERDISTE!</h2>
              <p>Jugador: ${playerName}</p>
              <p>Enemigos eliminados: ${enemiesKilled}</p>
              <p>Tiempo de juego: ${gameTime} segundos</p>
              <button id="retry-button">Intentar de nuevo</button>
          </div>
      `;
    gameBoard.appendChild(gameOverScreen);

    // Guardar puntuación en ranking
    saveToRanking(playerName, enemiesKilled, gameTime);

    // Botón de reintentar
    document
      .getElementById("retry-button")
      .addEventListener("click", resetGame);
  }

  // Guardar puntuación en ranking
  function saveToRanking(name, enemiesKilled, time) {
    const score = enemiesKilled * 10 + (100 - time);

    fetch("juegosss.json")
      .then((response) => response.json())
      .then((data) => {
        data.rankings.push({
          name: name,
          enemiesKilled: enemiesKilled,
          time: time,
          score: score,
        });

        // Ordenar y mantener solo los 10 mejores
        data.rankings.sort((a, b) => b.score - a.score);
        data.rankings = data.rankings.slice(0, 10);

        // Guardar de vuelta
        return fetch("juegosss.json", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      })
      .catch((error) => console.error("Error al guardar ranking:", error));
  }

  // Resetear juego
  function resetGame() {
    // Limpiar todo lo existente
    const gameOverScreen = document.getElementById("game-over-screen");
    if (gameOverScreen) gameOverScreen.remove();

    // Reiniciar variables
    skullPositionX = 125;
    currentLevel = 1;
    enemiesKilled = 0;
    gameTime = 0;
    canStartGame = true;

    // Limpiar enemigos y balas existentes
    document.querySelectorAll(".enemy, .bullet").forEach((el) => el.remove());

    // Actualizar displays
    enemyCountDisplay.textContent = "Enemigos: 0";
    timeDisplay.textContent = "Tiempo: 0s";
    levelDisplay.textContent = "Nivel: 1";

    // Reiniciar posición de calavera
    skull.style.left = skullPositionX + "px";

    // Reiniciar spawner y temporizador
    startGameTimer();
    startEnemySpawner();
  }

  // [El resto del código de juego permanece similar al anterior,
  //  con pequeñas modificaciones para manejar los nuevos elementos]

  // Implementar lógica de subida de nivel
  function checkLevelUp() {
    const config = levelConfig[currentLevel];
    if (enemiesKilled >= config.enemiesForNextLevel && currentLevel < 10) {
      currentLevel++;
      levelDisplay.textContent = `Nivel: ${currentLevel}`;
      // Aquí podrías añadir una transición visual de nivel
    }
  }

  // Código similar al anterior, con adiciones para nuevas mecánicas
});
