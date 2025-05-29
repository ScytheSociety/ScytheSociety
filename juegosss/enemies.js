/**
 * Hell Shooter - Enemy Management ÉPICO
 * Sistema de enemigos con meteoritos y más velocidad
 */

const EnemyManager = {
  // ======================================================
  // ESTADO DE ENEMIGOS
  // ======================================================

  enemies: [],

  // Control de spawn más agresivo
  spawnTimer: 0,
  currentSpawnDelay: 50, // 🔥 MÁS RÁPIDO

  // Progreso del nivel
  enemiesKilled: 0,
  enemiesRequired: 0,

  // Sistemas especiales
  meteorShowerActive: false,
  lastMeteorTime: 0,

  // ======================================================
  // CONFIGURACIÓN DE NIVEL ÉPICA
  // ======================================================

  /**
   * Configura el nivel actual - BALANCEADO
   */
  setupLevel(level) {
    // 🔥 USAR SOLO LA CONFIGURACIÓN DE CONFIG.JS
    this.enemiesRequired =
      GameConfig.LEVEL_CONFIG.enemiesPerLevel[level - 1] ||
      GameConfig.LEVEL_CONFIG.enemiesPerLevel[
        GameConfig.LEVEL_CONFIG.enemiesPerLevel.length - 1
      ];

    // 🔥 Spawn BALANCEADO - Menos frecuente
    const baseSpawnRate = 70; // Era 50, ahora 70 (más lento)
    const spawnRateReduction = 3; // Era 4, ahora 3 (menos agresivo)
    const minSpawnRate = 20; // Era 12, ahora 20 (más lento)
    this.currentSpawnDelay = Math.max(
      minSpawnRate,
      baseSpawnRate - level * spawnRateReduction
    );

    this.spawnTimer = 0;

    console.log(
      `👹 Nivel BALANCEADO ${level}: ${this.enemiesRequired} enemigos, spawn cada ${this.currentSpawnDelay} frames`
    );
  },

  /**
   * Verifica si el nivel está completo
   */
  isLevelComplete() {
    return this.enemiesKilled >= this.enemiesRequired;
  },

  // ======================================================
  // CREACIÓN DE ENEMIGOS ÉPICA
  // ======================================================

  /**
   * Crea un enemigo estándar - CON TAMAÑOS MÁS GRANDES Y ANIMACIÓN
   */
  spawnEnemy() {
    const canvas = window.getCanvas();
    const level = window.getLevel();

    // 🔥 TAMAÑOS BALANCEADOS - NO TAN GRANDES
    const baseMinSize = 35; // Reducido de 40 a 35px
    const baseMaxSize = 65; // Reducido de 80 a 65px

    // Crecimiento progresivo más controlado por nivel
    const sizeBonus = level * 5; // Reducido de 8 a 5px por nivel

    const minSize = Math.max(50, baseMinSize + sizeBonus);
    const maxSize = Math.max(80, baseMaxSize + sizeBonus);

    const enemySize = minSize + Math.random() * (maxSize - minSize);

    const x = Math.random() * (canvas.width - enemySize);

    // Velocidad balanceada
    const levelSpeedFactor = 1 + level * 0.15;
    const baseSpeed = canvas.height * 0.004 * levelSpeedFactor;

    const angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;
    const speed = baseSpeed * (0.7 + Math.random() * 0.6);
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
      speedFactor: 1.0 + Math.random() * 0.2,
      bounceCount: 0,
      maxBounces: 2 + Math.floor(Math.random() * 2),
      level: level,
      spawnTime: window.getGameTime(),
      type: "normal",

      // 🔥 NUEVO: Sistema de escalado dinámico
      dynamicScaling: {
        enabled: Math.random() < 0.4, // 40% de enemigos tendrán escalado
        baseSize: enemySize,
        currentScale: 1.0,
        scaleDirection: 1,
        scaleSpeed: 0.003, // Velocidad de cambio de escala
        minScale: 0.7,
        maxScale: 1.4,
        pulseTimer: 0,
      },
    };

    this.enemies.push(enemy);

    // Spawn extra menos agresivo
    if (level > 3 && Math.random() < level * 0.04 && this.enemies.length < 25) {
      const extraEnemies = Math.min(2, Math.floor(level / 4));

      for (let i = 0; i < extraEnemies; i++) {
        setTimeout(() => {
          if (!window.isGameEnded() && this.enemies.length < 30) {
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
    const simpleSpeed = canvas.height * 0.006 * (1 + level * 0.1); // Más rápido

    const enemy = {
      x: simpleX,
      y: -simpleEnemySize,
      width: simpleEnemySize,
      height: simpleEnemySize,
      velocityX: (Math.random() - 0.5) * simpleSpeed,
      velocityY: simpleSpeed * (0.9 + Math.random() * 0.4),
      image: this.getEnemyImage(level),
      speedFactor: 1.2, // Más rápidos
      bounceCount: 0,
      maxBounces: 3,
      level: level,
      spawnTime: window.getGameTime(),
      type: "extra",
      // 🔥 AGREGAR: Sistema de escalado dinámico para enemigos simples
      dynamicScaling: {
        enabled: Math.random() < 0.3, // 30% de enemigos simples
        baseSize: simpleEnemySize,
        currentScale: 1.0,
        scaleDirection: 1,
        scaleSpeed: 0.004,
        minScale: 0.7,
        maxScale: 1.3,
        pulseTimer: 0,
      },
    };

    this.enemies.push(enemy);
  },

  /**
   * 🔥 NUEVO: Crea un enemigo meteorito súper agresivo
   */
  spawnMeteorEnemy() {
    const canvas = window.getCanvas();
    const level = window.getLevel();

    // Meteoritos más grandes y rápidos
    const meteorSize = GameConfig.ENEMY_MAX_SIZE * 1.2; // 20% más grandes
    const meteorX = Math.random() * (canvas.width - meteorSize);
    const meteorSpeed = canvas.height * 0.012; // MUY RÁPIDO

    const meteorEnemy = {
      x: meteorX,
      y: -meteorSize,
      width: meteorSize,
      height: meteorSize,
      velocityX: (Math.random() - 0.5) * meteorSpeed * 0.5, // Movimiento lateral leve
      velocityY: meteorSpeed * (1.2 + Math.random() * 0.3), // Muy rápido hacia abajo
      image: this.getEnemyImage(level),
      speedFactor: 1.5, // Súper rápidos
      bounceCount: 0,
      maxBounces: 5, // Más rebotes
      level: level,
      spawnTime: window.getGameTime(),
      type: "meteor",
      isMeteor: true, // Flag especial
      // 🔥 AGREGAR: Sistema de escalado dinámico para meteoritos
      dynamicScaling: {
        enabled: Math.random() < 0.6, // 60% de meteoritos tendrán escalado
        baseSize: meteorSize,
        currentScale: 1.0,
        scaleDirection: 1,
        scaleSpeed: 0.005, // Más rápido para meteoritos
        minScale: 0.8,
        maxScale: 1.6,
        pulseTimer: 0,
      },
    };

    this.enemies.push(meteorEnemy);

    // Efecto visual de meteorito
    UI.createParticleEffect(
      meteorX + meteorSize / 2,
      -meteorSize / 2,
      "#FF8800",
      15
    );

    console.log("☄️ Enemigo meteorito spawneado");
  },

  // ======================================================
  // ACTUALIZACIÓN Y MOVIMIENTO ÉPICO
  // ======================================================

  /**
   * Actualiza todos los enemigos
   */
  update() {
    // Actualizar spawn timer más agresivo
    this.updateSpawning();

    // Actualizar posiciones y física
    this.updateEnemyMovement();

    // Limpiar enemigos fuera de pantalla
    this.cleanupEnemies();
  },

  /**
   * Controla el spawn de enemigos - MÁS AGRESIVO
   */
  updateSpawning() {
    // No spawnar si el nivel está completo
    if (this.isLevelComplete()) return;

    // 🔥 Límite más alto de enemigos simultáneos
    if (this.enemies.length > 60) return; // Era 40, ahora 60

    this.spawnTimer++;

    // 🔥 Spawn más frecuente con combos altos
    let effectiveDelay = this.currentSpawnDelay;
    if (window.ComboSystem) {
      const combo = window.ComboSystem.getCurrentCombo();
      if (combo >= 10) {
        effectiveDelay = Math.max(8, effectiveDelay * 0.8); // 20% más rápido con combo 10+
      }
      if (combo >= 20) {
        effectiveDelay = Math.max(6, effectiveDelay * 0.6); // 40% más rápido con combo 20+
      }
    }

    if (this.spawnTimer >= effectiveDelay) {
      this.spawnEnemy();
      this.spawnTimer = 0;

      // 🔥 Spawn adicional aleatorio más frecuente
      if (Math.random() < 0.3) {
        // 30% probabilidad
        setTimeout(() => this.spawnEnemy(), 100);
      }
    }
  },

  /**
   * Actualiza el movimiento de todos los enemigos - MÁS ÉPICO
   */
  updateEnemyMovement() {
    const canvas = window.getCanvas();
    const wallBounceFactorX = 0.85; // Menos pérdida de velocidad
    const wallBounceFactorY = 1.1; // Más ganancia de velocidad
    const enemyBounceFactorBase = 1.15; // Más aceleración en rebotes

    // 🔥 Factor de tiempo lento si está activo
    const slowFactor = window.slowMotionActive ? window.slowMotionFactor : 1.0;
    // Aplicar factor lento a TODOS los movimientos de rebote también
    const bounceSlowFactor = slowFactor;

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];

      // 🔥 Movimiento con factor de tiempo lento
      enemy.x += enemy.velocityX * enemy.speedFactor * slowFactor;
      enemy.y += enemy.velocityY * enemy.speedFactor * slowFactor;

      // 🔥 NUEVO: Actualizar escalado dinámico
      this.updateDynamicScaling(enemy);

      // 🔥 Rebotes más agresivos para meteoritos
      const bounceMultiplierX = enemy.isMeteor ? 1.0 : wallBounceFactorX;
      const bounceMultiplierY = enemy.isMeteor ? 1.2 : wallBounceFactorY;

      // Rebotes en paredes laterales
      if (enemy.x <= 0) {
        enemy.velocityX =
          Math.abs(enemy.velocityX) * bounceMultiplierX * bounceSlowFactor;
        enemy.x = 0;
        enemy.velocityY *= 0.9 + Math.random() * 0.2;
        enemy.bounceCount++;
      } else if (enemy.x + enemy.width >= canvas.width) {
        enemy.velocityX =
          -Math.abs(enemy.velocityX) * bounceMultiplierX * bounceSlowFactor;
        enemy.x = canvas.width - enemy.width;
        enemy.velocityY *= 0.9 + Math.random() * 0.2;
        enemy.bounceCount++;
      }

      // Rebote en techo
      if (enemy.y <= 0) {
        enemy.velocityY =
          Math.abs(enemy.velocityY) * bounceMultiplierY * bounceSlowFactor;
        enemy.y = 0;
        enemy.bounceCount++;
      }

      // Rebote en suelo - SIEMPRE hacia arriba
      if (enemy.y + enemy.height >= canvas.height) {
        enemy.velocityY =
          -Math.abs(enemy.velocityY) * bounceMultiplierY * bounceSlowFactor;
        enemy.y = canvas.height - enemy.height;
        enemy.velocityX += (Math.random() - 0.5) * (canvas.width * 0.004); // Más variación
        enemy.bounceCount++;
      }

      // 🔥 Aumento de agresividad después de rebotes
      if (enemy.bounceCount >= enemy.maxBounces) {
        enemy.speedFactor = Math.min(enemy.speedFactor * 1.2, 2.0); // Hasta 2x velocidad
        enemy.bounceCount = 0;
      }

      // 🔥 Cambio de dirección más frecuente para meteoritos
      const directionChangeChance = enemy.isMeteor ? 0.002 : 0.001;
      if (Math.random() < directionChangeChance) {
        const angle = Math.random() * ((2 * Math.PI) / 3) - Math.PI / 3;
        const speed = Math.sqrt(
          enemy.velocityX * enemy.velocityX + enemy.velocityY * enemy.velocityY
        );
        enemy.velocityX = Math.sin(angle) * speed;
        enemy.velocityY = Math.abs(Math.cos(angle) * speed);
      }

      // 🔥 Colisiones entre enemigos más agresivas
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

            // 🔥 Aumento de velocidad más agresivo
            enemy.speedFactor = Math.min(enemy.speedFactor * 1.08, 2.0);
            otherEnemy.speedFactor = Math.min(
              otherEnemy.speedFactor * 1.08,
              2.0
            );

            // Separar enemigos
            const overlap = (enemy.width + otherEnemy.width) / 2 - dist + 3;
            if (overlap > 0) {
              enemy.x -= (nx * overlap) / 2;
              enemy.y -= (ny * overlap) / 2;
              otherEnemy.x += (nx * overlap) / 2;
              otherEnemy.y += (ny * overlap) / 2;
            }
          }
        }
      }

      // 🔥 Límite de velocidad más alto
      const maxSpeed = canvas.height * 0.025 * (1 + window.getLevel() * 0.15); // Más rápido
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

    // Limpiar solo los que están muy lejos o llevan mucho tiempo fuera
    this.enemies = this.enemies.filter((enemy) => {
      const tooLowForTooLong =
        enemy.y > canvas.height + 150 && gameTime - enemy.spawnTime > 400;
      const tooFarSide = enemy.x < -300 || enemy.x > canvas.width + 300;
      return !tooLowForTooLong && !tooFarSide;
    });
  },

  // ======================================================
  // RENDERIZADO ÉPICO
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
   * 🔥 NUEVO: Actualiza el escalado dinámico de los enemigos
   */
  updateDynamicScaling(enemy) {
    if (!enemy.dynamicScaling.enabled) return;

    const scaling = enemy.dynamicScaling;
    scaling.pulseTimer += scaling.scaleSpeed;

    // Calcular nueva escala usando función seno para suavidad
    scaling.currentScale =
      scaling.minScale +
      (scaling.maxScale - scaling.minScale) *
        (Math.sin(scaling.pulseTimer) * 0.5 + 0.5);

    // Actualizar tamaño del enemigo
    const newSize = scaling.baseSize * scaling.currentScale;
    enemy.width = newSize;
    enemy.height = newSize;
  },

  /**
   * Dibuja un enemigo individual con efectos épicos
   */
  drawEnemy(ctx, enemy) {
    ctx.save();

    // 🔥 Efectos especiales para meteoritos
    if (enemy.isMeteor) {
      ctx.shadowColor = "#FF8800";
      ctx.shadowBlur = 10;

      // Estela de meteorito
      ctx.strokeStyle = "#FF4400";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
      ctx.lineTo(enemy.x + enemy.width / 2, enemy.y - 20);
      ctx.stroke();
    }

    // 🔥 Efecto de velocidad para enemigos rápidos
    if (enemy.speedFactor > 1.3) {
      ctx.shadowColor = "#FFAA00";
      ctx.shadowBlur = 5;
    }

    // Dibujar imagen o respaldo
    if (enemy.image && enemy.image.complete) {
      ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
    } else {
      // Respaldo visual épico
      let color = "#8B0000";
      if (enemy.isMeteor) {
        color = "#FF4400";
      } else if (enemy.speedFactor > 1.3) {
        color = "#AA0000";
      }

      ctx.fillStyle = color;
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

      // Borde para visibilidad
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = enemy.isMeteor ? 2 : 1;
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

  /**
   * Resetea el sistema de enemigos
   */
  reset() {
    this.enemies = [];
    this.enemiesKilled = 0;
    this.enemiesRequired = 0;
    this.spawnTimer = 0;
    this.meteorShowerActive = false;
    this.lastMeteorTime = 0;

    console.log("👹 Sistema de enemigos ÉPICO reseteado");
  },
};

// Hacer disponible globalmente
window.EnemyManager = EnemyManager;

console.log("👹 enemies.js ÉPICO cargado");
