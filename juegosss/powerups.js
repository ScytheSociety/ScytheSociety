/**
 * Hell Shooter - PowerUp Management
 * Sistema de power-ups y corazones
 */

const PowerUpManager = {
  // ======================================================
  // ARRAYS DE ITEMS
  // ======================================================

  powerUps: [],
  hearts: [],

  // Timers de spawn
  powerUpTimer: 0,
  heartTimer: 0,

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Actualiza todos los power-ups y corazones
   */
  update() {
    // Intentar spawn de items
    this.trySpawnPowerUp();
    this.trySpawnHeart();

    // Actualizar items existentes
    this.updatePowerUps();
    this.updateHearts();

    // Limpiar items fuera de pantalla
    this.cleanupItems();
  },

  // ======================================================
  // SISTEMA DE POWER-UPS
  // ======================================================

  /**
   * Intenta crear un power-up
   */
  trySpawnPowerUp() {
    // Limitar cantidad máxima en pantalla
    if (this.powerUps.length >= 2) return;

    this.powerUpTimer++;
    const config = GameConfig.POWERUP_CONFIG;

    // Calcular probabilidad basada en tiempo
    const spawnChance = config.spawnChance * (this.powerUpTimer / 60);

    if (Math.random() < spawnChance) {
      this.spawnPowerUp();
      this.powerUpTimer = 0;
    }
  },

  /**
   * Crea un power-up aleatorio
   */
  spawnPowerUp() {
    const canvas = window.getCanvas();
    const config = GameConfig.POWERUP_CONFIG;

    // Elegir tipo aleatorio
    const types = Object.values(config.types);
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
      velocityY: canvas.height * 0.003,
      velocityX: (Math.random() - 0.5) * 0.002 * canvas.height,

      type: selectedType,

      // Efectos visuales
      pulseTimer: 0,
      glowIntensity: 0,

      spawnTime: window.getGameTime(),
    };

    this.powerUps.push(powerUp);

    console.log(`⚡ Power-up spawneado: ${selectedType.name}`);
  },

  /**
   * Actualiza todos los power-ups
   */
  updatePowerUps() {
    const canvas = window.getCanvas();

    for (let i = 0; i < this.powerUps.length; i++) {
      const powerUp = this.powerUps[i];

      // Movimiento
      powerUp.x += powerUp.velocityX;
      powerUp.y += powerUp.velocityY;

      // Rebote en paredes laterales
      if (powerUp.x <= 0 || powerUp.x + powerUp.width >= canvas.width) {
        powerUp.velocityX *= -1;
      }

      // Efectos visuales
      powerUp.pulseTimer += 0.1;
      powerUp.glowIntensity = 0.5 + Math.sin(powerUp.pulseTimer) * 0.3;
    }
  },

  // ======================================================
  // SISTEMA DE CORAZONES
  // ======================================================

  /**
   * Intenta crear un corazón
   */
  trySpawnHeart() {
    // Limitar cantidad máxima en pantalla
    if (this.hearts.length >= 3) return;

    this.heartTimer++;
    const config = GameConfig.POWERUP_CONFIG;

    // Más probable si el jugador tiene pocas vidas
    let spawnChance = config.heartSpawnChance;
    const playerLives = Player.getLives();

    if (playerLives <= 3) {
      spawnChance *= 3; // 3x más probable
    } else if (playerLives <= 5) {
      spawnChance *= 2; // 2x más probable
    }

    // Calcular probabilidad basada en tiempo
    spawnChance *= this.heartTimer / 60;

    if (Math.random() < spawnChance) {
      this.spawnHeart();
      this.heartTimer = 0;

      // Posibilidad de corazones múltiples
      if (playerLives <= 2 && Math.random() < 0.3) {
        setTimeout(() => this.spawnHeart(), 500);
      }
    }
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

    // Velocidad similar a enemigos pero más lenta
    const level = window.getLevel();
    const levelSpeedFactor = 1 + level * 0.1;
    const speed = canvas.height * 0.002 * levelSpeedFactor;

    const heart = {
      x: x,
      y: y,
      width: size,
      height: size,
      velocityY: speed,
      velocityX: (Math.random() - 0.5) * speed * 0.5,

      // Efectos visuales
      pulseTimer: 0,
      glowIntensity: 0,

      spawnTime: window.getGameTime(),
    };

    this.hearts.push(heart);

    console.log("❤️ Corazón spawneado");
  },

  /**
   * Actualiza todos los corazones
   */
  updateHearts() {
    const canvas = window.getCanvas();

    for (let i = 0; i < this.hearts.length; i++) {
      const heart = this.hearts[i];

      // Movimiento
      heart.x += heart.velocityX;
      heart.y += heart.velocityY;

      // Rebote en bordes laterales
      if (heart.x <= 0 || heart.x + heart.width >= canvas.width) {
        heart.velocityX *= -1;
      }

      // Efectos visuales de pulsación
      heart.pulseTimer += 0.15;
      heart.glowIntensity = 0.6 + Math.sin(heart.pulseTimer) * 0.4;
    }
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
      const outOfBounds = powerUp.y > canvas.height + 50;
      const tooOld = window.getGameTime() - powerUp.spawnTime > 1800; // 30 segundos

      return !outOfBounds && !tooOld;
    });

    // Limpiar corazones
    this.hearts = this.hearts.filter((heart) => {
      const outOfBounds = heart.y > canvas.height + 50;
      const tooOld = window.getGameTime() - heart.spawnTime > 1200; // 20 segundos

      return !outOfBounds && !tooOld;
    });
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  /**
   * Dibuja todos los power-ups y corazones
   */
  draw(ctx) {
    this.drawPowerUps(ctx);
    this.drawHearts(ctx);
  },

  /**
   * Dibuja los power-ups
   */
  drawPowerUps(ctx) {
    for (const powerUp of this.powerUps) {
      ctx.save();

      // Configurar efectos visuales
      ctx.shadowColor = powerUp.type.color;
      ctx.shadowBlur = 10 + powerUp.glowIntensity * 5;

      // Efecto de flotación
      const floatOffset = Math.sin(powerUp.pulseTimer * 2) * 3;
      const drawY = powerUp.y + floatOffset;

      // Forma de diamante
      ctx.fillStyle = powerUp.type.color;
      ctx.beginPath();
      ctx.moveTo(powerUp.x + powerUp.width / 2, drawY);
      ctx.lineTo(powerUp.x + powerUp.width, drawY + powerUp.height / 2);
      ctx.lineTo(powerUp.x + powerUp.width / 2, drawY + powerUp.height);
      ctx.lineTo(powerUp.x, drawY + powerUp.height / 2);
      ctx.closePath();
      ctx.fill();

      // Símbolo interior
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${powerUp.width * 0.4}px Arial`;

      // Símbolo según tipo
      let symbol = "?";
      switch (powerUp.type.id) {
        case 0:
          symbol = "→";
          break; // Penetrante
        case 1:
          symbol = "↑";
          break; // Amplio
        case 2:
          symbol = "✺";
          break; // Explosivo
        case 3:
          symbol = "⚡";
          break; // Rápido
        case 4:
          symbol = "🛡";
          break; // Escudo
      }

      ctx.fillText(
        symbol,
        powerUp.x + powerUp.width / 2,
        drawY + powerUp.height / 2
      );

      ctx.restore();
    }
  },

  /**
   * Dibuja los corazones
   */
  drawHearts(ctx) {
    for (const heart of this.hearts) {
      ctx.save();

      // Configurar efectos visuales
      ctx.shadowColor = "#FF0000";
      ctx.shadowBlur = 15 + heart.glowIntensity * 10;

      // Efecto de pulsación
      const pulse = 1 + heart.glowIntensity * 0.1;
      const centerX = heart.x + heart.width / 2;
      const centerY = heart.y + heart.height / 2;
      const size = heart.width / 2;

      ctx.translate(centerX, centerY);
      ctx.scale(pulse, pulse);

      // Dibujar forma de corazón
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.moveTo(0, -size / 4);
      ctx.bezierCurveTo(size / 2, -size, size, -size / 4, 0, size);
      ctx.bezierCurveTo(-size, -size / 4, -size / 2, -size, 0, -size / 4);
      ctx.fill();

      // Brillo interior
      ctx.fillStyle = "#FFAAAA";
      ctx.scale(0.6, 0.6);
      ctx.beginPath();
      ctx.moveTo(0, -size / 4);
      ctx.bezierCurveTo(size / 2, -size, size, -size / 4, 0, size);
      ctx.bezierCurveTo(-size, -size / 4, -size / 2, -size, 0, -size / 4);
      ctx.fill();

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
    this.powerUpTimer = 0;
    this.heartTimer = 0;

    console.log("⚡ Sistema de power-ups reseteado");
  },
};

// Hacer disponible globalmente
window.PowerUpManager = PowerUpManager;

console.log("⚡ powerups.js cargado - Sistema de power-ups listo");
