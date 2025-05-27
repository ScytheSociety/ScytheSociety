/**
 * Hell Shooter - Enemy Management
 * Sistema de enemigos con tamaños variables
 */

const EnemyManager = {
  // ======================================================
  // ESTADO DE ENEMIGOS
  // ======================================================

  enemies: [],

  // Control de spawn
  spawnTimer: 0,
  currentSpawnDelay: 60,

  // Progreso del nivel
  enemiesKilled: 0,
  enemiesRequired: 0,

  // Sistemas especiales
  waveInProgress: false,
  lastWaveTime: 0,

  // ======================================================
  // CONFIGURACIÓN DE NIVEL
  // ======================================================

  /**
   * Configura el nivel actual
   */
  setupLevel(level) {
    const config = GameConfig.getLevelConfig(level);

    this.enemiesRequired = config.enemiesRequired;
    this.currentSpawnDelay = config.spawnDelay;
    this.enemiesKilled = 0;
    this.spawnTimer = 0;

    // No limpiar enemigos existentes para continuidad
    console.log(
      `👹 Nivel ${level} configurado: ${this.enemiesRequired} enemigos requeridos`
    );
  },

  /**
   * Verifica si el nivel está completo
   */
  isLevelComplete() {
    return this.enemiesKilled >= this.enemiesRequired;
  },

  // ======================================================
  // CREACIÓN DE ENEMIGOS
  // ======================================================

  /**
   * Crea un enemigo estándar
   */
  spawnEnemy() {
    const canvas = window.getCanvas();
    const level = window.getLevel();

    // Tamaño base aleatorio con variación
    const baseSize =
      GameConfig.ENEMY_MIN_SIZE +
      Math.random() * (GameConfig.ENEMY_MAX_SIZE - GameConfig.ENEMY_MIN_SIZE);

    // Aplicar variación de tamaño aleatoria
    const finalSize = GameConfig.getRandomEnemySize(baseSize);

    // Posición inicial
    const x = Math.random() * (canvas.width - finalSize);
    const y = -finalSize;

    // Velocidad basada en nivel y tamaño (enemigos más pequeños son más rápidos)
    const levelSpeedFactor = 1 + level * 0.15;
    const sizeSpeedFactor = Math.max(0.7, baseSize / finalSize); // Más pequeño = más rápido
    const baseSpeed = canvas.height * GameConfig.ENEMY_CONFIG.baseSpeed;
    const finalSpeed = baseSpeed * levelSpeedFactor * sizeSpeedFactor;

    // Ángulo de movimiento (principalmente hacia abajo)
    const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6; // ±30 grados de vertical

    const enemy = {
      x: x,
      y: y,
      width: finalSize,
      height: finalSize,
      velocityX: Math.sin(angle) * finalSpeed * (0.8 + Math.random() * 0.4),
      velocityY: Math.abs(Math.cos(angle) * finalSpeed),

      // Propiedades visuales
      image: this.getEnemyImage(level),
      originalSize: baseSize,
      sizeScale: finalSize / baseSize,

      // Propiedades de movimiento
      speedFactor: 1.0,
      bounceCount: 0,
      maxBounces: 3 + Math.floor(Math.random() * 3),

      // Metadatos
      level: level,
      spawnTime: window.getGameTime(),
      type: "normal",
    };

    this.enemies.push(enemy);

    // Posibilidad de spawns adicionales en niveles altos
    if (level >= 5 && Math.random() < 0.15) {
      this.spawnClusterEnemies(2, enemy.x, enemy.y);
    }
  },

  /**
   * Crea enemigos en cluster (grupo)
   */
  spawnClusterEnemies(count, centerX, centerY) {
    const canvas = window.getCanvas();

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const offset = (Math.random() - 0.5) * 150;
        const x = Math.max(0, Math.min(canvas.width - 50, centerX + offset));

        this.spawnEnemyAt(x, centerY - 50);
      }, i * 200);
    }
  },

  /**
   * Crea un enemigo en posición específica
   */
  spawnEnemyAt(x, y) {
    const canvas = window.getCanvas();
    const level = window.getLevel();

    const baseSize =
      GameConfig.ENEMY_MIN_SIZE +
      Math.random() * (GameConfig.ENEMY_MAX_SIZE - GameConfig.ENEMY_MIN_SIZE);
    const finalSize = GameConfig.getRandomEnemySize(baseSize);

    // Asegurar que esté dentro del canvas
    x = Math.max(0, Math.min(canvas.width - finalSize, x));
    y = Math.max(-finalSize, y);

    const levelSpeedFactor = 1 + level * 0.1;
    const baseSpeed = canvas.height * GameConfig.ENEMY_CONFIG.baseSpeed;

    const enemy = {
      x: x,
      y: y,
      width: finalSize,
      height: finalSize,
      velocityX: (Math.random() - 0.5) * baseSpeed * levelSpeedFactor,
      velocityY: baseSpeed * levelSpeedFactor * (0.8 + Math.random() * 0.4),

      image: this.getEnemyImage(level),
      originalSize: baseSize,
      sizeScale: finalSize / baseSize,
      speedFactor: 1.0,
      bounceCount: 0,
      maxBounces: 2,

      level: level,
      spawnTime: window.getGameTime(),
      type: "cluster",
    };

    this.enemies.push(enemy);
  },

  // ======================================================
  // OLEADAS ESPECIALES
  // ======================================================

  /**
   * Intenta crear una oleada de enemigos
   */
  trySpawnWave() {
    const gameTime = window.getGameTime();

    // Evitar oleadas muy frecuentes
    if (this.waveInProgress || gameTime - this.lastWaveTime < 1800) {
      // 30 segundos
      return;
    }

    // Probabilidad basada en nivel
    const level = window.getLevel();
    const waveChance = Math.min(0.001 + level * 0.0002, 0.005);

    if (Math.random() < waveChance) {
      this.spawnWave();
    }
  },

  /**
   * Crea una oleada de enemigos
   */
  spawnWave() {
    this.waveInProgress = true;
    this.lastWaveTime = window.getGameTime();

    const level = window.getLevel();
    const waveSize = Math.min(3 + Math.floor(level / 2), 6);

    UI.showScreenMessage("🌊 ¡OLEADA ENEMIGA! 🌊", "#FF4444");
    AudioManager.playSound("special");

    // Crear enemigos de la oleada con delay
    for (let i = 0; i < waveSize; i++) {
      setTimeout(() => {
        if (!window.isGameEnded()) {
          const canvas = window.getCanvas();
          const x = Math.random() * (canvas.width - 60);
          this.spawnWaveEnemy(x, -60);
        }
      }, i * 300);
    }

    // Resetear flag de oleada
    setTimeout(() => {
      this.waveInProgress = false;
    }, waveSize * 300 + 2000);

    console.log(`🌊 Oleada de ${waveSize} enemigos spawneada`);
  },

  /**
   * Crea un enemigo de oleada (más agresivo)
   */
  spawnWaveEnemy(x, y) {
    const level = window.getLevel();
    const canvas = window.getCanvas();

    const size = GameConfig.ENEMY_MIN_SIZE + Math.random() * 30;
    const finalSize = GameConfig.getRandomEnemySize(size);
    const speed = canvas.height * 0.008; // Más rápidos que normales

    const enemy = {
      x: x,
      y: y,
      width: finalSize,
      height: finalSize,
      velocityX: (Math.random() - 0.5) * speed,
      velocityY: speed * (1.2 + Math.random() * 0.3),

      image: this.getEnemyImage(level),
      originalSize: size,
      sizeScale: finalSize / size,
      speedFactor: 1.3, // Más agresivos
      bounceCount: 0,
      maxBounces: 4,

      level: level,
      spawnTime: window.getGameTime(),
      type: "wave",
      isWaveEnemy: true,
    };

    this.enemies.push(enemy);
  },

  // ======================================================
  // ACTUALIZACIÓN Y MOVIMIENTO
  // ======================================================

  /**
   * Actualiza todos los enemigos
   */
  update() {
    // Actualizar spawn timer
    this.updateSpawning();

    // Intentar oleadas especiales
    this.trySpawnWave();

    // Actualizar posiciones y física
    this.updateEnemyMovement();

    // Limpiar enemigos fuera de pantalla (en la parte inferior)
    this.cleanupEnemies();
  },

  /**
   * Controla el spawn de enemigos
   */
  updateSpawning() {
    // No spawnar si el nivel está completo o si hay demasiados enemigos
    if (this.isLevelComplete() || this.enemies.length > 40) {
      return;
    }

    this.spawnTimer++;

    if (this.spawnTimer >= this.currentSpawnDelay) {
      this.spawnEnemy();
      this.spawnTimer = 0;

      // Spawn adicional en niveles altos
      const level = window.getLevel();
      if (level >= 6 && Math.random() < 0.3) {
        setTimeout(() => this.spawnEnemy(), 100);
      }
    }
  },

  /**
   * Actualiza el movimiento de todos los enemigos
   */
  updateEnemyMovement() {
    const canvas = window.getCanvas();

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];

      // Actualizar posición
      enemy.x += enemy.velocityX;
      enemy.y += enemy.velocityY;

      // Física de rebotes
      this.handleEnemyBounces(enemy, canvas);

      // Colisiones entre enemigos (solo cada 3 frames para performance)
      if (window.getGameTime() % 3 === 0) {
        this.handleEnemyCollisions(enemy, i);
      }

      // Variación aleatoria ocasional
      this.applyRandomMovement(enemy);
    }
  },

  /**
   * Maneja los rebotes de un enemigo
   */
  handleEnemyBounces(enemy, canvas) {
    const bounceConfig = GameConfig.ENEMY_CONFIG;
    let bounced = false;

    // Rebote en paredes laterales
    if (enemy.x <= 0) {
      enemy.velocityX = Math.abs(enemy.velocityX) * bounceConfig.wallBounce;
      enemy.x = 0;
      bounced = true;
    } else if (enemy.x + enemy.width >= canvas.width) {
      enemy.velocityX = -Math.abs(enemy.velocityX) * bounceConfig.wallBounce;
      enemy.x = canvas.width - enemy.width;
      bounced = true;
    }

    // Rebote en techo
    if (enemy.y <= 0) {
      enemy.velocityY = Math.abs(enemy.velocityY) * bounceConfig.wallBounce;
      enemy.y = 0;
      bounced = true;
    }

    // Rebote en suelo (volver hacia arriba)
    if (enemy.y + enemy.height >= canvas.height) {
      enemy.velocityY = -Math.abs(enemy.velocityY) * bounceConfig.wallBounce;
      enemy.y = canvas.height - enemy.height;
      enemy.velocityX += (Math.random() - 0.5) * (canvas.width * 0.002);
      bounced = true;
    }

    // Contar rebotes
    if (bounced) {
      enemy.bounceCount++;

      // Aumentar agresividad después de varios rebotes
      if (enemy.bounceCount >= enemy.maxBounces) {
        enemy.speedFactor = Math.min(enemy.speedFactor * 1.1, 1.5);
        enemy.bounceCount = 0;
      }
    }

    // Limitar velocidad máxima
    const maxSpeed = canvas.height * bounceConfig.maxSpeed;
    const currentSpeed = Math.sqrt(enemy.velocityX ** 2 + enemy.velocityY ** 2);

    if (currentSpeed > maxSpeed) {
      const ratio = maxSpeed / currentSpeed;
      enemy.velocityX *= ratio;
      enemy.velocityY *= ratio;
    }
  },

  /**
   * Maneja colisiones entre enemigos
   */
  handleEnemyCollisions(enemy, currentIndex) {
    for (let j = currentIndex + 1; j < this.enemies.length; j++) {
      const otherEnemy = this.enemies[j];

      if (this.checkCollision(enemy, otherEnemy)) {
        this.resolveEnemyCollision(enemy, otherEnemy);
      }
    }
  },

  /**
   * Resuelve colisión entre dos enemigos
   */
  resolveEnemyCollision(enemy1, enemy2) {
    const bounceConfig = GameConfig.ENEMY_CONFIG;

    // Calcular vector de separación
    const dx = enemy2.x + enemy2.width / 2 - (enemy1.x + enemy1.width / 2);
    const dy = enemy2.y + enemy2.height / 2 - (enemy1.y + enemy1.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    // Normalizar
    const nx = dx / distance;
    const ny = dy / distance;

    // Intercambiar componentes de velocidad
    const bounceMultiplier = bounceConfig.enemyBounce;

    const p1 = enemy1.velocityX * nx + enemy1.velocityY * ny;
    const p2 = enemy2.velocityX * nx + enemy2.velocityY * ny;

    enemy1.velocityX = (enemy1.velocityX + nx * (p2 - p1)) * bounceMultiplier;
    enemy1.velocityY = (enemy1.velocityY + ny * (p2 - p1)) * bounceMultiplier;

    enemy2.velocityX = (enemy2.velocityX + nx * (p1 - p2)) * bounceMultiplier;
    enemy2.velocityY = (enemy2.velocityY + ny * (p1 - p2)) * bounceMultiplier;

    // Aumentar factor de velocidad
    enemy1.speedFactor = Math.min(enemy1.speedFactor * 1.02, 1.4);
    enemy2.speedFactor = Math.min(enemy2.speedFactor * 1.02, 1.4);

    // Separar enemigos para evitar que se peguen
    const overlap = (enemy1.width + enemy2.width) / 2 - distance + 2;
    if (overlap > 0) {
      enemy1.x -= (nx * overlap) / 2;
      enemy1.y -= (ny * overlap) / 2;
      enemy2.x += (nx * overlap) / 2;
      enemy2.y += (ny * overlap) / 2;
    }
  },

  /**
   * Aplica movimiento aleatorio ocasional
   */
  applyRandomMovement(enemy) {
    // Cambio de dirección muy ocasional
    if (Math.random() < 0.001) {
      const angle = (Math.random() * Math.PI) / 2 - Math.PI / 4; // ±45 grados
      const speed = Math.sqrt(enemy.velocityX ** 2 + enemy.velocityY ** 2);

      enemy.velocityX = Math.sin(angle) * speed;
      enemy.velocityY = Math.abs(Math.cos(angle) * speed); // Mantener tendencia hacia abajo
    }
  },

  /**
   * Limpia enemigos fuera de la pantalla
   */
  cleanupEnemies() {
    const canvas = window.getCanvas();
    const gameTime = window.getGameTime();

    this.enemies = this.enemies.filter((enemy) => {
      // Eliminar enemigos que han estado demasiado tiempo fuera de pantalla abajo
      const tooLowForTooLong =
        enemy.y > canvas.height + 100 && gameTime - enemy.spawnTime > 300;

      // Eliminar enemigos demasiado alejados lateralmente
      const tooFarSide = enemy.x < -200 || enemy.x > canvas.width + 200;

      return !tooLowForTooLong && !tooFarSide;
    });
  },

  // ======================================================
  // ELIMINACIÓN DE ENEMIGOS
  // ======================================================

  /**
   * Elimina un enemigo por índice
   */
  removeEnemy(index) {
    if (index >= 0 && index < this.enemies.length) {
      this.enemies.splice(index, 1);
      this.enemiesKilled++;

      console.log(
        `👹 Enemigo eliminado. Total: ${this.enemiesKilled}/${this.enemiesRequired}`
      );

      return true;
    }
    return false;
  },

  /**
   * Elimina múltiples enemigos
   */
  removeEnemies(indices) {
    // Ordenar índices de mayor a menor para no afectar posiciones
    indices.sort((a, b) => b - a);

    let removed = 0;
    for (const index of indices) {
      if (this.removeEnemy(index)) {
        removed++;
      }
    }

    return removed;
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  /**
   * Dibuja todos los enemigos
   */
  draw(ctx) {
    for (const enemy of this.enemies) {
      this.drawEnemy(ctx, enemy);
    }
  },

  /**
   * Dibuja un enemigo individual
   */
  drawEnemy(ctx, enemy) {
    ctx.save();

    // Efecto visual para enemigos de oleada
    if (enemy.isWaveEnemy) {
      ctx.shadowColor = "#FF4444";
      ctx.shadowBlur = 5;
    }

    // Dibujar imagen o respaldo
    if (enemy.image && enemy.image.complete) {
      ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
    } else {
      // Respaldo visual basado en tamaño
      const intensity = Math.floor(100 + enemy.sizeScale * 100);
      ctx.fillStyle = `rgb(${intensity}, 0, 0)`;
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

      // Borde para diferenciar tamaños
      ctx.strokeStyle = enemy.sizeScale > 1.2 ? "#FFFFFF" : "#888888";
      ctx.lineWidth = enemy.sizeScale > 1.2 ? 2 : 1;
      ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }

    ctx.restore();
  },

  // ======================================================
  // UTILIDADES
  // ======================================================

  /**
   * Obtiene la imagen apropiada para un enemigo
   */
  getEnemyImage(level) {
    const imageIndex = Math.min(level - 1, GameConfig.enemyImages.length - 1);
    return GameConfig.enemyImages[imageIndex] || null;
  },

  /**
   * Verifica colisión entre dos objetos
   */
  checkCollision(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  },

  // ======================================================
  // GETTERS Y ESTADO
  // ======================================================

  getEnemies() {
    return this.enemies;
  },
  getEnemyCount() {
    return this.enemies.length;
  },
  getEnemiesKilled() {
    return this.enemiesKilled;
  },
  getEnemiesRequired() {
    return this.enemiesRequired;
  },
  getLevelProgress() {
    return this.enemiesKilled / this.enemiesRequired;
  },
  isWaveInProgress() {
    return this.waveInProgress;
  },

  /**
   * Resetea el sistema de enemigos
   */
  reset() {
    this.enemies = [];
    this.enemiesKilled = 0;
    this.enemiesRequired = 0;
    this.spawnTimer = 0;
    this.waveInProgress = false;
    this.lastWaveTime = 0;

    console.log("👹 Sistema de enemigos reseteado");
  },
};

// Hacer disponible globalmente
window.EnemyManager = EnemyManager;

console.log("👹 enemies.js cargado - Sistema de enemigos listo");
