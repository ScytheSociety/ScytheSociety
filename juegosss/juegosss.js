document.addEventListener("DOMContentLoaded", function () {
  const gameContainer = document.getElementById("game-container");
  const startButton = document.getElementById("play-button");
  const gameBoard = document.getElementById("game-board");
  const winMessage = document.getElementById("win-message");
  const loseMessage = document.getElementById("lose-message");

  // Crear calavera
  const skull = document.createElement("div");
  skull.id = "skull";
  skull.innerHTML = "💀";
  gameBoard.appendChild(skull);

  let skullPositionX = 125;
  let currentLevel = 1;
  let canShoot = true;
  let enemySpeed = 1;
  let bullets = [];
  let enemies = [];

  // Configuraciones de niveles
  const levelConfig = {
    1: { enemySpeed: 1, spawnRate: 2000 },
    2: { enemySpeed: 2, spawnRate: 1800 },
    3: { enemySpeed: 3, spawnRate: 1600 },
    4: { enemySpeed: 4, spawnRate: 1400 },
    5: { enemySpeed: 5, spawnRate: 1200 },
    6: { enemySpeed: 6, spawnRate: 1000 },
    7: { enemySpeed: 7, spawnRate: 800 },
    8: { enemySpeed: 8, spawnRate: 600 },
    9: { enemySpeed: 9, spawnRate: 400 },
    10: { enemySpeed: 10, spawnRate: 200 },
  };

  // Mostrar el tablero del juego
  startButton.addEventListener("click", function () {
    document.getElementById("welcome-screen").style.display = "none";
    gameBoard.style.display = "flex";
    startGame();
  });

  // Control de movimiento y disparo
  document.addEventListener("keydown", function (event) {
    switch (event.key) {
      case "ArrowLeft":
        skullPositionX = Math.max(0, skullPositionX - 10);
        break;
      case "ArrowRight":
        skullPositionX = Math.min(250, skullPositionX + 10);
        break;
      case " ":
        if (canShoot) {
          createBullet();
          canShoot = false;
        }
        break;
    }
    skull.style.left = skullPositionX + "px";
  });

  document.addEventListener("keyup", function (event) {
    if (event.key === " ") {
      canShoot = true;
    }
  });

  // Crear hueso/bala
  function createBullet() {
    const bullet = document.createElement("div");
    bullet.classList.add("bullet");
    bullet.style.left = skullPositionX + 15 + "px";
    bullet.style.bottom = "70px";
    bullet.innerHTML = "🦴";
    gameBoard.appendChild(bullet);
    moveBullet(bullet);
  }

  // Mover huesos
  function moveBullet(bullet) {
    let bulletPosition = parseInt(bullet.style.bottom);
    const bulletInterval = setInterval(function () {
      if (bulletPosition < 600) {
        bulletPosition += 10;
        bullet.style.bottom = bulletPosition + "px";
        checkCollisions(bullet);
      } else {
        clearInterval(bulletInterval);
        bullet.remove();
      }
    }, 20);
  }

  // Crear enemigos
  function createEnemy() {
    const enemy = document.createElement("div");
    enemy.classList.add("enemy");
    enemy.innerHTML = "👽";
    enemy.style.left = Math.random() * 250 + "px";
    enemy.style.top = "0px";
    gameBoard.appendChild(enemy);
    moveEnemy(enemy);
  }

  // Mover enemigos
  function moveEnemy(enemy) {
    let enemyPosition = 0;
    const enemyInterval = setInterval(function () {
      enemyPosition += currentLevel;
      enemy.style.top = enemyPosition + "px";

      if (enemyPosition > 550) {
        clearInterval(enemyInterval);
        enemy.remove();
        updateLoseCondition();
      }
    }, 50);
  }

  // Iniciar juego
  function startGame() {
    currentLevel = 1;
    updateLevelDisplay();
    startEnemySpawner();
  }

  // Spawner de enemigos
  function startEnemySpawner() {
    const config = levelConfig[currentLevel];
    const spawnerInterval = setInterval(() => {
      createEnemy();
    }, config.spawnRate);
  }

  // Verificar colisiones
  function checkCollisions(bullet) {
    const enemies = document.querySelectorAll(".enemy");
    enemies.forEach((enemy) => {
      if (isColliding(bullet, enemy)) {
        bullet.remove();
        enemy.remove();
        updateScore();
      }
    });
  }

  // Detectar colisión
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

  // Actualizar puntuación y nivel
  function updateScore() {
    // Implementar lógica de puntuación
  }

  // Actualizar condición de derrota
  function updateLoseCondition() {
    // Implementar lógica de derrota
  }

  // Actualizar display de nivel
  function updateLevelDisplay() {
    // Implementar display de nivel
  }
});
