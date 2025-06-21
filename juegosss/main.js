/**
 * Hell Shooter - Main Game File CORREGIDO
 * Versión limpia sin duplicados y con funcionalidad restaurada
 */

// ======================================================
// VARIABLES GLOBALES PRINCIPALES
// ======================================================

let canvas, ctx;
let gameInterval;
let gameTime = 0;
let level = 1;
let score = 0;
let gameEnded = false;
let gamePaused = false;
let pausedByVisibility = false;
let gameWasPausedBeforeHiding = false;

// Contador total de TODOS los enemigos eliminados
let totalEnemiesKilled = 0;

// Variables para efectos especiales globales
let slowMotionActive = false;
let slowMotionFactor = 1.0;
let frenzyModeActive = false;

// Variables de control de guardado
let scoreAlreadySaved = false;
let isSaving = false;

// URL de Google Sheets
const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbyISC1HgWsjGaNoCubjC8xEtABygGw9m24NLnz2ZwyM4pdeQBhuIF-cHRTQtQeYDWpTOA/exec";

// Variable global para música
window.currentMusicTrack = "Elegía - Azkal";

// ======================================================
// INICIALIZACIÓN DEL JUEGO
// ======================================================

window.onload = function () {
  console.log("🎮 Hell Shooter - Iniciando juego...");

  // Verificar dependencias críticas
  if (typeof GameConfig === "undefined") {
    console.error("❌ GameConfig no está cargado");
    return;
  }

  GameConfig.detectDevice();
  setupCanvas();

  // Verificar e inicializar módulos si existen
  if (typeof AudioManager !== "undefined") AudioManager.init();
  if (typeof UI !== "undefined") UI.init();
  if (typeof ComboSystem !== "undefined") ComboSystem.init();

  loadGameAssets();
  setupEventListeners();
  setupGamePauseSystem();

  console.log("✅ Juego inicializado correctamente");
};

/**
 * Configurar el canvas
 */
function setupCanvas() {
  canvas = document.getElementById("game-canvas");
  if (!canvas) {
    console.error("❌ Canvas no encontrado");
    return;
  }

  ctx = canvas.getContext("2d");

  // Resolución completa
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";

  GameConfig.updateSizes(canvas);
  console.log(`📱 Canvas configurado: ${canvas.width}x${canvas.height}`);
}

/**
 * Cargar recursos del juego
 */
function loadGameAssets() {
  fetch("assets.json")
    .then((response) => response.json())
    .then((data) => {
      // Cargar imágenes de fondo
      GameConfig.backgroundImages = data.backgrounds.map((src) => {
        const img = new Image();
        img.src = src;
        return img;
      });

      // Cargar imágenes de enemigos
      GameConfig.enemyImages = data.enemies.map((src) => {
        const img = new Image();
        img.src = src;
        return img;
      });

      // Cargar imagen del boss
      if (data.boss) {
        GameConfig.bossImage = new Image();
        GameConfig.bossImage.src = data.boss;
      }

      // Cargar frames del boss para animación
      if (data.bossFrames) {
        GameConfig.bossFrames = data.bossFrames.map((src) => {
          const img = new Image();
          img.src = src;
          return img;
        });
      }

      // Cargar imagen del jugador
      GameConfig.playerImage = new Image();
      GameConfig.playerImage.src = data.player;

      // Cargar imagen de bala
      GameConfig.bulletImage = new Image();
      GameConfig.bulletImage.src = data.bullet;

      console.log("✅ Recursos cargados exitosamente");
    })
    .catch((error) => {
      console.error("❌ Error cargando recursos:", error);
      createFallbackImages();
    });
}

/**
 * Crear imágenes de respaldo
 */
function createFallbackImages() {
  // Imagen del jugador
  const playerCanvas = document.createElement("canvas");
  playerCanvas.width = 80;
  playerCanvas.height = 80;
  const playerCtx = playerCanvas.getContext("2d");
  playerCtx.fillStyle = "#FF0000";
  playerCtx.fillRect(0, 0, 80, 80);
  GameConfig.playerImage = new Image();
  GameConfig.playerImage.src = playerCanvas.toDataURL();

  // Imagen de bala
  const bulletCanvas = document.createElement("canvas");
  bulletCanvas.width = 20;
  bulletCanvas.height = 40;
  const bulletCtx = bulletCanvas.getContext("2d");
  bulletCtx.fillStyle = "#FFFFFF";
  bulletCtx.fillRect(0, 0, 20, 40);
  GameConfig.bulletImage = new Image();
  GameConfig.bulletImage.src = bulletCanvas.toDataURL();

  // Imagen del boss
  const bossCanvas = document.createElement("canvas");
  bossCanvas.width = 120;
  bossCanvas.height = 120;
  const bossCtx = bossCanvas.getContext("2d");
  bossCtx.fillStyle = "#8B0000";
  bossCtx.fillRect(0, 0, 120, 120);
  GameConfig.bossImage = new Image();
  GameConfig.bossImage.src = bossCanvas.toDataURL();

  // Crear imágenes de enemigos de respaldo
  GameConfig.enemyImages = [];
  for (let i = 0; i < 5; i++) {
    const enemyCanvas = document.createElement("canvas");
    enemyCanvas.width = 60;
    enemyCanvas.height = 60;
    const enemyCtx = enemyCanvas.getContext("2d");
    enemyCtx.fillStyle = `hsl(${i * 60}, 70%, 50%)`;
    enemyCtx.fillRect(0, 0, 60, 60);
    const enemyImg = new Image();
    enemyImg.src = enemyCanvas.toDataURL();
    GameConfig.enemyImages.push(enemyImg);
  }

  console.log("🔄 Imágenes de respaldo creadas");
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
  window.addEventListener("resize", setupCanvas);
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("beforeunload", cleanupGame);

  // Botones del menú
  const emojiButton = document.getElementById("emoji-button");
  if (emojiButton && typeof UI !== "undefined" && UI.openEmojiPicker) {
    emojiButton.addEventListener("click", UI.openEmojiPicker);
  }
}

/**
 * 🔥 SISTEMA DE PAUSA MEJORADO - FUNCIONA CON ALT+TAB
 */
function setupGamePauseSystem() {
  console.log("⏸️ Configurando sistema de pausa MEJORADO (ALT+TAB compatible)");

  // Variables de control más específicas
  let wasPlayingMusic = false;
  let wasAutoShooting = false;
  let pauseTimeStart = 0;
  let lastActivityTime = Date.now();
  let activityCheckInterval;
  let recoveryCheckInterval;

  // 🔥 FUNCIÓN DE PAUSA INMEDIATA Y FORZADA
  const forceGamePause = (reason = "desconocido") => {
    if (gameEnded) return;

    console.log(`⏸️ PAUSANDO JUEGO - Razón: ${reason}`);

    // Guardar estados ANTES de pausar
    wasPlayingMusic =
      typeof AudioManager !== "undefined" &&
      AudioManager.isBackgroundMusicPlaying &&
      AudioManager.isBackgroundMusicPlaying();

    wasAutoShooting =
      (typeof BulletManager !== "undefined" &&
        BulletManager.isAutoShooting &&
        BulletManager.isAutoShooting()) ||
      (typeof BulletManager !== "undefined" &&
        BulletManager.autoShootInterval !== null);

    // Marcar tiempo de pausa
    pauseTimeStart = Date.now();
    gameWasPausedBeforeHiding = gamePaused;
    gamePaused = true;
    pausedByVisibility = true;

    // DETENER auto-disparo INMEDIATAMENTE
    if (typeof BulletManager !== "undefined" && BulletManager.stopAutoShoot) {
      BulletManager.stopAutoShoot();
    }

    // PARAR música INMEDIATAMENTE
    if (
      wasPlayingMusic &&
      typeof AudioManager !== "undefined" &&
      AudioManager.stopBackgroundMusic
    ) {
      AudioManager.stopBackgroundMusic();
    }

    // Mostrar mensaje de pausa
    if (typeof UI !== "undefined" && UI.showScreenMessage) {
      UI.showScreenMessage("⏸️ JUEGO PAUSADO", "#FFFF00");
    }

    console.log("⏸️ Estados guardados:", { wasPlayingMusic, wasAutoShooting });
  };

  // 🔥 FUNCIÓN DE REANUDACIÓN MEJORADA
  const resumeGame = (reason = "desconocido") => {
    if (gameEnded || !pausedByVisibility) return;

    console.log(`▶️ REANUDANDO JUEGO - Razón: ${reason}`);

    // Calcular tiempo pausado
    const pauseDuration = Date.now() - pauseTimeStart;
    console.log(`⏱️ Tiempo pausado: ${pauseDuration}ms`);

    // Restaurar estado de pausa anterior
    gamePaused = gameWasPausedBeforeHiding;
    pausedByVisibility = false;
    lastActivityTime = Date.now();

    // REANUDAR auto-disparo si estaba activo
    if (
      wasAutoShooting &&
      !gameEnded &&
      typeof BulletManager !== "undefined" &&
      BulletManager.startAutoShoot
    ) {
      BulletManager.startAutoShoot();
      console.log("▶️ Auto-disparo REANUDADO");
    }

    // REANUDAR música si estaba sonando
    if (
      wasPlayingMusic &&
      !gameEnded &&
      typeof AudioManager !== "undefined" &&
      AudioManager.startBackgroundMusic
    ) {
      AudioManager.startBackgroundMusic();
      console.log("▶️ Música REANUDADA");
    }

    // Mensaje de reanudación
    if (typeof UI !== "undefined" && UI.showScreenMessage) {
      UI.showScreenMessage("▶️ JUEGO REANUDADO", "#00FF00");
    }

    // Reset de variables
    wasPlayingMusic = false;
    wasAutoShooting = false;
    pauseTimeStart = 0;
  };

  // 🔥 MÚLTIPLES DETECTORES DE PÉRDIDA DE FOCO

  // 1. Detector de visibilidad (pestañas del navegador)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      console.log("👁️ Pestaña OCULTA (cambio de pestaña)");
      forceGamePause("cambio de pestaña");
    } else {
      console.log("👁️ Pestaña VISIBLE (regreso a pestaña)");
      // Delay corto para confirmar
      setTimeout(() => {
        if (!document.hidden) {
          resumeGame("regreso a pestaña");
        }
      }, 100);
    }
  });

  // 2. Detector de foco de ventana (ALT+TAB y clics fuera)
  window.addEventListener("blur", () => {
    console.log("🔍 Ventana perdió FOCO (ALT+TAB o clic fuera)");
    forceGamePause("pérdida de foco");
  });

  window.addEventListener("focus", () => {
    console.log("🔍 Ventana ganó FOCO (regreso con ALT+TAB o clic)");
    // Delay para confirmar estabilidad
    setTimeout(() => {
      // Verificar que realmente tenemos foco Y la pestaña es visible
      if (!document.hidden && (!document.hasFocus || document.hasFocus())) {
        resumeGame("ganancia de foco");
      }
    }, 150);
  });

  // 3. Detector de foco del documento
  document.addEventListener("focusin", () => {
    lastActivityTime = Date.now();
    if (pausedByVisibility && !document.hidden) {
      console.log("📋 Documento ganó foco");
      setTimeout(() => {
        if (!document.hidden) {
          resumeGame("foco en documento");
        }
      }, 100);
    }
  });

  document.addEventListener("focusout", () => {
    console.log("📋 Documento perdió foco");
    setTimeout(() => {
      // Solo pausar si realmente no tenemos foco
      if (document.hasFocus && !document.hasFocus()) {
        forceGamePause("pérdida de foco de documento");
      }
    }, 100);
  });

  // 4. 🔥 DETECTOR DE ACTIVIDAD CON MOUSE/TECLADO (backup)
  const resetActivity = () => {
    lastActivityTime = Date.now();
  };

  // Escuchar actividad del usuario
  ["mousedown", "mousemove", "keydown", "scroll", "touchstart"].forEach(
    (event) => {
      document.addEventListener(event, resetActivity, true);
    }
  );

  // Verificar inactividad cada segundo
  activityCheckInterval = setInterval(() => {
    if (gameEnded) {
      clearInterval(activityCheckInterval);
      return;
    }

    const timeSinceActivity = Date.now() - lastActivityTime;

    // Si no hay actividad por más de 3 segundos Y el juego no está pausado
    if (timeSinceActivity > 3000 && !pausedByVisibility) {
      // Verificar si realmente perdimos el foco
      if (document.hidden || (document.hasFocus && !document.hasFocus())) {
        console.log("⏱️ Inactividad detectada - pausando");
        forceGamePause("inactividad prolongada");
      }
    }
  }, 1000);

  // 5. 🔥 SISTEMA DE RECUPERACIÓN AUTOMÁTICA
  const startRecoverySystem = () => {
    recoveryCheckInterval = setInterval(() => {
      if (gameEnded) {
        clearInterval(recoveryCheckInterval);
        return;
      }

      // Si el juego está pausado por visibilidad pero la ventana está activa
      if (
        pausedByVisibility &&
        !document.hidden &&
        (!document.hasFocus || document.hasFocus())
      ) {
        console.log("🔄 Sistema de recuperación: detectando ventana activa");
        resumeGame("recuperación automática");
      }
    }, 500);
  };

  startRecoverySystem();

  // 6. Limpiar intervals al cerrar
  window.addEventListener("beforeunload", () => {
    if (activityCheckInterval) clearInterval(activityCheckInterval);
    if (recoveryCheckInterval) clearInterval(recoveryCheckInterval);
  });

  console.log("✅ Sistema de pausa MEJORADO configurado (multiple detectores)");
}

/**
 * Iniciar el juego
 */
function startGame() {
  const playerName = document.getElementById("name")?.value;
  const playerAvatar = document.getElementById("avatar")?.value;

  // Validación
  if (!playerName || !playerAvatar || playerName.length < 3) {
    alert(
      "Por favor:\n• Ingresa un nombre (mínimo 3 caracteres)\n• Selecciona un avatar de la lista"
    );
    return;
  }

  if (playerAvatar.trim() === "" || playerAvatar === "Obligatorio") {
    alert("¡Debes seleccionar un emoji de la lista!");
    return;
  }

  // Reiniciar estado
  resetGameState();

  // Configurar jugador
  if (typeof Player !== "undefined") {
    Player.init(playerName, playerAvatar);
    Player.setupControls(canvas);
  } else {
    console.error("❌ Módulo Player no está cargado");
    return;
  }

  // Mostrar área de juego
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("game-area").style.display = "block";

  // Iniciar juego
  startGameLoop();

  console.log("🚀 Juego iniciado");
}

/**
 * Iniciar el bucle principal del juego
 */
function startGameLoop() {
  gameEnded = false;

  // Iniciar auto-disparo
  if (typeof BulletManager !== "undefined" && BulletManager.startAutoShoot) {
    BulletManager.startAutoShoot();
  }

  // Iniciar música
  if (
    typeof AudioManager !== "undefined" &&
    AudioManager.startBackgroundMusic
  ) {
    if (
      !AudioManager.isBackgroundMusicPlaying ||
      !AudioManager.isBackgroundMusicPlaying()
    ) {
      AudioManager.startBackgroundMusic();
    }
  }

  // Crear ticker de música
  if (typeof UI !== "undefined" && UI.createMusicTicker) {
    setTimeout(() => {
      UI.createMusicTicker();
    }, 500);
  }

  // Iniciar bucle de juego
  gameInterval = setInterval(gameLoop, 1000 / 60);

  // Iniciar primer nivel
  startLevel();

  // Mostrar contador de enemigos
  const totalDisplay = document.getElementById("total-enemies-display");
  if (totalDisplay) {
    totalDisplay.style.display = "block";
  }

  console.log("🔄 Bucle de juego iniciado");
}

/**
 * 🔥 FUNCIÓN AUXILIAR PARA VERIFICAR SI EL JUEGO DEBERÍA ESTAR PAUSADO
 */
function shouldGameBePaused() {
  // Verificaciones múltiples para determinar si pausar
  const documentHidden = document.hidden;
  const windowBlurred = document.hasFocus ? !document.hasFocus() : false;
  const visibilityPaused = pausedByVisibility;

  return documentHidden || windowBlurred || visibilityPaused;
}

/**
 * Bucle principal del juego - CON VERIFICACIÓN MEJORADA DE PAUSA
 */
function gameLoop() {
  // 🔥 VERIFICACIÓN MEJORADA DE PAUSA
  if (gameEnded) return;
  if (gamePaused) return;
  if (pausedByVisibility) return;
  if (document.hidden) return;

  // Verificación adicional de foco
  if (document.hasFocus && !document.hasFocus()) {
    console.log("⚠️ Juego sin foco detectado en loop - pausando");
    return;
  }

  try {
    gameTime++;

    // Actualizar sistemas
    if (
      typeof ComboSystem !== "undefined" &&
      ComboSystem.update &&
      gameTime % 3 === 0
    ) {
      ComboSystem.update();
    }

    // Verificar eventos basados en vida
    if (gameTime % 60 === 0) {
      checkLifeBasedEvents();
    }

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    // Actualizar entidades del juego
    if (typeof Player !== "undefined" && Player.update) {
      Player.update();
    }

    if (typeof BulletManager !== "undefined" && BulletManager.update) {
      BulletManager.update();
    }

    // Actualizar enemigos (solo en niveles 1-10)
    if (
      level <= 10 &&
      typeof EnemyManager !== "undefined" &&
      EnemyManager.update
    ) {
      EnemyManager.update();
    } else if (
      level === 11 &&
      typeof EnemyManager !== "undefined" &&
      EnemyManager.enemies &&
      EnemyManager.enemies.length > 0
    ) {
      EnemyManager.update();
    }

    if (typeof PowerUpManager !== "undefined" && PowerUpManager.update) {
      PowerUpManager.update();
    }

    // Boss en nivel 11
    if (
      level === 11 &&
      typeof BossManager !== "undefined" &&
      BossManager.update
    ) {
      BossManager.update();
    }

    // Verificar colisiones
    checkCollisions();

    // Verificar muerte del jugador
    if (
      typeof Player !== "undefined" &&
      Player.getLives &&
      Player.getLives() <= 0 &&
      !gameEnded
    ) {
      gameOver();
      return;
    }

    // Verificar nivel completo
    if (
      level <= 10 &&
      typeof EnemyManager !== "undefined" &&
      EnemyManager.isLevelComplete &&
      EnemyManager.isLevelComplete()
    ) {
      nextLevel();
    }

    // Dibujar elementos
    if (typeof Player !== "undefined" && Player.draw) {
      Player.draw(ctx);
    }

    if (typeof BulletManager !== "undefined" && BulletManager.draw) {
      BulletManager.draw(ctx);
    }

    // Dibujar enemigos
    if (
      level <= 10 &&
      typeof EnemyManager !== "undefined" &&
      EnemyManager.draw
    ) {
      EnemyManager.draw(ctx);
    } else if (
      level === 11 &&
      typeof EnemyManager !== "undefined" &&
      EnemyManager.enemies &&
      EnemyManager.enemies.length > 0 &&
      EnemyManager.draw
    ) {
      EnemyManager.draw(ctx);
    }

    if (typeof PowerUpManager !== "undefined" && PowerUpManager.draw) {
      PowerUpManager.draw(ctx);
    }

    if (
      level === 11 &&
      typeof BossManager !== "undefined" &&
      BossManager.draw
    ) {
      BossManager.draw(ctx);
    }

    drawSpecialEffects(ctx);

    if (typeof UI !== "undefined" && UI.update) {
      UI.update();
    }
  } catch (error) {
    console.error("❌ Error en game loop:", error);
  }
}

/**
 * Verificar colisiones
 */
function checkCollisions() {
  if (
    typeof Player === "undefined" ||
    !Player.getLives ||
    Player.getLives() <= 0
  ) {
    return;
  }

  // Balas vs Enemigos (niveles 1-10)
  if (
    level <= 10 &&
    typeof BulletManager !== "undefined" &&
    typeof EnemyManager !== "undefined"
  ) {
    if (BulletManager.checkEnemyCollisions && EnemyManager.enemies) {
      BulletManager.checkEnemyCollisions(EnemyManager.enemies);
    }
  }

  // Jugador vs Enemigos (niveles 1-10)
  if (
    level <= 10 &&
    typeof Player !== "undefined" &&
    typeof EnemyManager !== "undefined"
  ) {
    if (Player.checkEnemyCollisions && EnemyManager.enemies) {
      if (Player.checkEnemyCollisions(EnemyManager.enemies)) {
        if (Player.getLives() <= 0) {
          gameOver();
          return;
        }
      }
    }
  }

  // Jugador vs Power-ups
  if (typeof Player !== "undefined" && typeof PowerUpManager !== "undefined") {
    if (Player.checkPowerUpCollisions && PowerUpManager.powerUps) {
      Player.checkPowerUpCollisions(PowerUpManager.powerUps);
    }
  }

  // Jugador vs Hearts (excepto nivel 11)
  if (
    level < 11 &&
    typeof Player !== "undefined" &&
    typeof PowerUpManager !== "undefined"
  ) {
    if (Player.checkHeartCollisions && PowerUpManager.hearts) {
      Player.checkHeartCollisions(PowerUpManager.hearts);
    }
  }

  // Colisiones del boss (nivel 11)
  if (
    level === 11 &&
    typeof BossManager !== "undefined" &&
    BossManager.isActive &&
    BossManager.isActive()
  ) {
    // Balas vs Boss
    if (
      typeof BulletManager !== "undefined" &&
      BulletManager.checkBossCollisions
    ) {
      BulletManager.checkBossCollisions();
    }

    // Jugador vs Boss
    if (typeof Player !== "undefined" && Player.checkBossCollisions) {
      if (Player.checkBossCollisions()) {
        if (Player.getLives() <= 0) {
          gameOver();
          return;
        }
      }
    }

    // Otras colisiones del boss...
  }
}

/**
 * Sistema de eventos basados en vida
 */
function checkLifeBasedEvents() {
  if (typeof Player === "undefined" || !Player.getLives) return;

  const playerLives = Player.getLives();

  if (slowMotionActive || frenzyModeActive) {
    return;
  }

  // Lluvia de power-ups (1 vida)
  if (playerLives === 1 && Math.random() < 0.01) {
    triggerPowerUpRain();
  }
  // Modo frenesí (2 vidas o menos)
  else if (playerLives <= 2 && Math.random() < 0.005) {
    triggerFrenzyMode();
  }
  // Tiempo lento (5 vidas o menos)
  else if (playerLives <= 5 && Math.random() < 0.003) {
    triggerSlowMotion();
  }
}

function triggerPowerUpRain() {
  if (typeof UI !== "undefined" && UI.showScreenMessage) {
    UI.showScreenMessage("🌟 ¡LLUVIA DE EMERGENCIA! 🌟", "#FFD700");
  }

  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      if (
        typeof PowerUpManager !== "undefined" &&
        PowerUpManager.forceSpawnPowerUp
      ) {
        PowerUpManager.forceSpawnPowerUp();
      }
    }, i * 400);
  }

  if (typeof AudioManager !== "undefined" && AudioManager.playSound) {
    AudioManager.playSound("special");
  }
}

function triggerFrenzyMode() {
  if (frenzyModeActive) return;

  if (typeof UI !== "undefined" && UI.showScreenMessage) {
    UI.showScreenMessage("⚡ ¡MODO FRENESÍ DE EMERGENCIA! ⚡", "#FF00FF");
  }

  frenzyModeActive = true;

  if (typeof BulletManager !== "undefined") {
    if (BulletManager.stopAutoShoot) BulletManager.stopAutoShoot();

    const frenzyInterval = setInterval(() => {
      if (BulletManager.shootBullet) BulletManager.shootBullet();
    }, 35);

    setTimeout(() => {
      clearInterval(frenzyInterval);
      if (BulletManager.startAutoShoot) BulletManager.startAutoShoot();
      frenzyModeActive = false;
      if (typeof UI !== "undefined" && UI.showScreenMessage) {
        UI.showScreenMessage("Frenesí terminado", "#FFFFFF");
      }
    }, 15000);
  }
}

function triggerSlowMotion() {
  if (slowMotionActive) return;

  if (typeof UI !== "undefined" && UI.showScreenMessage) {
    UI.showScreenMessage("🌊 ¡MUNDO ACUÁTICO! 🌊", "#0080FF");
  }

  slowMotionActive = true;
  slowMotionFactor = 0.1;

  setTimeout(() => {
    slowMotionActive = false;
    slowMotionFactor = 1.0;
    if (typeof UI !== "undefined" && UI.showScreenMessage) {
      UI.showScreenMessage("⚡ Superficie alcanzada", "#FFFFFF");
    }
  }, 10000);
}

/**
 * Iniciar nivel
 */
function startLevel() {
  console.log(`🎯 Iniciando nivel ${level}`);

  if (level > 10) {
    console.log(`❌ Error: startLevel llamado con nivel ${level}`);
    return;
  }

  // Configurar enemigos para niveles normales
  if (typeof EnemyManager !== "undefined" && EnemyManager.setupLevel) {
    EnemyManager.setupLevel(level);
  }

  if (typeof UI !== "undefined" && UI.showLevelTransition) {
    UI.showLevelTransition(level, () => {
      console.log(`✅ Nivel ${level} iniciado`);
    });
  }
}

/**
 * Avanzar al siguiente nivel
 */
function nextLevel() {
  console.log(`🎯 Completando nivel ${level}, avanzando...`);

  level++;

  if (level <= 10) {
    startLevel();
  } else if (level === 11) {
    startBossLevel();
  }
}

/**
 * Iniciar nivel del boss
 */
function startBossLevel() {
  console.log("👹 === INICIANDO BOSS FINAL NIVEL 11 ===");

  // Limpiar enemigos
  if (typeof EnemyManager !== "undefined") {
    if (EnemyManager.enemies) EnemyManager.enemies = [];
    if (EnemyManager.enemiesKilled !== undefined)
      EnemyManager.enemiesKilled = 0;
    if (EnemyManager.spawnTimer !== undefined) EnemyManager.spawnTimer = 0;
    if (EnemyManager.currentSpawnDelay !== undefined)
      EnemyManager.currentSpawnDelay = 999999;
  }

  // Inicializar boss
  setTimeout(() => {
    if (typeof BossManager !== "undefined" && BossManager.init) {
      BossManager.init();
    }

    if (typeof UI !== "undefined" && UI.showLevelTransition) {
      UI.showLevelTransition("👹 BOSS FINAL 👹", () => {
        console.log("👹 Boss Final activo");
      });
    }
  }, 500);
}

/**
 * Dibujar fondo
 */
function drawBackground() {
  if (
    !GameConfig ||
    !GameConfig.backgroundImages ||
    GameConfig.backgroundImages.length === 0
  ) {
    // Fondo de respaldo
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const bgImage =
    GameConfig.backgroundImages[
      Math.min(level - 1, GameConfig.backgroundImages.length - 1)
    ];

  if (bgImage && bgImage.complete) {
    const imgRatio = bgImage.width / bgImage.height;
    const canvasRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight, x, y;

    if (canvasRatio > imgRatio) {
      drawWidth = canvas.width;
      drawHeight = drawWidth / imgRatio;
      x = 0;
      y = (canvas.height - drawHeight) / 2;
    } else {
      drawHeight = canvas.height;
      drawWidth = drawHeight * imgRatio;
      x = (canvas.width - drawWidth) / 2;
      y = 0;
    }

    ctx.drawImage(bgImage, x, y, drawWidth, drawHeight);
  } else {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

/**
 * Efectos especiales
 */
function drawSpecialEffects(ctx) {
  // Efecto de tiempo lento
  if (slowMotionActive) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 119, 255, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // Efecto de frenesí
  if (frenzyModeActive) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 80, 0, 0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // Efecto de combo
  if (
    typeof ComboSystem !== "undefined" &&
    ComboSystem.getCurrentCombo &&
    ComboSystem.getCurrentCombo() >= 20
  ) {
    const combo = ComboSystem.getCurrentCombo();
    const intensity = Math.min(combo / 150, 0.2);

    ctx.save();
    const goldGradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2
    );
    goldGradient.addColorStop(0, `rgba(255, 215, 0, 0)`);
    goldGradient.addColorStop(0.7, `rgba(255, 215, 0, ${intensity * 0.3})`);
    goldGradient.addColorStop(1, `rgba(255, 165, 0, ${intensity})`);
    ctx.fillStyle = goldGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

/**
 * Game Over
 */
function gameOver() {
  if (gameEnded) return;

  gameEnded = true;

  // Ocultar contador
  const totalDisplay = document.getElementById("total-enemies-display");
  if (totalDisplay) {
    totalDisplay.style.display = "none";
  }

  // Comentario del boss
  if (
    level === 11 &&
    typeof BossManager !== "undefined" &&
    BossManager.isActive &&
    BossManager.isActive()
  ) {
    if (BossManager.comments && BossManager.comments.sayRandomComment) {
      BossManager.comments.sayRandomComment("victoria_boss");
    }
  }

  // Obtener combo máximo
  const maxCombo =
    typeof ComboSystem !== "undefined" && ComboSystem.getMaxCombo
      ? ComboSystem.getMaxCombo()
      : 0;

  // Detener intervalos
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  if (typeof BulletManager !== "undefined" && BulletManager.stopAutoShoot) {
    BulletManager.stopAutoShoot();
  }

  // Limpiar sistemas
  if (typeof ComboSystem !== "undefined" && ComboSystem.cleanup) {
    ComboSystem.cleanup();
  }

  // Mostrar game over
  if (typeof UI !== "undefined" && UI.showGameOver) {
    UI.showGameOver(false, score, level, maxCombo);
  }

  if (typeof AudioManager !== "undefined" && AudioManager.playSound) {
    AudioManager.playSound("gameOver");
  }

  console.log(`💀 Game Over - Combo máximo: ${maxCombo}`);
}

/**
 * Victoria
 */
function victory() {
  gameEnded = true;

  // Ocultar contador
  const totalDisplay = document.getElementById("total-enemies-display");
  if (totalDisplay) {
    totalDisplay.style.display = "none";
  }

  const maxCombo =
    typeof ComboSystem !== "undefined" && ComboSystem.getMaxCombo
      ? ComboSystem.getMaxCombo()
      : 0;

  // Detener sistemas
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  if (typeof BulletManager !== "undefined" && BulletManager.stopAutoShoot) {
    BulletManager.stopAutoShoot();
  }

  if (typeof ComboSystem !== "undefined" && ComboSystem.cleanup) {
    ComboSystem.cleanup();
  }

  // Mostrar victoria
  if (typeof UI !== "undefined") {
    if (UI.showGameOver) UI.showGameOver(true, score, level, maxCombo);
    if (UI.celebrationEffect) UI.celebrationEffect();
  }

  if (typeof AudioManager !== "undefined" && AudioManager.playSound) {
    AudioManager.playSound("victory");
  }

  console.log(`🏆 Victoria! - Combo máximo: ${maxCombo}`);
}

/**
 * Reiniciar juego
 */
function restartGame() {
  console.log("🔄 Reiniciando juego...");

  cleanupBossElements();

  const gameOverScreen = document.getElementById("game-over");
  if (gameOverScreen) {
    gameOverScreen.style.display = "none";
    gameOverScreen.innerHTML = "";
  }

  gameEnded = true;
  resetGameState();

  if (typeof ComboSystem !== "undefined") {
    if (ComboSystem.reset) ComboSystem.reset();
    setTimeout(() => {
      if (ComboSystem.createComboDisplay) ComboSystem.createComboDisplay();
    }, 100);
  }

  startGame();
}

/**
 * Resetear estado del juego
 */
function resetGameState() {
  console.log("🔄 Reseteando estado...");

  cleanupBossElements();

  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  scoreAlreadySaved = false;
  isSaving = false;
  gameEnded = false;
  gameTime = 0;
  level = 1;
  score = 0;
  totalEnemiesKilled = 0;
  slowMotionActive = false;
  slowMotionFactor = 1.0;
  frenzyModeActive = false;

  // Resetear módulos en orden correcto
  if (typeof Player !== "undefined" && Player.reset) Player.reset();
  if (typeof BulletManager !== "undefined" && BulletManager.reset)
    BulletManager.reset();
  if (typeof EnemyManager !== "undefined" && EnemyManager.reset)
    EnemyManager.reset();
  if (typeof PowerUpManager !== "undefined" && PowerUpManager.reset)
    PowerUpManager.reset();
  if (typeof BossManager !== "undefined" && BossManager.reset)
    BossManager.reset();
  if (typeof UI !== "undefined" && UI.reset) UI.reset();

  // Resetear ComboSystem
  if (typeof ComboSystem !== "undefined") {
    if (ComboSystem.cleanup) ComboSystem.cleanup();
    if (ComboSystem.reset) ComboSystem.reset();
    setTimeout(() => {
      if (ComboSystem.createComboDisplay) ComboSystem.createComboDisplay();
    }, 200);
  }

  console.log("🔄 Estado reseteado completamente");
}

/**
 * Volver al menú principal
 */
function backToMenu() {
  console.log("🏠 Volviendo al menú principal...");

  gameEnded = true;
  cleanupBossElements();

  const gameOverScreen = document.getElementById("game-over");
  if (gameOverScreen) {
    gameOverScreen.style.display = "none";
    gameOverScreen.innerHTML = "";
  }

  if (typeof ComboSystem !== "undefined" && ComboSystem.cleanup) {
    ComboSystem.cleanup();
  }

  resetGameState();

  if (typeof UI !== "undefined" && UI.removeMusicTicker) {
    UI.removeMusicTicker();
  }

  // Cambiar pantallas
  document.getElementById("game-area").style.display = "none";
  document.getElementById("ranking-container").style.display = "none";
  document.getElementById("main-menu").style.display = "block";

  if (typeof UI !== "undefined" && UI.centerMainMenu) {
    UI.centerMainMenu();
  }

  // Ocultar contador
  const totalDisplay = document.getElementById("total-enemies-display");
  if (totalDisplay) {
    totalDisplay.style.display = "none";
  }

  console.log("✅ Vuelto al menú principal");
}

/**
 * Limpiar elementos del boss
 */
function cleanupBossElements() {
  console.log("🧹 Limpiando elementos del boss...");

  try {
    // Reset del boss
    if (typeof BossManager !== "undefined" && typeof BossManager === "object") {
      if (typeof BossManager.forceReset === "function") {
        BossManager.forceReset();
      } else if (typeof BossManager.reset === "function") {
        BossManager.reset();
      }
    }

    // Limpiar botones Yan Ken Po
    const yankenpoContainer = document.getElementById("yankenpo-container");
    if (yankenpoContainer && yankenpoContainer.parentNode) {
      yankenpoContainer.parentNode.removeChild(yankenpoContainer);
    }

    // Limpiar mensajes del boss
    const bossMessage = document.getElementById("boss-speech-bubble");
    if (bossMessage && bossMessage.parentNode) {
      bossMessage.parentNode.removeChild(bossMessage);
    }

    // Limpiar listeners del boss
    if (typeof BossManager !== "undefined" && BossManager.yanKenPoKeyListener) {
      document.removeEventListener(
        "keydown",
        BossManager.yanKenPoKeyListener,
        true
      );
      document.removeEventListener(
        "keypress",
        BossManager.yanKenPoKeyListener,
        true
      );
      window.removeEventListener(
        "keydown",
        BossManager.yanKenPoKeyListener,
        true
      );
      BossManager.yanKenPoKeyListener = null;
    }

    // Restaurar velocidad del jugador
    if (typeof Player !== "undefined" && typeof Player === "object") {
      Player.moveSpeed = 1.0;
    }

    // Limpiar solo esbirros del boss
    if (typeof EnemyManager !== "undefined" && EnemyManager.enemies) {
      const originalCount = EnemyManager.enemies.length;
      EnemyManager.enemies = EnemyManager.enemies.filter(
        (enemy) => !enemy.isBossMinion && enemy.type !== "boss_minion"
      );
      const newCount = EnemyManager.enemies.length;

      if (originalCount !== newCount) {
        console.log(
          `✅ Esbirros del boss eliminados: ${originalCount - newCount}`
        );
      }
    }

    // Limpiar elementos de UI del boss
    const bossElements = [
      "boss-health-bar",
      "boss-phase-indicator",
      "boss-comment",
      "level-transition",
      "music-ticker",
    ];

    bossElements.forEach((elementId) => {
      const element = document.getElementById(elementId);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    console.log("✅ Elementos del boss limpiados");
  } catch (error) {
    console.warn("⚠️ Error limpiando elementos del boss:", error);
  }
}

/**
 * Limpiar recursos del juego
 */
function cleanupGame() {
  if (gameInterval) {
    clearInterval(gameInterval);
  }

  if (typeof BulletManager !== "undefined" && BulletManager.stopAutoShoot) {
    BulletManager.stopAutoShoot();
  }

  if (typeof ComboSystem !== "undefined" && ComboSystem.cleanup) {
    ComboSystem.cleanup();
  }
}

/**
 * Incrementar contador de enemigos
 */
function incrementTotalEnemiesKilled() {
  totalEnemiesKilled++;
  console.log(`🎯 Total enemigos eliminados: ${totalEnemiesKilled}`);
}

// ======================================================
// SISTEMA DE RANKING CON GOOGLE SHEETS
// ======================================================

/**
 * Guardar puntuación
 */
async function saveScore() {
  console.log("🚀 Guardando puntuación...");

  try {
    const playerName =
      typeof Player !== "undefined" && Player.getName
        ? Player.getName()
        : "Jugador";
    const playerAvatar =
      typeof Player !== "undefined" && Player.getAvatar
        ? Player.getAvatar()
        : "👤";
    const enemiesKilled = totalEnemiesKilled;
    const maxCombo =
      typeof ComboSystem !== "undefined" && ComboSystem.getMaxCombo
        ? ComboSystem.getMaxCombo()
        : 0;

    console.log("📊 Datos a enviar:");
    console.log("- playerName:", playerName);
    console.log("- playerAvatar:", playerAvatar);
    console.log("- level:", level);
    console.log("- enemiesKilled:", enemiesKilled);
    console.log("- score:", score);
    console.log("- maxCombo:", maxCombo);

    // Validar datos
    if (!playerName || !playerAvatar) {
      throw new Error("Datos del jugador incompletos");
    }

    // Determinar estado del juego
    let gameStatus = "Derrota";

    if (
      level >= 11 &&
      typeof BossManager !== "undefined" &&
      BossManager.isActive &&
      BossManager.getBossHealth
    ) {
      if (!BossManager.isActive() && BossManager.getBossHealth() <= 0) {
        gameStatus = "Victoria";
        console.log("🏆 Victoria: Boss derrotado");
      }
    }

    // Crear parámetros
    const params = new URLSearchParams();
    params.append("action", "save");
    params.append("date", new Date().toISOString());
    params.append("avatar", playerAvatar);
    params.append("name", playerName);
    params.append("level", level);
    params.append("enemiesKilled", enemiesKilled);
    params.append("time", Math.floor(gameTime / 60));
    params.append("score", score);
    params.append("maxCombo", maxCombo);
    params.append("status", gameStatus);

    const urlWithParams = `${WEBAPP_URL}?${params.toString()}`;

    // Timeout para la petición
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(urlWithParams, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.json();
    console.log("📥 Respuesta del servidor:", result);

    if (result.success) {
      console.log("✅ Guardado exitoso");
      alert("¡Puntuación guardada con éxito! 🎉");
      return true;
    } else {
      throw new Error(result.message || "Error del servidor");
    }
  } catch (error) {
    console.error("❌ Error:", error);

    if (error.name === "AbortError") {
      alert("⏰ Tiempo agotado. Verifica tu conexión.");
    } else {
      alert("❌ Error al guardar: " + error.message);
    }

    return false;
  }
}

/**
 * Guardar y ver ranking
 */
async function saveAndViewRanking() {
  // Deshabilitar botón
  const saveButton = document.querySelector(
    '#game-over button[onclick*="saveAndViewRanking"]'
  );
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "⏳ Guardando...";
  }

  if (scoreAlreadySaved) {
    alert("⚠️ La puntuación ya fue guardada.");
    viewRanking();
    document.getElementById("game-over").style.display = "none";
    return;
  }

  if (isSaving) {
    alert("⏳ Ya se está guardando. Espera...");
    return;
  }

  isSaving = true;

  try {
    const saveResult = await saveScore();

    if (saveResult) {
      scoreAlreadySaved = true;
      if (saveButton) {
        saveButton.textContent = "✅ Ya Guardado";
        saveButton.onclick = () => {
          viewRanking();
          document.getElementById("game-over").style.display = "none";
        };
      }
    }

    viewRanking();
    document.getElementById("game-over").style.display = "none";

    if (typeof UI !== "undefined" && UI.removeMusicTicker) {
      UI.removeMusicTicker();
    }
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("❌ Error al guardar. Inténtalo de nuevo.");

    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "💾 Guardar Ranking";
    }
  } finally {
    isSaving = false;
  }
}

/**
 * Ver ranking
 */
async function viewRanking() {
  try {
    cleanupBossElements();

    if (typeof UI !== "undefined" && UI.removeMusicTicker) {
      UI.removeMusicTicker();
    }

    document.getElementById("main-menu").style.display = "none";
    document.getElementById("game-area").style.display = "none";

    const rankingContainer = document.getElementById("ranking-container");
    rankingContainer.style.display = "block";
    rankingContainer.innerHTML = `<h2>⌛ Cargando Ranking... ⌛</h2>`;

    const response = await fetch(WEBAPP_URL);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Error al obtener datos");
    }

    const players = result.data || [];

    if (players.length === 0) {
      rankingContainer.innerHTML = `
        <h2 style="color: #FFD700; margin-bottom: 25px; font-size: 2.0em; text-align: center;">📊 Ranking de Jugadores</h2>
        <p style="text-align: center; color: #FFFFFF;">No hay puntuaciones registradas aún.</p>
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="backToMenu()" class="gothic-button">Volver al Menú</button>
        </div>
      `;
      return;
    }

    const processedPlayers = players.map((player) => ({
      date: player.date || "",
      avatar: player.avatar || "👤",
      name: player.name || "Anónimo",
      level: parseInt(player.level) || 1,
      enemiesKilled: parseInt(player.enemiesKilled) || 0,
      time: parseInt(player.time) || 0,
      score: parseInt(player.score) || 0,
      maxCombo: parseInt(player.combo) || 0,
      status: player.status || "Derrota",
    }));

    // Ordenar por puntuación, luego por combo
    const sortedPlayers = processedPlayers.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.maxCombo !== a.maxCombo) return b.maxCombo - a.maxCombo;
      return a.time - b.time;
    });

    const top10 = sortedPlayers.slice(0, 10);

    // Crear tabla responsiva
    rankingContainer.innerHTML = `
      <h2 style="color: #FFD700; margin-bottom: 25px; font-size: 2.0em; text-align: center;">🏆 Ranking de Jugadores 🏆</h2>
      
      <div class="ranking-table-container" style="
        width: 100%;
        overflow-x: auto;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(139, 0, 0, 0.3) 100%);
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
        -webkit-overflow-scrolling: touch;
      ">
        <table style="
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
          min-width: 600px;
        ">
          <thead>
            <tr>
              <th style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; background: linear-gradient(135deg, #8B0000 0%, #A0522D 100%); color: #FFFFFF; text-transform: uppercase; font-weight: bold; font-size: 0.8em;">Pos</th>
              <th style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; background: linear-gradient(135deg, #8B0000 0%, #A0522D 100%); color: #FFFFFF; text-transform: uppercase; font-weight: bold; font-size: 0.8em;">Avatar</th>
              <th style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; background: linear-gradient(135deg, #8B0000 0%, #A0522D 100%); color: #FFFFFF; text-transform: uppercase; font-weight: bold; font-size: 0.8em;">Nombre</th>
              <th style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; background: linear-gradient(135deg, #8B0000 0%, #A0522D 100%); color: #FFFFFF; text-transform: uppercase; font-weight: bold; font-size: 0.8em;">Nivel</th>
              <th style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; background: linear-gradient(135deg, #8B0000 0%, #A0522D 100%); color: #FFFFFF; text-transform: uppercase; font-weight: bold; font-size: 0.8em;">Score</th>
              <th style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; background: linear-gradient(135deg, #8B0000 0%, #A0522D 100%); color: #FFFFFF; text-transform: uppercase; font-weight: bold; font-size: 0.8em;">Combo</th>
              <th style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; background: linear-gradient(135deg, #8B0000 0%, #A0522D 100%); color: #FFFFFF; text-transform: uppercase; font-weight: bold; font-size: 0.8em;">Enemigos</th>
              <th style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; background: linear-gradient(135deg, #8B0000 0%, #A0522D 100%); color: #FFFFFF; text-transform: uppercase; font-weight: bold; font-size: 0.8em;">Tiempo</th>
              <th style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; background: linear-gradient(135deg, #8B0000 0%, #A0522D 100%); color: #FFFFFF; text-transform: uppercase; font-weight: bold; font-size: 0.8em;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${top10
              .map(
                (player, index) => `
              <tr style="background: ${
                index === 0
                  ? "linear-gradient(90deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 100%)"
                  : index === 1
                  ? "linear-gradient(90deg, rgba(192, 192, 192, 0.3) 0%, rgba(192, 192, 192, 0.1) 100%)"
                  : index === 2
                  ? "linear-gradient(90deg, rgba(205, 127, 50, 0.3) 0%, rgba(205, 127, 50, 0.1) 100%)"
                  : index % 2 === 1
                  ? "rgba(139, 0, 0, 0.2)"
                  : "transparent"
              };">
                <td style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; color: #FFFFFF;">${
                  index + 1
                }${
                  index === 0
                    ? " 🥇"
                    : index === 1
                    ? " 🥈"
                    : index === 2
                    ? " 🥉"
                    : ""
                }</td>
                <td style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; color: #FFFFFF;">${
                  player.avatar
                }</td>
                <td style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; color: #FFFFFF;">${
                  player.name
                }</td>
                <td style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; color: #FFFFFF;">${
                  player.level
                }</td>
                <td style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; color: #FFFFFF;">${
                  player.score
                }</td>
                <td style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; color: ${
                  player.maxCombo >= 20
                    ? "#FFD700"
                    : player.maxCombo >= 10
                    ? "#FFA500"
                    : "#FF6B00"
                }; font-weight: bold;">${
                  player.maxCombo > 0 ? `🔥${player.maxCombo}` : "-"
                }</td>
                <td style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; color: #FF6B00; font-weight: bold;">${
                  player.enemiesKilled
                }</td>
                <td style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; color: #FFFFFF;">${
                  player.time
                }s</td>
                <td style="padding: 12px 8px; border: 1px solid rgba(255, 0, 0, 0.3); text-align: center; color: #FFFFFF;">${
                  player.status === "Victoria" ? "🏆" : "💀"
                }</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div style="margin-top: 20px; text-align: center;">
        <button onclick="backToMenu()" class="gothic-button" style="margin-right: 10px;">Volver al Menú</button>
        <button onclick="viewRanking()" class="gothic-button">Actualizar</button>
      </div>
    `;
  } catch (error) {
    console.error("Error al cargar ranking:", error);

    const rankingContainer = document.getElementById("ranking-container");
    rankingContainer.innerHTML = `
      <h2 style="color: #FFD700; text-align: center;">❌ Error al cargar el ranking</h2>
      <p style="color: #FFFFFF; text-align: center;">No se pudo conectar con Google Sheets.</p>
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="backToMenu()" class="gothic-button" style="margin-right: 10px;">Volver al Menú</button>
        <button onclick="viewRanking()" class="gothic-button">Reintentar</button>
      </div>
    `;
  }
}

// ======================================================
// FUNCIONES GLOBALES EXPUESTAS
// ======================================================

// Hacer funciones disponibles globalmente
window.startGame = startGame;
window.restartGame = restartGame;
window.backToMenu = backToMenu;
window.nextLevel = nextLevel;
window.saveScore = saveScore;
window.saveAndViewRanking = saveAndViewRanking;
window.viewRanking = viewRanking;
window.incrementTotalEnemiesKilled = incrementTotalEnemiesKilled;
window.victory = victory;

// Getters para otros módulos
window.getCanvas = () => canvas;
window.getContext = () => ctx;
window.getGameTime = () => gameTime;
window.getLevel = () => level;
window.getScore = () => score;
window.setScore = (newScore) => (score = newScore);
window.isGameEnded = () => gameEnded;
window.getTotalEnemiesKilled = () => totalEnemiesKilled;

// Variables globales para efectos especiales
window.slowMotionActive = slowMotionActive;
window.slowMotionFactor = slowMotionFactor;
window.frenzyModeActive = frenzyModeActive;

// Función para mostrar instrucciones
window.showInstructions = () => {
  if (typeof UI !== "undefined" && UI.showInstructionsFromMenu) {
    UI.showInstructionsFromMenu();
  }
};

// 🔥 NUEVA: Función auxiliar de verificación de pausa
window.shouldGameBePaused = shouldGameBePaused;

console.log("📁 main.js CORREGIDO con SISTEMA DE PAUSA MEJORADO cargado!");
console.log(
  "🎮 Funciones disponibles:",
  Object.keys(window).filter(
    (key) =>
      key.startsWith("start") ||
      key.startsWith("restart") ||
      key.startsWith("back") ||
      key.startsWith("save") ||
      key.startsWith("view")
  )
);
console.log("⏸️ Sistema ALT+TAB integrado y listo para usar");
