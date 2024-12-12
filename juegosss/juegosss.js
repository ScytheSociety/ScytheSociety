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

    // Player movement variables
    let playerX = gameArea.clientWidth / 2 - 25;
    let keys = {
      a: false,
      d: false,
    };
    let shootCooldown = false;

    // Set initial player position
    player.style.position = "absolute";
    player.style.bottom = "20px";
    player.style.left = `${playerX}px`;

    // Smooth movement function
    function updatePlayerMovement() {
      const moveSpeed = 5;
      const gameAreaWidth = gameArea.clientWidth - 50;

      if (keys.a && playerX > 0) {
        playerX -= moveSpeed;
      }
      if (keys.d && playerX < gameAreaWidth) {
        playerX += moveSpeed;
      }

      player.style.left = `${playerX}px`;
    }

    // Key event listeners for smooth movement
    document.addEventListener("keydown", function (event) {
      switch (event.key.toLowerCase()) {
        case "a":
          keys.a = true;
          break;
        case "d":
          keys.d = true;
          break;
        case " ":
          if (!shootCooldown) {
            createBullet();
            shootCooldown = true;
          }
          break;
      }
    });

    document.addEventListener("keyup", function (event) {
      switch (event.key.toLowerCase()) {
        case "a":
          keys.a = false;
          break;
        case "d":
          keys.d = false;
          break;
        case " ":
          shootCooldown = false;
          break;
      }
    });

    // Continuous movement loop
    const movementInterval = setInterval(updatePlayerMovement, 16); // ~60 fps

    function createBullet() {
      const bullet = document.createElement("div");
      bullet.classList.add("bullet");
      bullet.innerHTML = "\uD83E\uDDB4"; // Bone emoji
      bullet.style.position = "absolute";
      bullet.style.left = `${playerX + 25}px`;
      bullet.style.bottom = "60px";
      gameArea.appendChild(bullet);
      bullets.push(bullet);
      moveBullet(bullet);
    }

    function moveBullet(bullet) {
      const bulletInterval = setInterval(() => {
        let bulletBottom = parseInt(bullet.style.bottom);
        if (bulletBottom < gameArea.clientHeight) {
          bullet.style.bottom = `${bulletBottom + 10}px`;
          checkCollisions(bullet);
        } else {
          clearInterval(bulletInterval);
          bullet.remove();
          bullets = bullets.filter((b) => b !== bullet);
        }
      }, 20);
    }

    function checkCollisions(bullet) {
      enemies.forEach((enemy, index) => {
        if (isColliding(bullet, enemy)) {
          bullet.remove();
          bullets = bullets.filter((b) => b !== bullet);

          enemy.remove();
          enemies.splice(index, 1);
          enemiesKilled++;

          enemyCount.textContent = `Enemigos: ${enemiesKilled}`;
          checkLevelProgression();
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

    function checkLevelProgression() {
      if (
        enemiesKilled >= gameConfig.levels[currentLevel - 1].enemiesForNextLevel
      ) {
        currentLevel++;
        if (gameConfig.levels[currentLevel - 1]) {
          gameArea.style.backgroundImage = `url('${
            gameConfig.levels[currentLevel - 1].background
          }')`;
        }
        clearInterval(spawnInterval);
        spawnInterval = setInterval(
          spawnEnemy,
          Math.max(500, 2000 - currentLevel * 100)
        );
        levelCount.textContent = `Nivel: ${currentLevel}`;
      }
    }

    function spawnEnemy() {
      const enemy = document.createElement("div");
      enemy.classList.add("enemy");

      const currentLevelConfig = gameConfig.levels[currentLevel - 1];
      if (currentLevelConfig.enemySprite) {
        const enemyImg = document.createElement("img");
        enemyImg.src = currentLevelConfig.enemySprite;
        enemyImg.style.width = "40px";
        enemyImg.style.height = "40px";
        enemy.appendChild(enemyImg);
      } else {
        enemy.innerHTML = "\uD83D\uDC7E"; // Alien emoji
      }

      enemy.style.left = `${Math.random() * (gameArea.clientWidth - 50)}px`;
      enemy.style.top = "0px";
      gameArea.appendChild(enemy);
      enemies.push(enemy);

      const enemyInterval = setInterval(() => {
        const currentTop = parseInt(enemy.style.top);
        if (currentTop < gameArea.clientHeight - 50) {
          enemy.style.top = `${currentTop + currentLevel}px`;
        } else {
          clearInterval(enemyInterval);
          enemy.remove();
          enemies = enemies.filter((e) => e !== enemy);
          gameOver();
        }
      }, 50);
    }

    const spawnInterval = setInterval(spawnEnemy, 2000);

    gameTimer = setInterval(() => {
      gameTime++;
      timeCount.textContent = `Tiempo: ${gameTime}s`;
    }, 1000);

    function gameOver() {
      clearInterval(movementInterval);
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
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(() => {
          alert("Puntuación guardada exitosamente");
        })
        .catch(() => {
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
