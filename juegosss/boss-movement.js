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
   * 🔥 CORRECCIÓN: Actualizar executeMovementPattern()
   */
  executeMovementPattern() {
    switch (this.movement.pattern) {
      case "fluid_hunting":
        this.fluidHuntPlayer(); // 🔥 NUEVA función fluida
        break;

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

      case "stationary":
        this.stayStationary(); // 🔥 NUEVA para fases
        break;
    }

    this.movement.patternTimer++;
  },

  /**
   * 🔥 NUEVA: Quedarse quieto para fases especiales
   */
  stayStationary() {
    // Reducir velocidad gradualmente hasta parar
    this.movement.velocityX *= 0.9;
    this.movement.velocityY *= 0.9;

    // Si está muy lento, parar completamente
    if (Math.abs(this.movement.velocityX) < 0.1) this.movement.velocityX = 0;
    if (Math.abs(this.movement.velocityY) < 0.1) this.movement.velocityY = 0;
  },

  // ======================================================
  // PATRONES DE MOVIMIENTO
  // ======================================================

  /**
   * Perseguir al jugador FLUIDAMENTE - SIN PAUSAS NI REBOTES
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

    // 🔥 MOVIMIENTO FLUIDO Y CONSTANTE - SIN PARAR
    if (distance > 50) {
      // Reducido de 10 a 50 para menos agresividad
      const speed = 3.5; // Velocidad fija y fluida

      // Dirección normalizada hacia el jugador
      const dirX = dx / distance;
      const dirY = dy / distance;

      // Aplicar velocidad DIRECTA sin acumulación
      this.movement.velocityX = dirX * speed;
      this.movement.velocityY = dirY * speed;
    } else {
      // Si está muy cerca, moverse lentamente
      this.movement.velocityX *= 0.5;
      this.movement.velocityY *= 0.5;
    }

    // 🔥 NO LIMITAR VELOCIDAD AQUÍ - Dejar fluir
  },

  /**
   * Perseguir jugador lentamente (durante fases) - CORREGIDO
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

    // 🔥 MOVIMIENTO LENTO PERO FLUIDO durante fases
    if (distance > 100) {
      const slowSpeed = 1.8; // Velocidad fija lenta

      const dirX = dx / distance;
      const dirY = dy / distance;

      this.movement.velocityX = dirX * slowSpeed;
      this.movement.velocityY = dirY * slowSpeed;
    } else {
      // Si está cerca, prácticamente parar
      this.movement.velocityX *= 0.3;
      this.movement.velocityY *= 0.3;
    }

    // 🔥 SIN LLAMADA A limitVelocity() - Ya no necesaria
  },

  /**
   * 🔥 NUEVA: Activar persecución fluida inmediata
   */
  enableFluidHunting() {
    console.log("🏃 Boss iniciando persecución fluida");

    this.movement.enabled = true;
    this.movement.isWandering = false;
    this.movement.pattern = "fluid_hunting";
    this.movement.speed = 3.5; // Velocidad alta y fluida

    // 🔥 RESETEAR VELOCIDADES para movimiento inmediato
    this.movement.velocityX = 0;
    this.movement.velocityY = 0;
  },

  /**
   * 🔥 NUEVA: Persecución fluida perfecta
   */
  fluidHuntPlayer() {
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

    // 🔥 MOVIMIENTO FLUIDO CONSTANTE
    if (distance > 30) {
      const huntSpeed = 3.8; // Velocidad de persecución fluida

      const dirX = dx / distance;
      const dirY = dy / distance;

      // 🔥 APLICAR VELOCIDAD DIRECTA
      this.movement.velocityX = dirX * huntSpeed;
      this.movement.velocityY = dirY * huntSpeed;
    } else {
      // Reducir velocidad cerca del jugador
      this.movement.velocityX *= 0.7;
      this.movement.velocityY *= 0.7;
    }
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
   * Movimiento aleatorio MEJORADO - Más natural
   */
  wanderRandomly() {
    const boss = this.bossManager.boss;

    // Calcular diferencia con el objetivo
    const deltaX = this.movement.targetX - boss.x;
    const deltaY = this.movement.targetY - boss.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 🔥 ÁREA MÁS GRANDE PARA OBJETIVOS
    if (distance < 80) {
      // Era 30, ahora 80
      this.movement.wanderTimer++;
      if (this.movement.wanderTimer >= this.movement.wanderDelay) {
        this.selectRandomWanderTarget();
        this.movement.wanderTimer = 0;
      }
    } else {
      // 🔥 MOVIMIENTO MÁS FLUIDO
      const directionX = deltaX / distance;
      const directionY = deltaY / distance;

      // Velocidad constante y suave
      const wanderSpeed = 2.8; // Más rápido que antes
      this.movement.velocityX = directionX * wanderSpeed;
      this.movement.velocityY = directionY * wanderSpeed;
    }
  },

  /**
   * 🔥 NUEVA: Movimiento agresivo FLUIDO para fase final
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

    // 🔥 MOVIMIENTO AGRESIVO PERO FLUIDO
    if (distance > 30) {
      const aggressiveSpeed = 4.5; // Más rápido para fase final

      const dirX = dx / distance;
      const dirY = dy / distance;

      this.movement.velocityX = dirX * aggressiveSpeed;
      this.movement.velocityY = dirY * aggressiveSpeed;
    }
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
   * 🔥 MEJORADO: Objetivo aleatorio más inteligente
   */
  selectRandomWanderTarget() {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    const margin = 80; // Margen más grande

    // 🔥 EVITAR ESQUINAS - Preferir zonas centrales
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3; // 30% del área

    // Generar punto en área central con algo de variación
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;

    this.movement.targetX = centerX + Math.cos(angle) * distance;
    this.movement.targetY = centerY + Math.sin(angle) * distance;

    // Asegurar que esté dentro de límites
    this.movement.targetX = Math.max(
      margin,
      Math.min(canvas.width - boss.width - margin, this.movement.targetX)
    );
    this.movement.targetY = Math.max(
      60,
      Math.min(canvas.height - boss.height - margin, this.movement.targetY)
    );

    console.log(
      `🎯 Boss nuevo objetivo: (${Math.round(
        this.movement.targetX
      )}, ${Math.round(this.movement.targetY)})`
    );
  },

  /**
   * 🔥 CORREGIDO: Aplicar movimiento más suave
   */
  applyMovement() {
    const boss = this.bossManager.boss;

    // 🔥 FACTOR DE TIEMPO LENTO
    const slowFactor = window.slowMotionActive ? window.slowMotionFactor : 1.0;

    // Aplicar movimiento con factor de tiempo lento
    boss.x += this.movement.velocityX * slowFactor;
    boss.y += this.movement.velocityY * slowFactor;

    // 🔥 SUAVIZADO DE MOVIMIENTO - Evitar movimientos bruscos
    this.movement.velocityX *= 0.98; // Muy leve fricción para suavidad
    this.movement.velocityY *= 0.98;
  },

  /**
   * 🔥 NUEVO: Manejar rebotes INTELIGENTES - Sin retrocesos
   */
  handleWallBounces() {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;

    // 🔥 REBOTES SUAVES SIN RETROCESOS BRUSCOS
    if (boss.x <= 0) {
      boss.x = 5; // Pequeño margen
      // Solo cambiar dirección X, mantener Y
      if (this.movement.velocityX < 0) {
        this.movement.velocityX = Math.abs(this.movement.velocityX);
      }
      this.selectAlternativeTarget();
    } else if (boss.x + boss.width >= canvas.width) {
      boss.x = canvas.width - boss.width - 5;
      if (this.movement.velocityX > 0) {
        this.movement.velocityX = -Math.abs(this.movement.velocityX);
      }
      this.selectAlternativeTarget();
    }

    if (boss.y <= 50) {
      boss.y = 55;
      if (this.movement.velocityY < 0) {
        this.movement.velocityY = Math.abs(this.movement.velocityY);
      }
      this.selectAlternativeTarget();
    } else if (boss.y + boss.height >= canvas.height) {
      boss.y = canvas.height - boss.height - 5;
      if (this.movement.velocityY > 0) {
        this.movement.velocityY = -Math.abs(this.movement.velocityY);
      }
      this.selectAlternativeTarget();
    }
  },

  /**
   * 🔥 NUEVA FUNCIÓN: Seleccionar objetivo alternativo cuando choca
   */
  selectAlternativeTarget() {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    const playerPos = Player.getPosition();

    // 🔥 ELEGIR DIRECCIÓN INTELIGENTE basada en posición del jugador
    const margin = 100;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Si el jugador está a la izquierda, ir a la derecha, etc.
    let targetX, targetY;

    if (playerPos.x < centerX) {
      // Jugador a la izquierda, boss va a la derecha
      targetX =
        centerX + margin + Math.random() * (canvas.width / 2 - margin * 2);
    } else {
      // Jugador a la derecha, boss va a la izquierda
      targetX = margin + Math.random() * (centerX - margin * 2);
    }

    if (playerPos.y < centerY) {
      // Jugador arriba, boss va abajo
      targetY =
        centerY + margin + Math.random() * (canvas.height / 2 - margin * 2);
    } else {
      // Jugador abajo, boss va arriba
      targetY = 50 + margin + Math.random() * (centerY - margin * 2);
    }

    this.movement.targetX = targetX;
    this.movement.targetY = targetY;

    console.log(
      `🎯 Boss nuevo objetivo estratégico: (${Math.round(
        targetX
      )}, ${Math.round(targetY)})`
    );
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
