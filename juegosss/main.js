/**
 * Hell Shooter - Main Game File ÉPICO FINAL
 * Coordinador principal con sistema de combos y efectos especiales
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

// Contador total de TODOS los enemigos eliminados (para Excel)
let totalEnemiesKilled = 0;

// 🔥 Variables para efectos especiales globales
let slowMotionActive = false;
let slowMotionFactor = 1.0;
let frenzyModeActive = false;

// Variables de rendimiento móvil
let isMobileDevice = false;
let isLowEndDevice = false;
let devicePerformanceLevel = "high";

/**
 * Detecta el tipo de dispositivo y ajusta la calidad gráfica
 */
function detectDevicePerformance() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  isMobileDevice =
    isIOS ||
    isAndroid ||
    /mobi|mobile|tablet|kindle|silk|opera mini/.test(userAgent);

  // Detectar dispositivos de gama baja
  const lowEndPatterns = [
    /android [1-4]\./, // Android 1-4
    /android 5\.[01]/, // Android 5.0-5.1
    /cpu os [1-9]_|cpu os 10_/, // iOS 9 o menor
    /sm-[a-z]\d{3}[a-z]?$/i, // Samsung Galaxy gama baja
  ];

  isLowEndDevice = lowEndPatterns.some((pattern) => pattern.test(userAgent));

  // Detectar RAM aproximada (estimación basada en performance)
  const memoryGb =
    navigator.deviceMemory ||
    (performance.memory ? performance.memory.jsHeapSizeLimit / 1073741824 : 2);

  if (isLowEndDevice || memoryGb < 2) {
    devicePerformanceLevel = "low";
  } else if (memoryGb < 4 || isMobileDevice) {
    devicePerformanceLevel = "medium";
  }

  console.log(
    `📱 Dispositivo detectado: ${devicePerformanceLevel} performance, Mobile: ${isMobileDevice}`
  );
  return devicePerformanceLevel;
}

// ======================================================
// 2. CONFIGURACIÓN DINÁMICA DE CALIDAD
// ======================================================

/**
 * Ajusta la configuración del juego según el dispositivo - SIN RESTRICCIONES MÓVILES
 */
function adjustGameConfig() {
  const performance = detectDevicePerformance();

  // 🔥 CONFIGURACIONES EQUILIBRADAS - NO PENALIZAR MÓVILES
  const configs = {
    low: {
      maxEnemies: 35, // AUMENTADO de 15 a 35
      maxBullets: 60, // AUMENTADO de 30 a 60
      maxParticles: 25, // AUMENTADO de 10 a 25
      shadowsEnabled: false,
      glowEffects: true, // HABILITADO
      animationQuality: "medium", // MEJORADO de low a medium
      targetFPS: 45, // AUMENTADO de 30 a 45
      updateInterval: 22, // MEJORADO de 33 a 22
    },
    medium: {
      maxEnemies: 40, // AUMENTADO de 25 a 40
      maxBullets: 70, // AUMENTADO de 50 a 70
      maxParticles: 35, // AUMENTADO de 20 a 35
      shadowsEnabled: true, // HABILITADO
      glowEffects: true,
      animationQuality: "high", // MEJORADO de medium a high
      targetFPS: 55, // AUMENTADO de 45 a 55
      updateInterval: 18, // MEJORADO de 22 a 18
    },
    high: {
      maxEnemies: 50, // AUMENTADO de 40 a 50
      maxBullets: 100, // AUMENTADO de 80 a 100
      maxParticles: 60, // AUMENTADO de 50 a 60
      shadowsEnabled: true,
      glowEffects: true,
      animationQuality: "high",
      targetFPS: 60,
      updateInterval: 16,
    },
  };

  const config = configs[performance];

  // Aplicar configuraciones
  GameConfig.MOBILE_PERFORMANCE = config;
  GameConfig.isMobile = isMobileDevice;
  GameConfig.performanceLevel = performance;

  console.log(`⚙️ Configuración OPTIMIZADA aplicada:`, config);
  return config;
}

// ======================================================
// INICIALIZACIÓN DEL JUEGO
// ======================================================

window.onload = function () {
  console.log("🎮 Hell Shooter ÉPICO - Iniciando juego...");

  // Detectar dispositivo
  GameConfig.detectDevice();

  detectDevicePerformance();
  adjustGameConfig();

  // Configurar canvas
  setupCanvas();

  // Inicializar módulos
  AudioManager.init();
  UI.init();
  ComboSystem.init(); // 🔥 NUEVO: Inicializar sistema de combos

  // Precargar recursos
  loadGameAssets();

  // Configurar eventos
  setupEventListeners();

  console.log("✅ Juego ÉPICO inicializado correctamente");
};

/**
 * Configurar el canvas responsivo
 */
function setupCanvas() {
  canvas = document.getElementById("game-canvas");
  if (!canvas) {
    console.error("❌ Canvas no encontrado");
    return;
  }

  ctx = canvas.getContext("2d", {
    alpha: false, // Sin canal alpha para mejor rendimiento
    antialias: false, // Sin antialiasing en móviles
    powerPreference: isMobileDevice ? "low-power" : "high-performance",
  });

  // Configurar dimensiones
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";

  // Optimizaciones específicas para móviles
  if (isMobileDevice) {
    // Reducir resolución en dispositivos de gama baja
    if (devicePerformanceLevel === "low") {
      const scale = 0.75;
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      ctx.scale(1 / scale, 1 / scale);
    }

    // Configuraciones de canvas para móviles
    ctx.imageSmoothingEnabled = false;
    canvas.style.imageRendering = "pixelated";
  }

  GameConfig.updateSizes(canvas);
  console.log(`📱 Canvas móvil configurado: ${canvas.width}x${canvas.height}`);
}

/**
 * Cargar recursos del juego - CON BOSS MVP
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

      // 🔥 NUEVO: Cargar imagen del boss MVP
      if (data.boss) {
        GameConfig.bossImage = new Image();
        GameConfig.bossImage.src = data.boss;
        console.log("👑 Imagen del boss cargada");
      }

      // 🔥 NUEVO: Cargar frames del boss para animación
      if (data.bossFrames) {
        GameConfig.bossFrames = data.bossFrames.map((src) => {
          const img = new Image();
          img.src = src;
          return img;
        });
        console.log("👑 Frames del boss cargados para animación");
      }

      // Cargar imagen del jugador
      GameConfig.playerImage = new Image();
      GameConfig.playerImage.src = data.player;

      // Cargar imagen de bala
      GameConfig.bulletImage = new Image();
      GameConfig.bulletImage.src = data.bullet;

      console.log("✅ Recursos ÉPICOS cargados");
    })
    .catch((error) => {
      console.error("❌ Error cargando recursos:", error);
      createFallbackImages();
    });
}

/**
 * Crear imágenes de respaldo si falla la carga
 */
function createFallbackImages() {
  // Imagen simple del jugador
  const playerCanvas = document.createElement("canvas");
  playerCanvas.width = 80;
  playerCanvas.height = 80;
  const playerCtx = playerCanvas.getContext("2d");
  playerCtx.fillStyle = "#FF0000";
  playerCtx.fillRect(0, 0, 80, 80);
  GameConfig.playerImage = new Image();
  GameConfig.playerImage.src = playerCanvas.toDataURL();

  // Imagen simple de bala
  const bulletCanvas = document.createElement("canvas");
  bulletCanvas.width = 20;
  bulletCanvas.height = 40;
  const bulletCtx = bulletCanvas.getContext("2d");
  bulletCtx.fillStyle = "#FFFFFF";
  bulletCtx.fillRect(0, 0, 20, 40);
  GameConfig.bulletImage = new Image();
  GameConfig.bulletImage.src = bulletCanvas.toDataURL();

  // 🔥 Imagen simple del boss
  const bossCanvas = document.createElement("canvas");
  bossCanvas.width = 120;
  bossCanvas.height = 120;
  const bossCtx = bossCanvas.getContext("2d");
  bossCtx.fillStyle = "#8B0000";
  bossCtx.fillRect(0, 0, 120, 120);
  bossCtx.fillStyle = "#FFFFFF";
  bossCtx.fillRect(50, 40, 20, 10); // Ojos
  bossCtx.fillRect(50, 70, 20, 10); // Boca
  GameConfig.bossImage = new Image();
  GameConfig.bossImage.src = bossCanvas.toDataURL();

  console.log("🔄 Imágenes de respaldo ÉPICAS creadas");
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
  // Redimensionar ventana
  window.addEventListener("resize", setupCanvas);

  // Prevenir menú contextual
  window.addEventListener("contextmenu", (e) => e.preventDefault());

  // Limpiar al cerrar
  window.addEventListener("beforeunload", cleanupGame);

  // Botones del menú
  document
    .getElementById("emoji-button")
    ?.addEventListener("click", UI.openEmojiPicker);
}

/**
 * Iniciar el juego
 */
function startGame() {
  const playerName = document.getElementById("name")?.value;
  const playerAvatar = document.getElementById("avatar")?.value;

  // 🔥 VALIDACIÓN MEJORADA - Avatar obligatorio de la lista
  if (!playerName || !playerAvatar || playerName.length < 3) {
    alert(
      "Por favor:\n• Ingresa un nombre (mínimo 3 caracteres)\n• Selecciona un avatar de la lista"
    );
    return;
  }

  // Verificar que el avatar no esté vacío
  if (playerAvatar.trim() === "" || playerAvatar === "Obligatorio") {
    alert("¡Debes seleccionar un emoji de la lista!");
    return;
  }

  // Reiniciar estado del juego
  resetGameState();

  // Configurar jugador
  Player.init(playerName, playerAvatar);

  // Mostrar área de juego
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("game-area").style.display = "block";

  // Configurar controles
  Player.setupControls(canvas);

  // Iniciar directamente el juego
  startGameLoop();

  console.log("🚀 Juego ÉPICO iniciado directamente");
}

/**
 * Iniciar el bucle principal del juego
 */
function startGameLoop() {
  gameEnded = false;

  // Configurar para móviles
  const config = adjustGameConfig();

  BulletManager.startAutoShoot();
  if (!AudioManager.isBackgroundMusicPlaying()) {
    AudioManager.startBackgroundMusic();
  }

  // 🔥 CREAR TICKER SOLO CUANDO EMPIEZA EL JUEGO
  setTimeout(() => {
    UI.createMusicTicker();
  }, 500);

  // Game loop adaptativo
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsMonitor = 0;
  let adaptiveInterval = config.updateInterval;

  function adaptiveGameLoop(currentTime) {
    if (gameEnded) return;

    const deltaTime = currentTime - lastTime;

    // Solo ejecutar si ha pasado suficiente tiempo
    if (deltaTime >= adaptiveInterval) {
      // Monitorear FPS cada 60 frames
      frameCount++;
      if (frameCount >= 60) {
        const actualFPS = 1000 / deltaTime;
        fpsMonitor = actualFPS;

        // Ajustar intervalo dinámicamente
        if (actualFPS < config.targetFPS * 0.8) {
          adaptiveInterval = Math.min(adaptiveInterval + 2, 50); // Reducir FPS si es necesario
        } else if (actualFPS > config.targetFPS * 1.2) {
          adaptiveInterval = Math.max(
            adaptiveInterval - 1,
            config.updateInterval
          );
        }

        frameCount = 0;
      }

      try {
        // Ejecutar game loop normal
        gameLoop();
      } catch (error) {
        console.error("❌ Error en game loop móvil:", error);
      }

      lastTime = currentTime;
    }

    // Continuar loop
    requestAnimationFrame(adaptiveGameLoop);
  }

  // Iniciar con requestAnimationFrame para mejor rendimiento
  requestAnimationFrame(adaptiveGameLoop);
  startLevel();

  const totalDisplay = document.getElementById("total-enemies-display");
  if (totalDisplay) {
    totalDisplay.style.display = "block";
  }

  console.log(`🔄 Game loop móvil iniciado - Target FPS: ${config.targetFPS}`);
}

/**
 * Bucle principal del juego - CORREGIDO PARA NIVEL 11
 */
function gameLoop() {
  if (gameEnded) return;

  try {
    // Actualizar tiempo
    gameTime++;

    // 🔥 Actualizar sistema de combos
    ComboSystem.update();

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar fondo
    drawBackground();

    // 🔥 Aplicar efectos de tiempo lento si está activo
    const originalSlowFactor = window.slowMotionFactor;
    if (slowMotionActive) {
      window.slowMotionFactor = slowMotionFactor;
    }

    // Actualizar sistemas de juego
    Player.update();
    BulletManager.update();

    // 🔥 ACTUALIZAR enemigos normales SOLO si NO es nivel 11, O si es nivel 11 para esbirros
    if (level < 11) {
      EnemyManager.update();
    } else if (level === 11) {
      // En nivel 11, solo actualizar enemigos si hay esbirros del boss
      if (EnemyManager.enemies.length > 0) {
        EnemyManager.update();
      }
    }

    PowerUpManager.update();

    // 🔥 SOLO verificar boss si es nivel 11
    if (level === 11) {
      BossManager.update();
    }

    // Restaurar factor de tiempo
    if (slowMotionActive) {
      window.slowMotionFactor = originalSlowFactor;
    }

    // Verificar colisiones
    checkCollisions();

    // 🔥 VERIFICAR MUERTE DEL JUGADOR
    if (Player.getLives() <= 0 && !gameEnded) {
      console.log("💀 Detectada muerte del jugador en game loop");
      gameOver();
      return; // Salir inmediatamente
    }

    // 🔥 Verificar nivel completo SOLO para niveles 1-10
    if (level <= 10 && EnemyManager.isLevelComplete()) {
      nextLevel();
    }

    // Dibujar elementos
    Player.draw(ctx);
    BulletManager.draw(ctx);

    // 🔥 Dibujar enemigos normales SOLO si NO es nivel 11, O si hay esbirros
    if (level < 11) {
      EnemyManager.draw(ctx);
    } else if (level === 11 && EnemyManager.enemies.length > 0) {
      // En nivel 11, solo dibujar si hay esbirros del boss
      EnemyManager.draw(ctx);
    }

    PowerUpManager.draw(ctx);

    // 🔥 SOLO dibujar boss si es nivel 11
    if (level === 11) {
      BossManager.draw(ctx);
    }

    // 🔥 Efectos especiales de pantalla
    drawSpecialEffects(ctx);

    if (isMobileDevice) limitEntitiesForMobile();

    // Actualizar UI
    UI.update();
  } catch (error) {
    console.error("❌ Error en game loop:", error);
  }
}

/**
 * 🔥 NUEVO: Dibuja efectos especiales en pantalla - CORREGIDO
 */
function drawSpecialEffects(ctx) {
  // 🌊 Efecto de tiempo lento - SOLO OVERLAY AZUL SUTIL
  if (window.slowMotionActive) {
    ctx.save();

    // Overlay azul muy sutil
    ctx.fillStyle = "rgba(0, 119, 255, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
  }

  // 🔥 Efecto de modo frenesí - ROJO FUEGO MUY SUTIL
  if (window.frenzyModeActive) {
    ctx.save();

    // 🔥 OVERLAY ROJO MUY SUTIL - CASI TRANSPARENTE
    ctx.fillStyle = "rgba(255, 80, 0, 0.18)"; // Era 0.3, ahora 0.18
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Segundo overlay aún más sutil
    ctx.fillStyle = "rgba(200, 60, 0, 0.1)"; // Era 0.15, ahora 0.1
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Efectos de fuego sutiles
    for (let i = 0; i < 20; i++) {
      // Menos efectos
      const fireX = Math.random() * canvas.width;
      const fireY = Math.random() * canvas.height;
      const fireSize = 3 + Math.random() * 6; // Más pequeños

      ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, 0.4)`; // Era 0.8, ahora 0.4
      ctx.fillRect(fireX, fireY, fireSize, fireSize);
    }

    ctx.restore();
  }

  // ⚡ Efecto de combo alto - ENERGÍA DORADA MÁS SUTIL
  if (window.ComboSystem && window.ComboSystem.getCurrentCombo() >= 20) {
    const combo = window.ComboSystem.getCurrentCombo();
    const intensity = Math.min(combo / 150, 0.2); // Más sutil

    ctx.save();

    // Resplandor dorado MÁS SUTIL
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
    ctx.fillRect(0, 0, canvas.width, canvas.width);

    ctx.restore();
  }
}

/**
 * 🔥 NUEVO: Límites más generosos para móviles
 */
function limitEntitiesForMobile() {
  const config = GameConfig.MOBILE_PERFORMANCE;

  if (!config) return;

  // 🔥 LÍMITES MÁS ALTOS - NO PENALIZAR MÓVILES
  // Limitar enemigos solo si superan MUCHO el máximo
  if (EnemyManager.enemies.length > config.maxEnemies * 1.2) {
    EnemyManager.enemies.splice(config.maxEnemies);
  }

  // Limitar balas solo si superan MUCHO el máximo
  if (BulletManager.bullets.length > config.maxBullets * 1.2) {
    BulletManager.bullets.splice(config.maxBullets / 2);
  }

  // Límites más generosos para power-ups
  if (PowerUpManager.powerUps.length > 6) {
    // AUMENTADO de 4 a 6
    PowerUpManager.powerUps.splice(6);
  }

  // Límites más generosos para corazones
  if (PowerUpManager.hearts.length > 4) {
    // AUMENTADO de 2 a 4
    PowerUpManager.hearts.splice(4);
  }
}

/**
 * Pool de objetos para reutilizar en lugar de crear/destruir
 */
const ObjectPool = {
  bullets: [],
  enemies: [],
  particles: [],

  getBullet() {
    return (
      this.bullets.pop() || {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        velocityX: 0,
        velocityY: 0,
        active: false,
      }
    );
  },

  returnBullet(bullet) {
    bullet.active = false;
    this.bullets.push(bullet);
  },

  getEnemy() {
    return (
      this.enemies.pop() || {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        velocityX: 0,
        velocityY: 0,
        active: false,
      }
    );
  },

  returnEnemy(enemy) {
    enemy.active = false;
    this.enemies.push(enemy);
  },
};

/**
 * 🔥 CORREGIDO: Verificar colisiones con mejor manejo de muerte del jugador
 */
function checkCollisions() {
  // 🔥 VERIFICACIÓN INICIAL: Si el jugador ya está muerto, no verificar más colisiones
  if (Player.getLives() <= 0) {
    console.log("💀 Jugador ya muerto, saltando verificación de colisiones");
    return;
  }

  // 🔥 Balas vs Enemigos (solo niveles 1-10)
  if (level <= 10) {
    const enemiesKilledByBullets = BulletManager.checkEnemyCollisions(
      EnemyManager.enemies
    );
  }

  // 🔥 Jugador vs Enemigos (solo niveles 1-10)
  if (level <= 10) {
    if (Player.checkEnemyCollisions(EnemyManager.enemies)) {
      // El jugador fue golpeado
      console.log(
        `💔 Jugador golpeado por enemigo. Vidas restantes: ${Player.getLives()}`
      );

      if (Player.getLives() <= 0) {
        console.log("💀 Jugador murió por colisión con enemigo");
        gameOver();
        return; // ⬅️ IMPORTANTE: Salir inmediatamente
      }
    }
  }

  // Jugador vs Power-ups (siempre)
  Player.checkPowerUpCollisions(PowerUpManager.powerUps);

  // Jugador vs Hearts (siempre, EXCEPTO en boss level 11)
  if (level < 11) {
    Player.checkHeartCollisions(PowerUpManager.hearts);
  }

  // 🔥 Boss colisiones (SOLO nivel 11)
  if (level === 11 && BossManager.isActive()) {
    console.log("🔥 Verificando colisiones del boss en nivel 11");

    // Balas vs Boss
    BulletManager.checkBossCollisions();

    // Jugador vs Boss (colisión física)
    if (Player.checkBossCollisions()) {
      console.log(
        `💔 Jugador golpeado por boss físicamente. Vidas restantes: ${Player.getLives()}`
      );

      if (Player.getLives() <= 0) {
        console.log("💀 Jugador murió por colisión física con boss");
        gameOver();
        return; // ⬅️ IMPORTANTE: Salir inmediatamente
      }
    }

    // 🔥 Jugador vs Esbirros del Boss (enemigos invocados en nivel 11)
    if (EnemyManager.enemies.length > 0) {
      if (Player.checkEnemyCollisions(EnemyManager.enemies)) {
        console.log(
          `💔 Jugador golpeado por esbirro del boss. Vidas restantes: ${Player.getLives()}`
        );

        if (Player.getLives() <= 0) {
          console.log("💀 Jugador murió por colisión con esbirro del boss");
          gameOver();
          return;
        }
      }

      // 🔥 Balas vs Esbirros del Boss
      BulletManager.checkEnemyCollisions(EnemyManager.enemies);
    }

    // 🔥 NUEVO: Jugador vs Minas del Boss
    if (BossManager.getMines && BossManager.getMines().length > 0) {
      const mines = BossManager.getMines();

      for (let i = mines.length - 1; i >= 0; i--) {
        const mine = mines[i];

        // Solo verificar minas armadas
        if (!mine.armed) continue;

        const playerPos = Player.getPosition();
        const playerSize = Player.getSize();

        // Verificar si el jugador está en el radio de peligro de la mina
        const playerCenterX = playerPos.x + playerSize.width / 2;
        const playerCenterY = playerPos.y + playerSize.height / 2;
        const mineCenterX = mine.x + mine.width / 2;
        const mineCenterY = mine.y + mine.height / 2;

        const distance = Math.sqrt(
          Math.pow(playerCenterX - mineCenterX, 2) +
            Math.pow(playerCenterY - mineCenterY, 2)
        );

        // Si el jugador está muy cerca de la mina (no necesariamente en el radio completo)
        if (distance < mine.width) {
          // Radio de colisión directo con la mina
          console.log("💥 Jugador tocó una mina directamente");

          // Hacer explotar la mina inmediatamente
          mine.timer = 0;

          // Dañar al jugador
          Player.takeDamage();
          console.log(
            `💔 Jugador dañado por mina. Vidas restantes: ${Player.getLives()}`
          );

          if (Player.getLives() <= 0) {
            console.log("💀 Jugador murió por tocar mina");
            gameOver();
            return;
          }
        }
      }
    }

    // 🔥 VERIFICACIÓN MEJORADA: Balas Touhou vs Jugador
    if (BossManager.bulletPatterns && BossManager.bulletPatterns.length > 0) {
      const playerPos = Player.getPosition();
      const playerSize = Player.getSize();

      for (let i = BossManager.bulletPatterns.length - 1; i >= 0; i--) {
        const bullet = BossManager.bulletPatterns[i];

        // Verificación de colisión precisa para balas pequeñas
        if (
          bullet.x < playerPos.x + playerSize.width &&
          bullet.x + bullet.width > playerPos.x &&
          bullet.y < playerPos.y + playerSize.height &&
          bullet.y + bullet.height > playerPos.y
        ) {
          console.log("💥 Bala Touhou impactó al jugador en checkCollisions");

          // Eliminar la bala ANTES de aplicar daño
          BossManager.bulletPatterns.splice(i, 1);

          // 🔥 APLICAR DAÑO DIRECTAMENTE Y VERIFICAR RESULTADO INMEDIATO
          const previousLives = Player.getLives();
          Player.takeDamage();
          const currentLives = Player.getLives();

          console.log(
            `💔 Vida antes: ${previousLives}, después: ${currentLives}`
          );

          // 🔥 VERIFICACIÓN INMEDIATA Y EXPLÍCITA
          if (currentLives <= 0) {
            console.log(
              "💀 Jugador murió por bala Touhou - activando game over AHORA"
            );
            // Usar setTimeout muy corto para evitar condiciones de carrera
            setTimeout(() => {
              gameOver();
            }, 10);
            return; // Salir inmediatamente
          }
        }
      }
    }
  }

  // 🔥 VERIFICACIÓN FINAL: Double-check de muerte (solo si no se ejecutó antes)
  if (Player.getLives() <= 0 && !gameEnded) {
    console.log("💀 Verificación final detectó muerte del jugador");
    gameOver();
    return;
  }
}

/**
 * 🔥 Inicia el nivel del boss final - CORREGIDO PARA NIVEL 11
 */
function startBossLevel() {
  console.log("👹 === INICIANDO BOSS FINAL NIVEL 11 ===");

  // 🔥 MANTENER level = 11 para el boss
  // level ya es 11 aquí, NO cambiar

  // 🔥 LIMPIAR TODOS LOS ENEMIGOS INMEDIATAMENTE
  console.log(`🧹 Limpiando ${EnemyManager.enemies.length} enemigos restantes`);
  EnemyManager.enemies = [];
  EnemyManager.enemiesKilled = 0;
  EnemyManager.spawnTimer = 0;

  // 🔥 DETENER EL SPAWN DE ENEMIGOS NORMALES completamente
  EnemyManager.currentSpawnDelay = 999999; // Tiempo muy alto para evitar spawn

  console.log("🧹 Enemigos normales eliminados y spawn detenido para nivel 11");

  // 🔥 INICIALIZAR BOSS DESPUÉS DE UN PEQUEÑO DELAY
  setTimeout(() => {
    console.log("👹 Inicializando BossManager para nivel 11...");
    BossManager.init();

    // Mostrar transición épica
    UI.showLevelTransition("👹 BOSS FINAL 👹", () => {
      console.log("👹 Boss Final activo en nivel 11 - ¡Sistema completo!");
    });
  }, 500);
}

/**
 * 🔥 NUEVO: Limpia enemigos restantes antes del boss
 */
function clearRemainingEnemies() {
  EnemyManager.enemies = [];
  console.log("🧹 Enemigos restantes eliminados para el boss");
}

function startLevel() {
  console.log(`🎯 Iniciando nivel ${level}`);

  // 🔥 SOLO PARA NIVELES 1-10
  if (level > 10) {
    console.log(`❌ Error: startLevel llamado con nivel ${level}`);
    return;
  }

  // Configurar enemigos para niveles normales
  EnemyManager.setupLevel(level);

  UI.showLevelTransition(level, () => {
    console.log(`✅ Nivel ${level} iniciado correctamente`);
  });
}

/**
 * Avanzar al siguiente nivel - CORREGIDO PARA NIVEL 11
 */
function nextLevel() {
  console.log(`🎯 Completando nivel ${level}, avanzando...`);

  level++;

  // Niveles 1-10: Enemigos normales
  if (level <= 10) {
    console.log(`📈 Iniciando nivel normal ${level}`);
    startLevel();
  }
  // Nivel 11: Boss Final - NO VICTORIA AUTOMÁTICA
  else if (level === 11) {
    console.log(`👹 ¡Tiempo del Boss Final! (Nivel ${level})`);
    startBossLevel();
  }
  // Si por alguna razón se llega más allá del 11, es error
  else {
    console.log(`❌ Error: Nivel ${level} no debería existir`);
    // NO llamar victory() aquí, solo log de error
  }
}

/**
 * Dibujar el fondo
 */
function drawBackground() {
  const bgImage =
    GameConfig.backgroundImages[
      Math.min(level - 1, GameConfig.backgroundImages.length - 1)
    ];

  if (bgImage && bgImage.complete) {
    // Calcular dimensiones para mantener proporción
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
    // Fondo de respaldo
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function gameOver() {
  // 🔥 PREVENIR MÚLTIPLES LLAMADAS
  if (gameEnded) {
    console.log("💀 Game over ya procesado, ignorando llamada duplicada");
    return;
  }

  gameEnded = true;

  // 🔥 OCULTAR CONTADOR TOTAL INMEDIATAMENTE
  const totalDisplay = document.getElementById("total-enemies-display");
  if (totalDisplay) {
    totalDisplay.style.display = "none";
    console.log("🔄 Contador total de enemigos ocultado en game over");
  }

  // 🔥 COMENTARIO DEL BOSS SI ESTÁ ACTIVO
  if (level === 11 && BossManager.isActive()) {
    BossManager.sayRandomComment("victoria_boss");
  }

  // 🔥 OBTENER COMBO MÁXIMO ANTES DE LIMPIAR
  const maxCombo = ComboSystem ? ComboSystem.getMaxCombo() : 0;

  // Detener TODOS los intervalos y sistemas
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  BulletManager.stopAutoShoot();

  // Limpiar sistemas completamente DESPUÉS de obtener el combo
  ComboSystem.cleanup();

  // Mostrar pantalla de game over
  UI.showGameOver(false, score, level, maxCombo);
  AudioManager.playSound("gameOver");

  console.log(`💀 Game Over - Combo máximo: ${maxCombo}`);
}

/**
 * Victoria
 */
function victory() {
  gameEnded = true;

  // 🔥 OCULTAR CONTADOR TOTAL INMEDIATAMENTE
  const totalDisplay = document.getElementById("total-enemies-display");
  if (totalDisplay) {
    totalDisplay.style.display = "none";
    console.log("🔄 Contador total de enemigos ocultado en victory");
  }

  // 🔥 OBTENER COMBO MÁXIMO ANTES DE LIMPIAR
  const maxCombo = ComboSystem ? ComboSystem.getMaxCombo() : 0;

  // Detener TODOS los intervalos y sistemas
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  BulletManager.stopAutoShoot();

  // Limpiar sistemas completamente DESPUÉS de obtener el combo
  ComboSystem.cleanup();

  // Celebración épica con combo
  UI.showGameOver(true, score, level, maxCombo);
  AudioManager.playSound("victory");

  // Efecto de celebración más épico
  UI.celebrationEffect();

  console.log(`🏆 Victoria ÉPICA! - Combo máximo: ${maxCombo}`);
}

/**
 * Reiniciar juego - CORREGIDO
 */
function restartGame() {
  console.log("🔄 Reiniciando juego...");

  // 🔥 OCULTAR GAME OVER INMEDIATAMENTE
  const gameOverScreen = document.getElementById("game-over");
  if (gameOverScreen) {
    gameOverScreen.style.display = "none";
    gameOverScreen.innerHTML = ""; // Limpiar contenido
  }

  // 🔥 FORZAR DETENCIÓN COMPLETA
  gameEnded = true;

  // Resetear estado
  resetGameState();

  // Asegurar que el sistema de combos se reinicie
  if (window.ComboSystem) {
    ComboSystem.reset();
    setTimeout(() => {
      ComboSystem.createComboDisplay();
    }, 100);
  }

  // Iniciar juego limpio
  startGame();

  console.log("✅ Juego reiniciado correctamente");
}

/**
 * Resetea estado del juego - CORREGIDO PARA COMBOS
 */
function resetGameState() {
  // Detener intervalos
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  // Resetear variables de control de guardado
  scoreAlreadySaved = false;
  isSaving = false;

  // Resetear variables
  gameEnded = false;
  gameTime = 0;
  level = 1;
  score = 0;
  totalEnemiesKilled = 0;

  // Resetear efectos especiales
  slowMotionActive = false;
  slowMotionFactor = 1.0;
  frenzyModeActive = false;

  // Resetear módulos
  Player.reset();
  BulletManager.reset();
  EnemyManager.reset();
  PowerUpManager.reset();
  BossManager.reset();
  UI.reset();

  // 🔥 CORREGIDO: Resetear Y recrear combo display
  if (window.ComboSystem) {
    ComboSystem.cleanup(); // Limpiar primero
    ComboSystem.reset(); // Resetear estado
    // Recrear display después de un pequeño delay
    setTimeout(() => {
      ComboSystem.createComboDisplay();
    }, 200);
  }

  console.log("🔄 Estado del juego ÉPICO reseteado");
}

/**
 * Limpiar recursos del juego
 */
function cleanupGame() {
  if (gameInterval) {
    clearInterval(gameInterval);
  }

  BulletManager.stopAutoShoot();
  //AudioManager.stopBackgroundMusic();
  ComboSystem.cleanup(); // 🔥 NUEVO
}

/**
 * Volver al menú principal - CORREGIDO PARA COMBOS
 */
function backToMenu() {
  console.log("🏠 Volviendo al menú principal...");

  // FORZAR DETENCIÓN COMPLETA DEL JUEGO
  gameEnded = true;

  // OCULTAR Y LIMPIAR GAME OVER INMEDIATAMENTE
  const gameOverScreen = document.getElementById("game-over");
  if (gameOverScreen) {
    gameOverScreen.style.display = "none";
    gameOverScreen.innerHTML = "";
  }

  // 🔥 LIMPIAR COMBO DISPLAY ANTES DE RESETEAR
  if (window.ComboSystem) {
    ComboSystem.cleanup();
  }

  // Resetear estado del juego ANTES de cambiar pantallas
  resetGameState();

  // ELIMINAR TICKER AL VOLVER AL MENÚ
  UI.removeMusicTicker();

  // Cambiar pantallas
  document.getElementById("game-area").style.display = "none";
  document.getElementById("ranking-container").style.display = "none";
  document.getElementById("main-menu").style.display = "block";

  UI.centerMainMenu();

  // Ocultar contador total fuera del juego
  const totalDisplay = document.getElementById("total-enemies-display");
  if (totalDisplay) {
    totalDisplay.style.display = "none";
  }

  console.log("✅ Vuelto al menú principal correctamente");
}

// ======================================================
// SISTEMA DE RANKING MEJORADO - CORREGIDO
// ======================================================

// URL de tu Web App de Google Sheets
const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbyISC1HgWsjGaNoCubjC8xEtABygGw9m24NLnz2ZwyM4pdeQBhuIF-cHRTQtQeYDWpTOA/exec";

// Variables de control de guardado
let scoreAlreadySaved = false;
let isSaving = false;

/**
 * Guarda la puntuación - ACTUALIZADO PARA INCLUIR COMBO
 * Solo reemplaza esta función en tu código existente
 */
async function saveScore() {
  console.log("🚀 Guardando puntuación...");

  try {
    const playerName = Player.getName();
    const playerAvatar = Player.getAvatar();
    const enemiesKilled = totalEnemiesKilled;
    const maxCombo = ComboSystem.getMaxCombo();

    // ⬅️ AGREGAR ESTOS LOGS DE DEBUG
    console.log("📊 DEBUG - Datos a enviar:");
    console.log("- playerName:", playerName);
    console.log("- playerAvatar:", playerAvatar);
    console.log("- level:", level);
    console.log("- enemiesKilled:", enemiesKilled);
    console.log("- score:", score);
    console.log("- maxCombo:", maxCombo);
    console.log("- ComboSystem existe:", !!ComboSystem);
    console.log("- getMaxCombo función:", typeof ComboSystem?.getMaxCombo);

    // Validar datos antes de enviar
    if (!playerName || !playerAvatar) {
      throw new Error("Datos del jugador incompletos");
    }

    // Victoria SOLO si el boss está inactivo (fue derrotado) Y estamos en nivel 11+
    let gameStatus = "Derrota";

    if (
      level >= 11 &&
      BossManager &&
      !BossManager.isActive() &&
      BossManager.getBossHealth() <= 0
    ) {
      gameStatus = "Victoria";
      console.log("🏆 Victoria registrada: Boss derrotado en nivel 11+");
    } else {
      console.log(
        `💀 Derrota registrada: Nivel ${level}, Boss activo: ${
          BossManager ? BossManager.isActive() : "N/A"
        }`
      );
    }

    // Crear URL con parámetros - AHORA CON COMBO
    const params = new URLSearchParams();
    params.append("action", "save");
    params.append("date", new Date().toISOString());
    params.append("avatar", playerAvatar);
    params.append("name", playerName);
    params.append("level", level);
    params.append("enemiesKilled", enemiesKilled);
    params.append("time", Math.floor(gameTime / 60));
    params.append("score", score);
    params.append("maxCombo", maxCombo); // ⬅️ COMBO
    params.append("status", gameStatus);

    const urlWithParams = `${WEBAPP_URL}?${params.toString()}`;
    console.log("📡 URL completa enviada:", urlWithParams);

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
 * Guarda puntuación y muestra ranking
 */
async function saveAndViewRanking() {
  // Deshabilitar botón inmediatamente
  const saveButton = document.querySelector(
    '#game-over button[onclick*="saveAndViewRanking"]'
  );
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "⏳ Guardando...";
  }

  if (scoreAlreadySaved) {
    alert("⚠️ La puntuación ya fue guardada anteriormente.");
    viewRanking();
    document.getElementById("game-over").style.display = "none";
    return;
  }

  if (isSaving) {
    alert("⏳ Ya se está guardando la puntuación. Por favor espera...");
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

    // 🔥 NUEVO: Eliminar ticker al ir a ranking
    UI.removeMusicTicker();
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("❌ Error al guardar la puntuación. Inténtalo de nuevo.");

    // Rehabilitar botón en caso de error
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "💾 Guardar Ranking";
    }
  } finally {
    isSaving = false;
  }
}

/**
 * Muestra el ranking desde Google Sheets - RESPONSIVE Y MEJORADO
 */
async function viewRanking() {
  try {
    // 🔥 NUEVO: Eliminar ticker inmediatamente
    UI.removeMusicTicker();

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
                <h2 style="
                    color: var(--accent-color);
                    margin-bottom: 25px;
                    font-size: 2.0em;
                    font-family: var(--professional-font);
                    text-shadow: 0 0 15px var(--accent-color);
                    font-weight: bold;
                    text-align: center;
                    line-height: 1.2;
                ">📊 Ranking de Jugadores</h2>
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
      maxCombo: parseInt(player.combo) || 0, // ⬅️ NUEVO: Procesar combo
      status: player.status || "Derrota",
    }));

    // Ordenar por puntuación, luego por combo máximo
    const sortedPlayers = processedPlayers.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.maxCombo !== a.maxCombo) {
        return b.maxCombo - a.maxCombo; // ⬅️ NUEVO: Combo como criterio de desempate
      }
      return a.time - b.time;
    });

    const top10 = sortedPlayers.slice(0, 10);

    // 🔥 TABLA RESPONSIVA MEJORADA
    rankingContainer.innerHTML = `
            <h2 style="
                color: var(--accent-color);
                margin-bottom: 25px;
                font-size: 2.0em;
                font-family: var(--professional-font);
                text-shadow: 0 0 15px var(--accent-color);
                font-weight: bold;
                text-align: center;
                line-height: 1.2;
            ">🏆 Ranking de Jugadores 🏆</h2>
            
            <!-- Contenedor responsivo para la tabla -->
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
                            <th style="
                                padding: 12px 8px;
                                border: 1px solid rgba(255, 0, 0, 0.3);
                                text-align: center;
                                background: linear-gradient(135deg, var(--secondary-color) 0%, var(--hover-color) 100%);
                                color: var(--text-color);
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                font-weight: bold;
                                text-shadow: 0 0 5px #000;
                                font-size: 0.8em;
                                white-space: nowrap;
                                font-family: var(--professional-font);
                            ">Pos</th>
                            <th style="
                                padding: 12px 8px;
                                border: 1px solid rgba(255, 0, 0, 0.3);
                                text-align: center;
                                background: linear-gradient(135deg, var(--secondary-color) 0%, var(--hover-color) 100%);
                                color: var(--text-color);
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                font-weight: bold;
                                text-shadow: 0 0 5px #000;
                                font-size: 0.8em;
                                white-space: nowrap;
                                font-family: var(--professional-font);
                            ">Avatar</th>
                            <th style="
                                padding: 12px 8px;
                                border: 1px solid rgba(255, 0, 0, 0.3);
                                text-align: center;
                                background: linear-gradient(135deg, var(--secondary-color) 0%, var(--hover-color) 100%);
                                color: var(--text-color);
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                font-weight: bold;
                                text-shadow: 0 0 5px #000;
                                font-size: 0.8em;
                                white-space: nowrap;
                                font-family: var(--professional-font);
                            ">Nombre</th>
                            <th style="
                                padding: 12px 8px;
                                border: 1px solid rgba(255, 0, 0, 0.3);
                                text-align: center;
                                background: linear-gradient(135deg, var(--secondary-color) 0%, var(--hover-color) 100%);
                                color: var(--text-color);
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                font-weight: bold;
                                text-shadow: 0 0 5px #000;
                                font-size: 0.8em;
                                white-space: nowrap;
                                font-family: var(--professional-font);
                            ">Nivel</th>
                            <th style="
                                padding: 12px 8px;
                                border: 1px solid rgba(255, 0, 0, 0.3);
                                text-align: center;
                                background: linear-gradient(135deg, var(--secondary-color) 0%, var(--hover-color) 100%);
                                color: var(--text-color);
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                font-weight: bold;
                                text-shadow: 0 0 5px #000;
                                font-size: 0.8em;
                                white-space: nowrap;
                                font-family: var(--professional-font);
                            ">Score</th>
                            <th style="
                                padding: 12px 8px;
                                border: 1px solid rgba(255, 0, 0, 0.3);
                                text-align: center;
                                background: linear-gradient(135deg, var(--secondary-color) 0%, var(--hover-color) 100%);
                                color: var(--text-color);
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                font-weight: bold;
                                text-shadow: 0 0 5px #000;
                                font-size: 0.8em;
                                white-space: nowrap;
                                font-family: var(--professional-font);
                            ">Combo</th>
                            <th style="
                                padding: 12px 8px;
                                border: 1px solid rgba(255, 0, 0, 0.3);
                                text-align: center;
                                background: linear-gradient(135deg, var(--secondary-color) 0%, var(--hover-color) 100%);
                                color: var(--text-color);
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                font-weight: bold;
                                text-shadow: 0 0 5px #000;
                                font-size: 0.8em;
                                white-space: nowrap;
                                font-family: var(--professional-font);
                            ">Enemigos</th>
                            <th style="
                                padding: 12px 8px;
                                border: 1px solid rgba(255, 0, 0, 0.3);
                                text-align: center;
                                background: linear-gradient(135deg, var(--secondary-color) 0%, var(--hover-color) 100%);
                                color: var(--text-color);
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                font-weight: bold;
                                text-shadow: 0 0 5px #000;
                                font-size: 0.8em;
                                white-space: nowrap;
                                font-family: var(--professional-font);
                            ">Tiempo</th>
                            <th style="
                                padding: 12px 8px;
                                border: 1px solid rgba(255, 0, 0, 0.3);
                                text-align: center;
                                background: linear-gradient(135deg, var(--secondary-color) 0%, var(--hover-color) 100%);
                                color: var(--text-color);
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                font-weight: bold;
                                text-shadow: 0 0 5px #000;
                                font-size: 0.8em;
                                white-space: nowrap;
                                font-family: var(--professional-font);
                            ">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${top10
                          .map(
                            (player, index) => `
                            <tr style="
                                ${
                                  index === 0
                                    ? "background: linear-gradient(90deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 100%);"
                                    : index === 1
                                    ? "background: linear-gradient(90deg, rgba(192, 192, 192, 0.3) 0%, rgba(192, 192, 192, 0.1) 100%);"
                                    : index === 2
                                    ? "background: linear-gradient(90deg, rgba(205, 127, 50, 0.3) 0%, rgba(205, 127, 50, 0.1) 100%);"
                                    : index % 2 === 1
                                    ? "background: rgba(139, 0, 0, 0.2);"
                                    : "background: transparent;"
                                }
                                transition: all 0.3s ease;
                            " onmouseover="this.style.background='rgba(139, 0, 0, 0.4)'; this.style.transform='scale(1.01)'" 
                               onmouseout="this.style.background='${
                                 index === 0
                                   ? "linear-gradient(90deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 100%)"
                                   : index === 1
                                   ? "linear-gradient(90deg, rgba(192, 192, 192, 0.3) 0%, rgba(192, 192, 192, 0.1) 100%)"
                                   : index === 2
                                   ? "linear-gradient(90deg, rgba(205, 127, 50, 0.3) 0%, rgba(205, 127, 50, 0.1) 100%)"
                                   : index % 2 === 1
                                   ? "rgba(139, 0, 0, 0.2)"
                                   : "transparent"
                               }'; this.style.transform='scale(1)'">
                                <td style="
                                    padding: 12px 8px;
                                    border: 1px solid rgba(255, 0, 0, 0.3);
                                    text-align: center;
                                    font-family: var(--professional-font);
                                    font-size: 0.9em;
                                    color: #FFFFFF;
                                ">${index + 1}${
                              index === 0
                                ? " 🥇"
                                : index === 1
                                ? " 🥈"
                                : index === 2
                                ? " 🥉"
                                : ""
                            }</td>
                                <td style="
                                    padding: 12px 8px;
                                    border: 1px solid rgba(255, 0, 0, 0.3);
                                    text-align: center;
                                    font-family: var(--professional-font);
                                    font-size: 0.9em;
                                    color: #FFFFFF;
                                ">${player.avatar}</td>
                                <td style="
                                    padding: 12px 8px;
                                    border: 1px solid rgba(255, 0, 0, 0.3);
                                    text-align: center;
                                    font-family: var(--professional-font);
                                    font-size: 0.9em;
                                    color: #FFFFFF;
                                ">${player.name}</td>
                                <td style="
                                    padding: 12px 8px;
                                    border: 1px solid rgba(255, 0, 0, 0.3);
                                    text-align: center;
                                    font-family: var(--professional-font);
                                    font-size: 0.9em;
                                    color: #FFFFFF;
                                ">${player.level}</td>
                                <td style="
                                    padding: 12px 8px;
                                    border: 1px solid rgba(255, 0, 0, 0.3);
                                    text-align: center;
                                    font-family: var(--professional-font);
                                    font-size: 0.9em;
                                    color: #FFFFFF;
                                ">${player.score}</td>
                                <td style="
                                    padding: 12px 8px;
                                    border: 1px solid rgba(255, 0, 0, 0.3);
                                    text-align: center;
                                    font-family: var(--professional-font);
                                    font-size: 0.9em;
                                    color: ${
                                      player.maxCombo >= 20
                                        ? "#FFD700"
                                        : player.maxCombo >= 10
                                        ? "#FFA500"
                                        : "#FF6B00"
                                    };
                                    font-weight: bold;
                                ">${
                                  player.maxCombo > 0
                                    ? `🔥${player.maxCombo}`
                                    : "-"
                                }</td>
                                <td style="
                                    padding: 12px 8px;
                                    border: 1px solid rgba(255, 0, 0, 0.3);
                                    text-align: center;
                                    font-family: var(--professional-font);
                                    font-size: 0.9em;
                                    color: #FF6B00;
                                    font-weight: bold;
                                ">${player.enemiesKilled}</td>
                                <td style="
                                    padding: 12px 8px;
                                    border: 1px solid rgba(255, 0, 0, 0.3);
                                    text-align: center;
                                    font-family: var(--professional-font);
                                    font-size: 0.9em;
                                    color: #FFFFFF;
                                ">${player.time}s</td>
                                <td style="
                                    padding: 12px 8px;
                                    border: 1px solid rgba(255, 0, 0, 0.3);
                                    text-align: center;
                                    font-family: var(--professional-font);
                                    font-size: 0.9em;
                                    color: #FFFFFF;
                                ">${
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
            <h2 style="
                color: var(--accent-color);
                font-family: var(--professional-font);
                text-shadow: 0 0 15px var(--accent-color);
                font-weight: bold;
                text-align: center;
                line-height: 1.2;
            ">❌ Error al cargar el ranking</h2>
            <p style="color: #FFFFFF; text-align: center;">No se pudo conectar con Google Sheets.</p>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="backToMenu()" class="gothic-button" style="margin-right: 10px;">Volver al Menú</button>
                <button onclick="viewRanking()" class="gothic-button">Reintentar</button>
            </div>
        `;
  }
}

// Función para incrementar contador total de enemigos
function incrementTotalEnemiesKilled() {
  totalEnemiesKilled++;
  console.log(`🎯 Total enemigos eliminados: ${totalEnemiesKilled}`);
}

// ======================================================
// FUNCIONES GLOBALES EXPUESTAS
// ======================================================

// Hacer funciones disponibles globalmente para HTML
window.startGame = startGame;
window.restartGame = restartGame;
window.backToMenu = backToMenu;
window.nextLevel = nextLevel;
window.saveScore = saveScore;
window.saveAndViewRanking = saveAndViewRanking;
window.viewRanking = viewRanking;
window.incrementTotalEnemiesKilled = incrementTotalEnemiesKilled;

// Getters para otros módulos
window.getCanvas = () => canvas;
window.getContext = () => ctx;
window.getGameTime = () => gameTime;
window.getLevel = () => level;
window.getScore = () => score;
window.setScore = (newScore) => (score = newScore);
window.isGameEnded = () => gameEnded;
window.getTotalEnemiesKilled = () => totalEnemiesKilled;

// 🔥 NUEVAS variables globales para efectos especiales
window.slowMotionActive = slowMotionActive;
window.slowMotionFactor = slowMotionFactor;
window.frenzyModeActive = frenzyModeActive;
// Función para mostrar instrucciones desde menú
window.showInstructions = () => UI.showInstructionsFromMenu();

console.log("📁 main.js ÉPICO cargado y listo para la acción!");

// Variable global para trackear la música actual
window.currentMusicTrack = "Elegía - Azkal";
window.ObjectPool = ObjectPool;
