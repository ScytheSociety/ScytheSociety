/**
 * Hell Shooter - Boss Yan Ken Po System Optimizado
 */

const BossYanKenPo = {
  // ======================================================
  // ESTADO DEL SISTEMA YAN KEN PO
  // ======================================================

  bossManager: null,
  phaseActive: false,
  gameState: "inactive", // inactive, countdown, selection, result, completed

  // Configuración desde GameConfig
  get gameConfig() {
    return GameConfig.YANKENPO_CONFIG;
  },

  // Estado del juego
  roundsWon: 0,
  currentRound: 0,
  playerChoice: null,
  bossChoice: null,
  lastResult: null,
  bossDefeats: 0, // Victorias del jugador contra el boss
  maxDefeats: 3, // 3 derrotas para matar al boss

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

  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.reset();
    console.log("✂️ Sistema Yan Ken Po del boss inicializado");
  },

  // ======================================================
  // CONTROL DE FASE
  // ======================================================

  startPhase() {
    console.log("✂️ === INICIANDO FASE YAN KEN PO ===");

    this.phaseActive = true;
    this.gameState = "countdown";
    this.roundsWon = 0;
    this.currentRound = 1;
    this.countdown = this.gameConfig.countdownDuration;
    this.countdownTimer = 0;

    // Asegurar que el contador de derrotas del boss esté correcto
    this.bossDefeats = this.bossDefeats || 0;

    // Boss inmune e inmóvil
    this.bossManager.makeImmune(9999);

    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    this.createGameUI();
    this.setupControls();

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🎮 ¡FASE FINAL: YAN KEN PO!",
        "#FFD700"
      );
    }

    if (this.bossManager.comments) {
      this.bossManager.comments.sayComment("¡Última oportunidad, mortal!");
    }
  },

  endPhase() {
    console.log("✂️ Terminando fase Yan Ken Po");

    this.phaseActive = false;
    this.gameState = "inactive";

    this.cleanup();
    this.restorePlayerControls();

    // Boss vuelve a ser vulnerable
    this.bossManager.isImmune = false;
    this.bossManager.immunityTimer = 0;
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

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

  updateSelection() {
    this.selectionTimer++;

    // Timeout si no selecciona a tiempo
    if (this.selectionTimer >= this.gameConfig.selectionTimeLimit) {
      console.log("⏰ Tiempo agotado - selección automática aleatoria");
      this.selectChoice(Math.floor(Math.random() * 3));
    }
  },

  // ======================================================
  // VICTORIA/DERROTA MEJORADAS
  // ======================================================

  handleGameWin() {
    console.log("🏆 ¡Jugador ganó el Yan Ken Po!");

    this.gameState = "completed";
    this.bossDefeats++; // Incrementar victorias del jugador

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `🏆 ¡GANASTE! (${this.bossDefeats}/${this.maxDefeats})`,
        "#00FF00"
      );
    }

    // 🔥 BOSS PIERDE 1% DE VIDA POR YAN KEN PO PERDIDO
    const damage = Math.ceil(this.bossManager.maxHealth * 0.01); // 1% exacto
    this.bossManager.currentHealth = Math.max(
      0,
      this.bossManager.currentHealth - damage
    );

    console.log(
      `💀 Boss pierde 1% vida. Vida restante: ${this.bossManager.currentHealth}/${this.bossManager.maxHealth}`
    );

    // 🔥 VERIFICAR SI MUERE (3 YAN KEN PO PERDIDOS = 3% vida perdida)
    if (
      this.bossManager.currentHealth <= 0 ||
      this.bossDefeats >= this.maxDefeats
    ) {
      console.log("💀 BOSS DERROTADO - Perdió 3 Yan Ken Po");

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "👑 ¡BOSS DERROTADO DEFINITIVAMENTE!",
          "#FFD700"
        );
      }

      setTimeout(() => {
        this.endPhase();
        this.bossManager.defeat();
      }, 3000);
      return;
    }

    // 🔥 BOSS SIGUE VIVO - NUEVO YAN KEN PO
    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `🎮 Nuevo Yan Ken Po en 3s... (${this.bossDefeats}/${this.maxDefeats})`,
        "#FFFF00"
      );
    }

    setTimeout(() => {
      this.restartYanKenPo();
    }, 3000);
  },

  handleGameLoss() {
    console.log("💀 Jugador perdió/empató el Yan Ken Po");

    this.gameState = "completed";

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "💀 ¡EMPATE/PERDISTE! Fase aleatoria...",
        "#FF0000"
      );
    }

    // 🔥 OCULTAR UI DE YAN KEN PO
    this.removeGameUI();

    setTimeout(() => {
      // 🔥 NO TERMINAR FASE - SOLO ACTIVAR FASE ALEATORIA
      if (this.bossManager.phases) {
        this.bossManager.phases.handleYanKenPoLoss();
      }
    }, 2000);
  },

  restartYanKenPo() {
    console.log(
      `🔄 Reiniciando Yan Ken Po - Boss derrotas: ${this.bossDefeats}/${this.maxDefeats}`
    );

    // Resetear estado del juego manteniendo contador de derrotas
    this.gameState = "countdown";
    this.roundsWon = 0;
    this.currentRound = 1;
    this.countdown = this.gameConfig.countdownDuration;
    this.countdownTimer = 0;
    this.playerChoice = null;
    this.bossChoice = null;
    this.lastResult = null;

    // Boss sigue inmune
    this.bossManager.makeImmune(9999);

    this.updateInfoDisplay();

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("🎮 ¡NUEVO YAN KEN PO!", "#FFD700");
    }
  },

  // ======================================================
  // PROCESAMIENTO DEL JUEGO
  // ======================================================

  startSelection() {
    console.log("⏰ Iniciando fase de selección");

    this.gameState = "selection";
    this.selectionTimer = 0;
    this.playerChoice = null;
    this.bossChoice = null;

    this.updateInfoDisplay();
    this.enableButtons();
  },

  selectChoice(choiceIndex) {
    if (this.gameState !== "selection" || this.playerChoice !== null) {
      console.log("❌ Selección inválida o ya realizada");
      return;
    }

    console.log(`🎯 Jugador seleccionó: ${this.choices[choiceIndex].name}`);

    this.playerChoice = choiceIndex;
    this.bossChoice = Math.floor(Math.random() * 3);

    console.log(`🤖 Boss seleccionó: ${this.choices[this.bossChoice].name}`);

    this.disableButtons();
    this.gameState = "result";
    this.processResult();
  },

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

    this.showResult();

    setTimeout(() => {
      this.processGameResult();
    }, this.gameConfig.resultDisplayTime);
  },

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

  createGameUI() {
    if (this.uiCreated) {
      this.removeGameUI();
    }

    console.log("🎨 Creando UI compacta de Yan Ken Po");

    const container = document.createElement("div");
    container.id = "yankenpo-container";
    container.style.cssText = `
    position: fixed;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.95);
    padding: 12px 16px;
    border-radius: 10px;
    border: 2px solid #ff0000;
    box-shadow: 0 0 20px #ff0000;
    max-width: 90vw;
  `;

    // Título compacto
    const title = document.createElement("div");
    title.style.cssText = `
    color: #ff0000;
    font-family: 'Creepster', cursive;
    font-size: clamp(0.9rem, 3vw, 1.2rem);
    text-shadow: 0 0 8px #ff0000;
    margin-bottom: 5px;
    text-align: center;
  `;
    title.textContent = "✂️ YAN KEN PO ✂️";
    container.appendChild(title);

    // Info y botones en UNA SOLA LÍNEA
    const gameRow = document.createElement("div");
    gameRow.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: center;
    flex-wrap: nowrap;
  `;

    // Información compacta
    const info = document.createElement("div");
    info.id = "yankenpo-info";
    info.style.cssText = `
    color: #ffffff;
    font-family: Arial, sans-serif;
    font-size: clamp(0.7rem, 2.5vw, 0.9rem);
    text-align: center;
    min-width: 120px;
    line-height: 1.2;
  `;
    gameRow.appendChild(info);

    // Botones en línea horizontal
    const buttonsContainer = document.createElement("div");
    buttonsContainer.id = "yankenpo-buttons";
    buttonsContainer.style.cssText = `
    display: flex;
    gap: 8px;
    align-items: center;
  `;

    // Crear botones más pequeños
    this.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.id = `yankenpo-${choice.key}`;
      button.className = "yankenpo-button";
      button.style.cssText = `
      width: clamp(45px, 12vw, 60px);
      height: clamp(45px, 12vw, 60px);
      font-size: clamp(1rem, 4vw, 1.4rem);
      background: linear-gradient(135deg, #8b0000, #aa0000);
      border: 2px solid #ff0000;
      border-radius: 8px;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      line-height: 1;
    `;

      button.innerHTML = `
      <div style="font-size: 0.9em;">${choice.symbol}</div>
      <div style="font-size: 0.4em; opacity: 0.8;">${choice.key.toUpperCase()}</div>
    `;

      button.addEventListener("mouseenter", () => {
        button.style.transform = "scale(1.05)";
        button.style.boxShadow = "0 0 10px rgba(255, 0, 0, 0.6)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "scale(1)";
        button.style.boxShadow = "none";
      });

      button.addEventListener("click", () => this.selectChoice(index));
      buttonsContainer.appendChild(button);
    });

    gameRow.appendChild(buttonsContainer);
    container.appendChild(gameRow);
    document.body.appendChild(container);

    this.uiCreated = true;
    this.updateInfoDisplay();

    console.log("✅ UI compacta de Yan Ken Po creada en UNA LÍNEA");
  },

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

  enableButtons() {
    const buttons = document.querySelectorAll(".yankenpo-button");
    buttons.forEach((button) => {
      button.disabled = false;
      button.style.opacity = "1";
      button.style.cursor = "pointer";
    });
  },

  disableButtons() {
    const buttons = document.querySelectorAll(".yankenpo-button");
    buttons.forEach((button) => {
      button.disabled = true;
      button.style.opacity = "0.5";
      button.style.cursor = "not-allowed";
    });
  },

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

  setupControls() {
    console.log("⌨️ Configurando controles Q, W, E para Yan Ken Po");

    this.removeKeyHandler();
    this.disablePlayerControls();

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

    document.addEventListener("keydown", this.keyHandler, true);

    console.log("✅ Controles de Yan Ken Po configurados");
  },

  removeKeyHandler() {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler, true);
      this.keyHandler = null;
    }
  },

  disablePlayerControls() {
    if (window.Player && Player.setupControls) {
      this.originalPlayerControls = Player.setupControls;
      Player.setupControls = () => {}; // Función vacía
    }
  },

  restorePlayerControls() {
    if (this.originalPlayerControls && window.Player) {
      Player.setupControls = this.originalPlayerControls;

      const canvas = window.getCanvas();
      if (canvas) {
        Player.setupControls(canvas);
      }
    }
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  draw(ctx) {
    if (!this.phaseActive) return;

    if (this.gameState === "result" && this.bossChoice !== null) {
      this.drawBossChoice(ctx);
    }
  },

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

    ctx.strokeText(bossSymbol, centerX, centerY);
    ctx.fillText(bossSymbol, centerX, centerY);

    ctx.restore();
  },

  // ======================================================
  // CLEANUP Y UTILIDADES
  // ======================================================

  cleanup() {
    console.log("🧹 Limpiando sistema Yan Ken Po");

    this.removeGameUI();
    this.removeKeyHandler();
    this.restorePlayerControls();

    this.gameState = "inactive";
    this.phaseActive = false;
  },

  reset() {
    this.cleanup();

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

    // NO resetear bossDefeats - se mantiene entre juegos

    console.log("🔄 Sistema Yan Ken Po reseteado");
  },

  // ======================================================
  // GETTERS
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

window.BossYanKenPo = BossYanKenPo;

console.log("✂️ boss-yankenpo.js optimizado cargado");
