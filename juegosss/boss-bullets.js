/**
 * Hell Shooter - Boss Bullets System
 * Sistema modular de patrones de balas estilo Touhou
 */

const BossBullets = {
  // ======================================================
  // ESTADO DEL SISTEMA DE BALAS
  // ======================================================

  bossManager: null,

  // Lista de balas activas
  bulletPatterns: [],

  // Estado del sistema
  patternType: "none",
  patternActive: false,
  patternTimer: 0,

  // Configuración de balas
  bulletConfig: {
    size: 12,
    life: 500, // Duración en frames
    baseSpeed: 0.003, // Velocidad base relativa al canvas
    glowIntensity: 0.5,
  },

  // Tipos de patrones disponibles
  availablePatterns: ["spiral", "walls", "cross", "rain", "burst", "laser"],

  // Configuración específica por patrón
  patternConfigs: {
    spiral: {
      duration: 240, // 4 segundos
      bulletInterval: 50, // Cada 50ms
      rotationSpeed: 0.15,
      bulletsPerFrame: 2,
      speed: 0.002,
      color: "#FF6B6B",
    },
    walls: {
      duration: 300, // 5 segundos
      wallInterval: 1000, // Cada segundo
      bulletCount: 12,
      gapSize: 4, // Tamaño del hueco para esquivar
      speed: 0.004,
      color: "#4ECDC4",
    },
    cross: {
      duration: 180, // 3 segundos
      bulletInterval: 100, // Cada 100ms
      directions: 4, // Direcciones principales
      diagonalFreq: 30, // Cada 30 frames diagonales
      speed: 0.004,
      color: "#9B59B6",
    },
    rain: {
      duration: 200, // 3.3 segundos
      bulletInterval: 80, // Cada 80ms
      bulletsPerShot: 3,
      spread: 0.5, // Dispersión angular
      speed: 0.005,
      color: "#F39C12",
    },
    burst: {
      duration: 150, // 2.5 segundos
      burstInterval: 60, // Cada segundo
      bulletsPerBurst: 16,
      speed: 0.003,
      color: "#E74C3C",
    },
    laser: {
      duration: 120, // 2 segundos
      chargeTime: 60, // 1 segundo de carga
      laserWidth: 30,
      speed: 0.008,
      color: "#FF00FF",
    },
  },

  // Estado de intervalos activos
  activeIntervals: [],

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  /**
   * Inicializar el sistema de balas
   */
  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.initBulletSystem();
    console.log("🌟 Sistema de balas Touhou del boss inicializado");
  },

  /**
   * Configurar sistema de balas
   */
  initBulletSystem() {
    this.bulletPatterns = [];
    this.patternType = "none";
    this.patternActive = false;
    this.patternTimer = 0;
    this.activeIntervals = [];
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Actualizar sistema de balas
   */
  update() {
    if (!this.bossManager.active) return;

    // Actualizar todas las balas
    this.updateBullets();

    // Actualizar timer del patrón activo
    if (this.patternActive) {
      this.patternTimer++;
      this.checkPatternCompletion();
    }
  },

  /**
   * Actualizar todas las balas individuales
   */
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

      // Verificar colisión con jugador (solo si está vivo)
      if (Player.getLives() > 0) {
        if (this.checkBulletPlayerCollision(bullet)) {
          // Eliminar la bala ANTES de aplicar daño
          this.bulletPatterns.splice(i, 1);

          // Aplicar daño y verificar resultado
          const playerDied = Player.takeDamage();

          // Si el jugador murió, activar game over inmediatamente
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

  /**
   * Verificar colisión entre bala y jugador
   */
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

  /**
   * Verificar si una bala está fuera de pantalla
   */
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

  /**
   * Iniciar un patrón de balas aleatorio - CORREGIDO PARA RALENTIZAR JUGADOR
   */
  startBulletPattern() {
    if (this.patternActive) {
      console.log("🌟 Patrón ya activo, ignorando nuevo inicio");
      return;
    }

    // Seleccionar patrón aleatorio
    this.patternType =
      this.availablePatterns[
        Math.floor(Math.random() * this.availablePatterns.length)
      ];

    console.log(`🌟 Boss iniciando patrón: ${this.patternType}`);

    this.patternActive = true;
    this.patternTimer = 0;

    // 🔥 NUEVO: Ralentizar jugador durante patrones Touhou intensos
    if (window.Player) {
      this.originalPlayerSpeedPattern = window.Player.moveSpeed;
      window.Player.moveSpeed = 0.5; // 50% más lento durante patrones
      console.log("🐌 Jugador ralentizado durante patrón Touhou");
    }

    // Boss inmune durante el patrón
    this.bossManager.makeImmune(300);

    // Centrar boss para mejor posicionamiento
    if (this.bossManager.movement) {
      this.bossManager.movement.teleportToCenter();
    }

    // Iniciar el patrón específico
    this.executePattern(this.patternType);

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `🌟 PATRÓN ${this.patternType.toUpperCase()}!`,
        "#FFD700"
      );
    }
  },

  /**
   * Ejecutar un patrón específico
   */
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

  /**
   * Verificar si el patrón debe completarse
   */
  checkPatternCompletion() {
    const config = this.patternConfigs[this.patternType];

    if (config && this.patternTimer >= config.duration) {
      this.endCurrentPattern();
    }
  },

  /**
   * Terminar el patrón actual - CORREGIDO PARA RESTAURAR VELOCIDAD
   */
  endCurrentPattern() {
    console.log(`🌟 Terminando patrón: ${this.patternType}`);

    // Limpiar intervalos activos
    this.clearActiveIntervals();

    // 🔥 RESTAURAR velocidad del jugador
    if (window.Player && this.originalPlayerSpeedPattern) {
      window.Player.moveSpeed = this.originalPlayerSpeedPattern;
      console.log(
        "🏃 Velocidad del jugador restaurada al terminar patrón Touhou"
      );
    }

    this.patternActive = false;
    this.patternType = "none";
    this.patternTimer = 0;

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("⚔️ Patrón completado", "#00FF00");
    }
  },

  // ======================================================
  // PATRONES ESPECÍFICOS
  // ======================================================

  /**
   * Patrón espiral de balas
   */
  createSpiralPattern() {
    const config = this.patternConfigs.spiral;
    let angle = 0;

    const spiralInterval = setInterval(() => {
      if (!this.patternActive || this.patternType !== "spiral") {
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

  /**
   * Patrón de muros con espacios
   */
  createWallPattern() {
    const config = this.patternConfigs.walls;
    let wallCount = 0;

    const wallInterval = setInterval(() => {
      if (
        !this.patternActive ||
        this.patternType !== "walls" ||
        wallCount >= 4
      ) {
        clearInterval(wallInterval);
        return;
      }

      this.createWallOfBullets(config);
      wallCount++;
    }, config.wallInterval);

    this.activeIntervals.push(wallInterval);
  },

  /**
   * Crear muro de balas con espacio para esquivar
   */
  createWallOfBullets(config) {
    const canvas = window.getCanvas();
    const playerPos = Player.getPosition();

    // Crear espacio para esquivar cerca del jugador
    const safeZoneStart =
      Math.floor((playerPos.x / canvas.width) * config.bulletCount) - 2;
    const safeZoneEnd = safeZoneStart + config.gapSize;

    for (let i = 0; i < config.bulletCount; i++) {
      // No crear balas en la zona segura
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

  /**
   * Patrón en cruz
   */
  createCrossPattern() {
    const config = this.patternConfigs.cross;

    const crossInterval = setInterval(() => {
      if (!this.patternActive || this.patternType !== "cross") {
        clearInterval(crossInterval);
        return;
      }

      // Disparar en 4 direcciones principales
      const directions = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

      directions.forEach((angle) => {
        this.createTouhouBullet(angle, config.speed, config.color);
      });

      // Direcciones diagonales cada cierto tiempo
      if (this.patternTimer % config.diagonalFreq === 0) {
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

  /**
   * Patrón de lluvia dirigida
   */
  createRainPattern() {
    const config = this.patternConfigs.rain;

    const rainInterval = setInterval(() => {
      if (!this.patternActive || this.patternType !== "rain") {
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

  /**
   * Patrón de ráfagas
   */
  createBurstPattern() {
    const config = this.patternConfigs.burst;

    const burstInterval = setInterval(() => {
      if (!this.patternActive || this.patternType !== "burst") {
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

  /**
   * Patrón de láser
   */
  createLaserPattern() {
    const config = this.patternConfigs.laser;

    // Fase de carga
    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("⚡ CARGANDO LÁSER...", "#FF00FF");
    }

    setTimeout(() => {
      if (!this.patternActive || this.patternType !== "laser") return;

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
    }, config.chargeTime * 16.67); // Convertir frames a ms
  },

  // ======================================================
  // CREACIÓN DE BALAS
  // ======================================================

  /**
   * Crear bala Touhou individual
   */
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

  /**
   * Crear objeto bala con propiedades completas
   */
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

  /**
   * Dibujar todas las balas
   */
  draw(ctx) {
    for (const bullet of this.bulletPatterns) {
      this.drawSingleBullet(ctx, bullet);
    }
  },

  /**
   * Dibujar una bala individual
   */
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

  /**
   * Dibujar bala normal
   */
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

  /**
   * Dibujar bala láser
   */
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
  // UTILIDADES
  // ======================================================

  /**
   * Limpiar intervalos activos
   */
  clearActiveIntervals() {
    this.activeIntervals.forEach((interval) => clearInterval(interval));
    this.activeIntervals = [];
  },

  /**
   * Limpiar todas las balas y patrones
   */
  cleanup() {
    console.log("🧹 Limpiando sistema de balas");

    this.clearActiveIntervals();
    this.bulletPatterns = [];
    this.patternActive = false;
    this.patternType = "none";
    this.patternTimer = 0;
  },

  // ======================================================
  // RESET
  // ======================================================

  /**
   * Reset del sistema de balas
   */
  reset() {
    this.cleanup();
    this.initBulletSystem();
    console.log("🔄 Sistema de balas reseteado");
  },

  // ======================================================
  // GETTERS Y UTILIDADES
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

  getCurrentPattern() {
    return this.patternType;
  },

  getPatternProgress() {
    if (!this.patternActive) return 0;

    const config = this.patternConfigs[this.patternType];
    if (!config) return 0;

    return Math.min(1, this.patternTimer / config.duration);
  },

  /**
   * Verificar si hay balas cerca de una posición
   */
  checkBulletsNearPosition(x, y, radius = 50) {
    return this.bulletPatterns.some((bullet) => {
      const distance = Math.sqrt(
        Math.pow(x - (bullet.x + bullet.width / 2), 2) +
          Math.pow(y - (bullet.y + bullet.height / 2), 2)
      );
      return distance < radius;
    });
  },

  /**
   * Obtener estadísticas del sistema
   */
  getStats() {
    return {
      totalBullets: this.bulletPatterns.length,
      activePattern: this.patternType,
      patternProgress: this.getPatternProgress(),
      isActive: this.patternActive,
      laserBullets: this.bulletPatterns.filter((b) => b.isLaser).length,
      normalBullets: this.bulletPatterns.filter((b) => !b.isLaser).length,
    };
  },
};

// Hacer disponible globalmente
window.BossBullets = BossBullets;

console.log("🌟 boss-bullets.js cargado - Sistema de balas Touhou listo");
