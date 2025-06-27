/**
 * Hell Shooter - Boss Phases System Optimizado
 * Sistema modular de gestión de fases del boss
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

  // Duración de fases desde configuración central
  get PHASE_DURATIONS() {
    return {
      SUMMONING: GameConfig.BOSS_PHASE_CONFIG.SUMMONING_DURATION || 3600,
      MINES: GameConfig.BOSS_PHASE_CONFIG.MINES_DURATION || 5400,
      BULLETS: GameConfig.BOSS_PHASE_CONFIG.BULLETS_DURATION || 7200,
    };
  },

  // Control de fases ejecutadas
  phasesExecuted: {
    SUMMONING: false,
    MINES: false,
    BULLETS: false,
    REDLINE: false,
    YANKENPO: false,
  },

  // Control para fases aleatorias (pueden repetirse)
  randomPhaseActive: false,
  randomPhasesExecuted: {
    SUMMONING: 0,
    MINES: 0,
    BULLETS: 0,
    REDLINE: 0,
  },
  maxRandomExecutions: 3, // Máximo 3 veces cada una

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.reset();
    this.addSkullTimerStyles();
    console.log("⚔️ Sistema de fases del boss inicializado");
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  update() {
    if (!this.bossManager.active) return;

    // No actualizar si Red Line está activo
    if (this.bossManager.redline && this.bossManager.redline.phaseActive) {
      return;
    }

    if (this.phaseActive) {
      this.phaseTimer++;
      this.updatePhaseTimerDisplay();
      this.checkPhaseCompletion();
    }
  },

  // ======================================================
  // SISTEMA DE TIMER VISUAL CON CALAVERA
  // ======================================================

  updatePhaseTimerDisplay() {
    const maxDuration = this.PHASE_DURATIONS[this.currentPhase];

    if (maxDuration) {
      const progress = this.phaseTimer / maxDuration; // 0.0 a 1.0
      this.showSkullTimer(this.currentPhase, progress);
    }
  },

  showSkullTimer(phase, progress) {
    // Eliminar timer anterior si existe
    const existingTimer = document.getElementById("boss-phase-timer");
    if (existingTimer) {
      existingTimer.remove();
    }

    const timerContainer = document.createElement("div");
    timerContainer.id = "boss-phase-timer";
    timerContainer.style.cssText = `
      position: fixed;
      top: 120px;
      left: 20px;
      z-index: 2000;
      pointer-events: none;
    `;

    // Contenedor de la calavera con máscara de sangre
    const skullContainer = document.createElement("div");
    skullContainer.style.cssText = `
      position: relative;
      width: 60px;
      height: 60px;
      overflow: hidden;
      border-radius: 50%;
      border: 1px solid #FF0000;
      box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);
    `;

    // Imagen de calavera base
    const skullImage = document.createElement("img");
    skullImage.src = "images/calaveratimer.png";
    skullImage.style.cssText = `
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    `;

    // Máscara de sangre más transparente
    const bloodFill = document.createElement("div");
    const fillHeight = progress * 100; // Convertir progreso a porcentaje
    bloodFill.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: ${fillHeight}%;
      background: linear-gradient(to top, 
        rgba(139, 0, 0, 0.6) 0%, 
        rgba(220, 20, 60, 0.6) 30%, 
        rgba(255, 69, 0, 0.6) 60%, 
        rgba(255, 99, 71, 0.6) 100%);
      z-index: 2;
      transition: height 0.3s ease;
    `;

    // Ensamblar elementos
    skullContainer.appendChild(skullImage);
    skullContainer.appendChild(bloodFill);
    timerContainer.appendChild(skullContainer);

    document.body.appendChild(timerContainer);

    // Efecto de pulso cuando está casi llena
    if (progress > 0.8) {
      skullContainer.style.animation = "pulse 1s infinite";
    }
  },

  // ======================================================
  // GESTIÓN DE FASES
  // ======================================================

  checkPhaseCompletion() {
    const maxDuration = this.PHASE_DURATIONS[this.currentPhase];

    if (maxDuration && this.phaseTimer >= maxDuration) {
      this.endCurrentPhase();
    }
  },

  changePhase(newPhase) {
    console.log(`👹 Cambiando a fase: ${newPhase}`);

    this.currentPhase = newPhase;
    this.phaseActive = true;
    this.phaseTimer = 0;

    // Marcar fase como ejecutada
    this.phasesExecuted[newPhase] = true;
    console.log(`✅ Fase ${newPhase} marcada como ejecutada`);

    this.notifyPhaseChange(newPhase);

    // Ejecutar lógica de la fase según corresponda
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

  // ======================================================
  // SECUENCIA DE INVOCACIÓN
  // ======================================================

  startSummoningSequence() {
    console.log("⚔️ === INICIANDO SECUENCIA DE INVOCACIÓN ===");

    // Limpiar cualquier timeout previo
    if (this.summoningTimeouts) {
      this.summoningTimeouts.forEach((timeout) => clearTimeout(timeout));
    }
    this.summoningTimeouts = [];

    // Usar configuración central
    const durationInMs =
      (GameConfig.BOSS_PHASE_CONFIG.SUMMONING_DURATION * 1000) / 60; // Convertir frames a ms
    const waveInterval = 8000; // 8 segundos entre oleadas
    const waveCount = Math.floor(durationInMs / waveInterval);

    for (let wave = 0; wave < waveCount; wave++) {
      const timeout = setTimeout(() => {
        if (this.currentPhase === "SUMMONING" && this.phaseActive) {
          const enemyCount = 3 + Math.floor(wave / 2);
          this.summonEnemies(enemyCount);

          if (this.bossManager.ui) {
            this.bossManager.ui.showScreenMessage(
              `👹 OLEADA ${wave + 1}/${waveCount}`,
              "#FF4400"
            );
          }
        }
      }, wave * waveInterval);

      this.summoningTimeouts.push(timeout);
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `⚔️ FASE DE INVOCACIÓN (${durationInMs / 1000}s)`,
        "#FF0000"
      );
    }
  },

  // ======================================================
  // FINALIZACIÓN DE FASE
  // ======================================================

  endCurrentPhase() {
    console.log(
      `✅ Terminando fase: ${this.currentPhase} - VOLVIENDO A HUNTING`
    );

    // Limpiar timeouts de invocación si existen
    if (this.summoningTimeouts) {
      this.summoningTimeouts.forEach((timeout) => clearTimeout(timeout));
      this.summoningTimeouts = [];
    }

    // Eliminar timer visual
    const timerElement = document.getElementById("boss-phase-timer");
    if (timerElement) {
      timerElement.remove();
    }

    const previousPhase = this.currentPhase;

    // Resetear estado
    this.phaseActive = false;
    this.currentPhase = "HUNTING";
    this.phaseTimer = 0;

    // Boss vulnerable (excepto Yan Ken Po)
    if (previousPhase !== "YANKENPO") {
      this.bossManager.isImmune = false;
      this.bossManager.immunityTimer = 0;
    }

    // Desbloquear boss
    if (this.bossManager.boss) {
      this.bossManager.boss.isStationary = false;
    }

    // Activar movimiento HUNTING inmediatamente
    if (this.bossManager.movement) {
      this.bossManager.movement.enabled = true;
      this.bossManager.movement.pattern = "hunting";
      this.bossManager.movement.enableFluidHunting();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `✅ ${previousPhase} COMPLETADO - Boss vulnerable y cazando`,
        "#00FF00"
      );
    }
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

    setTimeout(() => {
      this.executeRandomPhase();
    }, 2000);
  },

  executeRandomPhase() {
    // Elegir una fase aleatoria excluyendo las que ya alcanzaron el máximo
    const availablePhases = ["SUMMONING", "MINES", "BULLETS", "REDLINE"].filter(
      (phase) => this.randomPhasesExecuted[phase] < this.maxRandomExecutions
    );

    // Si no hay fases disponibles, reiniciar contadores y elegir cualquiera
    if (availablePhases.length === 0) {
      for (const phase in this.randomPhasesExecuted) {
        this.randomPhasesExecuted[phase] = 0;
      }
      availablePhases.push("SUMMONING", "MINES", "BULLETS", "REDLINE");
    }

    const randomPhase =
      availablePhases[Math.floor(Math.random() * availablePhases.length)];

    console.log(`🎲 Ejecutando fase aleatoria: ${randomPhase}`);

    this.randomPhaseActive = true;
    this.currentPhase = randomPhase;
    this.phaseActive = true;
    this.phaseTimer = 0;
    this.randomPhasesExecuted[randomPhase]++;

    // Ejecutar la fase específica
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

    // Oleadas reducidas para fase rápida
    const summonTimes = [2000, 10000, 18000]; // Solo 3 oleadas
    const enemyCounts = [4, 5, 6];

    summonTimes.forEach((time, index) => {
      setTimeout(() => this.summonEnemies(enemyCounts[index]), time);
    });

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "⚔️ INVOCACIÓN RÁPIDA (30s)",
        "#FF0000"
      );
    }

    const duration =
      GameConfig.BOSS_PHASE_CONFIG.RANDOM_PHASE_DURATIONS.SUMMONING *
      (1000 / 60);
    setTimeout(() => this.endRandomPhase(), duration);
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

    const duration =
      GameConfig.BOSS_PHASE_CONFIG.RANDOM_PHASE_DURATIONS.MINES * (1000 / 60);
    setTimeout(() => this.endRandomPhase(), duration);
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

    const duration =
      GameConfig.BOSS_PHASE_CONFIG.RANDOM_PHASE_DURATIONS.BULLETS * (1000 / 60);
    setTimeout(() => this.endRandomPhase(), duration);
  },

  executeRandomRedline() {
    this.bossManager.makeImmune(9999);

    if (this.bossManager.redline) {
      this.bossManager.redline.maxCycles = 5; // 5 rondas en lugar de 10
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
    this.randomPhaseActive = false;
    this.cleanupAllSystems();

    // Boss inmune y al centro para nuevo Yan Ken Po
    this.bossManager.makeImmune(9999);
    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🎮 Preparando nuevo Yan Ken Po...",
        "#FFD700"
      );
    }

    // Volver a Yan Ken Po después de un breve delay
    setTimeout(() => {
      if (this.bossManager.yankenpo) {
        this.bossManager.yankenpo.restartYanKenPo();
      }
    }, 3000);
  },

  // ======================================================
  // INVOCACIÓN DE ENEMIGOS
  // ======================================================

  summonEnemies(count) {
    const canvas = window.getCanvas();
    const currentLevel = window.getLevel();

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `👹 ¡${count} ESBIRROS DE TODOS LOS NIVELES!`,
        "#FF4400"
      );
    }

    // Generar enemigos de todos los niveles
    const enemyLevels = [];
    for (let level = 1; level <= currentLevel; level++) {
      enemyLevels.push(level);
    }

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        // Seleccionar nivel aleatorio
        const randomLevel =
          enemyLevels[Math.floor(Math.random() * enemyLevels.length)];

        // Tamaño basado en nivel
        const baseSize = 20 + randomLevel * 2;
        const sizeVariation = Math.random() * 4;
        const enemySize = Math.min(40, baseSize + sizeVariation);

        // Posiciones estratégicas para spawn
        const spawnPositions = [
          // Esquinas
          { x: 50, y: 50 },
          { x: canvas.width - 100, y: 50 },
          { x: 50, y: canvas.height - 100 },
          { x: canvas.width - 100, y: canvas.height - 100 },

          // Bordes superiores
          { x: canvas.width / 4, y: 50 },
          { x: (canvas.width * 3) / 4, y: 50 },

          // Bordes inferiores
          { x: canvas.width / 4, y: canvas.height - 50 },
          { x: (canvas.width * 3) / 4, y: canvas.height - 50 },

          // Bordes laterales
          { x: 50, y: canvas.height / 3 },
          { x: 50, y: (canvas.height * 2) / 3 },
          { x: canvas.width - 50, y: canvas.height / 3 },
          { x: canvas.width - 50, y: (canvas.height * 2) / 3 },
        ];

        const pos = spawnPositions[i % spawnPositions.length];

        // Crear enemigo con propiedades
        const enemy = {
          x: pos.x,
          y: pos.y,
          width: enemySize,
          height: enemySize,
          velocityX: (Math.random() - 0.5) * (2 + randomLevel * 0.5),
          velocityY: (Math.random() - 0.5) * (2 + randomLevel * 0.5),
          level: randomLevel,
          type: "boss_minion",
          isBossMinion: true,
          speedFactor: 1.0 + randomLevel * 0.15,
          aggressionLevel: 1.0 + randomLevel * 0.2,
          bounceCount: 0,
          maxBounces: 2 + randomLevel,
          spawnTime: window.getGameTime(),
          health: Math.max(1, randomLevel - 2),
          maxHealth: Math.max(1, randomLevel - 2),
          image: this.getEnemyImageForLevel(randomLevel),
          dynamicScaling: {
            enabled: Math.random() < 0.4,
            baseSize: enemySize,
            currentScale: 1.0,
            scaleDirection: 1,
            scaleSpeed: 0.003 + randomLevel * 0.001,
            minScale: 0.7,
            maxScale: 1.4 + randomLevel * 0.1,
            pulseTimer: 0,
          },
        };

        // Agregar al sistema de enemigos
        if (window.EnemyManager) {
          EnemyManager.enemies.push(enemy);
        }
      }, i * 200);
    }
  },

  getEnemyImageForLevel(level) {
    if (window.GameConfig && window.GameConfig.enemyImages) {
      const imageIndex = Math.min(
        level - 1,
        window.GameConfig.enemyImages.length - 1
      );
      const image = window.GameConfig.enemyImages[imageIndex];

      if (image && image.complete) {
        return image;
      }
    }
    return null;
  },

  // ======================================================
  // UTILIDADES
  // ======================================================

  cleanupAllSystems() {
    console.log("🧹 Limpiando todos los sistemas para transición");

    const systems = [
      { system: this.bossManager.mines, name: "minas" },
      { system: this.bossManager.bullets, name: "bullets" },
    ];

    systems.forEach(({ system, name }) => {
      if (system && system.cleanup) {
        console.log(`🧹 Limpiando sistema: ${name}`);
        system.cleanup();
      }
    });

    // Limpiar Red Line solo si no viene de completar 10 rondas
    if (this.bossManager.redline && this.bossManager.redline.isActive()) {
      const redLineCount = this.bossManager.redline.getCurrentCycle();
      const redLineMax = this.bossManager.redline.getMaxCycles();

      if (redLineCount < redLineMax) {
        console.log("🧹 Limpiando Red Line incompleto");
        this.bossManager.redline.cleanup();
      }
    }

    // Limpiar power-ups
    if (window.PowerUpManager && window.PowerUpManager.powerUps) {
      window.PowerUpManager.powerUps = [];
    }

    // Limpiar enemigos invocados
    if (window.EnemyManager && window.EnemyManager.enemies) {
      window.EnemyManager.enemies = window.EnemyManager.enemies.filter(
        (e) => !e.isBossMinion
      );
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
    this.cleanup();
    this.currentPhase = "HUNTING";
    this.phaseActive = false;
    this.phaseTimer = 0;
    this.randomPhaseActive = false;

    // Resetear fases ejecutadas
    this.phasesExecuted = {
      SUMMONING: false,
      MINES: false,
      BULLETS: false,
      REDLINE: false,
      YANKENPO: false,
    };

    // Resetear contadores de fases aleatorias
    for (const phase in this.randomPhasesExecuted) {
      this.randomPhasesExecuted[phase] = 0;
    }
  },

  cleanup() {
    console.log("🧹 Limpiando sistema de fases");

    // Limpiar timeouts
    if (this.summoningTimeouts) {
      this.summoningTimeouts.forEach((timeout) => clearTimeout(timeout));
      this.summoningTimeouts = [];
    }

    // Eliminar timer visual
    const timerElement = document.getElementById("boss-phase-timer");
    if (timerElement) {
      timerElement.remove();
    }

    this.phaseActive = false;
    this.currentPhase = "HUNTING";
    this.phaseTimer = 0;
    this.randomPhaseActive = false;

    // Resetear fases ejecutadas
    this.phasesExecuted = {
      SUMMONING: false,
      MINES: false,
      BULLETS: false,
      REDLINE: false,
      YANKENPO: false,
    };
  },

  // ======================================================
  // ESTILOS CSS PARA CALAVERA
  // ======================================================

  addSkullTimerStyles() {
    if (document.getElementById("skull-timer-styles")) return;

    const style = document.createElement("style");
    style.id = "skull-timer-styles";
    style.textContent = `
      @keyframes pulse {
        0% { 
          transform: scale(1); 
          box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);
        }
        50% { 
          transform: scale(1.1); 
          box-shadow: 0 0 25px rgba(255, 0, 0, 1.0);
        }
        100% { 
          transform: scale(1); 
          box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);
        }
      }
      
      @keyframes bloodDrip {
        0% { height: 0%; }
        100% { height: var(--fill-height); }
      }
    `;

    document.head.appendChild(style);
  },

  // ======================================================
  // GETTERS
  // ======================================================

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
      randomPhaseActive: this.randomPhaseActive,
      progress: this.getPhaseProgress(),
    };
  },
};

window.BossPhases = BossPhases;
