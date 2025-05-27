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

// 🔥 Variables para efectos especiales globales
let slowMotionActive = false;
let slowMotionFactor = 1.0;

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
 * Configurar el canvas responsivo
 */
function setupCanvas() {
  canvas = document.getElementById("game-canvas");
  if (!canvas) {
    console.error("❌ Canvas no encontrado");
    return;
  }

  ctx = canvas.getContext("2d");

  // Configurar dimensiones
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";

  // Ajustar tamaños de elementos
  GameConfig.updateSizes(canvas);

  console.log(`📱 Canvas configurado: ${canvas.width}x${canvas.height}`);
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

  // Validar entrada
  if (!playerName || !playerAvatar || playerName.length < 3) {
    alert("Por favor, ingresa un nombre (mínimo 3 caracteres) y un avatar");
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

  // Mostrar instrucciones épicas
  UI.showInstructions(() => {
    // Callback cuando se confirman las instrucciones
    startGameLoop();
  });

  console.log("🚀 Juego ÉPICO iniciado");
}

/**
 * Iniciar el bucle principal del juego
 */
function startGameLoop() {
  gameEnded = false;

  // Iniciar disparo automático
  BulletManager.startAutoShoot();

  // Iniciar música de fondo
  AudioManager.startBackgroundMusic();

  // Iniciar bucle principal
  gameInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS

  // Iniciar primer nivel
  startLevel();

  console.log("🔄 Bucle de juego ÉPICO iniciado");
}

/**
 * Bucle principal del juego - ÉPICO CON COMBOS
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
    EnemyManager.update();
    PowerUpManager.update();

    // Verificar boss si es nivel 10
    if (level === 10) {
      BossManager.update();
    }

    // Restaurar factor de tiempo
    if (slowMotionActive) {
      window.slowMotionFactor = originalSlowFactor;
    }

    // Verificar colisiones
    checkCollisions();

    // Verificar si el nivel está completo
    if (EnemyManager.isLevelComplete()) {
      nextLevel();
    }

    // Dibujar elementos
    Player.draw(ctx);
    BulletManager.draw(ctx);
    EnemyManager.draw(ctx);
    PowerUpManager.draw(ctx);

    if (level === 10) {
      BossManager.draw(ctx);
    }

    // 🔥 Efectos especiales de pantalla
    drawSpecialEffects(ctx);

    // Actualizar UI
    UI.update();
  } catch (error) {
    console.error("❌ Error en game loop:", error);
  }
}

/**
 * 🔥 NUEVO: Dibuja efectos especiales en pantalla
 */
function drawSpecialEffects(ctx) {
  // Efecto de tiempo lento
  if (slowMotionActive) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 187, 255, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Líneas de velocidad
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(0, 187, 255, ${0.1 + Math.random() * 0.1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, 0);
      ctx.lineTo(Math.random() * canvas.width, canvas.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Efecto de combo alto
  if (window.ComboSystem && window.ComboSystem.getCurrentCombo() >= 20) {
    const combo = window.ComboSystem.getCurrentCombo();
    const intensity = Math.min(combo / 50, 0.1);

    ctx.save();
    ctx.fillStyle = `rgba(255, 215, 0, ${intensity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

/**
 * Verificar todas las colisiones
 */
function checkCollisions() {
  // Balas vs Enemigos
  const enemiesKilledByBullets = BulletManager.checkEnemyCollisions(
    EnemyManager.enemies
  );

  // Jugador vs Enemigos
  if (Player.checkEnemyCollisions(EnemyManager.enemies)) {
    // El jugador fue golpeado (combo roto automáticamente en Player.takeDamage)
    if (Player.getLives() <= 0) {
      gameOver();
    }
  }

  // Jugador vs Power-ups
  Player.checkPowerUpCollisions(PowerUpManager.powerUps);

  // Jugador vs Hearts
  Player.checkHeartCollisions(PowerUpManager.hearts);

  // Si es nivel 10, verificar colisiones con boss
  if (level === 10 && BossManager.isActive()) {
    BulletManager.checkBossCollisions();
    Player.checkBossCollisions();
  }
}

/**
 * Iniciar un nuevo nivel
 */
function startLevel() {
  console.log(`🎯 Iniciando nivel ÉPICO ${level}`);

  // Configurar enemigos para el nivel
  EnemyManager.setupLevel(level);

  // Si es nivel 10, preparar boss
  if (level === 10) {
    BossManager.init();
  }

  // Mostrar transición de nivel
  UI.showLevelTransition(level, () => {
    console.log(`✅ Nivel ÉPICO ${level} iniciado`);
  });
}

/**
 * Avanzar al siguiente nivel
 */
function nextLevel() {
  level++;

  if (level > GameConfig.MAX_LEVELS) {
    victory();
  } else {
    startLevel();
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

/**
 * Game Over
 */
function gameOver() {
  gameEnded = true;

  // Detener TODOS los intervalos y sistemas
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  BulletManager.stopAutoShoot();
  AudioManager.stopBackgroundMusic();

  // NUEVO: Limpiar sistemas completamente
  ComboSystem.cleanup();

  // Mostrar pantalla de game over
  const maxCombo = ComboSystem.getMaxCombo();
  UI.showGameOver(false, score, level, maxCombo);
  AudioManager.playSound("gameOver");

  console.log(`💀 Game Over - Combo máximo: ${maxCombo}`);
}

/**
 * Victoria
 */
function victory() {
  gameEnded = true;

  // Detener TODOS los intervalos y sistemas
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  BulletManager.stopAutoShoot();
  AudioManager.stopBackgroundMusic();

  // Celebración épica con combo
  const maxCombo = ComboSystem.getMaxCombo();
  UI.showGameOver(true, score, level, maxCombo);
  AudioManager.playSound("victory");

  // Efecto de celebración más épico
  UI.celebrationEffect();

  console.log(`🏆 Victoria ÉPICA! - Combo máximo: ${maxCombo}`);
}

/**
 * Reiniciar juego
 */
function restartGame() {
  // CORRECCIÓN: Ocultar pantalla de game over PRIMERO
  const gameOverScreen = document.getElementById("game-over");
  if (gameOverScreen) {
    gameOverScreen.style.display = "none";
  }

  resetGameState();
  startGame();
}

/**
 * Resetear estado del juego - CON COMBOS
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

  // 🔥 Resetear efectos especiales
  slowMotionActive = false;
  slowMotionFactor = 1.0;

  // Resetear módulos
  Player.reset();
  BulletManager.reset();
  EnemyManager.reset();
  PowerUpManager.reset();
  BossManager.reset();
  UI.reset();
  ComboSystem.reset(); // 🔥 NUEVO

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
  AudioManager.stopBackgroundMusic();
  ComboSystem.cleanup(); // 🔥 NUEVO
}

/**
 * Volver al menú principal
 */
function backToMenu() {
  resetGameState();

  document.getElementById("game-area").style.display = "none";
  document.getElementById("ranking-container").style.display = "none";
  document.getElementById("main-menu").style.display = "block";

  UI.centerMainMenu();
}

// ======================================================
// SISTEMA DE RANKING MEJORADO
// ======================================================

// URL de tu Web App de Google Sheets
const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycby4EeSEWs_IYpIDC1dQCGGuWemC7U8O6yhgaACcxnqxIqXc4wFvclHjkiOyqbj9FwOG/exec";

// Variables de control de guardado
let scoreAlreadySaved = false;
let isSaving = false;

/**
 * Guarda la puntuación en Google Sheets - CON COMBO MÁXIMO
 */
async function saveScore() {
  console.log("🚀 Guardando puntuación ÉPICA...");

  try {
    const playerName = Player.getName();
    const playerAvatar = Player.getAvatar();

    if (!playerName || !playerAvatar) {
      throw new Error("Datos del jugador incompletos");
    }

    const params = new URLSearchParams();
    params.append("action", "save");
    params.append("date", new Date().toISOString());
    params.append("avatar", playerAvatar);
    params.append("name", playerName);
    params.append("level", level);
    params.append("enemiesKilled", EnemyManager.getEnemiesKilled());
    params.append("time", Math.floor(gameTime / 60));
    params.append("score", score);
    params.append("maxCombo", ComboSystem.getMaxCombo()); // 🔥 NUEVO
    params.append(
      "status",
      document.getElementById("game-over-text").textContent.includes("VICTORIA")
        ? "Victoria"
        : "Derrota"
    );

    const urlWithParams = `${WEBAPP_URL}?${params.toString()}`;
    console.log("📡 Enviando a:", urlWithParams);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(urlWithParams, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const result = await response.json();

    if (result.success) {
      console.log("✅ Guardado ÉPICO exitoso");
      alert("¡Puntuación ÉPICA guardada con éxito! 🎉");
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
 * Muestra el ranking desde Google Sheets - CON COMBOS
 */
async function viewRanking() {
  try {
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("game-area").style.display = "none";

    const rankingContainer = document.getElementById("ranking-container");
    rankingContainer.style.display = "block";
    rankingContainer.innerHTML = `<h2>⌛ Cargando ranking ÉPICO... ⌛</h2>`;

    const response = await fetch(WEBAPP_URL);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Error al obtener datos");
    }

    const players = result.data || [];

    if (players.length === 0) {
      rankingContainer.innerHTML = `
                <h2>📊 Ranking ÉPICO de Jugadores</h2>
                <p style="text-align: center;">No hay puntuaciones registradas aún.</p>
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
      maxCombo: parseInt(player.maxCombo) || 0, // 🔥 NUEVO
      status: player.status || "Derrota",
    }));

    // Ordenar por puntuación, luego por combo máximo
    const sortedPlayers = processedPlayers.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.maxCombo !== a.maxCombo) {
        return b.maxCombo - a.maxCombo;
      }
      return a.time - b.time;
    });

    const top10 = sortedPlayers.slice(0, 10);

    rankingContainer.innerHTML = `
            <h2>🏆 Ranking ÉPICO de Jugadores 🏆</h2>
            <table>
                <tr>
                    <th>Pos</th>
                    <th>Avatar</th>
                    <th>Nombre</th>
                    <th>Nivel</th>
                    <th>Score</th>
                    <th>Combo Max</th>
                    <th>Tiempo</th>
                    <th>Estado</th>
                </tr>
                ${top10
                  .map(
                    (player, index) => `
                    <tr ${
                      index < 3
                        ? 'style="background-color: rgba(255, 215, 0, 0.2);"'
                        : ""
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
                        <td>${player.score}</td>
                        <td style="color: #FFD700; font-weight: bold;">${
                          player.maxCombo
                        }</td>
                        <td>${player.time}s</td>
                        <td>${player.status === "Victoria" ? "🏆" : "💀"}</td>
                    </tr>
                `
                  )
                  .join("")}
            </table>
            <div style="margin-top: 20px; text-align: center;">
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
            <button onclick="backToMenu()" class="gothic-button">Volver al Menú</button>
            <button onclick="viewRanking()" class="gothic-button">Reintentar</button>
        `;
  }
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

// Getters para otros módulos
window.getCanvas = () => canvas;
window.getContext = () => ctx;
window.getGameTime = () => gameTime;
window.getLevel = () => level;
window.getScore = () => score;
window.setScore = (newScore) => (score = newScore);
window.isGameEnded = () => gameEnded;

// 🔥 NUEVAS variables globales para efectos especiales
window.slowMotionActive = slowMotionActive;
window.slowMotionFactor = slowMotionFactor;

console.log("📁 main.js ÉPICO cargado y listo para la acción!");
