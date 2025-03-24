/**
 * Hell Shooter - Gothic Themed Game
 * Main JavaScript File
 * Enhanced with new game mechanics and full responsive support
 */

// ======================================================
// GLOBAL VARIABLES
// ======================================================

// Canvas and Context
let canvas, ctx;

// Game Objects
let player, bullets, enemies, specialBullets;

// Game Control
let gameInterval;
let playerName = "";
let playerAvatar = "";
let mouseX = 0;
let mouseY = 0;
let lastShootTime = 0;
let autoShootInterval = null;
let specialPowerReady = false;
let specialPowerActive = false;
let specialPowerTimer = 0;
let enemiesForSpecialPower = 0;
const ENEMIES_FOR_SPECIAL = 25;

// Game States
let level = 1;
let enemiesKilled = 0;
let score = 0;
let gameTime = 0;
let isLevelTransition = false;

// Level Management
let levelUpEnemies = [50, 150, 450, 1350, 4050, 12150, 36450, 109350, 328050];
let enemiesRemaining = 0;
let spawnTimer = 0;

// Game Assets
let backgroundImages = [];
let enemyImages = [];
let playerImage, bulletImage;

// Dimensions (Responsive)
let PLAYER_WIDTH = 80;
let PLAYER_HEIGHT = 80;
let BULLET_WIDTH = 20;
let BULLET_HEIGHT = 40;
let ENEMY_MIN_SIZE = 30;
let ENEMY_MAX_SIZE = 60;

// Device Detection
let isMobile = false;
let isTouch = false;

// Constants
const SPAWN_RATE = 60;
const SHEET_URL = "https://sheetdb.io/api/v1/0agliopzbpm6x";
const SECRET_KEY = "hell_game_2024";
const SPECIAL_POWER_DURATION = 3000; // 3 seconds
const SPECIAL_BULLET_COUNT = 16; // Number of bullets in special attack
const AUTO_SHOOT_DELAY = 200; // Auto shoot every 200ms

// Sound Assets
const sounds = {
  shoot: new Audio("sounds/shoot.mp3"),
  hit: new Audio("sounds/hit.mp3"),
  gameOver: new Audio("sounds/gameover.mp3"),
  victory: new Audio("sounds/victory.mp3"),
  levelUp: new Audio("sounds/levelup.mp3"),
  background: new Audio("sounds/background.mp3"),
  special: new Audio("sounds/special.mp3"),
};

// ======================================================
// INITIALIZATION
// ======================================================

/**
 * Window onload event - Initialize the game
 */
window.onload = function () {
  // Detect mobile and touch devices
  isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Setup responsive canvas
  setupResponsiveCanvas();

  // Add event listeners
  window.addEventListener("resize", setupResponsiveCanvas);

  // Setup emoji picker button
  document
    .getElementById("emoji-button")
    .addEventListener("click", openEmojiPicker);

  // Load game assets
  loadGameAssets();

  // Center the main menu
  centerMainMenu();
};

/**
 * Opens the emoji picker modal
 */
function openEmojiPicker() {
  document.getElementById("emoji-picker").style.display = "flex";
}

/**
 * Closes the emoji picker modal
 */
function closeEmojiPicker() {
  document.getElementById("emoji-picker").style.display = "none";
}

/**
 * Selects an emoji and sets it as the avatar
 * @param {string} emoji - The selected emoji
 */
function selectEmoji(emoji) {
  document.getElementById("avatar").value = emoji;
  closeEmojiPicker();
}

/**
 * Centers the main menu on the screen
 */
function centerMainMenu() {
  const mainMenu = document.getElementById("main-menu");
  mainMenu.style.display = "flex";
  mainMenu.style.flexDirection = "column";
  mainMenu.style.justifyContent = "center";
  mainMenu.style.alignItems = "center";
  mainMenu.style.height = "100vh";
}

// ======================================================
// SOUND MANAGEMENT
// ======================================================

/**
 * Plays a sound effect
 * @param {string} soundName - The name of the sound to play
 */
function playSound(soundName) {
  if (sounds[soundName]) {
    const sound = sounds[soundName].cloneNode();
    sound.volume = soundName === "background" ? 0.3 : 0.5;
    sound.play().catch((error) => {
      console.warn(`Error playing sound ${soundName}:`, error);
    });
  }
}

/**
 * Starts playing the background music
 */
function startBackgroundMusic() {
  sounds.background.loop = true;
  sounds.background.volume = 0.3;
  sounds.background.play().catch((error) => {
    console.warn(
      "Unable to play background music automatically. User interaction required.",
      error
    );
  });
}

/**
 * Stops the background music
 */
function stopBackgroundMusic() {
  sounds.background.pause();
  sounds.background.currentTime = 0;
}

// ======================================================
// CANVAS AND RESPONSIVENESS
// ======================================================

/**
 * Sets up the canvas with responsive dimensions
 */
function setupResponsiveCanvas() {
  canvas = document.getElementById("game-canvas");
  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Adjust sizes proportionally to screen size
  PLAYER_WIDTH = Math.min(canvas.width * 0.08, 60);
  PLAYER_HEIGHT = PLAYER_WIDTH;
  BULLET_WIDTH = PLAYER_WIDTH * 0.25;
  BULLET_HEIGHT = BULLET_WIDTH * 2;

  // Enemy sizes based on screen size
  ENEMY_MIN_SIZE = Math.min(canvas.width * 0.05, 30);
  ENEMY_MAX_SIZE = Math.min(canvas.width * 0.1, 60);

  // Create or update player object
  if (player) {
    player.width = PLAYER_WIDTH;
    player.height = PLAYER_HEIGHT;
  }
}

/**
 * Sets up mouse and touch controls
 */
function setupControls() {
  // Mouse controls for desktop
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (player) {
      player.x = mouseX - player.width / 2;
      player.y = mouseY - player.height / 2;

      // Keep player within canvas bounds
      player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
      player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    }
  });

  // Touch controls for mobile
  if (isTouch) {
    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault(); // Prevent scrolling
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      mouseX = touch.clientX - rect.left;
      mouseY = touch.clientY - rect.top;

      if (player) {
        player.x = mouseX - player.width / 2;
        player.y = mouseY - player.height / 2;

        // Keep player within canvas bounds
        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
        player.y = Math.max(
          0,
          Math.min(canvas.height - player.height, player.y)
        );
      }
    });

    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault(); // Prevent unwanted behaviors
    });
  }

  // Spacebar for special power
  window.addEventListener("keydown", (e) => {
    if (e.key === " " && specialPowerReady && !specialPowerActive) {
      activateSpecialPower();
      e.preventDefault(); // Prevent page scrolling with spacebar
    }
  });

  // Special power button for mobile (the indicator itself is clickable)
  document
    .getElementById("special-power-indicator")
    .addEventListener("click", () => {
      if (specialPowerReady && !specialPowerActive) {
        activateSpecialPower();
      }
    });
}

// ======================================================
// ASSET LOADING
// ======================================================

/**
 * Loads all game assets from assets.json
 */
function loadGameAssets() {
  fetch("assets.json")
    .then((response) => response.json())
    .then((data) => {
      // Load background images
      data.backgrounds.forEach((src, index) => {
        backgroundImages[index] = new Image();
        backgroundImages[index].src = src;
      });

      // Load enemy images
      enemyImages = data.enemies.map((src) => {
        const img = new Image();
        img.src = src;
        return img;
      });

      // Load player image
      playerImage = new Image();
      playerImage.src = data.player;

      // Load bullet image
      bulletImage = new Image();
      bulletImage.src = data.bullet;
    })
    .catch((error) => console.error("Error loading assets:", error));
}

/**
 * Creates an image element
 * @param {string} src - The image source URL
 * @returns {HTMLImageElement} - The created image element
 */
function createImage(src) {
  const img = new Image();
  img.src = src;
  img.onerror = () => console.error(`Error loading image: ${src}`);
  return img;
}

// ======================================================
// GAME MANAGEMENT
// ======================================================

/**
 * Updates the player information displayed
 */
function updatePlayerInfo() {
  document.getElementById("player-name").textContent = `Jugador: ${playerName}`;
  document.getElementById("player-avatar").textContent = `${playerAvatar}`;
}

/**
 * Updates the special power indicator
 */
function updateSpecialPowerIndicator() {
  const indicator = document.getElementById("special-power-indicator");
  const counter = document.getElementById("special-power-counter");

  if (specialPowerReady) {
    indicator.classList.add("special-power-ready");
    counter.textContent = "🔥";
  } else {
    indicator.classList.remove("special-power-ready");
    counter.textContent = `${enemiesForSpecialPower}/${ENEMIES_FOR_SPECIAL}`;
  }
}

/**
 * Starts the game
 */
function startGame() {
  playerName = document.getElementById("name").value;
  playerAvatar = document.getElementById("avatar").value;

  // Validate player name and avatar
  if (!playerName || !playerAvatar || playerName.length < 3) {
    alert(
      "Por favor, ingresa un nombre (mínimo 3 caracteres) y un avatar (1 caracter)"
    );
    return;
  }

  // Reset game state
  level = 1;
  enemiesKilled = 0;
  score = 0;
  gameTime = 0;
  enemiesForSpecialPower = 0;
  specialPowerReady = false;
  specialPowerActive = false;

  // Update UI display
  document.getElementById("level").textContent = `Nivel ${level}`;
  document.getElementById(
    "enemies-killed"
  ).textContent = `Enemigos: ${enemiesKilled}`;
  document.getElementById("time").textContent = `Tiempo: 0s`;
  document.getElementById("score").textContent = `Puntuación: 0`;
  updateSpecialPowerIndicator();

  // Show game area, hide menu
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("game-area").style.display = "block";

  updatePlayerInfo();

  // Initialize canvas
  canvas = document.getElementById("game-canvas");
  if (!canvas) {
    console.error("Canvas not found");
    return;
  }
  ctx = canvas.getContext("2d");

  // Setup game elements
  setupResponsiveCanvas();

  // Get initial mouse/touch position at the center of the screen
  mouseX = canvas.width / 2;
  mouseY = canvas.height / 2;

  // Initialize player at the center of the screen
  player = {
    x: mouseX - PLAYER_WIDTH / 2,
    y: mouseY - PLAYER_HEIGHT / 2,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    image: playerImage,
  };

  // Setup controls
  setupControls();

  bullets = [];
  specialBullets = [];
  enemies = [];

  // Start background music
  startBackgroundMusic();

  // Start automatic shooting
  startAutoShoot();

  // Start the first level
  startLevel();

  // Start game loop
  gameInterval = setInterval(gameLoop, 1000 / 60);
}

/**
 * Starts automatic shooting
 */
function startAutoShoot() {
  // Clear existing interval if any
  if (autoShootInterval) {
    clearInterval(autoShootInterval);
  }

  // Set up new interval
  autoShootInterval = setInterval(() => {
    shootBullet();
  }, AUTO_SHOOT_DELAY);
}

/**
 * Stops automatic shooting
 */
function stopAutoShoot() {
  if (autoShootInterval) {
    clearInterval(autoShootInterval);
    autoShootInterval = null;
  }
}

/**
 * Starts a new level
 */
function startLevel() {
  // Keep existing enemies, don't clear them
  enemiesRemaining = levelUpEnemies[level - 1] - enemiesKilled;
  spawnTimer = 0;

  // Update UI
  document.getElementById("level").textContent = `Nivel ${level}`;

  // Update shooting speed based on new level
  updateShootingSpeed();

  showLevelTransition();
}

/**
 * Shows the level transition screen
 */
function showLevelTransition() {
  isLevelTransition = true;
  const transition = document.createElement("div");
  transition.className = "level-transition";
  transition.style.position = "fixed";
  transition.style.top = "50%";
  transition.style.left = "50%";
  transition.style.transform = "translate(-50%, -50%)";
  transition.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  transition.style.padding = "20px";
  transition.style.borderRadius = "10px";
  transition.style.zIndex = "1000";
  transition.style.fontSize = "2em";
  transition.style.color = "#FF0000";
  transition.style.border = "3px solid #440000";
  transition.style.boxShadow = "0 0 20px #FF0000";
  transition.innerHTML = `NIVEL ${level}`;
  document.body.appendChild(transition);

  playSound("levelUp");

  setTimeout(() => {
    document.body.removeChild(transition);
    isLevelTransition = false;
  }, 2000);
}

// ======================================================
// ENEMY MANAGEMENT
// ======================================================

/**
 * Spawns a new enemy with random properties
 */
function spawnEnemy() {
  // Randomize enemy size based on level - smaller at higher levels
  const sizeVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  const baseSize =
    ENEMY_MIN_SIZE + Math.random() * (ENEMY_MAX_SIZE - ENEMY_MIN_SIZE);
  const enemySize = baseSize * sizeVariation * Math.max(0.6, 1 - level * 0.05); // Reduce size with level

  // Random position (top of screen)
  const x = Math.random() * (canvas.width - enemySize);

  // Velocidad base aumentada significativamente - más rápido con cada nivel
  const levelSpeedFactor = 1 + level * 0.2; // 20% más rápido por nivel
  const baseSpeed = canvas.height * 0.006 * levelSpeedFactor; // Velocidad base incrementada

  // Angle is mostly downward (between -PI/4 and PI/4 from vertical)
  const angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;

  // Velocity components - mainly vertical with some horizontal variation
  const speed = baseSpeed * (0.8 + Math.random() * 0.6); // 0.8x to 1.4x base speed
  const velocityX = Math.sin(angle) * speed;
  const velocityY = Math.abs(Math.cos(angle) * speed); // Always positive (downward)

  // Create the enemy object
  enemies.push({
    x: x,
    y: -enemySize,
    width: enemySize,
    height: enemySize,
    velocityX: velocityX,
    velocityY: velocityY,
    image: enemyImages[level - 1] || enemyImages[0], // Fallback to first image if level image not available
    speedFactor: 1.0, // Factor usado para aumentar velocidad en colisiones
  });

  // Si estamos en nivel alto, aumentar la cantidad de enemigos
  if (level > 3 && Math.random() < level * 0.05) {
    // Spawn additional enemies based on level
    const extraEnemies = Math.min(Math.floor(level / 2), 5); // Max 5 extra enemies at once
    for (let i = 0; i < extraEnemies; i++) {
      setTimeout(() => {
        if (gameInterval) {
          // Verificar que el juego aún está en marcha
          spawnEnemy();
        }
      }, Math.random() * 500); // Retraso aleatorio hasta 500ms
    }
  }
}

/**
 * Updates enemy positions and handles collision with walls and other enemies
 */
function updateEnemies() {
  const wallBounceFactorX = 0.9; // Rebote con paredes laterales
  const wallBounceFactorY = 1.05; // Rebote con techo/suelo - aumenta velocidad
  const enemyBounceFactorBase = 1.1; // Base para rebote entre enemigos - aumenta velocidad

  // Update each enemy's position
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];

    // Move enemy
    enemy.x += enemy.velocityX;
    enemy.y += enemy.velocityY;

    // Bounce off side walls - change direction but maintain mainly downward movement
    if (enemy.x <= 0) {
      enemy.velocityX = Math.abs(enemy.velocityX) * wallBounceFactorX;
      enemy.x = 0;
      // Randomly adjust Y velocity slightly to prevent identical bouncing patterns
      enemy.velocityY *= 0.95 + Math.random() * 0.1;
    } else if (enemy.x + enemy.width >= canvas.width) {
      enemy.velocityX = -Math.abs(enemy.velocityX) * wallBounceFactorX;
      enemy.x = canvas.width - enemy.width;
      // Randomly adjust Y velocity slightly
      enemy.velocityY *= 0.95 + Math.random() * 0.1;
    }

    // Bounce off top
    if (enemy.y <= 0) {
      // If hitting top, always bounce downward
      enemy.velocityY = Math.abs(enemy.velocityY) * wallBounceFactorY;
      enemy.y = 0;
    }

    // Bounce off bottom - SIEMPRE hacia arriba
    if (enemy.y + enemy.height >= canvas.height) {
      // If hitting bottom, always bounce upward with slight horizontal adjustment
      enemy.velocityY = -Math.abs(enemy.velocityY) * wallBounceFactorY;
      enemy.y = canvas.height - enemy.height;
      // Add some horizontal variation on bounce
      enemy.velocityX += (Math.random() - 0.5) * (canvas.width * 0.003);
    }

    // Random direction change - but mostly downward (very low probability)
    if (Math.random() < 0.001) {
      // Sólo 0.1% de probabilidad por frame
      // Downward bias - angle between -PI/3 and PI/3 from vertical
      const angle = Math.random() * ((2 * Math.PI) / 3) - Math.PI / 3;
      const speed = Math.sqrt(
        enemy.velocityX * enemy.velocityX + enemy.velocityY * enemy.velocityY
      );
      enemy.velocityX = Math.sin(angle) * speed;
      enemy.velocityY = Math.abs(Math.cos(angle) * speed); // Asegurar que es hacia abajo
    }

    // Check collision with other enemies
    for (let j = i + 1; j < enemies.length; j++) {
      const otherEnemy = enemies[j];

      // Check if enemies are colliding
      if (checkCollisionBetweenObjects(enemy, otherEnemy)) {
        // Calculate collision response with increased velocities
        const dx =
          otherEnemy.x + otherEnemy.width / 2 - (enemy.x + enemy.width / 2);
        const dy =
          otherEnemy.y + otherEnemy.height / 2 - (enemy.y + enemy.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          // Normalize direction
          const nx = dx / dist;
          const ny = dy / dist;

          // Calculate bounce factors based on enemy speed factor
          const enemyBounceFactor = enemyBounceFactorBase * enemy.speedFactor;
          const otherEnemyBounceFactor =
            enemyBounceFactorBase * otherEnemy.speedFactor;

          // Exchange velocity components along the collision normal - with speed increase
          const p1 = enemy.velocityX * nx + enemy.velocityY * ny;
          const p2 = otherEnemy.velocityX * nx + otherEnemy.velocityY * ny;

          enemy.velocityX =
            (enemy.velocityX + nx * (p2 - p1)) * enemyBounceFactor;
          enemy.velocityY =
            (enemy.velocityY + ny * (p2 - p1)) * enemyBounceFactor;

          otherEnemy.velocityX =
            (otherEnemy.velocityX + nx * (p1 - p2)) * otherEnemyBounceFactor;
          otherEnemy.velocityY =
            (otherEnemy.velocityY + ny * (p1 - p2)) * otherEnemyBounceFactor;

          // Increase speed factor for both enemies (more aggression)
          enemy.speedFactor = Math.min(enemy.speedFactor * 1.05, 1.5);
          otherEnemy.speedFactor = Math.min(otherEnemy.speedFactor * 1.05, 1.5);

          // Separate the enemies to prevent sticking
          const overlap = (enemy.width + otherEnemy.width) / 2 - dist + 2; // +2 para separar un poco más
          if (overlap > 0) {
            enemy.x -= (nx * overlap) / 2;
            enemy.y -= (ny * overlap) / 2;
            otherEnemy.x += (nx * overlap) / 2;
            otherEnemy.y += (ny * overlap) / 2;
          }
        }
      }
    }

    // Speed cap to prevent enemies from going too fast
    const maxSpeed = canvas.height * 0.02 * (1 + level * 0.1);
    const currentSpeed = Math.sqrt(
      enemy.velocityX * enemy.velocityX + enemy.velocityY * enemy.velocityY
    );
    if (currentSpeed > maxSpeed) {
      const ratio = maxSpeed / currentSpeed;
      enemy.velocityX *= ratio;
      enemy.velocityY *= ratio;
    }

    // Draw the enemy
    if (enemy.image && enemy.image.complete) {
      ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
    } else {
      // Draw placeholder if image not loaded
      ctx.fillStyle = "#8B0000";
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
  }
}

/**
 * Check collision between two objects with x, y, width, height
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object
 * @returns {boolean} - True if collision detected
 */
function checkCollisionBetweenObjects(obj1, obj2) {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

// ======================================================
// BULLET MANAGEMENT
// ======================================================

/**
 * Updates the auto-shooting speed based on current level
 */
function updateShootingSpeed() {
  // Clear existing interval
  if (autoShootInterval) {
    clearInterval(autoShootInterval);
  }

  // Calculate new shooting delay based on level
  // Level 1: 200ms, Level 10: 80ms
  const newDelay = Math.max(80, AUTO_SHOOT_DELAY - level * 12);

  // Set up new interval with updated delay
  autoShootInterval = setInterval(() => {
    shootBullet();
  }, newDelay);
}

/**
 * Creates a regular bullet (fired upward)
 */
function shootBullet() {
  const currentTime = Date.now();
  const cooldownTime = Math.max(80, 200 - level * 12); // Same as auto-shoot delay

  if (currentTime - lastShootTime > cooldownTime) {
    // Base bullet properties
    const bulletSpeed = canvas.height * (0.015 + level * 0.002); // Increase speed with level

    // Add multiple bullets based on level
    if (level >= 3) {
      // Add side bullets at higher levels
      const spreadAngle = Math.PI / 12; // 15 degrees spread
      const bulletCount = Math.min(1 + Math.floor(level / 3), 5); // Max 5 bullets

      for (let i = 0; i < bulletCount; i++) {
        const offset = i - Math.floor(bulletCount / 2);
        const angle = offset * spreadAngle;

        bullets.push({
          x: player.x + player.width / 2 - BULLET_WIDTH / 2,
          y: player.y - BULLET_HEIGHT,
          width: BULLET_WIDTH,
          height: BULLET_HEIGHT,
          velocityX: Math.sin(angle) * bulletSpeed,
          velocityY: -Math.cos(angle) * bulletSpeed, // Upward with angle
        });
      }
    } else {
      // Just one bullet at lower levels
      bullets.push({
        x: player.x + player.width / 2 - BULLET_WIDTH / 2,
        y: player.y - BULLET_HEIGHT,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        velocityX: 0,
        velocityY: -bulletSpeed, // Upward velocity
      });
    }

    lastShootTime = currentTime;
    playSound("shoot");
  }
}

/**
 * Activates the special power (radial bullets)
 */
function activateSpecialPower() {
  if (!specialPowerReady || specialPowerActive) return;

  specialPowerActive = true;
  specialPowerReady = false;
  enemiesForSpecialPower = 0;

  // Update indicator
  updateSpecialPowerIndicator();

  // Create bullets in a circle
  const bulletCount = SPECIAL_BULLET_COUNT;
  const bulletSpeed = canvas.height * 0.01;

  for (let i = 0; i < bulletCount; i++) {
    // Calculate direction vector for each bullet
    const angle = (i / bulletCount) * Math.PI * 2;
    const velocityX = Math.cos(angle) * bulletSpeed;
    const velocityY = Math.sin(angle) * bulletSpeed;

    // Create the special bullet
    specialBullets.push({
      x: player.x + player.width / 2 - BULLET_WIDTH / 2,
      y: player.y + player.height / 2 - BULLET_HEIGHT / 2,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
      velocityX: velocityX,
      velocityY: velocityY,
      life: (SPECIAL_POWER_DURATION / 1000) * 60, // Convert to frames (assuming 60fps)
    });
  }

  // Play special power sound
  playSound("special");

  // Reset special power state after duration
  setTimeout(() => {
    specialPowerActive = false;
  }, SPECIAL_POWER_DURATION);
}

/**
 * Updates and draws all bullets
 */
function updateBullets() {
  // Update regular bullets
  for (let i = 0; i < bullets.length; i++) {
    const bullet = bullets[i];

    // Move bullet
    bullet.x += bullet.velocityX;
    bullet.y += bullet.velocityY;

    // Draw bullet
    if (bulletImage && bulletImage.complete) {
      ctx.drawImage(
        bulletImage,
        bullet.x,
        bullet.y,
        bullet.width,
        bullet.height
      );
    } else {
      // Draw placeholder
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
  }

  // Update special bullets
  for (let i = 0; i < specialBullets.length; i++) {
    const bullet = specialBullets[i];

    // Decrease life
    bullet.life--;

    // Move bullet
    bullet.x += bullet.velocityX;
    bullet.y += bullet.velocityY;

    // Draw bullet with glow effect
    ctx.save();
    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FF0000";

    if (bulletImage && bulletImage.complete) {
      ctx.drawImage(
        bulletImage,
        bullet.x,
        bullet.y,
        bullet.width,
        bullet.height
      );
    } else {
      // Draw placeholder
      ctx.fillStyle = "#FF3333";
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    ctx.restore();
  }

  // Remove bullets that are off-screen or expired
  bullets = bullets.filter(
    (bullet) =>
      bullet.x + bullet.width > 0 &&
      bullet.x < canvas.width &&
      bullet.y + bullet.height > 0 &&
      bullet.y < canvas.height
  );

  specialBullets = specialBullets.filter(
    (bullet) =>
      bullet.life > 0 &&
      bullet.x + bullet.width > 0 &&
      bullet.x < canvas.width &&
      bullet.y + bullet.height > 0 &&
      bullet.y < canvas.height
  );
}

// ======================================================
// COLLISION DETECTION
// ======================================================

/**
 * Check for collisions between bullets and enemies
 */
function checkBulletEnemyCollisions() {
  // Check regular bullets vs enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    let enemyHit = false;

    // Check against regular bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      const bullet = bullets[j];

      if (checkCollisionBetweenObjects(bullet, enemy)) {
        // Remove bullet
        bullets.splice(j, 1);

        // Mark enemy as hit
        enemyHit = true;
        break;
      }
    }

    // Check against special bullets if enemy wasn't already hit
    if (!enemyHit) {
      for (let j = specialBullets.length - 1; j >= 0; j--) {
        const bullet = specialBullets[j];

        if (checkCollisionBetweenObjects(bullet, enemy)) {
          // Mark enemy as hit
          enemyHit = true;
          break;
        }
      }
    }

    // Process enemy hit
    if (enemyHit) {
      // Remove enemy
      enemies.splice(i, 1);

      // Update game stats
      enemiesKilled++;
      enemiesForSpecialPower++;
      score += 10 * level; // Score increases with level

      // Check if special power is ready
      if (enemiesForSpecialPower >= ENEMIES_FOR_SPECIAL) {
        specialPowerReady = true;
        enemiesForSpecialPower = ENEMIES_FOR_SPECIAL;
      }

      // Update UI
      document.getElementById(
        "enemies-killed"
      ).textContent = `Enemigos: ${enemiesKilled}`;
      document.getElementById("score").textContent = `Puntuación: ${score}`;
      updateSpecialPowerIndicator();

      // Play hit sound
      playSound("hit");

      // Check for level completion
      if (enemiesKilled >= levelUpEnemies[level - 1]) {
        level++;
        if (level > levelUpEnemies.length) {
          victory();
        } else {
          startLevel();
        }
      }
    }
  }
}

/**
 * Check for collisions between player and enemies
 */
function checkPlayerEnemyCollisions() {
  for (let i = 0; i < enemies.length; i++) {
    if (checkCollisionBetweenObjects(player, enemies[i])) {
      gameOver();
      return;
    }
  }
}

// ======================================================
// GAME LOOP
// ======================================================

/**
 * Main game loop function - Updated for more aggressive gameplay
 */
function gameLoop() {
  // Skip update during level transition
  if (isLevelTransition) return;

  // Update game time (60 updates per second = 1 second)
  gameTime++;
  if (gameTime % 60 === 0) {
    document.getElementById("time").textContent = `Tiempo: ${Math.floor(
      gameTime / 60
    )}s`;
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  if (backgroundImages[level - 1] && backgroundImages[level - 1].complete) {
    ctx.drawImage(
      backgroundImages[level - 1],
      0,
      0,
      canvas.width,
      canvas.height
    );
  } else {
    // Fallback background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Spawn enemies if needed - adjusted for more aggressive gameplay
  spawnTimer++;

  // Delay between enemy spawns decreases with level
  // Level 1: 60 frames, Level 5: 40 frames, Level 10: 20 frames
  const spawnDelay = Math.max(20, SPAWN_RATE - level * 4);

  // Multiple enemy spawning at higher levels
  if (spawnTimer >= spawnDelay) {
    // Spawn at least one enemy
    spawnEnemy();

    // Chance to spawn additional enemies based on level
    if (level > 2) {
      const extraEnemyChance = Math.min(0.05 * level, 0.4); // Max 40% chance
      if (Math.random() < extraEnemyChance) {
        spawnEnemy();
      }
    }

    // Reset spawn timer
    spawnTimer = 0;
  }

  // Update and draw game elements
  updateEnemies();
  updateBullets();
  drawPlayer();

  // Check collisions
  checkBulletEnemyCollisions();
  checkPlayerEnemyCollisions();
}

/**
 * Draws the player on the canvas
 */
function drawPlayer() {
  if (
    !player.image ||
    !player.image.complete ||
    player.image.naturalWidth === 0
  ) {
    // Draw placeholder if image not loaded
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    return;
  }

  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

  // Draw a cursor/target indicator
  ctx.beginPath();
  ctx.arc(
    player.x + player.width / 2,
    player.y + player.height / 2,
    player.width * 0.6,
    0,
    Math.PI * 2
  );
  ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw crosshair
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  const size = player.width * 0.3;

  ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
  ctx.lineWidth = 1;

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(centerX - size, centerY);
  ctx.lineTo(centerX + size, centerY);
  ctx.stroke();

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - size);
  ctx.lineTo(centerX, centerY + size);
  ctx.stroke();
}

/**
 * Handles game over
 */
function gameOver() {
  clearInterval(gameInterval);
  stopAutoShoot();
  stopBackgroundMusic();
  document.getElementById("game-over").style.display = "block";
  document.getElementById("game-over-text").textContent = "Game Over 💀";
  playSound("gameOver");
}

/**
 * Restarts the game
 */
function restartGame() {
  document.getElementById("game-over").style.display = "none";
  startGame();
}

/**
 * Saves score and shows ranking
 */
async function saveAndViewRanking() {
  await saveScore();
  viewRanking();
  document.getElementById("game-over").style.display = "none";
}

/**
 * Saves the player's score to the database
 */
async function saveScore() {
  const playerData = {
    date: new Date().toISOString(),
    avatar: playerAvatar,
    name: playerName,
    level: level,
    enemiesKilled: enemiesKilled,
    time: Math.floor(gameTime / 60),
    score: score,
    status: document
      .getElementById("game-over-text")
      .textContent.includes("Victoria")
      ? "Victoria"
      : "Derrota",
  };

  try {
    const response = await fetch(SHEET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [playerData],
      }),
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

/**
 * Handles victory
 */
function victory() {
  clearInterval(gameInterval);
  stopAutoShoot();
  stopBackgroundMusic();
  document.getElementById("game-over").style.display = "block";
  document.getElementById("game-over-text").textContent = "¡Victoria! 🎉";
  playSound("victory");
}

/**
 * Views the ranking from the database
 */
async function viewRanking() {
  try {
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("game-area").style.display = "none";

    const rankingContainer = document.getElementById("ranking-container");
    rankingContainer.style.display = "block";
    rankingContainer.innerHTML = `<h2>⌛ Cargando ranking... ⌛</h2>`;

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
            ${sortedData
              .map(
                (player, index) => `
                <tr ${index < 3 ? 'class="top-player"' : ""}>
                    <td>${index + 1}${
                  index === 0
                    ? " 🥇"
                    : index === 1
                    ? " 🥈"
                    : index === 2
                    ? " 🥉"
                    : ""
                }</td>
                    <td>${player.avatar}</td>
                    <td>${player.name}</td>
                    <td>${player.level}</td>
                    <td>${player.enemiesKilled}</td>
                    <td>${player.time}s</td>
                    <td>${player.score}</td>
                    <td>${player.status === "Victoria" ? "🏆" : "💀"}</td>
                </tr>
            `
              )
              .join("")}
        </table>
        <button onclick="backToMenu()" class="gothic-button">Volver al Menú</button>
    `;
  } catch (error) {
    console.error("Error al cargar el ranking:", error);
    const rankingContainer = document.getElementById("ranking-container");
    rankingContainer.innerHTML = `
        <h2>❌ Error al cargar el ranking</h2>
        <p>No se pudo conectar con el servidor. Por favor, inténtalo de nuevo más tarde.</p>
        <button onclick="backToMenu()" class="gothic-button">Volver al Menú</button>
    `;
  }
}

/**
 * Returns to the main menu
 */
function backToMenu() {
  document.getElementById("ranking-container").style.display = "none";
  document.getElementById("main-menu").style.display = "block";
  centerMainMenu();
}

/**
 * Draws the background image
 */
function drawBackground() {
  if (backgroundImages[level - 1] && backgroundImages[level - 1].complete) {
    const img = backgroundImages[level - 1];
    const canvas = document.getElementById("game-canvas");

    // Calculate proportions
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight, x, y;

    if (canvasRatio > imgRatio) {
      // If canvas is wider than the image
      drawWidth = canvas.width;
      drawHeight = canvas.width / imgRatio;
      x = 0;
      y = (canvas.height - drawHeight) / 2;
    } else {
      // If canvas is taller than the image
      drawHeight = canvas.height;
      drawWidth = canvas.height * imgRatio;
      x = (canvas.width - drawWidth) / 2;
      y = 0;
    }

    // Ensure background covers the entire canvas
    if (drawWidth < canvas.width) drawWidth = canvas.width;
    if (drawHeight < canvas.height) drawHeight = canvas.height;

    // Center and crop the background
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  }
}
