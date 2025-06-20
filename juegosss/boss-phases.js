/**
 * Hell Shooter - Boss Phases System Optimizado
 * Sistema modular de gestión de fases inteligentes del boss
 */

const BossPhases = {
  // ======================================================
  // ESTADO DEL SISTEMA DE FASES
  // ======================================================

  bossManager: null,

  // Estado actual
  currentPhase: "HUNTING",
  phaseActive: false,
  phaseTimer: 0,

  // Duraciones exactas en frames (60fps)
  PHASE_DURATIONS: {
    SUMMONING: 3600, // 60 segundos
    MINES: 5400, // 90 segundos
    BULLETS: 7200, // 120 segundos
  },

  // Control de fases aleatorias
  isRandomPhase: false,

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.currentPhase = "HUNTING";
    this.phaseActive = false;
    this.phaseTimer = 0;
    this.isRandomPhase = false;
    console.log("⚔️ Sistema de fases del boss inicializado");
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  update() {
    if (!this.bossManager.active) return;

    if (this.phaseActive) {
      this.phaseTimer++;
      this.checkPhaseCompletion();
    }
  },

  // ======================================================
  // GESTIÓN DE FASES
  // ======================================================

  checkPhaseCompletion() {
    const maxDuration = this.PHASE_DURATIONS[this.currentPhase];

    if (maxDuration && this.phaseTimer >= maxDuration) {
      console.log(
        `⏰ Fase ${this.currentPhase} completada por tiempo (${this.phaseTimer}/${maxDuration})`
      );
      this.endCurrentPhase();
    }
  },

  changePhase(newPhase) {
    console.log(`👹 Cambiando a fase: ${newPhase}`);

    this.currentPhase = newPhase;
    this.phaseActive = true;
    this.phaseTimer = 0;

    this.notifyPhaseChange(newPhase);

    // EJECUTAR INMEDIATAMENTE LA LÓGICA DE LA FASE
    switch (newPhase) {
      case "SUMMONING":
        this.startSummoningSequence();
        break;
      case "MINES":
        if (this.bossManager.mines) {
          this.bossManager.mines.startMineSequence();
        }
        break;
      case "BULLETS":
        if (this.bossManager.bullets) {
          this.bossManager.bullets.startBulletPattern();
        }
        break;
      case "REDLINE":
        if (this.bossManager.redline) {
          this.bossManager.redline.startPhase();
        }
        break;
      case "YANKENPO":
        if (this.bossManager.yankenpo) {
          this.bossManager.yankenpo.startPhase();
        }
        break;
    }
  },

  // Nueva función para manejar la secuencia de invocación
  startSummoningSequence() {
    console.log("⚔️ === INICIANDO SECUENCIA DE INVOCACIÓN (60s) ===");

    // Invocar enemigos cada 7 segundos durante 60 segundos
    const summonTimes = [2000, 9000, 16000, 23000, 30000, 37000, 44000, 51000];
    const enemyCounts = [5, 6, 7, 8, 6, 7, 8, 10]; // Escalada de dificultad

    summonTimes.forEach((time, index) => {
      setTimeout(() => {
        if (this.currentPhase === "SUMMONING" && this.phaseActive) {
          this.summonEnemies(enemyCounts[index]);
        }
      }, time);
    });

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "⚔️ FASE DE INVOCACIÓN (60s)",
        "#FF0000"
      );
    }

    console.log("⚔️ Secuencia de invocación programada");
  },

  endCurrentPhase() {
    console.log(
      `✅ Terminando fase: ${this.currentPhase} - VOLVIENDO A HUNTING`
    );

    this.phaseActive = false;
    this.currentPhase = "HUNTING";
    this.phaseTimer = 0;

    // Boss vulnerable inmediatamente
    this.bossManager.isImmune = false;
    this.bossManager.immunityTimer = 0;

    // Activar hunting fluido
    if (this.bossManager.movement) {
      this.bossManager.movement.enableFluidHunting();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🏃 BOSS CAZANDO FLUIDAMENTE",
        "#00FF00"
      );
    }

    console.log("🏃 Boss ahora en modo HUNTING fluido");
  },

  notifyPhaseChange(newPhase) {
    // Ajustar movimiento según la nueva fase
    if (this.bossManager.movement) {
      this.bossManager.movement.adjustForPhase(newPhase);
    }

    // Mostrar mensaje en UI
    if (this.bossManager.ui) {
      const phaseMessages = {
        SUMMONING: "⚔️ FASE DE INVOCACIÓN (60s)",
        MINES: "💣 FASE DE MINAS (90s)",
        BULLETS: "🌟 FASE TOUHOU (120s)",
        REDLINE: "🔴 FASE DEL HILO ROJO",
        YANKENPO: "🎮 FASE FINAL: YAN KEN PO",
      };

      this.bossManager.ui.showScreenMessage(
        phaseMessages[newPhase] || newPhase,
        "#FF0000"
      );
    }

    // Comentario del boss
    if (this.bossManager.comments) {
      const phaseComments = {
        SUMMONING: "¡Legiones del abismo, vengan a mí!",
        MINES: "¡El suelo bajo sus pies es traicionero!",
        BULLETS: "¡Lluvia de muerte del inframundo!",
        REDLINE: "¡Sigue mi rastro mortal!",
        YANKENPO: "¡Última oportunidad, mortal!",
      };

      if (phaseComments[newPhase]) {
        this.bossManager.comments.sayComment(phaseComments[newPhase]);
      }
    }
  },

  // ======================================================
  // FASES ESPECIALES
  // ======================================================

  startFinalPhase() {
    console.log("🎮 Iniciando fase final: YAN KEN PO");

    this.currentPhase = "YANKENPO";
    this.phaseActive = true;
    this.bossManager.makeImmune(9999);

    this.cleanupAllSystems();

    // Centrar boss
    if (this.bossManager.movement) {
      this.bossManager.movement.teleportToCenter();
      this.bossManager.movement.adjustForPhase("YANKENPO");
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
  // SISTEMA DE FASES ALEATORIAS
  // ======================================================

  handleYanKenPoLoss() {
    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "💀 ¡PERDISTE! Fase aleatoria",
        "#FF0000"
      );
    }

    console.log("🎮 Yan Ken Po perdido - iniciando fase aleatoria");

    setTimeout(() => {
      this.executeRandomPhase();
    }, 2000);
  },

  executeRandomPhase() {
    const availablePhases = ["SUMMONING", "MINES", "BULLETS", "REDLINE"];
    const randomPhase =
      availablePhases[Math.floor(Math.random() * availablePhases.length)];

    console.log(`🎲 Ejecutando fase aleatoria: ${randomPhase}`);

    this.isRandomPhase = true;
    this.currentPhase = randomPhase;
    this.phaseActive = true;
    this.phaseTimer = 0;

    // Ejecutar la fase específica (versión corta)
    switch (randomPhase) {
      case "SUMMONING":
        this.executeRandomSummoning();
        break;
      case "MINES":
        this.executeRandomMines();
        break;
      case "BULLETS":
        this.executeRandomBullets();
        break;
      case "REDLINE":
        this.executeRandomRedline();
        break;
    }
  },

  executeRandomSummoning() {
    this.bossManager.makeImmune(1800); // 30 segundos

    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    // Invocar enemigos cada 7 segundos
    const summonTimes = [2000, 8000, 15000, 22000];
    const enemyCounts = [5, 6, 7, 8];

    summonTimes.forEach((time, index) => {
      setTimeout(() => this.summonEnemies(enemyCounts[index]), time);
    });

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "⚔️ INVOCACIÓN RÁPIDA (30s)",
        "#FF0000"
      );
    }

    setTimeout(() => this.endRandomPhase(), 30000);
  },

  executeRandomMines() {
    this.bossManager.makeImmune(2700); // 45 segundos

    if (this.bossManager.mines) {
      this.bossManager.mines.startMineSequence();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "💣 MINAS RÁPIDAS (45s)",
        "#FF8800"
      );
    }

    setTimeout(() => this.endRandomPhase(), 45000);
  },

  executeRandomBullets() {
    this.bossManager.makeImmune(3600); // 60 segundos

    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    if (this.bossManager.bullets) {
      this.bossManager.bullets.startBulletPattern();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🌟 BALAS RÁPIDAS (60s)",
        "#9B59B6"
      );
    }

    setTimeout(() => this.endRandomPhase(), 60000);
  },

  executeRandomRedline() {
    this.bossManager.makeImmune(9999);

    if (this.bossManager.redline) {
      this.bossManager.redline.maxCycles = 5;
      this.bossManager.redline.startPhase();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🔴 HILO ROJO RÁPIDO (5 rondas)",
        "#FF0000"
      );
    }
  },

  endRandomPhase() {
    console.log("🔄 Terminando fase aleatoria - volviendo a Yan Ken Po");

    this.phaseActive = false;
    this.isRandomPhase = false;

    this.cleanupAllSystems();

    // Volver a Yan Ken Po después de 2 segundos
    setTimeout(() => {
      if (this.bossManager.yankenpo) {
        this.bossManager.yankenpo.startPhase();
      }
    }, 2000);
  },

  // ======================================================
  // INVOCACIÓN DE ENEMIGOS
  // ======================================================

  summonEnemies(count) {
    const canvas = window.getCanvas();

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `👹 ¡${count} ESBIRROS INVOCADOS!`,
        "#FF4400"
      );
    }

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const randomLevel = 1 + Math.floor(Math.random() * 10);
        const size = 30 + randomLevel * 3;

        // Posiciones de spawn variadas
        const spawnPositions = [
          { x: 50, y: 50 },
          { x: canvas.width - 100, y: 50 },
          { x: 50, y: canvas.height - 100 },
          { x: canvas.width - 100, y: canvas.height - 100 },
          { x: canvas.width / 4, y: 50 },
          { x: (canvas.width * 3) / 4, y: 50 },
          { x: canvas.width - 50, y: canvas.height / 3 },
          { x: canvas.width - 50, y: (canvas.height * 2) / 3 },
          { x: (canvas.width * 3) / 4, y: canvas.height - 50 },
          { x: canvas.width / 4, y: canvas.height - 50 },
          { x: 50, y: (canvas.height * 2) / 3 },
          { x: 50, y: canvas.height / 3 },
          { x: canvas.width / 2 - 100, y: canvas.height / 2 },
          { x: canvas.width / 2 + 100, y: canvas.height / 2 },
        ];

        const pos = spawnPositions[i % spawnPositions.length];

        const enemy = {
          x: pos.x,
          y: pos.y,
          width: size,
          height: size,
          velocityX: (Math.random() - 0.5) * 4,
          velocityY: (Math.random() - 0.5) * 4,
          level: randomLevel,
          type: "boss_minion",
          isBossMinion: true,
          speedFactor: 1.0 + randomLevel * 0.1,
          aggressionLevel: 1.2,
          bounceCount: 0,
          maxBounces: 3 + randomLevel,
        };

        if (window.EnemyManager) {
          EnemyManager.enemies.push(enemy);
        }

        console.log(
          `👹 Esbirro nivel ${randomLevel} invocado en (${pos.x}, ${pos.y})`
        );
      }, i * 300);
    }
  },

  // ======================================================
  // UTILIDADES
  // ======================================================

  cleanupAllSystems() {
    const systems = [
      this.bossManager.mines,
      this.bossManager.bullets,
      this.bossManager.redline,
    ];

    systems.forEach((system) => {
      if (system && system.cleanup) {
        system.cleanup();
      }
    });

    if (this.bossManager.redline && this.bossManager.redline.isActive()) {
      this.bossManager.redline.endPhase();
    }
  },

  isInSpecialPhase() {
    return (
      this.currentPhase === "REDLINE" ||
      this.currentPhase === "YANKENPO" ||
      (this.phaseActive &&
        ["SUMMONING", "MINES", "BULLETS"].includes(this.currentPhase))
    );
  },

  onDamageReceived(healthPercentage) {
    // Invocación de emergencia si vida muy baja
    if (healthPercentage < 0.15 && Math.random() < 0.25) {
      this.summonEnemies(3);

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "👹 ¡Refuerzos de emergencia!",
          "#FF0000"
        );
      }
    }
  },

  // ======================================================
  // RESET Y GETTERS
  // ======================================================

  reset() {
    this.currentPhase = "HUNTING";
    this.phaseActive = false;
    this.phaseTimer = 0;
    this.isRandomPhase = false;
    console.log("🔄 Sistema de fases reseteado");
  },

  getCurrentPhase() {
    return this.currentPhase;
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

  getPhaseStats() {
    return {
      currentPhase: this.currentPhase,
      phaseActive: this.phaseActive,
      phaseTimer: this.phaseTimer,
      isRandomPhase: this.isRandomPhase,
      progress: this.getPhaseProgress(),
    };
  },
};

window.BossPhases = BossPhases;

console.log("⚔️ boss-phases.js optimizado cargado");
