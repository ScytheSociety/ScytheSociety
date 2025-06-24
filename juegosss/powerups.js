/**
 * Hell Shooter - PowerUp Management ÉPICO
 * Sistema de power-ups y corazones con combos y más acción
 */

const PowerUpManager = {
  // ======================================================
  // ARRAYS DE ITEMS
  // ======================================================

  powerUps: [],
  hearts: [],

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Actualiza todos los power-ups y corazones - IDÉNTICO PC/MÓVIL
   */
  update() {
    // 🔥 IDÉNTICO: Spawn igual para todos - sin optimizaciones de móvil
    this.trySpawnHeart();
    this.trySpawnPowerUp();

    // Eventos especiales aleatorios
    this.checkSpecialEvents();

    // 🔥 IDÉNTICO: Actualizar items igual para todos
    this.updatePowerUps();
    this.updateHearts();

    // Limpiar items fuera de pantalla
    this.cleanupItems();
  },

  // ======================================================
  // SISTEMA DE CORAZONES - ÉPICO Y BALANCEADO
  // ======================================================

  // Agregar esta verificación al inicio de trySpawnHeart():
  trySpawnHeart() {
    if (this.hearts.length >= 2) return;

    // 🔥 NUEVO: Reducir probabilidad en fase Touhou
    let probabilityReduction = 1.0;
    if (
      window.getLevel() === 11 &&
      window.BossManager &&
      window.BossManager.bullets &&
      window.BossManager.bullets.isPatternActive()
    ) {
      probabilityReduction = 0.3; // 70% menos probabilidad en fase Touhou
      console.log("🛡️ Fase Touhou activa - probabilidad de corazones reducida");
    }

    const playerLives = Player.getLives();
    let heartChance = 0;

    // Sistema inteligente basado en vidas (igual que antes)
    if (playerLives <= 1) {
      heartChance = 0.004;
    } else if (playerLives <= 2) {
      heartChance = 0.003;
    } else if (playerLives <= 3) {
      heartChance = 0.002;
    } else if (playerLives <= 4) {
      heartChance = 0.001;
    } else if (playerLives <= 5) {
      heartChance = 0.0005;
    } else if (playerLives <= 6) {
      heartChance = 0.0003;
    } else if (playerLives <= 7) {
      heartChance = 0.0001;
    } else if (playerLives >= 8) {
      heartChance = 0;
    }

    // 🔥 APLICAR REDUCCIÓN DE FASE TOUHOU
    heartChance *= probabilityReduction;

    if (Math.random() < heartChance) {
      this.spawnHeart();
      console.log(
        `❤️ Corazón spawneado (Vidas: ${playerLives}, Fase Touhou: ${
          probabilityReduction < 1
        })`
      );
    }
  },

  /**
   * Fuerza el spawn de un corazón (para combos)
   */
  forceSpawnHeart() {
    if (this.hearts.length >= 3) return;
    this.spawnHeart();
    console.log("❤️ Corazón forzado por combo");
  },

  /**
   * Crea un corazón de recuperación
   */
  spawnHeart() {
    const canvas = window.getCanvas();
    const size = GameConfig.PLAYER_SIZE * 0.8;

    // Posición aleatoria (evitando bordes)
    const x = size + Math.random() * (canvas.width - size * 2);
    const y = -size;

    // 🔥 Velocidad más lenta para ser más fácil de agarrar
    const level = window.getLevel();
    const levelSpeedFactor = 1 + level * 0.08; // Reducido
    const speed = canvas.height * 0.002 * levelSpeedFactor; // Más lento

    const heart = {
      x: x,
      y: y,
      width: size,
      height: size,
      velocityY: speed,
      velocityX: (Math.random() - 0.5) * speed * 0.3, // Menos errático

      // Efectos visuales mejorados
      pulseTimer: 0,
      glowIntensity: 0,
      spawnTime: window.getGameTime(),
    };

    this.hearts.push(heart);
  },

  /**
   * Actualiza todos los corazones
   */
  updateHearts() {
    const canvas = window.getCanvas();

    for (let i = 0; i < this.hearts.length; i++) {
      const heart = this.hearts[i];

      // Movimiento más suave
      heart.x += heart.velocityX;
      heart.y += heart.velocityY;

      // Rebote más suave en bordes laterales
      if (heart.x <= 0 || heart.x + heart.width >= canvas.width) {
        heart.velocityX *= -0.8; // Rebote más suave
      }

      // Efectos visuales mejorados
      heart.pulseTimer += 0.12;
      heart.glowIntensity = 0.6 + Math.sin(heart.pulseTimer) * 0.4;
    }
  },

  // ======================================================
  // SISTEMA DE POWER-UPS - ÉPICO
  // ======================================================

  /**
   * Intenta crear un power-up - BASADO EN VIDA DEL JUGADOR
   */
  trySpawnPowerUp() {
    if (this.powerUps.length >= 2) return; // Máximo 2 en pantalla

    const playerLives = Player.getLives();

    // 🔥 NUEVO: Probabilidad basada en vidas, NO en combos
    let baseChance = 0.0005; // Muy baja probabilidad base

    // Aumentar probabilidad según vidas perdidas
    if (playerLives <= 2) {
      baseChance = 0.003; // Mucho más probable con poca vida
    } else if (playerLives <= 4) {
      baseChance = 0.0015; // Más probable
    } else if (playerLives <= 6) {
      baseChance = 0.001; // Un poco más probable
    } else {
      baseChance = 0.0005; // Probabilidad baja con mucha vida
    }

    if (Math.random() < baseChance) {
      this.spawnPowerUp();
      console.log(`⚡ Power-up spawneado (Vidas: ${playerLives})`);
    }
  },

  /**
   * Fuerza el spawn de un power-up (para combos)
   */
  forceSpawnPowerUp() {
    if (this.powerUps.length >= 4) return;
    this.spawnPowerUp();
    console.log("⚡ Power-up forzado por combo");
  },

  /**
   * Crea un power-up aleatorio - MÁS ÉPICO
   */
  spawnPowerUp() {
    const canvas = window.getCanvas();

    // 🔥 USAR VALORES DE CONFIG.JS (no duplicar)
    const types = [
      GameConfig.POWERUP_CONFIG.types.SHIELD,
      GameConfig.POWERUP_CONFIG.types.WIDE_SHOT,
      GameConfig.POWERUP_CONFIG.types.EXPLOSIVE,
      GameConfig.POWERUP_CONFIG.types.RAPID_FIRE,
    ];

    const selectedType = types[Math.floor(Math.random() * types.length)];

    // 🔥 TAMAÑO RESPONSIVO
    const screenScale = Math.min(canvas.width, canvas.height) / 800;
    const mobileScale = GameConfig.isMobile ? 0.8 : 1.0;
    const size = Math.max(
      30,
      GameConfig.PLAYER_SIZE * 0.7 * screenScale * mobileScale
    );

    const x = size + Math.random() * (canvas.width - size * 2);
    const y = -size;

    // 🔥 VELOCIDAD RESPONSIVA
    const speedScale = GameConfig.isMobile ? 0.8 : 1.0;

    const powerUp = {
      x: x,
      y: y,
      width: size,
      height: size,
      velocityY: canvas.height * 0.0025 * speedScale,
      velocityX: (Math.random() - 0.5) * 0.0015 * canvas.height * speedScale,

      type: selectedType, // Usando el objeto completo de config.js
      pulseTimer: 0,
      glowIntensity: 0,
      spawnTime: window.getGameTime(),
    };

    this.powerUps.push(powerUp);

    console.log(
      `⚡ Power-up spawneado: ${selectedType.name} (${
        selectedType.duration
      } frames = ${selectedType.duration / 60}s)`
    );
  },

  /**
   * Actualiza todos los power-ups
   */
  updatePowerUps() {
    const canvas = window.getCanvas();

    for (let i = 0; i < this.powerUps.length; i++) {
      const powerUp = this.powerUps[i];

      // Movimiento más suave
      powerUp.x += powerUp.velocityX;
      powerUp.y += powerUp.velocityY;

      // Rebote más suave en paredes laterales
      if (powerUp.x <= 0 || powerUp.x + powerUp.width >= canvas.width) {
        powerUp.velocityX *= -0.8;
      }

      // Efectos visuales mejorados
      powerUp.pulseTimer += 0.15;
      powerUp.glowIntensity = 0.7 + Math.sin(powerUp.pulseTimer) * 0.3;
    }
  },

  // ======================================================
  // EVENTOS ESPECIALES ÉPICOS
  // ======================================================

  /**
   * Verifica eventos especiales aleatorios
   */
  checkSpecialEvents() {
    // 🚫 EVENTOS DESHABILITADOS PARA BALANCE
    // Los eventos especiales solo ocurren por combos altos ahora
    return;
  },

  /**
   * Lluvia de meteoritos (enemigos extra agresivos)
   */
  triggerMeteorShower() {
    if (window.ComboSystem) {
      window.ComboSystem.triggerMeteorShower();
    }
  },

  /**
   * Tiempo lento épico
   */
  triggerSlowMotion() {
    if (window.ComboSystem) {
      window.ComboSystem.triggerSlowMotion();
    }
  },

  /**
   * Lluvia de power-ups
   */
  triggerPowerUpShower() {
    UI.showScreenMessage("🌟 ¡LLUVIA DE PODER! 🌟", "#FFD700");

    // Crear 3 power-ups con delay
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.forceSpawnPowerUp();
      }, i * 300);
    }

    AudioManager.playSound("special");
    console.log("🌟 Lluvia de power-ups activada");
  },

  // ======================================================
  // LIMPIEZA Y MANTENIMIENTO
  // ======================================================

  /**
   * Limpia items fuera de pantalla
   */
  cleanupItems() {
    const canvas = window.getCanvas();

    // Limpiar power-ups
    this.powerUps = this.powerUps.filter((powerUp) => {
      return powerUp.y <= canvas.height + 50;
    });

    // Limpiar corazones
    this.hearts = this.hearts.filter((heart) => {
      return heart.y <= canvas.height + 50;
    });
  },

  // ======================================================
  // RENDERIZADO ÉPICO
  // ======================================================

  /**
   * Dibuja todos los power-ups y corazones
   */
  draw(ctx) {
    this.drawPowerUps(ctx);
    this.drawHearts(ctx);
  },

  /**
   * Dibuja los power-ups con efectos épicos
   */
  drawPowerUps(ctx) {
    for (const powerUp of this.powerUps) {
      ctx.save();

      // Configurar efectos visuales mejorados
      ctx.shadowColor = powerUp.type.color;
      ctx.shadowBlur = 15 + powerUp.glowIntensity * 8; // Más brillo

      // Efecto de flotación más pronunciado
      const floatOffset = Math.sin(powerUp.pulseTimer * 2) * 5;
      const drawY = powerUp.y + floatOffset;

      // Efecto de escala pulsante
      const scale = 1 + Math.sin(powerUp.pulseTimer * 1.5) * 0.1;

      ctx.translate(powerUp.x + powerUp.width / 2, drawY + powerUp.height / 2);
      ctx.scale(scale, scale);

      // Forma de diamante mejorada
      ctx.fillStyle = powerUp.type.color;
      ctx.beginPath();
      ctx.moveTo(0, -powerUp.height / 2);
      ctx.lineTo(powerUp.width / 2, 0);
      ctx.lineTo(0, powerUp.height / 2);
      ctx.lineTo(-powerUp.width / 2, 0);
      ctx.closePath();
      ctx.fill();

      // Símbolo interior más grande
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${powerUp.width * 0.5}px Arial`; // Más grande

      // Símbolo según tipo
      let symbol = "?";
      switch (powerUp.type.id) {
        case 0:
          symbol = "🛡️";
          break; // Escudo
        case 1:
          symbol = "🌟";
          break; // Amplio
        case 2:
          symbol = "💥";
          break; // Explosivo
        case 3:
          symbol = "⚡";
          break; // Rápido
      }

      ctx.fillText(symbol, 0, 0);

      ctx.restore();
    }
  },

  /**
   * Dibuja los corazones con efectos épicos usando emoji
   */
  drawHearts(ctx) {
    for (const heart of this.hearts) {
      ctx.save();

      // Configurar efectos visuales mejorados
      ctx.shadowColor = "#FF0000";
      ctx.shadowBlur = 20 + heart.glowIntensity * 15; // Mucho más brillo

      const centerX = heart.x + heart.width / 2;
      const centerY = heart.y + heart.height / 2;

      // Efecto de pulsación más dramático
      const pulse = 1 + heart.glowIntensity * 0.15;
      ctx.translate(centerX, centerY);
      ctx.scale(pulse, pulse);

      // 🔥 EMOJI DE CORAZÓN MÁS BONITO
      ctx.font = `${heart.width * 0.8}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Sombra del emoji para mayor visibilidad
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillText("❤️", 2, 2); // Sombra desplazada

      // Emoji principal
      ctx.fillStyle = "#FF0000";
      ctx.fillText("❤️", 0, 0);

      // Efecto de brillo adicional alrededor del emoji
      ctx.shadowColor = "#FF0000";
      ctx.shadowBlur = 25 + heart.glowIntensity * 20;

      // Segundo emoji más pequeño para efecto de brillo interno
      ctx.scale(0.7, 0.7);
      ctx.fillStyle = `rgba(255, 255, 255, ${heart.glowIntensity * 0.3})`;
      ctx.fillText("❤️", 0, 0);

      ctx.restore();
    }
  },

  // ======================================================
  // GETTERS Y CONTROL
  // ======================================================

  getPowerUps() {
    return this.powerUps;
  },
  getHearts() {
    return this.hearts;
  },
  getPowerUpCount() {
    return this.powerUps.length;
  },
  getHeartCount() {
    return this.hearts.length;
  },

  /**
   * Elimina un power-up por índice
   */
  removePowerUp(index) {
    if (index >= 0 && index < this.powerUps.length) {
      this.powerUps.splice(index, 1);
      return true;
    }
    return false;
  },

  /**
   * Elimina un corazón por índice
   */
  removeHeart(index) {
    if (index >= 0 && index < this.hearts.length) {
      this.hearts.splice(index, 1);
      return true;
    }
    return false;
  },

  /**
   * Resetea el sistema de power-ups
   */
  reset() {
    this.powerUps = [];
    this.hearts = [];

    console.log("⚡ Sistema de power-ups ÉPICO reseteado");
  },
};

// Hacer disponible globalmente
window.PowerUpManager = PowerUpManager;

console.log("⚡ powerups.js ÉPICO cargado");
