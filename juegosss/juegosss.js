document.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.querySelector("#login-screen");
  const gameContainer = document.querySelector("#game-container");
  const playerForm = document.querySelector("#playerForm");
  const rankingButton = document.querySelector("#rankingButton");

  // Game Configuration
  const gameConfig = {
    backgroundImage: "https://example.com/space-background.jpg",
    enemyImage: "https://example.com/enemy.png",
    levels: [
      { level: 1, speed: 1, spawnRate: 2000, enemiesForNextLevel: 5 },
      { level: 2, speed: 2, spawnRate: 1800, enemiesForNextLevel: 10 },
      { level: 3, speed: 3, spawnRate: 1600, enemiesForNextLevel: 15 },
      { level: 4, speed: 4, spawnRate: 1400, enemiesForNextLevel: 20 },
      { level: 5, speed: 5, spawnRate: 1200, enemiesForNextLevel: 25 },
      { level: 6, speed: 6, spawnRate: 1000, enemiesForNextLevel: 30 },
      { level: 7, speed: 7, spawnRate: 800, enemiesForNextLevel: 35 },
      { level: 8, speed: 8, spawnRate: 600, enemiesForNextLevel: 40 },
      { level: 9, speed: 9, spawnRate: 400, enemiesForNextLevel: 45 },
      { level: 10, speed: 10, spawnRate: 200, enemiesForNextLevel: 50 },
    ],
  };

  // Player Registration
  playerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const playerName = document.querySelector("#playerName").value;
    const playerAvatar = document.querySelector("#playerAvatar").value;
    const characterEmoji = document.querySelector("#characterEmoji").value;

    // Validate input
    if (playerAvatar && characterEmoji) {
      alert("Elige solo avatar o emoji, no ambos");
      return;
    }

    // Store player data
    localStorage.setItem("playerName", playerName);
    localStorage.setItem("playerAvatar", playerAvatar || "");
    localStorage.setItem("characterEmoji", characterEmoji || "💀");

    // Start game
    startGame();
  });

  // Game Variables
  let currentLevel = 1;
  let enemiesKilled = 0;
  let gameTime = 0;
  let gameTimer;
  let enemies = [];

  function startGame() {
    loginScreen.style.display = "none";
    gameContainer.style.display = "block";

    const playerName = localStorage.getItem("playerName");
    const characterEmoji = localStorage.getItem("characterEmoji") || "💀";
    const gameArea = document.querySelector("#game-area");
    const playerInfo = document.querySelector("#player-info");
    const enemyCount = document.querySelector("#enemy-count");
    const timeCount = document.querySelector("#time-count");
    const levelCount = document.querySelector("#level-count");

    // Setup player
    const player = document.createElement("div");
    player.id = "player-character";
    player.innerHTML = characterEmoji;
    document.querySelector("#player").appendChild(player);

    // Player info
    playerInfo.innerHTML = `<h2>${playerName}</h2>`;

    // Start game timer
    gameTimer = setInterval(() => {
      gameTime++;
      timeCount.textContent = `Tiempo: ${gameTime}s`;
    }, 1000);

    // Enemy spawning
    function spawnEnemy() {
      const enemy = document.createElement("div");
      enemy.classList.add("enemy");
      enemy.innerHTML = "👾"; // Customizable enemy
      enemy.style.left = `${Math.random() * 250}px`;
      gameArea.appendChild(enemy);
      enemies.push(enemy);

      // Move enemy down
      function moveEnemy() {
        const currentTop = parseInt(enemy.style.top || "0");
        enemy.style.top = `${currentTop + currentLevel}px`;

        // Check game over
        if (currentTop > 500) {
          gameOver();
        }
      }

      const enemyInterval = setInterval(moveEnemy, 50);
    }

    // Start spawning enemies
    const spawnInterval = setInterval(spawnEnemy, 2000 - currentLevel * 100);

    // Level progression
    function checkLevelUp() {
      const currentConfig = gameConfig.levels.find(
        (l) => l.level === currentLevel
      );
      if (
        enemiesKilled >= currentConfig.enemiesForNextLevel &&
        currentLevel < 10
      ) {
        currentLevel++;
        levelCount.textContent = `Nivel: ${currentLevel}`;

        // Level transition effect
        const levelTransition = document.createElement("div");
        levelTransition.textContent = `¡Pasaste al Nivel ${currentLevel}!`;
        gameArea.appendChild(levelTransition);

        setTimeout(() => {
          gameArea.removeChild(levelTransition);
        }, 2000);
      }
    }

    // Game over function
    function gameOver() {
      clearInterval(gameTimer);
      clearInterval(spawnInterval);

      // Create game over screen
      const gameOverScreen = document.createElement("div");
      gameOverScreen.innerHTML = `
              <h2>Game Over</h2>
              <p>Jugador: ${playerName}</p>
              <p>Enemigos eliminados: ${enemiesKilled}</p>
              <p>Tiempo: ${gameTime} segundos</p>
              <button id="return-btn">Regresar</button>
          `;
      gameOverScreen.id = "game-over-screen";
      gameContainer.appendChild(gameOverScreen);

      // Save to rankings
      saveToRankings(playerName, enemiesKilled, gameTime);

      // Return button
      document.getElementById("return-btn").addEventListener("click", () => {
        gameContainer.style.display = "none";
        loginScreen.style.display = "block";
        gameContainer.innerHTML = ""; // Reset game
      });
    }

    // Ranking save function
    function saveToRankings(name, kills, time) {
      const score = kills * 10 + (100 - time);

      fetch("juegosss.json")
        .then((response) => response.json())
        .then((data) => {
          data.rankings.push({
            name: name,
            enemiesKilled: kills,
            time: time,
            score: score,
          });

          // Sort and keep top 10
          data.rankings.sort((a, b) => b.score - a.score);
          data.rankings = data.rankings.slice(0, 10);

          return fetch("juegosss.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
        })
        .catch((error) => console.error("Error:", error));
    }
  }

  // Ranking button
  rankingButton.addEventListener("click", () => {
    window.location.href = "rankingsss.html";
  });
});
