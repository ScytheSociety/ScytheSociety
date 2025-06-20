/**
 * Hell Shooter - Boss Movement System
 * Sistema modular de movimiento fluido del boss
 */

const BossMovement = {
  // ======================================================
  // ESTADO DEL SISTEMA DE MOVIMIENTO
  // ======================================================

  bossManager: null,

  movement: {
    enabled: false,
    targetX: 0,
    targetY: 0,
    velocityX: 0,
    velocityY: 0,
    speed: 2.5,
    wanderTimer: 0,
    wanderDelay: 120,
    isWandering: false,
    pattern: "hunting", // hunting, circling, teleporting, wandering
    patternTimer: 0,
    lastPatternChange: 0,
  },

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  /**
   * Inicializar el sistema de movimiento
   */
  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.initMovementSystem();
    console.log("🚶 Sistema de movimiento del boss inicializado");
  },

  /**
   * Configurar sistema de movimiento
   */
  initMovementSystem() {
    const boss = this.bossManager.boss;

    this.movement = {
      enabled: false,
      targetX: boss.x,
      targetY: boss.y,
      velocityX: 0,
      velocityY: 0,
      speed: 2.5,
      wanderTimer: 0,
      wanderDelay: 120,
      isWandering: false,
      pattern: "hunting",
      patternTimer: 0,
      lastPatternChange: 0,
    };
  },

  // ======================================================
  // CONTROL DE MOVIMIENTO
  // ======================================================

  /**
   * Activar movimiento libre del boss (wandering)
   */
  enableWandering() {
    console.log("🚶 Boss iniciando caminata libre");
    this.movement.enabled = true;
    this.movement.isWandering = true;
    this.movement.pattern = "wandering";
    this.selectRandomWanderTarget();
  },

  /**
   * Detener movimiento y centrar para fases especiales
   */
  stopMovementAndCenter() {
    console.log("⏸️ Boss deteniendo movimiento para fase especial");
    this.movement.enabled = false;
    this.movement.isWandering = false;

    // Centrar boss
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    boss.x = (canvas.width - boss.width) / 2;
    boss.y = (canvas.height - boss.height) / 2;
  },

  /**
   * Cambiar patrón de movimiento
   */
  changePattern(newPattern) {
    console.log(
      `👹 Boss cambiando patrón de movimiento: ${this.movement.pattern} → ${newPattern}`
    );
    this.movement.pattern = newPattern;
    this.movement.patternTimer = 0;
    this.movement.lastPatternChange = window.getGameTime();
  },

  /**
   * Ajustar movimiento para fase específica
   */
  adjustForPhase(phase) {
    switch (phase) {
      case "SUMMONING":
        this.changePattern("hunting");
        this.movement.speed = 2.0;
        break;

      case "MINES":
        this.changePattern("teleporting");
        this.movement.speed = 1.5;
        break;

      case "BULLETS":
        this.changePattern("circling");
        this.movement.speed = 1.0;
        break;

      case "REDLINE":
        this.stopMovementAndCenter();
        break;

      case "YANKENPO":
        this.stopMovementAndCenter();
        break;

      default:
        this.changePattern("hunting");
        this.movement.speed = 2.5;
    }
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Actualizar sistema de movimiento
   */
  update() {
    if (!this.bossManager.active || !this.movement.enabled) return;

    // Ejecutar patrón de movimiento actual
    this.executeMovementPattern();

    // Aplicar movimiento al boss
    this.applyMovement();

    // Manejar rebotes en paredes
    this.handleWallBounces();
  },

  /**
   * Ejecutar el patrón de movimiento actual
   */
  executeMovementPattern() {
    switch (this.movement.pattern) {
      case "hunting":
        this.huntPlayer();
        break;

      case "circling":
        this.circleAroundPlayer();
        break;

      case "teleporting":
        this.teleportMovement();
        break;

      case "wandering":
        this.wanderRandomly();
        break;

      case "aggressive":
        this.aggressiveMovement();
        break;
    }

    this.movement.patternTimer++;
  },

  // ======================================================
  // PATRONES DE MOVIMIENTO
  // ======================================================

  /**
   * Perseguir al jugador inteligentemente - MEJORADA
   */
  huntPlayer() {
    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();
    const boss = this.bossManager.boss;

    const playerCenterX = playerPos.x + playerSize.width / 2;
    const playerCenterY = playerPos.y + playerSize.height / 2;
    const bossCenterX = boss.x + boss.width / 2;
    const bossCenterY = boss.y + boss.height / 2;

    const dx = playerCenterX - bossCenterX;
    const dy = playerCenterY - bossCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 🔥 PERSECUCIÓN MÁS FLUIDA Y AGRESIVA
    if (distance > 80) {
      // Reducido de 100 a 80
      const speed = boss.moveSpeed * 2.2; // Más rápido
      this.movement.velocityX = (dx / distance) * speed;
      this.movement.velocityY = (dy / distance) * speed;
    } else {
      // Muy cerca - movimiento orbital
      const orbitSpeed = boss.moveSpeed * 1.5;
      const orbitAngle = Math.atan2(dy, dx) + Math.PI / 2; // 90 grados

      this.movement.velocityX = Math.cos(orbitAngle) * orbitSpeed;
      this.movement.velocityY = Math.sin(orbitAngle) * orbitSpeed;
    }

    // 🔥 MOVIMIENTO PREDICTIVO - anticipar movimiento del jugador
    const playerVelocityX =
      playerPos.x - (this.lastPlayerX || playerPos.x) || 0;
    const playerVelocityY =
      playerPos.y - (this.lastPlayerY || playerPos.y) || 0;

    // Agregar predicción al movimiento
    const predictionFactor = 0.3;
    this.movement.velocityX += playerVelocityX * predictionFactor;
    this.movement.velocityY += playerVelocityY * predictionFactor;

    // Guardar posición anterior del jugador
    this.lastPlayerX = playerPos.x;
    this.lastPlayerY = playerPos.y;

    // Limitar velocidad máxima
    this.limitVelocity(boss.moveSpeed * 3.0); // Aumentado de 2.5 a 3.0
  },

  /**
   * Perseguir jugador lentamente (durante fases)
   */
  huntPlayerSlow() {
    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();
    const boss = this.bossManager.boss;

    const playerCenterX = playerPos.x + playerSize.width / 2;
    const playerCenterY = playerPos.y + playerSize.height / 2;
    const bossCenterX = boss.x + boss.width / 2;
    const bossCenterY = boss.y + boss.height / 2;

    const dx = playerCenterX - bossCenterX;
    const dy = playerCenterY - bossCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Movimiento lento durante fases
    if (distance > 200) {
      const slowSpeed = boss.moveSpeed * 0.8;
      this.movement.velocityX += (dx / distance) * slowSpeed * 0.2;
      this.movement.velocityY += (dy / distance) * slowSpeed * 0.2;
    }

    // Limitar velocidad lenta
    this.limitVelocity(boss.moveSpeed * 1.5);
  },

  /**
   * Moverse en círculos alrededor del jugador
   */
  circleAroundPlayer() {
    this.movement.patternTimer += 0.05;

    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();
    const playerCenterX = playerPos.x + playerSize.width / 2;
    const playerCenterY = playerPos.y + playerSize.height / 2;

    const radius = 200;
    this.movement.targetX =
      playerCenterX + Math.cos(this.movement.patternTimer) * radius;
    this.movement.targetY =
      playerCenterY + Math.sin(this.movement.patternTimer) * radius;

    const boss = this.bossManager.boss;
    const dx = this.movement.targetX - (boss.x + boss.width / 2);
    const dy = this.movement.targetY - (boss.y + boss.height / 2);

    this.movement.velocityX = dx * 0.02;
    this.movement.velocityY = dy * 0.02;
  },

  /**
   * Movimiento con teletransporte periódico
   */
  teleportMovement() {
    this.movement.patternTimer++;

    if (this.movement.patternTimer > 120) {
      // 2 segundos
      this.intelligentTeleport();
      this.movement.patternTimer = 0;
    } else {
      // Movimiento lento entre teletransportes
      this.huntPlayerSlow();
    }
  },

  /**
   * Movimiento aleatorio (wandering)
   */
  wanderRandomly() {
    const boss = this.bossManager.boss;

    // Calcular diferencia con el objetivo
    const deltaX = this.movement.targetX - boss.x;
    const deltaY = this.movement.targetY - boss.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Si está cerca del objetivo, buscar uno nuevo
    if (distance < 30) {
      this.movement.wanderTimer++;
      if (this.movement.wanderTimer >= this.movement.wanderDelay) {
        this.selectRandomWanderTarget();
        this.movement.wanderTimer = 0;
      }
    } else {
      // Moverse hacia el objetivo
      const directionX = deltaX / distance;
      const directionY = deltaY / distance;

      this.movement.velocityX = directionX * this.movement.speed;
      this.movement.velocityY = directionY * this.movement.speed;
    }
  },

  /**
   * Movimiento agresivo para fase final
   */
  aggressiveMovement() {
    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();
    const boss = this.bossManager.boss;

    const playerCenterX = playerPos.x + playerSize.width / 2;
    const playerCenterY = playerPos.y + playerSize.height / 2;
    const bossCenterX = boss.x + boss.width / 2;
    const bossCenterY = boss.y + boss.height / 2;

    const dx = playerCenterX - bossCenterX;
    const dy = playerCenterY - bossCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Movimiento más agresivo y rápido
    const speed = boss.moveSpeed * 2.5;
    this.movement.velocityX += (dx / distance) * speed * 0.4;
    this.movement.velocityY += (dy / distance) * speed * 0.4;

    // Límite de velocidad más alto
    this.limitVelocity(boss.moveSpeed * 3.5);
  },

  // ======================================================
  // TELETRANSPORTE
  // ======================================================

  /**
   * Teletransporte inteligente
   */
  intelligentTeleport() {
    const canvas = window.getCanvas();
    const playerPos = Player.getPosition();
    const boss = this.bossManager.boss;

    // Efecto en posición actual
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#8B0000",
        30
      );
    }

    // Posiciones estratégicas cerca del jugador
    const positions = [
      { x: playerPos.x - 200, y: playerPos.y - 150 },
      { x: playerPos.x + 200, y: playerPos.y - 150 },
      { x: playerPos.x, y: playerPos.y - 300 },
      { x: playerPos.x - 150, y: playerPos.y + 150 },
      { x: playerPos.x + 150, y: playerPos.y + 150 },
    ];

    // Filtrar posiciones válidas
    const validPositions = positions.filter(
      (pos) =>
        pos.x >= 0 &&
        pos.x + boss.width <= canvas.width &&
        pos.y >= 0 &&
        pos.y + boss.height <= canvas.height
    );

    if (validPositions.length > 0) {
      const newPos =
        validPositions[Math.floor(Math.random() * validPositions.length)];
      boss.x = newPos.x;
      boss.y = newPos.y;

      // Efecto en nueva posición
      if (this.bossManager.ui) {
        this.bossManager.ui.createParticleEffect(
          boss.x + boss.width / 2,
          boss.y + boss.height / 2,
          "#FF0000",
          30
        );
      }

      if (window.AudioManager) {
        AudioManager.playSound("special");
      }
    }
  },

  /**
   * Teletransporte al centro para fases
   */
  teleportToCenter() {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;

    // Efecto visual en posición actual
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#8B0000",
        50
      );
    }

    // Ir al centro
    boss.x = canvas.width / 2 - boss.width / 2;
    boss.y = canvas.height / 2 - boss.height / 2;
    this.movement.targetX = boss.x;
    this.movement.targetY = boss.y;

    // Efecto visual en nueva posición
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#FF0000",
        50
      );
    }

    if (window.AudioManager) {
      AudioManager.playSound("special");
    }
  },

  // ======================================================
  // UTILIDADES DE MOVIMIENTO
  // ======================================================

  /**
   * Seleccionar objetivo aleatorio para wandering
   */
  selectRandomWanderTarget() {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    const margin = 50;

    this.movement.targetX =
      margin + Math.random() * (canvas.width - boss.width - margin * 2);
    this.movement.targetY =
      margin + Math.random() * (canvas.height - boss.height - margin * 2);

    console.log(
      `🎯 Boss nuevo objetivo: (${Math.round(
        this.movement.targetX
      )}, ${Math.round(this.movement.targetY)})`
    );
  },

  /**
   * Aplicar movimiento al boss
   */
  applyMovement() {
    const boss = this.bossManager.boss;
    boss.x += this.movement.velocityX;
    boss.y += this.movement.velocityY;
  },

  /**
   * Limitar velocidad máxima
   */
  limitVelocity(maxSpeed) {
    const currentSpeed = Math.sqrt(
      this.movement.velocityX ** 2 + this.movement.velocityY ** 2
    );

    if (currentSpeed > maxSpeed) {
      this.movement.velocityX =
        (this.movement.velocityX / currentSpeed) * maxSpeed;
      this.movement.velocityY =
        (this.movement.velocityY / currentSpeed) * maxSpeed;
    }
  },

  /**
   * Manejar rebotes en paredes
   */
  handleWallBounces() {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    const bounceStrength = 0.8;

    if (boss.x <= 0) {
      boss.x = 0;
      this.movement.velocityX =
        Math.abs(this.movement.velocityX) * bounceStrength;
      if (this.movement.isWandering) this.selectRandomWanderTarget();
      console.log("🏀 Boss rebotó en pared izquierda");
    } else if (boss.x + boss.width >= canvas.width) {
      boss.x = canvas.width - boss.width;
      this.movement.velocityX =
        -Math.abs(this.movement.velocityX) * bounceStrength;
      if (this.movement.isWandering) this.selectRandomWanderTarget();
      console.log("🏀 Boss rebotó en pared derecha");
    }

    if (boss.y <= 50) {
      // Evitar solaparse con UI
      boss.y = 50;
      this.movement.velocityY =
        Math.abs(this.movement.velocityY) * bounceStrength;
      if (this.movement.isWandering) this.selectRandomWanderTarget();
      console.log("🏀 Boss rebotó en techo");
    } else if (boss.y + boss.height >= canvas.height) {
      boss.y = canvas.height - boss.height;
      this.movement.velocityY =
        -Math.abs(this.movement.velocityY) * bounceStrength;
      if (this.movement.isWandering) this.selectRandomWanderTarget();
      console.log("🏀 Boss rebotó en suelo");
    }
  },

  // ======================================================
  // REACCIONES A EVENTOS
  // ======================================================

  /**
   * Reaccionar al recibir daño
   */
  onDamageReceived(healthPercentage) {
    // Teletransporte defensivo si vida muy baja
    if (healthPercentage < 0.2 && Math.random() < 0.3) {
      this.intelligentTeleport();
      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "👹 ¡Teletransporte defensivo!",
          "#FF00FF"
        );
      }
    }

    // Aumentar agresividad según vida restante
    const boss = this.bossManager.boss;
    boss.aggressionLevel = 1.0 + (1.0 - healthPercentage) * 0.8;

    // Cambiar patrón si vida muy baja
    if (healthPercentage < 0.15 && this.movement.pattern !== "aggressive") {
      this.changePattern("aggressive");
    }
  },

  // ======================================================
  // RESET Y CLEANUP
  // ======================================================

  /**
   * Reset del sistema de movimiento
   */
  reset() {
    this.movement = {
      enabled: false,
      targetX: 0,
      targetY: 0,
      velocityX: 0,
      velocityY: 0,
      speed: 2.5,
      wanderTimer: 0,
      wanderDelay: 120,
      isWandering: false,
      pattern: "hunting",
      patternTimer: 0,
      lastPatternChange: 0,
    };

    console.log("🔄 Sistema de movimiento reseteado");
  },

  // ======================================================
  // GETTERS
  // ======================================================

  getCurrentPattern() {
    return this.movement.pattern;
  },

  isWandering() {
    return this.movement.isWandering;
  },

  getVelocity() {
    return {
      x: this.movement.velocityX,
      y: this.movement.velocityY,
    };
  },
};

// Hacer disponible globalmente
window.BossMovement = BossMovement;

console.log("🚶 boss-movement.js cargado - Sistema de movimiento listo");
