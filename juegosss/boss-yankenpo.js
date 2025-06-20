/**
 * Hell Shooter - Boss Yan Ken Po System
 * Sistema modular del minijuego final Yan Ken Po
 */

const BossYanKenPo = {
  // ======================================================
  // ESTADO DEL SISTEMA YAN KEN PO
  // ======================================================

  bossManager: null,

  // Estado de la fase
  phaseActive: false,
  gameState: "inactive", // inactive, countdown, selection, result, completed

  // Configuración del juego
  gameConfig: {
    roundsToWin: 3,
    selectionTimeLimit: 180, // 3 segundos a 60fps
    countdownDuration: 3, // 3 segundos de countdown
    resultDisplayTime: 2000, // 2 segundos para mostrar resultado
  },

  // Estado del juego
  roundsWon: 0,
  currentRound: 0,
  playerChoice: null,
  bossChoice: null,
  lastResult: null,

  // Timers
  countdownTimer: 0,
  selectionTimer: 0,
  countdown: 3,

  // Opciones del juego (0=Tijeras, 1=Papel, 2=Piedra)
  choices: [
    { key: "q", symbol: "✂️", name: "Tijeras", emoji: "✂️" },
    { key: "w", symbol: "📄", name: "Papel", emoji: "📄" },
    { key: "e", symbol: "🗿", name: "Piedra", emoji: "🗿" },
  ],

  // Control de UI
  uiCreated: false,
  keyHandler: null,
  originalPlayerControls: null,

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  /**
   * Inicializar el sistema Yan Ken Po
   */
  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.initYanKenPoSystem();
    console.log("✂️ Sistema Yan Ken Po del boss inicializado");
  },

  /**
   * Configurar sistema Yan Ken Po
   */
  initYanKenPoSystem() {
    this.phaseActive = false;
    this.gameState = "inactive";
    this.roundsWon = 0;
    this.currentRound = 0;
    this.playerChoice = null;
    this.bossChoice = null;
    this.lastResult = null;
    this.uiCreated = false;
    this.keyHandler = null;
    this.originalPlayerControls = null;
  },

  // ======================================================
  // CONTROL DE FASE
  // ======================================================

  /**
   * Iniciar la fase Yan Ken Po
   */
  startPhase() {
    console.log("✂️ === INICIANDO FASE YAN KEN PO ===");

    this.phaseActive = true;
    this.gameState = "countdown";
    this.roundsWon = 0;
    this.currentRound = 1;
    this.countdown = this.gameConfig.countdownDuration;
    this.countdownTimer = 0;

    // Boss inmune e inmóvil
    this.bossManager.makeImmune(9999);

    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    // Crear UI del juego
    this.createGameUI();

    // Configurar controles
    this.setupControls();

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🎮 ¡FASE FINAL: YAN KEN PO!",
        "#FFD700"
      );
    }

    if (this.bossManager.comments) {
      this.bossManager.comments.showBossMessage("¡Última oportunidad, mortal!");
    }

    console.log("✂️ Yan Ken Po inicializado correctamente");
  },

  /**
   * Terminar la fase Yan Ken Po
   */
  endPhase() {
    console.log("✂️ Terminando fase Yan Ken Po");

    this.phaseActive = false;
    this.gameState = "inactive";

    // Limpiar UI y controles
    this.cleanup();

    // Restaurar controles del jugador
    this.restorePlayerControls();

    // Boss vuelve a ser vulnerable
    this.bossManager.isImmune = false;
    this.bossManager.immunityTimer = 0;
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Actualizar sistema Yan Ken Po
   */
  update() {
    if (!this.phaseActive) return;

    switch (this.gameState) {
      case "countdown":
        this.updateCountdown();
        break;

      case "selection":
        this.updateSelection();
        break;

      case "result":
        // Los resultados se manejan con timeouts
        break;

      case "completed":
        // Fase completada
        break;
    }
  },

  /**
   * Actualizar countdown inicial
   */
  updateCountdown() {
    this.countdownTimer++;

    if (this.countdownTimer >= 60) {
      // 1 segundo
      this.countdown--;
      this.countdownTimer = 0;

      this.updateInfoDisplay();

      if (this.countdown <= 0) {
        this.startSelection();
      }
    }
  },

  /**
   * Actualizar fase de selección
   */
  updateSelection() {
    this.selectionTimer++;

    // Timeout si no selecciona a tiempo
    if (this.selectionTimer >= this.gameConfig.selectionTimeLimit) {
      console.log("⏰ Tiempo agotado - selección automática aleatoria");
      this.selectChoice(Math.floor(Math.random() * 3));
    }
  },

  // ======================================================
  // FASES DEL JUEGO
  // ======================================================

  /**
   * Iniciar fase de selección
   */
  startSelection() {
    console.log("⏰ Iniciando fase de selección");

    this.gameState = "selection";
    this.selectionTimer = 0;
    this.playerChoice = null;
    this.bossChoice = null;

    this.updateInfoDisplay();
    this.enableButtons();
  },

  /**
   * Procesar selección del jugador
   */
  selectChoice(choiceIndex) {
    if (this.gameState !== "selection" || this.playerChoice !== null) {
      console.log("❌ Selección inválida o ya realizada");
      return;
    }

    console.log(`🎯 Jugador seleccionó: ${this.choices[choiceIndex].name}`);

    this.playerChoice = choiceIndex;
    this.bossChoice = Math.floor(Math.random() * 3);

    console.log(`🤖 Boss seleccionó: ${this.choices[this.bossChoice].name}`);

    // Deshabilitar botones
    this.disableButtons();

    // Cambiar a fase de resultado
    this.gameState = "result";
    this.processResult();
  },

  /**
   * Procesar resultado de la ronda
   */
  processResult() {
    const playerChoice = this.playerChoice;
    const bossChoice = this.bossChoice;

    console.log(
      `⚔️ Batalla: Jugador(${this.choices[playerChoice].name}) vs Boss(${this.choices[bossChoice].name})`
    );

    let result;
    if (playerChoice === bossChoice) {
      result = "empate";
    } else if (
      (playerChoice === 0 && bossChoice === 1) || // Tijeras vs Papel
      (playerChoice === 1 && bossChoice === 2) || // Papel vs Piedra
      (playerChoice === 2 && bossChoice === 0) // Piedra vs Tijeras
    ) {
      result = "victoria";
      this.roundsWon++;
    } else {
      result = "derrota";
    }

    this.lastResult = result;

    console.log(
      `📊 Resultado: ${result} - Rondas ganadas: ${this.roundsWon}/${this.gameConfig.roundsToWin}`
    );

    // Mostrar resultado en UI
    this.showResult();

    // Decidir siguiente acción después de mostrar resultado
    setTimeout(() => {
      this.processGameResult();
    }, this.gameConfig.resultDisplayTime);
  },

  /**
   * Procesar el resultado del juego completo
   */
  processGameResult() {
    if (this.roundsWon >= this.gameConfig.roundsToWin) {
      this.handleGameWin();
    } else if (this.currentRound >= 5) {
      // Máximo 5 rondas
      this.handleGameLoss();
    } else {
      this.startNextRound();
    }
  },

  /**
   * Manejar victoria del jugador - CORREGIDO PARA 1% DE DAÑO
   */
  handleGameWin() {
    console.log("🏆 ¡Jugador ganó la ronda de Yan Ken Po!");

    this.roundsWon++;

    // 🔥 EL BOSS PIERDE 1% DE VIDA (5 puntos de 500 total)
    const damage = this.bossManager.maxHealth * 0.01; // 1% exacto
    this.bossManager.currentHealth = Math.max(
      0,
      this.bossManager.currentHealth - damage
    );

    console.log(
      `👹 Boss perdió ${damage} vida (1%). Vida actual: ${this.bossManager.currentHealth}/${this.bossManager.maxHealth}`
    );

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `🏆 ¡Ganaste! Boss -1% vida`,
        "#00FF00"
      );
    }

    // 🔥 VERIFICAR SI SE LOGRAN 3 VICTORIAS
    if (this.roundsWon >= 3) {
      console.log("🏆 ¡3 VICTORIAS! Boss derrotado");

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "🏆 ¡3 VICTORIAS! ¡BOSS DERROTADO!",
          "#FFD700"
        );
      }

      // Limpiar UI y terminar
      this.cleanup();

      // Boss derrotado
      setTimeout(() => {
        this.bossManager.defeat();
      }, 1000);

      return;
    }

    // Continuar con siguiente ronda
    setTimeout(() => {
      this.startNextRound();
    }, 2000);
  },

  /**
   * Manejar derrota/empate del jugador - CORREGIDO PARA FASES ALEATORIAS
   */
  handleGameLoss() {
    console.log("💀 Jugador perdió/empató - ejecutando fase aleatoria");

    this.gameState = "completed";

    // 🔥 ELIMINAR BOTONES TEMPORALMENTE
    this.removeGameUI();

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "💀 ¡Perdiste! Fase aleatoria incoming...",
        "#FF0000"
      );
    }

    // 🔥 FASES ALEATORIAS DISPONIBLES
    const randomPhases = ["SUMMONING", "MINES", "BULLETS", "REDLINE"];
    const selectedPhase =
      randomPhases[Math.floor(Math.random() * randomPhases.length)];

    console.log(`🎲 Fase aleatoria seleccionada: ${selectedPhase}`);

    setTimeout(() => {
      this.executeRandomPhase(selectedPhase);
    }, 2000);
  },

  /**
   * Ejecutar fase aleatoria y volver a Yan Ken Po - CORREGIDO
   */
  executeRandomPhase(phaseName) {
    console.log(`🎲 Ejecutando fase aleatoria: ${phaseName}`);

    // Boss se centra y ejecuta la fase
    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    const config = this.bossManager.phases.PHASE_CONFIGS[phaseName];

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `🎲 FASE ALEATORIA: ${this.bossManager.phases.getPhaseNameInSpanish(
          phaseName
        )}`,
        "#FF00FF"
      );
    }

    // Ejecutar la fase específica
    setTimeout(() => {
      switch (phaseName) {
        case "SUMMONING":
          // Invocar enemigos por 30 segundos
          this.executeRandomSummoning();
          break;
        case "MINES":
          // Minas por 45 segundos
          if (this.bossManager.mines) {
            this.bossManager.mines.startMineSequence();
          }
          break;
        case "BULLETS":
          // Touhou por 60 segundos
          if (this.bossManager.bullets) {
            this.bossManager.bullets.startBulletPattern();
          }
          break;
        case "REDLINE":
          // Hilo rojo por 5 rondas
          if (this.bossManager.redline) {
            this.bossManager.redline.startPhase();
          }
          break;
      }
    }, 1000);

    // 🔥 VOLVER A YAN KEN PO DESPUÉS DEL TIEMPO DE LA FASE
    const phaseDuration = this.getRandomPhaseDuration(phaseName);

    setTimeout(() => {
      console.log("🎮 Fase aleatoria terminada - volviendo a Yan Ken Po");

      // Limpiar fase actual
      this.cleanupRandomPhase(phaseName);

      // Centrar boss
      if (this.bossManager.movement) {
        this.bossManager.movement.stopMovementAndCenter();
      }

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "🎮 Volviendo a Yan Ken Po...",
          "#FFD700"
        );
      }

      // Recrear UI de Yan Ken Po
      setTimeout(() => {
        this.gameState = "countdown";
        this.countdown = 3;
        this.countdownTimer = 0;
        this.createGameUI();
        this.startSelection();
      }, 2000);
    }, phaseDuration);
  },

  /**
   * Obtener duración de fase aleatoria - NUEVO
   */
  getRandomPhaseDuration(phaseName) {
    const durations = {
      SUMMONING: 30000, // 30 segundos
      MINES: 45000, // 45 segundos
      BULLETS: 60000, // 60 segundos
      REDLINE: 50000, // 50 segundos
    };

    return durations[phaseName] || 30000;
  },

  /**
   * Limpiar fase aleatoria - NUEVO
   */
  cleanupRandomPhase(phaseName) {
    switch (phaseName) {
      case "MINES":
        if (this.bossManager.mines) {
          this.bossManager.mines.cleanup();
        }
        break;
      case "BULLETS":
        if (this.bossManager.bullets) {
          this.bossManager.bullets.cleanup();
        }
        break;
      case "REDLINE":
        if (this.bossManager.redline) {
          this.bossManager.redline.cleanup();
        }
        break;
    }
  },

  /**
   * Ejecutar invocación aleatoria - NUEVO
   */
  executeRandomSummoning() {
    let enemiesSpawned = 0;
    const maxEnemies = 6;

    const spawnInterval = setInterval(() => {
      if (enemiesSpawned >= maxEnemies) {
        clearInterval(spawnInterval);
        return;
      }

      // Invocar 2 enemigos
      if (this.bossManager.phases) {
        this.bossManager.phases.summonEnemies(2);
      }

      enemiesSpawned += 2;
    }, 5000); // Cada 5 segundos
  },

  /**
   * 🔥 NUEVO: Obtener estado para el sistema de fases
   */
  getWinCount() {
    return this.roundsWon;
  },

  getRequiredWins() {
    return this.gameConfig.roundsToWin;
  },

  isGameComplete() {
    return this.gameState === "completed";
  },

  /**
   * Iniciar siguiente ronda
   */
  startNextRound() {
    console.log(`🔄 Iniciando ronda ${this.currentRound + 1}`);

    this.currentRound++;
    this.countdown = this.gameConfig.countdownDuration;
    this.countdownTimer = 0;
    this.gameState = "countdown";
    this.playerChoice = null;
    this.bossChoice = null;
    this.lastResult = null;

    this.updateInfoDisplay();
  },

  // ======================================================
  // INTERFAZ DE USUARIO
  // ======================================================

  /**
   * Crear UI del juego - CORREGIDO SEGÚN ESPECIFICACIÓN EXACTA
   */
  createGameUI() {
    if (this.uiCreated) {
      this.removeGameUI();
    }

    console.log("🎨 Creando UI Yan Ken Po bajo la barra del boss");

    // 🔥 OBTENER POSICIÓN DE LA BARRA DE VIDA DEL BOSS
    const boss = this.bossManager.boss;
    if (!boss) return;

    const bossBarWidth = boss.width * 1.2;
    const bossBarX = boss.x + (boss.width - bossBarWidth) / 2;
    const bossBarY = boss.y + boss.height + 35 + 12; // Debajo de la barra

    // 🔥 CONTENEDOR PRINCIPAL - POSICIONADO BAJO LA BARRA DEL BOSS
    const container = document.createElement("div");
    container.id = "yankenpo-container";
    container.style.cssText = `
    position: fixed;
    left: ${bossBarX}px;
    top: ${bossBarY + 20}px;
    width: ${bossBarWidth}px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.9);
    padding: 10px;
    border-radius: 8px;
    border: 2px solid #ff0000;
    box-shadow: 0 0 20px #ff0000;
  `;

    // 🔥 BOTONES QUE OCUPAN EL ANCHO TOTAL DE LA BARRA
    const buttonsContainer = document.createElement("div");
    buttonsContainer.id = "yankenpo-buttons";
    buttonsContainer.style.cssText = `
    display: flex;
    width: 100%;
    gap: 2px;
    justify-content: space-between;
  `;

    // 🔥 CREAR BOTONES CON ANCHO EXACTO (1/3 cada uno)
    const buttonWidth = Math.floor((bossBarWidth - 20 - 4) / 3); // -20 padding, -4 gaps

    this.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.id = `yankenpo-${choice.key}`;
      button.className = "yankenpo-button";
      button.style.cssText = `
      width: ${buttonWidth}px;
      height: 50px;
      font-size: 14px;
      background: linear-gradient(135deg, #8b0000, #aa0000);
      border: 2px solid #ff0000;
      border-radius: 6px;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      line-height: 1;
    `;

      button.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 2px;">${choice.symbol}</div>
      <div style="font-size: 10px; font-weight: bold;">${choice.key.toUpperCase()}</div>
    `;

      // Efectos hover
      button.addEventListener("mouseenter", () => {
        button.style.transform = "scale(1.05)";
        button.style.boxShadow = "0 0 10px rgba(255, 0, 0, 0.6)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "scale(1)";
        button.style.boxShadow = "none";
      });

      // Click handler
      button.addEventListener("click", () => this.selectChoice(index));

      buttonsContainer.appendChild(button);
    });

    // 🔥 MARCADOR "Victorias 0/3" DEBAJO DE LOS BOTONES
    const scoreDisplay = document.createElement("div");
    scoreDisplay.id = "yankenpo-score";
    scoreDisplay.style.cssText = `
    color: #FFD700;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  `;
    scoreDisplay.textContent = `Victorias ${this.roundsWon}/3`;

    // 🔥 INFORMACIÓN DEL ESTADO
    const info = document.createElement("div");
    info.id = "yankenpo-info";
    info.style.cssText = `
    color: #ffffff;
    font-family: Arial, sans-serif;
    font-size: 12px;
    text-align: center;
    line-height: 1.2;
  `;

    // Ensamblar
    container.appendChild(buttonsContainer);
    container.appendChild(scoreDisplay);
    container.appendChild(info);
    document.body.appendChild(container);

    this.uiCreated = true;
    this.updateInfoDisplay();

    console.log("✅ UI Yan Ken Po creada bajo la barra del boss");
  },

  /**
   * Actualizar información mostrada - CORREGIDO
   */
  updateInfoDisplay() {
    const info = document.getElementById("yankenpo-info");
    const score = document.getElementById("yankenpo-score");

    if (!info || !score) return;

    // 🔥 ACTUALIZAR MARCADOR DE VICTORIAS
    score.textContent = `Victorias ${this.roundsWon}/3`;

    let content = "";

    switch (this.gameState) {
      case "countdown":
        content = `
        <div style="color: #ffff00;">Preparándote... ${this.countdown}</div>
      `;
        break;

      case "selection":
        content = `
        <div style="color: #00ff00; font-weight: bold;">¡ELIGE TU OPCIÓN!</div>
        <div style="font-size: 11px;">Presiona Q, W o E</div>
      `;
        break;

      case "result":
        const choices = ["✂️", "📄", "🗿"];
        const resultColors = {
          victoria: "#00ff00",
          derrota: "#ff0000",
          empate: "#ffff00",
        };
        const resultTexts = {
          victoria: "🎉 ¡GANASTE!",
          derrota: "💀 ¡PERDISTE!",
          empate: "🤝 ¡EMPATE!",
        };

        content = `
        <div style="margin: 5px 0;">
          <span>TÚ: ${choices[this.playerChoice]}</span>
          <span style="margin: 0 8px;">VS</span>
          <span>BOSS: ${choices[this.bossChoice]}</span>
        </div>
        <div style="color: ${
          resultColors[this.lastResult]
        }; font-weight: bold;">
          ${resultTexts[this.lastResult]}
        </div>
      `;
        break;

      default:
        content = `<div>Yan Ken Po - Final</div>`;
    }

    info.innerHTML = content;
  },

  /**
   * Mostrar resultado de la ronda
   */
  showResult() {
    this.updateInfoDisplay();

    // Efecto visual en el boss
    if (this.bossManager.ui) {
      const effectColor =
        this.lastResult === "victoria"
          ? "#00FF00"
          : this.lastResult === "derrota"
          ? "#FF0000"
          : "#FFFF00";

      this.bossManager.ui.createParticleEffect(
        this.bossManager.boss.x + this.bossManager.boss.width / 2,
        this.bossManager.boss.y + this.bossManager.boss.height / 2,
        effectColor,
        15
      );
    }
  },

  /**
   * Habilitar botones
   */
  enableButtons() {
    const buttons = document.querySelectorAll(".yankenpo-button");
    buttons.forEach((button) => {
      button.disabled = false;
      button.style.opacity = "1";
      button.style.cursor = "pointer";
    });
  },

  /**
   * Deshabilitar botones
   */
  disableButtons() {
    const buttons = document.querySelectorAll(".yankenpo-button");
    buttons.forEach((button) => {
      button.disabled = true;
      button.style.opacity = "0.5";
      button.style.cursor = "not-allowed";
    });
  },

  /**
   * Remover UI del juego
   */
  removeGameUI() {
    const container = document.getElementById("yankenpo-container");
    if (container) {
      container.remove();
      console.log("🗑️ UI de Yan Ken Po eliminada");
    }
    this.uiCreated = false;
  },

  // ======================================================
  // CONTROLES
  // ======================================================

  /**
   * Configurar controles del teclado
   */
  setupControls() {
    console.log("⌨️ Configurando controles Q, W, E para Yan Ken Po");

    // Eliminar handler anterior si existe
    this.removeKeyHandler();

    // Deshabilitar controles del jugador
    this.disablePlayerControls();

    // Nuevo handler
    this.keyHandler = (event) => {
      if (this.gameState !== "selection") return;

      const key = event.key.toLowerCase();
      console.log(`🔑 Tecla presionada en Yan Ken Po: "${key}"`);

      let choiceIndex = null;

      switch (key) {
        case "q":
          choiceIndex = 0; // Tijeras
          console.log("✂️ Jugador eligió Tijeras (Q)");
          break;
        case "w":
          choiceIndex = 1; // Papel
          console.log("📄 Jugador eligió Papel (W)");
          break;
        case "e":
          choiceIndex = 2; // Piedra
          console.log("🗿 Jugador eligió Piedra (E)");
          break;
      }

      if (choiceIndex !== null) {
        this.selectChoice(choiceIndex);
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Agregar listener
    document.addEventListener("keydown", this.keyHandler, true);

    console.log("✅ Controles de Yan Ken Po configurados");
  },

  /**
   * Remover handler de teclado
   */
  removeKeyHandler() {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler, true);
      this.keyHandler = null;
    }
  },

  /**
   * Deshabilitar controles del jugador
   */
  disablePlayerControls() {
    if (window.Player && Player.setupControls) {
      this.originalPlayerControls = Player.setupControls;
      Player.setupControls = () => {}; // Función vacía
    }
  },

  /**
   * Restaurar controles del jugador
   */
  restorePlayerControls() {
    if (this.originalPlayerControls && window.Player) {
      Player.setupControls = this.originalPlayerControls;

      // Reconfigurar controles si hay canvas disponible
      const canvas = window.getCanvas();
      if (canvas) {
        Player.setupControls(canvas);
      }
    }
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  /**
   * Dibujar elementos especiales del Yan Ken Po
   */
  draw(ctx) {
    if (!this.phaseActive) return;

    // Dibujar indicadores visuales si es necesario
    if (this.gameState === "result" && this.bossChoice !== null) {
      this.drawBossChoice(ctx);
    }
  },

  /**
   * Dibujar elección del boss sobre él
   */
  drawBossChoice(ctx) {
    const boss = this.bossManager.boss;
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y - 60;

    ctx.save();
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;

    const bossSymbol = this.choices[this.bossChoice].symbol;

    // Contorno negro
    ctx.strokeText(bossSymbol, centerX, centerY);
    // Símbolo blanco
    ctx.fillText(bossSymbol, centerX, centerY);

    ctx.restore();
  },

  // ======================================================
  // CLEANUP Y RESET
  // ======================================================

  /**
   * Limpiar sistema completamente
   */
  cleanup() {
    console.log("🧹 Limpiando sistema Yan Ken Po");

    // Remover UI
    this.removeGameUI();

    // Remover controles
    this.removeKeyHandler();

    // Restaurar controles del jugador
    this.restorePlayerControls();

    // Reset estado
    this.gameState = "inactive";
    this.phaseActive = false;
  },

  /**
   * Reset del sistema
   */
  reset() {
    this.cleanup();
    this.initYanKenPoSystem();
    console.log("🔄 Sistema Yan Ken Po reseteado");
  },

  // ======================================================
  // GETTERS Y UTILIDADES
  // ======================================================

  isActive() {
    return this.phaseActive;
  },

  getCurrentRound() {
    return this.currentRound;
  },

  getRoundsWon() {
    return this.roundsWon;
  },

  getRoundsToWin() {
    return this.gameConfig.roundsToWin;
  },

  getGameState() {
    return this.gameState;
  },

  getProgress() {
    return this.roundsWon / this.gameConfig.roundsToWin;
  },

  /**
   * Obtener estadísticas del juego
   */
  getStats() {
    return {
      active: this.phaseActive,
      state: this.gameState,
      round: this.currentRound,
      wins: this.roundsWon,
      target: this.gameConfig.roundsToWin,
      progress: this.getProgress(),
      playerChoice: this.playerChoice,
      bossChoice: this.bossChoice,
      lastResult: this.lastResult,
    };
  },
};

// Hacer disponible globalmente
window.BossYanKenPo = BossYanKenPo;

console.log("✂️ boss-yankenpo.js cargado - Sistema Yan Ken Po listo");
