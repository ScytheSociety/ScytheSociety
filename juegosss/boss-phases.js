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
  // Control de timeouts
  summoningTimeouts: [],

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

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.currentPhase = "HUNTING";
    this.phaseActive = false;
    this.phaseTimer = 0;
    this.isRandomPhase = false;
    this.addSkullTimerStyles(); // ← AGREGAR ESTA LÍNEA
    console.log("⚔️ Sistema de fases del boss inicializado");
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  update() {
    if (!this.bossManager.active) return;

    if (this.phaseActive) {
      this.phaseTimer++;
      this.updatePhaseTimerDisplay(); // Mostrar timer en pantalla
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  `;

    // Contenedor de la calavera con máscara de sangre
    const skullContainer = document.createElement("div");
    skullContainer.style.cssText = `
    position: relative;
    width: 60px;
    height: 60px;
    overflow: hidden;
    border-radius: 50%;
    border: 3px solid #FF0000;
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

    // Máscara de sangre que se llena
    const bloodFill = document.createElement("div");
    const fillHeight = progress * 100; // Convertir progreso a porcentaje
    bloodFill.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: ${fillHeight}%;
    background: linear-gradient(to top, 
      #8B0000 0%, 
      #DC143C 30%, 
      #FF4500 60%, 
      #FF6347 100%);
    z-index: 2;
    transition: height 0.3s ease;
    opacity: 0.9;
  `;

    // Texto de fase debajo
    const phaseText = document.createElement("div");
    phaseText.style.cssText = `
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    color: #FFD700;
    text-shadow: 
      -2px -2px 0 #000000,  
       2px -2px 0 #000000,
      -2px  2px 0 #000000,
       2px  2px 0 #000000;
    text-align: center;
  `;
    phaseText.textContent = phase;

    // Ensamblar elementos
    skullContainer.appendChild(skullImage);
    skullContainer.appendChild(bloodFill);
    timerContainer.appendChild(skullContainer);
    timerContainer.appendChild(phaseText);

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

    // MARCAR FASE COMO EJECUTADA
    this.phasesExecuted[newPhase] = true;
    console.log(`✅ Fase ${newPhase} marcada como ejecutada`);

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

  // ======================================================
  // SECUENCIA DE INVOCACIÓN CORREGIDA
  // ======================================================

  startSummoningSequence() {
    console.log("⚔️ === INICIANDO SECUENCIA DE INVOCACIÓN (60s) ===");

    // Limpiar cualquier timeout previo
    if (this.summoningTimeouts) {
      this.summoningTimeouts.forEach((timeout) => clearTimeout(timeout));
    }
    this.summoningTimeouts = [];

    // Invocar enemigos cada 7 segundos durante 60 segundos
    const summonTimes = [2000, 9000, 16000, 23000, 30000, 37000, 44000, 51000];
    const enemyCounts = [4, 5, 5, 6, 5, 6, 6, 7]; // Cantidades más moderadas

    summonTimes.forEach((time, index) => {
      const timeout = setTimeout(() => {
        if (this.currentPhase === "SUMMONING" && this.phaseActive) {
          this.summonEnemies(enemyCounts[index]);
          console.log(
            `⚔️ Oleada ${index + 1}/8 invocada: ${enemyCounts[index]} enemigos`
          );
        }
      }, time);

      this.summoningTimeouts.push(timeout);
    });

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "⚔️ FASE DE INVOCACIÓN (60s)",
        "#FF0000"
      );
    }

    console.log("⚔️ Secuencia de invocación programada correctamente");
  },

  // ======================================================
  // FINALIZACIÓN MEJORADA DE FASE
  // ======================================================

  endCurrentPhase() {
    console.log(
      `✅ Terminando fase: ${this.currentPhase} - VOLVIENDO A HUNTING`
    );

    // Limpiar timeouts de invocación
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
    this.randomPhaseActive = true; // ← NUEVO FLAG
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
    this.randomPhaseActive = false; // ← LIMPIAR FLAG

    this.cleanupAllSystems();

    // Volver a Yan Ken Po después de 2 segundos
    setTimeout(() => {
      if (this.bossManager.yankenpo) {
        this.bossManager.yankenpo.startPhase();
      }
    }, 2000);
  },

  // ======================================================
  // INVOCACIÓN DE ENEMIGOS CORREGIDA
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
        // Nivel aleatorio de enemigos previamente enfrentados
        const currentLevel = window.getLevel();
        const randomLevel =
          1 + Math.floor(Math.random() * Math.max(1, currentLevel - 1));

        // Tamaño más pequeño para esbirros (más pequeños que el boss)
        const baseSize = 25 + randomLevel * 3; // Tamaño base más pequeño
        const sizeVariation = Math.random() * 10; // Menos variación
        const enemySize = Math.min(50, baseSize + sizeVariation); // Máximo 50px

        // Posiciones de spawn variadas pero alejadas del centro donde está el boss
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
        ];

        const pos = spawnPositions[i % spawnPositions.length];

        // Crear enemigo usando el sistema completo de EnemyManager
        const enemy = {
          x: pos.x,
          y: pos.y,
          width: enemySize,
          height: enemySize,
          velocityX: (Math.random() - 0.5) * 4,
          velocityY: (Math.random() - 0.5) * 4,
          level: randomLevel,
          type: "boss_minion",
          isBossMinion: true,
          speedFactor: 1.0 + randomLevel * 0.1,
          aggressionLevel: 1.2,
          bounceCount: 0,
          maxBounces: 3 + randomLevel,
          spawnTime: window.getGameTime(),

          // Usar el sistema de imágenes de EnemyManager
          image: this.getEnemyImageForLevel(randomLevel),

          // Sistema de escalado dinámico como en EnemyManager
          dynamicScaling: {
            enabled: Math.random() < 0.5, // 50% de esbirros con escalado
            baseSize: enemySize,
            currentScale: 1.0,
            scaleDirection: 1,
            scaleSpeed: 0.004,
            minScale: 0.8,
            maxScale: 1.3,
            pulseTimer: 0,
          },
        };

        // Agregar al sistema de enemigos
        if (window.EnemyManager) {
          EnemyManager.enemies.push(enemy);
        }

        console.log(
          `👹 Esbirro nivel ${randomLevel} invocado en (${pos.x}, ${pos.y}) con imagen`
        );
      }, i * 300); // Spawn escalonado cada 300ms
    }
  },

  // ======================================================
  // FUNCIÓN AUXILIAR PARA OBTENER IMÁGENES
  // ======================================================

  getEnemyImageForLevel(level) {
    // Usar el mismo sistema que EnemyManager
    if (window.GameConfig && window.GameConfig.enemyImages) {
      const imageIndex = Math.min(
        level - 1,
        window.GameConfig.enemyImages.length - 1
      );
      return window.GameConfig.enemyImages[imageIndex] || null;
    }
    return null;
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
    this.cleanup();
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

  // ======================================================
  // ESTILOS CSS PARA CALAVERA
  // ======================================================

  addSkullTimerStyles() {
    // Solo agregar una vez
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
  // CLEANUP MEJORADO
  // ======================================================

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

    // RESET de fases ejecutadas si necesario
    // this.phasesExecuted = { SUMMONING: false, MINES: false, BULLETS: false, REDLINE: false, YANKENPO: false };
  },
};

window.BossPhases = BossPhases;

console.log("⚔️ boss-phases.js optimizado cargado");
