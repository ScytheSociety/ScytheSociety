/**
 * Hell Shooter - PowerUp Management CORREGIDO
 * Sistema de power-ups y corazones balanceado como el original
 */

const PowerUpManager = {
  // ======================================================
  // ARRAYS DE ITEMS
  // ======================================================

  powerUps: [],
  hearts: [],

  // 🔥 CORREGIDO: Control de spawn como en el original
  heartSpawned: false,
  powerUpsSpawned: false,

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Actualiza todos los power-ups y corazones
   */
  update() {
    // 🔥 CORREGIDO: Spawn controlado como en el original
    this.trySpawnHeart();
    this.trySpawnPowerUp();

    // Actualizar items existentes
    this.updatePowerUps();
    this.updateHearts();

    // Limpiar items fuera de pantalla
    this.cleanupItems();
  },

  // ======================================================
  // SISTEMA DE CORAZONES - CORREGIDO SEGÚN ORIGINAL
  // ======================================================

  /**
   * Intenta crear un corazón - CORREGIDO según el código original
   */
  trySpawnHeart() {
    // 🔥 CORREGIDO: Un corazón por nivel máximo, como en el original
    if (this.heartSpawned || this.hearts.length >= 1) return;

    // 🔥 CORREGIDO: Probabilidad MUCHO más baja, como en el original
    const spawnChance = 0.0012; // Reducido de 0.01

    if (Math.random() < spawnChance) {
      this.spawnHeart();
      this.heartSpawned = true; // 🔥 IMPORTANTE: Marcar como spawneado
      console.log("❤️ Corazón spawneado - uno por nivel máximo");
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

    // 🔥 CORREGIDO: Velocidad como en el original
    const level = window.getLevel();
    const levelSpeedFactor = 1 + level * 0.1;
    const speed = canvas.height * 0.003 * levelSpeedFactor;

    const heart = {
      x: x,
      y: y,
      width: size,
      height: size,
      velocityY: speed,
      velocityX: (Math.random() - 0.5) * speed * 0.5,

      // Efectos visuales
      pulseTimer: 0,
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

      // Movimiento
      heart.x += heart.velocityX;
      heart.y += heart.velocityY;

      // Rebote en bordes laterales
      if (heart.x <= 0 || heart.x + heart.width >= canvas.width) {
        heart.velocityX *= -1;
      }

      // Efectos visuales de pulsación
      heart.pulseTimer += 0.1;
    }
  },

  // ======================================================
  // SISTEMA DE POWER-UPS - CORREGIDO SEGÚN ORIGINAL
  // ======================================================

  /**
   * Intenta crear un power-up - CORREGIDO según el código original
   */
  trySpawnPowerUp() {
    // 🔥 CORREGIDO: Un power-up por nivel máximo, como en el original
    if (this.powerUpsSpawned || this.powerUps.length >= 1) return;

    // 🔥 CORREGIDO: Probabilidad balanceada, como en el original
    const spawnChance = 0.001; // Probabilidad moderada

    if (Math.random() < spawnChance) {
      this.spawnPowerUp();
      this.powerUpsSpawned = true; // 🔥 IMPORTANTE: Marcar como spawneado
      console.log("⚡ Power-up spawneado - uno por nivel máximo");
    }
  },

  /**
   * Crea un power-up aleatorio
   */
  spawnPowerUp() {
    const canvas = window.getCanvas();

    // 🔥 CORREGIDO: Tipos de power-ups como en el original
    const types = [
      { id: 0, name: "Balas Penetrantes", color: "#FFFF00", duration: 600 },
      { id: 1, name: "Disparo Amplio", color: "#00FFFF", duration: 500 },
      { id: 2, name: "Balas Explosivas", color: "#FF8800", duration: 450 },
      { id: 3, name: "Disparo Rápido", color: "#FF00FF", duration: 550 },
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
      velocityY: canvas.height * 0.003,
      velocityX: (Math.random() - 0.5) * 0.002 * canvas.height,

      type: selectedType,
      pulseTimer: 0,
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

      // Movimiento
      powerUp.x += powerUp.velocityX;
      powerUp.y += powerUp.velocityY;

      // Rebote en paredes laterales
      if (powerUp.x <= 0 || powerUp.x + powerUp.width >= canvas.width) {
        powerUp.velocityX *= -1;
      }

      // Efectos visuales
      powerUp.pulseTimer += 0.1;
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
    const powerUpsRemoved = this.powerUps.length;
    this.powerUps = this.powerUps.filter((powerUp) => {
      return powerUp.y <= canvas.height + 50;
    });

    // Si se eliminó un power-up, permitir spawn de otro
    if (this.powerUps.length < powerUpsRemoved) {
      this.powerUpsSpawned = false;
    }

    // Limpiar corazones
    const heartsRemoved = this.hearts.length;
    this.hearts = this.hearts.filter((heart) => {
      return heart.y <= canvas.height + 50;
    });

    // Si se eliminó un corazón, permitir spawn de otro
    if (this.hearts.length < heartsRemoved) {
      this.heartSpawned = false;
    }
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
      ctx.shadowBlur = 10;

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
   * Dibuja los corazones - CORREGIDO como en el original
   */
  drawHearts(ctx) {
    for (const heart of this.hearts) {
      ctx.save();

      // 🔥 CORREGIDO: Forma de corazón como en el original
      ctx.fillStyle = "#FF0000";
      ctx.shadowColor = "#FF0000";
      ctx.shadowBlur = 15;

      const centerX = heart.x + heart.width / 2;
      const centerY = heart.y + heart.height / 2;
      const size = heart.width / 2;

      // Efecto de pulsación como en el original
      const pulse = 1 + Math.sin(heart.pulseTimer) * 0.1;
      ctx.translate(centerX, centerY);
      ctx.scale(pulse, pulse);

      // Dibujar forma de corazón exacta del original
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

  /**
   * Marca que un nuevo nivel ha comenzado - CORREGIDO
   */
  startNewLevel() {
    // 🔥 CORREGIDO: Resetear flags para nuevo nivel
    this.heartSpawned = false;
    this.powerUpsSpawned = false;
    console.log("🔄 Nuevo nivel - spawn de items permitido");
  },

  /**
   * Elimina un power-up por índice
   */
  removePowerUp(index) {
    if (index >= 0 && index < this.powerUps.length) {
      this.powerUps.splice(index, 1);
      this.powerUpsSpawned = false; // Permitir spawn de otro
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
      this.heartSpawned = false; // Permitir spawn de otro
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
    this.heartSpawned = false;
    this.powerUpsSpawned = false;

    console.log("⚡ Sistema de power-ups reseteado");
  },
};

// Hacer disponible globalmente
window.PowerUpManager = PowerUpManager;

console.log("⚡ powerups.js cargado - Sistema de power-ups corregido");
