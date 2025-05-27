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
   * Muestra un mensaje en pantalla - VERSIÓN ELEGANTE Y CONCISA
   */
  showScreenMessage(message, color = "#FFFFFF") {
    const messageId = this.messageIdCounter++;

    // 🔥 CORREGIDO: Posición más compacta y elegante
    let yPosition = 10;
    const messageHeight = 6;
    const padding = 1;

    // Verificar posiciones ocupadas
    for (let y = 10; y < 40; y += messageHeight + padding) {
      const positionTaken = this.messagePositions.some(
        (pos) => Math.abs(pos.y - y) < messageHeight + padding && pos.active
      );

      if (!positionTaken) {
        yPosition = y;
        break;
      }
    }

    // Registrar posición
    const position = {
      id: messageId,
      y: yPosition,
      active: true,
      timeCreated: Date.now(),
    };
    this.messagePositions.push(position);

    // 🔥 CORREGIDO: Diseño más elegante y profesional
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageElement.style.position = "fixed";
    messageElement.style.top = `${yPosition}%`;
    messageElement.style.left = "50%";
    messageElement.style.transform = "translateX(-50%)";
    messageElement.style.color = color;
    messageElement.style.fontSize = "16px"; // Más pequeño
    messageElement.style.fontWeight = "bold";
    messageElement.style.textShadow = "2px 2px 4px rgba(0,0,0,0.9)";
    messageElement.style.zIndex = "1000";
    messageElement.style.backgroundColor = "rgba(0,0,0,0.8)"; // Más transparente
    messageElement.style.padding = "4px 12px"; // Más compacto
    messageElement.style.borderRadius = "8px"; // Más redondeado
    messageElement.style.border = `1px solid ${color}`; // Borde más sutil
    messageElement.style.maxWidth = "300px"; // Más estrecho
    messageElement.style.textAlign = "center";
    messageElement.style.fontFamily = '"Arial", sans-serif'; // Fuente más limpia
    messageElement.style.letterSpacing = "0.5px"; // Espaciado elegante
    messageElement.style.backdropFilter = "blur(5px)"; // Efecto moderno

    document.body.appendChild(messageElement);

    // 🔥 CORREGIDO: Animación más rápida y suave
    setTimeout(() => {
      messageElement.style.transition =
        "opacity 0.8s ease-out, transform 0.8s ease-out";
      messageElement.style.opacity = "0";
      messageElement.style.transform =
        "translateX(-50%) translateY(-15px) scale(0.95)";

      // Marcar posición como libre
      const pos = this.messagePositions.find((p) => p.id === messageId);
      if (pos) pos.active = false;

      setTimeout(() => {
        if (messageElement.parentNode) {
          document.body.removeChild(messageElement);
        }
        // Limpiar posiciones viejas
        const now = Date.now();
        for (let i = this.messagePositions.length - 1; i >= 0; i--) {
          if (now - this.messagePositions[i].timeCreated > 8000) {
            this.messagePositions.splice(i, 1);
          }
        }
      }, 800);
    }, 2000); // Duración más corta
  },

  // ======================================================
  // ACTUALIZACIÓN DE ELEMENTOS UI
  // ======================================================

  /**
   * Actualiza la información del juego
   */
  updateGameInfo() {
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
      const required = 25; // ENEMIES_FOR_SPECIAL
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
   * Muestra las instrucciones del juego - VERSIÓN CORREGIDA Y ELEGANTE
   */
  showInstructions(callback) {
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.width = "80%";
    modal.style.maxWidth = "600px";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.95)";
    modal.style.border = "3px solid #8B0000";
    modal.style.borderRadius = "15px";
    modal.style.padding = "20px";
    modal.style.color = "#FFFFFF";
    modal.style.zIndex = "1000";
    modal.style.fontFamily = '"Arial", sans-serif';
    modal.style.boxShadow = "0 0 30px #FF0000";
    modal.style.maxHeight = "80vh";
    modal.style.overflowY = "auto";

    // 🔥 CORREGIDO: Instrucciones más concisas y elegantes
    modal.innerHTML = `
            <h2 style="text-align: center; color: #FF0000; text-shadow: 0 0 15px #FF0000; margin-bottom: 20px; font-size: 24px;">
                🎮 HELL SHOOTER 🎮
            </h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <h3 style="color: #FF0000; margin-bottom: 8px;">🎯 CONTROLES</h3>
                    <p style="margin: 5px 0; font-size: 14px;">• Movimiento: Ratón/Táctil</p>
                    <p style="margin: 5px 0; font-size: 14px;">• Disparo: Automático</p>
                    <p style="margin: 5px 0; font-size: 14px;">• Poder: ESPACIO / 🔥</p>
                </div>
                
                <div>
                    <h3 style="color: #FF0000; margin-bottom: 8px;">💀 SUPERVIVENCIA</h3>
                    <p style="margin: 5px 0; font-size: 14px;">• 7 vidas (máx. 14)</p>
                    <p style="margin: 5px 0; font-size: 14px;">• 10 niveles intensos</p>
                    <p style="margin: 5px 0; font-size: 14px;">• Boss final épico</p>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h3 style="color: #FF0000; margin-bottom: 8px;">⚡ POWER-UPS</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; font-size: 13px;">
                    <span style="background: rgba(255,255,0,0.2); padding: 2px 6px; border-radius: 4px;">🟡 Penetrantes</span>
                    <span style="background: rgba(0,255,255,0.2); padding: 2px 6px; border-radius: 4px;">🔵 Amplio (7 balas)</span>
                    <span style="background: rgba(255,136,0,0.2); padding: 2px 6px; border-radius: 4px;">🟠 Explosivas</span>
                    <span style="background: rgba(255,0,255,0.2); padding: 2px 6px; border-radius: 4px;">🟣 Súper Rápido</span>
                    <span style="background: rgba(0,255,0,0.2); padding: 2px 6px; border-radius: 4px;">🟢 Escudo</span>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
                <button id="start-game-btn" style="background: linear-gradient(45deg, #8B0000, #FF0000); 
                color: white; padding: 12px 24px; font-size: 16px; border: none; border-radius: 8px; 
                cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(255,0,0,0.3);
                transition: transform 0.2s; font-family: inherit;">
                    🔥 ¡COMENZAR BATALLA!
                </button>
            </div>
        `;

    document.body.appendChild(modal);

    // Efecto hover del botón
    const startBtn = document.getElementById("start-game-btn");
    startBtn.addEventListener("mouseenter", () => {
      startBtn.style.transform = "scale(1.05)";
    });
    startBtn.addEventListener("mouseleave", () => {
      startBtn.style.transform = "scale(1)";
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
   * Muestra pantalla de game over
   */
  showGameOver(isVictory, finalScore, finalLevel) {
    const gameOverScreen = document.getElementById("game-over");
    const gameOverText = document.getElementById("game-over-text");

    if (gameOverScreen && gameOverText) {
      gameOverText.textContent = isVictory ? "¡VICTORIA! 🏆" : "GAME OVER 💀";
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
