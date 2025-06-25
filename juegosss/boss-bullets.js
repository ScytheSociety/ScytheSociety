/**
 * Hell Shooter - Boss Bullets System Optimizado
 * Sistema modular de patrones de balas estilo Touhou
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

  // Configuración específica por patrón
  patternConfigs: {
    spiral: {
      bulletInterval: 50,
      rotationSpeed: 0.15,
      bulletsPerFrame: 2,
      speed: 0.002,
      color: "#FF6B6B",
    },
    walls: {
      wallInterval: 1000,
      bulletCount: 12,
      gapSize: 4,
      speed: 0.004,
      color: "#4ECDC4",
    },
    cross: {
      bulletInterval: 100,
      directions: 4,
      diagonalFreq: 30,
      speed: 0.004,
      color: "#9B59B6",
    },
    rain: {
      bulletInterval: 80,
      bulletsPerShot: 3,
      spread: 0.5,
      speed: 0.005,
      color: "#F39C12",
    },
    burst: {
      burstInterval: 60,
      bulletsPerBurst: 16,
      speed: 0.003,
      color: "#E74C3C",
    },
    laser: {
      chargeTime: 60,
      laserWidth: 30,
      speed: 0.008,
      color: "#FF00FF",
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

    // 🔥 USAR CONFIGURACIÓN DINÁMICA
    const duration =
      GameConfig.BOSS_PHASE_CONFIG.BULLETS_DURATION * (1000 / 60); // Convertir frames a ms
    console.log(
      `🌟 === INICIANDO FASE TOUHOU (${duration / 1000} SEGUNDOS) ===`
    );

    this.patternActive = true;
    this.currentPatternIndex = 0;

    // Centrar boss y MANTENERLO QUIETO
    if (this.bossManager.movement) {
      this.bossManager.movement.teleportToCenter();
      this.bossManager.movement.stopMovementAndCenter();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🌟 ¡FASE TOUHOU INICIADA!",
        "#FFD700"
      );
    }

    // SOLO 3 patrones cada 30 segundos
    this.executeSimplePatternSequence();

    // 🛡️ INICIAR SPAWN DE ESCUDOS (esto faltaba)
    this.startShieldSpawning();

    // Terminar después de 90 segundos
    setTimeout(() => {
      this.endBulletPhase();
    }, duration);
  },

  executeSimplePatternSequence() {
    if (!this.patternActive) return;

    const allowedPatterns = ["spiral", "cross", "rain"]; // SOLO estos 3
    const currentPattern =
      allowedPatterns[this.currentPatternIndex % allowedPatterns.length];

    console.log(
      `🌟 Ejecutando patrón PERMITIDO ${
        this.currentPatternIndex + 1
      }: ${currentPattern}`
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

  startShieldSpawning() {
    console.log("🛡️ Iniciando sistema de escudo con delay de 10s");

    let shieldCount = 0;
    const maxShields = 10; // Máximo durante la fase

    const spawnNextShield = () => {
      if (!this.patternActive || shieldCount >= maxShields) return;

      // Verificar que NO haya escudos existentes
      const existingShields = window.PowerUpManager.powerUps.filter(
        (p) => p.type && p.type.id === 0
      );

      if (existingShields.length === 0) {
        this.spawnProtectiveShield();
        shieldCount++;
        console.log(
          `🛡️ Escudo ${shieldCount} spawneado - siguiente en 10s después de recogerlo`
        );

        // 🔥 ESPERAR A QUE SE RECOJA EL ESCUDO
        const checkPickup = () => {
          const currentShields = window.PowerUpManager.powerUps.filter(
            (p) => p.type && p.type.id === 0
          );

          if (currentShields.length === 0) {
            // Escudo recogido, esperar 10 segundos
            console.log("🛡️ Escudo recogido - esperando 10s para el siguiente");
            setTimeout(spawnNextShield, 10000); // 10 segundos después
          } else {
            // Escudo aún ahí, verificar de nuevo en 1 segundo
            setTimeout(checkPickup, 1000);
          }
        };

        // Empezar a verificar si se recogió
        setTimeout(checkPickup, 1000);
      }
    };

    // Primer escudo después de 5 segundos
    setTimeout(spawnNextShield, 5000);
  },

  spawnProtectiveShield() {
    console.log("🛡️ Intentando spawnar escudo protector...");

    if (!window.PowerUpManager) {
      console.error("❌ PowerUpManager no disponible");
      return;
    }

    if (!GameConfig.POWERUP_CONFIG || !GameConfig.POWERUP_CONFIG.types) {
      console.error("❌ POWERUP_CONFIG no disponible");
      return;
    }

    const canvas = window.getCanvas();

    // 🔥 POSICIONAMIENTO INTELIGENTE - Evitar que aparezcan muy cerca
    let x, y;
    let attempts = 0;
    const minDistance = 150; // Distancia mínima entre escudos

    do {
      // Posición aleatoria con margen
      x = 80 + Math.random() * (canvas.width - 160);
      y = 80 + Math.random() * (canvas.height - 160);

      // Verificar distancia con escudos existentes
      let tooClose = false;
      for (const powerUp of window.PowerUpManager.powerUps) {
        if (powerUp.type && powerUp.type.id === 0) {
          // Si es escudo
          const distance = Math.sqrt(
            Math.pow(x - powerUp.x, 2) + Math.pow(y - powerUp.y, 2)
          );
          if (distance < minDistance) {
            tooClose = true;
            break;
          }
        }
      }

      if (!tooClose) break;
      attempts++;
    } while (attempts < 20); // Máximo 20 intentos

    // 🔥 CREAR ESCUDO ESTÁTICO USANDO EL SISTEMA CORRECTO
    const shieldSize = GameConfig.PLAYER_SIZE * 0.8;

    const shield = {
      x: x,
      y: y,
      width: shieldSize,
      height: shieldSize,
      velocityX: 0, // 🔥 ESTÁTICO: Sin movimiento
      velocityY: 0, // 🔥 ESTÁTICO: Sin movimiento

      // 🔥 USAR EL TIPO CORRECTO DE ESCUDO
      type: GameConfig.POWERUP_CONFIG.types.SHIELD, // Tipo escudo del config

      // Efectos visuales
      pulseTimer: 0,
      glowIntensity: 0.8,
      spawnTime: window.getGameTime(),
      isStatic: true, // Marcador para identificar que es estático
    };

    window.PowerUpManager.powerUps.push(shield);

    console.log(
      `🛡️ Escudo estático spawneado en (${Math.round(x)}, ${Math.round(y)})`
    );
    console.log("🛡️ Total power-ups:", window.PowerUpManager.powerUps.length);
  },

  endBulletPhase() {
    console.log("🌟 Terminando fase Touhou (90s completados)");

    this.patternActive = false;
    this.cleanup();

    // BOSS SE QUEDA QUIETO hasta ser vulnerable
    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    if (this.bossManager.comments) {
      this.bossManager.comments.sayComment("¡Fase Touhou completada!");
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("⚔️ ¡BOSS VULNERABLE!", "#00FF00");
    }

    // Boss vulnerable PERO QUIETO
    this.bossManager.isImmune = false;
    this.bossManager.immunityTimer = 0;

    // MOVIMIENTO SOLO DESPUÉS DE 5 SEGUNDOS
    setTimeout(() => {
      if (this.bossManager.movement) {
        this.bossManager.movement.enableFluidHunting();
        console.log("🏃 Boss ahora puede moverse después de ser vulnerable");
      }
    }, 5000);
  },

  executePattern(patternType) {
    switch (patternType) {
      case "spiral":
        this.createSpiralPattern();
        break;
      case "walls":
        this.createWallPattern();
        break;
      case "cross":
        this.createCrossPattern();
        break;
      case "rain":
        this.createRainPattern();
        break;
      case "burst":
        this.createBurstPattern();
        break;
      case "laser":
        this.createLaserPattern();
        break;
    }
  },

  // ======================================================
  // PATRONES ESPECÍFICOS
  // ======================================================

  createSpiralPattern() {
    const config = this.patternConfigs.spiral;
    let angle = 0;

    spiralInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(spiralInterval);
        return;
      }

      // 🔥 MÁS SEPARACIÓN: Solo 1 bala cada 2 rotaciones
      if (Math.floor(angle / (Math.PI * 0.5)) % 2 === 0) {
        this.createTouhouBullet(angle, config.speed, config.color);
      }

      // 🔥 TRIPLE incremento angular para MÁS separación
      angle += config.rotationSpeed * 3.0;
    }, config.bulletInterval + 50); // 🔥 +50ms más lento

    this.activeIntervals.push(spiralInterval);
  },

  createWallPattern() {
    const config = this.patternConfigs.walls;
    let wallCount = 0;

    const wallInterval = setInterval(() => {
      if (!this.patternActive || wallCount >= 4) {
        clearInterval(wallInterval);
        return;
      }

      this.createWallOfBullets(config);
      wallCount++;
    }, config.wallInterval);

    this.activeIntervals.push(wallInterval);
  },

  createWallOfBullets(config) {
    const canvas = window.getCanvas();
    const playerPos = Player.getPosition();

    // 🔥 MUCHAS MENOS BALAS para espacios enormes
    const bulletCount = Math.max(4, config.bulletCount - 8); // Reducir AÚN MÁS

    // 🔥 ZONA SEGURA GIGANTE para esquivar
    const safeZoneStart =
      Math.floor((playerPos.x / canvas.width) * bulletCount) - 1;
    const safeZoneEnd = safeZoneStart + (config.gapSize + 4); // +4 para ESPACIO ENORME

    for (let i = 0; i < bulletCount; i++) {
      if (i >= safeZoneStart && i <= safeZoneEnd) continue;

      const x = (canvas.width / bulletCount) * i;
      const bullet = this.createBulletObject(
        x,
        -20,
        0,
        config.speed * canvas.height,
        config.color
      );

      this.bulletPatterns.push(bullet);
    }

    console.log(`🧱 Muro de SOLO ${bulletCount} balas con ZONA SEGURA GIGANTE`);
  },

  createCrossPattern() {
    const config = this.patternConfigs.cross;

    const crossInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(crossInterval);
        return;
      }

      // 🔥 MENOS BALAS: Solo 1 dirección por vez, alternando
      const directions = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      const currentDirection =
        directions[Math.floor(Date.now() / 1000) % directions.length];

      this.createTouhouBullet(currentDirection, config.speed, config.color);

      // 🔥 ELIMINAR diagonales completamente para más espacio
      // (Sin diagonales = mucho más espacio para moverse)
    }, config.bulletInterval + 80); // 🔥 +80ms mucho más lento

    this.activeIntervals.push(crossInterval);
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
  },

  createBurstPattern() {
    const config = this.patternConfigs.burst;

    const burstInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(burstInterval);
        return;
      }

      // 🔥 MENOS BALAS en la ráfaga circular
      const reducedBulletCount = Math.max(8, config.bulletsPerBurst - 8); // De 16 a 8 balas

      for (let i = 0; i < reducedBulletCount; i++) {
        const angle = (i * Math.PI * 2) / reducedBulletCount;
        this.createTouhouBullet(angle, config.speed, config.color);
      }

      if (this.bossManager.ui) {
        this.bossManager.ui.createParticleEffect(
          this.bossManager.boss.x + this.bossManager.boss.width / 2,
          this.bossManager.boss.y + this.bossManager.boss.height / 2,
          config.color,
          20
        );
      }
    }, config.burstInterval + 40); // 🔥 +40ms más lento entre ráfagas

    this.activeIntervals.push(burstInterval);
  },

  createLaserPattern() {
    const config = this.patternConfigs.laser;

    // Fase de carga
    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("⚡ CARGANDO LÁSER...", "#FF00FF");
    }

    setTimeout(() => {
      if (!this.patternActive) return;

      // Disparar láser hacia el jugador
      const playerPos = Player.getPosition();
      const playerSize = Player.getSize();
      const boss = this.bossManager.boss;

      const targetX = playerPos.x + playerSize.width / 2;
      const targetY = playerPos.y + playerSize.height / 2;

      const bossCenterX = boss.x + boss.width / 2;
      const bossCenterY = boss.y + boss.height / 2;

      const angle = Math.atan2(targetY - bossCenterY, targetX - bossCenterX);

      // Crear múltiples balas para simular láser
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          if (this.patternActive) {
            this.createTouhouBullet(angle, config.speed, config.color, true);
          }
        }, i * 20);
      }

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "⚡ ¡LÁSER DISPARADO!",
          "#FFFF00"
        );
      }
    }, config.chargeTime * 16.67);
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

console.log("🌟 boss-bullets.js optimizado cargado");
