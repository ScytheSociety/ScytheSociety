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

// ======================================================
// INICIALIZACIÓN DEL JUEGO
// ======================================================

window.onload = function () {
  console.log("🎮 Hell Shooter ÉPICO - Iniciando juego...");

  // Detectar dispositivo
  GameConfig.detectDevice();

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
 * REEMPLAZA LA FUNCIÓN setupCanvas() en main.js
 * Configurar el canvas - RESOLUCIÓN COMPLETA PARA TODOS
 */
function setupCanvas() {
  canvas = document.getElementById("game-canvas");
  if (!canvas) {
    console.error("❌ Canvas no encontrado");
    return;
  }

  ctx = canvas.getContext("2d");

  // 🔥 RESOLUCIÓN COMPLETA PARA TODOS - Sin reducir en móvil
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";

  GameConfig.updateSizes(canvas);
  console.log(
    `📱 Canvas ALTA CALIDAD configurado: ${canvas.width}x${canvas.height} (IDÉNTICO PC/MÓVIL)`
  );
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

  BulletManager.startAutoShoot();
  if (!AudioManager.isBackgroundMusicPlaying()) {
    AudioManager.startBackgroundMusic();
  }

  // 🔥 CREAR TICKER SOLO CUANDO EMPIEZA EL JUEGO
  setTimeout(() => {
    UI.createMusicTicker();
  }, 500);

  gameInterval = setInterval(gameLoop, 1000 / 60);

  startLevel();

  const totalDisplay = document.getElementById("total-enemies-display");
  if (totalDisplay) {
    totalDisplay.style.display = "block";
  }

  console.log("🔄 Bucle de juego ÉPICO iniciado");
}

/**
 * REEMPLAZA SOLO LA FUNCIÓN gameLoop() en main.js
 * Bucle principal del juego - IDÉNTICO PARA PC Y MÓVIL
 */
function gameLoop() {
  if (gameEnded) return;

  try {
    // 🔥 ELIMINADO: Toda la detección de móvil que ralentizaba

    gameTime++;

    // 🔥 IDÉNTICO: Actualizar sistema de combos siempre igual
    if (gameTime % 3 === 0) {
      ComboSystem.update();
    }

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🔥 IDÉNTICO: Dibujar fondo igual para todos
    drawBackground();

    // 🔥 Aplicar efectos de tiempo lento si está activo
    const originalSlowFactor = window.slowMotionFactor;
    if (slowMotionActive) {
      window.slowMotionFactor = slowMotionFactor;
    }

    // 🔥 IDÉNTICO: Actualizar sistemas de juego sin diferencias
    Player.update();
    BulletManager.update();

    // 🔥 ACTUALIZAR enemigos normales SOLO si NO es nivel 11, O si es nivel 11 para esbirros
    if (level < 11) {
      EnemyManager.update();
    } else if (level === 11) {
      if (EnemyManager.enemies.length > 0) {
        EnemyManager.update();
      }
    }

    // 🔥 IDÉNTICO: Power-ups igual para todos
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
      return;
    }

    // 🔥 Verificar nivel completo SOLO para niveles 1-10
    if (level <= 10 && EnemyManager.isLevelComplete()) {
      nextLevel();
    }

    // 🔥 IDÉNTICO: Dibujar elementos igual para todos
    Player.draw(ctx);
    BulletManager.draw(ctx);

    // 🔥 Dibujar enemigos normales SOLO si NO es nivel 11, O si hay esbirros
    if (level < 11) {
      EnemyManager.draw(ctx);
    } else if (level === 11 && EnemyManager.enemies.length > 0) {
      EnemyManager.draw(ctx);
    }

    // 🔥 IDÉNTICO: Power-ups igual para todos
    PowerUpManager.draw(ctx);

    // 🔥 SOLO dibujar boss si es nivel 11
    if (level === 11) {
      BossManager.draw(ctx);
    }

    // 🔥 IDÉNTICO: Efectos especiales igual para todos
    drawSpecialEffects(ctx);

    // 🔥 IDÉNTICO: Actualizar UI igual para todos
    UI.update();
  } catch (error) {
    console.error("❌ Error en game loop:", error);
  }
}

/**
 * REEMPLAZA LA FUNCIÓN drawSpecialEffects() en main.js
 * Efectos especiales simplificados - IDÉNTICO PC/MÓVIL
 */
function drawSpecialEffects(ctx) {
  // 🌊 Efecto de tiempo lento - SIMPLIFICADO
  if (window.slowMotionActive) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 119, 255, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // 🔥 Efecto de modo frenesí - SIMPLIFICADO
  if (window.frenzyModeActive) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 80, 0, 0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // ⚡ Efecto de combo alto - SIMPLIFICADO
  if (window.ComboSystem && window.ComboSystem.getCurrentCombo() >= 20) {
    const combo = window.ComboSystem.getCurrentCombo();
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
 * Inicia el nivel del boss final - REDISEÑADO
 */
function startBossLevel() {
  console.log("👹 === INICIANDO BOSS FINAL NIVEL 11 ===");

  // Limpiar enemigos inmediatamente
  console.log(`🧹 Limpiando ${EnemyManager.enemies.length} enemigos restantes`);
  EnemyManager.enemies = [];
  EnemyManager.enemiesKilled = 0;
  EnemyManager.spawnTimer = 0;
  EnemyManager.currentSpawnDelay = 999999;

  console.log("🧹 Enemigos normales eliminados y spawn detenido para nivel 11");

  // Inicializar boss después de delay
  setTimeout(() => {
    console.log("👹 Inicializando BossManager para nivel 11...");
    BossManager.init();

    // Mostrar transición épica
    UI.showLevelTransition("👹 BOSS FINAL 👹", () => {
      console.log(
        "👹 Boss Final activo en nivel 11 - Sistema con fases temporales!"
      );
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

  // 🔥 COMENTARIO DEL BOSS SI ESTÁ ACTIVO - CORREGIDO
  if (level === 11 && BossManager.isActive()) {
    if (BossManager.comments && BossManager.comments.sayRandomComment) {
      BossManager.comments.sayRandomComment("victoria_boss");
    }
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

// 🔥 MODIFICAR restartGame para incluir limpieza
function restartGame() {
  console.log("🔄 Reiniciando juego...");

  // 🔥 LIMPIAR ELEMENTOS DEL BOSS PRIMERO
  cleanupBossElements();

  // OCULTAR GAME OVER INMEDIATAMENTE
  const gameOverScreen = document.getElementById("game-over");
  if (gameOverScreen) {
    gameOverScreen.style.display = "none";
    gameOverScreen.innerHTML = "";
  }

  // FORZAR DETENCIÓN COMPLETA
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
 * Resetea estado del juego - CORREGIDO PARA COMBOS Y BOSS
 */
function resetGameState() {
  console.log("🔄 Reseteando estado del juego...");

  // 🔥 LIMPIAR ELEMENTOS DEL BOSS PRIMERO
  cleanupBossElements();

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

  // Resetear módulos EN EL ORDEN CORRECTO
  Player.reset();
  BulletManager.reset();
  EnemyManager.reset();
  PowerUpManager.reset();

  // 🔥 RESET COMPLETO DEL BOSS
  if (window.BossManager) {
    BossManager.reset();
  }

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

  console.log("🔄 Estado del juego COMPLETAMENTE reseteado");
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
 * CORREGIDO: Limpiar SOLO elementos del boss, NO los enemigos normales
 */
function cleanupBossElements() {
  console.log("🧹 Limpiando elementos del boss...");

  try {
    // 🔥 RESET FORZADO DEL BOSS con verificaciones
    if (window.BossManager && typeof window.BossManager === "object") {
      if (typeof window.BossManager.forceReset === "function") {
        window.BossManager.forceReset();
      } else if (typeof window.BossManager.reset === "function") {
        window.BossManager.reset();
      }
    }
  } catch (error) {
    console.warn("⚠️ Error en reset del boss:", error);
  }

  // Limpiar botones Yan Ken Po
  try {
    const yankenpoContainer = document.getElementById("yankenpo-container");
    if (yankenpoContainer && yankenpoContainer.parentNode) {
      yankenpoContainer.parentNode.removeChild(yankenpoContainer);
      console.log("✅ Botones Yan Ken Po eliminados");
    }
  } catch (error) {
    console.warn("⚠️ Error eliminando Yan Ken Po:", error);
  }

  // Limpiar mensajes del boss
  try {
    const bossMessage = document.getElementById("boss-speech-bubble");
    if (bossMessage && bossMessage.parentNode) {
      bossMessage.parentNode.removeChild(bossMessage);
      console.log("✅ Mensaje del boss eliminado");
    }
  } catch (error) {
    console.warn("⚠️ Error eliminando mensaje boss:", error);
  }

  // Limpiar listeners globales del boss
  try {
    if (window.BossManager && window.BossManager.yanKenPoKeyListener) {
      document.removeEventListener(
        "keydown",
        window.BossManager.yanKenPoKeyListener,
        true
      );
      document.removeEventListener(
        "keypress",
        window.BossManager.yanKenPoKeyListener,
        true
      );
      window.removeEventListener(
        "keydown",
        window.BossManager.yanKenPoKeyListener,
        true
      );
      window.BossManager.yanKenPoKeyListener = null;
      console.log("✅ Listeners del boss eliminados");
    }
  } catch (error) {
    console.warn("⚠️ Error eliminando listeners:", error);
  }

  // 🔥 ASEGURAR QUE LA VELOCIDAD DEL JUGADOR SEA NORMAL
  try {
    if (window.Player && typeof window.Player === "object") {
      window.Player.moveSpeed = 1.0;
      console.log("✅ Velocidad del jugador restaurada");
    }
  } catch (error) {
    console.warn("⚠️ Error restaurando velocidad jugador:", error);
  }

  // 🔥 LIMPIAR SOLO ESBIRROS DEL BOSS, NO TODOS LOS ENEMIGOS
  try {
    if (window.EnemyManager && window.EnemyManager.enemies) {
      // Solo eliminar enemigos que sean esbirros del boss
      const originalCount = window.EnemyManager.enemies.length;
      window.EnemyManager.enemies = window.EnemyManager.enemies.filter(
        (enemy) => !enemy.isBossMinion && !enemy.type === "boss_minion"
      );
      const newCount = window.EnemyManager.enemies.length;

      if (originalCount !== newCount) {
        console.log(
          `✅ Solo esbirros del boss eliminados: ${
            originalCount - newCount
          } esbirros`
        );
      }
    }
  } catch (error) {
    console.warn("⚠️ Error eliminando esbirros del boss:", error);
  }

  // 🔥 LIMPIAR CUALQUIER ELEMENTO RESIDUAL DEL BOSS
  try {
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

    console.log("✅ Elementos residuales del boss limpiados");
  } catch (error) {
    console.warn("⚠️ Error limpiando elementos residuales:", error);
  }
}

// 🔥 MODIFICAR la función backToMenu para incluir limpieza
function backToMenu() {
  console.log("🏠 Volviendo al menú principal...");

  // FORZAR DETENCIÓN COMPLETA DEL JUEGO
  gameEnded = true;

  // 🔥 LIMPIAR ELEMENTOS DEL BOSS PRIMERO
  cleanupBossElements();

  // OCULTAR Y LIMPIAR GAME OVER INMEDIATAMENTE
  const gameOverScreen = document.getElementById("game-over");
  if (gameOverScreen) {
    gameOverScreen.style.display = "none";
    gameOverScreen.innerHTML = "";
  }

  // LIMPIAR COMBO DISPLAY ANTES DE RESETEAR
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
// 🔥 MODIFICAR viewRanking para incluir limpieza
async function viewRanking() {
  try {
    // 🔥 LIMPIAR ELEMENTOS DEL BOSS PRIMERO
    cleanupBossElements();

    // NUEVO: Eliminar ticker inmediatamente
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

/**
 * Listeners globales CORREGIDOS - SIN CLEANUP AUTOMÁTICO
 */
function setupGlobalCleanupListeners() {
  // 🔥 SOLO limpiar antes de cerrar/recargar la página
  window.addEventListener("beforeunload", () => {
    // Solo limpiar si el juego realmente terminó
    if (gameEnded) {
      cleanupBossElements();
    }
  });

  // 🔥 SOLO limpiar en errores críticos
  window.addEventListener("error", (e) => {
    // Solo si es un error realmente crítico
    if (e.message && e.message.includes("boss") && gameEnded) {
      cleanupBossElements();
    }
  });

  console.log("🔧 Listeners globales CORREGIDOS configurados");
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

/**
 * Verificar si el juego ha terminado - NUEVO
 */
window.isGameEnded = function () {
  return gameEnded;
};
