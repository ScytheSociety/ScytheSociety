let canvas, ctx, player, bullets, enemies, gameInterval;
let playerName = "";
let playerAvatar = "";
let level = 1;
let enemiesKilled = 0;
let score = 0;
let gameTime = 0;
let cooldown = 0;
let levelUpEnemies = [20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240];
let backgroundImages = [];
let enemyImages = [];
let playerImage, bulletImage;
let lastShootTime = 0;
let playerDirection = 0;
let enemiesRemaining = 0; // Enemigos que faltan por aparecer
let spawnTimer = 0; // Contador para el spawn de enemigos
const SPAWN_RATE = 60; // Frames entre cada spawn de enemigo (60 frames = 1 segundo aprox)

window.onload = function () {
  loadGameAssets();
};

function loadGameAssets() {
  fetch("assets.json")
    .then((response) => response.json())
    .then((data) => {
      // Cargar backgrounds
      data.backgrounds.forEach((src, index) => {
        backgroundImages[index] = new Image();
        backgroundImages[index].src = src;
      });

      // Cargar enemigos
      data.enemies.forEach((src, index) => {
        enemyImages[index] = new Image();
        enemyImages[index].src = src;
      });

      // Cargar jugador y bala
      playerImage = new Image();
      playerImage.src = data.player;

      bulletImage = new Image();
      bulletImage.src = data.bullet;
    })
    .catch((error) => console.error("Error cargando assets:", error));
}

function createImage(src) {
  const img = new Image();
  img.src = src;
  img.onerror = () => console.error(`Error al cargar la imagen: ${src}`);
  return img;
}

function updatePlayerInfo() {
  document.getElementById("player-name").textContent = `Jugador: ${playerName}`;
  document.getElementById("player-avatar").textContent = `${playerAvatar}`;
}

function startGame() {
  playerName = document.getElementById("name").value;
  playerAvatar = document.getElementById("avatar").value;

  if (!playerName || !playerAvatar) {
    alert("Por favor, ingresa un nombre y un avatar válidos.");
    return;
  }

  document.getElementById("main-menu").style.display = "none";
  document.getElementById("game-area").style.display = "block";

  // Actualizar información del jugador
  updatePlayerInfo();

  // Inicializar canvas
  canvas = document.getElementById("game-canvas");
  if (!canvas) {
    console.error("No se encontró el canvas.");
    return;
  }
  ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 600;

  // Inicializar jugador
  player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    speed: 5,
    image: playerImage,
  };

  // Inicializar variables del juego
  bullets = [];
  enemies = [];
  score = 0;
  enemiesKilled = 0;
  gameTime = 0;

  startLevel();
  gameInterval = setInterval(gameLoop, 1000 / 60);
}

function startLevel() {
  enemies = [];
  cooldown = 0;
  enemiesRemaining = levelUpEnemies[level - 1]; // Establecer cuántos enemigos faltan por aparecer
  spawnTimer = 0;

  document.getElementById("level").textContent = `Nivel ${level}`;
}

function spawnEnemy() {
  const margin = 50;
  enemies.push({
    x: margin + Math.random() * (canvas.width - 2 * margin),
    y: -50, // Comenzar arriba del canvas
    width: 50,
    height: 50,
    speed: 0.2 + level * 0.1, // Reducido el multiplicador para que sea más lento
    image: enemyImages[level - 1],
  });
  enemiesRemaining--;
}

function gameLoop() {
  gameTime++;
  document.getElementById("time").textContent = `Tiempo: ${gameTime}s`;
  document.getElementById("score").textContent = `Puntuación: ${score}`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar background
  if (backgroundImages[level - 1] && backgroundImages[level - 1].complete) {
    ctx.drawImage(
      backgroundImages[level - 1],
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  // Sistema de spawn de enemigos
  if (enemiesRemaining > 0) {
    spawnTimer++;
    // Ajustar la tasa de spawn según el nivel
    const spawnDelay = Math.max(SPAWN_RATE - level * 5, 20); // Mínimo 20 frames de delay

    if (spawnTimer >= spawnDelay) {
      spawnEnemy();
      spawnTimer = 0;
    }
  }

  // Actualizar posición del jugador
  player.x += playerDirection * player.speed;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  drawPlayer();
  moveEnemies();
  updateBullets();
  checkCollisions();
  checkGameOver();
}

function drawPlayer() {
  if (!player.image.complete || player.image.naturalWidth === 0) {
    console.warn("La imagen del jugador no está lista.");
    return;
  }
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

function moveEnemies() {
  for (let enemy of enemies) {
    enemy.y += enemy.speed;
    ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
  }
}

function updateBullets() {
  for (let bullet of bullets) {
    bullet.y -= 10;
    ctx.drawImage(bulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
  }

  bullets = bullets.filter((bullet) => bullet.y > 0);
}

function checkCollisions() {
  for (let enemy of enemies) {
    for (let bullet of bullets) {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemiesKilled++;
        score += 10;
        enemies = enemies.filter((e) => e !== enemy);
        bullets = bullets.filter((b) => b !== bullet);
        document.getElementById(
          "enemies-killed"
        ).textContent = `Enemigos: ${enemiesKilled}`;

        // Cambiar al siguiente nivel solo si no quedan enemigos por spawner y todos han sido eliminados
        if (
          enemiesKilled >= levelUpEnemies[level - 1] &&
          enemiesRemaining === 0
        ) {
          level++;
          startLevel();
        }
      }
    }
  }
}

function checkGameOver() {
  for (let enemy of enemies) {
    if (enemy.y + enemy.height >= player.y) {
      gameOver();
      break;
    }
  }
}

function shootBullet() {
  const currentTime = Date.now();
  const cooldownTime = 1000 - level * 100; // Reduce el tiempo de cooldown con cada nivel (máximo 0.1s a nivel 10)

  // Si ha pasado el tiempo suficiente según el cooldown
  if (currentTime - lastShootTime > cooldownTime) {
    bullets.push({
      x: player.x + player.width / 2 - 5,
      y: player.y,
      width: 10,
      height: 20,
    });
    lastShootTime = currentTime; // Actualizar el tiempo del último disparo
  }
}

function gameOver() {
  clearInterval(gameInterval);
  document.getElementById("game-over").style.display = "block";
  document.getElementById("game-over-text").textContent = "Game Over";

  saveScore();
}

function restartGame() {
  document.getElementById("game-over").style.display = "none";
  startGame();
}

function saveScore() {
  const playerData = {
    name: playerName,
    avatar: playerAvatar,
    level: level,
    enemiesKilled: enemiesKilled,
    time: gameTime,
    score: score,
  };

  const ranking = JSON.parse(localStorage.getItem("ranking")) || [];
  ranking.push(playerData);
  localStorage.setItem("ranking", JSON.stringify(ranking));
}

function viewRanking() {
  window.location.href = "ranking.html";
}

function allowEmoji(event) {
  event.preventDefault();
  const pastedText = event.clipboardData.getData("text");
  // Verificar si es un emoji usando una expresión regular
  const emojiRegex = /(\p{Emoji})/u;
  if (emojiRegex.test(pastedText)) {
    document.getElementById("avatar").value = pastedText;
  } else {
    alert("Solo puedes pegar emojis.");
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") {
    playerDirection = -1;
  }
  if (e.key === "d" || e.key === "ArrowRight") {
    playerDirection = 1;
  }
  if (e.key === " ") {
    shootBullet();
  }
});

window.addEventListener("keyup", (e) => {
  if ((e.key === "a" || e.key === "ArrowLeft") && playerDirection === -1) {
    playerDirection = 0;
  }
  if ((e.key === "d" || e.key === "ArrowRight") && playerDirection === 1) {
    playerDirection = 0;
  }
});
