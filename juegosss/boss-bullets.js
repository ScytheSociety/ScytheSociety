/**
 * Hell Shooter - Boss Bullets System ARREGLADO
 * CAMBIOS:
 * - Boss SIEMPRE inmóvil en fase Touhou
 * - Patrones de spiral y cruz CORREGIDOS (no spam)
 * - Boss vulnerable después de fase
 */

const BossBullets = {
  // ======================================================
  // ESTADO DEL SISTEMA DE BALAS
  // ======================================================

  bossManager: null,
  bulletPatterns: [],
  patternActive: false,
  currentPatternIndex: 0,
  patternSequence: ["spiral", "cross", "rain"], // Solo 3 tipos

  // Configuración responsiva de balas
  get bulletConfig() {
    const canvas = window.getCanvas();
    const screenScale = Math.min(canvas.width, canvas.height) / 800;
    const mobileScale = GameConfig.isMobile ? 0.8 : 1.0;

    return {
      size: Math.max(8, 12 * screenScale * mobileScale),
      life: 500,
      baseSpeed: 0.003 * (GameConfig.isMobile ? 0.8 : 1.0),
      glowIntensity: 0.5,
    };
  },

  // 🔥 CONFIGURACIÓN CORREGIDA - SPIRAL PERFECTO, CRUZ ESPACIADA
  patternConfigs: {
    spiral: {
      bulletInterval: 200, // 🔥 SOLO un poquito más lento (era 120)
      rotationSpeed: 0.08,
      speed: 0.002,
      color: "#FF6B6B",
    },
    cross: {
      bulletInterval: 800, // 🔥 MUCHÍSIMO MÁS LENTO entre grupos
      groupSize: 3, // 🔥 SOLO 3 BALAS por dirección
      groupDelay: 800, // 🔥 MUCHO ESPACIO entre cada bala (era 40)
      speed: 0.003,
      color: "#9B59B6",
    },
    rain: {
      bulletInterval: 80,
      bulletsPerShot: 3,
      spread: 0.5,
      speed: 0.005,
      color: "#F39C12",
    },
  },

  activeIntervals: [],

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.bulletPatterns = [];
    this.patternActive = false;
    this.activeIntervals = [];
    console.log("🌟 Sistema de balas Touhou del boss inicializado");
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  update() {
    if (!this.bossManager.active) return;

    this.updateBullets();
  },

  updateBullets() {
    const canvas = window.getCanvas();

    for (let i = this.bulletPatterns.length - 1; i >= 0; i--) {
      const bullet = this.bulletPatterns[i];

      // 🔥 APLICAR SLOWMOTION A BALAS TOUHOU
      let speedMultiplier = 1.0;
      if (window.slowMotionActive && window.slowMotionFactor) {
        speedMultiplier = window.slowMotionFactor;
      }

      // Mover bala CON factor de lentitud
      bullet.x += bullet.velocityX * speedMultiplier;
      bullet.y += bullet.velocityY * speedMultiplier;
      bullet.life--;

      // Efecto de brillo
      bullet.glowIntensity = 0.5 + Math.sin(window.getGameTime() * 0.3) * 0.3;

      // Verificar colisión con jugador
      if (Player.getLives() > 0) {
        if (this.checkBulletPlayerCollision(bullet)) {
          this.bulletPatterns.splice(i, 1);

          const playerDied = Player.takeDamage();

          if (Player.getLives() <= 0) {
            console.log(
              "💀 Jugador murió por bala Touhou - activando game over"
            );
            setTimeout(() => {
              if (window.gameOver && typeof window.gameOver === "function") {
                window.gameOver();
              }
            }, 50);
            return;
          }

          continue;
        }
      }

      // Eliminar balas fuera de pantalla o sin vida
      if (this.isBulletOutOfBounds(bullet, canvas) || bullet.life <= 0) {
        this.bulletPatterns.splice(i, 1);
      }
    }
  },

  checkBulletPlayerCollision(bullet) {
    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();

    return (
      bullet.x < playerPos.x + playerSize.width &&
      bullet.x + bullet.width > playerPos.x &&
      bullet.y < playerPos.y + playerSize.height &&
      bullet.y + bullet.height > playerPos.y
    );
  },

  isBulletOutOfBounds(bullet, canvas) {
    return (
      bullet.x < -50 ||
      bullet.x > canvas.width + 50 ||
      bullet.y < -50 ||
      bullet.y > canvas.height + 50
    );
  },

  // ======================================================
  // GESTIÓN DE PATRONES
  // ======================================================

  startBulletPattern() {
    if (this.patternActive) {
      console.log("🌟 Patrón ya activo, ignorando nuevo inicio");
      return;
    }

    const duration =
      (GameConfig.BOSS_PHASE_CONFIG.BULLETS_DURATION * 1000) / 60;
    console.log(
      `🌟 === INICIANDO FASE TOUHOU (${duration / 1000} SEGUNDOS) ===`
    );

    this.patternActive = true;
    this.currentPatternIndex = 0;

    // Asegurar que el boss esté inmóvil
    this.forceBossStationary();

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🌟 ¡FASE TOUHOU INICIADA!",
        "#FFD700"
      );
    }

    // Solo 3 patrones cada 30 segundos
    this.executeSimplePatternSequence();

    // Iniciar spawn de escudos
    this.startShieldSpawning();

    // Terminar después del tiempo configurado
    setTimeout(() => {
      this.endBulletPhase();
    }, duration);
  },

  // 🔥 NUEVA FUNCIÓN: FORZAR BOSS INMÓVIL
  forceBossStationary() {
    console.log("🛑 FORZANDO boss completamente inmóvil");

    // 1. Centrar boss
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    boss.x = (canvas.width - boss.width) / 2;
    boss.y = (canvas.height - boss.height) / 2;
    boss.velocityX = 0;
    boss.velocityY = 0;

    // 2. Desactivar COMPLETAMENTE el movimiento
    if (this.bossManager.movement) {
      this.bossManager.movement.enabled = false;
      this.bossManager.movement.pattern = "stationary";
      console.log("🛑 Movimiento del boss DESACTIVADO");
    }

    // 3. Bloquear posición (flag especial)
    boss.isStationary = true;
  },

  executeSimplePatternSequence() {
    if (!this.patternActive) return;

    const allowedPatterns = ["spiral", "cross", "rain"];
    const currentPattern =
      allowedPatterns[this.currentPatternIndex % allowedPatterns.length];

    console.log(
      `🌟 Ejecutando patrón ${this.currentPatternIndex + 1}: ${currentPattern}`
    );

    const messages = {
      spiral: "¡Danza espiral de la muerte!",
      cross: "¡Cruz giratoria del infierno!",
      rain: "¡Lluvia mortal del abismo!",
    };

    if (this.bossManager.comments) {
      this.bossManager.comments.sayComment(messages[currentPattern]);
    }

    this.executePattern(currentPattern);

    const totalDuration =
      GameConfig.BOSS_PHASE_CONFIG.BULLETS_DURATION * (1000 / 60);
    const patternDuration = totalDuration / 3;

    this.currentPatternIndex++;
    if (this.currentPatternIndex < 3) {
      setTimeout(() => {
        this.executeSimplePatternSequence();
      }, patternDuration);
    }
  },

  executePattern(patternType) {
    switch (patternType) {
      case "spiral":
        this.createSpiralPattern();
        break;
      case "cross":
        this.createCrossPattern();
        break;
      case "rain":
        this.createRainPattern();
        break;
    }
  },

  // ======================================================
  // 🔥 PATRONES CORREGIDOS - NO SPAM
  // ======================================================

  createSpiralPattern() {
    const config = this.patternConfigs.spiral;
    let angle = 0;

    const spiralInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(spiralInterval);
        return;
      }

      // 🔥 UNA SOLA BALA POR VEZ (LÍNEA FLUIDA)
      this.createTouhouBullet(angle, config.speed, config.color);

      // 🔥 INCREMENTO PEQUEÑO para espiral suave
      angle += config.rotationSpeed;
      if (angle > Math.PI * 2) angle -= Math.PI * 2;
    }, config.bulletInterval);

    this.activeIntervals.push(spiralInterval);
    console.log("🌀 SPIRAL: Línea fluida girando iniciada");
  },

  createCrossPattern() {
    const config = this.patternConfigs.cross;

    const crossInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(crossInterval);
        return;
      }

      // 🔥 DIRECCIONES FIJAS: arriba, abajo, derecha, izquierda
      const directions = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];

      directions.forEach((direction) => {
        // 🔥 GRUPO DE BALAS UNA TRAS OTRA
        for (let i = 0; i < config.groupSize; i++) {
          setTimeout(() => {
            if (this.patternActive) {
              this.createTouhouBullet(direction, config.speed, config.color);
            }
          }, i * config.groupDelay);
        }
      });
    }, config.bulletInterval);

    this.activeIntervals.push(crossInterval);
    console.log("✚ CRUZ: Solo 3 balas MUY ESPACIADAS por dirección");
  },

  createRainPattern() {
    const config = this.patternConfigs.rain;

    const rainInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(rainInterval);
        return;
      }

      // Disparar hacia la posición del jugador con dispersión
      const playerPos = Player.getPosition();
      const playerSize = Player.getSize();
      const boss = this.bossManager.boss;

      const targetX = playerPos.x + playerSize.width / 2;
      const targetY = playerPos.y + playerSize.height / 2;

      const bossCenterX = boss.x + boss.width / 2;
      const bossCenterY = boss.y + boss.height / 2;

      const baseAngle = Math.atan2(
        targetY - bossCenterY,
        targetX - bossCenterX
      );

      // Crear múltiples balas con dispersión
      for (let i = 0; i < config.bulletsPerShot; i++) {
        const spreadAngle = baseAngle + (Math.random() - 0.5) * config.spread;
        this.createTouhouBullet(spreadAngle, config.speed, config.color);
      }
    }, config.bulletInterval);

    this.activeIntervals.push(rainInterval);
    console.log("🌧️ LLUVIA: Balas dirigidas al jugador iniciadas");
  },

  // ======================================================
  // SPAWN DE ESCUDOS
  // ======================================================

  startShieldSpawning() {
    console.log("🛡️ Iniciando sistema de escudo con delay de 10s");

    let shieldCount = 0;
    const maxShields = 10;

    const spawnNextShield = () => {
      if (!this.patternActive || shieldCount >= maxShields) return;

      const existingShields = window.PowerUpManager.powerUps.filter(
        (p) => p.type && p.type.id === 0
      );

      if (existingShields.length === 0) {
        this.spawnProtectiveShield();
        shieldCount++;
        console.log(
          `🛡️ Escudo ${shieldCount} spawneado - siguiente en 10s después de recogerlo`
        );

        const checkPickup = () => {
          const currentShields = window.PowerUpManager.powerUps.filter(
            (p) => p.type && p.type.id === 0
          );

          if (currentShields.length === 0) {
            console.log("🛡️ Escudo recogido - esperando 10s para el siguiente");
            setTimeout(spawnNextShield, 10000);
          } else {
            setTimeout(checkPickup, 1000);
          }
        };

        setTimeout(checkPickup, 1000);
      }
    };

    setTimeout(spawnNextShield, 5000);
  },

  spawnProtectiveShield() {
    console.log("🛡️ Spawneando escudo protector...");

    const canvas = window.getCanvas();
    const x = 80 + Math.random() * (canvas.width - 160);
    const y = 80 + Math.random() * (canvas.height - 160);
    const shieldSize = GameConfig.PLAYER_SIZE * 0.8;

    const shield = {
      x: x,
      y: y,
      width: shieldSize,
      height: shieldSize,
      velocityX: 0,
      velocityY: 0,
      type: GameConfig.POWERUP_CONFIG.types.SHIELD,
      pulseTimer: 0,
      glowIntensity: 0.8,
      spawnTime: window.getGameTime(),
      isStatic: true,
    };

    window.PowerUpManager.powerUps.push(shield);
    console.log(
      `🛡️ Escudo estático spawneado en (${Math.round(x)}, ${Math.round(y)})`
    );
  },

  // ======================================================
  // 🔥 FINAL DE FASE CORREGIDO - BOSS VULNERABLE
  // ======================================================

  endBulletPhase() {
    console.log("🌟 Terminando fase Touhou");

    this.patternActive = false;
    this.cleanup();

    // Liberar boss
    if (this.bossManager.boss) {
      this.bossManager.boss.isStationary = false;
    }

    // Volver a HUNTING a través del sistema de fases
    if (this.bossManager.phases) {
      this.bossManager.phases.endCurrentPhase();
    }
  },

  // ======================================================
  // CREACIÓN DE BALAS
  // ======================================================

  createTouhouBullet(angle, speed, color, isLaser = false) {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    const bossCenterX = boss.x + boss.width / 2;
    const bossCenterY = boss.y + boss.height / 2;

    const bullet = this.createBulletObject(
      bossCenterX - this.bulletConfig.size / 2,
      bossCenterY - this.bulletConfig.size / 2,
      Math.cos(angle) * speed * canvas.width,
      Math.sin(angle) * speed * canvas.height,
      color,
      isLaser
    );

    this.bulletPatterns.push(bullet);
  },

  createBulletObject(x, y, velocityX, velocityY, color, isLaser = false) {
    return {
      x: x,
      y: y,
      width: isLaser ? this.bulletConfig.size * 1.5 : this.bulletConfig.size,
      height: isLaser ? this.bulletConfig.size * 1.5 : this.bulletConfig.size,
      velocityX: velocityX,
      velocityY: velocityY,
      color: color,
      life: isLaser ? this.bulletConfig.life * 1.5 : this.bulletConfig.life,
      type: "touhou",
      glowIntensity: this.bulletConfig.glowIntensity,
      isLaser: isLaser,
      pulseTimer: 0,
    };
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  draw(ctx) {
    for (const bullet of this.bulletPatterns) {
      this.drawSingleBullet(ctx, bullet);
    }
  },

  drawSingleBullet(ctx, bullet) {
    ctx.save();

    // Efecto de brillo
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = bullet.isLaser ? 15 : 8 + bullet.glowIntensity * 5;

    if (bullet.isLaser) {
      this.drawLaserBullet(ctx, bullet);
    } else {
      this.drawNormalBullet(ctx, bullet);
    }

    ctx.restore();
  },

  drawNormalBullet(ctx, bullet) {
    const centerX = bullet.x + bullet.width / 2;
    const centerY = bullet.y + bullet.height / 2;
    const radius = bullet.width / 2;

    // Bala circular con brillo
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo brillante
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius / 2, 0, Math.PI * 2);
    ctx.fill();

    // Efecto de pulso
    bullet.pulseTimer++;
    const pulseRadius = radius + Math.sin(bullet.pulseTimer * 0.3) * 2;
    ctx.strokeStyle = bullet.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();
  },

  drawLaserBullet(ctx, bullet) {
    const centerX = bullet.x + bullet.width / 2;
    const centerY = bullet.y + bullet.height / 2;

    // Forma más agresiva para láser
    ctx.fillStyle = bullet.color;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

    // Borde brillante
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.strokeRect(bullet.x, bullet.y, bullet.width, bullet.height);

    // Efecto de energía
    ctx.fillStyle = "#FFFF00";
    const innerSize = bullet.width * 0.4;
    ctx.fillRect(
      centerX - innerSize / 2,
      centerY - innerSize / 2,
      innerSize,
      innerSize
    );
  },

  // ======================================================
  // CLEANUP Y UTILIDADES
  // ======================================================

  clearActiveIntervals() {
    this.activeIntervals.forEach((interval) => clearInterval(interval));
    this.activeIntervals = [];
  },

  cleanup() {
    console.log("🧹 Limpiando sistema de balas");

    this.clearActiveIntervals();
    this.bulletPatterns = [];
    this.patternActive = false;
    this.currentPatternIndex = 0;
  },

  reset() {
    this.cleanup();
    console.log("🔄 Sistema de balas reseteado");
  },

  // ======================================================
  // GETTERS
  // ======================================================

  getBullets() {
    return this.bulletPatterns;
  },
  getBulletCount() {
    return this.bulletPatterns.length;
  },
  isPatternActive() {
    return this.patternActive;
  },

  getStats() {
    return {
      totalBullets: this.bulletPatterns.length,
      isActive: this.patternActive,
      laserBullets: this.bulletPatterns.filter((b) => b.isLaser).length,
      normalBullets: this.bulletPatterns.filter((b) => !b.isLaser).length,
    };
  },
};

window.BossBullets = BossBullets;

console.log("🌟 boss-bullets.js ARREGLADO COMPLETAMENTE");
