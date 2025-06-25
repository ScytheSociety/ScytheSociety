/**
 * Hell Shooter - Boss Movement System ARREGLADO
 * CAMBIOS:
 * - Boss SOLO se mueve en fase HUNTING
 * - Verificación estricta de isStationary
 * - No movimiento en fases especiales
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
    console.log("🏃 Boss iniciando persecución fluida");
    this.movement.enabled = true;
    this.movement.pattern = "hunting";
    this.movement.speed = 3.5;
  },

  stopMovementAndCenter() {
    console.log("⏸️ Boss deteniéndose para fase especial");
    this.movement.enabled = false;
    this.movement.pattern = "stationary";

    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    boss.x = (canvas.width - boss.width) / 2;
    boss.y = (canvas.height - boss.height) / 2;
    boss.velocityX = 0;
    boss.velocityY = 0;
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
  // 🔥 ACTUALIZACIÓN CORREGIDA - VERIFICACIONES ESTRICTAS
  // ======================================================

  update() {
    if (!this.bossManager.active) return;

    // 🔥 VERIFICACIÓN 1: Boss marcado como estacionario
    if (this.bossManager.boss && this.bossManager.boss.isStationary) {
      console.log("🛑 Boss marcado como estacionario - NO MOVER");
      return;
    }

    // 🔥 VERIFICACIÓN 2: Movimiento desactivado
    if (!this.movement.enabled) {
      return;
    }

    // 🔥 VERIFICACIÓN 3: Solo hunting permite movimiento
    if (
      this.movement.pattern !== "hunting" &&
      this.movement.pattern !== "teleporting"
    ) {
      return;
    }

    // 🔥 VERIFICACIÓN 4: Fase actual del boss
    const currentPhase = this.bossManager.phases
      ? this.bossManager.phases.getCurrentPhase()
      : "UNKNOWN";

    if (currentPhase !== "HUNTING" && this.movement.pattern === "hunting") {
      console.log(`🛑 Boss en fase ${currentPhase} - NO debería moverse`);
      return;
    }

    // 🔥 Solo ejecutar movimiento si pasa TODAS las verificaciones
    switch (this.movement.pattern) {
      case "hunting":
        this.perfectHunting();
        break;
      case "teleporting":
        this.updateTeleporting();
        break;
    }
  },

  // ======================================================
  // PATRONES DE MOVIMIENTO
  // ======================================================

  perfectHunting() {
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

    if (distance > 50) {
      let speed = this.movement.speed;

      // 🔥 APLICAR SLOWMOTION AL BOSS
      if (window.slowMotionActive && window.slowMotionFactor) {
        speed *= window.slowMotionFactor;
      }

      const dirX = dx / distance;
      const dirY = dy / distance;

      boss.x += dirX * speed;
      boss.y += dirY * speed;
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

    // Posiciones cerca del jugador
    const teleportPositions = [
      { x: playerPos.x + 120, y: playerPos.y + 80 },
      { x: playerPos.x - 120, y: playerPos.y + 80 },
      { x: playerPos.x + 80, y: playerPos.y - 120 },
      { x: playerPos.x - 80, y: playerPos.y - 120 },
      { x: playerPos.x + 150, y: playerPos.y },
      { x: playerPos.x - 150, y: playerPos.y },
    ];

    // Filtrar posiciones válidas
    const validPositions = teleportPositions.filter(
      (pos) =>
        pos.x >= 80 &&
        pos.x <= canvas.width - 80 - boss.width &&
        pos.y >= 80 &&
        pos.y <= canvas.height - 80 - boss.height
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
        `📡 Boss teletransportado a (${Math.round(newPos.x)}, ${Math.round(
          newPos.y
        )})`
      );
    }
  },

  keepInBounds() {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;

    boss.x = Math.max(10, Math.min(canvas.width - boss.width - 10, boss.x));
    boss.y = Math.max(60, Math.min(canvas.height - boss.height - 10, boss.y));
  },

  // ======================================================
  // REACCIONES A EVENTOS
  // ======================================================

  onDamageReceived(healthPercentage) {
    const baseSpeed = 3.5;
    this.movement.speed = baseSpeed + (1.0 - healthPercentage) * 1.5;

    // Teletransporte defensivo si vida muy baja
    if (
      healthPercentage < 0.2 &&
      Math.random() < 0.15 &&
      this.movement.pattern === "hunting"
    ) {
      this.defensiveTeleport();
    }
  },

  defensiveTeleport() {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    const playerPos = Player.getPosition();

    // Posiciones alejadas del jugador
    const escapePositions = [
      { x: canvas.width * 0.1, y: canvas.height * 0.1 },
      { x: canvas.width * 0.9 - boss.width, y: canvas.height * 0.1 },
      { x: canvas.width * 0.1, y: canvas.height * 0.9 - boss.height },
      {
        x: canvas.width * 0.9 - boss.width,
        y: canvas.height * 0.9 - boss.height,
      },
    ];

    // Elegir la posición más alejada del jugador
    let bestPosition = escapePositions[0];
    let maxDistance = 0;

    escapePositions.forEach((pos) => {
      const distance = Math.sqrt(
        Math.pow(pos.x - playerPos.x, 2) + Math.pow(pos.y - playerPos.y, 2)
      );
      if (distance > maxDistance) {
        maxDistance = distance;
        bestPosition = pos;
      }
    });

    // Efecto y teletransporte
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#FF00FF",
        20
      );
    }

    boss.x = bestPosition.x;
    boss.y = bestPosition.y;

    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#FF00FF",
        30
      );
      this.bossManager.ui.showScreenMessage(
        "👹 Teletransporte defensivo!",
        "#FF00FF"
      );
    }

    console.log("🛡️ Boss realizó teletransporte defensivo");
  },

  // ======================================================
  // AJUSTES PARA FASES
  // ======================================================

  adjustForPhase(phase) {
    switch (phase) {
      case "SUMMONING":
      case "BULLETS":
      case "REDLINE":
      case "YANKENPO":
        this.stopMovementAndCenter();
        break;
      case "MINES":
        this.enableTeleporting();
        break;
      case "HUNTING":
      default:
        this.enableFluidHunting();
        break;
    }
  },

  // ======================================================
  // RESET Y UTILIDADES
  // ======================================================

  reset() {
    this.movement = {
      enabled: false,
      pattern: "hunting",
      speed: 3.5,
      teleportTimer: 0,
      teleportCooldown: 90,
    };
    console.log("🔄 Sistema de movimiento reseteado");
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

console.log("🚶 boss-movement.js ARREGLADO - Solo movimiento en HUNTING");
