let canvas, ctx, player, bullets, enemies, gameInterval;
let playerName = "";
let playerAvatar = "";
let level = 1;
let enemiesKilled = 0;
let score = 0;
let gameTime = 0;
let cooldown = 0;
let currentLevelEnemies = 0;
let totalEnemiesKilled = 0;
let levelUpEnemies = [50, 150, 450, 1350, 4050, 12150, 36450, 109350, 328050];
let isLevelTransition = false;
let backgroundImages = [];
let enemyImages = [];
let playerImage, bulletImage;
let lastShootTime = 0;
let playerDirection = 0;
let enemiesRemaining = 0;
let spawnTimer = 0;
let PLAYER_WIDTH = 80;
let PLAYER_HEIGHT = 80;
let BULLET_WIDTH = 20;
let BULLET_HEIGHT = 40;
let isMobile = false;
let touchStartX = 0;
let lastTapTime = 0;
let canShoot = true;
const SPAWN_RATE = 60;
const SHEET_URL = 'https://sheetdb.io/api/v1/0agliopzbpm6x';
const SECRET_KEY = 'hell_game_2024';
const sounds = {
  shoot: new Audio('sounds/shoot.mp3'),
  hit: new Audio('sounds/hit.mp3'),
  gameOver: new Audio('sounds/gameover.mp3'),
  victory: new Audio('sounds/victory.mp3'),
  levelUp: new Audio('sounds/levelup.mp3'),
  background: new Audio('sounds/background.mp3')
};

window.onload = function () {
  isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  setupResponsiveCanvas();
  window.addEventListener("resize", setupResponsiveCanvas);
  loadGameAssets();
};

function playSound(soundName) {
  if (sounds[soundName]) {
      const sound = sounds[soundName].cloneNode();
      sound.volume = soundName === 'background' ? 0.3 : 0.5;
      sound.play();
  }
}

function startBackgroundMusic() {
  sounds.background.loop = true;
  sounds.background.volume = 0.3;
  sounds.background.play();
}

function stopBackgroundMusic() {
  sounds.background.pause();
  sounds.background.currentTime = 0;
}

function setupResponsiveCanvas() {
  canvas = document.getElementById("game-canvas");
  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Ajustar tamaños proporcionalmente
  PLAYER_WIDTH = Math.min(canvas.width * 0.08, 60);
  PLAYER_HEIGHT = PLAYER_WIDTH;
  BULLET_WIDTH = PLAYER_WIDTH * 0.25;
  BULLET_HEIGHT = BULLET_WIDTH * 2;

  // Ajustar la posición Y del jugador para que esté visible en móvil
  const bottomMargin = isMobile ? canvas.height * 0.2 : canvas.height * 0.1;
  
  player = {
      ...player,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      // Reducir velocidad en móvil
      speed: isMobile ? canvas.width * 0.004 : canvas.width * 0.005,
      x: canvas.width / 2 - PLAYER_WIDTH / 2,
      y: canvas.height - PLAYER_HEIGHT - bottomMargin,
  };
}

function setupTouchControls() {
  if (!isMobile) return;

  let touchStartX = 0;
  let lastTapTime = 0;
  let touchThreshold = 20; // Umbral para detectar movimiento

  canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      touchStartX = e.touches[0].clientX;

      const currentTime = Date.now();
      if (currentTime - lastTapTime < 300) {
          shootBullet();
      }
      lastTapTime = currentTime;
  });

  canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const touchX = e.touches[0].clientX;
      const diffX = touchX - touchStartX;

      // Aplicar movimiento solo si supera el umbral
      if (Math.abs(diffX) > touchThreshold) {
          playerDirection = diffX > 0 ? 0.5 : -0.5; // Reducir la velocidad
          player.x += playerDirection * player.speed;
          player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
      } else {
          playerDirection = 0;
      }

      touchStartX = touchX;
  });

  canvas.addEventListener("touchend", () => {
      playerDirection = 0;
  });
}

function loadGameAssets() {
  fetch("assets.json")
    .then((response) => response.json())
    .then((data) => {
      data.backgrounds.forEach((src, index) => {
        backgroundImages[index] = new Image();
        backgroundImages[index].src = src;
      });

      enemyImages = data.enemies.map((src) => {
        const img = new Image();
        img.style = "";
        img.src = src;
        return img;
      });

      playerImage = new Image();
      playerImage.style = "";
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

  if (!playerName || !playerAvatar || playerName.length < 3) {
    alert(
      "Por favor, ingresa un nombre (mínimo 3 caracteres) y un avatar (1 caracter)"
    );
    return;
  }

  level = 1;
  enemiesKilled = 0;
  score = 0;
  gameTime = 0;

  document.getElementById("level").textContent = `Nivel ${level}`;
  document.getElementById(
    "enemies-killed"
  ).textContent = `Enemigos: ${enemiesKilled}`;
  document.getElementById("time").textContent = `Tiempo: 0s`;
  document.getElementById("score").textContent = `Puntuación: 0`;

  document.getElementById("main-menu").style.display = "none";
  document.getElementById("game-area").style.display = "block";

  updatePlayerInfo();

  canvas = document.getElementById("game-canvas");
  if (!canvas) {
    console.error("No se encontró el canvas.");
    return;
  }
  ctx = canvas.getContext("2d");

  setupResponsiveCanvas();
  setupTouchControls();

  player = {
    x: canvas.width / 2 - PLAYER_WIDTH / 2,
    y: canvas.height - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: isMobile ? canvas.width * 0.015 : canvas.width * 0.01,
    image: playerImage,
  };

  bullets = [];
  enemies = [];
  startLevel();
  gameInterval = setInterval(gameLoop, 1000 / 60);
}

function startLevel() {
  enemies = [];
  cooldown = 0;
  enemiesRemaining = levelUpEnemies[level - 1];
  currentLevelEnemies = 0;
  spawnTimer = 0;

  showLevelTransition();
}

function showLevelTransition() {
  isLevelTransition = true;
  const transition = document.createElement('div');
  transition.style.position = 'fixed';
  transition.style.top = '50%';
  transition.style.left = '50%';
  transition.style.transform = 'translate(-50%, -50%)';
  transition.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  transition.style.padding = '20px';
  transition.style.borderRadius = '10px';
  transition.style.zIndex = '1000';
  transition.style.fontSize = '2em';
  transition.style.color = 'white';
  transition.innerHTML = `NIVEL ${level}`;
  document.body.appendChild(transition);

  playSound('levelUp');

  setTimeout(() => {
      document.body.removeChild(transition);
      isLevelTransition = false;
  }, 2000);
}

class SpriteAnimation {
  constructor(imageUrl, frameWidth, frameHeight, frameCount, frameRate) {
      this.image = new Image();
      this.image.src = imageUrl;
      this.frameWidth = frameWidth;
      this.frameHeight = frameHeight;
      this.frameCount = frameCount;
      this.frameRate = frameRate;
      this.currentFrame = 0;
      this.frameTimer = 0;
  }

  update() {
      this.frameTimer++;
      if (this.frameTimer >= this.frameRate) {
          this.currentFrame = (this.currentFrame + 1) % this.frameCount;
          this.frameTimer = 0;
      }
  }

  draw(ctx, x, y, width, height) {
      ctx.drawImage(
          this.image,
          this.currentFrame * this.frameWidth,
          0,
          this.frameWidth,
          this.frameHeight,
          x,
          y,
          width,
          height
      );
  }
}

function spawnEnemy() {
  const enemyWidth = Math.min(canvas.width * 0.08, 50);
  const margin = enemyWidth;
  
  const enemy = new Enemy(
      margin + Math.random() * (canvas.width - 2 * margin),
      -enemyWidth,
      enemyWidth,
      enemyWidth,
      (0.5 + level * 0.2) * (canvas.height / 600),
      enemyImages[level - 1]
  );
  
  enemies.push(enemy);
  enemiesRemaining--;
}

function gameLoop() {
  gameTime++;
  document.getElementById("time").textContent = `Tiempo: ${gameTime}s`;
  document.getElementById("score").textContent = `Puntuación: ${score}`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (backgroundImages[level - 1] && backgroundImages[level - 1].complete) {
    ctx.drawImage(
      backgroundImages[level - 1],
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  if (enemiesRemaining > 0) {
    spawnTimer++;
    const spawnDelay = Math.max(SPAWN_RATE - level * 5, 20);

    if (spawnTimer >= spawnDelay) {
      spawnEnemy();
      spawnTimer = 0;
    }
  }

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

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
  ctx.imageSmoothingEnabled = true;
}

function moveEnemies() {
  ctx.imageSmoothingEnabled = false;
  for (let enemy of enemies) {
      enemy.update();
      enemy.draw(ctx);
  }
  ctx.imageSmoothingEnabled = true;
}

function updateBullets() {
  const bulletSpeed = canvas.height * 0.02;

  for (let bullet of bullets) {
    bullet.y -= bulletSpeed;
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
        playSound('hit'); // Añadido aquí
        document.getElementById(
          "enemies-killed"
        ).textContent = `Enemigos: ${enemiesKilled}`;

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
            return;
        }
    }

    if (level > levelUpEnemies.length) {
        victory();
    }
}

function shootBullet() {
  const currentTime = Date.now();
  const cooldownTime = 0;

  if (currentTime - lastShootTime > cooldownTime) {
    bullets.push({
      x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
      y: player.y,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
    });
    lastShootTime = currentTime;
  }
}

function gameOver() {
    clearInterval(gameInterval);
    document.getElementById("game-over").style.display = "block";
    document.getElementById("game-over-text").textContent = "Game Over 💀";
    playSound('gameOver'); // Añadido aquí
}

function restartGame() {
  document.getElementById("game-over").style.display = "none";
  startGame();
}

async function saveAndViewRanking() {
    await saveScore();
    viewRanking();
    document.getElementById("game-over").style.display = "none";
}

async function saveScore() {
  const playerData = {
      date: new Date().toISOString(),
      avatar: playerAvatar,
      name: playerName,
      level: level,
      enemiesKilled: enemiesKilled,
      time: gameTime,
      score: score,
      status: document.getElementById("game-over-text").textContent.includes("Victoria") ? "Victoria" : "Derrota"
  };

  try {
      const response = await fetch(SHEET_URL, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              data: [playerData]
          })
      });
      
      if (response.ok) {
          alert("¡Puntuación guardada con éxito! 🎉");  
      } else {
          throw new Error("Error al guardar la puntuación");
      }
  } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar la puntuación. Por favor, inténtalo de nuevo.");
  }
}

function victory() {
  clearInterval(gameInterval);
  document.getElementById("game-over").style.display = "block";
  document.getElementById("game-over-text").textContent = "¡Victoria! 🎉";
  playSound('victory'); // Añadido aquí
}

async function viewRanking() {
try {
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("game-area").style.display = "none";

    const rankingContainer = document.getElementById("ranking-container");
    rankingContainer.style.display = "block";

    const response = await fetch(SHEET_URL);
    const data = await response.json();

    const sortedData = data.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.time - b.time;
    });

    rankingContainer.innerHTML = `
        <h2>🏆 Ranking de Jugadores 🏆</h2>
        <table>
            <tr>
                <th>Pos</th>
                <th>Avatar</th>
                <th>Nombre</th>
                <th>Nivel</th>
                <th>Enemigos</th>
                <th>Tiempo</th>
                <th>Score</th>
                <th>Estado</th>
            </tr>
            ${sortedData.map((player, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${player.avatar}</td>
                    <td>${player.name}</td>
                    <td>${player.level}</td>
                    <td>${player.enemiesKilled}</td>
                    <td>${player.time}s</td>
                    <td>${player.score}</td>
                    <td>${player.status === 'Victoria' ? '🏆' : '💀'}</td>
                </tr>
            `).join('')}
        </table>
        <button onclick="backToMenu()" class="menu-button">Volver al Menú</button>
    `;
} catch (error) {
    console.error("Error al cargar el ranking:", error);
    rankingContainer.innerHTML = `
        <h2>❌ Error al cargar el ranking</h2>
        <button onclick="backToMenu()" class="menu-button">Volver al Menú</button>
    `;
}
}

function backToMenu() {
document.getElementById("ranking-container").style.display = "none";
document.getElementById("main-menu").style.display = "block";
centerMainMenu(); // Añadido aquí
}

function centerMainMenu() {
const mainMenu = document.getElementById('main-menu');
mainMenu.style.display = 'flex';
mainMenu.style.flexDirection = 'column';
mainMenu.style.justifyContent = 'center';
mainMenu.style.alignItems = 'center';
mainMenu.style.height = '100vh';
}

function drawBackground() {
  if (backgroundImages[level - 1] && backgroundImages[level - 1].complete) {
      const img = backgroundImages[level - 1];
      const canvas = document.getElementById("game-canvas");
      const ctx = canvas.getContext("2d");

      // Mantener aspecto original
      const aspectRatio = img.width / img.height;
      let renderWidth = canvas.width;
      let renderHeight = canvas.width / aspectRatio;

      // Si la altura renderizada es menor que el canvas, ajustar por altura
      if (renderHeight < canvas.height) {
          renderHeight = canvas.height;
          renderWidth = canvas.height * aspectRatio;
      }

      // Centrar la imagen
      const x = (canvas.width - renderWidth) / 2;
      const y = (canvas.height - renderHeight) / 2;

      ctx.drawImage(img, x, y, renderWidth, renderHeight);
  }
}

class Enemy {
  constructor(x, y, width, height, speed, spriteSheet) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.speed = speed;
      this.spriteSheet = spriteSheet;
      this.frameIndex = 0;
      this.tickCount = 0;
      this.ticksPerFrame = 5;
      this.numberOfFrames = 4; // Ajustar según tu spritesheet
  }

  update() {
      this.tickCount++;
      
      if (this.tickCount > this.ticksPerFrame) {
          this.tickCount = 0;
          this.frameIndex = (this.frameIndex + 1) % this.numberOfFrames;
      }
      
      this.y += this.speed;
  }

  draw(ctx) {
      const frameWidth = this.spriteSheet.width / this.numberOfFrames;
      ctx.drawImage(
          this.spriteSheet,
          this.frameIndex * frameWidth,
          0,
          frameWidth,
          this.spriteSheet.height,
          this.x,
          this.y,
          this.width,
          this.height
      );
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