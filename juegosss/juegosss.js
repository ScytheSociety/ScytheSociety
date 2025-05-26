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
let player, bullets, enemies, specialBullets, hearts, powerUps;

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
let ENEMIES_FOR_SPECIAL = 25;

// Lives System
let playerLives = 5;
let invulnerableTime = 0;
let INVULNERABLE_DURATION = 120; // 2 segundos a 60fps
let heartSpawned = false;

// Power-up System
const POWERUP_TYPES = {
  PENETRATING: {
    id: 0,
    color: "#FFFF00",
    name: "Balas Penetrantes",
    duration: 600,
  },
  WIDE_SHOT: { id: 1, color: "#00FFFF", name: "Disparo Amplio", duration: 500 },
  EXPLOSIVE: {
    id: 2,
    color: "#FF8800",
    name: "Balas Explosivas",
    duration: 450,
  },
  RAPID_FIRE: {
    id: 3,
    color: "#FF00FF",
    name: "Disparo Rápido",
    duration: 550,
  },
};
let activePowerUp = null;
let powerUpTimeLeft = 0;
let powerUpsSpawned = false;

// Game States
let level = 1;
let enemiesKilled = 0;
let score = 0;
let gameTime = 0;
let isLevelTransition = false;

// Level Management
let levelUpEnemies = [30, 70, 110, 150, 190, 230, 270, 210, 250];
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
let SPECIAL_POWER_DURATION = 3000; // 3 seconds
let SPECIAL_BULLET_COUNT = 16; // Number of bullets in special attack
let AUTO_SHOOT_DELAY = 200; // Auto shoot every 200ms
let EXPLOSION_RADIUS = 80; // Radio para explosiones de balas explosivas

// Sound Assets
const sounds = {
  shoot: new Audio("sounds/shoot.mp3"),
  hit: new Audio("sounds/hit.mp3"),
  gameOver: new Audio("sounds/gameover.mp3"),
  victory: new Audio("sounds/victory.mp3"),
  levelUp: new Audio("sounds/levelup.mp3"),
  background: new Audio("sounds/background.mp3"),
  special: new Audio("sounds/special.mp3"),
  powerUp: new Audio("sounds/powerup.mp3"),
  heart: new Audio("sounds/heart.mp3"),
  explosion: new Audio("sounds/explosion.mp3"),
  damaged: new Audio("sounds/damaged.mp3"),
};

// ======================================================
// GAME CONFIG - Variables ajustables para balancear el juego
// ======================================================

const GAME_CONFIG = {
  // Dificultad General
  difficulty: 0.8, // Multiplicador general de dificultad (1.0 = normal)

  // Enemigos
  enemies: {
    baseSpeed: 0.001, // Reducido de 0.002 a 0.001 (velocidad base más lenta)
    levelSpeedIncrease: 0.1, // Reducido de 0.2 a 0.1 (menor incremento por nivel)
    sizeReduction: 0.03, // Reducido de 0.05 a 0.03 (los enemigos se reducen menos)
    maxSpeedFactor: 0.3, // Reducido de 0.5 a 0.3 (velocidad máxima menor tras rebotes)
    spawnRateBase: 90, // Aumentado de 60 a 90 (más tiempo entre apariciones)
    spawnRateReduction: 2, // Reducido de 4 a 2 (menor reducción por nivel)
    minSpawnRate: 40, // Aumentado de 20 a 40 (mínimo tiempo mayor)
    extraEnemiesThreshold: 3, // Aumentado de 2 a 3 (enemigos extra aparecen en nivel más alto)
    extraEnemyChancePerLevel: 0.03, // Reducido de 0.05 a 0.03 (menor probabilidad)
    maxExtraEnemyChance: 0.2, // Reducido de 0.4 a 0.2 (probabilidad máxima menor)
  },

  // Power-ups y corazones
  items: {
    heartSpawnChance: 0.0002, // Probabilidad por frame de aparición de corazón
    powerUpSpawnChance: 0.00015, // Probabilidad por frame de aparición de power-up
    maxPowerUpDuration: 600, // Duración máxima de power-ups (en frames)
    minPowerUpDuration: 450, // Duración mínima de power-ups (en frames)
    explosionRadius: 80, // Radio de explosión (píxeles)
  },

  // Jugador
  player: {
    lives: 5, // Vidas iniciales
    invulnerabilityTime: 120, // Tiempo de invulnerabilidad tras daño (frames)
    autoShootDelayBase: 200, // Delay base entre disparos automáticos (ms)
    autoShootDelayReduction: 12, // Reducción de delay por nivel (ms)
    autoShootDelayMin: 80, // Delay mínimo entre disparos (ms)
    bulletSpeedBase: 0.015, // Velocidad base de balas
    bulletSpeedIncrease: 0.002, // Aumento de velocidad de balas por nivel
    specialPowerCost: 25, // Enemigos necesarios para poder especial
    specialPowerDuration: 3000, // Duración del poder especial (ms)
    specialBulletCount: 16, // Número de balas del poder especial
  },

  // Niveles
  levels: {
    enemiesPerLevel: [30, 70, 110, 150, 190, 230, 270, 210, 250], // Enemigos para pasar de nivel
  },
};

/**
 * Actualiza las constantes globales basadas en la configuración
 */
function updateGameConstants() {
  // Actualizar constantes importantes del juego desde la configuración
  EXPLOSION_RADIUS = GAME_CONFIG.items.explosionRadius;
  INVULNERABLE_DURATION = GAME_CONFIG.player.invulnerabilityTime;
  SPECIAL_POWER_DURATION = GAME_CONFIG.player.specialPowerDuration;
  SPECIAL_BULLET_COUNT = GAME_CONFIG.player.specialBulletCount;
  AUTO_SHOOT_DELAY = GAME_CONFIG.player.autoShootDelayBase;
  ENEMIES_FOR_SPECIAL = GAME_CONFIG.player.specialPowerCost;

  // También actualizar array de enemigos por nivel
  levelUpEnemies = GAME_CONFIG.levels.enemiesPerLevel;
}

/**
 * Inicializa el juego con la configuración actual
 */
function initializeGame() {
  // Actualizar constantes
  updateGameConstants();

  // Establecer valores iniciales basados en configuración
  playerLives = GAME_CONFIG.player.lives;
  enemiesForSpecialPower = 0;
}

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

  // Precarga de sonidos para mejor rendimiento
  preloadSounds();

  // Load game assets
  loadGameAssets();

  // Center the main menu
  centerMainMenu();
};

/**
 * Preload all sound effects
 */
function preloadSounds() {
  // Recorre todos los sonidos y establece volumen predeterminado
  for (const key in sounds) {
    if (sounds.hasOwnProperty(key)) {
      const sound = sounds[key];
      sound.volume = 0.5; // Volumen moderado para todos los sonidos

      // Intentar precargar
      sound.load();
    }
  }

  // Ajustar volúmenes específicos
  sounds.background.volume = 0.3;
  sounds.explosion.volume = 0.6;
  sounds.special.volume = 0.7;
  sounds.powerUp.volume = 0.6;
}

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
    // Clonar el sonido para permitir múltiples instancias superpuestas
    const sound = sounds[soundName].cloneNode();

    // Intentar reproducir el sonido, manejando errores silenciosamente
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

/**
 * Muestra un mensaje con efecto visual en la pantalla
 * @param {string} message - El mensaje a mostrar
 * @param {string} color - Color del texto (opcional)
 */
function showScreenMessage(message, color = "#FFFFFF") {
  const messageElement = document.createElement("div");
  messageElement.textContent = message;
  messageElement.style.position = "fixed";
  messageElement.style.top = "30%";
  messageElement.style.left = "50%";
  messageElement.style.transform = "translate(-50%, -50%)";
  messageElement.style.color = color;
  messageElement.style.fontSize = "24px";
  messageElement.style.fontWeight = "bold";
  messageElement.style.textShadow = "0 0 10px #FF0000";
  messageElement.style.zIndex = "1000";
  document.body.appendChild(messageElement);

  // Animación de desvanecimiento
  setTimeout(() => {
    messageElement.style.transition = "opacity 1s";
    messageElement.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(messageElement);
    }, 1000);
  }, 1500);
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

      // Modificación para que el jugador aparezca por encima del dedo
      mouseX = touch.clientX - rect.left;
      mouseY = touch.clientY - rect.top - 80; // 80 píxeles hacia arriba

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

      // También permitir que el movimiento comience con el dedo
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];

      // Misma modificación que en touchmove
      mouseX = touch.clientX - rect.left;
      mouseY = touch.clientY - rect.top - 80; // 80 píxeles hacia arriba

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
  console.log("Loading game assets...");

  fetch("assets.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Assets data loaded successfully");

      // Load background images with error handling
      data.backgrounds.forEach((src, index) => {
        backgroundImages[index] = new Image();
        backgroundImages[index].src = src;
        backgroundImages[index].onerror = () => {
          console.error(`Error loading background image ${index}: ${src}`);
        };
        backgroundImages[index].onload = () => {
          console.log(`Background image ${index} loaded`);
        };
      });

      // Load enemy images with error handling
      enemyImages = data.enemies.map((src, index) => {
        const img = new Image();
        img.src = src;
        img.onerror = () => {
          console.error(`Error loading enemy image ${index}: ${src}`);
        };
        img.onload = () => {
          console.log(`Enemy image ${index} loaded`);
        };
        return img;
      });

      // Load player image with error handling
      playerImage = new Image();
      playerImage.src = data.player;
      playerImage.onerror = () => {
        console.error(`Error loading player image: ${data.player}`);
      };
      playerImage.onload = () => {
        console.log("Player image loaded successfully");
      };

      // Load bullet image with error handling
      bulletImage = new Image();
      bulletImage.src = data.bullet;
      bulletImage.onerror = () => {
        console.error(`Error loading bullet image: ${data.bullet}`);
      };
      bulletImage.onload = () => {
        console.log("Bullet image loaded successfully");
      };
    })
    .catch((error) => {
      console.error("Error loading assets:", error);

      // Create fallback images if loading fails
      createFallbackImages();
    });
}

/**
 * Creates fallback images if loading fails
 */
function createFallbackImages() {
  console.log("Creating fallback images");

  // Create simple fallback player image (red rectangle)
  const playerCanvas = document.createElement("canvas");
  playerCanvas.width = 80;
  playerCanvas.height = 80;
  const playerCtx = playerCanvas.getContext("2d");
  playerCtx.fillStyle = "#FF0000";
  playerCtx.fillRect(0, 0, 80, 80);
  playerCtx.strokeStyle = "#FFFFFF";
  playerCtx.lineWidth = 2;
  playerCtx.strokeRect(5, 5, 70, 70);
  playerImage = new Image();
  playerImage.src = playerCanvas.toDataURL();

  // Create simple fallback bullet image (white rectangle)
  const bulletCanvas = document.createElement("canvas");
  bulletCanvas.width = 20;
  bulletCanvas.height = 40;
  const bulletCtx = bulletCanvas.getContext("2d");
  bulletCtx.fillStyle = "#FFFFFF";
  bulletCtx.fillRect(0, 0, 20, 40);
  bulletImage = new Image();
  bulletImage.src = bulletCanvas.toDataURL();

  // Create simple fallback background image (dark background)
  if (backgroundImages.length === 0) {
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = 100;
    bgCanvas.height = 100;
    const bgCtx = bgCanvas.getContext("2d");
    bgCtx.fillStyle = "#111111";
    bgCtx.fillRect(0, 0, 100, 100);
    const bgImage = new Image();
    bgImage.src = bgCanvas.toDataURL();
    backgroundImages[0] = bgImage;
  }

  // Create a simple fallback enemy image
  if (enemyImages.length === 0) {
    const enemyCanvas = document.createElement("canvas");
    enemyCanvas.width = 50;
    enemyCanvas.height = 50;
    const enemyCtx = enemyCanvas.getContext("2d");
    enemyCtx.fillStyle = "#FF9900";
    enemyCtx.fillRect(0, 0, 50, 50);
    const enemyImage = new Image();
    enemyImage.src = enemyCanvas.toDataURL();
    enemyImages[0] = enemyImage;
  }
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
// VISUAL EFFECTS
// ======================================================

/**
 * Crea un efecto de partículas para explosiones o efectos visuales
 * @param {number} x - Posición X del centro de la explosión
 * @param {number} y - Posición Y del centro de la explosión
 * @param {string} color - Color de las partículas
 * @param {number} particleCount - Número de partículas
 */
function createParticleEffect(x, y, color, particleCount) {
  const particles = [];

  // Crear partículas
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;

    particles.push({
      x: x,
      y: y,
      size: 2 + Math.random() * 3,
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed,
      life: 30 + Math.random() * 20,
    });
  }

  // Función para animar partículas
  function animateParticles() {
    if (particles.length === 0) return;

    // Actualizar y dibujar partículas
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.x += p.speedX;
      p.y += p.speedY;
      p.life--;

      // Dibujar partícula
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = p.life / 50; // Desvanecer con el tiempo
      ctx.fill();
      ctx.globalAlpha = 1;

      // Eliminar partículas muertas
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Continuar animación
    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    }
  }

  // Iniciar animación
  requestAnimationFrame(animateParticles);
}

/**
 * Crea un efecto de explosión con ondas expansivas
 * @param {number} x - Posición X del centro de la explosión
 * @param {number} y - Posición Y del centro de la explosión
 */
function createExplosionEffect(x, y) {
  // Crear partículas
  createParticleEffect(x, y, "#FF8800", 30);

  // Crear onda expansiva
  const shockwaves = [];
  shockwaves.push({
    x: x,
    y: y,
    radius: 5,
    maxRadius: EXPLOSION_RADIUS,
    life: 20,
  });

  // Función para animar onda expansiva
  function animateShockwave() {
    if (shockwaves.length === 0) return;

    // Actualizar y dibujar ondas
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const wave = shockwaves[i];

      wave.radius += (wave.maxRadius - wave.radius) * 0.2;
      wave.life--;

      // Dibujar onda
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.strokeStyle = "#FF8800";
      ctx.globalAlpha = wave.life / 20;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Eliminar ondas muertas
      if (wave.life <= 0) {
        shockwaves.splice(i, 1);
      }
    }

    // Continuar animación
    if (shockwaves.length > 0) {
      requestAnimationFrame(animateShockwave);
    }
  }

  // Iniciar animación
  requestAnimationFrame(animateShockwave);

  // Reproducir sonido
  playSound("explosion");
}

/**
 * Crea un efecto visual de celebración
 */
function celebrationEffect() {
  // Crear múltiples explosiones de partículas por la pantalla
  const colors = [
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
  ];

  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      // Posición aleatoria
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      // Color aleatorio
      const color = colors[Math.floor(Math.random() * colors.length)];
      // Crear partículas
      createParticleEffect(x, y, color, 50);
    }, i * 300); // Espaciar en el tiempo
  }
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
 * Actualiza la visualización de vidas en la UI
 */
function updateLivesDisplay() {
  const livesDisplay = document.getElementById("player-lives");

  // Si no existe el elemento, lo creamos (primera vez)
  if (!livesDisplay) {
    const gameInfo = document.getElementById("game-info");
    const livesElement = document.createElement("span");
    livesElement.id = "player-lives";
    gameInfo.appendChild(livesElement);
  }

  // Actualizar el texto con emojis de calavera
  document.getElementById("player-lives").textContent = "💀".repeat(
    playerLives
  );
}

/**
 * Actualiza el estado de power-up activo y su indicador visual
 */
function updatePowerUpIndicator() {
  // Si hay un power-up activo pero no hay elemento aún, crearlo
  if (activePowerUp) {
    let indicator = document.getElementById("power-up-indicator");

    if (!indicator) {
      // Crear indicador de power-up
      indicator = document.createElement("div");
      indicator.id = "power-up-indicator";
      indicator.className = "power-up-indicator";
      document.getElementById("game-area").appendChild(indicator);

      // Aplicar estilos
      indicator.style.position = "fixed";
      indicator.style.bottom = "20px";
      indicator.style.left = "20px";
      indicator.style.backgroundColor = activePowerUp.color;
      indicator.style.color = "#FFFFFF";
      indicator.style.padding = "5px 10px";
      indicator.style.borderRadius = "20px";
      indicator.style.fontSize = "14px";
      indicator.style.fontWeight = "bold";
      indicator.style.boxShadow = `0 0 10px ${activePowerUp.color}`;
      indicator.style.transition = "all 0.3s";
      indicator.style.zIndex = "100";
    }

    // Actualizar contenido
    const timeLeft = Math.ceil(powerUpTimeLeft / 60); // Convertir frames a segundos
    indicator.textContent = `${activePowerUp.name}: ${timeLeft}s`;
    indicator.style.backgroundColor = activePowerUp.color;

    // Parpadeo cuando está por terminar
    if (powerUpTimeLeft < 60) {
      // Menos de 1 segundo
      indicator.style.opacity = Math.sin(gameTime * 0.2) * 0.5 + 0.5;
    } else {
      indicator.style.opacity = "1";
    }
  } else {
    // Si no hay power-up activo, eliminar indicador si existe
    const indicator = document.getElementById("power-up-indicator");
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }
}

/**
 * Dibuja un fondo estático para mostrar mientras se ven las instrucciones
 */
function drawStaticGameBackground() {
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

  // Dibujar jugador para que esté visible mientras se leen las instrucciones
  if (player && player.image && player.image.complete) {
    ctx.drawImage(
      player.image,
      player.x,
      player.y,
      player.width,
      player.height
    );
  }
}

/**
 * Modifica la función startGame para mostrar instrucciones primero y no iniciar el bucle del juego
 * hasta que el usuario confirme
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

  // Inicializar el juego con la configuración actual
  initializeGame();

  // Reset game state
  level = 1;
  enemiesKilled = 0;
  score = 0;
  gameTime = 0;
  enemiesForSpecialPower = 0;
  specialPowerReady = false;
  specialPowerActive = false;
  heartSpawned = false;
  powerUpsSpawned = false;
  activePowerUp = null;
  powerUpTimeLeft = 0;

  // Inicializar arrays
  hearts = [];
  powerUps = [];
  bullets = [];
  specialBullets = [];
  enemies = [];

  // Update UI display
  document.getElementById("level").textContent = `Nivel ${level}`;
  document.getElementById(
    "enemies-killed"
  ).textContent = `Enemigos: ${enemiesKilled}`;
  document.getElementById("time").textContent = `Tiempo: 0s`;
  document.getElementById("score").textContent = `Puntuación: 0`;
  updateSpecialPowerIndicator();
  updateLivesDisplay();

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
    visible: true, // Para efecto de parpadeo
    damaged: false, // Estado de daño
  };

  // Setup controls
  setupControls();

  // Start background music
  startBackgroundMusic();

  // Dibujar fondo estático para las instrucciones
  drawStaticGameBackground();

  // Mostrar instrucciones antes de iniciar el nivel 1
  showInstructions();
}

/**
 * Muestra las instrucciones del juego antes de iniciar el nivel 1
 */
function showInstructions() {
  // Crear elemento de instrucciones
  const instructionsModal = document.createElement("div");
  instructionsModal.id = "instructions-modal";
  instructionsModal.style.position = "fixed";
  instructionsModal.style.top = "50%";
  instructionsModal.style.left = "50%";
  instructionsModal.style.width = "80%";
  instructionsModal.style.maxWidth = "600px";
  instructionsModal.style.transform = "translate(-50%, -50%)";
  instructionsModal.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
  instructionsModal.style.border = "3px solid #8B0000";
  instructionsModal.style.borderRadius = "10px";
  instructionsModal.style.padding = "20px";
  instructionsModal.style.color = "#FFFFFF";
  instructionsModal.style.zIndex = "1000";
  instructionsModal.style.fontFamily = '"Times New Roman", Times, serif';
  instructionsModal.style.boxShadow = "0 0 20px #FF0000";
  instructionsModal.style.textAlign = "left";
  instructionsModal.style.maxHeight = "80vh";
  instructionsModal.style.overflowY = "auto";

  // Contenido HTML de las instrucciones
  instructionsModal.innerHTML = `
    <h2 style="text-align: center; color: #FF0000; text-shadow: 0 0 10px #FF0000; margin-bottom: 20px;">INSTRUCCIONES DE JUEGO</h2>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 5px;">CONTROLES:</h3>
      <p>• <strong>Movimiento:</strong> Mueve el ratón o desliza el dedo en dispositivos táctiles para controlar al jugador.</p>
      <p>• <strong>Disparo:</strong> Automático. Tu personaje dispara constantemente hacia arriba.</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 5px;">OBJETIVO:</h3>
      <p>Sobrevive a las hordas de enemigos y elimina el número requerido para avanzar de nivel. Los enemigos se vuelven más rápidos y numerosos en niveles superiores.</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 5px;">VIDAS:</h3>
      <p>• Tienes 5 vidas (💀💀💀💀💀) al comenzar.</p>
      <p>• Pierdes una vida al ser golpeado por un enemigo.</p>
      <p>• Después de ser golpeado, eres invulnerable por unos segundos.</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 5px;">PODER ESPECIAL:</h3>
      <p>• Por cada 25 enemigos eliminados, se carga tu poder especial (indicador inferior derecho).</p>
      <p>• Actívalo con ESPACIO (PC) o tocando el indicador (móvil).</p>
      <p>• Dispara balas en todas direcciones durante unos segundos.</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 5px;">ELEMENTOS DE AYUDA:</h3>
      <p>• <span style="color: #FF0000;">❤️</span> <strong>Corazones:</strong> Recuperan una vida perdida.</p>
      <p>• <span style="color: #FFFF00;">⬦</span> <strong>Balas Penetrantes:</strong> Atraviesan varios enemigos.</p>
      <p>• <span style="color: #00FFFF;">⬦</span> <strong>Disparo Amplio:</strong> Dispara en abanico.</p>
      <p>• <span style="color: #FF8800;">⬦</span> <strong>Balas Explosivas:</strong> Crean explosiones que dañan enemigos cercanos.</p>
      <p>• <span style="color: #FF00FF;">⬦</span> <strong>Disparo Rápido:</strong> Aumenta la velocidad de disparo.</p>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <button id="start-game-btn" style="background-color: #8B0000; color: white; padding: 10px 20px; font-size: 16px; border: none; border-radius: 5px; cursor: pointer; font-family: inherit; box-shadow: 0 0 10px #FF0000;">¡COMENZAR JUEGO!</button>
    </div>
  `;

  // Añadir al DOM
  document.body.appendChild(instructionsModal);

  // Asignar evento al botón - AHORA LLAMA A startRealGame
  document.getElementById("start-game-btn").addEventListener("click", () => {
    document.body.removeChild(instructionsModal);
    startRealGame(); // Usar la función nueva para iniciar el juego real
  });
}

/**
 * Función para iniciar el juego real después de las instrucciones
 */
function startRealGame() {
  // Make sure player image is fully loaded before starting game
  if (playerImage && !playerImage.complete) {
    playerImage.onload = function () {
      console.log("Player image loaded successfully");
      initializeGameLoop();
    };

    // Add error handling for image loading
    playerImage.onerror = function () {
      console.error("Error loading player image, using fallback");
      // Continue anyway after a brief delay
      setTimeout(initializeGameLoop, 500);
    };

    // If image takes too long, start anyway after 2 seconds
    setTimeout(function () {
      if (!playerImage.complete) {
        console.warn(
          "Player image taking too long to load, starting game anyway"
        );
        initializeGameLoop();
      }
    }, 2000);
  } else {
    // Image already loaded or doesn't exist, start immediately
    initializeGameLoop();
  }
}

/**
 * Helper function to actually start the game loop
 */
function initializeGameLoop() {
  // Ensure player is visible
  player.visible = true;

  // Now start auto-shooting
  startAutoShoot();

  // Start the game loop
  gameInterval = setInterval(gameLoop, 1000 / 60);

  // Start the level (without sound in level 1)
  startLevel();

  // Log successful game start
  console.log("Game loop initialized successfully");
}

/**
 * Starts automatic shooting
 */
function startAutoShoot() {
  // Clear existing interval if any
  if (autoShootInterval) {
    clearInterval(autoShootInterval);
  }

  // Calculate new shooting delay based on level
  const newDelay = Math.max(
    GAME_CONFIG.player.autoShootDelayMin,
    GAME_CONFIG.player.autoShootDelayBase -
      level * GAME_CONFIG.player.autoShootDelayReduction
  );

  // Set up new interval with updated delay
  autoShootInterval = setInterval(() => {
    shootBullet();
  }, newDelay);
}

/**
 * Updates the auto-shooting speed based on current level
 */
function updateShootingSpeed() {
  // Clear existing interval
  if (autoShootInterval) {
    clearInterval(autoShootInterval);
  }

  // Calculate new shooting delay based on level
  const newDelay = Math.max(
    GAME_CONFIG.player.autoShootDelayMin,
    GAME_CONFIG.player.autoShootDelayBase -
      level * GAME_CONFIG.player.autoShootDelayReduction
  );

  // Set up new interval with updated delay
  autoShootInterval = setInterval(() => {
    shootBullet();
  }, newDelay);
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
  heartSpawned = false; // Reset to allow a new heart
  powerUpsSpawned = false; // Reset to allow a new power-up

  // Update UI
  document.getElementById("level").textContent = `Nivel ${level}`;

  // Update shooting speed based on new level
  updateShootingSpeed();

  // Solo reproduce sonido de transición si no es el primer nivel o el juego está recién comenzando
  const playTransitionSound = level > 1;
  showLevelTransition(playTransitionSound);
}

/**
 * Shows the level transition screen
 * @param {boolean} playSound - Si debe reproducir sonido (por defecto true)
 */
function showLevelTransition(playTransitionSound = true) {
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

  // Solo reproduce sonido si se indica
  if (playTransitionSound) {
    // Cambiado de playSound a la función correcta
    playLevelUpSound();
  }

  setTimeout(() => {
    document.body.removeChild(transition);
    isLevelTransition = false;
  }, 2000);
}

/**
 * Reproduce el sonido de subir de nivel
 */
function playLevelUpSound() {
  if (sounds["levelUp"]) {
    const sound = sounds["levelUp"].cloneNode();
    sound.play().catch((error) => {
      console.warn("Error playing level up sound:", error);
    });
  }
}

// ======================================================
// LIVES SYSTEM
// ======================================================

/**
 * Maneja la colisión del jugador con un enemigo
 */
function playerHit() {
  // Si el jugador es invulnerable, no recibe daño
  if (invulnerableTime > 0) return;

  // Reducir vidas
  playerLives--;

  // Actualizar visualización
  updateLivesDisplay();

  // Reproducir sonido de daño
  playSound("damaged");

  // Hacer jugador invulnerable temporalmente
  invulnerableTime = INVULNERABLE_DURATION;

  // Comprobar game over
  if (playerLives <= 0) {
    gameOver();
  } else {
    // Efecto visual de daño
    flashPlayer();

    // Mensaje en pantalla
    showScreenMessage("¡Daño recibido!", "#FF0000");

    // Crear efecto de onda de impacto
    createParticleEffect(
      player.x + player.width / 2,
      player.y + player.height / 2,
      "#FF0000",
      20
    );
  }
}

/**
 * Crea un efecto visual de parpadeo cuando el jugador recibe daño
 */
function flashPlayer() {
  // Añade clase para efecto visual o cambia opacidad
  player.damaged = true;

  // Quitar el efecto después de la invulnerabilidad
  setTimeout(() => {
    player.damaged = false;
  }, (INVULNERABLE_DURATION * 1000) / 60); // Convertir frames a ms
}

/**
 * Actualiza el estado de invulnerabilidad del jugador
 */
function updateInvulnerability() {
  if (invulnerableTime > 0) {
    invulnerableTime--;

    // Efecto visual de parpadeo mientras es invulnerable
    if (player.damaged) {
      player.visible = Math.floor(invulnerableTime / 5) % 2 === 0;
    }
  } else {
    player.visible = true;
  }
}

/**
 * Draws the player on the canvas
 */
function drawPlayer() {
  // Always ensure player is at the mouse position
  player.x = mouseX - player.width / 2;
  player.y = mouseY - player.height / 2;

  // Keep player within canvas bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

  // Ensure player is visible during gameplay
  if (gameInterval && !isLevelTransition) {
    player.visible = invulnerableTime <= 0 || gameTime % 10 < 5;
  } else {
    player.visible = true;
  }

  // If the player is invulnerable and in an invisibility frame, don't draw
  if (invulnerableTime > 0 && !player.visible) {
    return;
  }

  // Draw player fallback if image not loaded
  if (
    !player.image ||
    !player.image.complete ||
    player.image.naturalWidth === 0
  ) {
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw a crosshair to make sure player is visible
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, player.width * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }

  // Visual effect during invulnerability
  if (invulnerableTime > 0) {
    ctx.globalAlpha = 0.7;
  }

  // Draw the player image
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
  ctx.globalAlpha = 1.0; // Restore alpha

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

  // Draw shield effect when invulnerable
  if (invulnerableTime > 0) {
    const shieldSize = player.width * 0.7;
    ctx.beginPath();
    ctx.arc(centerX, centerY, shieldSize, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 0, 0, ${
      0.3 + Math.sin(gameTime * 0.2) * 0.2
    })`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw aura if power-up is active
  if (activePowerUp) {
    const auraSize = player.width * 0.8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, auraSize, 0, Math.PI * 2);
    ctx.strokeStyle = `${activePowerUp.color}80`; // With 50% opacity
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

// ======================================================
// HEARTS & POWER-UPS MANAGEMENT
// ======================================================

/**
 * Intenta crear un corazón de recuperación aleatoriamente
 */
function trySpawnHeart() {
  // Si ya apareció un corazón en este nivel, no crear otro
  if (heartSpawned) return;

  // Probabilidad baja de aparición (0.02% por frame)
  if (Math.random() < GAME_CONFIG.items.heartSpawnChance) {
    spawnHeart();
    heartSpawned = true;
  }
}

/**
 * Crea un corazón de recuperación
 */
function spawnHeart() {
  const heartSize = PLAYER_WIDTH * 0.8;

  // Posición aleatoria (evitando bordes)
  const x = heartSize + Math.random() * (canvas.width - heartSize * 2);
  const y = -heartSize; // Aparece desde arriba

  // Velocidad similar a los enemigos pero más lenta
  const levelSpeedFactor = 1 + level * 0.1;
  const speed = canvas.height * 0.003 * levelSpeedFactor;

  hearts.push({
    x: x,
    y: y,
    width: heartSize,
    height: heartSize,
    velocityY: speed,
    velocityX: (Math.random() - 0.5) * speed * 0.5, // Ligero movimiento horizontal
  });
}

/**
 * Actualiza y dibuja los corazones de recuperación
 */
function updateHearts() {
  for (let i = hearts.length - 1; i >= 0; i--) {
    const heart = hearts[i];

    // Mover corazón
    heart.x += heart.velocityX;
    heart.y += heart.velocityY;

    // Rebotar en los bordes
    if (heart.x <= 0 || heart.x + heart.width >= canvas.width) {
      heart.velocityX *= -1;
    }

    // Dibujar corazón
    ctx.fillStyle = "#FF0000";

    // Dibujar forma de corazón
    ctx.save();
    ctx.beginPath();
    const centerX = heart.x + heart.width / 2;
    const centerY = heart.y + heart.height / 2;
    const size = heart.width / 2;

    // Efecto de pulsación
    const pulse = 1 + Math.sin(gameTime * 0.1) * 0.1;
    ctx.translate(centerX, centerY);
    ctx.scale(pulse, pulse);

    // Dibujar corazón con path
    ctx.moveTo(0, -size / 4);
    ctx.bezierCurveTo(size / 2, -size, size, -size / 4, 0, size);
    ctx.bezierCurveTo(-size, -size / 4, -size / 2, -size, 0, -size / 4);

    // Añadir brillo
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = 15;

    ctx.fillStyle = "#FF0000";
    ctx.fill();
    ctx.restore();

    // Comprobar colisión con jugador
    if (checkCollisionBetweenObjects(player, heart)) {
      // Recuperar vida si no tiene el máximo
      if (playerLives < 5) {
        playerLives++;
        updateLivesDisplay();
        playSound("heart");
        showScreenMessage("¡Vida recuperada! ❤️", "#FF0000");

        // Efecto visual al recoger corazón
        createParticleEffect(
          heart.x + heart.width / 2,
          heart.y + heart.height / 2,
          "#FF0000",
          30
        );
      }

      // Eliminar corazón
      hearts.splice(i, 1);
    }

    // Eliminar corazones que salen de la pantalla
    if (heart.y > canvas.height) {
      hearts.splice(i, 1);
    }
  }
}

/**
 * Intenta crear un power-up aleatorio
 */
function trySpawnPowerUp() {
  // Si ya apareció un power-up en este nivel, no crear otro
  if (powerUpsSpawned) return;

  // Probabilidad baja de aparición (0.015% por frame)
  if (Math.random() < GAME_CONFIG.items.powerUpSpawnChance) {
    spawnRandomPowerUp();
    powerUpsSpawned = true;
  }
}

/**
 * Crea un power-up aleatorio
 */
function spawnRandomPowerUp() {
  const size = PLAYER_WIDTH * 0.7;
  const x = size + Math.random() * (canvas.width - size * 2);
  const y = -size;

  // Elegir tipo aleatorio de power-up
  const types = Object.values(POWERUP_TYPES);
  const type = types[Math.floor(Math.random() * types.length)];

  powerUps.push({
    x: x,
    y: y,
    width: size,
    height: size,
    velocityY: canvas.height * 0.003,
    velocityX: (Math.random() - 0.5) * 0.002 * canvas.height,
    type: type,
  });
}

/**
 * Actualiza y dibuja los power-ups
 */
function updatePowerUps() {
  // Actualizar power-up activo
  if (activePowerUp) {
    powerUpTimeLeft--;

    if (powerUpTimeLeft <= 0) {
      // Si se acaba el tiempo, desactivar power-up
      if (activePowerUp.id === 3) {
        // Rapid Fire
        // Restaurar velocidad normal de disparo
        updateShootingSpeed();
      }

      activePowerUp = null;

      // Mostrar mensaje
      showScreenMessage("Power-up terminado", "#FFFFFF");
    }

    // Actualizar indicador visual
    updatePowerUpIndicator();
  }

  // Procesar power-ups en pantalla
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];

    // Mover power-up
    powerUp.y += powerUp.velocityY;
    powerUp.x += powerUp.velocityX;

    // Rebotar en bordes
    if (powerUp.x < 0 || powerUp.x + powerUp.width > canvas.width) {
      powerUp.velocityX *= -1;
    }

    // Dibujar power-up
    ctx.save();
    ctx.fillStyle = powerUp.type.color;
    ctx.shadowColor = powerUp.type.color;
    ctx.shadowBlur = 10;

    // Efecto de flotación
    const floatOffset = Math.sin(gameTime * 0.1) * 3;

    // Forma de diamante para el power-up
    ctx.beginPath();
    ctx.moveTo(powerUp.x + powerUp.width / 2, powerUp.y + floatOffset);
    ctx.lineTo(
      powerUp.x + powerUp.width,
      powerUp.y + powerUp.height / 2 + floatOffset
    );
    ctx.lineTo(
      powerUp.x + powerUp.width / 2,
      powerUp.y + powerUp.height + floatOffset
    );
    ctx.lineTo(powerUp.x, powerUp.y + powerUp.height / 2 + floatOffset);
    ctx.closePath();
    ctx.fill();

    // Icono dentro del power-up
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${powerUp.width * 0.4}px Arial`;

    // Símbolo basado en tipo de power-up
    let symbol = "?";
    switch (powerUp.type.id) {
      case 0:
        symbol = "→";
        break; // Penetrante
      case 1:
        symbol = "↑";
        break; // Amplio
      case 2:
        symbol = "✺";
        break; // Explosivo
      case 3:
        symbol = "⚡";
        break; // Rápido
    }

    ctx.fillText(
      symbol,
      powerUp.x + powerUp.width / 2,
      powerUp.y + powerUp.height / 2 + floatOffset
    );
    ctx.restore();

    // Colisión con jugador
    if (checkCollisionBetweenObjects(player, powerUp)) {
      // Activar power-up
      activatePowerUp(powerUp.type);

      // Efecto visual
      createParticleEffect(
        powerUp.x + powerUp.width / 2,
        powerUp.y + powerUp.height / 2,
        powerUp.type.color,
        30
      );

      // Eliminar power-up
      powerUps.splice(i, 1);
    }

    // Eliminar si sale de pantalla
    if (powerUp.y > canvas.height) {
      powerUps.splice(i, 1);
      powerUpsSpawned = false; // Permitir generar otro
    }
  }
}

/**
 * Activa un power-up
 * @param {Object} type - Tipo de power-up a activar
 */
function activatePowerUp(type) {
  // Desactivar power-up anterior si existe
  if (activePowerUp) {
    // Restaurar disparo normal si es Disparo Rápido
    if (activePowerUp.id === 3) {
      updateShootingSpeed();
    }
  }

  // Establecer nuevo power-up
  activePowerUp = type;
  powerUpTimeLeft = type.duration;

  // Mostrar mensaje en pantalla
  showScreenMessage(`¡${type.name}!`, type.color);

  // Aplicar efecto según tipo
  switch (type.id) {
    case 0: // Balas Penetrantes
      // Lógica implementada en shootBullet y checkBulletEnemyCollisions
      break;
    case 1: // Disparo Amplio
      // Lógica implementada en shootBullet
      break;
    case 2: // Balas Explosivas
      // Lógica implementada en checkBulletEnemyCollisions
      break;
    case 3: // Disparo Rápido
      // Aumentar velocidad de disparo
      if (autoShootInterval) {
        clearInterval(autoShootInterval);
      }
      autoShootInterval = setInterval(() => {
        shootBullet();
      }, 50); // Muy rápido temporalmente
      break;
  }

  // Reproducir sonido
  playSound("powerUp");
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

// ======================================================
// BULLET MANAGEMENT
// ======================================================

/**
 * Creates a regular bullet (fired upward)
 */
function shootBullet() {
  const currentTime = Date.now();
  const cooldownTime = Math.max(80, 200 - level * 12); // Cooldown base

  if (currentTime - lastShootTime > cooldownTime) {
    // Base bullet properties
    const bulletSpeed = canvas.height * (0.015 + level * 0.002); // Increase speed with level

    // Propiedades especiales basadas en power-ups
    const isPenetrating = activePowerUp && activePowerUp.id === 0;
    const isWideShot = activePowerUp && activePowerUp.id === 1;
    const isExplosive = activePowerUp && activePowerUp.id === 2;

    // Número de balas basado en nivel y power-up
    let bulletCount = 1;
    let spreadAngle = Math.PI / 12; // 15 grados por defecto

    if (isWideShot) {
      bulletCount = 7; // Muchas balas para disparo amplio
      spreadAngle = Math.PI / 8; // 22.5 grados para mejor cobertura
    } else if (level >= 3) {
      bulletCount = Math.min(1 + Math.floor(level / 3), 5); // Max 5 bullets por nivel
    }

    // Crear balas
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
        penetrating: isPenetrating, // Flag para balas penetrantes
        explosive: isExplosive, // Flag para balas explosivas
        penetrationCount: isPenetrating ? 3 : 0, // Penetra hasta 3 enemigos
      });
    }

    lastShootTime = currentTime;

    // Reproducir sonido de disparo sólo si el juego está activo y no está pausado
    if (gameInterval) {
      playSound("shoot");
    }
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
      explosive: true, // Special bullets are also explosive
    });
  }

  // Efecto visual
  createParticleEffect(
    player.x + player.width / 2,
    player.y + player.height / 2,
    "#FF0000",
    50 // Más partículas para poder especial
  );

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

    // Draw bullet - diferentes estilos según tipo
    ctx.save();

    // Efecto visual según tipo de bala
    if (bullet.penetrating) {
      // Efecto para balas penetrantes
      ctx.shadowColor = "#FFFF00";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "#FFFF00";
      ctx.lineWidth = 2;

      // Estela tras la bala
      ctx.beginPath();
      ctx.moveTo(bullet.x + bullet.width / 2, bullet.y + bullet.height);
      ctx.lineTo(bullet.x + bullet.width / 2, bullet.y + bullet.height + 15);
      ctx.stroke();
    } else if (bullet.explosive) {
      // Efecto para balas explosivas
      ctx.shadowColor = "#FF8800";
      ctx.shadowBlur = 10;
    }

    if (bulletImage && bulletImage.complete) {
      // Dibujar con rotación según dirección
      const angle =
        Math.atan2(bullet.velocityY, bullet.velocityX) + Math.PI / 2;

      ctx.translate(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
      ctx.rotate(angle);
      ctx.drawImage(
        bulletImage,
        -bullet.width / 2,
        -bullet.height / 2,
        bullet.width,
        bullet.height
      );
    } else {
      // Draw placeholder
      ctx.fillStyle = bullet.penetrating
        ? "#FFFF00"
        : bullet.explosive
        ? "#FF8800"
        : "#FFFFFF";
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    ctx.restore();
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
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#FF0000";

    // Calcular rotación según dirección
    const angle = Math.atan2(bullet.velocityY, bullet.velocityX) + Math.PI / 2;

    ctx.translate(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
    ctx.rotate(angle);

    if (bulletImage && bulletImage.complete) {
      ctx.drawImage(
        bulletImage,
        -bullet.width / 2,
        -bullet.height / 2,
        bullet.width,
        bullet.height
      );
    } else {
      // Draw placeholder
      ctx.fillStyle = "#FF3333";
      ctx.fillRect(
        -bullet.width / 2,
        -bullet.height / 2,
        bullet.width,
        bullet.height
      );
    }
    ctx.restore();

    // Efecto de partículas para balas especiales (estela)
    if (gameTime % 3 === 0) {
      // Solo cada 3 frames para no sobrecargar
      createParticleEffect(
        bullet.x + bullet.width / 2,
        bullet.y + bullet.height / 2,
        "#FF3333",
        1
      );
    }
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

/**
 * Check for collisions between bullets and enemies
 */
function checkBulletEnemyCollisions() {
  // Check regular bullets vs enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    let enemyHit = false;
    let explosionSource = null;

    // Check against regular bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      const bullet = bullets[j];

      if (checkCollisionBetweenObjects(bullet, enemy)) {
        // Mark enemy as hit
        enemyHit = true;

        // Guardar referencia para explosión si la bala es explosiva
        if (bullet.explosive) {
          explosionSource = {
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
          };
        }

        // Manejar balas penetrantes
        if (bullet.penetrating) {
          bullet.penetrationCount--;
          if (bullet.penetrationCount <= 0) {
            bullets.splice(j, 1);
          }
        } else {
          // Bala normal, eliminar
          bullets.splice(j, 1);
        }

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

          // Special bullets are explosive
          explosionSource = {
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
          };

          // No eliminar la bala especial, solo continúa
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

      // Si había una fuente de explosión, procesarla y dañar enemigos cercanos
      if (explosionSource) {
        createExplosionEffect(explosionSource.x, explosionSource.y);

        // Dañar enemigos cercanos con la explosión
        for (let k = enemies.length - 1; k >= 0; k--) {
          const nearbyEnemy = enemies[k];
          const centerX = nearbyEnemy.x + nearbyEnemy.width / 2;
          const centerY = nearbyEnemy.y + nearbyEnemy.height / 2;

          // Calcular distancia al centro de la explosión
          const dx = centerX - explosionSource.x;
          const dy = centerY - explosionSource.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Si está dentro del radio de explosión, eliminarlo
          if (distance < EXPLOSION_RADIUS) {
            // Eliminar enemigo
            enemies.splice(k, 1);

            // Actualizar estadísticas
            enemiesKilled++;
            enemiesForSpecialPower++;
            score += 5 * level; // Menos puntos por explosión

            // Comprobar poder especial
            if (enemiesForSpecialPower >= ENEMIES_FOR_SPECIAL) {
              specialPowerReady = true;
              enemiesForSpecialPower = ENEMIES_FOR_SPECIAL;
            }

            // Actualizar UI
            document.getElementById(
              "enemies-killed"
            ).textContent = `Enemigos: ${enemiesKilled}`;
            document.getElementById(
              "score"
            ).textContent = `Puntuación: ${score}`;
            updateSpecialPowerIndicator();
          }
        }
      }

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
      if (invulnerableTime <= 0) {
        playerHit();

        // Eliminar enemigo que golpeó al jugador
        enemies.splice(i, 1);
        return;
      }
    }
  }
}

// ======================================================
// GAME LOOP
// ======================================================

/**
 * Main game loop function
 */
function gameLoop() {
  try {
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

    // Intentar generar un corazón o power-up aleatoriamente
    trySpawnHeart();
    trySpawnPowerUp();

    // Spawn enemies if needed
    spawnTimer++;

    // Delay between enemy spawns decreases with level
    const spawnDelay = Math.max(
      GAME_CONFIG.enemies.minSpawnRate,
      GAME_CONFIG.enemies.spawnRateBase -
        level * GAME_CONFIG.enemies.spawnRateReduction
    );

    // Multiple enemy spawning at higher levels
    if (spawnTimer >= spawnDelay) {
      // Spawn at least one enemy
      spawnEnemy();

      // Chance to spawn additional enemies based on level
      if (level > GAME_CONFIG.enemies.extraEnemiesThreshold) {
        const extraEnemyChance = Math.min(
          GAME_CONFIG.enemies.extraEnemyChancePerLevel * level,
          GAME_CONFIG.enemies.maxExtraEnemyChance
        );
        if (Math.random() < extraEnemyChance) {
          spawnEnemy();
        }
      }

      // Reset spawn timer
      spawnTimer = 0;
    }

    // Update invulnerability timer
    updateInvulnerability();

    // Update and draw game elements
    updateEnemies();
    updateBullets();
    updateHearts();
    updatePowerUps();
    drawPlayer();

    // Check collisions
    checkBulletEnemyCollisions();
    checkPlayerEnemyCollisions();

    // Draw UI overlays
    drawGameInfo();

    // Troubleshoot if the game has been running for a while with no enemy kills
    if (gameTime > 300 && enemiesKilled === 0) {
      console.log(
        "Posible problema: El juego lleva tiempo corriendo sin eliminar enemigos"
      );
    }
  } catch (error) {
    console.error("Error in game loop:", error);

    // Try to recover
    if (!gameInterval) {
      gameInterval = setInterval(gameLoop, 1000 / 60);
    }
  }
}

/**
 * Draws additional UI information on screen
 */
function drawGameInfo() {
  // Dibuja información adicional como nivel actual, combo, etc.
  // Aquí podrían añadirse más elementos visuales

  // Dibuja un indicador de nivel en la esquina superior derecha
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(canvas.width - 100, 10, 90, 30);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Nivel ${level}`, canvas.width - 55, 30);
  ctx.restore();

  // Dibuja un indicador de puntaje actual en la esquina superior izquierda
  // Solo cuando cambia el puntaje, mostrar animación
  if (score > 0 && gameTime % 120 < 60) {
    // Parpadea cada 2 segundos
    ctx.save();
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#FF0000";
    ctx.textAlign = "left";
    ctx.fillText(`${score}`, 20, 40);
    ctx.restore();
  }
}

// ======================================================
// GAME STATE MANAGEMENT
// ======================================================

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

  // Efecto visual de explosión grande al perder
  createParticleEffect(
    player.x + player.width / 2,
    player.y + player.height / 2,
    "#FF0000",
    100
  );
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

// URL de tu Web App (CAMBIAR POR LA QUE COPIASTE)
const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbzcBMcYnf3EvWdmUZMHqa1uBO8gmSOLExJcgy94P5AyLplVB29GaFjtjiK5ITU2zNX9/exec";

/**
 * Guarda la puntuación usando el formato EXACTO de tu Excel (8 columnas)
 */
async function saveScore() {
  console.log("🚀 Iniciando saveScore...");

  // Datos en el formato EXACTO de tu Excel
  const playerData = {
    date: new Date().toISOString(), // 2025-03-24T22:28:59.509Z (igual que tienes)
    avatar: playerAvatar, // 👹
    name: playerName, // ROJO
    level: level, // 10
    enemiesKilled: enemiesKilled, // 282
    time: Math.floor(gameTime / 60), // 237
    score: score, // 10355
    status: document
      .getElementById("game-over-text")
      .textContent.includes("Victoria")
      ? "Victoria"
      : "Derrota",
  };

  console.log("📊 Datos a enviar (formato exacto de tu Excel):", playerData);
  console.log("🌐 URL:", WEBAPP_URL);

  try {
    console.log("📤 Enviando datos...");

    const response = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(playerData),
    });

    console.log("📥 Respuesta recibida. Status:", response.status);

    let result;
    try {
      const textResponse = await response.text();
      console.log("📝 Respuesta cruda:", textResponse);
      result = JSON.parse(textResponse);
    } catch (parseError) {
      console.error("❌ Error al parsear respuesta:", parseError);
      throw new Error("La respuesta del servidor no es JSON válido");
    }

    console.log("✅ Resultado parseado:", result);

    if (result.success) {
      console.log("✅ Datos guardados exitosamente en tu Excel");
      alert("¡Puntuación guardada con éxito! 🎉");
      return true;
    } else {
      throw new Error(result.message || "Error desconocido del servidor");
    }
  } catch (error) {
    console.error("❌ Error completo:", error);

    let errorMessage = "Error al guardar la puntuación: ";

    if (error.message.includes("Failed to fetch")) {
      errorMessage += "Problema de conexión con Google Apps Script.";
    } else if (error.message.includes("CORS")) {
      errorMessage +=
        "Problema de permisos CORS. Verifica la configuración del Web App.";
    } else {
      errorMessage += error.message;
    }

    alert(errorMessage);
    console.log("🔧 Para depurar, revisa la consola del navegador (F12)");
    return false;
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

  // Efecto visual de celebración
  celebrationEffect();
}

/**
 * Lee el ranking usando el formato EXACTO de tu Excel (8 columnas)
 */
async function viewRanking() {
  try {
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("game-area").style.display = "none";

    const rankingContainer = document.getElementById("ranking-container");
    rankingContainer.style.display = "block";
    rankingContainer.innerHTML = `<h2>⌛ Cargando ranking... ⌛</h2>`;

    const response = await fetch(WEBAPP_URL);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Error al obtener datos");
    }

    const players = result.data || [];

    if (players.length === 0) {
      rankingContainer.innerHTML = `
        <h2>📊 Ranking de Jugadores</h2>
        <p>No hay puntuaciones registradas aún.</p>
        <button onclick="backToMenu()" class="gothic-button">Volver al Menú</button>
      `;
      return;
    }

    // Procesar datos usando TUS nombres de columnas exactos
    const processedPlayers = players.map((player) => ({
      date: player.date || "", // date
      avatar: player.avatar || "👤", // avatar
      name: player.name || "Anónimo", // name
      level: parseInt(player.level) || 1, // level
      enemiesKilled: parseInt(player.enemiesKilled) || 0, // enemiesKilled
      time: parseInt(player.time) || 0, // time
      score: parseInt(player.score) || 0, // score
      status: player.status || "Derrota", // status
    }));

    // Ordenar por puntuación (descendente) y luego por tiempo (ascendente)
    const sortedPlayers = processedPlayers.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.time - b.time;
    });

    // Tomar solo los primeros 10
    const top10 = sortedPlayers.slice(0, 10);

    // Generar HTML del ranking
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
          <th>Fecha</th>
        </tr>
        ${top10
          .map(
            (player, index) => `
          <tr ${
            index < 3 ? 'style="background-color: rgba(255, 215, 0, 0.2);"' : ""
          }>
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
            <td>${new Date(player.date).toLocaleDateString()}</td>
          </tr>
        `
          )
          .join("")}
      </table>
      <div style="margin-top: 20px;">
        <button onclick="backToMenu()" class="gothic-button">Volver al Menú</button>
        <button onclick="viewRanking()" class="gothic-button">Actualizar</button>
      </div>
    `;
  } catch (error) {
    console.error("Error al cargar ranking:", error);

    const rankingContainer = document.getElementById("ranking-container");
    rankingContainer.innerHTML = `
      <h2>❌ Error al cargar el ranking</h2>
      <p>No se pudo conectar con Google Sheets.</p>
      <p>Detalles: ${error.message}</p>
      <button onclick="backToMenu()" class="gothic-button">Volver al Menú</button>
      <button onclick="viewRanking()" class="gothic-button">Reintentar</button>
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

/**
 * Función de diagnóstico para mostrar el estado actual del juego
 */
window.debugGameState = function () {
  console.log("Game State Debug:");
  console.log(
    "- Player position:",
    player ? `(${player.x}, ${player.y})` : "undefined"
  );
  console.log("- Player visible:", player ? player.visible : "N/A");
  console.log(
    "- Player image loaded:",
    playerImage ? playerImage.complete : "No image"
  );
  console.log(
    "- Canvas size:",
    canvas ? `${canvas.width}x${canvas.height}` : "undefined"
  );
  console.log("- Game interval active:", gameInterval ? "yes" : "no");
  console.log(
    "- Auto shoot interval:",
    autoShootInterval ? "active" : "inactive"
  );
  console.log("- Bullet count:", bullets ? bullets.length : "undefined");
  console.log("- Enemy count:", enemies ? enemies.length : "undefined");
  console.log("- Level:", level);
  console.log("- Game time:", gameTime);

  // Intentar dibujar un rectángulo en la posición actual del jugador para comprobar
  if (canvas && ctx) {
    ctx.fillStyle = "#FF00FF";
    ctx.fillRect(mouseX - 20, mouseY - 20, 40, 40);
    console.log("Dibujado rectángulo de diagnóstico en posición del mouse");
  }

  return "Diagnóstico completado. Revisa la consola para más detalles.";
};

/**
 * Función para solucionar manualmente el juego si está congelado
 */
window.fixGame = function () {
  console.log("Iniciando reparación manual del juego");

  // Detener y reiniciar los intervalos
  if (gameInterval) clearInterval(gameInterval);
  if (autoShootInterval) clearInterval(autoShootInterval);

  // Reiniciar el bucle del juego
  gameInterval = setInterval(gameLoop, 1000 / 60);
  startAutoShoot();

  // Asegurar que el jugador sea visible y esté centrado
  if (player) {
    player.visible = true;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;
  }

  // Forzar la creación de un enemigo si no hay ninguno
  if (enemies && enemies.length === 0) {
    spawnEnemy();
  }

  console.log("Reparación manual completada");
  return "Reparación del juego completada. Verifica si ahora funciona correctamente.";
};

// ======================================================
// WINDOW EVENT LISTENERS
// ======================================================

// Prevent context menu on right click
window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  return false;
});

// Ensure all event listeners are removed when page unloads
window.addEventListener("beforeunload", () => {
  if (gameInterval) {
    clearInterval(gameInterval);
  }
  if (autoShootInterval) {
    clearInterval(autoShootInterval);
  }
  stopBackgroundMusic();
});
