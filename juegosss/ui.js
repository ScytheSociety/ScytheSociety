/**
 * Hell Shooter - UI Management CORREGIDO Y MEJORADO
 * Sistema de interfaz más elegante y profesional con modales responsivos
 */

const UI = {
  // ======================================================
  // SISTEMAS DE MENSAJES
  // ======================================================

  messagePositions: [],
  messageIdCounter: 0,

  /**
   * Inicializa el sistema de UI
   */
  init() {
    this.createVolumeControl();
    this.createMusicTicker();
    this.createTotalEnemiesDisplay();
    this.setupEventListeners();
    console.log("🎨 Sistema de UI inicializado");
  },

  /**
   * Configurar event listeners de UI
   */
  setupEventListeners() {
    // Botón de emoji picker
    const emojiButton = document.getElementById("emoji-button");
    if (emojiButton) {
      emojiButton.addEventListener("click", this.openEmojiPicker);
    }

    // Botón de poder especial para móvil
    const specialButton = document.getElementById("special-power-indicator");
    if (specialButton) {
      specialButton.addEventListener("click", () => {
        if (BulletManager.isSpecialPowerReady()) {
          BulletManager.activateSpecialPower();
        }
      });
    }
  },

  /**
   * Actualiza la UI cada frame
   */
  update() {
    this.updateGameInfo();
    this.updateSpecialPowerIndicator();
    this.updateLivesDisplay();
    this.updatePowerUpIndicator();
  },

  // ======================================================
  // SISTEMA DE MENSAJES EN PANTALLA - MEJORADO
  // ======================================================

  /**
   * Sistema de mensajes en la parte superior - SOLO 2 SLOTS
   */
  showScreenMessage(message, color = "#FFFFFF") {
    // Filtrar mensajes repetitivos y spam
    const spamMessages = [
      "expirando",
      "terminado",
      "renovado",
      "Poder especial cargado",
      "PODER LISTO",
      "Combo:",
      "Balas Penetrantes renovado",
      "Balas Explosivas renovado",
      "Disparo Amplio renovado",
      "Disparo Rápido renovado",
    ];

    if (spamMessages.some((spam) => message.includes(spam))) {
      return;
    }

    const messageId = this.messageIdCounter++;
    const positions = [{ y: 8 }, { y: 16 }];

    // Limpiar mensajes antiguos
    this.messagePositions = this.messagePositions.filter((pos) => pos.active);

    // Si hay 2 mensajes, eliminar el más viejo
    if (this.messagePositions.length >= 2) {
      const oldestMessage = document.querySelector(
        `[data-message-id="${this.messagePositions[0].id}"]`
      );
      if (oldestMessage) {
        oldestMessage.remove();
      }
      this.messagePositions.shift();
    }

    // Mover mensaje existente hacia abajo
    if (this.messagePositions.length === 1) {
      const existingMessage = document.querySelector(
        `[data-message-id="${this.messagePositions[0].id}"]`
      );
      if (existingMessage) {
        existingMessage.style.top = "16%";
      }
      this.messagePositions[0].y = 16;
    }

    // Agregar nuevo mensaje arriba
    const position = {
      id: messageId,
      y: 8,
      active: true,
      timeCreated: Date.now(),
    };
    this.messagePositions.unshift(position);

    // Crear elemento de mensaje
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageElement.setAttribute("data-message-id", messageId);
    messageElement.style.position = "fixed";
    messageElement.style.top = "8%";
    messageElement.style.left = "50%";
    messageElement.style.transform = "translateX(-50%)";
    messageElement.style.color = color;
    messageElement.style.fontSize = "13px";
    messageElement.style.fontWeight = "bold";
    messageElement.style.textShadow = "2px 2px 4px rgba(0,0,0,0.9)";
    messageElement.style.zIndex = "1000";
    messageElement.style.backgroundColor = "transparent";
    messageElement.style.padding = "0";
    messageElement.style.borderRadius = "0";
    messageElement.style.border = "none";
    messageElement.style.outline = "none";
    messageElement.style.maxWidth = "300px";
    messageElement.style.textAlign = "center";
    messageElement.style.fontFamily = '"Arial", sans-serif';
    messageElement.style.transition = "all 0.3s ease";
    messageElement.style.animation = "messageSlideIn 0.4s ease-out";
    messageElement.style.letterSpacing = "1px";
    messageElement.style.textTransform = "uppercase";
    messageElement.style.boxShadow = "none";

    document.body.appendChild(messageElement);

    // Eliminar después de 3 segundos
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.style.opacity = "0";
        messageElement.style.transform = "translateX(-50%) translateY(-10px)";

        setTimeout(() => {
          if (messageElement.parentNode) {
            document.body.removeChild(messageElement);
          }
        }, 300);
      }

      // Limpiar de la lista
      const posIndex = this.messagePositions.findIndex(
        (p) => p.id === messageId
      );
      if (posIndex !== -1) {
        this.messagePositions.splice(posIndex, 1);
      }
    }, 3000);
  },

  // ======================================================
  // ACTUALIZACIÓN DE ELEMENTOS UI
  // ======================================================

  /**
   * Actualiza la información del juego
   */
  updateGameInfo() {
    // Actualizar información del jugador
    const playerNameElement = document.getElementById("player-name");
    const playerAvatarElement = document.getElementById("player-avatar");

    if (playerNameElement && Player.getName()) {
      playerNameElement.textContent = Player.getName();
    }

    if (playerAvatarElement && Player.getAvatar()) {
      playerAvatarElement.textContent = Player.getAvatar();
    }

    const level = window.getLevel();
    const score = window.getScore();
    const gameTime = window.getGameTime();

    // Actualizar elementos si existen
    const levelElement = document.getElementById("level");
    if (levelElement) {
      levelElement.textContent = `Nivel ${level}`;
    }

    const scoreElement = document.getElementById("score");
    if (scoreElement) {
      scoreElement.textContent = `Puntuación: ${score}`;
    }

    const timeElement = document.getElementById("time");
    if (timeElement && gameTime % 60 === 0) {
      timeElement.textContent = `Tiempo: ${Math.floor(gameTime / 60)}s`;
    }

    // Actualizar contador para pasar de nivel
    const enemiesElement = document.getElementById("enemies-killed");
    if (enemiesElement) {
      if (level <= 10) {
        enemiesElement.textContent = `Nivel: ${EnemyManager.getEnemiesKilled()}/${EnemyManager.getEnemiesRequired()}`;
      } else {
        enemiesElement.textContent = `Boss Final`;
      }
    }

    // Actualizar contador total
    const totalDisplay = document.getElementById("total-enemies-display");
    if (totalDisplay && window.getTotalEnemiesKilled) {
      totalDisplay.textContent = `Total: ${window.getTotalEnemiesKilled()}`;
    }
  },

  /**
   * Actualiza el indicador de poder especial
   */
  updateSpecialPowerIndicator() {
    const indicator = document.getElementById("special-power-indicator");
    const counter = document.getElementById("special-power-counter");

    if (!indicator || !counter) return;

    if (BulletManager.isSpecialPowerReady()) {
      indicator.classList.add("special-power-ready");
      counter.textContent = "🔥";
    } else {
      indicator.classList.remove("special-power-ready");
      const progress = BulletManager.getSpecialPowerProgress();
      const required = 15;
      const current = Math.floor(progress * required);
      counter.textContent = `${current}/${required}`;
    }
  },

  /**
   * Actualiza la visualización de vidas - CORREGIDO PARA GAME OVER
   */
  updateLivesDisplay() {
    const livesDisplay = document.getElementById("player-lives");
    if (!livesDisplay) return;

    const lives = Math.max(0, Player.getLives());

    // Verificar si el juego ha terminado
    if (window.isGameEnded && window.isGameEnded()) {
      livesDisplay.innerHTML = "💀 GAME OVER";
      livesDisplay.style.color = "#FF0000";
      livesDisplay.style.fontWeight = "bold";
      return;
    }

    let livesText = "";

    if (lives === 0) {
      livesText = "💀 GAME OVER";
      livesDisplay.style.color = "#FF0000";
      livesDisplay.style.fontWeight = "bold";

      if (window.gameOver && !window.isGameEnded()) {
        console.log("💀 UI detectó 0 vidas - activando game over");
        setTimeout(() => {
          window.gameOver();
        }, 100);
      }
    } else if (lives <= 7) {
      livesText = "💀".repeat(lives);
      livesDisplay.style.color = "#FFFFFF";
      livesDisplay.style.fontWeight = "normal";
    } else {
      const firstRow = "💀".repeat(7);
      const secondRow = "💀".repeat(lives - 7);
      livesText = firstRow + "<br>" + secondRow;
      livesDisplay.style.color = "#FFFFFF";
      livesDisplay.style.fontWeight = "normal";
    }

    livesDisplay.innerHTML = livesText;
  },

  /**
   * Actualiza el indicador de power-up activo
   */
  updatePowerUpIndicator() {
    const indicator = document.getElementById("power-up-indicator");
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  },

  // ======================================================
  // MODALES MEJORADOS Y RESPONSIVOS
  // ======================================================

  /**
   * 🔥 NUEVO: Muestra las instrucciones del juego - RESPONSIVE Y CONSISTENTE
   */
  showInstructions(callback) {
    const modal = document.createElement("div");
    modal.className = "instructions-modal";
    modal.id = "instructions-modal";

    modal.innerHTML = `
      <div class="instructions-content">
        <button onclick="closeInstructions()" class="modal-close-button">✕</button>

        <h2 class="instructions-title">🎮 HELL SHOOTER 🎮</h2>
        
        <!-- Grid de Información Compacta -->
        <div style="
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 15px; 
          margin-bottom: 20px;
          font-size: 13px;
        ">
          <!-- Controles -->
          <div style="
            background: rgba(139, 0, 0, 0.3);
            padding: 12px;
            border-radius: 10px;
            border: 1px solid rgba(255, 0, 0, 0.3);
          ">
            <h3 style="color: #FF0000; margin: 0 0 8px 0; font-size: 14px;">🎯 CONTROLES</h3>
            <div style="line-height: 1.4; color: #FFFFFF;">
              <div>🖱️ <strong>Movimiento:</strong> Mouse/Táctil</div>
              <div>🔫 <strong>Disparo:</strong> Automático</div>
              <div>⚡ <strong>Poder:</strong> ESPACIO / 🔥</div>
              <div>🎯 <strong>Combo:</strong> Elimina sin parar</div>
            </div>
          </div>
          
          <!-- Supervivencia -->
          <div style="
            background: rgba(139, 0, 0, 0.3);
            padding: 12px;
            border-radius: 10px;
            border: 1px solid rgba(255, 0, 0, 0.3);
          ">
            <h3 style="color: #FF0000; margin: 0 0 8px 0; font-size: 14px;">💀 SUPERVIVENCIA</h3>
            <div style="line-height: 1.4; color: #FFFFFF;">
              <div>❤️ <strong>Vidas:</strong> 7 inicial (máx. 14)</div>
              <div>🎮 <strong>Niveles:</strong> 10 épicos</div>
              <div>👹 <strong>Boss Final:</strong> Nivel 11</div>
              <div>⚡ <strong>Poder:</strong> Cada 15 enemigos</div>
            </div>
          </div>
        </div>
        
        <!-- Power-ups Compactos -->
        <div style="
          background: rgba(139, 0, 0, 0.2);
          padding: 15px;
          border-radius: 12px;
          border: 1px solid rgba(255, 0, 0, 0.3);
          margin-bottom: 20px;
        ">
          <h3 style="color: #FF0000; margin: 0 0 10px 0; font-size: 14px; text-align: center;">⚡ POWER-UPS ÉPICOS</h3>
          <div style="
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px; 
            justify-content: center;
            font-size: 11px;
          ">
            <span style="background: rgba(0,255,0,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(0,255,0,0.5); color: #FFFFFF;">
              🟢 Escudo (4s)
            </span>
            <span style="background: rgba(0,255,255,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(0,255,255,0.5); color: #FFFFFF;">
              🔵 Amplio (7 balas)
            </span>
            <span style="background: rgba(255,136,0,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(255,136,0,0.5); color: #FFFFFF;">
              🟠 Explosivas
            </span>
            <span style="background: rgba(255,0,255,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(255,0,255,0.5); color: #FFFFFF;">
              🟣 Súper Rápido
            </span>
          </div>
        </div>

        <!-- Eventos Especiales -->
        <div style="
          background: rgba(139, 0, 0, 0.2);
          padding: 15px;
          border-radius: 12px;
          border: 1px solid rgba(255, 0, 0, 0.3);
          margin-bottom: 20px;
        ">
          <h3 style="color: #FF0000; margin: 0 0 10px 0; font-size: 14px; text-align: center;">🌟 EVENTOS ÚNICOS</h3>
          <div style="
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px; 
            justify-content: center;
            font-size: 11px;
          ">
            <span style="background: rgba(0,187,255,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(0,187,255,0.5); color: #FFFFFF;">
              🌊 Tiempo Lento
            </span>
            <span style="background: rgba(255,100,0,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(255,100,0,0.5); color: #FFFFFF;">
              🔥 Modo Frenesí
            </span>
            <span style="background: rgba(255,136,0,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(255,136,0,0.5); color: #FFFFFF;">
              ☄️ Meteoritos
            </span>
            <span style="background: rgba(255,215,0,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(255,215,0,0.5); color: #FFFFFF;">
              ✨ Lluvia Items
            </span>
          </div>
        </div>
        
        <!-- Tip Final -->
        <div style="
          text-align: center; 
          margin-top: 15px; 
          font-size: 11px; 
          color: #CCCCCC;
          font-style: italic;
        ">
          💡 Tip: Mantén combos altos para multiplicar puntos y desbloquear eventos épicos
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  /**
   * Muestra las instrucciones desde el menú principal
   */
  showInstructionsFromMenu() {
    this.showInstructions(() => {
      // No hacer nada, solo cerrar
    });
  },

  // ======================================================
  // EFECTOS VISUALES
  // ======================================================

  /**
   * Crea efecto de partículas
   */
  createParticleEffect(x, y, color, particleCount) {
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;

      particles.push({
        x: x,
        y: y,
        size: 2 + Math.random() * 3,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        maxLife: 50,
      });
    }

    const animateParticles = () => {
      if (particles.length === 0) return;

      const canvas = window.getCanvas();
      const ctx = window.getContext();
      if (!ctx) return;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fill();
        ctx.restore();

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        requestAnimationFrame(animateParticles);
      }
    };

    requestAnimationFrame(animateParticles);
  },

  /**
   * Crea efecto de explosión
   */
  createExplosionEffect(x, y) {
    this.createParticleEffect(x, y, "#FF8800", 30);

    const canvas = window.getCanvas();
    const ctx = window.getContext();
    if (!ctx) return;

    let radius = 5;
    const maxRadius = 120;
    let life = 20;

    const animateShockwave = () => {
      if (life <= 0) return;

      radius += (maxRadius - radius) * 0.2;
      life--;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "#FF8800";
      ctx.globalAlpha = life / 20;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      if (life > 0) {
        requestAnimationFrame(animateShockwave);
      }
    };

    requestAnimationFrame(animateShockwave);
  },

  /**
   * Efecto de celebración
   */
  celebrationEffect() {
    const canvas = window.getCanvas();
    const colors = [
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFFF00",
      "#FF00FF",
      "#00FFFF",
    ];

    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const color = colors[Math.floor(Math.random() * colors.length)];
        this.createParticleEffect(x, y, color, 50);
      }, i * 200);
    }
  },

  // ======================================================
  // PANTALLAS Y MODALES
  // ======================================================

  /**
   * Muestra transición de nivel
   */
  showLevelTransition(level, callback) {
    const transition = document.createElement("div");
    transition.style.position = "fixed";
    transition.style.top = "50%";
    transition.style.left = "50%";
    transition.style.transform = "translate(-50%, -50%)";
    transition.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    transition.style.padding = "30px 50px";
    transition.style.borderRadius = "15px";
    transition.style.zIndex = "1000";
    transition.style.fontSize = "2.5em";
    transition.style.color = "#FF0000";
    transition.style.border = "3px solid #8B0000";
    transition.style.boxShadow = "0 0 30px #FF0000";
    transition.style.textAlign = "center";
    transition.style.fontFamily = '"Arial", sans-serif';
    transition.style.fontWeight = "bold";

    if (level === 10) {
      transition.innerHTML =
        "👹 NIVEL FINAL 👹<br><span style='font-size: 0.6em;'>¡PREPÁRATE PARA EL BOSS!</span>";
    } else {
      transition.innerHTML = `NIVEL ${level}<br><span style='font-size: 0.6em;'>${EnemyManager.getEnemiesRequired()} enemigos</span>`;
    }

    document.body.appendChild(transition);

    setTimeout(
      () => {
        document.body.removeChild(transition);
        if (callback) callback();
      },
      level === 1 ? 1000 : 2000
    );
  },

  /**
   * Muestra pantalla de game over mejorada y elegante
   */
  showGameOver(isVictory, finalScore, finalLevel, maxCombo = 0) {
    const gameOverScreen = document.getElementById("game-over");

    if (gameOverScreen) {
      gameOverScreen.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(139,0,0,0.95) 100%);
        border: 3px solid ${isVictory ? "#FFD700" : "#8B0000"};
        border-radius: 20px;
        padding: 30px;
        text-align: center;
        box-shadow: 0 0 30px ${isVictory ? "#FFD700" : "#FF0000"};
        backdrop-filter: blur(10px);
        max-width: 400px;
        margin: 0 auto;
      ">
        <h1 style="
          font-size: 2.2em;
          margin: 0 0 15px 0;
          color: ${isVictory ? "#FFD700" : "#FF0000"};
          text-shadow: 0 0 20px currentColor;
          font-weight: bold;
          letter-spacing: 2px;
        ">
          ${isVictory ? "🏆 VICTORIA 🏆" : "💀 GAME OVER 💀"}
        </h1>

        <div style="
          background: rgba(0,0,0,0.6);
          border-radius: 12px;
          padding: 15px;
          margin: 15px 0;
          border: 1px solid rgba(255,255,255,0.2);
        ">
          <div style="color: #FFFFFF; font-size: 1.1em; margin-bottom: 8px;">
            <span style="color: #FFD700;">📊 Puntuación:</span> ${finalScore.toLocaleString()}
          </div>
          <div style="color: #FFFFFF; font-size: 1.1em; margin-bottom: 8px;">
            <span style="color: #FFD700;">🎯 Nivel Alcanzado:</span> ${finalLevel}
          </div>
          ${
            maxCombo > 0
              ? `
          <div style="color: #FFFFFF; font-size: 1.2em; font-weight: bold;">
            <span style="color: #FF6B00;">⚡ Combo Máximo:</span> 
            <span style="color: #FFD700; text-shadow: 0 0 10px #FFD700;">${maxCombo}</span>
          </div>
          `
              : ""
          }
        </div>

        <div style="
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        ">
          <button 
            onclick="restartGame()" 
            style="
              background: linear-gradient(45deg, #4CAF50, #45a049);
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 25px;
              font-size: 1em;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s;
              box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
              font-family: inherit;
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(76, 175, 80, 0.6)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(76, 175, 80, 0.4)'"
          >
            🔄 Jugar de Nuevo
          </button>

          <button 
            onclick="saveAndViewRanking()" 
            style="
              background: linear-gradient(45deg, #FF9800, #F57C00);
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 25px;
              font-size: 1em;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s;
              box-shadow: 0 4px 15px rgba(255, 152, 0, 0.4);
              font-family: inherit;
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 152, 0, 0.6)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 152, 0, 0.4)'"
          >
            💾 Guardar en Ranking
          </button>

          <button 
            onclick="backToMenu()" 
            style="
              background: linear-gradient(45deg, #607D8B, #455A64);
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 25px;
              font-size: 1em;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s;
              box-shadow: 0 4px 15px rgba(96, 125, 139, 0.4);
              font-family: inherit;
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(96, 125, 139, 0.6)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(96, 125, 139, 0.4)'"
          >
            🏠 Menú Principal
          </button>
        </div>

        ${
          isVictory
            ? `
        <div style="
          margin-top: 20px;
          font-size: 0.9em;
          color: #FFD700;
          font-style: italic;
        ">
          ¡Felicidades por completar Hell Shooter! 🎉
        </div>
        `
            : ""
        }
      </div>
    `;

      gameOverScreen.style.display = "block";
    }
  },

  // ======================================================
  // CONTROLES DE VOLUMEN Y MÚSICA
  // ======================================================

  /**
   * Crea control de volumen
   */
  createVolumeControl() {
    const volumeButton = document.createElement("button");
    volumeButton.id = "volume-control";
    volumeButton.style.position = "fixed";
    volumeButton.style.top = "60px";
    volumeButton.style.right = "15px";
    volumeButton.style.width = "48px";
    volumeButton.style.height = "48px";
    volumeButton.style.minWidth = "48px";
    volumeButton.style.minHeight = "48px";
    volumeButton.style.maxWidth = "48px";
    volumeButton.style.maxHeight = "48px";
    volumeButton.style.borderRadius = "50%";
    volumeButton.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    volumeButton.style.border = "2px solid #8B0000";
    volumeButton.style.color = "#FFFFFF";
    volumeButton.style.fontSize = "16px";
    volumeButton.style.cursor = "pointer";
    volumeButton.style.zIndex = "1001";
    volumeButton.style.transition = "all 0.3s ease";
    volumeButton.style.display = "flex";
    volumeButton.style.alignItems = "center";
    volumeButton.style.justifyContent = "center";
    volumeButton.style.boxSizing = "border-box";
    volumeButton.style.padding = "0";
    volumeButton.style.margin = "0";
    volumeButton.style.boxShadow = "0 2px 8px rgba(0,0,0,0.5)";
    volumeButton.style.aspectRatio = "1 / 1";
    volumeButton.textContent = "🔊";

    let volumeStates = [1.0, 0.5, 0.25, 0.0];
    let currentStateIndex = 0;

    volumeButton.addEventListener("click", () => {
      currentStateIndex = (currentStateIndex + 1) % volumeStates.length;
      const newVolume = volumeStates[currentStateIndex];

      AudioManager.setMasterVolume(newVolume);

      if (newVolume === 0) {
        volumeButton.textContent = "🔇";
      } else if (newVolume <= 0.25) {
        volumeButton.textContent = "🔈";
      } else if (newVolume <= 0.5) {
        volumeButton.textContent = "🔉";
      } else {
        volumeButton.textContent = "🔊";
      }

      volumeButton.style.transform = "scale(1.1)";
      setTimeout(() => {
        volumeButton.style.transform = "scale(1)";
      }, 150);
    });

    document.body.appendChild(volumeButton);
  },

  /**
   * Crea el ticker de música
   */
  createMusicTicker() {
    const musicTicker = document.createElement("div");
    musicTicker.id = "music-ticker";
    musicTicker.style.cssText = `
    position: fixed;
    top: 112px;
    right: 15px;
    width: 48px;
    height: 16px;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid #8B0000;
    border-radius: 3px;
    overflow: hidden;
    z-index: 1000;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 4px rgba(0,0,0,0.5);
  `;

    const tickerText = document.createElement("div");
    tickerText.id = "ticker-text";
    tickerText.style.cssText = `
    white-space: nowrap;
    color: #FFFFFF;
    font-size: 8px;
    font-weight: bold;
    font-family: "Arial", sans-serif;
    animation: tickerScroll 10s linear infinite;
    transform: translateX(100%);
    text-shadow: 0 0 2px #000;
  `;

    tickerText.textContent = window.currentMusicTrack || "Elegía - Azkal";
    musicTicker.appendChild(tickerText);
    document.body.appendChild(musicTicker);
  },

  /**
   * Actualiza el texto del ticker de música
   */
  updateMusicTicker(trackName) {
    const tickerText = document.getElementById("ticker-text");
    if (tickerText) {
      tickerText.textContent = trackName;
      console.log(`🎵 Ticker actualizado: ${trackName}`);
    }
  },

  /**
   * Crea el display del contador total de enemigos
   */
  createTotalEnemiesDisplay() {
    const totalDisplay = document.createElement("div");
    totalDisplay.id = "total-enemies-display";
    totalDisplay.style.position = "fixed";
    totalDisplay.style.bottom = "90px";
    totalDisplay.style.left = "15px";
    totalDisplay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    totalDisplay.style.color = "#FFFFFF";
    totalDisplay.style.padding = "4px 8px";
    totalDisplay.style.borderRadius = "4px";
    totalDisplay.style.fontSize = "10px";
    totalDisplay.style.fontWeight = "bold";
    totalDisplay.style.fontFamily = '"Arial", sans-serif';
    totalDisplay.style.border = "1px solid #FF0000";
    totalDisplay.style.boxShadow = "0 0 5px rgba(255, 0, 0, 0.3)";
    totalDisplay.style.zIndex = "1000";
    totalDisplay.style.minWidth = "70px";
    totalDisplay.style.textAlign = "center";
    totalDisplay.style.display = "none";
    totalDisplay.textContent = "Total: 0";

    document.body.appendChild(totalDisplay);
  },

  // ======================================================
  // EMOJI PICKER
  // ======================================================

  openEmojiPicker() {
    const picker = document.getElementById("emoji-picker");
    if (picker) {
      picker.style.display = "flex";
    }
  },

  closeEmojiPicker() {
    const picker = document.getElementById("emoji-picker");
    if (picker) {
      picker.style.display = "none";
    }
  },

  selectEmoji(emoji) {
    const avatarInput = document.getElementById("avatar");
    if (avatarInput) {
      avatarInput.value = emoji;
    }
    this.closeEmojiPicker();
  },

  centerMainMenu() {
    const mainMenu = document.getElementById("main-menu");
    if (mainMenu) {
      mainMenu.style.display = "flex";
      mainMenu.style.flexDirection = "column";
      mainMenu.style.justifyContent = "center";
      mainMenu.style.alignItems = "center";
      mainMenu.style.height = "100vh";
    }
  },

  // ======================================================
  // RESET Y LIMPIEZA
  // ======================================================

  reset() {
    this.messagePositions = [];
    this.messageIdCounter = 0;

    const powerUpIndicator = document.getElementById("power-up-indicator");
    if (powerUpIndicator && powerUpIndicator.parentNode) {
      powerUpIndicator.parentNode.removeChild(powerUpIndicator);
    }

    const totalDisplay = document.getElementById("total-enemies-display");
    if (totalDisplay) {
      totalDisplay.textContent = "Total: 0";
    }

    console.log("🎨 Sistema de UI reseteado");
  },
};

// Funciones globales para HTML
window.openEmojiPicker = () => UI.openEmojiPicker();
window.closeEmojiPicker = () => UI.closeEmojiPicker();
window.selectEmoji = (emoji) => UI.selectEmoji(emoji);
window.closeInstructions = () => {
  const modal = document.getElementById("instructions-modal");
  if (modal) modal.remove();
};

// Hacer disponible globalmente
window.UI = UI;

console.log("🎨 ui.js cargado - Sistema de UI mejorado y responsivo");
