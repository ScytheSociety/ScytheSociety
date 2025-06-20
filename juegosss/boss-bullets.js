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

  // Configuración específica por patrón - CORREGIDA para mejor espaciado
  patternConfigs: {
    spiral: {
      duration: 300, // 5 segundos
      bulletInterval: 80, // Cada 80ms (más espaciado)
      rotationSpeed: 0.12,
      bulletsPerFrame: 1, // Solo 1 bala por frame
      speed: 0.0015, // Más lento
      color: "#FF6B6B",
    },
    walls: {
      duration: 360, // 6 segundos
      wallInterval: 1500, // Cada 1.5 segundos (más espaciado)
      bulletCount: 8, // Menos balas por muro
      gapSize: 6, // Hueco más grande para esquivar
      speed: 0.003, // Más lento
      color: "#4ECDC4",
    },
    cross: {
      duration: 240, // 4 segundos
      bulletInterval: 150, // Cada 150ms (más espaciado)
      directions: 4, // Direcciones principales
      diagonalFreq: 40, // Cada 40 frames diagonales (menos frecuente)
      speed: 0.003, // Más lento
      color: "#9B59B6",
    },
    rain: {
      duration: 300, // 5 segundos
      bulletInterval: 120, // Cada 120ms (más espaciado)
      bulletsPerShot: 2, // Solo 2 balas por disparo
      spread: 0.4, // Menos dispersión
      speed: 0.004, // Más lento
      color: "#F39C12",
    },
    burst: {
      duration: 240, // 4 segundos
      burstInterval: 90, // Cada 1.5 segundos (más espaciado)
      bulletsPerBurst: 12, // Menos balas por ráfaga
      speed: 0.002, // Más lento
      color: "#E74C3C",
    },
    laser: {
      duration: 180, // 3 segundos
      chargeTime: 90, // 1.5 segundos de carga (más tiempo)
      laserWidth: 25, // Más delgado
      speed: 0.006, // Más lento
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
   * Iniciar un patrón de balas con persecución - CORREGIDO PARA PERSEGUIR SIEMPRE
   */
  startBulletPattern() {
    if (this.patternActive) {
      console.log("🌟 Patrón ya activo, ignorando nuevo inicio");
      return;
    }

    console.log("🌟 Iniciando fase Touhou con persecución constante");

    // 🔥 BOSS PERSIGUE AL JUGADOR DURANTE TODA LA FASE
    if (this.bossManager.movement) {
      this.bossManager.movement.enableWandering();
      this.bossManager.movement.changePattern("hunting");
      console.log("👹 Boss configurado para perseguir durante Touhou");
    }

    // Seleccionar patrón aleatorio
    this.patternType =
      this.availablePatterns[
        Math.floor(Math.random() * this.availablePatterns.length)
      ];

    this.patternActive = true;
    this.patternTimer = 0;

    // 🔥 JUGADOR LIGERAMENTE RALENTIZADO
    if (window.Player) {
      this.originalPlayerSpeedPattern = window.Player.moveSpeed;
      window.Player.moveSpeed = 0.7; // 30% más lento
      console.log("🐌 Jugador ralentizado durante Touhou");
    }

    // Iniciar el patrón específico
    this.executePattern(this.patternType);

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `🌟 TOUHOU: ${this.patternType.toUpperCase()}!`,
        "#FFD700"
      );
    }

    // 🔥 SPAWEAR ESCUDOS CON CONTROL ESTRICTO
    this.spawnProtectiveShields();

    // 🔥 MANTENER PERSECUCIÓN ACTIVA durante toda la fase
    const huntingInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(huntingInterval);
        return;
      }

      // Reactivar persecución si se desactiva
      if (this.bossManager.movement) {
        this.bossManager.movement.enableWandering();
        this.bossManager.movement.changePattern("hunting");
      }
    }, 2000); // Cada 2 segundos verificar persecución

    this.activeIntervals.push(huntingInterval);
  },

  /**
   * Spawear escudos protectores durante fase Touhou - CORREGIDO SEGÚN ESPECIFICACIÓN
   */
  spawnProtectiveShields() {
    console.log("🛡️ Sistema de escudos Touhou iniciado");

    // 🔥 VARIABLES DE CONTROL ESTRICTO
    let activeFixedShields = 0;
    const maxFixedShields = 2;
    let lastFixedShieldTime = 0;
    let lastFallingShieldTime = 0;

    // 🔥 ESCUDOS FIJOS: cada 4 segundos, máximo 2, no juntos
    const fixedShieldInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(fixedShieldInterval);
        return;
      }

      const currentTime = Date.now();

      // Verificar tiempo mínimo entre escudos fijos (no juntos)
      if (currentTime - lastFixedShieldTime < 4000) return;

      // Verificar límite máximo en pantalla
      if (activeFixedShields >= maxFixedShields) return;

      // Contar escudos reales en pantalla
      const realActiveShields = window.PowerUpManager.powerUps.filter(
        (p) => p.isFixed && p.type.id === 0
      ).length;

      if (realActiveShields >= maxFixedShields) {
        activeFixedShields = realActiveShields;
        return;
      }

      this.createFixedShield();
      activeFixedShields++;
      lastFixedShieldTime = currentTime;

      console.log(
        `🛡️ Escudo fijo spaweado (${activeFixedShields}/${maxFixedShields})`
      );
    }, 1000); // Verificar cada segundo

    // 🔥 ESCUDOS QUE CAEN: cada 30 segundos, uno a la vez
    const fallingShieldInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(fallingShieldInterval);
        return;
      }

      const currentTime = Date.now();

      // Verificar tiempo mínimo entre escudos que caen
      if (currentTime - lastFallingShieldTime < 30000) return;

      // Verificar que no haya escudos cayendo activos
      const activeFallingShields = window.PowerUpManager.powerUps.filter(
        (p) => p.isFalling && p.type.id === 0
      ).length;

      if (activeFallingShields > 0) return;

      this.createFallingShield();
      lastFallingShieldTime = currentTime;

      console.log("🛡️ Escudo cayendo del cielo spaweado");
    }, 5000); // Verificar cada 5 segundos

    // 🔥 LIMPIEZA AUTOMÁTICA de escudos expirados
    const cleanupInterval = setInterval(() => {
      if (!this.patternActive) {
        clearInterval(cleanupInterval);
        return;
      }

      // Limpiar contador de escudos fijos
      const realActiveShields = window.PowerUpManager.powerUps.filter(
        (p) => p.isFixed && p.type.id === 0
      ).length;
      activeFixedShields = realActiveShields;
    }, 2000);

    // Guardar intervalos para limpieza
    this.activeIntervals.push(fixedShieldInterval);
    this.activeIntervals.push(fallingShieldInterval);
    this.activeIntervals.push(cleanupInterval);
  },

  /**
   * Crear escudo fijo en posición estratégica - NUEVO
   */
  createFixedShield() {
    const canvas = window.getCanvas();
    const size = GameConfig.PLAYER_SIZE * 0.7;

    let x, y;
    let validPosition = false;
    let attempts = 0;

    do {
      x = size + Math.random() * (canvas.width - size * 2);
      y = size + Math.random() * (canvas.height - size * 2);

      // No muy cerca del boss
      const boss = this.bossManager.boss;
      const distanceToBoss = Math.sqrt(
        Math.pow(x - (boss.x + boss.width / 2), 2) +
          Math.pow(y - (boss.y + boss.height / 2), 2)
      );

      // No muy cerca de otros escudos fijos
      const otherShields = window.PowerUpManager.powerUps.filter(
        (p) => p.isFixed
      );
      const tooCloseToOther = otherShields.some((shield) => {
        const distance = Math.sqrt(
          Math.pow(x - shield.x, 2) + Math.pow(y - shield.y, 2)
        );
        return distance < 120; // Separación mínima
      });

      validPosition = distanceToBoss > 150 && !tooCloseToOther;
      attempts++;
    } while (!validPosition && attempts < 20);

    // Crear escudo fijo
    const shield = {
      x: x,
      y: y,
      width: size,
      height: size,
      velocityY: 0,
      velocityX: 0,
      type: {
        id: 0,
        name: "Escudo Protector",
        color: "#00FF00",
        duration: 240, // 4 segundos
      },
      isFixed: true, // 🔥 MARCADOR FIJO
      spawnTime: window.getGameTime(),
      pulseTimer: 0,
      glowIntensity: 0.8,
    };

    window.PowerUpManager.powerUps.push(shield);

    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        x + size / 2,
        y + size / 2,
        "#00FF00",
        20
      );
    }
  },

  /**
   * Crear escudo que cae del cielo - NUEVO
   */
  createFallingShield() {
    const canvas = window.getCanvas();
    const size = GameConfig.PLAYER_SIZE * 0.7;

    const shield = {
      x: Math.random() * (canvas.width - size),
      y: -size, // Empezar arriba
      width: size,
      height: size,
      velocityY: 3, // Velocidad de caída
      velocityX: 0,
      type: {
        id: 0,
        name: "Escudo Protector",
        color: "#00FF00",
        duration: 240,
      },
      isFalling: true, // 🔥 MARCADOR DE CAÍDA
      spawnTime: window.getGameTime(),
      pulseTimer: 0,
      glowIntensity: 0.8,
    };

    window.PowerUpManager.powerUps.push(shield);

    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        shield.x + size / 2,
        shield.y + size / 2,
        "#00FFFF",
        15
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
   * Patrón espiral con espacios para esquivar - CORREGIDA
   */
  createSpiralPattern() {
    const config = this.patternConfigs.spiral;
    let angle = 0;
    let skipCounter = 0; // Para crear espacios

    const spiralInterval = setInterval(() => {
      if (!this.patternActive || this.patternType !== "spiral") {
        clearInterval(spiralInterval);
        return;
      }

      // 🔥 CREAR ESPACIOS CADA 4 BALAS para que sea esquivable
      skipCounter++;
      if (skipCounter % 6 === 0) {
        angle += config.rotationSpeed * 3; // Saltar espacio
        return;
      }

      // Crear balas en espiral con menos densidad
      const bulletsInThisFrame = Math.random() < 0.7 ? 1 : 2; // Menos balas

      for (let i = 0; i < bulletsInThisFrame; i++) {
        const bulletAngle = angle + (i * Math.PI * 2) / config.bulletsPerFrame;
        this.createTouhouBullet(bulletAngle, config.speed * 0.8, config.color); // Más lento
      }

      angle += config.rotationSpeed;
    }, config.bulletInterval * 1.5); // Más tiempo entre disparos

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
   * Crear muro de balas con espacios más grandes para esquivar - CORREGIDA
   */
  createWallOfBullets(config) {
    const canvas = window.getCanvas();
    const playerPos = Player.getPosition();

    // 🔥 ESPACIOS MÁS GRANDES PARA ESQUIVAR
    const bulletCount = 8; // Menos balas = más espacios
    const gapSize = 3; // Espacio más grande

    // Crear múltiples espacios seguros
    const safeZones = [];

    // Zona segura principal cerca del jugador
    const playerZoneStart =
      Math.floor((playerPos.x / canvas.width) * bulletCount) - 1;
    safeZones.push({
      start: Math.max(0, playerZoneStart),
      end: Math.min(bulletCount - 1, playerZoneStart + gapSize),
    });

    // Zona segura adicional aleatoria
    const randomZoneStart = Math.floor(Math.random() * (bulletCount - gapSize));
    safeZones.push({
      start: randomZoneStart,
      end: randomZoneStart + gapSize,
    });

    for (let i = 0; i < bulletCount; i++) {
      // Verificar si esta posición está en una zona segura
      const isInSafeZone = safeZones.some(
        (zone) => i >= zone.start && i <= zone.end
      );

      if (isInSafeZone) continue; // No crear bala en zona segura

      const x =
        (canvas.width / bulletCount) * i + canvas.width / bulletCount / 2;
      const bullet = this.createBulletObject(
        x,
        -20,
        0,
        config.speed * canvas.height,
        config.color
      );

      this.bulletPatterns.push(bullet);
    }

    console.log(
      `🧱 Muro de balas creado con ${safeZones.length} zonas seguras`
    );
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
