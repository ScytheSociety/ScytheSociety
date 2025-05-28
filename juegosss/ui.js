/**
 * Hell Shooter - UI Management CORREGIDO
 * Sistema de interfaz más elegante y profesional
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
   * 🔥 NUEVO: Sistema de mensajes en la parte superior - SOLO 2 SLOTS
   */
  showScreenMessage(message, color = "#FFFFFF") {
    // 🚫 FILTRAR MENSAJES REPETITIVOS Y SPAM
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
      return; // No mostrar mensajes de spam
    }

    const messageId = this.messageIdCounter++;

    // 🔥 SOLO 2 POSICIONES FIJAS EN LA PARTE SUPERIOR
    const positions = [
      { y: 8 }, // Posición 1 (arriba)
      { y: 16 }, // Posición 2 (abajo)
    ];

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
    this.messagePositions.unshift(position); // Agregar al inicio

    // Crear elemento de mensaje
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageElement.setAttribute("data-message-id", messageId);
    messageElement.style.position = "fixed";
    messageElement.style.top = "8%"; // Siempre arriba
    messageElement.style.left = "50%";
    messageElement.style.transform = "translateX(-50%)";
    messageElement.style.color = color;
    messageElement.style.fontSize = "13px";
    messageElement.style.fontWeight = "bold";
    messageElement.style.textShadow = "2px 2px 4px rgba(0,0,0,0.9)";
    messageElement.style.zIndex = "1000";
    messageElement.style.backgroundColor = "rgba(0,0,0,0.8)";
    messageElement.style.padding = "4px 12px";
    messageElement.style.borderRadius = "6px";
    messageElement.style.border = `1px solid ${color}`;
    messageElement.style.maxWidth = "300px";
    messageElement.style.textAlign = "center";
    messageElement.style.fontFamily = '"Arial", sans-serif';
    messageElement.style.transition = "all 0.3s ease";

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
    // NUEVO: Actualizar información del jugador
    const playerNameElement = document.getElementById("player-name");
    const playerAvatarElement = document.getElementById("player-avatar");

    if (playerNameElement && Player.getName()) {
      playerNameElement.textContent = Player.getName();
    }

    if (playerAvatarElement && Player.getAvatar()) {
      playerAvatarElement.textContent = Player.getAvatar();
    }

    // Resto del código existente...
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

    const enemiesElement = document.getElementById("enemies-killed");
    if (enemiesElement) {
      enemiesElement.textContent = `Enemigos: ${EnemyManager.getEnemiesKilled()}`;
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
      const required = 15; // 🔥 CAMBIADO: Era 25, ahora 15
      const current = Math.floor(progress * required);
      counter.textContent = `${current}/${required}`;
    }
  },

  /**
   * Actualiza la visualización de vidas
   */
  updateLivesDisplay() {
    const livesDisplay = document.getElementById("player-lives");
    if (!livesDisplay) return;

    const lives = Player.getLives();
    let livesText = "";

    if (lives <= 7) {
      // Hasta 7 vidas: mostrar en línea horizontal
      livesText = "💀".repeat(lives);
    } else {
      // Más de 7 vidas: primera fila con 7, resto en segunda fila
      const firstRow = "💀".repeat(7);
      const secondRow = "💀".repeat(lives - 7);
      livesText = firstRow + "<br>" + secondRow;
    }

    livesDisplay.innerHTML = livesText;
  },

  /**
   * Actualiza el indicador de power-up activo
   */
  updatePowerUpIndicator() {
    const activePowerUp = Player.getActivePowerUp();

    if (activePowerUp) {
      let indicator = document.getElementById("power-up-indicator");

      if (!indicator) {
        // Crear indicador
        indicator = document.createElement("div");
        indicator.id = "power-up-indicator";
        indicator.style.position = "fixed";
        indicator.style.bottom = "20px";
        indicator.style.left = "20px";
        indicator.style.padding = "8px 15px";
        indicator.style.borderRadius = "20px";
        indicator.style.fontSize = "14px";
        indicator.style.fontWeight = "bold";
        indicator.style.transition = "all 0.3s";
        indicator.style.zIndex = "100";
        indicator.style.fontFamily = '"Arial", sans-serif';
        document.body.appendChild(indicator);
      }

      // Actualizar contenido
      const timeLeft = Math.ceil(Player.getPowerUpTimeLeft() / 60);
      indicator.textContent = `${activePowerUp.name}: ${timeLeft}s`;
      indicator.style.backgroundColor = activePowerUp.color;
      indicator.style.color = "#FFFFFF";
      indicator.style.boxShadow = `0 0 10px ${activePowerUp.color}`;

      // Parpadeo cuando está por terminar
      if (Player.getPowerUpTimeLeft() < 60) {
        indicator.style.opacity =
          Math.sin(window.getGameTime() * 0.2) * 0.5 + 0.5;
      } else {
        indicator.style.opacity = "1";
      }
    } else {
      // Eliminar indicador si no hay power-up
      const indicator = document.getElementById("power-up-indicator");
      if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }
  },

  // ======================================================
  // EFECTOS VISUALES
  // ======================================================

  /**
   * Crea efecto de partículas
   */
  createParticleEffect(x, y, color, particleCount) {
    const particles = [];

    // Crear partículas
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

    // Animar partículas
    const animateParticles = () => {
      if (particles.length === 0) return;

      const canvas = window.getCanvas();
      const ctx = window.getContext();
      if (!ctx) return;

      // Actualizar y dibujar partículas
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;

        // Dibujar partícula
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fill();
        ctx.restore();

        // Eliminar partículas muertas
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // Continuar animación
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
    // Partículas principales
    this.createParticleEffect(x, y, "#FF8800", 30);

    // Onda expansiva
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
  // PANTALLAS Y MODALES - CORREGIDO
  // ======================================================

  /**
   * Muestra las instrucciones del juego - VERSIÓN ELEGANTE Y COMPACTA
   */
  showInstructions(callback) {
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.width = "90%";
    modal.style.maxWidth = "500px";
    modal.style.maxHeight = "85vh";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.95)";
    modal.style.border = "3px solid #8B0000";
    modal.style.borderRadius = "20px";
    modal.style.padding = "25px";
    modal.style.color = "#FFFFFF";
    modal.style.zIndex = "1000";
    modal.style.fontFamily = '"Arial", sans-serif';
    modal.style.boxShadow = "0 0 40px #FF0000";
    modal.style.overflowY = "auto";
    modal.style.backdropFilter = "blur(10px)";

    modal.innerHTML = `
    <!-- Título Principal -->
    <h2 style="
      text-align: center; 
      color: #FF0000; 
      text-shadow: 0 0 20px #FF0000; 
      margin: 0 0 20px 0; 
      font-size: 1.8em;
      letter-spacing: 1px;
    ">
      🎮 HELL SHOOTER 🎮
    </h2>
    
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
        <div style="line-height: 1.4;">
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
        <div style="line-height: 1.4;">
          <div>❤️ <strong>Vidas:</strong> 7 inicial (máx. 14)</div>
          <div>🎮 <strong>Niveles:</strong> 10 épicos</div>
          <div>👹 <strong>Boss Final:</strong> Nivel 10</div>
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
        <span style="background: rgba(255,255,0,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(255,255,0,0.5);">
          🟡 Penetrantes
        </span>
        <span style="background: rgba(0,255,255,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(0,255,255,0.5);">
          🔵 Amplio (7 balas)
        </span>
        <span style="background: rgba(255,136,0,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(255,136,0,0.5);">
          🟠 Explosivas
        </span>
        <span style="background: rgba(255,0,255,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(255,0,255,0.5);">
          🟣 Súper Rápido
        </span>
        <span style="background: rgba(0,255,0,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(0,255,0,0.5);">
          🟢 Escudo Total
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
        <span style="background: rgba(0,187,255,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(0,187,255,0.5);">
          🌊 Tiempo Lento
        </span>
        <span style="background: rgba(255,100,0,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(255,100,0,0.5);">
          🔥 Modo Frenesí
        </span>
        <span style="background: rgba(255,136,0,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(255,136,0,0.5);">
          ☄️ Meteoritos
        </span>
        <span style="background: rgba(255,215,0,0.3); padding: 4px 8px; border-radius: 15px; border: 1px solid rgba(255,215,0,0.5);">
          ✨ Lluvia Items
        </span>
      </div>
    </div>
    
    <!-- Botón de Inicio Épico -->
    <div style="text-align: center; margin-top: 25px;">
      <button id="start-game-btn" style="
        background: linear-gradient(45deg, #8B0000, #FF0000, #8B0000); 
        color: white; 
        padding: 15px 30px; 
        font-size: 16px; 
        border: none; 
        border-radius: 30px; 
        cursor: pointer; 
        font-weight: bold; 
        box-shadow: 0 6px 20px rgba(255,0,0,0.4);
        transition: all 0.3s; 
        font-family: inherit;
        letter-spacing: 1px;
        position: relative;
        overflow: hidden;
      ">
        🔥 ¡COMENZAR BATALLA! 🔥
      </button>
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
  `;

    document.body.appendChild(modal);

    // Efectos del botón
    const startBtn = document.getElementById("start-game-btn");

    startBtn.addEventListener("mouseenter", () => {
      startBtn.style.transform = "scale(1.05)";
      startBtn.style.boxShadow = "0 8px 25px rgba(255,0,0,0.6)";
    });

    startBtn.addEventListener("mouseleave", () => {
      startBtn.style.transform = "scale(1)";
      startBtn.style.boxShadow = "0 6px 20px rgba(255,0,0,0.4)";
    });

    startBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
      callback();
    });
  },

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
      // Crear contenido HTML mejorado
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
        <!-- Título Principal -->
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

        <!-- Información del Juego -->
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

        <!-- Botones Elegantes -->
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
  // SISTEMA DE VOLUMEN
  // ======================================================

  /**
   * Crea control de volumen
   */
  createVolumeControl() {
    const volumeContainer = document.createElement("div");
    volumeContainer.id = "volume-control";
    volumeContainer.style.position = "fixed";
    volumeContainer.style.top = "80px";
    volumeContainer.style.right = "10px";
    volumeContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    volumeContainer.style.padding = "10px";
    volumeContainer.style.borderRadius = "10px";
    volumeContainer.style.border = "2px solid #8B0000";
    volumeContainer.style.color = "#FFFFFF";
    volumeContainer.style.fontSize = "14px";
    volumeContainer.style.zIndex = "1001";
    volumeContainer.style.display = "flex";
    volumeContainer.style.alignItems = "center";
    volumeContainer.style.gap = "10px";
    volumeContainer.style.fontFamily = '"Arial", sans-serif';

    const volumeIcon = document.createElement("span");
    volumeIcon.textContent = "🔊";
    volumeIcon.style.fontSize = "18px";

    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.min = "0";
    volumeSlider.max = "100";
    volumeSlider.value = "50";
    volumeSlider.style.width = "80px";
    volumeSlider.style.cursor = "pointer";

    const volumeText = document.createElement("span");
    volumeText.textContent = "50%";
    volumeText.style.minWidth = "35px";
    volumeText.style.textAlign = "center";

    volumeSlider.addEventListener("input", (e) => {
      const volume = parseInt(e.target.value);
      AudioManager.setMasterVolume(volume / 100);
      volumeText.textContent = `${volume}%`;

      if (volume === 0) {
        volumeIcon.textContent = "🔇";
      } else if (volume < 30) {
        volumeIcon.textContent = "🔈";
      } else if (volume < 70) {
        volumeIcon.textContent = "🔉";
      } else {
        volumeIcon.textContent = "🔊";
      }
    });

    volumeContainer.appendChild(volumeIcon);
    volumeContainer.appendChild(volumeSlider);
    volumeContainer.appendChild(volumeText);

    document.body.appendChild(volumeContainer);
  },

  // ======================================================
  // EMOJI PICKER
  // ======================================================

  /**
   * Abre el selector de emojis
   */
  openEmojiPicker() {
    const picker = document.getElementById("emoji-picker");
    if (picker) {
      picker.style.display = "flex";
    }
  },

  /**
   * Cierra el selector de emojis
   */
  closeEmojiPicker() {
    const picker = document.getElementById("emoji-picker");
    if (picker) {
      picker.style.display = "none";
    }
  },

  /**
   * Selecciona un emoji
   */
  selectEmoji(emoji) {
    const avatarInput = document.getElementById("avatar");
    if (avatarInput) {
      avatarInput.value = emoji;
    }
    this.closeEmojiPicker();
  },

  /**
   * Centra el menú principal
   */
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

  /**
   * Resetea el sistema de UI
   */
  reset() {
    // Limpiar mensajes
    this.messagePositions = [];
    this.messageIdCounter = 0;

    // Limpiar indicadores dinámicos
    const powerUpIndicator = document.getElementById("power-up-indicator");
    if (powerUpIndicator && powerUpIndicator.parentNode) {
      powerUpIndicator.parentNode.removeChild(powerUpIndicator);
    }

    console.log("🎨 Sistema de UI reseteado");
  },
};

// Hacer funciones globales para HTML
window.openEmojiPicker = () => UI.openEmojiPicker();
window.closeEmojiPicker = () => UI.closeEmojiPicker();
window.selectEmoji = (emoji) => UI.selectEmoji(emoji);

// Hacer disponible globalmente
window.UI = UI;

console.log("🎨 ui.js cargado - Sistema de UI corregido");
