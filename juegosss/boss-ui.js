/**
 * Hell Shooter - Boss UI System Optimizado
 * Sistema modular de interfaz y efectos visuales del boss
 */

const BossUI = {
  // ======================================================
  // ESTADO DEL SISTEMA DE UI
  // ======================================================

  bossManager: null,

  // Sistema de partículas
  particles: [],
  maxParticles: 200,

  // Sistema de mensajes
  screenMessages: [],
  maxMessages: 5,

  // Configuración de efectos
  particleConfig: {
    gravity: 0.1,
    friction: 0.98,
    fadeSpeed: 0.02,
    maxLife: 120,
    minSize: 2,
    maxSize: 8,
  },

  messageConfig: {
    duration: 3000,
    fadeTime: 500,
    maxWidth: "80vw",
    fontSize: {
      normal: "clamp(1.2rem, 4vw, 1.8rem)",
      large: "clamp(1.8rem, 6vw, 2.5rem)",
      huge: "clamp(2.5rem, 8vw, 4rem)",
    },
  },

  // Configuración de barra de vida
  healthBarConfig: {
    height: 12,
    offsetY: 35,
    showNumbers: true,
    showPhase: true,
  },

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.particles = [];
    this.screenMessages = [];
    this.addAnimationStyles();
    console.log("🎨 Sistema de UI del boss inicializado");
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  update() {
    if (!this.bossManager.active) return;

    this.updateParticles();
    this.updateScreenMessages();
  },

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Actualizar posición
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;

      // Aplicar gravedad y fricción
      particle.velocityY += this.particleConfig.gravity;
      particle.velocityX *= this.particleConfig.friction;
      particle.velocityY *= this.particleConfig.friction;

      // Actualizar vida y alpha
      particle.life--;
      particle.alpha -= this.particleConfig.fadeSpeed;

      // Actualizar tamaño
      if (particle.sizeChange) {
        particle.size += particle.sizeChange;
        particle.size = Math.max(0, particle.size);
      }

      // Eliminar partículas muertas
      if (particle.life <= 0 || particle.alpha <= 0 || particle.size <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  updateScreenMessages() {
    const currentTime = Date.now();

    for (let i = this.screenMessages.length - 1; i >= 0; i--) {
      const message = this.screenMessages[i];
      const elapsed = currentTime - message.startTime;

      // Verificar si debe empezar a desvanecer
      if (elapsed > message.duration - this.messageConfig.fadeTime) {
        const fadeProgress =
          (elapsed - (message.duration - this.messageConfig.fadeTime)) /
          this.messageConfig.fadeTime;
        message.element.style.opacity = Math.max(0, 1 - fadeProgress);
      }

      // Eliminar mensaje expirado
      if (elapsed > message.duration) {
        if (message.element.parentNode) {
          message.element.parentNode.removeChild(message.element);
        }
        this.screenMessages.splice(i, 1);
      }
    }
  },

  // ======================================================
  // SISTEMA DE PARTÍCULAS
  // ======================================================

  createParticleEffect(x, y, color, count = 10, type = "burst") {
    if (this.particles.length + count > this.maxParticles) {
      this.particles.splice(0, count);
    }

    switch (type) {
      case "burst":
        this.createBurstEffect(x, y, color, count);
        break;
      case "explosion":
        this.createExplosionEffect(x, y, color, count);
        break;
      case "sparkle":
        this.createSparkleEffect(x, y, color, count);
        break;
      case "trail":
        this.createTrailEffect(x, y, color, count);
        break;
      case "glow":
        this.createGlowEffect(x, y, color, count);
        break;
      default:
        this.createBurstEffect(x, y, color, count);
    }
  },

  createBurstEffect(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;

      this.particles.push({
        x: x,
        y: y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size:
          this.particleConfig.minSize +
          Math.random() *
            (this.particleConfig.maxSize - this.particleConfig.minSize),
        color: color,
        alpha: 0.8 + Math.random() * 0.2,
        life: this.particleConfig.maxLife + Math.random() * 30,
        type: "circle",
        sizeChange: -0.05,
      });
    }
  },

  createExplosionEffect(x, y, color, count) {
    // Onda principal
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;

      this.particles.push({
        x: x,
        y: y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size: 3 + Math.random() * 6,
        color: color,
        alpha: 1.0,
        life: 60 + Math.random() * 60,
        type: "square",
        sizeChange: -0.08,
      });
    }

    // Chispas adicionales
    for (let i = 0; i < count / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;

      this.particles.push({
        x: x,
        y: y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size: 1 + Math.random() * 3,
        color: "#FFFF00",
        alpha: 0.9,
        life: 90 + Math.random() * 30,
        type: "star",
        sizeChange: 0,
      });
    }
  },

  createSparkleEffect(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 40;

      this.particles.push({
        x: x + offsetX,
        y: y + offsetY,
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: (Math.random() - 0.5) * 2,
        size: 2 + Math.random() * 4,
        color: color,
        alpha: 0.7 + Math.random() * 0.3,
        life: 30 + Math.random() * 60,
        type: "star",
        sizeChange: 0.1,
      });
    }
  },

  createTrailEffect(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        velocityX: (Math.random() - 0.5) * 1,
        velocityY: (Math.random() - 0.5) * 1,
        size: 1 + Math.random() * 3,
        color: color,
        alpha: 0.5 + Math.random() * 0.3,
        life: 20 + Math.random() * 20,
        type: "circle",
        sizeChange: -0.02,
      });
    }
  },

  createGlowEffect(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        velocityX: 0,
        velocityY: 0,
        size: 5 + Math.random() * 10,
        color: color,
        alpha: 0.3 + Math.random() * 0.2,
        life: 40 + Math.random() * 40,
        type: "glow",
        sizeChange: 0.2,
      });
    }
  },

  // ======================================================
  // SISTEMA DE MENSAJES
  // ======================================================

  showScreenMessage(
    text,
    color = "#FFFFFF",
    duration = null,
    size = "normal",
    position = "center"
  ) {
    // Usar el sistema principal de mensajes si existe
    if (window.UI && window.UI.showScreenMessage) {
      window.UI.showScreenMessage(text, color);
      return;
    }

    // Fallback solo si no existe el sistema principal
    console.log(`📢 Boss message fallback: "${text}"`);
  },

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
          0 0 20px #ff0000, 
          0 0 40px #ff0000, 
          0 0 60px #ff0000,
          3px 3px 6px rgba(0, 0, 0, 0.8);
        animation: terrorLevelAppear 2s ease-out;
        
        font-size: clamp(2rem, 8vw, 4rem);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 95vw;
        line-height: 1.1;
        
        padding: 0 10px;
        box-sizing: border-box;
      ">
        ${displayText}
      </div>
    `;

    document.body.appendChild(transitionDiv);

    setTimeout(() => {
      if (transitionDiv.parentNode) {
        transitionDiv.parentNode.removeChild(transitionDiv);
      }
      if (callback) callback();
    }, 2000);
  },

  // ======================================================
  // BARRA DE VIDA DEL BOSS
  // ======================================================

  drawHealthBar(ctx) {
    if (!this.bossManager.boss) return;

    const boss = this.bossManager.boss;
    const config = this.healthBarConfig;

    // Posición de la barra (sigue al boss)
    const barWidth = boss.width * 1.2;
    const barHeight = config.height;
    const x = boss.x + (boss.width - barWidth) / 2;
    const y = boss.y + boss.height + config.offsetY;

    // Fondo de la barra
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

    // Borde
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Barra de vida con color según porcentaje
    const healthPercentage =
      this.bossManager.currentHealth / this.bossManager.maxHealth;
    const healthWidth = barWidth * healthPercentage;

    let healthColor;
    if (healthPercentage > 0.6) {
      healthColor = "#00FF00";
    } else if (healthPercentage > 0.3) {
      healthColor = "#FFFF00";
    } else if (healthPercentage > 0.15) {
      healthColor = "#FF8800";
    } else {
      healthColor = "#FF0000";
    }

    // Dibujar barra de vida
    ctx.fillStyle = healthColor;
    ctx.fillRect(x, y, healthWidth, barHeight);

    // Efecto de pulsación en vida baja
    if (healthPercentage < 0.3) {
      const pulseAlpha = 0.3 + Math.sin(window.getGameTime() * 0.2) * 0.3;
      ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
      ctx.fillRect(x, y, healthWidth, barHeight);
    }

    // Segmentos divisorios
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const segmentX = x + (barWidth / 4) * i;
      ctx.beginPath();
      ctx.moveTo(segmentX, y);
      ctx.lineTo(segmentX, y + barHeight);
      ctx.stroke();
    }

    // Texto de vida si está habilitado
    if (config.showNumbers) {
      this.drawHealthText(ctx, boss, y, barHeight);
    }

    // Indicador de fase si está habilitado
    if (config.showPhase) {
      this.drawPhaseIndicator(ctx, boss, y);
    }

    // Indicador de inmunidad
    if (this.bossManager.isImmune) {
      this.drawImmunityIndicator(ctx, x, y, barWidth, barHeight);
    }
  },

  drawHealthText(ctx, boss, barY, barHeight) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    const healthText = `${this.bossManager.currentHealth}/${this.bossManager.maxHealth}`;
    const textX = boss.x + boss.width / 2;
    const textY = barY + barHeight + 18;

    ctx.strokeText(healthText, textX, textY);
    ctx.fillText(healthText, textX, textY);
  },

  drawPhaseIndicator(ctx, boss, barY) {
    ctx.font = "bold 8px Arial";
    ctx.fillStyle = this.bossManager.isImmune ? "#00FFFF" : "#FFD700";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    const currentPhase = this.bossManager.phases
      ? this.bossManager.phases.getCurrentPhase()
      : "UNKNOWN";
    const phaseText = this.bossManager.isImmune
      ? `INMUNE - ${currentPhase}`
      : currentPhase;

    const textX = boss.x + boss.width / 2;
    const textY = barY - 12;

    ctx.strokeText(phaseText, textX, textY);
    ctx.fillText(phaseText, textX, textY);
  },

  drawImmunityIndicator(ctx, x, y, width, height) {
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(x - 3, y - 3, width + 6, height + 6);
    ctx.setLineDash([]);
  },

  // ======================================================
  // RENDERIZADO PRINCIPAL
  // ======================================================

  draw(ctx) {
    if (!this.bossManager.active) return;

    this.drawParticles(ctx);
    this.drawHealthBar(ctx);
  },

  drawParticles(ctx) {
    for (const particle of this.particles) {
      ctx.save();

      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;

      switch (particle.type) {
        case "circle":
          this.drawCircleParticle(ctx, particle);
          break;
        case "square":
          this.drawSquareParticle(ctx, particle);
          break;
        case "star":
          this.drawStarParticle(ctx, particle);
          break;
        case "glow":
          this.drawGlowParticle(ctx, particle);
          break;
        default:
          this.drawCircleParticle(ctx, particle);
      }

      ctx.restore();
    }
  },

  drawCircleParticle(ctx, particle) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  },

  drawSquareParticle(ctx, particle) {
    ctx.fillRect(
      particle.x - particle.size / 2,
      particle.y - particle.size / 2,
      particle.size,
      particle.size
    );
  },

  drawStarParticle(ctx, particle) {
    const spikes = 5;
    const outerRadius = particle.size;
    const innerRadius = particle.size * 0.5;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = particle.x + Math.cos(angle) * radius;
      const y = particle.y + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  },

  drawGlowParticle(ctx, particle) {
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = particle.size * 2;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
    ctx.fill();
  },

  // ======================================================
  // EFECTOS ESPECIALES
  // ======================================================

  createDamageEffect() {
    const boss = this.bossManager.boss;
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    this.createParticleEffect(centerX, centerY, "#FFFF00", 15, "burst");
    this.showScreenMessage("💥", "#FFFF00", 1000, "large", "center");
  },

  createImmunityEffect() {
    const boss = this.bossManager.boss;
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    this.createParticleEffect(centerX, centerY, "#00FFFF", 10, "sparkle");
  },

  createPhaseTransitionEffect(phaseName) {
    const boss = this.bossManager.boss;
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    this.createParticleEffect(centerX, centerY, "#FF0000", 30, "explosion");

    setTimeout(() => {
      this.createParticleEffect(centerX, centerY, "#FFD700", 20, "glow");
    }, 500);
  },

  createVictoryEffect() {
    const boss = this.bossManager.boss;
    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    // Múltiples efectos de victoria
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.createParticleEffect(centerX, centerY, "#FFD700", 25, "explosion");
      }, i * 300);
    }

    // Efectos de brillo continuo
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        this.createParticleEffect(
          centerX + (Math.random() - 0.5) * 100,
          centerY + (Math.random() - 0.5) * 100,
          "#FFFFFF",
          5,
          "sparkle"
        );
      }, i * 200);
    }
  },

  // ======================================================
  // ESTILOS CSS Y ANIMACIONES
  // ======================================================

  addAnimationStyles() {
    if (document.getElementById("boss-ui-animations")) return;

    const style = document.createElement("style");
    style.id = "boss-ui-animations";
    style.textContent = `
      @keyframes terrorLevelAppear {
        0% { 
          opacity: 0; 
          transform: translate(-50%, -50%) scale(0.5) rotateZ(-10deg); 
        }
        50% { 
          opacity: 1; 
          transform: translate(-50%, -50%) scale(1.1) rotateZ(2deg); 
        }
        100% { 
          opacity: 1; 
          transform: translate(-50%, -50%) scale(1) rotateZ(0deg); 
        }
      }
      
      @keyframes flash {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
      }
      
      @keyframes pulse {
        0% { opacity: 0; }
        50% { opacity: 0.8; }
        100% { opacity: 0; }
      }
      
      @keyframes bounce {
        0% { transform: translate(-50%, -50%) scale(0.3); }
        50% { transform: translate(-50%, -50%) scale(1.05); }
        70% { transform: translate(-50%, -50%) scale(0.9); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
      
      @keyframes slideInDown {
        0% { 
          transform: translate(-50%, -150%); 
          opacity: 0; 
        }
        100% { 
          transform: translate(-50%, -50%); 
          opacity: 1; 
        }
      }
      
      @keyframes zoomIn {
        0% { 
          transform: translate(-50%, -50%) scale(0); 
          opacity: 0; 
        }
        100% { 
          transform: translate(-50%, -50%) scale(1); 
          opacity: 1; 
        }
      }
      
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      
      .yankenpo-button:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 0 15px rgba(255, 0, 0, 0.6) !important;
      }
      
      @keyframes fadeOut {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;

    document.head.appendChild(style);
  },

  // ======================================================
  // CLEANUP Y UTILIDADES
  // ======================================================

  cleanup() {
    console.log("🧹 Limpiando sistema de UI");

    this.particles = [];

    this.screenMessages.forEach((message) => {
      if (message.element.parentNode) {
        message.element.parentNode.removeChild(message.element);
      }
    });
    this.screenMessages = [];
  },

  reset() {
    this.cleanup();
    console.log("🔄 Sistema de UI reseteado");
  },

  // ======================================================
  // GETTERS Y CONFIGURACIÓN
  // ======================================================

  getParticleCount() {
    return this.particles.length;
  },
  getMessageCount() {
    return this.screenMessages.length;
  },

  configureHealthBar(config) {
    this.healthBarConfig = { ...this.healthBarConfig, ...config };
  },

  configureParticles(config) {
    this.particleConfig = { ...this.particleConfig, ...config };
  },

  configureMessages(config) {
    this.messageConfig = { ...this.messageConfig, ...config };
  },

  getStats() {
    return {
      particles: this.particles.length,
      messages: this.screenMessages.length,
      maxParticles: this.maxParticles,
      maxMessages: this.maxMessages,
      healthBarVisible: !!this.bossManager.boss,
    };
  },

  canCreateEffect() {
    return this.particles.length < this.maxParticles * 0.8;
  },

  cleanupOldParticles(count = 10) {
    if (this.particles.length > 0) {
      this.particles.splice(0, Math.min(count, this.particles.length));
    }
  },
};

window.BossUI = BossUI;

console.log("🎨 boss-ui.js optimizado cargado");
