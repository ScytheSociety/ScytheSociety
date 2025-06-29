/**
 * Versión simplificada del YanKenPo para la fase final
 */
const BossYanKenPo = {
  // ======================================================
  // ESTADO DEL SISTEMA YAN KEN PO SIMPLIFICADO
  // ======================================================

  bossManager: null,
  phaseActive: false,
  gameState: "inactive", // inactive, countdown, selection, result, completed

  // Configuración desde GameConfig
  get gameConfig() {
    return GameConfig.YANKENPO_CONFIG;
  },

  // Estado del juego simplificado
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
    this.phaseActive = false;
    this.gameState = "inactive";
    this.playerChoice = null;
    this.bossChoice = null;
    this.lastResult = null;
    this.uiCreated = false;
    this.keyHandler = null;
    this.originalPlayerControls = null;

    // NO resetear bossDefeats para mantener progreso entre reintentos
    this.bossDefeats = this.bossDefeats || 0;
    this.maxDefeats = 3; // 3 victorias para derrotar al boss

    console.log("✂️ Sistema Yan Ken Po del boss inicializado");
  },

  // ======================================================
  // CONTROL DE FASE SIMPLIFICADO
  // ======================================================

  startPhase() {
    console.log("✂️ === INICIANDO FASE YAN KEN PO SIMPLIFICADA ===");

    // Limpiar elementos residuales de fases previas
    this.cleanupPreviousPhases();

    this.phaseActive = true;
    this.gameState = "countdown";
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

  // ======================================================
  // VICTORIA/DERROTA SIMPLIFICADAS
  // ======================================================

  handleGameWin() {
    console.log("🏆 ¡Jugador ganó el Yan Ken Po!");

    this.gameState = "completed";

    // Incrementar contador global de victorias
    this.bossDefeats = (this.bossDefeats || 0) + 1;

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `🏆 ¡GANASTE! (${this.bossDefeats}/${this.maxDefeats})`,
        "#00FF00"
      );
    }

    // Causar daño real al boss (1% de su vida)
    const damage = Math.ceil(this.bossManager.maxHealth * 0.01);
    this.bossManager.takeDamageFromYanKenPo(damage);

    console.log(
      `💀 Boss pierde 1% vida. Victorias: ${this.bossDefeats}/${this.maxDefeats}`
    );

    // Verificar si es la victoria final (3 victorias)
    if (this.bossDefeats >= this.maxDefeats) {
      console.log(
        "🎮 ¡VICTORIA FINAL! 3/3 Yan Ken Po ganados - Boss derrotado"
      );

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "👑 ¡BOSS DERROTADO DEFINITIVAMENTE!",
          "#FFD700"
        );
      }

      // Ocultar UI de Yan Ken Po
      this.removeGameUI();

      setTimeout(() => {
        this.endPhase();

        // Asegurarse de que el boss tenga 0 vida antes de llamar a defeat()
        this.bossManager.currentHealth = 0;
        this.bossManager.defeat();
      }, 3000);
      return;
    }

    // Preparar próxima ronda con delay
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
    console.log("💀 Jugador perdió el Yan Ken Po - Pierde una vida");

    this.gameState = "completed";

    // 🔥 QUITAR VIDA CORRECTAMENTE
    if (window.Player && Player.takeDamage) {
      const playerDied = Player.takeDamage();

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          `💔 ¡PERDISTE! Vidas: ${Player.getLives()}`,
          "#FF0000"
        );
      }

      // Verificar si el jugador murió
      if (playerDied || Player.getLives() <= 0) {
        if (this.bossManager.ui) {
          this.bossManager.ui.showScreenMessage("💀 ¡GAME OVER!", "#FF0000");
        }

        // Ocultar UI de Yan Ken Po
        this.removeGameUI();

        // Activar game over global
        setTimeout(() => {
          if (window.gameOver && typeof window.gameOver === "function") {
            window.gameOver();
          }
        }, 1000);
        return;
      }

      // Si el jugador sigue vivo, nueva ronda
      setTimeout(() => {
        this.restartYanKenPo();
      }, 3000);
    }
  },

  restartYanKenPo() {
    console.log(
      `🔄 Reiniciando Yan Ken Po - Boss derrotas: ${this.bossDefeats}/${this.maxDefeats}`
    );

    // Limpiar cualquier elemento de UI previo
    this.removeGameUI();
    this.createGameUI();

    // Resetear estado del juego pero mantener contador de derrotas
    this.gameState = "countdown";
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

    // Volver a configurar controles para asegurar funcionamiento
    this.setupControls();
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL SIMPLIFICADA
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

    // Timeout si no selecciona a tiempo - CON VENTAJA AL JUGADOR
    if (this.selectionTimer >= this.gameConfig.selectionTimeLimit) {
      console.log("⏰ Tiempo agotado - aplicando ventaja probabilística");

      // 🔥 EN TIMEOUT: 60% de probabilidad de victoria automática
      if (Math.random() < 0.6) {
        // Generar una combinación ganadora para el jugador
        const bossChoice = Math.floor(Math.random() * 3);
        let winningPlayerChoice;

        if (bossChoice === 0) winningPlayerChoice = 2; // Piedra gana a Tijeras
        else if (bossChoice === 1)
          winningPlayerChoice = 0; // Tijeras gana a Papel
        else winningPlayerChoice = 1; // Papel gana a Piedra

        this.playerChoice = winningPlayerChoice;
        this.bossChoice = bossChoice;

        console.log(
          `🍀 TIMEOUT CON SUERTE: Jugador(${
            this.choices[this.playerChoice].name
          }) vs Boss(${this.choices[this.bossChoice].name})`
        );
      } else {
        // 40% de probabilidad de selección aleatoria normal
        this.playerChoice = Math.floor(Math.random() * 3);
        this.bossChoice = Math.floor(Math.random() * 3);

        console.log(
          `⚡ Timeout normal: Jugador(${
            this.choices[this.playerChoice].name
          }) vs Boss(${this.choices[this.bossChoice].name})`
        );
      }

      this.disableButtons();
      this.gameState = "result";
      this.processResult();
    }
  },

  // ======================================================
  // PROCESAMIENTO DEL JUEGO SIMPLIFICADO
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

    // 🔥 NUEVO SISTEMA PROBABILÍSTICO - JUGADOR TIENE VENTAJA
    if (playerChoice === bossChoice) {
      // En empate, 70% de probabilidad de que el jugador gane
      if (Math.random() < 0.7) {
        result = "victoria";
        console.log("🎲 EMPATE CONVERTIDO A VICTORIA (70% probabilidad)");
      } else {
        result = "derrota";
        console.log("🎲 Empate mantenido como derrota (30% probabilidad)");
      }
    } else if (
      (playerChoice === 0 && bossChoice === 1) || // Tijeras vs Papel
      (playerChoice === 1 && bossChoice === 2) || // Papel vs Piedra
      (playerChoice === 2 && bossChoice === 0) // Piedra vs Tijeras
    ) {
      // Victoria normal del jugador - 85% de mantenerla
      if (Math.random() < 0.85) {
        result = "victoria";
        console.log("🎲 Victoria normal mantenida (85% probabilidad)");
      } else {
        result = "derrota";
        console.log("🎲 Victoria convertida a derrota (15% probabilidad)");
      }
    } else {
      // Derrota normal - 40% de convertirla a victoria
      if (Math.random() < 0.4) {
        result = "victoria";
        console.log("🎲 DERROTA CONVERTIDA A VICTORIA (40% probabilidad)");
      } else {
        result = "derrota";
        console.log("🎲 Derrota mantenida (60% probabilidad)");
      }
    }

    this.lastResult = result;
    console.log(`📊 Resultado final: ${result}`);

    this.showResult();

    setTimeout(() => {
      if (result === "victoria") {
        this.handleGameWin();
      } else {
        this.handleGameLoss();
      }
    }, this.gameConfig.resultDisplayTime);
  },

  // ======================================================
  // INTERFAZ DE USUARIO SIMPLIFICADA
  // ======================================================

  createGameUI() {
    if (this.uiCreated) {
      this.removeGameUI();
    }

    console.log("🎨 Creando UI simplificada de Yan Ken Po");

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

    // Título simplificado con vidas del jugador
    const title = document.createElement("div");
    title.style.cssText = `
    color: #ff0000;
    font-family: 'Creepster', cursive;
    font-size: clamp(0.9rem, 3vw, 1.2rem);
    text-shadow: 0 0 8px #ff0000;
    margin-bottom: 5px;
    text-align: center;
  `;
    title.textContent = `✂️ YAN KEN PO (Vidas: ${Player.getLives()}) ✂️`;
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

    console.log("✅ UI simplificada de Yan Ken Po creada");
  },

  updateInfoDisplay() {
    const info = document.getElementById("yankenpo-info");
    if (!info) return;

    let content = "";

    switch (this.gameState) {
      case "countdown":
        content = `
        <div>Elige una opción:</div>
        <div style="font-size: 1.5em; color: #ffff00; margin: 5px 0;">${this.countdown}</div>
        <div>Victorias: ${this.bossDefeats}/${this.maxDefeats}</div>
        <div style="font-size: 0.7em; color: #00ff00;">🍀 Tienes ventaja probabilística</div>
      `;
        break;

      case "selection":
        content = `
        <div>Vidas: ${Player.getLives()}</div>
        <div style="color: #00ff00; font-weight: bold;">¡ELIGE TU OPCIÓN!</div>
        <div style="font-size: 0.9em;">Presiona Q, W o E</div>
        <div>Victorias: ${this.bossDefeats}/${this.maxDefeats}</div>
        <div style="font-size: 0.7em; color: #ffff00;">⏰ Si no eliges, tienes 60% de suerte</div>
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
        <div>Vidas: ${Player.getLives()}</div>
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
        <div>Victorias: ${this.bossDefeats}/${this.maxDefeats}</div>
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
  // CONTROLES SIMPLIFICADOS
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
  // RENDERIZADO SIMPLIFICADO
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

  cleanupPreviousPhases() {
    console.log("🧹 Limpiando fases previas antes de Yan Ken Po");

    // Limpiar Red Line
    if (this.bossManager.redline) {
      this.bossManager.redline.gridLines = [];
      this.bossManager.redline.redLinePath = [];
      this.bossManager.redline.phaseActive = false;
      this.bossManager.redline.redLineForceActive = false;

      // Eliminar elementos visuales
      const gridElements = document.querySelectorAll('[id^="redline-"]');
      gridElements.forEach((el) => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });

      console.log("🔴 Sistema Red Line limpiado");
    }

    // Limpiar enemigos
    if (window.EnemyManager && window.EnemyManager.enemies) {
      const originalCount = window.EnemyManager.enemies.length;
      window.EnemyManager.enemies = window.EnemyManager.enemies.filter(
        (e) => !e.isBossMinion
      );
      const newCount = window.EnemyManager.enemies.length;

      console.log(
        `👹 Eliminados ${originalCount - newCount} enemigos del boss`
      );
    }

    // Limpiar minas activas
    if (this.bossManager.mines) {
      if (this.bossManager.mines.cleanup) {
        this.bossManager.mines.cleanup();
      }
      console.log("💣 Sistema de minas limpiado");
    }

    // Limpiar balas
    if (this.bossManager.bullets) {
      if (this.bossManager.bullets.cleanup) {
        this.bossManager.bullets.cleanup();
      }
      console.log("🌟 Sistema de balas limpiado");
    }

    // Restaurar velocidad del jugador
    if (window.Player) {
      window.Player.moveSpeed = 1.0;
      window.Player.speedModifier = 1.0;
      console.log("🏃 Velocidad del jugador restaurada a normal");
    }

    console.log("✅ Limpieza previa a Yan Ken Po completada");
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

  reset() {
    this.cleanup();

    // Restaurar estado inicial pero mantener victorias
    const savedDefeats = this.bossDefeats || 0;

    this.phaseActive = false;
    this.gameState = "inactive";
    this.playerChoice = null;
    this.bossChoice = null;
    this.lastResult = null;
    this.uiCreated = false;
    this.keyHandler = null;
    this.originalPlayerControls = null;

    // Restaurar contador de victorias para mantener progreso
    this.bossDefeats = savedDefeats;

    console.log(
      `🔄 Sistema Yan Ken Po reseteado (Victorias guardadas: ${this.bossDefeats}/${this.maxDefeats})`
    );
  },

  // ======================================================
  // GETTERS
  // ======================================================

  isActive() {
    return this.phaseActive;
  },
  getBossDefeats() {
    return this.bossDefeats;
  },
  getMaxDefeats() {
    return this.maxDefeats;
  },
  getGameState() {
    return this.gameState;
  },
};

window.BossYanKenPo = BossYanKenPo;

console.log("✂️ boss-yankenpo.js simplificado cargado");
