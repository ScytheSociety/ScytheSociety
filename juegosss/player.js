/**
 * Hell Shooter - Player Management ÉPICO
 * Jugador con sistema de combos integrado
 */

const Player = {
  // ======================================================
  // PROPIEDADES DEL JUGADOR
  // ======================================================

  // Información básica
  name: "",
  avatar: "",

  // Posición y dimensiones
  x: 0,
  y: 0,
  width: 0,
  height: 0,

  // Estado del juego
  lives: 7,
  invulnerabilityTime: 0,
  visible: true,
  damaged: false,

  // Seguimiento del mouse/touch
  mouseX: 0,
  mouseY: 0,

  // Power-ups
  activePowerUp: null,
  powerUpTimeLeft: 0,

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  /**
   * Inicializa el jugador
   */
  init(name, avatar) {
    this.name = name;
    this.avatar = avatar;
    this.lives = 7;

    // Posición inicial en el centro
    const canvas = window.getCanvas();
    this.width = GameConfig.PLAYER_SIZE;
    this.height = GameConfig.PLAYER_SIZE;
    this.x = canvas.width / 2 - this.width / 2;
    this.y = canvas.height / 2 - this.height / 2;
    this.mouseX = canvas.width / 2;
    this.mouseY = canvas.height / 2;

    // Resetear estados
    this.invulnerabilityTime = 0;
    this.visible = true;
    this.damaged = false;
    this.activePowerUp = null;
    this.powerUpTimeLeft = 0;
    this.rapidFireActive = false;
    this.rapidFireTimeLeft = 0;

    console.log(`👤 Jugador ÉPICO inicializado: ${name} ${avatar}`);
  },

  /**
   * Configura los controles del jugador
   */
  setupControls(canvas) {
    // Controles de mouse
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.updatePosition();
    });

    // Controles táctiles mejorados
    if (GameConfig.isTouch) {
      canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mouseX = touch.clientX - rect.left;
        this.mouseY = touch.clientY - rect.top - 80; // Offset para no tapar
        this.updatePosition();
      });

      canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mouseX = touch.clientX - rect.left;
        this.mouseY = touch.clientY - rect.top - 80;
        this.updatePosition();
      });
    }

    // Poder especial con espacio
    window.addEventListener("keydown", (e) => {
      if (
        e.key === " " &&
        BulletManager.isSpecialPowerReady() &&
        !BulletManager.isSpecialPowerActive()
      ) {
        BulletManager.activateSpecialPower();
        e.preventDefault();
      }
    });

    console.log("🎮 Controles ÉPICOS configurados");
  },

  /**
   * Actualiza la posición del jugador
   */
  updatePosition() {
    this.x = this.mouseX - this.width / 2;
    this.y = this.mouseY - this.height / 2;

    // Mantener dentro de los límites del canvas
    const canvas = window.getCanvas();
    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
  },

  // ======================================================
  // ACTUALIZACIÓN POR FRAME
  // ======================================================

  /**
   * Actualiza el estado del jugador cada frame
   */
  update() {
    // Actualizar invulnerabilidad
    this.updateInvulnerability();

    // Actualizar power-ups
    this.updatePowerUps();

    // Actualizar posición
    this.updatePosition();
  },

  /**
   * Actualiza el estado de invulnerabilidad
   */
  updateInvulnerability() {
    if (this.invulnerabilityTime > 0) {
      this.invulnerabilityTime--;

      // Efecto de parpadeo
      this.visible = Math.floor(this.invulnerabilityTime / 5) % 2 === 0;
    } else {
      this.visible = true;
      this.damaged = false;
    }
  },

  /**
   * Actualiza los power-ups activos
   */
  updatePowerUps() {
    // Actualizar power-up principal
    if (this.activePowerUp) {
      this.powerUpTimeLeft--;
      if (this.powerUpTimeLeft <= 0) {
        this.deactivatePowerUp();
      }
    }

    // 🔥 NUEVO: Actualizar rapid fire por separado
    if (this.rapidFireActive) {
      this.rapidFireTimeLeft--;
      if (this.rapidFireTimeLeft <= 0) {
        this.rapidFireActive = false;
        console.log("⚡ Rapid Fire terminado");
      }
    }
  },

  // ======================================================
  // SISTEMA DE POWER-UPS
  // ======================================================

  /**
   * Activa un power-up
   */
  activatePowerUp(powerUpType) {
    // 🔥 NUEVO: Sistema combinable - Rapid Fire se mantiene
    if (powerUpType.id === 3) {
      // Rapid Fire
      // Solo actualizar el poder de rapid fire
      this.rapidFireActive = true;
      this.rapidFireTimeLeft = powerUpType.duration;
    } else {
      // Para otros power-ups, reemplazar el actual (excepto rapid fire)
      this.activePowerUp = powerUpType;
      this.powerUpTimeLeft = powerUpType.duration;
    }

    UI.showScreenMessage(`${powerUpType.name}!`, powerUpType.color);
    AudioManager.playSound("powerUp");

    console.log(`⚡ Power-up activado: ${powerUpType.name}`);
  },

  /**
   * Desactiva el power-up actual
   */
  deactivatePowerUp() {
    if (!this.activePowerUp) return;

    console.log(`⚡ Power-up desactivado: ${this.activePowerUp.name}`);
    this.activePowerUp = null;
    this.powerUpTimeLeft = 0;
  },

  // ======================================================
  // SISTEMA DE DAÑO Y VIDAS - CON COMBOS
  // ======================================================

  /**
   * El jugador recibe daño - ROMPE EL COMBO
   */
  takeDamage() {
    // Si es invulnerable, no recibir daño
    if (this.invulnerabilityTime > 0) {
      return false;
    }

    // 🔥 ROMPER COMBO al recibir daño
    if (window.ComboSystem) {
      window.ComboSystem.onPlayerDamaged();
    }

    // Reducir vidas
    this.lives--;

    // Invulnerabilidad temporal
    this.invulnerabilityTime = 120; // 2 segundos
    this.damaged = true;

    // Efectos visuales y sonoros más épicos
    AudioManager.playSound("damaged");
    UI.showScreenMessage("💔 ¡COMBO PERDIDO!", "#FF0000");
    this.createDamageEffect();

    console.log(`💔 Jugador dañado. Vidas: ${this.lives}. Combo roto.`);

    return true;
  },

  /**
   * Crea efecto visual de daño más épico
   */
  createDamageEffect() {
    // Partículas rojas más intensas
    UI.createParticleEffect(
      this.x + this.width / 2,
      this.y + this.height / 2,
      "#FF0000",
      30 // Más partículas
    );

    // Efecto de onda de impacto adicional
    UI.createParticleEffect(
      this.x + this.width / 2,
      this.y + this.height / 2,
      "#FFAA00",
      20
    );
  },

  /**
   * Recupera una vida
   */
  addLife() {
    this.lives++;
    AudioManager.playSound("heart");

    const lifeMessage =
      this.lives > 10
        ? `¡Vida recuperada! ❤️ (${this.lives} vidas)`
        : "¡Vida recuperada! ❤️";

    UI.showScreenMessage(lifeMessage, "#FF0000");

    console.log(`❤️ Vida recuperada. Total: ${this.lives}`);
    return true;
  },

  // ======================================================
  // COLISIONES
  // ======================================================

  /**
   * Verifica colisiones con enemigos
   */
  checkEnemyCollisions(enemies) {
    if (this.invulnerabilityTime > 0) {
      return false;
    }

    for (let i = 0; i < enemies.length; i++) {
      if (this.checkCollisionWith(enemies[i])) {
        // Eliminar enemigo que golpeó
        enemies.splice(i, 1);

        // Aplicar daño (esto romperá el combo automáticamente)
        return this.takeDamage();
      }
    }

    return false;
  },

  /**
   * Verifica colisiones con power-ups
   */
  checkPowerUpCollisions(powerUps) {
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (this.checkCollisionWith(powerUps[i])) {
        // Activar power-up
        this.activatePowerUp(powerUps[i].type);

        // Crear efecto visual más épico
        UI.createParticleEffect(
          powerUps[i].x + powerUps[i].width / 2,
          powerUps[i].y + powerUps[i].height / 2,
          powerUps[i].type.color,
          40 // Más partículas
        );

        // Eliminar power-up
        powerUps.splice(i, 1);
      }
    }
  },

  /**
   * Verifica colisiones con corazones
   */
  checkHeartCollisions(hearts) {
    for (let i = hearts.length - 1; i >= 0; i--) {
      if (this.checkCollisionWith(hearts[i])) {
        // Recuperar vida
        this.addLife();

        // Crear efecto visual más épico
        UI.createParticleEffect(
          hearts[i].x + hearts[i].width / 2,
          hearts[i].y + hearts[i].height / 2,
          "#FF0000",
          40 // Más partículas
        );

        // Eliminar corazón
        hearts.splice(i, 1);
      }
    }
  },

  /**
   * Verifica colisiones con el boss
   */
  checkBossCollisions() {
    if (!BossManager.isActive()) return false;

    const boss = BossManager.getBoss();
    if (this.checkCollisionWith(boss)) {
      return this.takeDamage();
    }

    return false;
  },

  /**
   * Verifica colisión con un objeto
   */
  checkCollisionWith(obj) {
    return (
      this.x < obj.x + obj.width &&
      this.x + this.width > obj.x &&
      this.y < obj.y + obj.height &&
      this.y + this.height > obj.y
    );
  },

  // ======================================================
  // RENDERIZADO ÉPICO
  // ======================================================

  /**
   * Dibuja el jugador con efectos épicos
   */
  draw(ctx) {
    // Siempre actualizar posición
    this.x = this.mouseX - this.width / 2;
    this.y = this.mouseY - this.height / 2;

    // Mantener dentro de los límites
    const canvas = window.getCanvas();
    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));

    // Visibilidad durante el juego
    if (window.getGameTime && !window.isGameEnded()) {
      if (this.invulnerabilityTime > 0) {
        this.visible = window.getGameTime() % 10 < 5; // Parpadeo
      } else {
        this.visible = true;
      }
    } else {
      this.visible = true;
    }

    // Configurar transparencia si es invulnerable
    if (this.invulnerabilityTime > 0) {
      ctx.globalAlpha = 0.7;
    }

    // Dibujar imagen del jugador o respaldo
    if (GameConfig.playerImage && GameConfig.playerImage.complete) {
      ctx.drawImage(
        GameConfig.playerImage,
        this.x,
        this.y,
        this.width,
        this.height
      );
    } else {
      // Fallback épico
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(this.x, this.y, this.width, this.height);

      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, this.width * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Restaurar transparencia
    ctx.globalAlpha = 1.0;

    // Dibujar efectos épicos
    this.drawEpicEffects(ctx);
  },

  /**
   * Dibuja efectos visuales épicos del jugador
   */
  drawEpicEffects(ctx) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Crosshair mejorado
    ctx.strokeStyle = "rgba(255, 0, 0, 0.9)";
    ctx.lineWidth = 2;
    const size = this.width * 0.35;

    // Líneas del crosshair
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX + size, centerY);
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX, centerY + size);
    ctx.stroke();

    // Círculo exterior más épico
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.width * 0.65, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Escudo de invulnerabilidad más épico
    if (this.invulnerabilityTime > 0) {
      const shieldSize = this.width * 0.8;
      const opacity = 0.4 + Math.sin(window.getGameTime() * 0.3) * 0.3;

      ctx.beginPath();
      ctx.arc(centerX, centerY, shieldSize, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Efecto de pulso adicional
      ctx.beginPath();
      ctx.arc(centerX, centerY, shieldSize * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 100, 100, ${opacity * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Aura de power-up más épica
    if (this.activePowerUp) {
      const auraSize = this.width * 0.9;
      const pulse = 0.5 + Math.sin(window.getGameTime() * 0.25) * 0.3;

      ctx.beginPath();
      ctx.arc(centerX, centerY, auraSize, 0, Math.PI * 2);
      ctx.strokeStyle = `${this.activePowerUp.color}${Math.floor(pulse * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Aura exterior
      ctx.beginPath();
      ctx.arc(centerX, centerY, auraSize * 1.3, 0, Math.PI * 2);
      ctx.strokeStyle = `${this.activePowerUp.color}${Math.floor(pulse * 128)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 🔥 EFECTO ESPECIAL: Aura de combo alto
    if (window.ComboSystem) {
      const combo = window.ComboSystem.getCurrentCombo();
      if (combo >= 10) {
        const comboAuraSize = this.width * (1.0 + combo * 0.01); // Crece con combo
        const comboOpacity = Math.min(combo * 0.02, 0.8);
        const comboColor =
          combo >= 30 ? "#FFD700" : combo >= 20 ? "#FF00FF" : "#FFFF00";

        ctx.beginPath();
        ctx.arc(centerX, centerY, comboAuraSize, 0, Math.PI * 2);
        ctx.strokeStyle = `${comboColor}${Math.floor(comboOpacity * 255)
          .toString(16)
          .padStart(2, "0")}`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  },

  // ======================================================
  // GETTERS Y SETTERS
  // ======================================================

  getName() {
    return this.name;
  },
  getAvatar() {
    return this.avatar;
  },
  getLives() {
    return this.lives;
  },
  getPosition() {
    return { x: this.x, y: this.y };
  },
  getSize() {
    return { width: this.width, height: this.height };
  },
  getActivePowerUp() {
    // 🔥 NUEVO: Combinar rapid fire con power-up actual
    if (this.rapidFireActive && this.activePowerUp) {
      // Devolver power-up actual con rapid fire activo
      return {
        ...this.activePowerUp,
        hasRapidFire: true,
      };
    } else if (this.rapidFireActive) {
      // Solo rapid fire activo
      return { id: 3, hasRapidFire: true };
    } else {
      // Power-up normal
      return this.activePowerUp;
    }
  },
  getPowerUpTimeLeft() {
    return this.powerUpTimeLeft;
  },
  isInvulnerable() {
    return this.invulnerabilityTime > 0;
  },

  /**
   * Resetea el jugador al estado inicial
   */
  reset() {
    this.name = "";
    this.avatar = "";
    this.lives = 7;
    this.invulnerabilityTime = 0;
    this.visible = true;
    this.damaged = false;
    this.activePowerUp = null;
    this.powerUpTimeLeft = 0;

    console.log("🔄 Jugador ÉPICO reseteado");
  },
};

// Hacer disponible globalmente
window.Player = Player;

console.log("👤 player.js ÉPICO cargado");
