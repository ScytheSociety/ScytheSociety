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

  // En ui.js, reemplazar la función showScreenMessage por esta versión corregida:

  /**
   * Sistema de mensajes en pantalla - MÁXIMO 2 MENSAJES, NUEVOS ARRIBA
   */
  showScreenMessage(message, color = "#FFFFFF") {
    // Filtrar mensajes spam y reducir en móvil
    const spamMessages = [
      "expirando",
      "terminado",
      "renovado",
      "PODER LISTO",
      "Combo:",
      "Balas Penetrantes",
      "Balas Explosivas",
      "Disparo Amplio",
      "Disparo Rápido",
    ];

    if (spamMessages.some((spam) => message.includes(spam))) {
      return;
    }

    // En móvil, solo mostrar mensajes importantes
    if (GameConfig.isMobile) {
      const importantMessages = [
        "BOSS",
        "NIVEL",
        "VICTORIA",
        "GAME OVER",
        "VULNERABLE",
        "FASE",
      ];
      if (!importantMessages.some((important) => message.includes(important))) {
        return;
      }
    }

    const messageId = this.messageIdCounter++;

    // 🔥 NUEVO SISTEMA: Máximo 2 mensajes, mover hacia abajo
    const existingMessages = document.querySelectorAll("[data-message-id]");

    // Si ya hay 2 mensajes, eliminar el más viejo (el de abajo)
    if (existingMessages.length >= 2) {
      // Buscar el mensaje más abajo y eliminarlo
      let lowestMessage = null;
      let lowestTop = -1;

      existingMessages.forEach((msg) => {
        const top = parseInt(msg.style.top) || 0;
        if (top > lowestTop) {
          lowestTop = top;
          lowestMessage = msg;
        }
      });

      if (lowestMessage) {
        lowestMessage.remove();
      }
    }

    // Mover todos los mensajes existentes hacia abajo (20% más abajo)
    existingMessages.forEach((msg) => {
      if (msg.parentNode) {
        // Verificar que aún existe
        const currentTop = parseInt(msg.style.top.replace("%", "")) || 15;
        const newTop = currentTop + 8; // Mover 8% hacia abajo
        msg.style.top = `${newTop}%`;
        msg.style.transition = "top 0.3s ease"; // Transición suave
      }
    });

    // Crear el nuevo mensaje ARRIBA (15%)
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageElement.setAttribute("data-message-id", messageId);

    messageElement.style.cssText = `
    position: fixed;
    top: 15%;
    left: 50%;
    transform: translateX(-50%);
    color: ${color};
    font-size: ${GameConfig.isMobile ? "14px" : "16px"};
    font-weight: bold;
    font-family: var(--gothic-font), cursive;
    text-shadow: 
      -2px -2px 0 #000,
      2px -2px 0 #000,
      -2px 2px 0 #000,
      2px 2px 0 #000;
    z-index: 1500;
    max-width: 80vw;
    text-align: center;
    animation: ${
      GameConfig.isMobile ? "fadeIn" : "epicMessageAppear"
    } 0.3s ease-out;
    transition: top 0.3s ease;
  `;

    document.body.appendChild(messageElement);

    // Eliminar después de 3.5 segundos
    setTimeout(() => {
      if (messageElement.parentNode) {
        // Animación de salida
        messageElement.style.opacity = "0";
        messageElement.style.transform = "translateX(-50%) translateY(-20px)";

        setTimeout(() => {
          if (messageElement.parentNode) {
            messageElement.remove();
          }
        }, 300);
      }
    }, 3500);

    console.log(`📢 Mensaje mostrado: "${message}" (ID: ${messageId})`);
  },

  // ======================================================
  // ACTUALIZACIÓN DE ELEMENTOS UI
  // ======================================================

  /**
   * Actualiza la información del juego - NUEVO LAYOUT
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

    // 🔥 NUEVO: Actualizar elementos con nuevo formato
    const levelElement = document.getElementById("level");
    if (levelElement) {
      if (level <= 10) {
        const enemiesKilled = EnemyManager.getEnemiesKilled();
        const enemiesRequired = EnemyManager.getEnemiesRequired();
        levelElement.textContent = `NIVEL ${level}: ${enemiesKilled}/${enemiesRequired}`;
      } else {
        levelElement.textContent = `BOSS FINAL`;
      }
    }

    const scoreElement = document.getElementById("score");
    if (scoreElement) {
      scoreElement.innerHTML = `🎮 ${score}`;
    }

    const timeElement = document.getElementById("time");
    if (timeElement && gameTime % 60 === 0) {
      timeElement.innerHTML = `⏰ ${Math.floor(gameTime / 60)}s`;
    }

    // Actualizar contador total
    const totalDisplay = document.getElementById("total-enemies-display");
    if (totalDisplay && window.getTotalEnemiesKilled) {
      totalDisplay.innerHTML = `👾 ${window.getTotalEnemiesKilled()}`;
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
              <div>❤️ <strong>Vidas:</strong> 7 inicial (máx. 9)</div>
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
   * REEMPLAZA LA FUNCIÓN createParticleEffect() en ui.js
   * Crea efecto de partículas - SIN PARTÍCULAS EN MÓVIL
   */
  createParticleEffect(x, y, color, particleCount) {
    // Reducir partículas drasticamente para evitar lag
    const maxParticles = GameConfig.isMobile ? 5 : Math.min(particleCount, 15);

    // Salir si es móvil y hay muchas partículas ya
    if (
      GameConfig.isMobile &&
      document.querySelectorAll("[data-particle]").length > 3
    ) {
      return;
    }

    const particles = [];

    for (let i = 0; i < maxParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2; // Reducido

      particles.push({
        x: x,
        y: y,
        size: GameConfig.isMobile ? 1 + Math.random() : 2 + Math.random() * 2,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        life: GameConfig.isMobile ? 15 : 25, // Vida más corta
        maxLife: GameConfig.isMobile ? 15 : 25,
      });
    }

    const animateParticles = () => {
      if (particles.length === 0) return;

      const canvas = window.getCanvas();
      const ctx = window.getContext();
      if (!ctx) return;

      // Usar requestAnimationFrame con throttling en móvil
      const now = Date.now();
      if (GameConfig.isMobile && now - (this.lastParticleUpdate || 0) < 33) {
        requestAnimationFrame(animateParticles);
        return;
      }
      this.lastParticleUpdate = now;

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
    this.createParticleEffect(x, y, "#FF8800", 40); // 🔥 Más partículas: era 30, ahora 40

    const canvas = window.getCanvas();
    const ctx = window.getContext();
    if (!ctx) return;

    let radius = 5;
    const maxRadius = 200; // 🔥 AUMENTADO: Era 120, ahora 200 (67% más grande)
    let life = 25; // 🔥 AUMENTADO: Era 20, ahora 25 (más duración)

    const animateShockwave = () => {
      if (life <= 0) return;

      radius += (maxRadius - radius) * 0.2;
      life--;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "#FF8800";
      ctx.globalAlpha = life / 25; // Ajustar a nueva duración
      ctx.lineWidth = 4; // 🔥 AUMENTADO: Era 3, ahora 4 (línea más gruesa)
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
   * Muestra transición de nivel RESPONSIVA
   */
  showLevelTransition(level, callback) {
    console.log("🔄 Mostrando transición responsiva para:", level);

    const transitionDiv = document.createElement("div");
    transitionDiv.id = "level-transition";

    // Determinar el texto a mostrar
    let displayText;
    if (typeof level === "string" && level.includes("BOSS")) {
      displayText = "👹 BOSS FINAL 👹";
    } else {
      displayText = `Nivel ${level}`;
    }

    // 🔥 ESTILOS SIN FONDO - SOLO TEXTO CON TRAZO NEGRO
    transitionDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      text-align: center;
      color: #ff0000;
      font-family: 'Creepster', cursive;
      text-shadow: 
        -3px -3px 0 #000,
        3px -3px 0 #000,
        -3px 3px 0 #000,
        3px 3px 0 #000,
        0 0 10px #ff0000,
        0 0 20px #ff0000;
      animation: terrorLevelAppear 2s ease-out;
      
      font-size: clamp(2rem, 8vw, 4rem);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 95vw;
      line-height: 1.1;
      padding: 0;
      margin: 0;
      background: transparent;
      border: none;
      box-shadow: none;
      backdrop-filter: none;
    ">
      ${displayText}
    </div>
  `;

    document.body.appendChild(transitionDiv);

    // Auto-remover y ejecutar callback
    setTimeout(() => {
      if (transitionDiv.parentNode) {
        transitionDiv.parentNode.removeChild(transitionDiv);
      }
      if (callback) callback();
    }, 2000);
  },

  /**
   * 🔥 CORREGIDO: Muestra pantalla de game over/victoria SOLO con combo máximo
   */
  showGameOver(isVictory, finalScore, finalLevel, maxCombo = 0) {
    const gameOverScreen = document.getElementById("game-over");

    if (gameOverScreen) {
      // Variable para rastrear si ya se guardó
      let alreadySaved = false;
      let giftCode = "";

      gameOverScreen.innerHTML = `
      <div style="
        background: transparent;
        border: none;
        padding: 0;
        text-align: center;
        box-shadow: none;
        backdrop-filter: none;
        max-width: none;
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 25px;
      ">
        <!-- Título -->
        <h1 style="
          font-size: 4em;
          margin: 0;
          color: ${isVictory ? "#FFD700" : "#FF0000"};
          font-family: var(--gothic-font), cursive;
          font-weight: bold;
          letter-spacing: 3px;
          text-shadow: 
            -3px -3px 0 #000,
            3px -3px 0 #000,
            -3px 3px 0 #000,
            3px 3px 0 #000,
            0 0 20px ${isVictory ? "#FFD700" : "#FF0000"},
            0 0 40px ${isVictory ? "#FFD700" : "#FF0000"},
            0 0 60px ${isVictory ? "#FFD700" : "#FF0000"};
          animation: ${
            isVictory ? "victoryGlow" : "gameOverPulse"
          } 2s ease-in-out infinite alternate;
        ">
          ${isVictory ? "VICTORIA" : "GAME OVER"}
        </h1>

        <!-- Combo máximo -->
        ${
          maxCombo > 0
            ? `
          <div style="
            color: #FF6B00;
            font-size: 1.8em;
            font-family: var(--professional-font);
            font-weight: bold;
            text-shadow: 
              -2px -2px 0 #000,
              2px -2px 0 #000,
              -2px 2px 0 #000,
              2px 2px 0 #000,
              0 0 10px #FF6B00;
            text-align: center;
            line-height: 1.6;
            margin: 20px 0;
          ">
            ⚡ Combo Máximo: ${maxCombo} ⚡
          </div>
        `
            : ""
        }

        <!-- 🎁 BOTÓN DE REGALO ESPECIAL (solo si ganó) -->
        ${
          isVictory
            ? `
          <div id="gift-section" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
          ">
            <button 
              id="gift-button" 
              onclick="showGiftInput()"
              style="
                background: linear-gradient(135deg, #FFD700, #FFA500);
                color: #000;
                border: 2px solid #FFD700;
                border-radius: 8px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
              "
              onmouseover="this.style.transform='scale(1.05)'"
              onmouseout="this.style.transform='scale(1)'"
            >
              🎁 Código Especial
            </button>
            
            <div id="gift-input-area" style="display: none; flex-direction: column; align-items: center; gap: 8px;">
              <input 
                type="text" 
                id="gift-code-input" 
                placeholder="Código (10-30 números)"
                maxlength="30"
                style="
                  padding: 8px 12px;
                  border: 2px solid #FFD700;
                  border-radius: 6px;
                  background: rgba(0,0,0,0.8);
                  color: #FFD700;
                  text-align: center;
                  font-family: monospace;
                  font-size: 14px;
                  width: 200px;
                "
              />
              <div style="display: flex; gap: 8px;">
                <button onclick="confirmGiftCode()" style="
                  background: #00FF00;
                  color: #000;
                  border: none;
                  padding: 4px 12px;
                  border-radius: 4px;
                  font-size: 12px;
                  cursor: pointer;
                ">✓ OK</button>
                <button onclick="cancelGiftCode()" style="
                  background: #FF0000;
                  color: #FFF;
                  border: none;
                  padding: 4px 12px;
                  border-radius: 4px;
                  font-size: 12px;
                  cursor: pointer;
                ">✗ Cancelar</button>
              </div>
              <div style="font-size: 10px; color: #AAA; text-align: center;">
                Solo números • Entre 10 y 30 dígitos
              </div>
            </div>
          </div>
        `
            : ""
        }

        <!-- Botones principales -->
        <div style="
          display: flex;
          gap: 15px;
          justify-content: center;
          align-items: center;
          margin-top: 10px;
        ">
          <button 
            onclick="restartGame()" 
            class="small-game-button"
            title="Jugar de Nuevo"
          >
            🔄
          </button>

          <button 
            id="save-ranking-btn"
            onclick="saveAndViewRankingWithGift()" 
            class="small-game-button"
            title="Guardar Ranking"
          >
            💾
          </button>

          <button 
            onclick="backToMenu()" 
            class="small-game-button"
            title="Menú Principal"
          >
            🏠
          </button>
        </div>
      </div>
    `;

      // 🎁 FUNCIONES PARA EL SISTEMA DE REGALO
      window.showGiftInput = () => {
        document.getElementById("gift-input-area").style.display = "flex";
        document.getElementById("gift-button").style.display = "none";
      };

      window.cancelGiftCode = () => {
        document.getElementById("gift-input-area").style.display = "none";
        document.getElementById("gift-button").style.display = "block";
        document.getElementById("gift-code-input").value = "";
      };

      window.confirmGiftCode = () => {
        const input = document.getElementById("gift-code-input");
        const code = input.value.trim();

        if (!window.isValidGiftCode(code)) {
          alert(
            "❌ Código inválido!\n\n• Solo números (0-9)\n• Entre 10 y 30 dígitos\n• Ejemplo válido: 302285499710701571"
          );
          return;
        }

        giftCode = code;

        // Ocultar sección de regalo y mostrar confirmación
        document.getElementById("gift-section").innerHTML = `
        <div style="
          background: rgba(0,255,0,0.2);
          border: 1px solid #00FF00;
          border-radius: 8px;
          padding: 8px 16px;
          color: #00FF00;
          font-size: 12px;
          text-align: center;
        ">
          🎁 Código: ${code} ✓
        </div>
      `;

        console.log("🎁 Código de regalo configurado:", code);
      };

      window.saveAndViewRankingWithGift = async () => {
        if (alreadySaved) {
          alert("⚠️ La puntuación ya fue guardada.");
          viewRanking();
          document.getElementById("game-over").style.display = "none";
          return;
        }

        const saveButton = document.getElementById("save-ranking-btn");
        if (saveButton) {
          saveButton.disabled = true;
          saveButton.textContent = "⏳";
        }

        try {
          // Usar la función saveScore con el código de regalo
          const saveResult = await window.saveScore(giftCode);

          if (saveResult) {
            alreadySaved = true;
            if (saveButton) {
              saveButton.textContent = "✅";
              saveButton.onclick = () => {
                viewRanking();
                document.getElementById("game-over").style.display = "none";
              };
            }
          }

          viewRanking();
          document.getElementById("game-over").style.display = "none";

          if (typeof UI !== "undefined" && UI.removeMusicTicker) {
            UI.removeMusicTicker();
          }
        } catch (error) {
          console.error("Error al guardar:", error);
          alert("❌ Error al guardar. Inténtalo de nuevo.");

          if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "💾";
          }
        }
      };

      gameOverScreen.style.display = "block";
    }
  },

  // ======================================================
  // CONTROLES DE VOLUMEN Y MÚSICA
  // ======================================================

  /**
   * Crea control de volumen con teclas + y -
   */
  createVolumeControl() {
    const volumeButton = document.createElement("button");
    volumeButton.id = "volume-control";
    volumeButton.style.position = "fixed";
    volumeButton.style.top = "65px";
    volumeButton.style.right = "25px"; // CAMBIADO: más a la derecha
    volumeButton.style.width = "52px";
    volumeButton.style.height = "52px";
    volumeButton.style.minWidth = "52px";
    volumeButton.style.minHeight = "52px";
    volumeButton.style.maxWidth = "52px";
    volumeButton.style.maxHeight = "52px";
    volumeButton.style.borderRadius = "50%";
    volumeButton.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    volumeButton.style.border = "2px solid #8B0000";
    volumeButton.style.color = "#FFFFFF";
    volumeButton.style.fontSize = "18px";
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

    const changeVolume = () => {
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
    };

    volumeButton.addEventListener("click", changeVolume);

    // 🔥 NUEVO: Controles de teclado con + y - del numpad
    const handleKeyPress = (e) => {
      if (e.code === "NumpadAdd" || e.key === "+") {
        // Subir volumen
        if (currentStateIndex > 0) {
          currentStateIndex--;
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
        }
        e.preventDefault();
      } else if (e.code === "NumpadSubtract" || e.key === "-") {
        // Bajar volumen
        if (currentStateIndex < volumeStates.length - 1) {
          currentStateIndex++;
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
        }
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    document.body.appendChild(volumeButton);

    console.log("🔊 Control de volumen creado con teclas + y - del numpad");
  },

  /**
   * Crea el ticker de música SOLO para pantalla de juego
   */
  createMusicTicker() {
    // Verificar que estamos en pantalla de juego
    const gameArea = document.getElementById("game-area");
    if (!gameArea || gameArea.style.display === "none") {
      console.log("🎵 No crear ticker - no estamos en juego");
      return;
    }

    // Eliminar ticker existente si hay uno
    const existingTicker = document.getElementById("music-ticker");
    if (existingTicker) {
      existingTicker.remove();
    }

    const musicTicker = document.createElement("div");
    musicTicker.id = "music-ticker";
    musicTicker.style.cssText = `
    position: fixed;
    top: 55px;
    left: 0;
    width: 100vw;
    height: 20px;
    background: transparent;
    border: none;
    border-radius: 0;
    overflow: hidden;
    z-index: 999;
    display: flex;
    align-items: center;
    box-shadow: none;
    pointer-events: none;
  `;

    const tickerText = document.createElement("div");
    tickerText.id = "ticker-text";
    tickerText.style.cssText = `
    white-space: nowrap;
    color: #FFD700;
    font-size: 14px;
    font-weight: bold;
    font-family: var(--professional-font);
    animation: tickerScrollFull 20s linear infinite;
    transform: translateX(100%);
    text-shadow: 
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000,
      0 0 5px rgba(0, 0, 0, 0.8),
      0 0 10px #FFD700;
    letter-spacing: 1px;
    background: transparent;
    padding: 0;
    margin: 0;
  `;

    tickerText.textContent = `🎵 ${
      window.currentMusicTrack || "Elegía - Azkal"
    } 🎵`;
    musicTicker.appendChild(tickerText);
    document.body.appendChild(musicTicker);

    console.log("🎵 Ticker de música creado SOLO para juego");
  },

  /**
   * Actualiza el texto del ticker de música Y del botón del menú
   */
  updateMusicTicker(trackName) {
    // Actualizar ticker del juego si existe
    const tickerText = document.getElementById("ticker-text");
    if (tickerText) {
      tickerText.textContent = `🎵 ${trackName} 🎵`;
    }

    // 🔥 NUEVO: Actualizar display del botón en menú principal
    const currentTrackMenu = document.getElementById("current-track-menu");
    if (currentTrackMenu) {
      currentTrackMenu.textContent = trackName;
    }

    console.log(`🎵 Ticker y menú actualizados: ${trackName}`);
  },

  /**
   * 🔥 NUEVO: Elimina el ticker cuando se sale del juego
   */
  removeMusicTicker() {
    const ticker = document.getElementById("music-ticker");
    if (ticker) {
      ticker.remove();
      console.log("🎵 Ticker de música eliminado");
    }
  },

  /**
   * Crea el display del contador total sin marcos
   */
  createTotalEnemiesDisplay() {
    const totalDisplay = document.createElement("div");
    totalDisplay.id = "total-enemies-display";
    totalDisplay.style.cssText = `
    position: fixed;
    bottom: 25px;
    left: 15px;
    background: transparent;
    color: #FFFFFF;
    padding: 0;
    border: none;
    font-size: 14px;
    font-weight: bold;
    font-family: var(--professional-font);
    border-radius: 0;
    box-shadow: none;
    z-index: 1000;
    text-align: left;
    display: none;
    text-shadow: 
      -2px -2px 0 #000,
      2px -2px 0 #000,
      -2px 2px 0 #000,
      2px 2px 0 #000,
      0 0 5px rgba(0, 0, 0, 0.8);
    letter-spacing: 1px;
  `;

    totalDisplay.innerHTML = "👾 0";
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
