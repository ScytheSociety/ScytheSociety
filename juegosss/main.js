/**
 * Hell Shooter - Main Game File
 * Archivo principal que coordina todos los módulos del juego
 */

// ======================================================
// IMPORTS - Cargar todos los módulos
// ======================================================

// Se cargarán automáticamente por los tags script en el HTML
// config.js, player.js, enemies.js, bullets.js, powerups.js, boss.js, ui.js, audio.js

// ======================================================
// VARIABLES GLOBALES PRINCIPALES
// ======================================================

let canvas, ctx;
let gameInterval;
let gameTime = 0;
let level = 1;
let score = 0;
let gameEnded = false;

// ======================================================
// INICIALIZACIÓN DEL JUEGO
// ======================================================

window.onload = function () {
  console.log("🎮 Hell Shooter - Iniciando juego...");

  // Detectar dispositivo
  GameConfig.detectDevice();

  // Configurar canvas
  setupCanvas();

  // Inicializar módulos
  AudioManager.init();
  UI.init();

  // Precargar recursos
  loadGameAssets();

  // Configurar eventos
  setupEventListeners();

  console.log("✅ Juego inicializado correctamente");
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

      // Cargar imagen del jugador
      GameConfig.playerImage = new Image();
      GameConfig.playerImage.src = data.player;

      // Cargar imagen de bala
      GameConfig.bulletImage = new Image();
      GameConfig.bulletImage.src = data.bullet;

      console.log("✅ Recursos cargados");
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

  console.log("🔄 Imágenes de respaldo creadas");
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

  // Mostrar instrucciones
  UI.showInstructions(() => {
    // Callback cuando se confirman las instrucciones
    startGameLoop();
  });

  console.log("🚀 Juego iniciado");
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

  console.log("🔄 Bucle de juego iniciado");
}

/**
 * Bucle principal del juego
 */
function gameLoop() {
  if (gameEnded) return;

  try {
    // Actualizar tiempo
    gameTime++;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar fondo
    drawBackground();

    // Actualizar sistemas de juego
    Player.update();
    BulletManager.update();
    EnemyManager.update();
    PowerUpManager.update();

    // Verificar boss si es nivel 10
    if (level === 10) {
      BossManager.update();
    }

    // Verificar colisiones
    checkCollisions();

    // Dibujar elementos
    Player.draw(ctx);
    BulletManager.draw(ctx);
    EnemyManager.draw(ctx);
    PowerUpManager.draw(ctx);

    if (level === 10) {
      BossManager.draw(ctx);
    }

    // Actualizar UI
    UI.update();
  } catch (error) {
    console.error("❌ Error en game loop:", error);
  }
}

/**
 * Verificar todas las colisiones
 */
function checkCollisions() {
  // Balas vs Enemigos
  BulletManager.checkEnemyCollisions(EnemyManager.enemies);

  // Jugador vs Enemigos
  if (Player.checkEnemyCollisions(EnemyManager.enemies)) {
    // El jugador fue golpeado
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
  console.log(`🎯 Iniciando nivel ${level}`);

  // Configurar enemigos para el nivel
  EnemyManager.setupLevel(level);

  // Si es nivel 10, preparar boss
  if (level === 10) {
    BossManager.init();
  } else {
    // Reiniciar sistemas para nuevo nivel
    PowerUpManager.reset();
  }

  // Mostrar transición de nivel
  UI.showLevelTransition(level, () => {
    // Callback cuando termina la transición
    console.log(`✅ Nivel ${level} iniciado`);
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
 * Game Over - VERSIÓN ACTUALIZADA
 */
function gameOver() {
  gameEnded = true;

  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  BulletManager.stopAutoShoot();
  AudioManager.stopBackgroundMusic();

  // Mostrar pantalla de game over
  UI.showGameOver(false, score, level);
  AudioManager.playSound("gameOver");

  console.log("💀 Game Over");
}

/**
 * Victoria - VERSIÓN ACTUALIZADA
 */
function victory() {
  gameEnded = true;

  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  BulletManager.stopAutoShoot();
  AudioManager.stopBackgroundMusic();

  // Mostrar pantalla de victoria
  UI.showGameOver(true, score, level);
  AudioManager.playSound("victory");

  // Efecto de celebración
  UI.celebrationEffect();

  console.log("🏆 Victoria!");
}

/**
 * Reiniciar juego
 */
function restartGame() {
  resetGameState();
  startGame();
}

/**
 * Resetear estado del juego - VERSIÓN ACTUALIZADA
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

  // Resetear módulos
  Player.reset();
  BulletManager.reset();
  EnemyManager.reset();
  PowerUpManager.reset();
  BossManager.reset();
  UI.reset();

  console.log("🔄 Estado del juego reseteado");
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
// SISTEMA DE RANKING - AGREGAR ESTO A main.js
// ======================================================

// URL de tu Web App de Google Sheets
const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycby4EeSEWs_IYpIDC1dQCGGuWemC7U8O6yhgaACcxnqxIqXc4wFvclHjkiOyqbj9FwOG/exec";

// Variables de control de guardado
let scoreAlreadySaved = false;
let isSaving = false;

/**
 * Guarda la puntuación en Google Sheets
 */
async function saveScore() {
  console.log("🚀 Guardando puntuación...");

  try {
    // Validar datos antes de enviar
    const playerName = Player.getName();
    const playerAvatar = Player.getAvatar();

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
    params.append("enemiesKilled", EnemyManager.getEnemiesKilled());
    params.append("time", Math.floor(gameTime / 60));
    params.append("score", score);
    params.append(
      "status",
      document.getElementById("game-over-text").textContent.includes("VICTORIA")
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
 * Guarda puntuación y muestra ranking
 */
async function saveAndViewRanking() {
  // Verificar si ya se guardó o se está guardando
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

/**
 * Muestra el ranking desde Google Sheets
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
                <p style="text-align: center;">No hay puntuaciones registradas aún.</p>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="backToMenu()" class="gothic-button">Volver al Menú</button>
                </div>
            `;
      return;
    }

    // Procesar datos usando los nombres de columnas exactos
    const processedPlayers = players.map((player) => ({
      date: player.date || "",
      avatar: player.avatar || "👤",
      name: player.name || "Anónimo",
      level: parseInt(player.level) || 1,
      enemiesKilled: parseInt(player.enemiesKilled) || 0,
      time: parseInt(player.time) || 0,
      score: parseInt(player.score) || 0,
      status: player.status || "Derrota",
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
            <p>Detalles: ${error.message}</p>
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

console.log("📁 main.js cargado correctamente");
