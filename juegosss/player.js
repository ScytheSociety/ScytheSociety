/**
 * Hell Shooter - Player Management CORREGIDO
 * Gestión del jugador basada en el código original funcional
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

  // 🔥 CORREGIDO: Estado del juego como en el original
  lives: 7,
  invulnerabilityTime: 0,
  visible: true,
  damaged: false,

  // Seguimiento del mouse/touch
  mouseX: 0,
  mouseY: 0,

  // 🔥 CORREGIDO: Power-ups como en el original
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
    this.lives = 7; // 🔥 CORREGIDO: 7 vidas como en el original

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

    console.log(`👤 Jugador inicializado: ${name} ${avatar}`);
  },

  /**
   * Configura los controles del jugador - CORREGIDO SEGÚN ORIGINAL
   */
  setupControls(canvas) {
    // Controles de mouse
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.updatePosition();
    });

    // 🔥 CORREGIDO: Controles táctiles como en el original
    if (GameConfig.isTouch) {
      canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mouseX = touch.clientX - rect.left;
        this.mouseY = touch.clientY - rect.top - 80; // 🔥 Offset para que no tape con el dedo
        this.updatePosition();
      });

      canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mouseX = touch.clientX - rect.left;
        this.mouseY = touch.clientY - rect.top - 80; // 🔥 Mismo offset
        this.updatePosition();
      });
    }

    // 🔥 CORREGIDO: Poder especial con espacio
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

    console.log("🎮 Controles configurados");
  },

  /**
   * Actualiza la posición del jugador
   */
  updatePosition() {
    this.x = this.mouseX - this.width / 2;
    this.y = this.mouseY - this.height / 2;

    // 🔥 CORREGIDO: Mantener dentro de los límites del canvas
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
   * Actualiza el estado de invulnerabilidad - CORREGIDO SEGÚN ORIGINAL
   */
  updateInvulnerability() {
    if (this.invulnerabilityTime > 0) {
      this.invulnerabilityTime--;

      // 🔥 CORREGIDO: Efecto de parpadeo como en el original
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
    if (this.activePowerUp) {
      this.powerUpTimeLeft--;

      if (this.powerUpTimeLeft <= 0) {
        this.deactivatePowerUp();
      }
    }
  },

  // ======================================================
  // SISTEMA DE POWER-UPS - CORREGIDO
  // ======================================================

  /**
   * Activa un power-up - CORREGIDO SEGÚN ORIGINAL
   */
  activatePowerUp(powerUpType) {
    // Si hay un power-up activo, reemplazarlo
    if (this.activePowerUp) {
      this.deactivatePowerUp();
    }

    this.activePowerUp = powerUpType;
    this.powerUpTimeLeft = powerUpType.duration;

    // 🔥 CORREGIDO: Efectos especiales según el tipo como en el original
    switch (powerUpType.id) {
      case 3: // Rapid Fire
        // El rapid fire se maneja en BulletManager
        break;
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
  // SISTEMA DE DAÑO Y VIDAS - CORREGIDO SEGÚN ORIGINAL
  // ======================================================

  /**
   * El jugador recibe daño - CORREGIDO SEGÚN ORIGINAL
   */
  takeDamage() {
    // 🔥 CORREGIDO: Si es invulnerable, no recibir daño
    if (this.invulnerabilityTime > 0) {
      return false;
    }

    // Reducir vidas
    this.lives--;

    // 🔥 CORREGIDO: Invulnerabilidad como en el original
    this.invulnerabilityTime = 120; // 2 segundos a 60fps
    this.damaged = true;

    // Efectos visuales y sonoros
    AudioManager.playSound("damaged");
    UI.showScreenMessage("¡Daño recibido!", "#FF0000");
    this.createDamageEffect();

    console.log(`💔 Jugador dañado. Vidas restantes: ${this.lives}`);

    return true;
  },

  /**
   * Crea efecto visual de daño
   */
  createDamageEffect() {
    UI.createParticleEffect(
      this.x + this.width / 2,
      this.y + this.height / 2,
      "#FF0000",
      20
    );
  },

  /**
   * Recupera una vida - CORREGIDO SEGÚN ORIGINAL
   */
  addLife() {
    // 🔥 CORREGIDO: Permitir más de 14 vidas como en el original
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
  // COLISIONES - CORREGIDAS
  // ======================================================

  /**
   * Verifica colisiones con enemigos - CORREGIDO
   */
  checkEnemyCollisions(enemies) {
    if (this.invulnerabilityTime > 0) {
      return false;
    }

    for (let i = 0; i < enemies.length; i++) {
      if (this.checkCollisionWith(enemies[i])) {
        // Eliminar enemigo que golpeó
        enemies.splice(i, 1);

        // Aplicar daño
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

        // Crear efecto visual
        UI.createParticleEffect(
          powerUps[i].x + powerUps[i].width / 2,
          powerUps[i].y + powerUps[i].height / 2,
          powerUps[i].type.color,
          30
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

        // Crear efecto visual
        UI.createParticleEffect(
          hearts[i].x + hearts[i].width / 2,
          hearts[i].y + hearts[i].height / 2,
          "#FF0000",
          30
        );

        // Eliminar corazón
        hearts.splice(i, 1);
      }
    }
  },

  /**
   * Verifica colisiones con el boss (si existe)
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
  // RENDERIZADO - CORREGIDO SEGÚN ORIGINAL
  // ======================================================

  /**
   * Dibuja el jugador en el canvas - CORREGIDO SEGÚN ORIGINAL
   */
  draw(ctx) {
    // 🔥 CORREGIDO: Siempre actualizar posición
    this.x = this.mouseX - this.width / 2;
    this.y = this.mouseY - this.height / 2;

    // Mantener dentro de los límites
    const canvas = window.getCanvas();
    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));

    // 🔥 CORREGIDO: Siempre visible durante el juego activo, solo parpadear si es invulnerable
    if (window.getGameTime && !window.isGameEnded()) {
      if (this.invulnerabilityTime > 0) {
        this.visible = window.getGameTime() % 10 < 5; // Parpadeo cada 10 frames
      } else {
        this.visible = true; // SIEMPRE visible si no es invulnerable
      }
    } else {
      this.visible = true; // Visible en menús y transiciones
    }

    // 🔥 CORREGIDO: Configurar transparencia si es invulnerable
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
      // 🔥 CORREGIDO: Fallback visible como en el original
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

    // Dibujar efectos adicionales
    this.drawEffects(ctx);
  },

  /**
   * Dibuja efectos visuales del jugador - CORREGIDO SEGÚN ORIGINAL
   */
  drawEffects(ctx) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // 🔥 CORREGIDO: Crosshair como en el original
    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    ctx.lineWidth = 1;
    const size = this.width * 0.3;

    // Línea horizontal
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX + size, centerY);
    ctx.stroke();

    // Línea vertical
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX, centerY + size);
    ctx.stroke();

    // 🔥 CORREGIDO: Círculo exterior
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.width * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 🔥 CORREGIDO: Escudo si es invulnerable
    if (this.invulnerabilityTime > 0) {
      const shieldSize = this.width * 0.7;
      ctx.beginPath();
      ctx.arc(centerX, centerY, shieldSize, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 0, 0, ${
        0.3 + Math.sin(window.getGameTime() * 0.2) * 0.2
      })`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Aura de power-up
    if (this.activePowerUp) {
      const auraSize = this.width * 0.8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, auraSize, 0, Math.PI * 2);
      ctx.strokeStyle = `${this.activePowerUp.color}80`;
      ctx.lineWidth = 3;
      ctx.stroke();
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
    return this.activePowerUp;
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

    console.log("🔄 Jugador reseteado");
  },
};

// Hacer disponible globalmente
window.Player = Player;

console.log("👤 player.js cargado y corregido");
