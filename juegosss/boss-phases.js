/**
 * Hell Shooter - Boss Phases System
 * Sistema modular de gestión de fases inteligentes del boss
 */

const BossPhases = {
  // ======================================================
  // ESTADO DEL SISTEMA DE FASES
  // ======================================================

  bossManager: null,

  // Configuración de fases
  PHASE_DURATIONS: {
    SUMMONING: 900, // 15 segundos
    MINES: 1500, // 25 segundos
    BULLETS: 2100, // 35 segundos
  },

  // Estado actual
  currentPhase: "HUNTING",
  phaseActive: false,
  phaseTimer: 0,
  phaseCooldown: 0,

  // Colores de fase
  phaseColors: {
    HUNTING: "#8B0000",
    SUMMONING: "#8B0000",
    MINES: "#FF8800",
    BULLETS: "#9B59B6",
    REDLINE: "#FF0000",
    YANKENPO: "#FFD700",
    FINAL: "#000000",
  },

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  /**
   * Inicializar el sistema de fases
   */
  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.initPhaseSystem();
    console.log("⚔️ Sistema de fases del boss inicializado");
  },

  /**
   * Configurar sistema de fases
   */
  initPhaseSystem() {
    this.currentPhase = "HUNTING";
    this.phaseActive = false;
    this.phaseTimer = 0;
    this.phaseCooldown = 0;
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Actualizar sistema de fases
   */
  update() {
    if (!this.bossManager.active) return;

    // Actualizar cooldown
    if (this.phaseCooldown > 0) {
      this.phaseCooldown--;
    }

    // Verificar transiciones de fase basadas en vida
    this.checkPhaseTransitions();

    // Ejecutar fase actual si está activa
    if (this.phaseActive) {
      this.executeCurrentPhase();
    }
  },

  /**
   * Verificar si debe cambiar de fase basado en vida
   */
  checkPhaseTransitions() {
    const healthPercentage =
      this.bossManager.currentHealth / this.bossManager.maxHealth;

    // Verificar fase final (3% de vida)
    if (healthPercentage <= 0.03 && this.currentPhase !== "YANKENPO") {
      this.startFinalPhase();
      return;
    }

    // Verificar fase de línea roja al 10%
    if (
      healthPercentage <= 0.1 &&
      healthPercentage > 0.03 &&
      this.currentPhase !== "REDLINE"
    ) {
      this.changePhase("REDLINE");
      return;
    }

    // Verificar fases normales
    let targetPhase = null;

    if (
      healthPercentage <= 0.75 &&
      healthPercentage > 0.5 &&
      !this.phaseActive
    ) {
      targetPhase = "SUMMONING";
    } else if (
      healthPercentage <= 0.5 &&
      healthPercentage > 0.25 &&
      !this.phaseActive
    ) {
      targetPhase = "MINES";
    } else if (
      healthPercentage <= 0.25 &&
      healthPercentage > 0.1 &&
      !this.phaseActive
    ) {
      targetPhase = "BULLETS";
    }

    // Cambiar fase si es necesario
    if (
      targetPhase &&
      this.currentPhase !== targetPhase &&
      this.phaseCooldown <= 0
    ) {
      this.changePhase(targetPhase);
    }
  },

  /**
   * Ejecutar la fase actual
   */
  executeCurrentPhase() {
    this.phaseTimer++;

    switch (this.currentPhase) {
      case "SUMMONING":
        this.executeSummoningPhase();
        break;

      case "MINES":
        this.executeMinesPhase();
        break;

      case "BULLETS":
        this.executeBulletsPhase();
        break;

      case "REDLINE":
        // El sistema de redline maneja su propia lógica
        break;

      case "YANKENPO":
        // El sistema de yankenpo maneja su propia lógica
        break;
    }

    // Verificar si la fase debe terminar
    this.checkPhaseCompletion();
  },

  // ======================================================
  // CAMBIO DE FASES
  // ======================================================

  /**
   * Cambiar a una nueva fase
   */
  changePhase(newPhase) {
    console.log(`👹 Boss cambiando a fase: ${newPhase}`);

    // Cleanup de fase anterior
    this.endCurrentPhase();

    this.currentPhase = newPhase;
    this.phaseTimer = 0;
    this.phaseActive = true;

    // Configurar nueva fase
    this.setupPhase(newPhase);

    // Notificar otros sistemas
    this.notifyPhaseChange(newPhase);
  },

  /**
   * Configurar una fase específica
   */
  setupPhase(phase) {
    switch (phase) {
      case "SUMMONING":
        this.setupSummoningPhase();
        break;

      case "MINES":
        this.setupMinesPhase();
        break;

      case "BULLETS":
        this.setupBulletsPhase();
        break;

      case "REDLINE":
        this.setupRedLinePhase();
        break;

      case "YANKENPO":
        this.setupYanKenPoPhase();
        break;
    }
  },

  /**
   * Notificar cambio de fase a otros sistemas
   */
  notifyPhaseChange(newPhase) {
    // Ajustar movimiento
    if (this.bossManager.movement) {
      this.bossManager.movement.adjustForPhase(newPhase);
    }

    // Mostrar transición en UI
    if (this.bossManager.ui) {
      const phaseMessages = {
        SUMMONING: "⚔️ FASE DE INVOCACIÓN",
        MINES: "💣 FASE DE MINAS",
        BULLETS: "🌟 FASE TOUHOU",
        REDLINE: "🔴 FASE DEL HILO ROJO",
        YANKENPO: "🎮 FASE FINAL: YAN KEN PO",
      };

      this.bossManager.ui.showScreenMessage(phaseMessages[newPhase], "#FF0000");
    }
  },

  // ======================================================
  // CONFIGURACIÓN DE FASES ESPECÍFICAS
  // ======================================================

  /**
   * Configurar fase de invocación
   */
  setupSummoningPhase() {
    this.bossManager.makeImmune(this.PHASE_DURATIONS.SUMMONING);

    if (this.bossManager.movement) {
      this.bossManager.movement.teleportToCenter();
    }
  },

  /**
   * Configurar fase de minas
   */
  setupMinesPhase() {
    this.bossManager.makeImmune(this.PHASE_DURATIONS.MINES);

    if (this.bossManager.movement) {
      this.bossManager.movement.teleportToCenter();
    }
  },

  /**
   * Configurar fase de balas
   */
  setupBulletsPhase() {
    this.bossManager.makeImmune(this.PHASE_DURATIONS.BULLETS);

    if (this.bossManager.movement) {
      this.bossManager.movement.teleportToCenter();
    }
  },

  /**
   * Configurar fase de línea roja
   */
  setupRedLinePhase() {
    if (this.bossManager.redline) {
      this.bossManager.redline.startPhase();
    }
  },

  /**
   * Configurar fase de Yan Ken Po
   */
  setupYanKenPoPhase() {
    if (this.bossManager.yankenpo) {
      this.bossManager.yankenpo.startPhase();
    }
  },

  // ======================================================
  // EJECUCIÓN DE FASES
  // ======================================================

  /**
   * Ejecutar fase de invocación
   */
  executeSummoningPhase() {
    // Invocar enemigos cada 4 segundos
    if (this.phaseTimer % 240 === 0) {
      this.summonEnemies(3);
    }
  },

  /**
   * Ejecutar fase de minas
   */
  executeMinesPhase() {
    // Ciclo de minas cada 8 segundos
    if (this.phaseTimer % 480 === 0 && this.bossManager.mines) {
      this.bossManager.mines.startMineSequence();
    }

    // Teletransporte más frecuente
    if (this.phaseTimer % 180 === 0 && this.bossManager.movement) {
      this.bossManager.movement.intelligentTeleport();
    }
  },

  /**
   * Ejecutar fase de balas Touhou
   */
  executeBulletsPhase() {
    // Patrón de balas cada 6 segundos
    if (this.phaseTimer % 360 === 0 && this.bossManager.bullets) {
      this.bossManager.bullets.startBulletPattern();
    }

    // Invocaciones ocasionales
    if (this.phaseTimer % 420 === 0) {
      this.summonEnemies(2);
    }

    // Escudos protectores cada 5 segundos
    if (this.phaseTimer % 300 === 0) {
      this.spawnProtectiveShield();
    }
  },

  // ======================================================
  // FINALIZACIÓN DE FASES
  // ======================================================

  /**
   * Verificar si la fase actual debe completarse
   */
  checkPhaseCompletion() {
    let shouldEnd = false;

    switch (this.currentPhase) {
      case "SUMMONING":
        shouldEnd = this.phaseTimer >= this.PHASE_DURATIONS.SUMMONING;
        break;

      case "MINES":
        shouldEnd = this.phaseTimer >= this.PHASE_DURATIONS.MINES;
        break;

      case "BULLETS":
        shouldEnd = this.phaseTimer >= this.PHASE_DURATIONS.BULLETS;
        break;

      // Las fases especiales se manejan en sus propios sistemas
      case "REDLINE":
      case "YANKENPO":
        // No se terminan automáticamente por tiempo
        break;
    }

    if (shouldEnd) {
      this.endCurrentPhase();
    }
  },

  /**
   * Terminar la fase actual
   */
  endCurrentPhase() {
    console.log(`👹 Terminando fase: ${this.currentPhase}`);

    this.phaseActive = false;
    this.bossManager.isImmune = false;
    this.bossManager.immunityTimer = 0;
    this.phaseTimer = 0;
    this.phaseCooldown = 300; // 5 segundos de cooldown

    // Limpiar sistemas de la fase
    this.cleanupCurrentPhase();

    // Volver a modo de caza
    this.currentPhase = "HUNTING";

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("⚔️ BOSS VULNERABLE", "#00FF00");
    }

    // Reanudar movimiento normal
    if (this.bossManager.movement) {
      this.bossManager.movement.changePattern("hunting");
    }
  },

  /**
   * Limpiar sistemas de la fase actual
   */
  cleanupCurrentPhase() {
    switch (this.currentPhase) {
      case "SUMMONING":
        // No cleanup específico necesario
        break;

      case "MINES":
        if (this.bossManager.mines) {
          this.bossManager.mines.endMineSequence();
        }
        break;

      case "BULLETS":
        if (this.bossManager.bullets) {
          this.bossManager.bullets.cleanup();
        }
        break;
    }
  },

  // ======================================================
  // FASE FINAL
  // ======================================================

  /**
   * Iniciar la fase final (Yan Ken Po)
   */
  startFinalPhase() {
    console.log("🎮 Iniciando fase final: YAN KEN PO");

    this.currentPhase = "YANKENPO";
    this.phaseActive = true;
    this.bossManager.makeImmune(9999); // Inmune hasta completar Yan Ken Po

    // Limpiar otros sistemas
    if (this.bossManager.mines) {
      this.bossManager.mines.cleanup();
    }

    if (this.bossManager.bullets) {
      this.bossManager.bullets.cleanup();
    }

    // Detener hilo rojo si está activo
    if (this.bossManager.redline && this.bossManager.redline.isActive()) {
      this.bossManager.redline.endPhase();
    }

    // Centrar boss
    if (this.bossManager.movement) {
      this.bossManager.movement.teleportToCenter();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🎮 ¡FASE FINAL: YAN KEN PO!",
        "#FFD700"
      );
    }

    // Iniciar Yan Ken Po después de un delay
    setTimeout(() => {
      if (this.bossManager.yankenpo) {
        this.bossManager.yankenpo.startPhase();
      }
    }, 1000);
  },

  // ======================================================
  // INVOCACIÓN DE ENEMIGOS
  // ======================================================

  /**
   * Invocar enemigos inteligentes
   */
  summonEnemies(count) {
    const canvas = window.getCanvas();

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `👹 ¡${count} ESBIRROS DE TODOS LOS NIVELES!`,
        "#FF4444"
      );
    }

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        // Enemigos de niveles aleatorios (1-10)
        const randomLevel = 1 + Math.floor(Math.random() * 10);
        const size = GameConfig.ENEMY_MIN_SIZE + randomLevel * 3;

        // Posiciones estratégicas
        const positions = [
          { x: 50, y: 50 },
          { x: canvas.width - 100, y: 50 },
          { x: 50, y: canvas.height - 100 },
          { x: canvas.width - 100, y: canvas.height - 100 },
          { x: canvas.width / 4, y: 50 },
          { x: (canvas.width * 3) / 4, y: 50 },
        ];

        const pos = positions[i % positions.length];

        const minion = {
          x: pos.x,
          y: pos.y,
          width: size,
          height: size,
          velocityX: (Math.random() - 0.5) * 0.008 * canvas.height,
          velocityY: (Math.random() - 0.5) * 0.008 * canvas.height,

          image:
            GameConfig.enemyImages[
              Math.min(randomLevel - 1, GameConfig.enemyImages.length - 1)
            ],
          speedFactor: 1.0 + randomLevel * 0.1,
          bounceCount: 0,
          maxBounces: 5 + randomLevel,

          level: randomLevel,
          type: "boss_minion",
          isBossMinion: true,

          dynamicScaling: {
            enabled: true,
            baseSize: size,
            currentScale: 1.0,
            scaleDirection: 1,
            scaleSpeed: 0.004,
            minScale: 0.8,
            maxScale: 1.3,
            pulseTimer: 0,
          },
        };

        if (window.EnemyManager) {
          EnemyManager.enemies.push(minion);
        }

        if (this.bossManager.ui) {
          this.bossManager.ui.createParticleEffect(
            pos.x + size / 2,
            pos.y + size / 2,
            "#8B0000",
            25
          );
        }

        console.log(`👹 Esbirro nivel ${randomLevel} invocado`);
      }, i * 400);
    }

    if (window.AudioManager) {
      AudioManager.playSound("special");
    }
  },

  /**
   * Crear escudo protector durante fase Touhou
   */
  spawnProtectiveShield() {
    const canvas = window.getCanvas();

    const shieldPowerUp = {
      x: Math.random() * (canvas.width - 60) + 30,
      y: Math.random() * (canvas.height - 60) + 30,
      width: 50,
      height: 50,
      velocityX: 0,
      velocityY: 0,
      type: {
        id: 0,
        name: "Escudo Protector",
        color: "#00FF00",
        duration: 240,
      },
      pulseTimer: 0,
      glowIntensity: 1.0,
      spawnTime: window.getGameTime(),
    };

    if (window.PowerUpManager) {
      PowerUpManager.powerUps.push(shieldPowerUp);
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🛡️ ¡ESCUDO DISPONIBLE!",
        "#00FF00"
      );
    }

    console.log("🛡️ Escudo protector spawneado durante fase Touhou");
  },

  // ======================================================
  // REACCIONES A EVENTOS
  // ======================================================

  /**
   * Reaccionar al recibir daño
   */
  onDamageReceived(healthPercentage) {
    // Invocación de emergencia si vida muy baja
    if (healthPercentage < 0.15 && Math.random() < 0.2) {
      this.summonEnemies(2);

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "👹 ¡Refuerzos de emergencia!",
          "#FF0000"
        );
      }
    }

    // Acelerar fase actual si está activa
    if (this.phaseActive && healthPercentage < 0.3) {
      // Reducir duración restante de la fase
      this.phaseTimer += 60; // Acelerar 1 segundo
    }
  },

  // ======================================================
  // GESTIÓN DE FASES ESPECIALES
  // ======================================================

  /**
   * Manejar pérdida en Yan Ken Po
   */
  handleYanKenPoLoss() {
    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "¡PERDISTE! Nueva fase aleatoria",
        "#FF0000"
      );
    }

    console.log("🎮 Yan Ken Po perdido - iniciando fase aleatoria");

    // Limpiar Yan Ken Po
    this.currentPhase = "HUNTING";
    this.phaseActive = false;

    // Seleccionar fase aleatoria
    const phases = ["SUMMONING", "MINES", "BULLETS", "REDLINE"];
    const randomPhase = phases[Math.floor(Math.random() * phases.length)];

    console.log(`🎲 Fase aleatoria seleccionada: ${randomPhase}`);

    setTimeout(() => {
      this.changePhase(randomPhase);
    }, 2000);
  },

  /**
   * Verificar si está en fase especial
   */
  isInSpecialPhase() {
    return (
      this.currentPhase === "REDLINE" ||
      this.currentPhase === "YANKENPO" ||
      (this.phaseActive &&
        ["SUMMONING", "MINES", "BULLETS"].includes(this.currentPhase))
    );
  },

  // ======================================================
  // RESET Y CLEANUP
  // ======================================================

  /**
   * Reset del sistema de fases
   */
  reset() {
    this.currentPhase = "HUNTING";
    this.phaseActive = false;
    this.phaseTimer = 0;
    this.phaseCooldown = 0;

    console.log("🔄 Sistema de fases reseteado");
  },

  // ======================================================
  // GETTERS
  // ======================================================

  getCurrentPhase() {
    return this.currentPhase;
  },

  getCurrentPhaseColor() {
    return this.phaseColors[this.currentPhase] || "#8B0000";
  },

  isPhaseActive() {
    return this.phaseActive;
  },

  getPhaseTimer() {
    return this.phaseTimer;
  },

  getPhaseProgress() {
    if (!this.phaseActive) return 0;

    const maxDuration = this.PHASE_DURATIONS[this.currentPhase];
    if (!maxDuration) return 0;

    return Math.min(1, this.phaseTimer / maxDuration);
  },
};

// Hacer disponible globalmente
window.BossPhases = BossPhases;

console.log("⚔️ boss-phases.js cargado - Sistema de fases listo");
