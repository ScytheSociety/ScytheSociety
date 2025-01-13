let canvas, ctx, player, bullets, enemies, gameInterval;
let playerName = "";
let playerAvatar = "";
let level = 1;
let enemiesKilled = 0;
let score = 0;
let gameTime = 0;
let cooldown = 0;
let levelUpEnemies = [50, 150, 450, 1350, 4050, 12150, 36450, 109350, 328050];
let backgroundImages = [];
let enemyImages = [];
let playerImage, bulletImage;
let lastShootTime = 0;
let playerDirection = 0;
let enemiesRemaining = 0; // Enemigos que faltan por aparecer
let spawnTimer = 0; // Contador para el spawn de enemigos
let PLAYER_WIDTH = 80;
let PLAYER_HEIGHT = 80;
let BULLET_WIDTH = 20;
let BULLET_HEIGHT = 40;
let isMobile = false;
let touchStartX = 0;
let lastTapTime = 0;
const SPAWN_RATE = 60; // Frames entre cada spawn de enemigo (60 frames = 1 segundo aprox)
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwMAd7Ipbz9hGStUsWPPFo0zbXLsymjG0fQij7wz4teHsXv09sy7YrtJ6U-BIOyGZAsZw/exec';
const SECRET_KEY = 'hell_game_2024'; // Esta es tu clave secreta, puedes cambiarla si quieres

window.onload = function () {
  isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  setupResponsiveCanvas();
  window.addEventListener("resize", setupResponsiveCanvas);
  loadGameAssets();
};

function setupResponsiveCanvas() {
  canvas = document.getElementById("game-canvas");
  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  PLAYER_WIDTH = Math.min(canvas.width * 0.1, 80);
  PLAYER_HEIGHT = PLAYER_WIDTH;
  BULLET_WIDTH = PLAYER_WIDTH * 0.25;
  BULLET_HEIGHT = BULLET_WIDTH * 2;

  // Ajustar la velocidad base del jugador según el ancho de la pantalla
  const baseSpeed = canvas.width * 0.01; // Aumentado para mejor respuesta en móviles
  player = {
    ...player,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: isMobile ? baseSpeed * 1.5 : baseSpeed, // 50% más rápido en móviles
    x: canvas.width / 2 - PLAYER_WIDTH / 2,
    y: canvas.height - PLAYER_HEIGHT - 20, // Ajustado para mejor visibilidad
  };
}

function setupTouchControls() {
  if (!isMobile) return;

  let touchStartX = 0;
  let lastTapTime = 0;

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;

    // Detección de doble tap para disparar
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

    // Hacer el movimiento más sensible
    playerDirection = diffX > 0 ? 1 : diffX < 0 ? -1 : 0;
    player.x += playerDirection * player.speed * 1.2; // Aumentar la velocidad de movimiento
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

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
      // Cargar fondos
      data.backgrounds.forEach((src, index) => {
        backgroundImages[index] = new Image();
        backgroundImages[index].src = src;
      });

      // Cargar enemigos - Eliminar cualquier propiedad que pueda interferir con la animación
      enemyImages = data.enemies.map((src) => {
        const img = new Image();
        // Eliminar cualquier estilo que pueda interferir
        img.style = "";
        img.src = src;
        return img;
      });

      // Cargar imagen del jugador
      playerImage = new Image();
      playerImage.style = "";
      playerImage.src = data.player;

      // Cargar imagen de la bala
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

  // Resetear contadores
  level = 1;
  enemiesKilled = 0;
  score = 0;
  gameTime = 0;

  // Actualizar información en pantalla
  document.getElementById("level").textContent = `Nivel ${level}`;
  document.getElementById(
    "enemies-killed"
  ).textContent = `Enemigos: ${enemiesKilled}`;
  document.getElementById("time").textContent = `Tiempo: 0s`;
  document.getElementById("score").textContent = `Puntuación: 0`;

  document.getElementById("main-menu").style.display = "none";
  document.getElementById("game-area").style.display = "block";

  updatePlayerInfo();

  // Configurar canvas y contexto
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
  enemiesRemaining = levelUpEnemies[level - 1]; // Establecer cuántos enemigos faltan por aparecer
  spawnTimer = 0;

  document.getElementById("level").textContent = `Nivel ${level}`;
}

function spawnEnemy() {
  const enemyWidth = Math.min(canvas.width * 0.08, 50);
  const margin = enemyWidth;

  enemies.push({
    x: margin + Math.random() * (canvas.width - 2 * margin),
    y: -enemyWidth,
    width: enemyWidth,
    height: enemyWidth,
    speed: (0.5 + level * 0.2) * (canvas.height / 600),
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

  // Usar smoothing para mejor calidad de GIF
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
  ctx.imageSmoothingEnabled = true;
}

function moveEnemies() {
  ctx.imageSmoothingEnabled = false;
  for (let enemy of enemies) {
    enemy.y += enemy.speed;
    ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
  }
  ctx.imageSmoothingEnabled = true;
}

function updateBullets() {
  const bulletSpeed = canvas.height * 0.02; // Velocidad responsiva para las balas

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
    // Verificar derrota (si un enemigo toca al jugador)
    for (let enemy of enemies) {
        if (enemy.y + enemy.height >= player.y) {
            gameOver();
            return;
        }
    }

    // Verificar victoria (si se completaron todos los niveles)
    if (level > levelUpEnemies.length) { // Si superamos el último nivel
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
        gameKey: SECRET_KEY,
        name: playerName,
        avatar: playerAvatar,
        level: level,
        enemiesKilled: enemiesKilled,
        time: gameTime,
        score: score,
        status: document.getElementById("game-over-text").textContent.includes("Victoria") ? "Victoria" : "Derrota"
    };

    try {
        const response = await fetch(SHEET_URL, {
            method: 'POST',
            mode: 'cors', // Cambiado de 'no-cors' a 'cors'
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(playerData)
        });
        
        const result = await response.json();
        if (result.success) {
            alert("¡Puntuación guardada con éxito! 🎉");
        } else {
            throw new Error(result.error);
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
}

async function viewRanking() {
    try {
        document.getElementById("main-menu").style.display = "none";
        document.getElementById("game-area").style.display = "none";

        const rankingContainer = document.getElementById("ranking-container");
        rankingContainer.style.display = "block";

        const response = await fetch(SHEET_URL, {
            method: 'GET',
            mode: 'cors'  // Añadido modo cors
        });
        const data = await response.json();

        // Ordenar por puntuación y tiempo
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

// Agregar esta nueva función para volver al menú
function backToMenu() {
  document.getElementById("ranking-container").style.display = "none";
  document.getElementById("main-menu").style.display = "block";
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
