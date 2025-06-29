/**
 * Hell Shooter - Enemy Management ÉPICO ARREGLADO
 * Sistema de enemigos IDÉNTICO entre PC y móvil
 */

const EnemyManager = {
  // ======================================================
  // ESTADO DE ENEMIGOS
  // ======================================================

  enemies: [],

  // Control de spawn más agresivo
  spawnTimer: 0,
  currentSpawnDelay: 50, // 🔥 IDÉNTICO PARA TODOS

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
   * Configura el nivel actual - IDÉNTICA VELOCIDAD PARA TODOS
   */
  setupLevel(level) {
    // Usar SOLO la configuración de CONFIG.JS
    this.enemiesRequired =
      GameConfig.LEVEL_CONFIG.enemiesPerLevel[level - 1] ||
      GameConfig.LEVEL_CONFIG.enemiesPerLevel[
        GameConfig.LEVEL_CONFIG.enemiesPerLevel.length - 1
      ];

    // 🔥 SPAWN IDÉNTICO - Sin diferencias por dispositivo
    const baseSpawnRate = 50; // Spawn base constante
    const spawnRateReduction = 4; // Reducción por nivel constante
    const minSpawnRate = 12; // Spawn mínimo constante
    this.currentSpawnDelay = Math.max(
      minSpawnRate,
      baseSpawnRate - level * spawnRateReduction
    );

    this.spawnTimer = 0;

    console.log(
      `👹 Nivel ${level}: ${this.enemiesRequired} enemigos, spawn cada ${this.currentSpawnDelay} frames (IDÉNTICO PC/MÓVIL)`
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
   * Crea un enemigo estándar - IDÉNTICO PC/MÓVIL
   */
  spawnEnemy() {
    const canvas = window.getCanvas();
    const level = window.getLevel();

    // 🔥 TAMAÑOS RESPONSIVOS BASADOS EN PANTALLA
    const screenScale = Math.min(canvas.width, canvas.height) / 800; // Escala base 800px
    const mobileScale = GameConfig.isMobile ? 0.7 : 1.0; // 30% más pequeño en móvil

    // En lugar de valores fijos, usar:
    let baseMinSize, baseMaxSize;

    if (GameConfig.isMobile) {
      baseMinSize = GameConfig.ENEMY_MIN_SIZE * 0.8;
      baseMaxSize = GameConfig.ENEMY_MAX_SIZE * 0.8;
    } else {
      baseMinSize = GameConfig.ENEMY_MIN_SIZE;
      baseMaxSize = GameConfig.ENEMY_MAX_SIZE;
    }

    const sizeBonus = level * (GameConfig.isMobile ? 1.5 : 3) * screenScale;
    const minSize = Math.max(
      GameConfig.isMobile ? 25 : 35,
      baseMinSize + sizeBonus
    );
    const maxSize = Math.max(
      GameConfig.isMobile ? 40 : 60,
      baseMaxSize + sizeBonus
    );

    const enemySize = minSize + Math.random() * (maxSize - minSize);
    const x = Math.random() * (canvas.width - enemySize);

    // Velocidad responsiva
    const levelSpeedFactor = 1 + level * 0.15;
    const baseSpeed = canvas.height * 0.004 * levelSpeedFactor;
    const speedScale = GameConfig.isMobile ? 0.8 : 1.0; // Más lento en móvil

    const angle = (Math.random() * Math.PI) / 2 - Math.PI / 4;
    const speed = baseSpeed * (0.7 + Math.random() * 0.6) * speedScale;
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

      dynamicScaling: {
        enabled: Math.random() < 0.4,
        baseSize: enemySize,
        currentScale: 1.0,
        scaleDirection: 1,
        scaleSpeed: 0.003,
        minScale: 0.7,
        maxScale: 1.4,
        pulseTimer: 0,
      },
    };

    this.enemies.push(enemy);

    // Spawn extra con límites responsivos
    const maxEnemies = GameConfig.isMobile ? 15 : 25;
    if (
      level > 3 &&
      Math.random() < level * 0.04 &&
      this.enemies.length < maxEnemies
    ) {
      const extraEnemies = Math.min(2, Math.floor(level / 4));
      for (let i = 0; i < extraEnemies; i++) {
        setTimeout(() => {
          if (!window.isGameEnded() && this.enemies.length < maxEnemies + 5) {
            this.spawnSimpleEnemy();
          }
        }, i * 400);
      }
    }
  },

  /**
   * Crea un enemigo simple para spawns extra - IDÉNTICO
   */
  spawnSimpleEnemy() {
    const canvas = window.getCanvas();
    const level = window.getLevel();

    // 🔥 TAMAÑOS PEQUEÑOS para enemigos simples también
    const simpleEnemySize = 20 + Math.random() * 25; // Era 30-60, ahora 20-45
    const simpleX = Math.random() * (canvas.width - simpleEnemySize);
    const simpleSpeed = canvas.height * 0.006 * (1 + level * 0.1);

    const enemy = {
      x: simpleX,
      y: -simpleEnemySize,
      width: simpleEnemySize,
      height: simpleEnemySize,
      velocityX: (Math.random() - 0.5) * simpleSpeed,
      velocityY: simpleSpeed * (0.9 + Math.random() * 0.4),
      image: this.getEnemyImage(level),
      speedFactor: 1.2,
      bounceCount: 0,
      maxBounces: 3,
      level: level,
      spawnTime: window.getGameTime(),
      type: "extra",

      // Sistema de escalado dinámico
      dynamicScaling: {
        enabled: Math.random() < 0.3,
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
   * 🔥 Crea un enemigo meteorito súper agresivo - IDÉNTICO
   */
  spawnMeteorEnemy() {
    const canvas = window.getCanvas();
    const level = window.getLevel();

    const meteorSize = GameConfig.ENEMY_MAX_SIZE * 1.2;
    const meteorX = Math.random() * (canvas.width - meteorSize);
    const meteorSpeed = canvas.height * 0.012;

    const meteorEnemy = {
      x: meteorX,
      y: -meteorSize,
      width: meteorSize,
      height: meteorSize,
      velocityX: (Math.random() - 0.5) * meteorSpeed * 0.5,
      velocityY: meteorSpeed * (1.2 + Math.random() * 0.3),
      image: this.getEnemyImage(level),
      speedFactor: 1.5,
      bounceCount: 0,
      maxBounces: 5,
      level: level,
      spawnTime: window.getGameTime(),
      type: "meteor",
      isMeteor: true,

      // 🔥 INICIALIZACIÓN GARANTIZADA: Sistema de escalado dinámico para meteoritos
      dynamicScaling: {
        enabled: Math.random() < 0.6,
        baseSize: meteorSize,
        currentScale: 1.0,
        scaleDirection: 1,
        scaleSpeed: 0.005,
        minScale: 0.8,
        maxScale: 1.6,
        pulseTimer: 0,
      },
    };

    this.enemies.push(meteorEnemy);

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
    this.updateSpawning();
    this.updateEnemyMovement();
    this.cleanupEnemies();
  },

  /**
   * Controla el spawn de enemigos - CON LÍMITES INTELIGENTES
   */
  updateSpawning() {
    if (window.getLevel() >= 11) return;
    if (this.isLevelComplete()) return;

    // 🔥 NUEVO: Límite inteligente basado en nivel
    const maxEnemies = Math.min(15 + window.getLevel() * 2, 30); // Máximo 30 enemigos

    if (this.enemies.length > maxEnemies) return;

    this.spawnTimer++;

    let effectiveDelay = this.currentSpawnDelay;

    // Sin modificaciones por combo, solo spawn normal
    if (this.spawnTimer >= effectiveDelay) {
      this.spawnEnemy();
      this.spawnTimer = 0;

      // Spawn adicional ocasional (más controlado)
      if (Math.random() < 0.2 && this.enemies.length < maxEnemies - 5) {
        setTimeout(() => this.spawnEnemy(), 200);
      }
    }
  },

  /**
   * Actualiza el movimiento de todos los enemigos - CON TIEMPO LENTO MEJORADO Y REBOTES CONTROLADOS
   */
  updateEnemyMovement() {
    const canvas = window.getCanvas();
    const wallBounceFactorX = 0.85;
    const wallBounceFactorY = 1.1;
    const enemyBounceFactorBase = 0.85;

    // 🔥 APLICAR SLOWMOTION A ENEMIGOS
    let globalSlowFactor = 1.0;
    if (window.slowMotionActive) {
      globalSlowFactor = 0.05; // 5% de velocidad OBLIGATORIO
      console.log("🌊 MUNDO SUBACUÁTICO ACTIVO - TODO al 5% de velocidad");
    }

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];

      // 🔥 APLICAR LENTITUD GLOBAL A TODO MOVIMIENTO
      enemy.x += enemy.velocityX * enemy.speedFactor * globalSlowFactor;
      enemy.y += enemy.velocityY * enemy.speedFactor * globalSlowFactor;

      // 🔥 TODOS LOS REBOTES también lentos
      const bounceSlowFactor = globalSlowFactor;

      // Resto del código igual pero CON globalSlowFactor aplicado...
      this.updateDynamicScaling(enemy);

      if (enemy.x <= 0) {
        enemy.velocityX =
          Math.abs(enemy.velocityX) * wallBounceFactorX * bounceSlowFactor;
        enemy.x = 0;
        enemy.velocityY *= 0.9 + Math.random() * 0.2;
        enemy.bounceCount++;
      } else if (enemy.x + enemy.width >= canvas.width) {
        enemy.velocityX =
          -Math.abs(enemy.velocityX) * wallBounceFactorX * bounceSlowFactor;
        enemy.x = canvas.width - enemy.width;
        enemy.velocityY *= 0.9 + Math.random() * 0.2;
        enemy.bounceCount++;
      }

      if (enemy.y <= 0) {
        enemy.velocityY =
          Math.abs(enemy.velocityY) * wallBounceFactorY * bounceSlowFactor;
        enemy.y = 0;
        enemy.bounceCount++;
      }

      if (enemy.y + enemy.height >= canvas.height) {
        enemy.velocityY =
          -Math.abs(enemy.velocityY) * wallBounceFactorY * bounceSlowFactor;
        enemy.y = canvas.height - enemy.height;
        enemy.velocityX +=
          (Math.random() - 0.5) * (canvas.width * 0.004) * globalSlowFactor;
        enemy.bounceCount++;
      }

      // 🔥 AGRESIVIDAD CONTROLADA - Velocidad máxima limitada
      if (enemy.bounceCount >= enemy.maxBounces) {
        // CAMBIO AQUÍ: Factor de agresividad reducido y velocidad máxima limitada
        const aggressionMultiplier = window.slowMotionActive ? 1.01 : 1.1; // Reducido de 1.2 a 1.1
        enemy.speedFactor = Math.min(
          enemy.speedFactor * aggressionMultiplier,
          1.5
        ); // Máximo de 1.5 (era 2.0)
        enemy.bounceCount = 0;
      }

      // 🔥 CAMBIO DE DIRECCIÓN también lento
      const directionChangeChance =
        (enemy.isMeteor ? 0.002 : 0.001) * globalSlowFactor;
      if (Math.random() < directionChangeChance) {
        const angle = Math.random() * ((2 * Math.PI) / 3) - Math.PI / 3;
        const speed = Math.sqrt(
          enemy.velocityX * enemy.velocityX + enemy.velocityY * enemy.velocityY
        );
        enemy.velocityX = Math.sin(angle) * speed;
        enemy.velocityY = Math.abs(Math.cos(angle) * speed);
      }

      // Colisiones entre enemigos con velocidad máxima limitada
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

            const enemyBounceFactor =
              enemyBounceFactorBase * enemy.speedFactor * globalSlowFactor;
            const otherEnemyBounceFactor =
              enemyBounceFactorBase * otherEnemy.speedFactor * globalSlowFactor;

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

            // CAMBIO AQUÍ: Factor de incremento reducido y máximo menor
            const speedFactorIncrease = window.slowMotionActive ? 1.01 : 1.05; // Era 1.08, ahora 1.05
            enemy.speedFactor = Math.min(
              enemy.speedFactor * speedFactorIncrease,
              1.5
            ); // Máximo de 1.5 (era 2.0)
            otherEnemy.speedFactor = Math.min(
              otherEnemy.speedFactor * speedFactorIncrease,
              1.5
            ); // Máximo de 1.5 (era 2.0)

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

      // 🔥 LÍMITE DE VELOCIDAD REDUCIDO
      const baseMaxSpeed =
        canvas.height * 0.015 * (1 + window.getLevel() * 0.1); // Reducido de 0.025 a 0.015
      const maxSpeed = baseMaxSpeed * globalSlowFactor;

      const currentSpeed = Math.sqrt(
        enemy.velocityX * enemy.velocityX + enemy.velocityY * enemy.velocityY
      );
      if (currentSpeed > maxSpeed) {
        const ratio = maxSpeed / currentSpeed;
        enemy.velocityX *= ratio;
        enemy.velocityY *= ratio;
      }
    }

    // Debug cada 60 frames
    if (window.slowMotionActive && window.getGameTime() % 60 === 0) {
      console.log(
        `🌊 VERIFICADO: ${this.enemies.length} enemigos moviéndose al ${
          globalSlowFactor * 100
        }%`
      );
    }
  },

  /**
   * Limpia enemigos fuera de la pantalla
   */
  cleanupEnemies() {
    const canvas = window.getCanvas();
    const gameTime = window.getGameTime();

    this.enemies = this.enemies.filter((enemy) => {
      const tooLowForTooLong =
        enemy.y > canvas.height + 150 && gameTime - enemy.spawnTime > 400;
      const tooFarSide = enemy.x < -300 || enemy.x > canvas.width + 300;
      return !tooLowForTooLong && !tooFarSide;
    });
  },

  /**
   * 🔥 CORREGIDO: Actualiza el escalado dinámico de los enemigos
   */
  updateDynamicScaling(enemy) {
    if (!enemy.dynamicScaling || !enemy.dynamicScaling.enabled) {
      return;
    }

    const scaling = enemy.dynamicScaling;
    scaling.pulseTimer += scaling.scaleSpeed;

    scaling.currentScale =
      scaling.minScale +
      (scaling.maxScale - scaling.minScale) *
        (Math.sin(scaling.pulseTimer) * 0.5 + 0.5);

    const newSize = scaling.baseSize * scaling.currentScale;
    enemy.width = newSize;
    enemy.height = newSize;
  },

  /**
   * Dibuja un enemigo individual con efectos épicos
   */
  drawEnemy(ctx, enemy) {
    ctx.save();

    if (enemy.isMeteor) {
      ctx.shadowColor = "#FF8800";
      ctx.shadowBlur = 10;

      ctx.strokeStyle = "#FF4400";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
      ctx.lineTo(enemy.x + enemy.width / 2, enemy.y - 20);
      ctx.stroke();
    }

    if (enemy.speedFactor > 1.3) {
      ctx.shadowColor = "#FFAA00";
      ctx.shadowBlur = 5;
    }

    if (enemy.image && enemy.image.complete) {
      ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
    } else {
      let color = "#8B0000";
      if (enemy.isMeteor) {
        color = "#FF4400";
      } else if (enemy.speedFactor > 1.3) {
        color = "#AA0000";
      }

      ctx.fillStyle = color;
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = enemy.isMeteor ? 2 : 1;
      ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }

    ctx.restore();
  },

  /**
   * Dibuja todos los enemigos
   */
  draw(ctx) {
    for (const enemy of this.enemies) {
      this.drawEnemy(ctx, enemy);
    }
  },

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

  // GETTERS Y ESTADO
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

    console.log("👹 Sistema de enemigos IDÉNTICO reseteado");
  },
};

window.EnemyManager = EnemyManager;

console.log("👹 enemies.js IDÉNTICO PC/MÓVIL cargado");
