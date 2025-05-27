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

let spawnExtraEnemiesFlag = false;
let waveInProgress = false;

let comboDisplay = null; // Elemento para mostrar combo
let lastComboTime = 0; // Tiempo del último combo

// Lives System
let playerLives = 5;
let invulnerableTime = 0;
let INVULNERABLE_DURATION = 120; // 2 segundos a 60fps
let heartSpawned = false;

// AGREGAR VARIABLES DE CONTROL AL INICIO DEL ARCHIVO (después de las variables globales)
let gameEnded = false; // Para controlar si el juego ha terminado
let scoreAlreadySaved = false; // Para evitar guardado múltiple
let isSaving = false; // Para evitar múltiples operaciones de guardado simultáneas

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

// 2. CONFIGURACIÓN MEJORADA - Balance y Performance
const GAME_CONFIG = {
  // Dificultad General - BALANCEADA
  difficulty: 1.0, // Reducido de 1.2 a 1.0 para mejor balance

  // Enemigos - OPTIMIZADO PARA PERFORMANCE
  enemies: {
    baseSpeed: 0.0025, // Reducido de 0.003 a 0.0025
    levelSpeedIncrease: 0.12, // Reducido de 0.15 a 0.12
    sizeReduction: 0.025, // Ligeramente aumentado
    maxSpeedFactor: 0.5, // Reducido de 0.6 a 0.5

    // SPAWN BALANCEADO - Menos intenso para evitar congelamiento
    spawnRateBase: 55, // Aumentado de 45 a 55 (menos frecuente)
    spawnRateReduction: 2, // Reducido de 3 a 2 (progresión más suave)
    minSpawnRate: 25, // Aumentado de 15 a 25 (mínimo más alto)

    // OLEADAS BALANCEADAS
    extraEnemiesThreshold: 3, // Vuelto a 3
    extraEnemyChancePerLevel: 0.05, // Reducido de 0.08 a 0.05
    maxExtraEnemyChance: 0.3, // Reducido de 0.5 a 0.3

    // OLEADAS OPTIMIZADAS
    waveSpawnChance: 0.0015, // Reducido de 0.003 a 0.0015 (menos frecuentes)
    waveSize: 4, // Reducido de 5 a 4 enemigos
    bossSpawnLevel: 7, // Aumentado de 5 a 7
    bossHealthMultiplier: 2, // Reducido de 3 a 2
  },

  // Power-ups y corazones - BALANCEADOS
  items: {
    heartSpawnChance: 0.0012, // AUMENTADO de 0.0005 a 0.0012 (más del doble)
    powerUpSpawnChance: 0.001, // AUMENTADO de 0.0004 a 0.0010 (2.5x más frecuente)
    maxPowerUpDuration: 800,
    minPowerUpDuration: 500,
    explosionRadius: 100,
    multiHeartChance: 0.3, // AUMENTADO de 0.2 a 0.3
    rarePowerUpChance: 0.15, // AUMENTADO de 0.08 a 0.15
    comboMultiplier: 1.3,
    shieldDuration: 250,
  },

  // Jugador - BALANCEADO
  player: {
    lives: 7, // Mantener 7 vidas
    invulnerabilityTime: 100, // Aumentado de 90 a 100
    autoShootDelayBase: 140, // Aumentado de 120 a 140ms
    autoShootDelayReduction: 12, // Reducido de 15 a 12ms
    autoShootDelayMin: 50, // Aumentado de 40 a 50ms
    bulletSpeedBase: 0.018, // Reducido de 0.02 a 0.018
    bulletSpeedIncrease: 0.0025, // Reducido
    specialPowerCost: 18, // Aumentado de 15 a 18
    specialPowerDuration: 3500, // Reducido de 4000 a 3500ms
    specialBulletCount: 20, // Reducido de 24 a 20
    comboCounter: 0,
    maxCombo: 40, // Reducido de 50 a 40
    adrenalineMode: false,
  },

  // NIVELES EXTENDIDOS Y BALANCEADOS - 20 NIVELES
  levels: {
    enemiesPerLevel: [
      // Niveles 1-5: Introducción suave
      30, 65, 105, 150, 200,
      // Niveles 6-10: Incremento moderado
      260, 330, 410, 500, 600,
      // Niveles 11-15: Desafío intenso pero controlado
      720, 860, 1020, 1200, 1400,
      // Niveles 16-20: Máximo desafío
      1620, 1860, 2120, 2400, 2700,
    ],
    bossLevels: [5, 10, 15, 20], // Bosses en niveles clave
    bonusLevels: [7, 14], // Niveles bonus
  },

  // EVENTOS ESPECIALES BALANCEADOS
  special: {
    survivalModeAfter: 20, // Después del nivel 20
    survivalSpawnRate: 0.3, // Reducido

    // EVENTOS MÁS FRECUENTES PERO BALANCEADOS
    meteorShowerChance: 0.0008, // Reducido de 0.001
    timeSlowChance: 0.0012, // Aumentado de 0.0005 (más frecuente - ¡es hermoso!)
    doublePointsChance: 0.0006, // Reducido de 0.0008

    // DURACIÓN DE EVENTOS
    timeSlowDuration: 5000, // 5 segundos de tiempo lento
    meteorShowerSize: 6, // Reducido de 8 a 6 enemigos

    achievements: [
      { id: "combo_10", name: "Combo x10", requirement: 10 },
      { id: "level_10", name: "Veterano", requirement: 10 },
      { id: "level_20", name: "Maestro", requirement: 20 },
      { id: "no_damage", name: "Intocable", requirement: "no_damage_level" },
      {
        id: "speed_demon",
        name: "Demonio Veloz",
        requirement: "fast_completion",
      },
    ],
  },
};

// ======================================================
// CONTROL DE VOLUMEN - AÑADIR ESTAS FUNCIONES COMPLETAS
// ======================================================

// Variable global para el volumen maestro
let masterVolume = 0.5; // 50% por defecto

/**
 * Crea la barra de volumen en la interfaz
 */
function createVolumeControl() {
  // Crear contenedor de controles de sonido
  const volumeContainer = document.createElement("div");
  volumeContainer.id = "volume-control";
  volumeContainer.style.position = "fixed";

  // 👈 CAMBIO: Mover ABAJO para no tapar las vidas
  volumeContainer.style.top = "80px"; // Era "10px" - ahora más abajo
  volumeContainer.style.right = "10px";

  volumeContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  volumeContainer.style.padding = "10px";
  volumeContainer.style.borderRadius = "10px";
  volumeContainer.style.border = "2px solid #8B0000";
  volumeContainer.style.color = "#FFFFFF";
  volumeContainer.style.fontSize = "14px";
  volumeContainer.style.zIndex = "1001";
  volumeContainer.style.display = "flex";
  volumeContainer.style.alignItems = "center";
  volumeContainer.style.gap = "10px";
  volumeContainer.style.fontFamily = '"Times New Roman", serif';

  // Icono de volumen
  const volumeIcon = document.createElement("span");
  volumeIcon.textContent = "🔊";
  volumeIcon.style.fontSize = "18px";

  // Slider de volumen
  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.min = "0";
  volumeSlider.max = "100";
  volumeSlider.value = "50";
  volumeSlider.style.width = "80px";
  volumeSlider.style.cursor = "pointer";

  // Texto del porcentaje
  const volumeText = document.createElement("span");
  volumeText.textContent = "50%";
  volumeText.style.minWidth = "35px";
  volumeText.style.textAlign = "center";

  // Botón de mute/unmute
  const muteButton = document.createElement("button");
  muteButton.textContent = "🔇";
  muteButton.style.background = "none";
  muteButton.style.border = "1px solid #8B0000";
  muteButton.style.color = "#FFFFFF";
  muteButton.style.cursor = "pointer";
  muteButton.style.borderRadius = "5px";
  muteButton.style.padding = "2px 5px";
  muteButton.style.fontSize = "16px";

  let isMuted = false;
  let previousVolume = 50;

  // Event listeners (mismo código que antes)
  volumeSlider.addEventListener("input", (e) => {
    const volume = parseInt(e.target.value);
    masterVolume = volume / 100;
    volumeText.textContent = `${volume}%`;
    updateAllSoundVolumes();

    if (volume === 0) {
      volumeIcon.textContent = "🔇";
    } else if (volume < 30) {
      volumeIcon.textContent = "🔈";
    } else if (volume < 70) {
      volumeIcon.textContent = "🔉";
    } else {
      volumeIcon.textContent = "🔊";
    }
  });

  muteButton.addEventListener("click", () => {
    if (isMuted) {
      masterVolume = previousVolume / 100;
      volumeSlider.value = previousVolume;
      volumeText.textContent = `${previousVolume}%`;
      muteButton.textContent = "🔇";
      volumeIcon.textContent = previousVolume > 50 ? "🔊" : "🔉";
      isMuted = false;
    } else {
      previousVolume = parseInt(volumeSlider.value);
      masterVolume = 0;
      volumeSlider.value = 0;
      volumeText.textContent = "0%";
      muteButton.textContent = "🔊";
      volumeIcon.textContent = "🔇";
      isMuted = true;
    }
    updateAllSoundVolumes();
  });

  // Ensamblar el control
  volumeContainer.appendChild(volumeIcon);
  volumeContainer.appendChild(volumeSlider);
  volumeContainer.appendChild(volumeText);
  volumeContainer.appendChild(muteButton);

  document.body.appendChild(volumeContainer);
}

/**
 * Actualiza el volumen de todos los sonidos
 */
function updateAllSoundVolumes() {
  for (const key in sounds) {
    if (sounds.hasOwnProperty(key)) {
      const sound = sounds[key];

      // Volúmenes base específicos por sonido
      let baseVolume = 0.5;
      switch (key) {
        case "background":
          baseVolume = 0.3;
          break;
        case "explosion":
          baseVolume = 0.6;
          break;
        case "special":
          baseVolume = 0.7;
          break;
        case "powerUp":
          baseVolume = 0.6;
          break;
        case "shoot":
          baseVolume = 0.3;
          break; // Más bajo para disparos
        case "hit":
          baseVolume = 0.4;
          break;
        default:
          baseVolume = 0.5;
          break;
      }

      // Aplicar volumen maestro
      sound.volume = baseVolume * masterVolume;
    }
  }
}

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

  // Crear control de volumen
  createVolumeControl();

  // Aplicar volumen inicial a todos los sonidos
  updateAllSoundVolumes();
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

// ======================================================
// 1. SISTEMA DE MENSAJES DISTRIBUIDO (Reemplazar showScreenMessage existente)
// ======================================================

const messagePositions = [];
let messageIdCounter = 0;

function showScreenMessage(message, color = "#FFFFFF") {
  const messageId = messageIdCounter++;

  // Buscar posición disponible
  let yPosition = 20;
  const messageHeight = 40;
  const padding = 10;

  // Verificar posiciones ocupadas y encontrar una libre
  for (let y = 20; y < canvas.height - 200; y += messageHeight + padding) {
    const positionTaken = messagePositions.some(
      (pos) => Math.abs(pos.y - y) < messageHeight + padding && pos.active
    );

    if (!positionTaken) {
      yPosition = y;
      break;
    }
  }

  // Si no hay espacio arriba, usar posiciones alternativas
  if (yPosition > canvas.height - 300) {
    yPosition = 20 + (messageId % 5) * (messageHeight + padding);
  }

  // Registrar la posición
  const position = {
    id: messageId,
    y: yPosition,
    active: true,
    timeCreated: Date.now(),
  };
  messagePositions.push(position);

  const messageElement = document.createElement("div");
  messageElement.textContent = message;
  messageElement.style.position = "fixed";
  messageElement.style.top = `${yPosition}%`;
  messageElement.style.left = "50%";
  messageElement.style.transform = "translateX(-50%)";
  messageElement.style.color = color;
  messageElement.style.fontSize = "20px";
  messageElement.style.fontWeight = "bold";
  messageElement.style.textShadow = "2px 2px 4px rgba(0,0,0,0.8)";
  messageElement.style.zIndex = "1000";
  messageElement.style.backgroundColor = "rgba(0,0,0,0.5)";
  messageElement.style.padding = "5px 15px";
  messageElement.style.borderRadius = "10px";
  messageElement.style.border = `2px solid ${color}`;
  messageElement.style.maxWidth = "400px";
  messageElement.style.textAlign = "center";

  document.body.appendChild(messageElement);

  // Animación de desvanecimiento
  setTimeout(() => {
    messageElement.style.transition = "opacity 1s, transform 1s";
    messageElement.style.opacity = "0";
    messageElement.style.transform = "translateX(-50%) translateY(-20px)";

    // Marcar posición como libre
    const pos = messagePositions.find((p) => p.id === messageId);
    if (pos) pos.active = false;

    setTimeout(() => {
      if (messageElement.parentNode) {
        document.body.removeChild(messageElement);
      }
      // Limpiar posiciones viejas
      const now = Date.now();
      for (let i = messagePositions.length - 1; i >= 0; i--) {
        if (now - messagePositions[i].timeCreated > 10000) {
          messagePositions.splice(i, 1);
        }
      }
    }, 1000);
  }, 2000);
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

  // Crear el texto de vidas con apilamiento vertical
  let livesText = "";

  if (playerLives <= 7) {
    // Hasta 7 vidas: mostrar en línea horizontal
    livesText = "💀".repeat(playerLives);
  } else {
    // Más de 7 vidas: primera fila con 7, resto en segunda fila
    const firstRow = "💀".repeat(7);
    const secondRow = "💀".repeat(playerLives - 7);
    livesText = firstRow + "<br>" + secondRow;
  }

  // Actualizar el contenido con HTML para permitir <br>
  document.getElementById("player-lives").innerHTML = livesText;
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
  // Limpiar estado anterior
  resetGameState();

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

  // RESETEAR NUEVOS SISTEMAS:
  GAME_CONFIG.player.comboCounter = 0;
  GAME_CONFIG.player.adrenalineMode = false;

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
 * VERSIÓN ACTUALIZADA CON TODAS LAS NUEVAS CARACTERÍSTICAS
 */
function showInstructions() {
  // Crear elemento de instrucciones
  const instructionsModal = document.createElement("div");
  instructionsModal.id = "instructions-modal";
  instructionsModal.style.position = "fixed";
  instructionsModal.style.top = "50%";
  instructionsModal.style.left = "50%";
  instructionsModal.style.width = "85%";
  instructionsModal.style.maxWidth = "700px";
  instructionsModal.style.transform = "translate(-50%, -50%)";
  instructionsModal.style.backgroundColor = "rgba(0, 0, 0, 0.95)";
  instructionsModal.style.border = "3px solid #8B0000";
  instructionsModal.style.borderRadius = "15px";
  instructionsModal.style.padding = "25px";
  instructionsModal.style.color = "#FFFFFF";
  instructionsModal.style.zIndex = "1000";
  instructionsModal.style.fontFamily = '"Times New Roman", Times, serif';
  instructionsModal.style.boxShadow = "0 0 30px #FF0000";
  instructionsModal.style.textAlign = "left";
  instructionsModal.style.maxHeight = "85vh";
  instructionsModal.style.overflowY = "auto";

  // Contenido HTML de las instrucciones
  instructionsModal.innerHTML = `
    <h2 style="text-align: center; color: #FF0000; text-shadow: 0 0 15px #FF0000; margin-bottom: 20px;">🎮 HELL SHOOTER - GUÍA COMPLETA 🎮</h2>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 8px;">🎯 CONTROLES:</h3>
      <p>• <strong>Movimiento:</strong> Ratón (PC) o deslizar dedo (móvil)</p>
      <p>• <strong>Disparo:</strong> Automático y constante</p>
      <p>• <strong>Poder Especial:</strong> ESPACIO (PC) o tocar indicador 🔥 (móvil)</p>
      <p>• <strong>Volumen:</strong> Control deslizante en esquina superior derecha</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 8px;">🏆 OBJETIVO:</h3>
      <p><strong>Sobrevive 20 niveles épicos</strong> eliminando hordas de enemigos. Cada nivel requiere más enemigos para avanzar y la dificultad aumenta progresivamente.</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 8px;">💀 SISTEMA DE VIDAS:</h3>
      <p>• <strong>7 vidas iniciales</strong> (💀💀💀💀💀💀💀)</p>
      <p>• Invulnerabilidad temporal tras recibir daño</p>
      <p>• Recupera vidas con corazones ❤️</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 8px;">🔥 PODER ESPECIAL:</h3>
      <p>• Se carga cada <strong>18 enemigos</strong> eliminados</p>
      <p>• Dispara <strong>20 balas explosivas</strong> en todas direcciones</p>
      <p>• Duración: <strong>3.5 segundos</strong> de destrucción total</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 8px;">⚡ SISTEMA DE COMBOS:</h3>
      <p>• <strong>Elimina enemigos consecutivamente</strong> para multiplicar puntos</p>
      <p>• Combo x2, x3, x4... hasta x4.0 = <strong>¡4x más puntos!</strong></p>
      <p>• Se pierde si no eliminas enemigos por 2 segundos</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 8px;">🚨 MODO ADRENALINA:</h3>
      <p>• Se activa automáticamente con <strong>≤2 vidas</strong></p>
      <p>• <strong>Disparo más rápido</strong> + <strong>50% más puntos</strong></p>
      <p>• Pantalla roja parpadeante de intensidad máxima</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 8px;">💎 POWER-UPS:</h3>
      <p>• 🟡 <strong>Balas Penetrantes:</strong> Atraviesan 3 enemigos</p>
      <p>• 🔵 <strong>Disparo Amplio:</strong> 7 balas en abanico</p>
      <p>• 🟠 <strong>Balas Explosivas:</strong> Crean explosiones de área</p>
      <p>• 🟣 <strong>Disparo Rápido:</strong> Velocidad de fuego extrema</p>
      <p>• ✨ <strong>Power-ups Raros:</strong> Escudo, Puntos Dobles, Imán</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 8px;">🌟 EVENTOS ESPECIALES:</h3>
      <p>• 🌊 <strong>Oleadas Enemigas:</strong> 4 enemigos súper agresivos</p>
      <p>• ☄️ <strong>Lluvia de Meteoritos:</strong> 6 enemigos desde el cielo</p>
      <p>• 🐢 <strong>Tiempo Súper Lento:</strong> Todo se mueve como tortuga (¡hermoso!)</p>
      <p>• 💰 <strong>Puntos Dobles:</strong> Multiplica tu puntuación temporalmente</p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="color: #FF0000; margin-bottom: 8px;">🎵 AUDIO:</h3>
      <p>• <strong>Control de volumen</strong> en la esquina superior derecha</p>
      <p>• Botón de <strong>mute/unmute</strong> rápido</p>
      <p>• Ajuste de <strong>0% a 100%</strong> de volumen</p>
    </div>
    
    <div style="background: rgba(139, 0, 0, 0.2); padding: 15px; border-radius: 10px; margin: 15px 0;">
      <h3 style="color: #FFD700; margin-bottom: 8px; text-align: center;">🏅 PROGRESIÓN DE NIVELES:</h3>
      <p style="text-align: center;"><strong>Nivel 1-5:</strong> Introducción (30-200 enemigos)</p>
      <p style="text-align: center;"><strong>Nivel 6-10:</strong> Intensidad Media (260-600 enemigos)</p>
      <p style="text-align: center;"><strong>Nivel 11-15:</strong> Desafío Alto (720-1400 enemigos)</p>
      <p style="text-align: center;"><strong>Nivel 16-20:</strong> ¡INFIERNO PURO! (1620-2700 enemigos)</p>
    </div>
    
    <div style="text-align: center; margin-top: 25px;">
      <button id="start-game-btn" style="background: linear-gradient(45deg, #8B0000, #FF0000); color: white; padding: 15px 30px; font-size: 18px; border: none; border-radius: 10px; cursor: pointer; font-family: inherit; box-shadow: 0 0 20px #FF0000; font-weight: bold;">🔥 ¡COMENZAR AVENTURA! 🔥</button>
    </div>
  `;

  // Añadir al DOM
  document.body.appendChild(instructionsModal);

  // Asignar evento al botón
  document.getElementById("start-game-btn").addEventListener("click", () => {
    document.body.removeChild(instructionsModal);
    startRealGame();
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
 * Maneja la colisión del jugador con un enemigo - VERSIÓN ACTUALIZADA
 */
function playerHit() {
  // Si el jugador es invulnerable, no recibe daño
  if (invulnerableTime > 0) return;

  // Reducir vidas
  playerLives--;

  // Actualizar visualización (ahora maneja más de 7 vidas)
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
 * Sistema de oleadas de enemigos para mayor intensidad
 */
function trySpawnWave() {
  if (waveInProgress || enemies.length > 25) return; // 👈 LÍNEA NUEVA

  if (Math.random() < GAME_CONFIG.enemies.waveSpawnChance) {
    waveInProgress = true; // 👈 LÍNEA NUEVA

    console.log("¡Oleada de enemigos incoming!");
    showScreenMessage("¡OLEADA ENEMIGA!", "#FF4444");

    for (let i = 0; i < GAME_CONFIG.enemies.waveSize; i++) {
      setTimeout(() => {
        if (gameInterval && enemies.length < 35) {
          // 👈 LÍMITE AGREGADO
          // Crear enemigo simple para la oleada
          const waveEnemySize =
            ENEMY_MIN_SIZE + Math.random() * (ENEMY_MAX_SIZE - ENEMY_MIN_SIZE);
          const waveX = Math.random() * (canvas.width - waveEnemySize);
          const waveSpeed = canvas.height * 0.007;

          enemies.push({
            x: waveX,
            y: -waveEnemySize,
            width: waveEnemySize,
            height: waveEnemySize,
            velocityX: (Math.random() - 0.5) * waveSpeed,
            velocityY: waveSpeed,
            image: enemyImages[level - 1] || enemyImages[0],
            speedFactor: 1.5, // Más rápidos
            waveEnemy: true,
          });
        }
      }, i * 300); // 👈 MÁS ESPACIADO
    }

    playSound("special");

    // 👈 RESETEAR FLAG
    setTimeout(() => {
      waveInProgress = false;
    }, GAME_CONFIG.enemies.waveSize * 300 + 2000);
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
 * Actualiza combo display - SOLO SI EL JUEGO ESTÁ ACTIVO
 */
function updateComboDisplay() {
  // VERIFICACIÓN CRÍTICA: Solo mostrar durante el juego activo
  if (!gameInterval || gameEnded || isLevelTransition) {
    // Si el juego no está corriendo, limpiar display
    if (comboDisplay) {
      clearComboDisplay();
    }
    return;
  }

  const combo = GAME_CONFIG.player.comboCounter;

  // Solo mostrar si el combo es significativo
  if (combo < 3) {
    // Ocultar display si combo es muy bajo
    if (comboDisplay) {
      comboDisplay.style.display = "none";
    }
    return;
  }

  // Crear elemento si no existe
  if (!comboDisplay) {
    comboDisplay = document.createElement("div");
    comboDisplay.id = "combo-display";
    comboDisplay.style.position = "fixed";
    comboDisplay.style.bottom = "80px";
    comboDisplay.style.left = "20px";
    comboDisplay.style.backgroundColor = "rgba(255, 255, 0, 0.9)";
    comboDisplay.style.color = "#000000";
    comboDisplay.style.padding = "8px 15px";
    comboDisplay.style.borderRadius = "15px";
    comboDisplay.style.fontSize = "18px";
    comboDisplay.style.fontWeight = "bold";
    comboDisplay.style.border = "2px solid #FFD700";
    comboDisplay.style.boxShadow = "0 0 15px #FFFF00";
    comboDisplay.style.zIndex = "1000";
    comboDisplay.style.fontFamily = '"Times New Roman", serif';
    comboDisplay.style.textAlign = "center";
    comboDisplay.style.minWidth = "120px";

    document.body.appendChild(comboDisplay);
  }

  // Actualizar contenido
  const multiplier = (1 + combo * 0.1).toFixed(1);
  comboDisplay.textContent = `COMBO x${combo} (${multiplier}x puntos)`;

  // Mostrar elemento
  comboDisplay.style.display = "block";

  // Efecto de pulsación para combo alto
  if (combo >= 10) {
    comboDisplay.style.animation = "pulse 0.5s ease-in-out";
    comboDisplay.style.backgroundColor = "rgba(255, 165, 0, 0.9)";
    comboDisplay.style.border = "2px solid #FF4500";
  } else if (combo >= 5) {
    comboDisplay.style.backgroundColor = "rgba(255, 215, 0, 0.9)";
    comboDisplay.style.border = "2px solid #FFD700";
  }

  // Actualizar tiempo
  lastComboTime = gameTime;
}

/**
 * Sistema de combos - VERSIÓN CORREGIDA
 */
function updateComboSystem() {
  // VERIFICACIÓN: Solo ejecutar durante el juego activo
  if (!gameInterval || gameEnded || isLevelTransition) {
    return;
  }

  if (GAME_CONFIG.player.comboCounter > 0) {
    // Decay del combo si no se elimina enemigo en un tiempo (2 segundos)
    if (gameTime - lastComboTime > 120) {
      GAME_CONFIG.player.comboCounter = Math.max(
        0,
        GAME_CONFIG.player.comboCounter - 1
      );

      // Actualizar display cuando decae
      updateComboDisplay();

      // Si se perdió el combo completamente
      if (GAME_CONFIG.player.comboCounter === 0 && comboDisplay) {
        comboDisplay.textContent = "¡Combo perdido!";
        comboDisplay.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
        comboDisplay.style.color = "#FFFFFF";

        setTimeout(() => {
          clearComboDisplay(); // Limpiar completamente
        }, 1500);
      }

      lastComboTime = gameTime;
    }
  }

  // Actualizar display regularmente solo si el juego está activo
  if (gameTime % 30 === 0) {
    updateComboDisplay();
  }
}

/**
 * Modo adrenalina cuando las vidas están bajas
 */
function checkAdrenalineMode() {
  const lowHealth = playerLives <= 2;

  if (lowHealth && !GAME_CONFIG.player.adrenalineMode) {
    GAME_CONFIG.player.adrenalineMode = true;
    showScreenMessage("¡MODO ADRENALINA!", "#FF0000");

    // Beneficios del modo adrenalina
    AUTO_SHOOT_DELAY = Math.max(30, AUTO_SHOOT_DELAY * 0.7); // Disparo más rápido

    // Efecto visual (pantalla con tinte rojo)
    createScreenEffect("adrenaline");
  } else if (!lowHealth && GAME_CONFIG.player.adrenalineMode) {
    GAME_CONFIG.player.adrenalineMode = false;
    // Restaurar velocidad normal
    updateShootingSpeed();
  }
}

/**
 * Efectos visuales para la pantalla - VERSIÓN ACTUALIZADA PARA TU CSS
 */
function createScreenEffect(type) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "999";

  // Usar las clases CSS que definimos
  switch (type) {
    case "adrenaline":
      overlay.className = "screen-effect-adrenaline";
      break;
    case "slowmo":
      overlay.className = "screen-effect-slowmo";
      break;
    case "doublepoints":
      overlay.className = "screen-effect-doublepoints";
      break;
  }

  document.body.appendChild(overlay);

  // Remover después de un tiempo
  setTimeout(
    () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    },
    type === "adrenaline" ? 10000 : 3000
  );
}

/**
 * Spawns múltiples corazones para mayor recovery
 */
function spawnMultipleHearts() {
  if (Math.random() < GAME_CONFIG.items.multiHeartChance) {
    // Spawnar 2-3 corazones cerca uno del otro
    const baseX = Math.random() * (canvas.width - 200) + 100;
    const heartCount = 2 + Math.floor(Math.random() * 2); // 2-3 corazones

    for (let i = 0; i < heartCount; i++) {
      const heartSize = PLAYER_WIDTH * 0.8;
      hearts.push({
        x: baseX + i * 80 - 40, // Espaciados
        y: -heartSize,
        width: heartSize,
        height: heartSize,
        velocityY: canvas.height * 0.002, // Más lento para ser más fácil de agarrar
        velocityX: (Math.random() - 0.5) * 0.001 * canvas.height,
        multiHeart: true, // Marca especial
      });
    }

    showScreenMessage("¡CORAZONES MÚLTIPLES!", "#FF69B4");
  }
}

/**
 * Power-ups raros más frecuentes
 */
function spawnRarePowerUp() {
  // PROBABILIDAD AUMENTADA significativamente
  if (Math.random() < GAME_CONFIG_UPDATED.items.rarePowerUpChance) {
    const size = PLAYER_WIDTH * 0.8;
    const x = size + Math.random() * (canvas.width - size * 2);
    const y = -size;

    // Power-ups raros (nuevos tipos)
    const rareTypes = [
      { id: 4, color: "#9400D3", name: "Escudo Temporal", duration: 300 },
      { id: 5, color: "#00FF7F", name: "Puntos Dobles", duration: 450 },
      { id: 6, color: "#FF1493", name: "Tiempo Lento", duration: 360 },
      { id: 7, color: "#FFD700", name: "Imán de Items", duration: 600 },
    ];

    const rareType = rareTypes[Math.floor(Math.random() * rareTypes.length)];

    powerUps.push({
      x: x,
      y: y,
      width: size,
      height: size,
      velocityY: canvas.height * 0.002,
      velocityX: 0,
      type: rareType,
      rare: true,
      pulseEffect: 0,
    });

    showScreenMessage("¡POWER-UP RARO!", rareType.color);
    console.log("Power-up raro spawneado!");
  }
}

/**
 * Eventos especiales aleatorios
 */
function checkSpecialEvents() {
  // Lluvia de meteoritos
  if (Math.random() < GAME_CONFIG.special.meteorShowerChance) {
    meteorShower();
  }

  // Slow motion temporal
  if (Math.random() < GAME_CONFIG.special.timeSlowChance) {
    activateSlowMotion();
  }

  // Puntos dobles
  if (Math.random() < GAME_CONFIG.special.doublePointsChance) {
    activateDoublePoints();
  }
}

/**
 * Actualiza y dibuja los corazones de recuperación - VERSIÓN CORREGIDA
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
      // CAMBIO: Siempre recuperar vida, sin límite máximo
      playerLives++;
      updateLivesDisplay(); // Actualizar display que maneja apilamiento
      playSound("heart");

      // Mensaje diferente según cantidad de vidas
      const lifeMessage =
        playerLives > 10
          ? `¡Vida recuperada! ❤️ (${playerLives} vidas)`
          : "¡Vida recuperada! ❤️";

      showScreenMessage(lifeMessage, "#FF0000");

      // Efecto visual al recoger corazón
      createParticleEffect(
        heart.x + heart.width / 2,
        heart.y + heart.height / 2,
        "#FF0000",
        30
      );

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
 * Intenta crear un power-up aleatorio - VERSIÓN MÁS FRECUENTE
 */
function trySpawnPowerUp() {
  // CAMBIO: Permitir múltiples power-ups por nivel
  // Si ya hay 2 power-ups activos, esperar
  if (powerUps.length >= 2) return;

  // PROBABILIDAD AUMENTADA y sin restricción de "uno por nivel"
  if (Math.random() < GAME_CONFIG_UPDATED.items.powerUpSpawnChance) {
    spawnRandomPowerUp();

    // CAMBIO: No marcar powerUpsSpawned = true
    // Esto permite múltiples power-ups por nivel

    console.log("Power-up spawneado - más frecuentes ahora!");
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

/**
 * Intenta crear un corazón de recuperación - VERSIÓN MÁS FRECUENTE
 */
function trySpawnHeart() {
  // CAMBIO: Permitir múltiples corazones por nivel
  // Si ya hay 3 corazones, esperar
  if (hearts.length >= 3) return;

  // PROBABILIDAD AUMENTADA y sin restricción de "uno por nivel"
  if (Math.random() < GAME_CONFIG_UPDATED.items.heartSpawnChance) {
    spawnHeart();

    // CAMBIO: No marcar heartSpawned = true
    // Esto permite múltiples corazones por nivel

    console.log("Corazón spawneado - más frecuentes ahora!");
  }
}

/**
 * Lluvia de meteoritos mejorada
 */
function meteorShower() {
  showScreenMessage("☄️ ¡LLUVIA DE METEORITOS! ☄️", "#FF8800");
  // Crear enemigos con delay más espaciado para mejor performance
  for (let i = 0; i < GAME_CONFIG.special.meteorShowerSize; i++) {
    setTimeout(() => {
      spawnEnemy();
    }, i * 200); // 200ms entre cada meteorito
  }
  playSound("special");
}

// Variables para modo lento
let slowMotionActive = false;
let slowMotionFactor = 1.0;

/**
 * Modo lento mejorado - Más hermoso y frecuente
 */
function activateSlowMotion() {
  if (slowMotionActive) return; // Evitar múltiples activaciones

  slowMotionActive = true;
  slowMotionFactor = 0.3; // 30% de velocidad normal - muy lento

  showScreenMessage("🐢 ¡TIEMPO SÚPER LENTO! 🐢", "#00BBFF");
  createScreenEffect("slowmo");

  // Aplicar efectos visuales especiales
  createSlowMotionParticles();

  // Duración extendida para disfrutar el efecto
  setTimeout(() => {
    slowMotionActive = false;
    slowMotionFactor = 1.0;
    showScreenMessage("⚡ Tiempo normal restaurado ⚡", "#FFFFFF");
  }, GAME_CONFIG.special.timeSlowDuration);
}

/**
 * Crear partículas especiales para el modo lento
 */
function createSlowMotionParticles() {
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      createParticleEffect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        "#00BBFF",
        3
      );
    }, i * 100);
  }
}

/**
 * Puntos dobles temporal
 */
function activateDoublePoints() {
  showScreenMessage("💰 ¡PUNTOS DOBLES! 💰", "#FFD700");
  createScreenEffect("doublepoints");

  setTimeout(() => {
    showScreenMessage("📊 Puntos normales", "#FFFFFF");
  }, 4000);
}

// ======================================================
// ENEMY MANAGEMENT
// ======================================================

/**
 * Spawns a new enemy with random properties
 */
function spawnEnemy() {
  const sizeVariation = 0.8 + Math.random() * 0.4;
  const baseSize =
    ENEMY_MIN_SIZE + Math.random() * (ENEMY_MAX_SIZE - ENEMY_MIN_SIZE);
  const enemySize = baseSize * sizeVariation * Math.max(0.6, 1 - level * 0.05);

  const x = Math.random() * (canvas.width - enemySize);

  const levelSpeedFactor = 1 + level * 0.2;
  const baseSpeed = canvas.height * 0.006 * levelSpeedFactor;

  const angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;

  const speed = baseSpeed * (0.8 + Math.random() * 0.6);
  const velocityX = Math.sin(angle) * speed;
  const velocityY = Math.abs(Math.cos(angle) * speed);

  enemies.push({
    x: x,
    y: -enemySize,
    width: enemySize,
    height: enemySize,
    velocityX: velocityX,
    velocityY: velocityY,
    image: enemyImages[level - 1] || enemyImages[0],
    speedFactor: 1.0,
  });

  // 👈 REEMPLAZAR ESTA PARTE COMPLETA:
  // BUSCA DESDE AQUÍ:
  // if (level > 3 && Math.random() < level * 0.05) {
  // HASTA EL FINAL DE LA FUNCIÓN
  // Y REEMPLÁZALA CON ESTO:

  if (
    level > 3 &&
    !spawnExtraEnemiesFlag &&
    Math.random() < 0.01 &&
    enemies.length < 30
  ) {
    spawnExtraEnemiesFlag = true;

    const extraEnemies = Math.min(2, Math.floor(level / 4)); // Máximo 2 enemigos extra

    for (let i = 0; i < extraEnemies; i++) {
      setTimeout(() => {
        if (gameInterval && enemies.length < 40) {
          // Crear enemigo simple sin efectos secundarios
          const simpleEnemySize =
            ENEMY_MIN_SIZE + Math.random() * (ENEMY_MAX_SIZE - ENEMY_MIN_SIZE);
          const simpleX = Math.random() * (canvas.width - simpleEnemySize);
          const simpleSpeed = canvas.height * 0.005;

          enemies.push({
            x: simpleX,
            y: -simpleEnemySize,
            width: simpleEnemySize,
            height: simpleEnemySize,
            velocityX: (Math.random() - 0.5) * simpleSpeed,
            velocityY: simpleSpeed,
            image: enemyImages[level - 1] || enemyImages[0],
            speedFactor: 1.0,
          });
        }
      }, i * 400);
    }

    setTimeout(() => {
      spawnExtraEnemiesFlag = false;
    }, 3000);
  }
}

let maxEnemiesOnScreen = 150; // Límite de enemigos simultáneos

function optimizedSpawnEnemy() {
  // No spawnar si hay demasiados enemigos en pantalla
  if (enemies.length >= maxEnemiesOnScreen) {
    return;
  }

  // Ajustar límite basado en el nivel
  if (level >= 15) {
    maxEnemiesOnScreen = 120; // Reducir en niveles altos
  } else if (level >= 10) {
    maxEnemiesOnScreen = 135;
  }

  // Llamar a la función normal de spawn
  spawnEnemy();
}

/**
 * Updates enemy positions and handles collision with walls and other enemies
 * VERSIÓN MEJORADA CON MODO LENTO
 */
function updateEnemies() {
  const wallBounceFactorX = 0.9; // Rebote con paredes laterales
  const wallBounceFactorY = 1.05; // Rebote con techo/suelo - aumenta velocidad
  const enemyBounceFactorBase = 1.1; // Base para rebote entre enemigos - aumenta velocidad

  // Aplicar factor de tiempo lento
  const currentSlowFactor = slowMotionActive ? slowMotionFactor : 1.0;

  // Update each enemy's position
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];

    // Move enemy CON VELOCIDAD AJUSTADA POR MODO LENTO
    enemy.x += enemy.velocityX * currentSlowFactor;
    enemy.y += enemy.velocityY * currentSlowFactor;

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
    let hitBySpecialBullet = false; // 👈 LÍNEA NUEVA

    // Check against regular bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      const bullet = bullets[j];

      if (checkCollisionBetweenObjects(bullet, enemy)) {
        enemyHit = true;

        if (bullet.explosive) {
          explosionSource = {
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
          };
        }

        if (bullet.penetrating) {
          bullet.penetrationCount--;
          if (bullet.penetrationCount <= 0) {
            bullets.splice(j, 1);
          }
        } else {
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
          enemyHit = true;
          hitBySpecialBullet = true; // 👈 LÍNEA NUEVA - MARCAR QUE FUE BALA ESPECIAL

          explosionSource = {
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
          };
          break;
        }
      }
    }

    // Process enemy hit
    if (enemyHit) {
      enemies.splice(i, 1);
      enemiesKilled++;
      if (!hitBySpecialBullet) {
        enemiesForSpecialPower++;
      }

      //   👈 INCREMENTAR COMBO Y ACTUALIZAR DISPLAY
      GAME_CONFIG.player.comboCounter++;
      lastComboTime = gameTime; // Resetear tiempo de combo
      updateComboDisplay(); // Actualizar display inmediatamente

      let basePoints = 10 * level;
      let comboMultiplier = 1 + GAME_CONFIG.player.comboCounter * 0.1;
      let finalPoints = Math.floor(basePoints * comboMultiplier);

      if (GAME_CONFIG.player.adrenalineMode) {
        finalPoints *= 1.5;
      }

      score += finalPoints;

      // 👈 CAMBIO IMPORTANTE: Solo verificar poder especial si NO fue bala especial
      if (
        !hitBySpecialBullet &&
        enemiesForSpecialPower >= ENEMIES_FOR_SPECIAL
      ) {
        specialPowerReady = true;
        enemiesForSpecialPower = ENEMIES_FOR_SPECIAL;
      }

      document.getElementById(
        "enemies-killed"
      ).textContent = `Enemigos: ${enemiesKilled}`;
      document.getElementById("score").textContent = `Puntuación: ${score}`;
      updateSpecialPowerIndicator();

      playSound("hit");

      if (explosionSource) {
        createExplosionEffect(explosionSource.x, explosionSource.y);

        for (let k = enemies.length - 1; k >= 0; k--) {
          const nearbyEnemy = enemies[k];
          const centerX = nearbyEnemy.x + nearbyEnemy.width / 2;
          const centerY = nearbyEnemy.y + nearbyEnemy.height / 2;

          const dx = centerX - explosionSource.x;
          const dy = centerY - explosionSource.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < EXPLOSION_RADIUS) {
            enemies.splice(k, 1);
            enemiesKilled++;

            // 👈 CAMBIO: Explosiones tampoco cuentan para poder especial
            // enemiesForSpecialPower++; // QUITAR ESTA LÍNEA

            score += 5 * level;

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

      if (enemiesKilled >= levelUpEnemies[level - 1]) {
        level++;

        if (level > levelUpEnemies.length) {
          console.log("¡Todos los niveles completados!");
          victory();
        } else {
          console.log(`Avanzando al nivel ${level}`);
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
 * Game Loop actualizado con todas las correcciones
 */
function gameLoop() {
  try {
    // VERIFICACIÓN: Si el juego terminó, limpiar todo y salir
    if (gameEnded) {
      console.log("Juego terminado, limpiando y deteniendo game loop");
      clearComboDisplay(); // Limpiar combo display
      clearInterval(gameInterval);
      gameInterval = null;
      return;
    }

    // Skip update during level transition
    if (isLevelTransition) return;

    // Update game time
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
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // MECÁNICAS MEJORADAS con nuevas frecuencias
    trySpawnWave();
    updateComboSystem(); // Ahora con verificación de juego activo
    checkAdrenalineMode();
    checkSpecialEvents();

    // Items más frecuentes
    trySpawnHeart(); // Ahora más frecuente y sin límite por nivel
    trySpawnPowerUp(); // Ahora más frecuente y sin límite por nivel

    // Power-ups raros más frecuentes
    if (Math.random() < 0.002) {
      // Aumentado de 0.001
      spawnRarePowerUp();
    }

    // Spawn enemies
    spawnTimer++;
    const spawnDelay = Math.max(
      GAME_CONFIG.enemies.minSpawnRate,
      GAME_CONFIG.enemies.spawnRateBase -
        level * GAME_CONFIG.enemies.spawnRateReduction
    );

    if (spawnTimer >= spawnDelay) {
      spawnEnemy();

      if (level > GAME_CONFIG.enemies.extraEnemiesThreshold) {
        const extraEnemyChance = Math.min(
          GAME_CONFIG.enemies.extraEnemyChancePerLevel * level,
          GAME_CONFIG.enemies.maxExtraEnemyChance
        );
        if (Math.random() < extraEnemyChance) {
          spawnEnemy();
        }
      }

      spawnTimer = 0;
    }

    // Update game elements
    updateInvulnerability();
    updateEnemies();
    updateBullets();
    updateHearts(); // Ahora permite vidas ilimitadas con apilamiento
    updatePowerUps();
    drawPlayer();

    // Check collisions
    checkBulletEnemyCollisions();
    checkPlayerEnemyCollisions();

    // Draw UI overlays
    drawGameInfo();
  } catch (error) {
    console.error("Error in game loop:", error);

    if (!gameInterval && !gameEnded) {
      gameInterval = setInterval(gameLoop, 1000 / 60);
    }
  }
}

console.log("✅ Hell Shooter - Todas las correcciones aplicadas:");
console.log("1. ❤️ Vidas se apilan verticalmente después de 7");
console.log("2. ⚡ Power-ups 2.5x más frecuentes");
console.log("3. 🎯 Combo display solo durante el juego activo");

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
 * Game Over - VERSIÓN CORREGIDA
 */
function gameOver() {
  // Marcar juego como terminado PRIMERO
  gameEnded = true;

  clearInterval(gameInterval);
  gameInterval = null;

  stopAutoShoot();
  stopBackgroundMusic();

  // LIMPIAR COMBO DISPLAY INMEDIATAMENTE
  clearComboDisplay();

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

  console.log("Game Over - combo display limpiado");
}

/**
 * Restart Game - VERSIÓN CORREGIDA
 */
function restartGame() {
  // LIMPIAR COMBO DISPLAY ANTES DE REINICIAR
  clearComboDisplay();

  // Resetear variables de control
  gameEnded = false;
  scoreAlreadySaved = false;
  isSaving = false;

  // Ocultar pantalla de game over
  document.getElementById("game-over").style.display = "none";

  // Iniciar nuevo juego
  startGame();

  console.log("Juego reiniciado - combo display limpiado");
}

/**
 * Saves score and shows ranking - VERSIÓN CORREGIDA PARA EVITAR GUARDADO MÚLTIPLE
 */
async function saveAndViewRanking() {
  // Verificar si ya se guardó o se está guardando
  if (scoreAlreadySaved) {
    alert("⚠️ La puntuación ya fue guardada anteriormente.");
    viewRanking(); // Solo mostrar el ranking
    document.getElementById("game-over").style.display = "none";
    return;
  }

  if (isSaving) {
    alert("⏳ Ya se está guardando la puntuación. Por favor espera...");
    return;
  }

  // Marcar que se está guardando
  isSaving = true;

  try {
    const saveResult = await saveScore();

    if (saveResult) {
      // Marcar como guardado exitosamente
      scoreAlreadySaved = true;

      // Cambiar el texto del botón para indicar que ya se guardó
      const saveButton = document.querySelector("#game-over button");
      if (saveButton && saveButton.textContent.includes("Guardar")) {
        saveButton.textContent = "✅ Ya Guardado - Ver Ranking";
        saveButton.onclick = () => {
          viewRanking();
          document.getElementById("game-over").style.display = "none";
        };
      }
    }

    // Mostrar ranking
    viewRanking();
    document.getElementById("game-over").style.display = "none";
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("❌ Error al guardar la puntuación. Inténtalo de nuevo.");
  } finally {
    // Permitir intentos futuros si falló
    isSaving = false;
  }
}

// URL de tu Web App (CAMBIAR POR LA QUE COPIASTE)
const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycby4EeSEWs_IYpIDC1dQCGGuWemC7U8O6yhgaACcxnqxIqXc4wFvclHjkiOyqbj9FwOG/exec";

/**
 * Guarda la puntuación usando el formato EXACTO de tu Excel (8 columnas)
 */
async function saveScore() {
  console.log("🚀 Guardando puntuación...");

  try {
    // Validar datos antes de enviar
    if (!playerName || !playerAvatar) {
      throw new Error("Datos del jugador incompletos");
    }

    // Crear URL con parámetros
    const params = new URLSearchParams();
    params.append("action", "save");
    params.append("date", new Date().toISOString());
    params.append("avatar", playerAvatar);
    params.append("name", playerName);
    params.append("level", level);
    params.append("enemiesKilled", enemiesKilled);
    params.append("time", Math.floor(gameTime / 60));
    params.append("score", score);
    params.append(
      "status",
      document.getElementById("game-over-text").textContent.includes("Victoria")
        ? "Victoria"
        : "Derrota"
    );

    const urlWithParams = `${WEBAPP_URL}?${params.toString()}`;
    console.log("📡 Enviando a:", urlWithParams);

    // Timeout para la petición
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

    const response = await fetch(urlWithParams, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (result.success) {
      console.log("✅ Guardado exitoso");
      alert("¡Puntuación guardada con éxito! 🎉");
      return true;
    } else {
      throw new Error(result.message || "Error desconocido del servidor");
    }
  } catch (error) {
    console.error("❌ Error:", error);

    if (error.name === "AbortError") {
      alert("⏰ Tiempo de espera agotado. Verifica tu conexión a internet.");
    } else {
      alert("❌ Error al guardar: " + error.message);
    }

    return false;
  }
}

/**
 * Victory - VERSIÓN CORREGIDA
 */
function victory() {
  // Detener completamente el juego
  gameEnded = true;

  clearInterval(gameInterval);
  gameInterval = null;

  stopAutoShoot();
  stopBackgroundMusic();

  // LIMPIAR COMBO DISPLAY INMEDIATAMENTE
  clearComboDisplay();

  // Mostrar pantalla de victoria
  document.getElementById("game-over").style.display = "block";
  document.getElementById("game-over-text").textContent = "¡Victoria! 🎉";
  playSound("victory");

  // Efecto visual de celebración
  celebrationEffect();

  console.log("Victory - combo display limpiado");
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
 * Limpia el combo display completamente
 */
function clearComboDisplay() {
  if (comboDisplay && comboDisplay.parentNode) {
    comboDisplay.parentNode.removeChild(comboDisplay);
    comboDisplay = null;
  }

  // Resetear variables de combo
  GAME_CONFIG.player.comboCounter = 0;
  lastComboTime = 0;

  console.log("Combo display limpiado");
}

/**
 * Back to Menu - VERSIÓN CORREGIDA
 */
function backToMenu() {
  // LIMPIAR COMBO DISPLAY ANTES DE VOLVER AL MENÚ
  clearComboDisplay();

  document.getElementById("ranking-container").style.display = "none";
  document.getElementById("game-area").style.display = "none"; // Asegurar que game-area se oculte
  document.getElementById("main-menu").style.display = "block";
  centerMainMenu();

  console.log("Volviendo al menú - combo display limpiado");
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
 * Limpia completamente el estado del juego - VERSIÓN CORREGIDA
 */
function resetGameState() {
  // Detener todos los intervalos
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  if (autoShootInterval) {
    clearInterval(autoShootInterval);
    autoShootInterval = null;
  }

  // Resetear variables de control
  gameEnded = false;
  scoreAlreadySaved = false;
  isSaving = false;

  // Resetear arrays de juego
  bullets = [];
  enemies = [];
  specialBullets = [];
  hearts = [];
  powerUps = [];

  // Resetear estados
  specialPowerActive = false;
  specialPowerReady = false;
  activePowerUp = null;
  powerUpTimeLeft = 0;

  // Resetear variables del juego
  invulnerableTime = 0;
  isLevelTransition = false;

  // CAMBIO CRÍTICO: Limpiar combo display inmediatamente
  clearComboDisplay();

  console.log(
    "Estado del juego completamente limpiado - incluyendo combo display"
  );
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
