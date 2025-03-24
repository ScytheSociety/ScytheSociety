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
    baseSpeed: 0.004, // Velocidad base como fracción de altura de canvas
    levelSpeedIncrease: 0.2, // Aumento de velocidad por nivel (20%)
    sizeReduction: 0.05, // Reducción de tamaño por nivel (5%)
    maxSpeedFactor: 1.5, // Factor máximo de velocidad tras rebotes
    spawnRateBase: 60, // Frames entre apariciones base
    spawnRateReduction: 4, // Reducción de frames por nivel
    minSpawnRate: 20, // Mínimo tiempo entre apariciones (frames)
    extraEnemiesThreshold: 2, // Nivel a partir del cual pueden aparecer enemigos extra
    extraEnemyChancePerLevel: 0.05, // Probabilidad por nivel de enemigos extra
    maxExtraEnemyChance: 0.4, // Probabilidad máxima de enemigos extra
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
    enemiesPerLevel: [50, 150, 450, 1350, 4050, 12150, 36450, 109350, 328050], // Enemigos para pasar de nivel
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
      // Create fallbacks for images if they fail to load
      playerImage = createFallbackImage(80, 80, "#FF0000");
      bulletImage = createFallbackImage(20, 40, "#FFFFFF");
      backgroundImages[0] = createFallbackImage(
        canvas.width,
        canvas.height,
        "#111111"
      );

      alert("Error loading game assets. Using fallback graphics.");
    });
}

/**
 * Helper function to create fallback canvas images
 */
function createFallbackImage(width, height, color) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.fillStyle = color;
  tempCtx.fillRect(0, 0, width, height);

  if (color === "#FF0000") {
    // Player
    // Add crosshair to fallback player image
    tempCtx.strokeStyle = "#FFFFFF";
    tempCtx.lineWidth = 2;
    tempCtx.beginPath();
    tempCtx.moveTo(width / 2, 0);
    tempCtx.lineTo(width / 2, height);
    tempCtx.moveTo(0, height / 2);
    tempCtx.lineTo(width, height / 2);
    tempCtx.stroke();
  }

  const img = new Image();
  img.src = tempCanvas.toDataURL();
  return img;
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
function showLevelTransition(playSound = true) {
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
  if (playSound) {
    playSound("levelUp");
  }

  setTimeout(() => {
    document.body.removeChild(transition);
    isLevelTransition = false;
  }, 2000);
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

    // Try to spawn a heart or power-up randomly
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
      troubleshootGame();
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
 * Función de depuración para mostrar el estado actual del juego
 */
function debugGameState() {
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
}

/**
 * Función para solucionar problemas del juego
 */
function troubleshootGame() {
  // Log current state
  debugGameState();

  // If game is stuck, try to recover
  if (gameInterval && player) {
    console.log("Attempting to troubleshoot game...");

    // Reset player position to center
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height / 2 - player.height / 2;
    player.visible = true;

    // Make sure we have at least one enemy
    if (enemies.length === 0) {
      spawnEnemy();
    }

    // Force redraw
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 1000 / 60);

    console.log("Game troubleshooting complete");
  }
}

/**
 * Función manual para solucionar problemas del juego
 */
window.fixGame = function () {
  console.log("Manual game fix initiated");

  // Debug current state
  debugGameState();

  // Try to fix common issues
  if (!player) {
    console.log("Player object missing, recreating...");
    player = {
      x: canvas.width / 2 - PLAYER_WIDTH / 2,
      y: canvas.height / 2 - PLAYER_HEIGHT / 2,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      image: playerImage,
      visible: true,
      damaged: false,
    };
  }

  // Ensure intervals are running
  if (!gameInterval) {
    console.log("Game interval not running, restarting...");
    gameInterval = setInterval(gameLoop, 1000 / 60);
  }

  if (!autoShootInterval) {
    console.log("Auto shoot interval not running, restarting...");
    startAutoShoot();
  }

  // Force player to be visible
  player.visible = true;

  // Force redraw
  if (canvas && ctx) {
    console.log("Forcing canvas redraw...");
    gameLoop();
  }

  console.log("Fix completed");
  return "Game fix attempt completed. Check console for details.";
};

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
