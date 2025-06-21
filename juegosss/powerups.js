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

  /**
   * Intenta crear un corazón - MÁS DIFÍCIL DE OBTENER
   */
  trySpawnHeart() {
    // 🔥 Máximo 2 corazones en pantalla (era 3)
    if (this.hearts.length >= 2) return;
    // 🔥 NO CORAZONES DURANTE BOSS FINAL
    if (window.getLevel() >= 11) return;

    const playerLives = Player.getLives();
    const combo = window.ComboSystem ? window.ComboSystem.getCurrentCombo() : 0;

    // 🔥 PROBABILIDAD MUCHO MÁS BAJA
    let baseChance = 0.0004; // Era 0.0002, ahora 0.0004, un poquito mas frecuente

    // Aumentar según vidas perdidas
    if (playerLives <= 2) {
      baseChance *= 3; // Era 4x, ahora 3x
    } else if (playerLives <= 4) {
      baseChance *= 1.8; // Era 2x, ahora 1.8x
    } else if (playerLives <= 6) {
      baseChance *= 1.3; // Era 1.2x, ahora 1.3x
    }

    // Bonus por combo más restrictivo
    if (combo >= 15) {
      // Era 10, ahora 15
      baseChance *= 1.3; // Era 1.5x, ahora 1.3x
    }
    if (combo >= 25) {
      // Era 20, ahora 25
      baseChance *= 1.8; // Era 2x, ahora 1.8x
    }
    if (combo >= 40) {
      // Era 30, ahora 40
      baseChance *= 2.2; // Era 2.5x, ahora 2.2x
    }

    // Límite más estricto para muchas vidas
    if (playerLives >= 8) {
      // Era 10, ahora 8
      baseChance *= 0.05; // Era 0.1, ahora 0.05 (95% menos probable)
    }

    if (Math.random() < baseChance) {
      this.spawnHeart();
      console.log(
        `❤️ Corazón spawneado (Vidas: ${playerLives}, Combo: ${combo})`
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
   * Intenta crear un power-up - MÁS DIFÍCIL DE OBTENER
   */
  trySpawnPowerUp() {
    // 🔥 Máximo 3 power-ups en pantalla (era 4)
    if (this.powerUps.length >= 3) return;

    const combo = window.ComboSystem ? window.ComboSystem.getCurrentCombo() : 0;

    // 🔥 PROBABILIDAD MÁS BAJA
    let baseChance = 0.0018; // Era 0.003, ahora 0.0018 (40% menos frecuente)

    // Bonus por combo más restrictivo
    if (combo >= 8) {
      // Era 5, ahora 8
      baseChance *= 1.3; // Era 1.5x, ahora 1.3x
    }
    if (combo >= 15) {
      // Era 10, ahora 15
      baseChance *= 1.8; // Era 2x, ahora 1.8x
    }
    if (combo >= 25) {
      // Era 20, ahora 25
      baseChance *= 2.5; // Era 3x, ahora 2.5x
    }
    if (combo >= 35) {
      // Era 30, ahora 35
      baseChance *= 3.2; // Era 4x, ahora 3.2x
    }

    if (Math.random() < baseChance) {
      this.spawnPowerUp();
      console.log(`⚡ Power-up spawneado (Combo: ${combo})`);
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

    // 🔥 Power-ups CON DURACIÓN BALANCEADA
    const types = [
      { id: 0, name: "Escudo Protector", color: "#00FF00", duration: 180 }, // 3 segundos
      { id: 1, name: "Disparo Amplio", color: "#00FFFF", duration: 240 }, // 4 segundos
      { id: 2, name: "Balas Explosivas", color: "#FF8800", duration: 180 }, // 3 segundos
      { id: 3, name: "Disparo Rápido", color: "#FF00FF", duration: 300 }, // 5 segundos
    ];

    const selectedType = types[Math.floor(Math.random() * types.length)];

    // Tamaño y posición
    const size = GameConfig.PLAYER_SIZE * 0.7;
    const x = size + Math.random() * (canvas.width - size * 2);
    const y = -size;

    const powerUp = {
      x: x,
      y: y,
      width: size,
      height: size,
      velocityY: canvas.height * 0.0025, // Más lento para ser más fácil
      velocityX: (Math.random() - 0.5) * 0.0015 * canvas.height, // Menos errático

      type: selectedType,
      pulseTimer: 0,
      glowIntensity: 0,
      spawnTime: window.getGameTime(),
    };

    this.powerUps.push(powerUp);
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
