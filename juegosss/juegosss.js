document.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.querySelector("#login-screen");
  const gameContainer = document.querySelector("#game-container");
  const playerForm = document.querySelector("#playerForm");
  const API_URL = "http://51.195.219.193:5000/submit_ranking";

  const gameConfig = {
    levels: [
      {
        level: 1,
        speed: 1,
        spawnRate: 2000,
        enemiesForNextLevel: 20,
        background:
          "https://images.nightcafe.studio/jobs/vpbclnBxKsCSwkqT7DSx/vpbclnBxKsCSwkqT7DSx--1--7f3mk.jpg",
        enemySprite: "https://file5s.ratemyserver.net/mobs/1904.gif",
      },
      {
        level: 2,
        speed: 2,
        spawnRate: 1800,
        enemiesForNextLevel: 60,
        background:
          "https://images.nightcafe.studio/jobs/lcHVhwRpZB2usrCuJHVL/lcHVhwRpZB2usrCuJHVL--1--bvupt.jpg",
        enemySprite: "https://file5s.ratemyserver.net/mobs/1726.gif",
      },
    ],
  };

  playerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const playerName = document.querySelector("#playerName").value.trim();
    const playerAvatar = document.querySelector("#playerAvatar").value.trim();
    const characterEmoji = document
      .querySelector("#characterEmoji")
      .value.trim();

    if (!playerName) {
      alert("Por favor, ingresa un nombre de jugador");
      return;
    }

    if (playerAvatar && characterEmoji) {
      alert("Elige solo avatar o emoji, no ambos");
      return;
    }

    localStorage.setItem("playerName", playerName);
    localStorage.setItem("playerAvatar", playerAvatar || "");
    localStorage.setItem("characterEmoji", characterEmoji || "💀");

    loginScreen.style.display = "none";
    gameContainer.style.display = "block";

    initializeGame();
  });

  function initializeGame() {
    const playerName = localStorage.getItem("playerName");
    const characterEmoji = localStorage.getItem("characterEmoji") || "💀";
    const gameArea = document.querySelector("#game-area");
    const gameAreaWidth = gameArea.clientWidth;
    const gameAreaHeight = gameArea.clientHeight;
    const playerInfo = document.querySelector("#player-info");
    const enemyCount = document.querySelector("#enemy-count");
    const timeCount = document.querySelector("#time-count");
    const levelCount = document.querySelector("#level-count");

    gameArea.innerHTML = "";
    document.querySelector("#player").innerHTML = "";

    playerInfo.innerHTML = `<h2>${playerName}</h2>`;
    enemyCount.textContent = "Enemigos: 0";
    timeCount.textContent = "Tiempo: 0s";
    levelCount.textContent = "Nivel: 1";

    const player = document.createElement("div");
    player.id = "player-character";
    player.innerHTML = characterEmoji;
    document.querySelector("#player").appendChild(player);

    let currentLevel = 1;
    let enemiesKilled = 0;
    let gameTime = 0;
    let gameTimer;
    let enemies = [];
    let bullets = [];
    let canShoot = true;

    gameArea.style.backgroundImage = `url('${gameConfig.levels[0].background}')`;
    gameArea.style.backgroundSize = "cover";

    let playerX = 125;
    player.style.left = `${playerX}px`;

    const keys = {};
    document.addEventListener("keydown", (e) => {
      keys[e.key] = true;
      handleKeyPress(e);
    });

    document.addEventListener("keyup", (e) => {
      keys[e.key] = false;
    });

    function handleKeyPress(e) {
      switch (e.key) {
        case "ArrowLeft":
          playerX = Math.max(0, playerX - 10);
          player.style.left = `${playerX}px`;
          // Opcional: Rotar ligeramente el personaje hacia la izquierda
          player.style.transform = "rotate(-10deg)";
          break;
        case "ArrowRight":
          playerX = Math.min(
            gameArea.clientWidth - player.offsetWidth,
            playerX + 10
          );
          player.style.left = `${playerX}px`;
          // Opcional: Rotar ligeramente el personaje hacia la derecha
          player.style.transform = "rotate(10deg)";
          break;
      }
    }

    // Restaurar posición original cuando se suelta la tecla
    document.addEventListener("keyup", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        player.style.transform = "rotate(0deg)";
      }
    });

    function checkLevelProgression() {
      if (
        enemiesKilled >= gameConfig.levels[currentLevel - 1].enemiesForNextLevel
      ) {
        currentLevel++;

        // Actualizar fondo
        if (gameConfig.levels[currentLevel - 1]) {
          gameArea.style.backgroundImage = `url('${
            gameConfig.levels[currentLevel - 1].background
          }')`;

          // Actualizar sprite de enemigos
          const newEnemySprite =
            gameConfig.levels[currentLevel - 1].enemySprite;
          // Lógica para cambiar sprite de enemigos
        }

        // Aumentar dificultad
        clearInterval(spawnInterval);
        const newSpawnRate = 2000 - currentLevel * 100;
        spawnInterval = setInterval(spawnEnemy, Math.max(500, newSpawnRate));

        // Actualizar contador de nivel
        levelCount.textContent = `Nivel: ${currentLevel}`;
      }
    }

    function shoot() {
      // Modificar para que las balas salgan desde la posición actual del jugador
      const bullet = document.createElement("div");
      bullet.classList.add("bullet");
      bullet.innerHTML = "🦴";
      bullet.style.left = `${playerX + player.offsetWidth / 2}px`;
      bullet.style.bottom = "60px";
      gameArea.appendChild(bullet);
      bullets.push(bullet);

      // Llamar a checkLevelProgression después de matar un enemigo
      enemies.forEach((enemy, index) => {
        if (isColliding(bullet, enemy)) {
          // ... código anterior de colisión ...
          checkLevelProgression(); // Añadir esta línea
        }
      });
    }

    function isColliding(a, b) {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return !(
        aRect.top > bRect.bottom ||
        aRect.right < bRect.left ||
        aRect.bottom < bRect.top ||
        aRect.left > bRect.right
      );
    }

    gameTimer = setInterval(() => {
      gameTime++;
      timeCount.textContent = `Tiempo: ${gameTime}s`;
    }, 1000);

    function spawnEnemy() {
      const enemy = document.createElement("div");
      enemy.classList.add("enemy");

      const currentLevelConfig = gameConfig.levels.find(
        (l) => l.level === currentLevel
      );
      if (currentLevelConfig.enemySprite) {
        const enemyImg = document.createElement("img");
        enemyImg.src = currentLevelConfig.enemySprite;
        enemyImg.style.width = "40px";
        enemyImg.style.height = "40px";
        enemy.appendChild(enemyImg);
      } else {
        enemy.innerHTML = "👾";
      }

      enemy.style.left = `${Math.random() * 250}px`;
      gameArea.appendChild(enemy);
      enemies.push(enemy);

      function moveEnemy() {
        const currentTop = parseInt(enemy.style.top || "0");
        enemy.style.top = `${currentTop + currentLevel}px`;

        const gameAreaRect = gameArea.getBoundingClientRect();
        const enemyRect = enemy.getBoundingClientRect();
        if (enemyRect.bottom >= gameAreaRect.bottom) {
          gameOver();
          clearInterval(enemyInterval);
        }
      }

      const enemyInterval = setInterval(moveEnemy, 50);
    }

    const spawnInterval = setInterval(spawnEnemy, 2000 - currentLevel * 100);

    function gameOver() {
      clearInterval(gameTimer);
      clearInterval(spawnInterval);

      const score = Math.round(enemiesKilled * 10 - gameTime);

      fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: playerName,
          enemiesKilled: enemiesKilled,
          time: gameTime,
          score: score,
        }),
      })
        .then((response) => {
          console.log("Server response status:", response.status);
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          console.log("Ranking saved:", data);
          alert("Puntuación guardada exitosamente");
        })
        .catch((error) => {
          console.error("Error saving ranking:", error);
          alert("No se pudo guardar la puntuación. Revisa tu conexión.");
        });

      const gameOverScreen = document.createElement("div");
      gameOverScreen.id = "game-over-screen";
      gameOverScreen.innerHTML = `
          <h2 style="color: white;">Game Over</h2>
          <p style="color: white;">Jugador: ${playerName}</p>
          <p style="color: white;">Enemigos eliminados: ${enemiesKilled}</p>
          <p style="color: white;">Tiempo: ${gameTime} segundos</p>
          <p style="color: white;">Puntuación: ${score}</p>
          <button id="return-btn" onclick="window.location.href='rankingsss.html'">Ver Rankings</button>
      `;
      gameContainer.appendChild(gameOverScreen);
    }
  }
});
