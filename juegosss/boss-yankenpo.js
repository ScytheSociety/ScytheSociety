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
   * Manejar victoria del jugador - INTEGRADO CON NUEVO SISTEMA
   */
  handleGameWin() {
    console.log("🏆 ¡Jugador ganó el Yan Ken Po!");

    this.gameState = "completed";

    // Notificar al sistema de fases
    if (this.bossManager.phases) {
      this.bossManager.phases.handleYanKenPoResult(true);
    }

    // Limpiar UI
    this.cleanup();
  },

  /**
   * Manejar derrota del jugador - INTEGRADO CON NUEVO SISTEMA
   */
  handleGameLoss() {
    console.log("💀 Jugador perdió el Yan Ken Po");

    this.gameState = "completed";

    // Notificar al sistema de fases
    if (this.bossManager.phases) {
      this.bossManager.phases.handleYanKenPoResult(false);
    }

    // Limpiar UI
    this.cleanup();
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
   * Crear UI del juego
   */
  createGameUI() {
    if (this.uiCreated) {
      this.removeGameUI();
    }

    console.log("🎨 Creando UI de Yan Ken Po");

    const container = document.createElement("div");
    container.id = "yankenpo-container";
    container.style.cssText = `
      position: fixed;
      bottom: 20%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
      background: rgba(0, 0, 0, 0.9);
      padding: 20px;
      border-radius: 15px;
      border: 3px solid #ff0000;
      box-shadow: 0 0 30px #ff0000;
      min-width: 300px;
    `;

    // Título
    const title = document.createElement("div");
    title.style.cssText = `
      color: #ff0000;
      font-family: 'Creepster', cursive;
      font-size: clamp(1.2rem, 4vw, 1.8rem);
      text-shadow: 0 0 10px #ff0000;
      margin-bottom: 10px;
      text-align: center;
      white-space: nowrap;
    `;
    title.textContent = "✂️ YAN KEN PO ✂️";
    container.appendChild(title);

    // Información del juego
    const info = document.createElement("div");
    info.id = "yankenpo-info";
    info.style.cssText = `
      color: #ffffff;
      font-family: Arial, sans-serif;
      font-size: clamp(0.9rem, 3vw, 1.1rem);
      text-align: center;
      margin-bottom: 15px;
      line-height: 1.4;
    `;
    container.appendChild(info);

    // Contenedor de botones
    const buttonsContainer = document.createElement("div");
    buttonsContainer.id = "yankenpo-buttons";
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 15px;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    `;

    // Crear botones para cada opción
    this.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.id = `yankenpo-${choice.key}`;
      button.className = "yankenpo-button";
      button.style.cssText = `
        width: clamp(70px, 15vw, 90px);
        height: clamp(70px, 15vw, 90px);
        font-size: clamp(1.2rem, 6vw, 1.8rem);
        background: linear-gradient(135deg, #8b0000, #aa0000);
        border: 2px solid #ff0000;
        border-radius: 12px;
        color: #ffffff;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        line-height: 1;
        position: relative;
        overflow: hidden;
      `;

      button.innerHTML = `
        <div style="font-size: 1em; margin-bottom: 4px;">${choice.symbol}</div>
        <div style="font-size: 0.5em; font-weight: bold; opacity: 0.8;">${choice.key.toUpperCase()}</div>
      `;

      // Efectos hover
      button.addEventListener("mouseenter", () => {
        button.style.transform = "scale(1.05)";
        button.style.boxShadow = "0 0 15px rgba(255, 0, 0, 0.6)";
        button.style.background = "linear-gradient(135deg, #aa0000, #cc0000)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "scale(1)";
        button.style.boxShadow = "none";
        button.style.background = "linear-gradient(135deg, #8b0000, #aa0000)";
      });

      // Click handler
      button.addEventListener("click", () => this.selectChoice(index));

      buttonsContainer.appendChild(button);
    });

    container.appendChild(buttonsContainer);
    document.body.appendChild(container);

    this.uiCreated = true;
    this.updateInfoDisplay();

    console.log("✅ UI de Yan Ken Po creada");
  },

  /**
   * Actualizar información mostrada
   */
  updateInfoDisplay() {
    const info = document.getElementById("yankenpo-info");
    if (!info) return;

    let content = "";

    switch (this.gameState) {
      case "countdown":
        content = `
          <div>Ronda ${this.currentRound} - Prepárate...</div>
          <div style="font-size: 1.5em; color: #ffff00; margin: 5px 0;">${this.countdown}</div>
          <div>Victorias: ${this.roundsWon}/${this.gameConfig.roundsToWin}</div>
        `;
        break;

      case "selection":
        content = `
          <div>Ronda ${this.currentRound}</div>
          <div style="color: #00ff00; font-weight: bold;">¡ELIGE TU OPCIÓN!</div>
          <div style="font-size: 0.9em;">Presiona Q, W o E</div>
          <div>Victorias: ${this.roundsWon}/${this.gameConfig.roundsToWin}</div>
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
          <div>Ronda ${this.currentRound}</div>
          <div style="margin: 10px 0;">
            <span>TÚ: ${choices[this.playerChoice]}</span>
            <span style="margin: 0 10px;">VS</span>
            <span>BOSS: ${choices[this.bossChoice]}</span>
          </div>
          <div style="color: ${
            resultColors[this.lastResult]
          }; font-weight: bold; font-size: 1.2em;">
            ${resultTexts[this.lastResult]}
          </div>
          <div>Victorias: ${this.roundsWon}/${this.gameConfig.roundsToWin}</div>
        `;
        break;
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
