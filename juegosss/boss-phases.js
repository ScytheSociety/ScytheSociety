/**
 * Hell Shooter - Boss Phases System COMPLETAMENTE REDISEÑADO
 * Sistema con tiempos específicos y transiciones correctas
 */

const BossPhases = {
  // ======================================================
  // ESTADO DEL SISTEMA DE FASES - REDISEÑADO
  // ======================================================

  bossManager: null,

  // Configuración de fases con tiempos específicos
  PHASE_CONFIGS: {
    INTRO: {
      name: "INTRO",
      duration: 600, // 10 segundos
      healthThreshold: 1.0,
      isImmune: true,
      message: "👹 ¡EL REY DEL INFIERNO APARECE! 👹",
    },
    HUNTING_1: {
      name: "HUNTING_1",
      duration: -1, // Indefinido hasta 75%
      healthThreshold: 0.75,
      isImmune: false,
      message: "⚔️ ¡A la caza!",
    },
    SUMMONING: {
      name: "SUMMONING",
      duration: 600, // 10 segundos
      healthThreshold: 0.75,
      isImmune: true,
      message: "⚔️ FASE DE INVOCACIÓN",
    },
    HUNTING_2: {
      name: "HUNTING_2",
      duration: -1, // Indefinido hasta 50%
      healthThreshold: 0.5,
      isImmune: false,
      message: "⚔️ ¡Boss vulnerable!",
    },
    MINES: {
      name: "MINES",
      duration: 900, // 15 segundos
      healthThreshold: 0.5,
      isImmune: true,
      message: "💣 FASE DE MINAS",
    },
    HUNTING_3: {
      name: "HUNTING_3",
      duration: -1, // Indefinido hasta 30%
      healthThreshold: 0.3,
      isImmune: false,
      message: "⚔️ ¡Boss vulnerable!",
    },
    BULLETS: {
      name: "BULLETS",
      duration: 1200, // 20 segundos
      healthThreshold: 0.3,
      isImmune: true,
      message: "🌟 FASE TOUHOU",
    },
    HUNTING_4: {
      name: "HUNTING_4",
      duration: -1, // Indefinido hasta 15%
      healthThreshold: 0.15,
      isImmune: false,
      message: "⚔️ ¡Boss vulnerable!",
    },
    REDLINE: {
      name: "REDLINE",
      duration: 3000, // 50 segundos (10 hilos x 5s cada uno)
      healthThreshold: 0.15,
      isImmune: true,
      message: "🔴 FASE DEL HILO ROJO",
      redLineCount: 10,
      pauseBetweenLines: 180, // 3 segundos
    },
    HUNTING_5: {
      name: "HUNTING_5",
      duration: -1, // Indefinido hasta 3%
      healthThreshold: 0.03,
      isImmune: false,
      message: "⚔️ ¡Última oportunidad!",
    },
    YANKENPO: {
      name: "YANKENPO",
      duration: -1, // Indefinido hasta muerte
      healthThreshold: 0.03,
      isImmune: true,
      message: "🎮 ¡FASE FINAL: YAN KEN PO!",
      winsRequired: 3,
    },
  },

  // Estado actual
  currentPhase: "INTRO",
  phaseTimer: 0,
  phaseActive: false,
  phaseTransitioning: false,

  // Para Yan Ken Po
  yanKenPoWins: 0,
  yanKenPoRequired: 3,

  // Para Red Line
  redLinesCompleted: 0,
  redLinePausing: false,
  redLinePauseTimer: 0,

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.initPhaseSystem();
    console.log("⚔️ Sistema de fases REDISEÑADO inicializado");
  },

  initPhaseSystem() {
    this.currentPhase = "INTRO";
    this.phaseTimer = 0;
    this.phaseActive = false;
    this.phaseTransitioning = false;
    this.yanKenPoWins = 0;
    this.redLinesCompleted = 0;
    this.redLinePausing = false;
    this.redLinePauseTimer = 0;
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  update() {
    if (!this.bossManager.active) return;

    const healthPercentage =
      this.bossManager.currentHealth / this.bossManager.maxHealth;

    // Actualizar timer de fase actual
    this.phaseTimer++;

    // Manejar transiciones
    if (!this.phaseTransitioning) {
      this.checkPhaseTransition(healthPercentage);
    }

    // Ejecutar fase actual
    this.executeCurrentPhase();

    // Verificar finalización de fase por tiempo
    this.checkPhaseCompletion();
  },

  /**
   * Verificar si debe cambiar de fase
   */
  checkPhaseTransition(healthPercentage) {
    const config = this.PHASE_CONFIGS[this.currentPhase];

    // Verificar si debe cambiar por umbral de vida
    if (config.name.startsWith("HUNTING")) {
      if (healthPercentage <= config.healthThreshold) {
        this.startPhaseTransition(healthPercentage);
      }
    }
  },

  /**
   * Iniciar transición de fase
   */
  startPhaseTransition(healthPercentage) {
    this.phaseTransitioning = true;

    // Determinar siguiente fase según vida
    let nextPhase;
    if (healthPercentage <= 0.03) {
      nextPhase = "YANKENPO";
    } else if (healthPercentage <= 0.15) {
      nextPhase = "REDLINE";
    } else if (healthPercentage <= 0.3) {
      nextPhase = "BULLETS";
    } else if (healthPercentage <= 0.5) {
      nextPhase = "MINES";
    } else if (healthPercentage <= 0.75) {
      nextPhase = "SUMMONING";
    }

    if (nextPhase) {
      this.changePhase(nextPhase);
    }
  },

  /**
   * Cambiar a una nueva fase
   */
  changePhase(newPhase) {
    console.log(`👹 Boss cambiando de ${this.currentPhase} a ${newPhase}`);

    // Limpiar fase anterior
    this.endCurrentPhase();

    // Configurar nueva fase
    this.currentPhase = newPhase;
    this.phaseTimer = 0;
    this.phaseActive = true;
    this.phaseTransitioning = false;

    const config = this.PHASE_CONFIGS[newPhase];

    // Centrar boss y mostrar mensaje
    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(config.message, "#FF0000");
    }

    // Configurar inmunidad
    if (config.isImmune) {
      this.bossManager.makeImmune(9999); // Inmune indefinido
    } else {
      this.bossManager.isImmune = false;
      this.bossManager.immunityTimer = 0;
    }

    // Configurar fase específica
    this.setupSpecificPhase(newPhase);

    console.log(`✅ Fase ${newPhase} iniciada`);
  },

  /**
   * Configurar fases específicas
   */
  setupSpecificPhase(phaseName) {
    switch (phaseName) {
      case "INTRO":
        // Solo esperar 10 segundos
        break;

      case "SUMMONING":
        // Ya está inmune, solo invocar
        break;

      case "MINES":
        if (this.bossManager.mines) {
          setTimeout(() => {
            this.bossManager.mines.startMineSequence();
          }, 1000);
        }
        break;

      case "BULLETS":
        if (this.bossManager.bullets) {
          setTimeout(() => {
            this.bossManager.bullets.startBulletPattern();
          }, 1000);
        }
        break;

      case "REDLINE":
        this.redLinesCompleted = 0;
        this.redLinePausing = false;
        if (this.bossManager.redline) {
          setTimeout(() => {
            this.startRedLineSequence();
          }, 1000);
        }
        break;

      case "YANKENPO":
        this.yanKenPoWins = 0;
        if (this.bossManager.yankenpo) {
          setTimeout(() => {
            this.bossManager.yankenpo.startPhase();
          }, 1000);
        }
        break;

      default:
        // Fases de caza - activar movimiento después de 2 segundos
        setTimeout(() => {
          if (this.bossManager.movement) {
            this.bossManager.movement.enableWandering();
          }

          // Hacer vulnerable si corresponde
          const config = this.PHASE_CONFIGS[phaseName];
          if (!config.isImmune) {
            this.bossManager.isImmune = false;
            this.bossManager.immunityTimer = 0;

            if (this.bossManager.ui) {
              this.bossManager.ui.showScreenMessage(
                "⚔️ Boss vulnerable",
                "#00FF00"
              );
            }
          }
        }, 2000);
        break;
    }
  },

  /**
   * Ejecutar fase actual - CORREGIDO PARA PERSECUCIÓN
   */
  executeCurrentPhase() {
    const config = this.PHASE_CONFIGS[this.currentPhase];

    switch (this.currentPhase) {
      case "INTRO":
        // Boss inmóvil en el centro
        break;

      case "HUNTING_1":
      case "HUNTING_2":
      case "HUNTING_3":
      case "HUNTING_4":
      case "HUNTING_5":
        // 🔥 PERSECUCIÓN FLUIDA DEL JUGADOR
        if (this.bossManager.movement) {
          this.bossManager.movement.enableWandering();
          this.bossManager.movement.changePattern("hunting");
        }
        break;

      case "SUMMONING":
        // Invocar enemigos cada 4 segundos
        if (this.phaseTimer % 240 === 0) {
          this.summonEnemies(2);
        }
        break;

      case "MINES":
        // La fase de minas se maneja en su propio sistema
        break;

      case "BULLETS":
        // La fase de bullets se maneja en su propio sistema
        break;

      case "REDLINE":
        if (!this.redLinePausing) {
          this.updateRedLineSequence();
        } else {
          this.updateRedLinePause();
        }
        break;

      case "YANKENPO":
        // El sistema de Yan Ken Po maneja su propia lógica
        break;

      default:
        // Otras fases - asegurar persecución
        if (this.bossManager.movement) {
          this.bossManager.movement.enableWandering();
          this.bossManager.movement.changePattern("hunting");
        }
        break;
    }
  },

  /**
   * Verificar si la fase debe completarse
   */
  checkPhaseCompletion() {
    const config = this.PHASE_CONFIGS[this.currentPhase];

    // Solo verificar fases con duración definida
    if (config.duration > 0 && this.phaseTimer >= config.duration) {
      this.completePhase();
    }
  },

  /**
   * Completar fase actual
   */
  completePhase() {
    console.log(`✅ Fase ${this.currentPhase} completada`);

    const currentPhase = this.currentPhase;

    // Determinar siguiente fase
    let nextPhase;
    switch (currentPhase) {
      case "INTRO":
        nextPhase = "HUNTING_1";
        break;
      case "SUMMONING":
        nextPhase = "HUNTING_2";
        break;
      case "MINES":
        nextPhase = "HUNTING_3";
        break;
      case "BULLETS":
        nextPhase = "HUNTING_4";
        break;
      case "REDLINE":
        nextPhase = "HUNTING_5";
        break;
      default:
        // No cambiar automáticamente
        return;
    }

    if (nextPhase) {
      this.changePhase(nextPhase);
    }
  },

  /**
   * Terminar fase actual
   */
  endCurrentPhase() {
    // Limpiar sistemas según la fase
    switch (this.currentPhase) {
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

      case "REDLINE":
        if (this.bossManager.redline) {
          this.bossManager.redline.endPhase();
        }
        break;
    }

    this.phaseActive = false;
  },

  // ======================================================
  // SISTEMA DE HILO ROJO REDISEÑADO
  // ======================================================

  /**
   * Iniciar secuencia de 10 hilos rojos
   */
  startRedLineSequence() {
    console.log("🔴 Iniciando secuencia de 10 hilos rojos");
    this.executeNextRedLine();
  },

  /**
   * Ejecutar siguiente hilo rojo
   */
  executeNextRedLine() {
    if (this.redLinesCompleted >= 10) {
      // Completar fase
      this.completePhase();
      return;
    }

    console.log(`🔴 Ejecutando hilo rojo ${this.redLinesCompleted + 1}/10`);

    if (this.bossManager.redline) {
      this.bossManager.redline.startRedLineCycle();
    }

    this.redLinesCompleted++;

    // Si no es el último hilo, programar pausa
    if (this.redLinesCompleted < 10) {
      this.redLinePausing = true;
      this.redLinePauseTimer = 0;
    }
  },

  /**
   * Actualizar secuencia de hilo rojo
   */
  updateRedLineSequence() {
    // La lógica está en executeNextRedLine, llamado desde redline system
  },

  /**
   * Actualizar pausa entre hilos rojos
   */
  updateRedLinePause() {
    this.redLinePauseTimer++;

    if (
      this.redLinePauseTimer >= this.PHASE_CONFIGS.REDLINE.pauseBetweenLines
    ) {
      this.redLinePausing = false;
      this.redLinePauseTimer = 0;

      // Ejecutar siguiente hilo
      setTimeout(() => {
        this.executeNextRedLine();
      }, 500);
    }
  },

  // ======================================================
  // SISTEMA YAN KEN PO REDISEÑADO
  // ======================================================

  /**
   * Manejar resultado de Yan Ken Po
   */
  handleYanKenPoResult(playerWon) {
    if (playerWon) {
      this.yanKenPoWins++;

      // Reducir 1% de vida del boss
      const damage = this.bossManager.maxHealth * 0.01;
      this.bossManager.currentHealth = Math.max(
        0,
        this.bossManager.currentHealth - damage
      );

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          `🏆 ¡Ganaste! (${this.yanKenPoWins}/${this.yanKenPoRequired})`,
          "#00FF00"
        );
      }

      // Verificar si ganó el juego
      if (this.yanKenPoWins >= this.yanKenPoRequired) {
        this.bossManager.defeat();
        return;
      }

      // Continuar Yan Ken Po
      setTimeout(() => {
        if (this.bossManager.yankenpo) {
          this.bossManager.yankenpo.startPhase();
        }
      }, 2000);
    } else {
      // Jugador perdió - invocar fase aleatoria
      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "💀 ¡Perdiste! Fase aleatoria",
          "#FF0000"
        );
      }

      // Seleccionar fase aleatoria
      const randomPhases = ["SUMMONING", "MINES", "BULLETS"];
      const randomPhase =
        randomPhases[Math.floor(Math.random() * randomPhases.length)];

      console.log(`🎲 Fase aleatoria seleccionada: ${randomPhase}`);

      setTimeout(() => {
        this.executeRandomPhase(randomPhase);
      }, 2000);
    }
  },

  /**
   * Ejecutar fase aleatoria después de perder Yan Ken Po
   */
  executeRandomPhase(phaseName) {
    // Boss sigue inmune
    this.bossManager.makeImmune(9999);

    // Centrar y mostrar mensaje
    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    const config = this.PHASE_CONFIGS[phaseName];
    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(`🎲 ${config.message}`, "#FF00FF");
    }

    // Ejecutar fase específica
    setTimeout(() => {
      this.setupSpecificPhase(phaseName);
    }, 1000);

    // Volver a Yan Ken Po después del tiempo de la fase
    setTimeout(() => {
      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "🎮 Volviendo a Yan Ken Po",
          "#FFD700"
        );
      }

      setTimeout(() => {
        if (this.bossManager.yankenpo) {
          this.bossManager.yankenpo.startPhase();
        }
      }, 2000);
    }, config.duration);
  },

  // ======================================================
  // INVOCACIÓN DE ENEMIGOS
  // ======================================================

  summonEnemies(count) {
    // Usar el sistema existente
    const canvas = window.getCanvas();

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `👹 ¡${count} ESBIRROS INVOCADOS!`,
        "#FF4444"
      );
    }

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const randomLevel = 1 + Math.floor(Math.random() * 10);
        const size = GameConfig.ENEMY_MIN_SIZE + randomLevel * 3;

        const positions = [
          { x: 50, y: 50 },
          { x: canvas.width - 100, y: 50 },
          { x: 50, y: canvas.height - 100 },
          { x: canvas.width - 100, y: canvas.height - 100 },
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
      }, i * 400);
    }

    if (window.AudioManager) {
      AudioManager.playSound("special");
    }
  },

  // ======================================================
  // GETTERS Y UTILIDADES
  // ======================================================

  getCurrentPhase() {
    return this.currentPhase;
  },

  getCurrentPhaseColor() {
    const phaseColors = {
      INTRO: "#8B0000",
      HUNTING_1: "#8B0000",
      SUMMONING: "#8B0000",
      HUNTING_2: "#8B0000",
      MINES: "#FF8800",
      HUNTING_3: "#8B0000",
      BULLETS: "#9B59B6",
      HUNTING_4: "#8B0000",
      REDLINE: "#FF0000",
      HUNTING_5: "#8B0000",
      YANKENPO: "#FFD700",
    };
    return phaseColors[this.currentPhase] || "#8B0000";
  },

  isPhaseActive() {
    return this.phaseActive;
  },

  getPhaseTimer() {
    return this.phaseTimer;
  },

  getPhaseProgress() {
    const config = this.PHASE_CONFIGS[this.currentPhase];
    if (!config || config.duration <= 0) return 0;
    return Math.min(1, this.phaseTimer / config.duration);
  },

  isInSpecialPhase() {
    const specialPhases = [
      "SUMMONING",
      "MINES",
      "BULLETS",
      "REDLINE",
      "YANKENPO",
    ];
    return specialPhases.includes(this.currentPhase);
  },

  // ======================================================
  // RESET
  // ======================================================

  reset() {
    this.currentPhase = "INTRO";
    this.phaseTimer = 0;
    this.phaseActive = false;
    this.phaseTransitioning = false;
    this.yanKenPoWins = 0;
    this.redLinesCompleted = 0;
    this.redLinePausing = false;
    this.redLinePauseTimer = 0;

    console.log("🔄 Sistema de fases reseteado");
  },

  /**
   * Obtener nombre de fase en español - NUEVO
   */
  getPhaseNameInSpanish(phaseName) {
    const translations = {
      INTRO: "PRESENTACIÓN",
      HUNTING_1: "CAZANDO",
      SUMMONING: "INVOCANDO",
      HUNTING_2: "CAZANDO",
      MINES: "MINAS",
      HUNTING_3: "CAZANDO",
      BULLETS: "LLUVIA DE BALAS",
      HUNTING_4: "CAZANDO",
      REDLINE: "HILO ROJO",
      HUNTING_5: "CAZANDO",
      YANKENPO: "YAN KEN PO",
    };

    return translations[phaseName] || phaseName;
  },

  /**
   * Obtener fase actual en español - NUEVO
   */
  getCurrentPhaseSpanish() {
    return this.getPhaseNameInSpanish(this.currentPhase);
  },

  // ======================================================
  // EVENTOS (para compatibilidad)
  // ======================================================

  onDamageReceived(healthPercentage) {
    // La transición de fase se maneja en checkPhaseTransition
    console.log(
      `👹 Boss recibió daño - Vida: ${Math.round(healthPercentage * 100)}%`
    );
  },

  handleYanKenPoLoss() {
    this.handleYanKenPoResult(false);
  },

  startFinalPhase() {
    this.changePhase("YANKENPO");
  },
};

// Hacer disponible globalmente
window.BossPhases = BossPhases;

console.log(
  "⚔️ boss-phases.js REDISEÑADO cargado - Sistema de fases con tiempos específicos"
);
