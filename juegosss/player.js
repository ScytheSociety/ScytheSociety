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
  moveSpeed: 1.0, // Factor de velocidad normal

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

  // 🔥 NUEVO: Sistema de power-ups acumulables
  activePowerUps: [], // Array de power-ups activos
  powerUpVisualEffects: [], // Para mostrar múltiples auras

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
   * Configura los controles del jugador - MEJORADO CON DETECCIÓN TAP/DRAG
   */
  setupControls(canvas) {
    // Controles de mouse (sin cambios)
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.updatePosition();
    });

    // ⭐ CONTROLES TÁCTILES CON OFFSET PARA VER EL PERSONAJE
    let lastTapTime = 0;
    const doubleTapDelay = 300;
    let isMoving = false;
    let touchStartPos = { x: 0, y: 0 };
    let touchMoved = false;

    // ⭐ OFFSET PARA QUE EL PERSONAJE ESTÉ ARRIBA DEL DEDO
    const TOUCH_OFFSET_Y = -100;

    // Touch Start - Registrar posición inicial
    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();

        if (e.touches.length > 0) {
          const rect = canvas.getBoundingClientRect();
          const touch = e.touches[0];

          touchStartPos = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
          };
          touchMoved = false;

          // NO mover el personaje inmediatamente en Yan Ken Po
          if (!window.BossManager || !window.BossManager.yanKenPoPhase) {
            isMoving = true;
          }
        }
      },
      { passive: false }
    );

    // Touch Move - Solo mover si se arrastra
    canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();

        if (e.touches.length > 0 && isMoving) {
          const rect = canvas.getBoundingClientRect();
          const touch = e.touches[0];

          const currentPos = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
          };

          // Verificar si realmente se movió (más de 10 píxeles)
          const distance = Math.sqrt(
            Math.pow(currentPos.x - touchStartPos.x, 2) +
              Math.pow(currentPos.y - touchStartPos.y, 2)
          );

          if (distance > 10) {
            touchMoved = true;

            // Solo mover el personaje si no estamos en Yan Ken Po
            if (!window.BossManager || !window.BossManager.yanKenPoPhase) {
              this.mouseX = currentPos.x;
              this.mouseY = currentPos.y + TOUCH_OFFSET_Y;
              this.updatePosition();
            }
          }
        }
      },
      { passive: false }
    );

    // Touch End
    canvas.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();

        const currentTime = Date.now();

        // Si no se movió, verificar doble tap para poder especial
        if (!touchMoved && currentTime - lastTapTime < doubleTapDelay) {
          if (
            BulletManager.isSpecialPowerReady() &&
            !BulletManager.isSpecialPowerActive()
          ) {
            BulletManager.activateSpecialPower();
            console.log("⚡ Poder especial activado por doble tap");
          }
        }

        lastTapTime = currentTime;
        isMoving = false;
        touchMoved = false;
      },
      { passive: false }
    );

    // Poder especial con espacio (teclado)
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

    console.log(
      "🎮 Controles táctiles mejorados con detección tap/drag y offset -100px"
    );
  },

  /**
   * Actualiza la posición del jugador
   */
  updatePosition() {
    // 🔥 APLICAR SLOWMOTION AL JUGADOR
    let effectiveMoveSpeed = this.moveSpeed;
    if (window.slowMotionActive && window.slowMotionFactor) {
      effectiveMoveSpeed *= window.slowMotionFactor;
    }

    const deltaX = (this.mouseX - this.width / 2 - this.x) * effectiveMoveSpeed;
    const deltaY =
      (this.mouseY - this.height / 2 - this.y) * effectiveMoveSpeed;

    this.x += deltaX * 0.15; // Suavizado
    this.y += deltaY * 0.15;

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
   * 🔥 NUEVO: Actualiza los power-ups acumulables con tiempos individuales
   */
  updatePowerUps() {
    // Actualizar cada power-up activo individualmente
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const powerUp = this.activePowerUps[i];
      powerUp.timeLeft--;

      if (powerUp.timeLeft <= 0) {
        console.log(
          `⚡ Power-up ${powerUp.type.name} expirado individualmente`
        );
        this.activePowerUps.splice(i, 1);

        // Actualizar efectos visuales inmediatamente
        this.updatePowerUpVisuals();
      }
    }
  },

  /**
   * 🔥 NUEVO: Actualiza efectos visuales de múltiples power-ups
   */
  updatePowerUpVisuals() {
    this.powerUpVisualEffects = this.activePowerUps.map((powerUp) => ({
      color: powerUp.type.color,
      intensity: powerUp.timeLeft / powerUp.type.duration,
      radius: 0.9 + powerUp.type.id * 0.1, // Diferentes radios por tipo
    }));
  },

  /**
   * 🔥 NUEVO: Verifica si un power-up específico está activo
   */
  hasPowerUp(powerUpId) {
    return this.activePowerUps.some((p) => p.id === powerUpId);
  },

  /**
   * 🔥 NUEVO: Obtiene todos los power-ups activos (para bullets.js)
   */
  getActivePowerUps() {
    return this.activePowerUps.map((p) => p.type);
  },

  // ======================================================
  // SISTEMA DE POWER-UPS
  // ======================================================

  /**
   * 🔥 NUEVO: Activa un power-up acumulable con tiempo individual
   */
  activatePowerUp(powerUpType) {
    // Buscar si ya existe este tipo de power-up
    const existingPowerUp = this.activePowerUps.find(
      (p) => p.id === powerUpType.id
    );

    if (existingPowerUp) {
      // Si ya existe, RENOVAR su tiempo (no acumular)
      existingPowerUp.timeLeft = powerUpType.duration;
      console.log(
        `⚡ Power-up ${powerUpType.name} RENOVADO - Tiempo reiniciado`
      );
      UI.showScreenMessage(
        `🔄 ${powerUpType.name} renovado!`,
        powerUpType.color
      );
    } else {
      // Si no existe, agregarlo como nuevo
      this.activePowerUps.push({
        id: powerUpType.id,
        type: powerUpType,
        timeLeft: powerUpType.duration,
        startTime: window.getGameTime(), // Para tracking
      });
      console.log(`⚡ Power-up ${powerUpType.name} NUEVO agregado`);
      UI.showScreenMessage(
        `✨ ${powerUpType.name} activado!`,
        powerUpType.color
      );
    }

    AudioManager.playSound("powerUp");

    // Actualizar efectos visuales
    this.updatePowerUpVisuals();

    // Manejar escudo protector
    if (powerUpType.id === 0) {
      // Escudo
      this.activateShield(powerUpType.duration);
    }

    // Mostrar todos los poderes activos
    this.showActivePowerUpsSummary();
  },

  /**
   * Activa el escudo protector
   */
  activateShield(duration) {
    this.invulnerabilityTime = Math.max(this.invulnerabilityTime, duration);
    UI.showScreenMessage("🛡️ ESCUDO ACTIVADO", "#00FF00");
    console.log("🛡️ Escudo protector activado");
  },

  /**
   * Verifica si el escudo está activo
   */
  isShieldActive() {
    return this.invulnerabilityTime > 0;
  },

  /**
   * 🔥 NUEVO: Muestra resumen de power-ups activos
   */
  showActivePowerUpsSummary() {
    if (this.activePowerUps.length === 0) return;

    const activeNames = this.activePowerUps.map((p) => p.type.name).join(" + ");
    console.log(`🎯 Power-ups activos: ${activeNames}`);

    // Solo mostrar si hay múltiples poderes
    if (this.activePowerUps.length > 1) {
      setTimeout(() => {
        UI.showScreenMessage(`🔥 Combo: ${activeNames}`, "#FFD700");
      }, 500);
    }
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
   * El jugador recibe daño - CORREGIDO PARA ACTIVAR GAME OVER INMEDIATO
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

    // ⭐ VERIFICAR MUERTE INMEDIATAMENTE Y ACTIVAR GAME OVER
    if (this.lives <= 0) {
      this.lives = 0; // Asegurar que no sea negativo
      console.log("💀 Jugador ha muerto - activando game over INMEDIATAMENTE");

      // ⭐ ACTIVAR GAME OVER SIN DELAY
      if (
        window.gameOver &&
        typeof window.gameOver === "function" &&
        !window.isGameEnded()
      ) {
        window.gameOver();
      }

      return true;
    }

    // Invulnerabilidad temporal
    this.invulnerabilityTime = 120; // 2 segundos
    this.damaged = true;

    // Efectos visuales y sonoros más épicos
    AudioManager.playSound("damaged");
    UI.showScreenMessage("💔 ¡COMBO PERDIDO!", "#FF0000");
    this.createDamageEffect();

    console.log(`💔 Jugador dañado. Vidas: ${this.lives}. Combo roto.`);

    return false;
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
    // 🔥 LÍMITE MÁXIMO 9 VIDAS
    if (this.lives >= 9) {
      console.log("❤️ Máximo de vidas alcanzado (9)");
      return false;
    }

    this.lives++;
    AudioManager.playSound("heart");

    const lifeMessage =
      this.lives > 7
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

    // 🔥 NUEVO: Círculos de tiempo para power-ups
    for (let i = 0; i < this.activePowerUps.length; i++) {
      const powerUp = this.activePowerUps[i];
      const radius = this.width * (0.7 + i * 0.15); // Radios crecientes
      const timeProgress = powerUp.timeLeft / powerUp.type.duration;

      // Círculo completo (fondo)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${powerUp.type.color}40`; // 25% opacity
      ctx.lineWidth = 5;
      ctx.stroke();

      // Círculo de progreso
      if (timeProgress > 0) {
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          radius,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * timeProgress
        );
        ctx.strokeStyle = powerUp.type.color;
        ctx.lineWidth = 5;
        ctx.stroke();
      }
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
    return Math.max(0, this.lives); // Nunca retornar negativo
  },
  getPosition() {
    return { x: this.x, y: this.y };
  },
  getSize() {
    return { width: this.width, height: this.height };
  },
  getActivePowerUp() {
    // 🔥 NUEVO: Devolver el primer power-up activo para compatibilidad
    return this.activePowerUps.length > 0 ? this.activePowerUps[0].type : null;
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
    this.activePowerUps = []; // ⬅️ AGREGA esta línea
    this.powerUpVisualEffects = []; // ⬅️ AGREGA esta línea

    console.log("🔄 Jugador ÉPICO reseteado");
  },
};

// Hacer disponible globalmente
window.Player = Player;

console.log("👤 player.js ÉPICO cargado");
