/**
 * Hell Shooter - Enemy Management CORREGIDO
 * Sistema de enemigos basado en el código original funcional
 */

const EnemyManager = {
  // ======================================================
  // ESTADO DE ENEMIGOS
  // ======================================================

  enemies: [],

  // Control de spawn
  spawnTimer: 0,
  currentSpawnDelay: 60,

  // 🔥 CORREGIDO: Progreso del nivel como en el original
  enemiesKilled: 0,
  enemiesRequired: 0,

  // ======================================================
  // CONFIGURACIÓN DE NIVEL - CORREGIDO
  // ======================================================

  /**
   * Configura el nivel actual - BASADO EN EL CÓDIGO ORIGINAL
   */
  setupLevel(level) {
    // 🔥 CORREGIDO: Array de enemigos por nivel como en el original
    const levelUpEnemies = [
      100, 200, 350, 550, 800, 1100, 1450, 1850, 2300, 2800,
    ];

    this.enemiesRequired =
      levelUpEnemies[level - 1] || levelUpEnemies[levelUpEnemies.length - 1];

    // 🔥 CORREGIDO: Calcular spawn delay como en el original
    const baseSpawnRate = 60;
    const spawnRateReduction = 3;
    const minSpawnRate = 15;
    this.currentSpawnDelay = Math.max(
      minSpawnRate,
      baseSpawnRate - level * spawnRateReduction
    );

    // 🔥 IMPORTANTE: NO resetear enemiesKilled aquí para continuidad
    this.spawnTimer = 0;

    console.log(
      `👹 Nivel ${level} configurado: ${this.enemiesRequired} enemigos requeridos, ${this.enemiesKilled} ya eliminados`
    );
  },

  /**
   * Verifica si el nivel está completo
   */
  isLevelComplete() {
    return this.enemiesKilled >= this.enemiesRequired;
  },

  // ======================================================
  // CREACIÓN DE ENEMIGOS - CORREGIDO SEGÚN ORIGINAL
  // ======================================================

  /**
   * Crea un enemigo estándar - BASADO EN EL CÓDIGO ORIGINAL
   */
  spawnEnemy() {
    const canvas = window.getCanvas();
    const level = window.getLevel();

    // 🔥 CORREGIDO: Tamaño como en el original
    const sizeVariation = 0.8 + Math.random() * 0.4;
    const baseSize =
      GameConfig.ENEMY_MIN_SIZE +
      Math.random() * (GameConfig.ENEMY_MAX_SIZE - GameConfig.ENEMY_MIN_SIZE);
    const enemySize =
      baseSize * sizeVariation * Math.max(0.6, 1 - level * 0.05);

    const x = Math.random() * (canvas.width - enemySize);

    // 🔥 CORREGIDO: Velocidad como en el original
    const levelSpeedFactor = 1 + level * 0.2;
    const baseSpeed = canvas.height * 0.006 * levelSpeedFactor;

    const angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;
    const speed = baseSpeed * (0.8 + Math.random() * 0.6);
    const velocityX = Math.sin(angle) * speed;
    const velocityY = Math.abs(Math.cos(angle) * speed);

    const enemy = {
      x: x,
      y: -enemySize,
      width: enemySize,
      height: enemySize,
      velocityX: velocityX,
      velocityY: velocityY,
      image: this.getEnemyImage(level),
      speedFactor: 1.0,
      bounceCount: 0,
      maxBounces: 3 + Math.floor(Math.random() * 3),
      level: level,
      spawnTime: window.getGameTime(),
      type: "normal",
    };

    this.enemies.push(enemy);

    // 🔥 CORREGIDO: Spawn extra como en el original
    if (level > 3 && Math.random() < level * 0.05 && this.enemies.length < 30) {
      const extraEnemies = Math.min(2, Math.floor(level / 4));

      for (let i = 0; i < extraEnemies; i++) {
        setTimeout(() => {
          if (!window.isGameEnded() && this.enemies.length < 40) {
            this.spawnSimpleEnemy();
          }
        }, i * 400);
      }
    }
  },

  /**
   * Crea un enemigo simple para spawns extra
   */
  spawnSimpleEnemy() {
    const canvas = window.getCanvas();
    const level = window.getLevel();

    const simpleEnemySize =
      GameConfig.ENEMY_MIN_SIZE +
      Math.random() * (GameConfig.ENEMY_MAX_SIZE - GameConfig.ENEMY_MIN_SIZE);
    const simpleX = Math.random() * (canvas.width - simpleEnemySize);
    const simpleSpeed = canvas.height * 0.005;

    const enemy = {
      x: simpleX,
      y: -simpleEnemySize,
      width: simpleEnemySize,
      height: simpleEnemySize,
      velocityX: (Math.random() - 0.5) * simpleSpeed,
      velocityY: simpleSpeed,
      image: this.getEnemyImage(level),
      speedFactor: 1.0,
      bounceCount: 0,
      maxBounces: 2,
      level: level,
      spawnTime: window.getGameTime(),
      type: "extra",
    };

    this.enemies.push(enemy);
  },

  // ======================================================
  // ACTUALIZACIÓN Y MOVIMIENTO - CORREGIDO
  // ======================================================

  /**
   * Actualiza todos los enemigos
   */
  update() {
    // Actualizar spawn timer
    this.updateSpawning();

    // Actualizar posiciones y física
    this.updateEnemyMovement();

    // Limpiar enemigos fuera de pantalla
    this.cleanupEnemies();
  },

  /**
   * Controla el spawn de enemigos - CORREGIDO
   */
  updateSpawning() {
    // 🔥 CORREGIDO: No spawnar si el nivel está completo
    if (this.isLevelComplete()) return;

    // 🔥 CORREGIDO: Limitar cantidad como en el original
    if (this.enemies.length > 40) return;

    this.spawnTimer++;

    if (this.spawnTimer >= this.currentSpawnDelay) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }
  },

  /**
   * Actualiza el movimiento de todos los enemigos - BASADO EN EL ORIGINAL
   */
  updateEnemyMovement() {
    const canvas = window.getCanvas();
    const wallBounceFactorX = 0.9;
    const wallBounceFactorY = 1.05;
    const enemyBounceFactorBase = 1.1;

    // 🔥 CORREGIDO: Actualizar cada enemigo como en el original
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];

      // Mover enemigo
      enemy.x += enemy.velocityX;
      enemy.y += enemy.velocityY;

      // 🔥 CORREGIDO: Rebotes exactos como en el original
      // Rebote en paredes laterales
      if (enemy.x <= 0) {
        enemy.velocityX = Math.abs(enemy.velocityX) * wallBounceFactorX;
        enemy.x = 0;
        enemy.velocityY *= 0.95 + Math.random() * 0.1;
      } else if (enemy.x + enemy.width >= canvas.width) {
        enemy.velocityX = -Math.abs(enemy.velocityX) * wallBounceFactorX;
        enemy.x = canvas.width - enemy.width;
        enemy.velocityY *= 0.95 + Math.random() * 0.1;
      }

      // Rebote en techo
      if (enemy.y <= 0) {
        enemy.velocityY = Math.abs(enemy.velocityY) * wallBounceFactorY;
        enemy.y = 0;
      }

      // Rebote en suelo - SIEMPRE hacia arriba
      if (enemy.y + enemy.height >= canvas.height) {
        enemy.velocityY = -Math.abs(enemy.velocityY) * wallBounceFactorY;
        enemy.y = canvas.height - enemy.height;
        enemy.velocityX += (Math.random() - 0.5) * (canvas.width * 0.003);
      }

      // 🔥 CORREGIDO: Cambio de dirección ocasional como en el original
      if (Math.random() < 0.001) {
        const angle = Math.random() * ((2 * Math.PI) / 3) - Math.PI / 3;
        const speed = Math.sqrt(
          enemy.velocityX * enemy.velocityX + enemy.velocityY * enemy.velocityY
        );
        enemy.velocityX = Math.sin(angle) * speed;
        enemy.velocityY = Math.abs(Math.cos(angle) * speed);
      }

      // 🔥 CORREGIDO: Colisiones entre enemigos
      for (let j = i + 1; j < this.enemies.length; j++) {
        const otherEnemy = this.enemies[j];

        if (this.checkCollision(enemy, otherEnemy)) {
          const dx =
            otherEnemy.x + otherEnemy.width / 2 - (enemy.x + enemy.width / 2);
          const dy =
            otherEnemy.y + otherEnemy.height / 2 - (enemy.y + enemy.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;

            const enemyBounceFactor = enemyBounceFactorBase * enemy.speedFactor;
            const otherEnemyBounceFactor =
              enemyBounceFactorBase * otherEnemy.speedFactor;

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

            enemy.speedFactor = Math.min(enemy.speedFactor * 1.05, 1.5);
            otherEnemy.speedFactor = Math.min(
              otherEnemy.speedFactor * 1.05,
              1.5
            );

            const overlap = (enemy.width + otherEnemy.width) / 2 - dist + 2;
            if (overlap > 0) {
              enemy.x -= (nx * overlap) / 2;
              enemy.y -= (ny * overlap) / 2;
              otherEnemy.x += (nx * overlap) / 2;
              otherEnemy.y += (ny * overlap) / 2;
            }
          }
        }
      }

      // 🔥 CORREGIDO: Limitar velocidad máxima
      const maxSpeed = canvas.height * 0.02 * (1 + window.getLevel() * 0.1);
      const currentSpeed = Math.sqrt(
        enemy.velocityX * enemy.velocityX + enemy.velocityY * enemy.velocityY
      );
      if (currentSpeed > maxSpeed) {
        const ratio = maxSpeed / currentSpeed;
        enemy.velocityX *= ratio;
        enemy.velocityY *= ratio;
      }
    }
  },

  /**
   * Limpia enemigos fuera de la pantalla
   */
  cleanupEnemies() {
    const canvas = window.getCanvas();
    const gameTime = window.getGameTime();

    // 🔥 CORREGIDO: Limpiar solo los que están muy lejos
    this.enemies = this.enemies.filter((enemy) => {
      const tooLowForTooLong =
        enemy.y > canvas.height + 100 && gameTime - enemy.spawnTime > 300;
      const tooFarSide = enemy.x < -200 || enemy.x > canvas.width + 200;
      return !tooLowForTooLong && !tooFarSide;
    });
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
    // Dibujar imagen o respaldo
    if (enemy.image && enemy.image.complete) {
      ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
    } else {
      // Respaldo visual
      ctx.fillStyle = "#8B0000";
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

      // Borde para visibilidad
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
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

  /**
   * Resetea el sistema de enemigos
   */
  reset() {
    this.enemies = [];
    this.enemiesKilled = 0;
    this.enemiesRequired = 0;
    this.spawnTimer = 0;

    console.log("👹 Sistema de enemigos reseteado");
  },
};

// Hacer disponible globalmente
window.EnemyManager = EnemyManager;

console.log("👹 enemies.js cargado y corregido");
