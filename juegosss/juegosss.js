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

window.onload = function () {
  loadGameAssets();
};

function loadGameAssets() {
  fetch("assets.json")
    .then((response) => response.json())
    .then((data) => {
      backgroundImages = data.backgrounds.map((src) => createImage(src));
      enemyImages = data.enemies.map((src) => createImage(src));
      playerImage = createImage(data.player);
      bulletImage = createImage(data.bullet);
    });
}

function createImage(src) {
  const img = new Image();
  img.src = src;
  img.onerror = () => console.error(`Error al cargar la imagen: ${src}`);
  return img;
}

function startGame() {
  playerName = document.getElementById("name").value;
  playerAvatar = document.getElementById("avatar").value;

  if (!playerName || !playerAvatar) {
    alert("Por favor, ingresa un nombre y un avatar válidos.");
    return;
  }

  // Mostrar el área de juego y ocultar el menú principal
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("game-area").style.display = "block";

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
    width: 150,
    height: 150,
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

  let enemyCount = levelUpEnemies[level - 1];

  for (let i = 0; i < enemyCount; i++) {
    enemies.push({
      x: Math.random() * canvas.width,
      y: (Math.random() * canvas.height) / 2,
      width: 50,
      height: 50,
      speed: level * 0.5,
      image: enemyImages[level - 1],
    });
  }

  document.getElementById("level").textContent = `Nivel ${level}`;
  document.body.style.backgroundImage = `url('${backgroundImages[level - 1]}')`;
}

function gameLoop() {
  gameTime++;
  document.getElementById("time").textContent = `Tiempo: ${gameTime}s`;
  document.getElementById("score").textContent = `Puntuación: ${score}`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

        if (enemiesKilled >= levelUpEnemies[level - 1]) {
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
  if (cooldown <= 0) {
    bullets.push({
      x: player.x + player.width / 2 - 5,
      y: player.y,
      width: 10,
      height: 20,
    });
    cooldown = 30 - level;
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
  const pastedText = event.clipboardData.getData("text");
  if (pastedText.length === 1) {
    event.preventDefault(); // Prevenimos el comportamiento por defecto
    event.target.value = pastedText; // Asignamos el emoji al campo de texto
  } else {
    alert("Solo puedes pegar un emoji.");
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") {
    player.x -= player.speed;
  }
  if (e.key === "d" || e.key === "ArrowRight") {
    player.x += player.speed;
  }
  if (e.key === " ") {
    shootBullet();
  }
});
