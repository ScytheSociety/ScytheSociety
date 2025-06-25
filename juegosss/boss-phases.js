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

  PHASE_DURATIONS: {
    SUMMONING: GameConfig.BOSS_PHASE_CONFIG.SUMMONING_DURATION || 3600,
    MINES: GameConfig.BOSS_PHASE_CONFIG.MINES_DURATION || 5400,
    BULLETS: GameConfig.BOSS_PHASE_CONFIG.BULLETS_DURATION || 7200,
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

  // 🔥 NUEVO: Control de fases aleatorias ejecutadas
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

    // 🔥 NUEVO: NO HACER NADA SI RED LINE ESTÁ FORZADO
    if (this.redLineForceActive) {
      console.log("🔴 Phases update BLOQUEADO - Red Line activo");
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

    // Ensamblar elementos (SIN texto de fase)
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

    // 🔥 OLEADAS CADA 8 SEGUNDOS DURANTE 60 SEGUNDOS
    const waveInterval = 8000; // 8 segundos entre oleadas
    const totalDuration = 60000; // 60 segundos total
    const waveCount = Math.floor(totalDuration / waveInterval); // 7-8 oleadas

    console.log(
      `⚔️ Programando ${waveCount} oleadas cada ${
        waveInterval / 1000
      }s durante ${totalDuration / 1000}s`
    );

    for (let wave = 0; wave < waveCount; wave++) {
      const timeout = setTimeout(() => {
        if (this.currentPhase === "SUMMONING" && this.phaseActive) {
          // 🔥 CANTIDAD CRECIENTE DE ENEMIGOS POR OLEADA
          const enemyCount = 3 + Math.floor(wave / 2); // Empieza con 3, sube gradualmente
          this.summonEnemies(enemyCount);

          console.log(
            `⚔️ Oleada ${
              wave + 1
            }/${waveCount}: ${enemyCount} enemigos invocados`
          );

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

    // 🔥 MENSAJE INICIAL
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
    const previousPhase = this.currentPhase;
    this.currentPhase = "HUNTING";
    this.phaseTimer = 0;

    // 🔥 BOSS VULNERABLE INMEDIATAMENTE después de fase
    this.bossManager.isImmune = false;
    this.bossManager.immunityTimer = 0;

    // 🔥 NUEVO: NO ACTIVAR HUNTING SI RED LINE ESTÁ ACTIVO
    if (this.bossManager.redline && this.bossManager.redline.phaseActive) {
      console.log("🚫 NO se reactiva HUNTING - Red Line en curso");
      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          `✅ ${previousPhase} COMPLETADO - Red Line continúa`,
          "#FFFF00"
        );
      }
      return;
    }

    // 🔥 ACTIVAR HUNTING FLUIDO DESPUÉS DE 2 SEGUNDOS (solo si NO hay Red Line)
    setTimeout(() => {
      if (this.bossManager.movement && this.currentPhase === "HUNTING") {
        // Verificar de nuevo que Red Line no esté activo
        if (
          !this.bossManager.redline ||
          !this.bossManager.redline.phaseActive
        ) {
          this.bossManager.movement.enableFluidHunting();
          console.log("🏃 Boss ahora en modo HUNTING fluido");
        }
      }
    }, 2000);

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `✅ ${previousPhase} COMPLETADO - Boss vulnerable`,
        "#00FF00"
      );
    }

    console.log(`🏃 Transición completa: ${previousPhase} → HUNTING`);
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

  forceStartYanKenPo() {
    console.log("🎮 FORZANDO inicio de Yan Ken Po desde Red Line");

    // Limpiar cualquier fase activa
    this.phaseActive = false;
    this.currentPhase = "YANKENPO";
    this.phaseTimer = 0;

    // Marcar Red Line como ejecutado
    this.phasesExecuted["REDLINE"] = true;
    this.phasesExecuted["YANKENPO"] = true;

    // Limpiar sistemas previos
    this.cleanupAllSystems();

    // Boss inmune
    this.bossManager.makeImmune(9999);

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

    // Iniciar Yan Ken Po INMEDIATAMENTE
    setTimeout(() => {
      if (this.bossManager.yankenpo) {
        this.bossManager.yankenpo.startPhase();
      }
    }, 500);
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
    this.bossManager.makeImmune(1800); // 30 segundos (reducido de 60)

    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    // 🔥 MENOS OLEADAS para fase rápida
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
      this.bossManager.redline.maxCycles = 5; // 🔥 5 rondas en lugar de 10
      this.bossManager.redline.startPhase();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🔴 HILO ROJO RÁPIDO (5 rondas)",
        "#FF0000"
      );
    }
  },

  // REEMPLAZAR endRandomPhase()
  endRandomPhase() {
    console.log("🔄 Terminando fase aleatoria - volviendo a Yan Ken Po");

    this.phaseActive = false;
    this.isRandomPhase = false;
    this.randomPhaseActive = false;

    this.cleanupAllSystems();

    // 🔥 BOSS INMUNE Y AL CENTRO para nuevo Yan Ken Po
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

    // 🔥 VOLVER A YAN KEN PO (NO TERMINAR FASE YANKENPO)
    setTimeout(() => {
      if (this.bossManager.yankenpo) {
        this.bossManager.yankenpo.restartYanKenPo();
      }
    }, 3000);
  },

  // ======================================================
  // INVOCACIÓN DE ENEMIGOS CORREGIDA
  // ======================================================

  // REEMPLAZAR en boss-phases.js la función summonEnemies() completa:

  summonEnemies(count) {
    const canvas = window.getCanvas();
    const currentLevel = window.getLevel();

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `👹 ¡${count} ESBIRROS DE TODOS LOS NIVELES!`,
        "#FF4400"
      );
    }

    // 🔥 GENERAR ENEMIGOS DE TODOS LOS NIVELES (1 hasta nivel actual)
    const enemyLevels = [];
    for (let level = 1; level <= currentLevel; level++) {
      enemyLevels.push(level);
    }

    console.log(`👹 Invocando enemigos de niveles: ${enemyLevels.join(", ")}`);

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        // Seleccionar nivel aleatorio de todos los disponibles
        const randomLevel =
          enemyLevels[Math.floor(Math.random() * enemyLevels.length)];

        // 🔥 TAMAÑO BASADO EN NIVEL (más grandes = más peligrosos)
        const baseSize = 20 + randomLevel * 2; // 🔥 MÁS PEQUEÑOS
        const sizeVariation = Math.random() * 4; // 🔥 MENOS VARIACIÓN
        const enemySize = Math.min(40, baseSize + sizeVariation); // 🔥 MÁXIMO 40px

        // 🔥 POSICIONES ESTRATÉGICAS (evitar centro donde está el boss)
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

        // 🔥 CREAR ENEMIGO COMPLETO CON TODAS LAS PROPIEDADES
        const enemy = {
          x: pos.x,
          y: pos.y,
          width: enemySize,
          height: enemySize,
          velocityX: (Math.random() - 0.5) * (2 + randomLevel * 0.5), // Más rápidos por nivel
          velocityY: (Math.random() - 0.5) * (2 + randomLevel * 0.5),
          level: randomLevel,
          type: "boss_minion",
          isBossMinion: true,

          // 🔥 ESTADÍSTICAS ESCALADAS POR NIVEL
          speedFactor: 1.0 + randomLevel * 0.15, // Más rápidos
          aggressionLevel: 1.0 + randomLevel * 0.2, // Más agresivos
          bounceCount: 0,
          maxBounces: 2 + randomLevel, // Más rebotes
          spawnTime: window.getGameTime(),

          // 🔥 SALUD ESCALADA (opcional para boss minions)
          health: Math.max(1, randomLevel - 2), // Niveles altos tienen más vida
          maxHealth: Math.max(1, randomLevel - 2),

          // 🔥 USAR IMAGEN CORRECTA SEGÚN NIVEL
          image: this.getEnemyImageForLevel(randomLevel),

          // 🔥 ESCALADO DINÁMICO (algunos enemigos)
          dynamicScaling: {
            enabled: Math.random() < 0.4, // 40% tienen escalado
            baseSize: enemySize,
            currentScale: 1.0,
            scaleDirection: 1,
            scaleSpeed: 0.003 + randomLevel * 0.001, // Más rápido por nivel
            minScale: 0.7,
            maxScale: 1.4 + randomLevel * 0.1, // Más grandes por nivel
            pulseTimer: 0,
          },

          // ❌ GLOW ELIMINADO - Las siguientes líneas fueron removidas:
          // glowColor: this.getGlowColorForLevel(randomLevel),
          // glowIntensity: 0.3 + randomLevel * 0.1,
        };

        // 🔥 AGREGAR AL SISTEMA DE ENEMIGOS
        if (window.EnemyManager) {
          EnemyManager.enemies.push(enemy);
          console.log(
            `👹 Esbirro nivel ${randomLevel} invocado en (${Math.round(
              pos.x
            )}, ${Math.round(pos.y)}) - Salud: ${enemy.health}`
          );
        }
      }, i * 200); // Spawn escalonado cada 200ms
    }

    console.log(
      `👹 === SECUENCIA DE INVOCACIÓN INICIADA: ${count} esbirros de niveles ${enemyLevels.join(
        "-"
      )} ===`
    );
  },

  // 🔥 FUNCIÓN AUXILIAR MEJORADA PARA IMÁGENES
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

    console.warn(`⚠️ Imagen no disponible para nivel ${level}`);
    return null;
  },

  // ======================================================
  // UTILIDADES
  // ======================================================

  // REEMPLAZAR cleanupAllSystems()
  cleanupAllSystems() {
    console.log("🧹 Limpiando TODOS los sistemas para transición");

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

    // 🔥 LIMPIAR RED LINE solo si NO viene de completar 10 rondas
    if (this.bossManager.redline && this.bossManager.redline.isActive()) {
      const redLineCount = this.bossManager.redline.getCurrentCycle();
      const redLineMax = this.bossManager.redline.getMaxCycles();

      if (redLineCount < redLineMax) {
        console.log("🧹 Limpiando Red Line incompleto");
        this.bossManager.redline.cleanup();
      } else {
        console.log("🔴 Red Line completado - NO limpiar");
      }
    }

    // 🔥 LIMPIAR TODOS LOS POWER-UPS RESTANTES
    if (window.PowerUpManager && window.PowerUpManager.powerUps) {
      window.PowerUpManager.powerUps = [];
      console.log("🧹 Power-ups limpiados");
    }

    // 🔥 LIMPIAR ENEMIGOS INVOCADOS
    if (window.EnemyManager && window.EnemyManager.enemies) {
      const minionsCount = window.EnemyManager.enemies.filter(
        (e) => e.isBossMinion
      ).length;
      window.EnemyManager.enemies = window.EnemyManager.enemies.filter(
        (e) => !e.isBossMinion
      );
      console.log(`🧹 ${minionsCount} esbirros eliminados`);
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

    // RESETEAR fases ejecutadas para nueva partida
    this.phasesExecuted = {
      SUMMONING: false,
      MINES: false,
      BULLETS: false,
      REDLINE: false,
      YANKENPO: false,
    };

    console.log(
      "🔄 Sistema de fases reseteado - Todas las fases disponibles de nuevo"
    );
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

    // 🔥 NUEVO: RESETEAR FLAG DE RED LINE FORZADO
    if (this.bossManager && this.bossManager.redline) {
      this.bossManager.redline.redLineForceActive = false;
      console.log("🔴 Flag redLineForceActive RESETEADO");
    }

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

    // 🔥 NUEVO: RESETEAR FASES ALEATORIAS
    this.isRandomPhase = false;
    this.randomPhaseActive = false;

    // RESETEAR fases ejecutadas
    this.phasesExecuted = {
      SUMMONING: false,
      MINES: false,
      BULLETS: false,
      REDLINE: false,
      YANKENPO: false,
    };

    console.log("🧹 Fases ejecutadas limpiadas");
  },
};

window.BossPhases = BossPhases;

console.log("⚔️ boss-phases.js optimizado cargado");
