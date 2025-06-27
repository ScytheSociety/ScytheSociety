/**
 * Hell Shooter - Boss Manager (Controlador Principal Optimizado)
 * Coordina todos los sistemas del boss y maneja el estado principal
 */

const BossManager = {
  // ======================================================
  // ESTADO PRINCIPAL DEL BOSS
  // ======================================================

  boss: null,
  active: false,

  // Estadísticas básicas
  maxHealth: GameConfig.BOSS_CONFIG.health || 500,
  currentHealth: GameConfig.BOSS_CONFIG.health || 500,

  // Sistemas modulares
  movement: null,
  phases: null,
  mines: null,
  bullets: null,
  redline: null,
  yankenpo: null,
  ui: null,
  comments: null,

  // Estado de inmunidad
  isImmune: false,
  immunityTimer: 0,
  introductionPhase: false,

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  init() {
    console.log("👹 === INICIALIZANDO BOSS MODULAR ===");

    this.loadModules();
    this.createBoss();
    this.initializeSystems();
    this.setupBoss();

    console.log("👹 Boss modular completamente inicializado");
  },

  loadModules() {
    console.log("📦 Cargando módulos del boss...");

    this.movement = window.BossMovement;
    this.phases = window.BossPhases;
    this.mines = window.BossMines;
    this.bullets = window.BossBullets;
    this.redline = window.BossRedLine;
    this.yankenpo = window.BossYanKenPo;
    this.ui = window.BossUI;
    this.comments = window.BossComments;

    console.log("✅ Todos los módulos cargados");
  },

  createBoss() {
    const canvas = window.getCanvas();
    const config = GameConfig.BOSS_CONFIG;

    // Tamaño responsivo
    const screenScale = Math.min(canvas.width, canvas.height) / 800;
    const mobileScale = GameConfig.isMobile ? 0.8 : 1.0;
    const bossSize = Math.max(80, config.size * screenScale * mobileScale);

    this.boss = {
      x: canvas.width / 2 - bossSize / 2,
      y: canvas.height / 2 - bossSize / 2,
      width: bossSize,
      height: bossSize,
      velocityX: 0,
      velocityY: 0,
      color: "#8B0000",
      glowIntensity: 0,
      moveSpeed: config.speed * (GameConfig.isMobile ? 0.8 : 1.0),
      aggressionLevel: 1.0,
      isStationary: false,
    };

    console.log(`👹 Boss creado con tamaño: ${bossSize}px`);
  },

  initializeSystems() {
    console.log("🔧 Inicializando sistemas modulares...");

    const systems = [
      { system: this.movement, name: "movimiento" },
      { system: this.phases, name: "fases" },
      { system: this.mines, name: "minas" },
      { system: this.bullets, name: "balas" },
      { system: this.redline, name: "hilo rojo" },
      { system: this.yankenpo, name: "Yan Ken Po" },
      { system: this.ui, name: "UI" },
      { system: this.comments, name: "comentarios" },
    ];

    systems.forEach(({ system, name }) => {
      if (system) {
        system.init(this);
        console.log(`✅ Sistema de ${name} inicializado`);
      }
    });
  },

  setupBoss() {
    this.active = true;
    this.currentHealth = this.maxHealth;
    this.isImmune = true;
    this.immunityTimer = GameConfig.BOSS_PHASE_CONFIG.INTRO_DURATION || 600; // 10 segundos
    this.introductionPhase = true;

    // Efectos de entrada
    if (this.ui) {
      this.ui.showScreenMessage(
        "👹 ¡EL REY DEL INFIERNO APARECE! 👹",
        "#FF0000"
      );
      this.ui.createParticleEffect(
        this.boss.x + this.boss.width / 2,
        this.boss.y + this.boss.height / 2,
        "#8B0000",
        100
      );
    }

    // Secuencia de mensajes
    if (this.comments) {
      setTimeout(
        () =>
          this.comments.sayComment(
            "¡Scythe Society será destruida para siempre!"
          ),
        1000
      );
      setTimeout(
        () =>
          this.comments.sayComment(
            "¡Vengo por la reina Hell y toda su legión!"
          ),
        4000
      );
      setTimeout(
        () =>
          this.comments.sayComment("¡Prepárense para la aniquilación total!"),
        7000
      );
    }

    if (window.AudioManager) {
      AudioManager.playSound("special");
    }

    // Comenzar movimiento después de 10 segundos
    setTimeout(() => this.endIntroductionPhase(), 10000);
  },

  endIntroductionPhase() {
    console.log("👹 Terminando fase de introducción - boss vulnerable");

    this.introductionPhase = false;
    this.isImmune = false;
    this.immunityTimer = 0;

    if (this.movement) {
      this.movement.enableFluidHunting();
    }

    if (this.comments) {
      this.comments.sayComment("¡Ahora vengan por mí si pueden!");
    }

    if (this.ui) {
      this.ui.showScreenMessage("⚔️ ¡BOSS VULNERABLE!", "#00FF00");
    }
  },

  // ======================================================
  // LOOP PRINCIPAL
  // ======================================================

  update() {
    if (!this.active || !this.boss) return;

    this.updateImmunity();
    this.updateSystems();
    this.executePhaseSequence();
    this.checkDefeat();
  },

  updateSystems() {
    const systems = [
      this.movement,
      this.phases,
      this.mines,
      this.bullets,
      this.redline,
      this.yankenpo,
      this.ui,
      this.comments,
    ];

    systems.forEach((system) => {
      if (system && system.update) {
        system.update();
      }
    });
  },

  executePhaseSequence() {
    if (!this.active || !this.boss || this.introductionPhase) return;

    // No interferir con fases activas
    if (
      this.phases?.isPhaseActive() &&
      this.phases?.getCurrentPhase() !== "HUNTING"
    ) {
      return;
    }

    // No interferir si Red Line está activo
    if (this.redline?.phaseActive) {
      return;
    }

    // No interferir con fases aleatorias
    if (this.phases?.randomPhaseActive) {
      return;
    }

    const healthPercentage = this.currentHealth / this.maxHealth;
    const thresholds = GameConfig.BOSS_PHASE_CONFIG.HEALTH_THRESHOLDS;

    // YANKENPO - 3%
    if (
      healthPercentage <= thresholds.YANKENPO &&
      !this.phases.phasesExecuted.YANKENPO
    ) {
      console.log("🎮 VIDA 3% - INICIANDO YAN KEN PO");
      this.startYanKenPoPhase();
      return;
    }

    // REDLINE - 10%
    if (
      healthPercentage <= thresholds.REDLINE &&
      healthPercentage > thresholds.YANKENPO &&
      !this.phases.phasesExecuted.REDLINE
    ) {
      console.log("🔴 VIDA 10% - INICIANDO RED LINE");
      this.startRedLinePhase();
      return;
    }

    // BULLETS - 25%
    if (
      healthPercentage <= thresholds.BULLETS &&
      healthPercentage > thresholds.REDLINE &&
      !this.phases.phasesExecuted.BULLETS
    ) {
      console.log("🌟 VIDA 25% - INICIANDO TOUHOU");
      this.startBulletsPhase();
      return;
    }

    // MINES - 50%
    if (
      healthPercentage <= thresholds.MINES &&
      healthPercentage > thresholds.BULLETS &&
      !this.phases.phasesExecuted.MINES
    ) {
      console.log("💣 VIDA 50% - INICIANDO MINAS");
      this.startMinesPhase();
      return;
    }

    // SUMMONING - 75%
    if (
      healthPercentage <= thresholds.SUMMONING &&
      healthPercentage > thresholds.MINES &&
      !this.phases.phasesExecuted.SUMMONING
    ) {
      console.log("⚔️ VIDA 75% - INICIANDO SUMMONING");
      this.startSummoningPhase();
      return;
    }
  },

  enterHuntingMode() {
    if (this.phases) {
      this.phases.currentPhase = "HUNTING";
      this.phases.phaseActive = false;
    }

    this.isImmune = false;
    this.immunityTimer = 0;

    if (this.movement) {
      this.movement.enableFluidHunting();
    }

    if (this.ui) {
      this.ui.showScreenMessage("🏃 Boss cazando...", "#FFFF00");
    }
  },

  // ======================================================
  // INICIO DE FASES
  // ======================================================

  startSummoningPhase() {
    console.log("⚔️ INICIANDO FASE: Invocación de enemigos");

    this.makeImmune(GameConfig.BOSS_PHASE_CONFIG.SUMMONING_DURATION);

    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    if (this.phases) {
      this.phases.changePhase("SUMMONING");
    }
  },

  startMinesPhase() {
    console.log("💣 INICIANDO FASE: Minas explosivas");

    this.makeImmune(GameConfig.BOSS_PHASE_CONFIG.MINES_DURATION);

    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    if (this.phases) {
      this.phases.changePhase("MINES");
    }
  },

  startBulletsPhase() {
    console.log("🌟 INICIANDO FASE: Balas Touhou");

    // Limpiar minas previas si existen
    if (this.mines && this.mines.cleanup) {
      this.mines.cleanup();
    }

    this.makeImmune(GameConfig.BOSS_PHASE_CONFIG.BULLETS_DURATION);

    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    if (this.phases) {
      this.phases.changePhase("BULLETS");
    }
  },

  startRedLinePhase() {
    console.log("🔴 INICIANDO FASE: Hilo Rojo");

    this.makeImmune(9999); // Inmune indefinidamente durante Red Line

    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    if (this.phases) {
      this.phases.changePhase("REDLINE");
    }
  },

  startYanKenPoPhase() {
    console.log("🎮 INICIANDO FASE FINAL: Yan Ken Po");

    this.makeImmune(9999); // Inmune indefinidamente durante Yan Ken Po

    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    if (this.phases) {
      this.phases.changePhase("YANKENPO");
    }
  },

  // ======================================================
  // SISTEMA DE INMUNIDAD
  // ======================================================

  makeImmune(duration) {
    this.isImmune = true;
    this.immunityTimer = duration;

    if (this.ui) {
      this.ui.showScreenMessage("🛡️ BOSS INMUNE 🛡️", "#00FFFF");
    }

    console.log(`🛡️ Boss inmune por ${duration} frames`);
  },

  updateImmunity() {
    if (this.isImmune && this.immunityTimer > 0) {
      this.immunityTimer--;

      if (this.immunityTimer <= 0) {
        this.isImmune = false;

        if (this.ui) {
          this.ui.showScreenMessage("⚔️ Boss vulnerable", "#FFFF00");
        }

        console.log("⚔️ Boss ya no es inmune");
      }
    }
  },

  // ======================================================
  // SISTEMA DE DAÑO
  // ======================================================

  takeDamage(amount) {
    if (!this.active || this.currentHealth <= 0) {
      return;
    }

    // En Yan Ken Po (3% vida) SOLO puede morir por Yan Ken Po
    const healthPercentage = this.currentHealth / this.maxHealth;
    if (
      healthPercentage <=
      GameConfig.BOSS_PHASE_CONFIG.HEALTH_THRESHOLDS.YANKENPO
    ) {
      console.log("💀 Boss en fase final - SOLO puede morir por Yan Ken Po");
      return; // No recibe daño normal
    }

    // Inmune durante fases especiales
    if (this.isImmune) {
      console.log("🛡️ Boss inmune - daño bloqueado");
      return;
    }

    if (this.phases && this.phases.isInSpecialPhase()) {
      console.log("🔥 Boss en fase especial - daño bloqueado");
      return;
    }

    // Daño normal reducido
    const reducedDamage = Math.max(1, Math.floor(amount * 0.7));
    this.currentHealth = Math.max(0, this.currentHealth - reducedDamage);

    // LÍMITE MÍNIMO: No puede bajar de 3% por daño normal
    const minHealth = Math.ceil(
      this.maxHealth * GameConfig.BOSS_PHASE_CONFIG.HEALTH_THRESHOLDS.YANKENPO
    );
    if (this.currentHealth < minHealth) {
      this.currentHealth = minHealth;
      console.log(
        `🔒 Vida limitada a ${minHealth} - solo Yan Ken Po puede matarlo`
      );
    }

    const newHealthPercentage = this.currentHealth / this.maxHealth;
    this.boss.aggressionLevel = 1.0 + (1.0 - newHealthPercentage) * 0.8;

    if (this.ui) {
      this.ui.createParticleEffect(
        this.boss.x + this.boss.width / 2,
        this.boss.y + this.boss.height / 2,
        "#FFFF00",
        8
      );
    }

    if (window.AudioManager) {
      AudioManager.playSound("hit");
    }

    console.log(
      `👹 Boss recibió ${reducedDamage} daño. Vida: ${this.currentHealth}/${this.maxHealth}`
    );

    this.onDamageReceived(newHealthPercentage);

    // Iniciar Yan Ken Po si alcanza vida mínima
    if (
      this.currentHealth <= minHealth &&
      !this.phases.phasesExecuted.YANKENPO
    ) {
      console.log("🎮 Forzando inicio de Yan Ken Po - vida mínima alcanzada");
      setTimeout(() => this.startYanKenPoPhase(), 1000);
    }
  },

  // En boss.js
  takeDamageFromYanKenPo(amount) {
    console.log(`💥 Boss recibe ${amount} daño de Yan Ken Po`);

    // Asegurar que el daño se aplica correctamente
    const previousHealth = this.currentHealth;
    this.currentHealth = Math.max(0, this.currentHealth - amount);

    // Efecto visual más dramático para Yan Ken Po
    if (this.ui) {
      this.ui.createParticleEffect(
        this.boss.x + this.boss.width / 2,
        this.boss.y + this.boss.height / 2,
        "#00FF00",
        30
      );

      // Mostrar el daño exacto
      this.ui.showScreenMessage(`💥 ¡-${amount} HP AL BOSS!`, "#00FF00");
    }

    console.log(
      `👹 Boss dañado por Yan Ken Po - Vida: ${previousHealth} → ${this.currentHealth}/${this.maxHealth}`
    );

    // Verificar si el boss ha sido derrotado
    if (this.currentHealth <= 0) {
      console.log("💀 El boss ha sido derrotado por Yan Ken Po");
      return true;
    }

    return false;
  },

  onDamageReceived(healthPercentage) {
    const systems = [this.phases, this.movement, this.comments];

    systems.forEach((system) => {
      if (system && system.onDamageReceived) {
        system.onDamageReceived(healthPercentage);
      }
    });
  },

  // ======================================================
  // SISTEMA DE DERROTA
  // ======================================================

  checkDefeat() {
    if (this.currentHealth <= 0 && this.active) {
      this.defeat();
    }
  },

  defeat() {
    console.log("👹 === BOSS DERROTADO ===");

    this.active = false;
    this.currentHealth = 0;

    if (this.comments) {
      this.comments.sayRandomComment("derrota_boss");
    }

    if (this.ui) {
      this.ui.showScreenMessage("🏆 ¡BOSS DERROTADO! 🏆", "#FFD700");

      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          this.ui.createParticleEffect(
            this.boss.x + this.boss.width / 2,
            this.boss.y + this.boss.height / 2,
            "#FFD700",
            50
          );
        }, i * 200);
      }
    }

    const bonusPoints = 5000;
    if (window.setScore) {
      window.setScore(window.getScore() + bonusPoints);
    }

    if (this.ui) {
      this.ui.showScreenMessage(`+${bonusPoints} PUNTOS BONUS!`, "#FFD700");
    }

    this.cleanupSystems();

    if (window.AudioManager) {
      AudioManager.playSound("victory");
    }

    if (window.incrementTotalEnemiesKilled) {
      window.incrementTotalEnemiesKilled();
    }

    setTimeout(() => {
      if (window.victory) {
        window.victory();
      }
    }, 2000);
  },

  cleanupSystems() {
    const systems = [
      this.mines,
      this.bullets,
      this.redline,
      this.yankenpo,
      this.ui,
    ];

    systems.forEach((system) => {
      if (system && system.cleanup) {
        system.cleanup();
      }
    });

    if (window.EnemyManager) {
      EnemyManager.enemies = [];
    }
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  draw(ctx) {
    if (!this.active || !this.boss) return;

    this.drawSystems(ctx);
    this.drawBoss(ctx);

    if (this.ui) {
      this.ui.draw(ctx);
    }
  },

  drawSystems(ctx) {
    const systems = [this.redline, this.bullets, this.mines, this.yankenpo];

    systems.forEach((system) => {
      if (system && system.draw) {
        system.draw(ctx);
      }
    });
  },

  drawBoss(ctx) {
    ctx.save();

    // Efectos según estado
    if (this.isImmune) {
      ctx.shadowColor = "#00FFFF";
      ctx.shadowBlur = 25;
      ctx.globalAlpha = 0.8 + Math.sin(window.getGameTime() * 0.4) * 0.2;
    } else {
      const healthPercentage = this.currentHealth / this.maxHealth;
      if (healthPercentage < 0.3) {
        ctx.shadowColor = "#FF0000";
        ctx.shadowBlur = 20 + Math.sin(window.getGameTime() * 0.3) * 10;
      } else {
        ctx.shadowColor = this.boss.color;
        ctx.shadowBlur = 15 + this.boss.glowIntensity * 10;
      }
    }

    let bossDibujado = false;

    // Dibujar usando frames animados si existen
    if (GameConfig.bossFrames && GameConfig.bossFrames.length > 0) {
      const frameIndex =
        Math.floor(window.getGameTime() / 12) % GameConfig.bossFrames.length;
      const currentFrame = GameConfig.bossFrames[frameIndex];

      if (currentFrame && currentFrame.complete) {
        ctx.drawImage(
          currentFrame,
          this.boss.x,
          this.boss.y,
          this.boss.width,
          this.boss.height
        );
        bossDibujado = true;
      }
    }

    // Dibujar usando imagen estática si no hay frames o falló el dibujo
    if (
      !bossDibujado &&
      GameConfig.bossImage &&
      GameConfig.bossImage.complete
    ) {
      ctx.drawImage(
        GameConfig.bossImage,
        this.boss.x,
        this.boss.y,
        this.boss.width,
        this.boss.height
      );
      bossDibujado = true;
    }

    // Fallback visual si no hay imágenes
    if (!bossDibujado) {
      this.drawBossFallback(ctx);
    }

    ctx.restore();
  },

  drawBossFallback(ctx) {
    // Cuerpo principal
    ctx.fillStyle = "#8B0000";
    ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);

    // Bordes
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.strokeRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);

    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.boss.x + 3,
      this.boss.y + 3,
      this.boss.width - 6,
      this.boss.height - 6
    );

    // Características faciales
    const centerX = this.boss.x + this.boss.width / 2;
    const centerY = this.boss.y + this.boss.height / 2;

    // Ojos
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(centerX - 35, centerY - 35, 25, 25);
    ctx.fillRect(centerX + 10, centerY - 35, 25, 25);

    // Pupilas
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(centerX - 30, centerY - 30, 15, 15);
    ctx.fillRect(centerX + 15, centerY - 30, 15, 15);

    // Boca
    ctx.fillStyle = "#000000";
    ctx.fillRect(centerX - 30, centerY + 15, 60, 15);

    // Dientes
    ctx.fillStyle = "#FFFFFF";
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(centerX - 25 + i * 8, centerY + 18, 4, 8);
    }

    // Texto identificativo
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeText("BOSS", centerX, centerY - 60);
    ctx.fillText("BOSS", centerX, centerY - 60);
  },

  // ======================================================
  // RESET Y UTILIDADES
  // ======================================================

  reset() {
    console.log("🔄 RESET COMPLETO del boss modular");

    // Resetear estado principal
    this.active = false;
    this.boss = null;
    this.currentHealth = this.maxHealth;
    this.isImmune = false;
    this.immunityTimer = 0;
    this.introductionPhase = false;

    // Resetear todos los subsistemas
    const systems = [
      this.movement,
      this.phases,
      this.mines,
      this.bullets,
      this.redline,
      this.yankenpo,
      this.ui,
      this.comments,
    ];

    systems.forEach((system) => {
      if (system && system.reset) {
        system.reset();
      }
    });

    console.log("✅ Boss modular COMPLETAMENTE reseteado");
  },

  forceReset() {
    // Versión más agresiva del reset para casos críticos
    this.reset();

    // Forzar limpieza de Red Line
    if (this.redline) {
      this.redline.phaseActive = false;
      this.redline.redLineMoving = false;
      this.redline.showingPreview = false;
      this.redline.cycleCount = 0;
      this.redline.redLinePath = [];
      this.redline.gridLines = [];
    }

    // Forzar limpieza de Phases
    if (this.phases) {
      this.phases.phaseActive = false;
      this.phases.currentPhase = "HUNTING";
      this.phases.randomPhaseActive = false;
    }

    console.log("🔄 Force Reset completado en Boss Manager");
  },

  // ======================================================
  // GETTERS
  // ======================================================

  isActive() {
    return this.active;
  },
  getBoss() {
    return this.boss;
  },
  getBossHealth() {
    return this.currentHealth;
  },
  getMaxHealth() {
    return this.maxHealth;
  },
  isImmuneStatus() {
    return this.isImmune;
  },
  getCurrentPhase() {
    return this.phases ? this.phases.getCurrentPhase() : "UNKNOWN";
  },
  getMines() {
    return this.mines ? this.mines.getMines() : [];
  },

  checkCollision(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  },
};

// Hacer disponible globalmente
window.BossManager = BossManager;

console.log("👹 boss.js (controlador principal) optimizado cargado");
