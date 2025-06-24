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
  patternSequence: ["spiral", "walls", "burst", "rain", "laser"],

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

      // Mover bala
      bullet.x += bullet.velocityX;
      bullet.y += bullet.velocityY;
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

    console.log("🌟 === INICIANDO FASE TOUHOU (120 SEGUNDOS) ===");

    this.patternActive = true;
    this.currentPatternIndex = 0;

    // Centrar boss
    if (this.bossManager.movement) {
      this.bossManager.movement.teleportToCenter();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🌟 ¡FASE TOUHOU INICIADA!",
        "#FFD700"
      );
    }

    // Secuencia de patrones cada 20 segundos
    this.executePatternSequence();

    // Escudos cada 4 segundos
    this.startShieldSpawning();

    // Terminar después de 120 segundos
    setTimeout(() => {
      this.endBulletPhase();
    }, 120000);
  },

  executePatternSequence() {
    if (!this.patternActive) return;

    const currentPattern =
      this.patternSequence[
        this.currentPatternIndex % this.patternSequence.length
      ];

    console.log(
      `🌟 Ejecutando patrón ${this.currentPatternIndex + 1}: ${currentPattern}`
    );

    // Mensaje del boss
    if (this.bossManager.comments) {
      const messages = {
        spiral: "¡Danza espiral de la muerte!",
        walls: "¡Muros de destrucción!",
        burst: "¡Explosión celestial!",
        rain: "¡Lluvia dirigida del infierno!",
        laser: "¡Láser aniquilador!",
      };
      this.bossManager.comments.sayComment(messages[currentPattern]);
    }

    this.executePattern(currentPattern);

    // Programar siguiente patrón
    this.currentPatternIndex++;
    if (this.currentPatternIndex < 6) {
      setTimeout(() => {
        this.executePatternSequence();
      }, 20000);
    }
  },

  startShieldSpawning() {
    let shieldCount = 0;
    const maxShields = 30;

    const spawnShield = () => {
      if (!this.patternActive || shieldCount >= maxShields) return;

      if (window.PowerUpManager && window.PowerUpManager.powerUps.length < 2) {
        this.spawnProtectiveShield();
        shieldCount++;
      }

      setTimeout(spawnShield, 4000);
    };

    setTimeout(spawnShield, 2000);
  },

  spawnProtectiveShield() {
    // Implementar spawning de escudos protectores
    if (window.PowerUpManager) {
      const canvas = window.getCanvas();
      const shield = {
        x: Math.random() * (canvas.width - 40) + 20,
        y: Math.random() * (canvas.height - 40) + 20,
        type: "shield",
        // Propiedades del escudo
      };
      window.PowerUpManager.powerUps.push(shield);
    }
  },

  endBulletPhase() {
    console.log("🌟 Terminando fase Touhou (120s completados)");

    this.patternActive = false;
    this.cleanup();

    // Si es fase aleatoria, no hacer vulnerable automáticamente
    if (this.bossManager.phases && this.bossManager.phases.isRandomPhase) {
      console.log(
        "🌟 Fase aleatoria completada - delegando al sistema de fases"
      );
      return;
    }

    // Centrar boss y mensaje final
    if (this.bossManager.movement) {
      this.bossManager.movement.teleportToCenter();
    }

    if (this.bossManager.comments) {
      this.bossManager.comments.sayComment(
        "¡Balas celestiales completadas! ¡Siguen siendo débiles!"
      );
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("⚔️ ¡BOSS VULNERABLE!", "#00FF00");
    }

    // Boss vuelve a ser vulnerable
    this.bossManager.isImmune = false;
    this.bossManager.immunityTimer = 0;

    // Reanudar movimiento normal
    setTimeout(() => {
      if (this.bossManager.movement) {
        this.bossManager.movement.enableFluidHunting();
      }
    }, 2000);
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

    const spiralInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(spiralInterval);
        return;
      }

      // Crear balas en espiral
      for (let i = 0; i < config.bulletsPerFrame; i++) {
        const bulletAngle = angle + (i * Math.PI * 2) / config.bulletsPerFrame;
        this.createTouhouBullet(bulletAngle, config.speed, config.color);
      }

      angle += config.rotationSpeed;
    }, config.bulletInterval);

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

    // Crear espacio para esquivar cerca del jugador
    const safeZoneStart =
      Math.floor((playerPos.x / canvas.width) * config.bulletCount) - 2;
    const safeZoneEnd = safeZoneStart + config.gapSize;

    for (let i = 0; i < config.bulletCount; i++) {
      if (i >= safeZoneStart && i <= safeZoneEnd) continue;

      const x = (canvas.width / config.bulletCount) * i;
      const bullet = this.createBulletObject(
        x,
        -20,
        0,
        config.speed * canvas.height,
        config.color
      );

      this.bulletPatterns.push(bullet);
    }

    console.log("🧱 Muro de balas creado con zona segura");
  },

  createCrossPattern() {
    const config = this.patternConfigs.cross;

    const crossInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(crossInterval);
        return;
      }

      // Disparar en 4 direcciones principales
      const directions = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

      directions.forEach((angle) => {
        this.createTouhouBullet(angle, config.speed, config.color);
      });

      // Direcciones diagonales ocasionalmente
      if (Math.random() < 0.3) {
        const diagonals = [
          Math.PI / 4,
          (3 * Math.PI) / 4,
          (5 * Math.PI) / 4,
          (7 * Math.PI) / 4,
        ];
        diagonals.forEach((angle) => {
          this.createTouhouBullet(angle, config.speed * 0.8, "#E74C3C");
        });
      }
    }, config.bulletInterval);

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

      // Crear ráfaga circular
      for (let i = 0; i < config.bulletsPerBurst; i++) {
        const angle = (i * Math.PI * 2) / config.bulletsPerBurst;
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
    }, config.burstInterval);

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
