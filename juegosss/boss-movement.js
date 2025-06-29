/**
 * Hell Shooter - Boss Movement System COMPLETAMENTE ARREGLADO
 * CAMBIOS:
 * - Boss SÍ puede tocar al jugador en paredes
 * - Distancia de parada ELIMINADA
 * - Movimiento más agresivo
 */

const BossMovement = {
  // ======================================================
  // ESTADO DEL SISTEMA DE MOVIMIENTO
  // ======================================================

  bossManager: null,

  movement: {
    enabled: false,
    pattern: "hunting",
    speed: 3.5,
    teleportTimer: 0,
    teleportCooldown: 90,
  },

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.movement = {
      enabled: false,
      pattern: "hunting",
      speed: 3.5,
      teleportTimer: 0,
      teleportCooldown: 90,
    };
    console.log("🚶 Sistema de movimiento del boss inicializado");
  },

  // ======================================================
  // CONTROL DE MOVIMIENTO
  // ======================================================

  enableFluidHunting() {
    console.log("🏃 Boss iniciando persecución fluida AGRESIVA");
    this.movement.enabled = true;
    this.movement.pattern = "hunting";
    this.movement.speed = 4.0; // 🔥 AUMENTADO de 3.5 a 4.0
  },

  stopMovementAndCenter() {
    console.log("⏸️ Boss deteniéndose para fase especial");

    // DESACTIVAR COMPLETAMENTE el movimiento
    this.movement.enabled = false;
    this.movement.pattern = "stationary";

    // Centrar boss
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    boss.x = (canvas.width - boss.width) / 2;
    boss.y = (canvas.height - boss.height) / 2;
    boss.velocityX = 0;
    boss.velocityY = 0;

    // MARCAR BOSS COMO ESTACIONARIO
    boss.isStationary = true;

    console.log("🛑 Boss centrado y marcado como estacionario");
  },

  enableTeleporting() {
    console.log("📡 Boss activando teletransporte agresivo");
    this.movement.enabled = true;
    this.movement.pattern = "teleporting";
    this.movement.teleportTimer = 0;
  },

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
    boss.x = (canvas.width - boss.width) / 2;
    boss.y = (canvas.height - boss.height) / 2;

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
  // 🔥 ACTUALIZACIÓN CORREGIDA - MOVIMIENTO AGRESIVO
  // ======================================================

  update() {
    if (!this.bossManager.active || !this.bossManager.boss) return;

    // Si el boss está marcado como estacionario, no mover
    if (this.bossManager.boss.isStationary) return;

    // Si el movimiento está desactivado, no mover
    if (!this.movement.enabled) return;

    // No mover durante fases especiales
    const currentPhase =
      this.bossManager.phases?.getCurrentPhase() || "UNKNOWN";
    const isPhaseActive = this.bossManager.phases?.isPhaseActive() || false;

    if (isPhaseActive && currentPhase !== "HUNTING") return;

    // No mover durante Red Line
    if (this.bossManager.redline?.phaseActive) return;

    // Ejecutar el patrón de movimiento actual
    switch (this.movement.pattern) {
      case "hunting":
        this.aggressiveHunting(); // 🔥 NUEVA FUNCIÓN
        break;
      case "teleporting":
        this.updateTeleporting();
        break;
    }
  },

  // ======================================================
  // 🔥 NUEVO: MOVIMIENTO SÚPER AGRESIVO
  // ======================================================

  /**
   * Movimiento súper agresivo - Boss SIEMPRE se acerca al jugador
   */
  aggressiveHunting() {
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

    // 🔥 SIN DISTANCIA DE PARADA - SIEMPRE SE MUEVE HACIA EL JUGADOR
    if (distance > 5) {
      // Solo parar si está ENCIMA del jugador (5px)
      let speed = this.movement.speed;

      // 🔥 APLICAR SLOWMOTION AL BOSS
      if (window.slowMotionActive && window.slowMotionFactor) {
        speed *= window.slowMotionFactor;
      }

      const dirX = dx / distance;
      const dirY = dy / distance;

      boss.x += dirX * speed;
      boss.y += dirY * speed;

      // 🔥 DEBUG: Mostrar cuando está muy cerca pero no para
      if (distance < 30) {
        console.log(
          `🎯 Boss MUY CERCA del jugador - Distancia: ${distance.toFixed(1)}px`
        );
      }
    }

    this.keepInBounds();
  },

  updateTeleporting() {
    this.movement.teleportTimer++;

    if (this.movement.teleportTimer >= this.movement.teleportCooldown) {
      this.performTeleport();
      this.movement.teleportTimer = 0;
    }
  },

  performTeleport() {
    const playerPos = Player.getPosition();
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;

    // Efecto visual en posición actual
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#FF8800",
        30
      );
    }

    // 🔥 POSICIONES MÁS CERCA DEL JUGADOR
    const teleportPositions = [
      { x: playerPos.x + 80, y: playerPos.y + 60 }, // Más cerca
      { x: playerPos.x - 80, y: playerPos.y + 60 }, // Más cerca
      { x: playerPos.x + 60, y: playerPos.y - 80 }, // Más cerca
      { x: playerPos.x - 60, y: playerPos.y - 80 }, // Más cerca
      { x: playerPos.x + 100, y: playerPos.y }, // Más cerca
      { x: playerPos.x - 100, y: playerPos.y }, // Más cerca
    ];

    // Filtrar posiciones válidas
    const validPositions = teleportPositions.filter(
      (pos) =>
        pos.x >= 40 && // 🔥 REDUCIDO margen de 80 a 40
        pos.x <= canvas.width - 40 - boss.width &&
        pos.y >= 40 && // 🔥 REDUCIDO margen de 80 a 40
        pos.y <= canvas.height - 40 - boss.height
    );

    if (validPositions.length > 0) {
      const newPos =
        validPositions[Math.floor(Math.random() * validPositions.length)];

      boss.x = newPos.x;
      boss.y = newPos.y;

      // Efecto visual en nueva posición
      if (this.bossManager.ui) {
        this.bossManager.ui.createParticleEffect(
          boss.x + boss.width / 2,
          boss.y + boss.height / 2,
          "#FF0000",
          40
        );
      }

      if (window.AudioManager) {
        AudioManager.playSound("special");
      }

      console.log(
        `📡 Boss teletransportado MÁS CERCA a (${Math.round(
          newPos.x
        )}, ${Math.round(newPos.y)})`
      );
    }
  },

  keepInBounds() {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;

    // 🔥 MÁRGENES MÁS PEQUEÑOS para que pueda ir más cerca de las paredes
    const safeMargin = 20; // Era 80, ahora 20

    const oldX = boss.x;
    const oldY = boss.y;

    // Mantener dentro de límites más estrechos
    boss.x = Math.max(
      safeMargin,
      Math.min(canvas.width - boss.width - safeMargin, boss.x)
    );
    boss.y = Math.max(
      safeMargin,
      Math.min(canvas.height - boss.height - safeMargin, boss.y)
    );

    // SOLO VERIFICAR REBOTE SI ESTÁ EN MODO TELEPORTING
    if (this.movement.pattern === "teleporting") {
      // Detectar si se pegó en una esquina
      if (this.isBossStuckInCorner(boss, canvas)) {
        console.log(
          "🚧 Boss detectado en esquina durante teleport - reposicionando"
        );
        this.repositionFromCorner(boss, canvas);
      }

      // Detectar si no se pudo mover (pegado)
      if (oldX === boss.x && oldY === boss.y) {
        this.stuckCounter = (this.stuckCounter || 0) + 1;

        if (this.stuckCounter > 30) {
          // 0.5 segundos pegado
          console.log("🚧 Boss pegado durante teleport - reposicionando");
          this.emergencyRepositioning(boss, canvas);
          this.stuckCounter = 0;
        }
      } else {
        this.stuckCounter = 0;
      }
    }
    // EN MODO HUNTING: Permitir que se quede en paredes persiguiendo
    else if (this.movement.pattern === "hunting") {
      // El boss puede quedarse pegado a las paredes si el jugador está ahí
      console.log("🎯 Boss en modo hunting - puede estar contra paredes");
    }
  },

  // 🔥 FUNCIÓN: Detectar si está en esquina (solo para teleporting)
  isBossStuckInCorner(boss, canvas) {
    const cornerThreshold = 60; // Reducido de 120 a 60

    // Verificar las 4 esquinas
    const isNearTopLeft = boss.x < cornerThreshold && boss.y < cornerThreshold;
    const isNearTopRight =
      boss.x > canvas.width - boss.width - cornerThreshold &&
      boss.y < cornerThreshold;
    const isNearBottomLeft =
      boss.x < cornerThreshold &&
      boss.y > canvas.height - boss.height - cornerThreshold;
    const isNearBottomRight =
      boss.x > canvas.width - boss.width - cornerThreshold &&
      boss.y > canvas.height - boss.height - cornerThreshold;

    return (
      isNearTopLeft || isNearTopRight || isNearBottomLeft || isNearBottomRight
    );
  },

  // 🔥 FUNCIÓN: Reposicionar desde esquina
  repositionFromCorner(boss, canvas) {
    const centerX = canvas.width / 2 - boss.width / 2;
    const centerY = canvas.height / 2 - boss.height / 2;

    // Mover hacia el centro con un poco de aleatoriedad
    const offsetX = (Math.random() - 0.5) * 200;
    const offsetY = (Math.random() - 0.5) * 200;

    boss.x = centerX + offsetX;
    boss.y = centerY + offsetY;

    // Asegurar que sigue dentro de límites
    const safeMargin = 20; // Reducido de 80 a 20
    boss.x = Math.max(
      safeMargin,
      Math.min(canvas.width - boss.width - safeMargin, boss.x)
    );
    boss.y = Math.max(
      safeMargin,
      Math.min(canvas.height - boss.height - safeMargin, boss.y)
    );

    // Efecto visual
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#FFD700",
        30
      );
    }

    console.log(
      `🎯 Boss reposicionado desde esquina a: (${Math.round(
        boss.x
      )}, ${Math.round(boss.y)})`
    );
  },

  // 🔥 FUNCIÓN: Reposicionamiento de emergencia
  emergencyRepositioning(boss, canvas) {
    console.log("🚨 REPOSICIONAMIENTO DE EMERGENCIA");

    // Posiciones seguras más cerca de los bordes
    const safePositions = [
      { x: canvas.width * 0.5, y: canvas.height * 0.2 }, // Centro-arriba
      { x: canvas.width * 0.2, y: canvas.height * 0.5 }, // Centro-izquierda
      { x: canvas.width * 0.8, y: canvas.height * 0.5 }, // Centro-derecha
      { x: canvas.width * 0.5, y: canvas.height * 0.8 }, // Centro-abajo
      { x: canvas.width * 0.5, y: canvas.height * 0.5 }, // Centro exacto
    ];

    // Elegir posición aleatoria
    const randomPos =
      safePositions[Math.floor(Math.random() * safePositions.length)];

    boss.x = randomPos.x - boss.width / 2;
    boss.y = randomPos.y - boss.height / 2;

    // Verificar límites finales más estrechos
    const safeMargin = 20; // Reducido de 80 a 20
    boss.x = Math.max(
      safeMargin,
      Math.min(canvas.width - boss.width - safeMargin, boss.x)
    );
    boss.y = Math.max(
      safeMargin,
      Math.min(canvas.height - boss.height - safeMargin, boss.y)
    );

    // Reset velocidades
    boss.velocityX = 0;
    boss.velocityY = 0;

    // Efecto visual dramático
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#FF00FF",
        60
      );
      this.bossManager.ui.showScreenMessage("📡 Boss reposicionado", "#FF00FF");
    }

    console.log(
      `🚨 Boss reposicionado de emergencia a: (${Math.round(
        boss.x
      )}, ${Math.round(boss.y)})`
    );
  },

  // ======================================================
  // REACCIONES A EVENTOS
  // ======================================================

  onDamageReceived(healthPercentage) {
    const baseSpeed = 4.0; // 🔥 AUMENTADO de 3.5 a 4.0
    this.movement.speed = baseSpeed + (1.0 - healthPercentage) * 2.0; // 🔥 AUMENTADO multiplicador

    // Teletransporte defensivo más frecuente si vida muy baja
    if (
      healthPercentage < 0.3 && // 🔥 CAMBIADO de 0.2 a 0.3
      Math.random() < 0.25 && // 🔥 AUMENTADO de 0.15 a 0.25
      this.movement.pattern === "hunting"
    ) {
      this.defensiveTeleport();
    }
  },

  defensiveTeleport() {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    const playerPos = Player.getPosition();

    // 🔥 POSICIONES MÁS CERCA del jugador (no tan defensivas)
    const escapePositions = [
      { x: canvas.width * 0.2, y: canvas.height * 0.2 }, // Más cerca
      { x: canvas.width * 0.8 - boss.width, y: canvas.height * 0.2 },
      { x: canvas.width * 0.2, y: canvas.height * 0.8 - boss.height },
      {
        x: canvas.width * 0.8 - boss.width,
        y: canvas.height * 0.8 - boss.height,
      },
    ];

    // Elegir posición aleatoria (no necesariamente la más lejana)
    const randomPosition =
      escapePositions[Math.floor(Math.random() * escapePositions.length)];

    // Efecto y teletransporte
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#FF00FF",
        20
      );
    }

    boss.x = randomPosition.x;
    boss.y = randomPosition.y;

    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#FF00FF",
        30
      );
      this.bossManager.ui.showScreenMessage(
        "👹 Teletransporte agresivo!",
        "#FF00FF"
      );
    }

    console.log("🛡️ Boss realizó teletransporte más agresivo");
  },

  // ======================================================
  // AJUSTES PARA FASES
  // ======================================================

  adjustForPhase(phase) {
    console.log(`🎯 Ajustando movimiento para fase: ${phase}`);

    switch (phase) {
      case "HUNTING":
        this.enableFluidHunting();
        break;

      case "SUMMONING":
      case "BULLETS":
      case "REDLINE":
      case "YANKENPO":
        this.stopMovementAndCenter();
        break;

      case "MINES":
        this.enableTeleporting();
        break;

      default:
        console.log(`⚠️ Fase desconocida: ${phase}`);
    }
  },

  // ======================================================
  // RESET Y UTILIDADES
  // ======================================================

  reset() {
    this.movement = {
      enabled: false,
      pattern: "hunting",
      speed: 4.0, // 🔥 AUMENTADO valor inicial
      teleportTimer: 0,
      teleportCooldown: 90,
    };
    console.log("🔄 Sistema de movimiento AGRESIVO reseteado");
  },

  // ======================================================
  // GETTERS
  // ======================================================

  getCurrentPattern() {
    return this.movement.pattern;
  },
  isEnabled() {
    return this.movement.enabled;
  },
  getSpeed() {
    return this.movement.speed;
  },

  getMovementStats() {
    return {
      enabled: this.movement.enabled,
      pattern: this.movement.pattern,
      speed: this.movement.speed,
      teleportTimer: this.movement.teleportTimer,
    };
  },
};

window.BossMovement = BossMovement;

console.log(
  "🚶 boss-movement.js COMPLETAMENTE ARREGLADO - Boss SÚPER AGRESIVO que SÍ puede tocar al jugador en paredes"
);
