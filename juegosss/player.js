/**
 * Hell Shooter - Player Management
 * Gestión completa del jugador
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

  // Power-ups activos
  activePowerUp: null,
  powerUpTimeLeft: 0,

  // Sistema de escudo
  shieldActive: false,
  shieldTimeLeft: 0,

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  /**
   * Inicializa el jugador
   */
  init(name, avatar) {
    this.name = name;
    this.avatar = avatar;
    this.lives = GameConfig.PLAYER_CONFIG.initialLives;

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
    this.shieldActive = false;
    this.shieldTimeLeft = 0;

    console.log(`👤 Jugador inicializado: ${name} ${avatar}`);
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

    // Controles táctiles
    if (GameConfig.isTouch) {
      canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mouseX = touch.clientX - rect.left;
        this.mouseY = touch.clientY - rect.top - 80; // Offset para que no tape con el dedo
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

    // Poder especial con espacio o clic en indicador
    window.addEventListener("keydown", (e) => {
      if (e.key === " " && BulletManager.isSpecialPowerReady()) {
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

    // Actualizar escudo
    this.updateShield();

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
    if (this.activePowerUp) {
      this.powerUpTimeLeft--;

      if (this.powerUpTimeLeft <= 0) {
        this.deactivatePowerUp();
      }
    }
  },

  /**
   * Actualiza el escudo protector
   */
  updateShield() {
    if (this.shieldActive) {
      this.shieldTimeLeft--;

      if (this.shieldTimeLeft <= 0) {
        this.shieldActive = false;
        console.log("🛡️ Escudo desactivado");
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
    // Si hay un power-up activo, reemplazarlo
    if (this.activePowerUp) {
      this.deactivatePowerUp();
    }

    this.activePowerUp = powerUpType;
    this.powerUpTimeLeft = powerUpType.duration;

    // Efectos especiales según el tipo
    switch (powerUpType.id) {
      case 4: // Escudo
        this.shieldActive = true;
        this.shieldTimeLeft = powerUpType.duration;
        break;

      case 3: // Rapid Fire
        BulletManager.setRapidFire(true, powerUpType.shootDelay);
        break;
    }

    UI.showScreenMessage(`¡${powerUpType.name}!`, powerUpType.color);
    AudioManager.playSound("powerUp");

    console.log(`⚡ Power-up activado: ${powerUpType.name}`);
  },

  /**
   * Desactiva el power-up actual
   */
  deactivatePowerUp() {
    if (!this.activePowerUp) return;

    // Efectos de desactivación según el tipo
    switch (this.activePowerUp.id) {
      case 3: // Rapid Fire
        BulletManager.setRapidFire(false);
        break;
    }

    console.log(`⚡ Power-up desactivado: ${this.activePowerUp.name}`);
    this.activePowerUp = null;
    this.powerUpTimeLeft = 0;
  },

  // ======================================================
  // SISTEMA DE DAÑO Y VIDAS
  // ======================================================

  /**
   * El jugador recibe daño
   */
  takeDamage() {
    // Si tiene escudo activo, es inmune
    if (this.shieldActive) {
      console.log("🛡️ Daño bloqueado por escudo");
      return false;
    }

    // Si es invulnerable, no recibir daño
    if (this.invulnerabilityTime > 0) {
      return false;
    }

    // Reducir vidas
    this.lives--;
    this.invulnerabilityTime = GameConfig.PLAYER_CONFIG.invulnerabilityFrames;
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
   * Recupera una vida
   */
  addLife() {
    if (this.lives < GameConfig.MAX_LIVES) {
      this.lives++;
      AudioManager.playSound("heart");
      UI.showScreenMessage(
        this.lives > 10
          ? `¡Vida recuperada! ❤️ (${this.lives} vidas)`
          : "¡Vida recuperada! ❤️",
        "#FF0000"
      );

      console.log(`❤️ Vida recuperada. Total: ${this.lives}`);
      return true;
    } else {
      // Si está al máximo, dar puntos bonus
      const bonusPoints = 500;
      window.setScore(window.getScore() + bonusPoints);
      UI.showScreenMessage(`¡Vida máxima! +${bonusPoints} puntos`, "#FFD700");
      return false;
    }
  },

  // ======================================================
  // COLISIONES
  // ======================================================

  /**
   * Verifica colisiones con enemigos
   */
  checkEnemyCollisions(enemies) {
    if (this.invulnerabilityTime > 0 || this.shieldActive) {
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
   * Verifica colisiones con el boss
   */
  checkBossCollisions() {
    if (!BossManager.isActive()) return false;

    const boss = BossManager.getBoss();
    if (this.checkCollisionWith(boss)) {
      return this.takeDamage();
    }

    // Verificar colisiones con minas del boss
    const mines = BossManager.getMines();
    for (let i = 0; i < mines.length; i++) {
      if (this.checkCollisionWith(mines[i]) && mines[i].armed) {
        // Explotar mina
        BossManager.explodeMine(i);
        return this.takeDamage();
      }
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
  // RENDERIZADO
  // ======================================================

  /**
   * Dibuja el jugador en el canvas
   */
  draw(ctx) {
    if (!this.visible) return;

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
      // Respaldo visual
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Círculo interno
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.width * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Restaurar transparencia
    ctx.globalAlpha = 1.0;

    // Dibujar efectos adicionales
    this.drawEffects(ctx);
  },

  /**
   * Dibuja efectos visuales del jugador
   */
  drawEffects(ctx) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Crosshair
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

    // Escudo protector
    if (this.shieldActive) {
      const shieldSize = this.width * 0.8;
      const opacity = 0.3 + Math.sin(window.getGameTime() * 0.3) * 0.2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, shieldSize, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 0, ${opacity})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Efecto de brillo
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00FF00";
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Aura de power-up
    if (this.activePowerUp) {
      const auraSize = this.width * 0.9;
      const opacity = 0.4 + Math.sin(window.getGameTime() * 0.2) * 0.2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, auraSize, 0, Math.PI * 2);
      ctx.strokeStyle = `${this.activePowerUp.color}${Math.floor(
        opacity * 255
      ).toString(16)}`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Círculo exterior cuando es invulnerable
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
  isShieldActive() {
    return this.shieldActive;
  },
  isInvulnerable() {
    return this.invulnerabilityTime > 0 || this.shieldActive;
  },

  /**
   * Resetea el jugador al estado inicial
   */
  reset() {
    this.name = "";
    this.avatar = "";
    this.lives = GameConfig.PLAYER_CONFIG.initialLives;
    this.invulnerabilityTime = 0;
    this.visible = true;
    this.damaged = false;
    this.activePowerUp = null;
    this.powerUpTimeLeft = 0;
    this.shieldActive = false;
    this.shieldTimeLeft = 0;

    console.log("🔄 Jugador reseteado");
  },
};

// Hacer disponible globalmente
window.Player = Player;

console.log("👤 player.js cargado - Gestión del jugador lista");
