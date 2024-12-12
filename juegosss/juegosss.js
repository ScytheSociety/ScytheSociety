document.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.querySelector("#login-screen");
  const gameContainer = document.querySelector("#game-container");
  const playerForm = document.querySelector("#playerForm");

  // Configuración de niveles con fondos y enemigos personalizables
  const gameConfig = {
    levels: [
      {
        level: 1,
        speed: 1,
        spawnRate: 2000,
        enemiesForNextLevel: 20,
        background:
          "https://images.nightcafe.studio/jobs/vpbclnBxKsCSwkqT7DSx/vpbclnBxKsCSwkqT7DSx--1--7f3mk.jpg", // Fondo del nivel
        enemySprite: "https://file5s.ratemyserver.net/mobs/1904.gif", // Sprite de enemigo
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
      // Puedes añadir más niveles con sus configuraciones
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

    // Establecer fondo inicial
    gameArea.style.backgroundImage = `url('${gameConfig.levels[0].background}')`;
    gameArea.style.backgroundSize = "cover";

    // Movimiento del jugador
    let playerX = 125; // Posición inicial
    player.style.left = `${playerX}px`;

    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          playerX = Math.max(0, playerX - 10);
          break;
        case "ArrowRight":
          playerX = Math.min(250, playerX + 10);
          break;
        case " ": // Espacio para disparar
          shoot();
          break;
      }
      player.style.left = `${playerX}px`;
    });

    // Disparar
    function shoot() {
      const bullet = document.createElement("div");
      bullet.classList.add("bullet");
      bullet.innerHTML = "🦴";
      bullet.style.left = `${playerX + 15}px`;
      bullet.style.bottom = "60px";
      gameArea.appendChild(bullet);
      bullets.push(bullet);

      const bulletInterval = setInterval(() => {
        const currentBottom = parseInt(bullet.style.bottom || "60");
        bullet.style.bottom = `${currentBottom + 10}px`;

        // Colisión con enemigos
        enemies.forEach((enemy, index) => {
          if (isColliding(bullet, enemy)) {
            gameArea.removeChild(bullet);
            gameArea.removeChild(enemy);
            bullets.splice(bullets.indexOf(bullet), 1);
            enemies.splice(index, 1);
            enemiesKilled++;
            enemyCount.textContent = `Enemigos: ${enemiesKilled}`;
          }
        });

        // Remover bala si sale de pantalla
        if (currentBottom > 600) {
          clearInterval(bulletInterval);
          gameArea.removeChild(bullet);
          bullets.splice(bullets.indexOf(bullet), 1);
        }
      }, 50);
    }

    // Detectar colisiones
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

      // Usar sprite de enemigo personalizado o emoji
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

        if (currentTop > 500) {
          gameOver();
        }
      }

      const enemyInterval = setInterval(moveEnemy, 50);
    }

    const spawnInterval = setInterval(spawnEnemy, 2000 - currentLevel * 100);

    function gameOver() {
      clearInterval(gameTimer);
      clearInterval(spawnInterval);

      const gameOverScreen = document.createElement("div");
      gameOverScreen.id = "game-over-screen";
      gameOverScreen.innerHTML = `
        <h2 style="color: white;">Game Over</h2>
        <p style="color: white;">Jugador: ${playerName}</p>
        <p style="color: white;">Enemigos eliminados: ${enemiesKilled}</p>
        <p style="color: white;">Tiempo: ${gameTime} segundos</p>
        <button id="return-btn" onclick="window.location.href='juegosss.html'">Regresar</button>
      `;
      gameContainer.appendChild(gameOverScreen);
    }
  }
});
