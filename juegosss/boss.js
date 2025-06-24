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
  maxHealth: 2000,
  currentHealth: 2000,

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

  async init() {
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

    // 🔥 TAMAÑO RESPONSIVO DEL BOSS
    const screenScale = Math.min(canvas.width, canvas.height) / 800;
    const mobileScale = GameConfig.isMobile ? 0.8 : 1.0;
    const bossSize = Math.max(
      80,
      config.size * 1.5 * screenScale * mobileScale
    );

    this.boss = {
      x: canvas.width / 2 - bossSize / 2,
      y: canvas.height / 2 - bossSize / 2,
      width: bossSize,
      height: bossSize,
      velocityX: 0,
      velocityY: 0,
      color: "#8B0000",
      glowIntensity: 0,
      moveSpeed: config.speed * 1.5 * (GameConfig.isMobile ? 0.8 : 1.0),
      aggressionLevel: 1.0,
    };

    console.log(
      `👹 Boss creado responsivo: ${bossSize}px (${
        GameConfig.isMobile ? "MÓVIL" : "PC"
      })`
    );
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
    this.immunityTimer = 600; // 10 segundos
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

    // NO interferir con fases aleatorias del Yan Ken Po
    if (this.phases?.randomPhaseActive) {
      return;
    }

    const healthPercentage = this.currentHealth / this.maxHealth;
    const currentPhase = this.phases?.getCurrentPhase() || "HUNTING";
    const isPhaseActive = this.phases?.isPhaseActive() || false;

    // Fase final: Yan Ken Po (3% de vida)
    if (healthPercentage <= 0.03 && !this.phases.phasesExecuted.YANKENPO) {
      console.log("🎮 INICIANDO FASE FINAL: Yan Ken Po");
      this.startYanKenPoPhase();
      return;
    }

    // Fase del hilo rojo (15% de vida)
    if (
      healthPercentage <= 0.15 &&
      healthPercentage > 0.03 &&
      !this.phases.phasesExecuted.REDLINE
    ) {
      console.log("🔴 INICIANDO FASE: Hilo Rojo");
      this.startRedLinePhase();
      return;
    }

    // Fase de balas Touhou (30% de vida)
    if (
      healthPercentage <= 0.3 &&
      healthPercentage > 0.15 &&
      !this.phases.phasesExecuted.BULLETS
    ) {
      console.log("🌟 INICIANDO FASE: Balas Touhou");
      this.startBulletsPhase();
      return;
    }

    // Fase de minas (50% de vida)
    if (
      healthPercentage <= 0.5 &&
      healthPercentage > 0.3 &&
      !this.phases.phasesExecuted.MINES
    ) {
      console.log("💣 INICIANDO FASE: Minas");
      this.startMinesPhase();
      return;
    }

    // Fase de invocación (75% de vida)
    if (
      healthPercentage <= 0.75 &&
      healthPercentage > 0.5 &&
      !this.phases.phasesExecuted.SUMMONING
    ) {
      console.log("⚔️ INICIANDO FASE: Invocación");
      this.startSummoningPhase();
      return;
    }

    // Modo hunting entre fases
    if (!isPhaseActive && currentPhase !== "HUNTING") {
      this.enterHuntingMode();
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

    this.makeImmune(3600); // 60 segundos

    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    if (this.comments) {
      this.comments.sayComment("¡Legiones del abismo, vengan a mí!");
    }

    // MARCAR FASE ANTES DE CAMBIAR
    if (this.phases) {
      this.phases.currentPhase = "SUMMONING";
      this.phases.phaseActive = true;
      this.phases.phaseTimer = 0;
      this.phases.changePhase("SUMMONING");
    }

    console.log("⚔️ Fase de invocación iniciada correctamente");
  },

  startMinesPhase() {
    this.makeImmune(5400); // 90 segundos

    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    if (this.comments) {
      this.comments.sayComment("¡El suelo bajo sus pies es traicionero!");
    }

    // MARCAR FASE ANTES DE CAMBIAR
    if (this.phases) {
      this.phases.currentPhase = "MINES";
      this.phases.phaseActive = true;
      this.phases.phaseTimer = 0;
      this.phases.changePhase("MINES");
    }
  },

  startBulletsPhase() {
    this.makeImmune(7200); // 120 segundos

    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    if (this.comments) {
      this.comments.sayComment("¡Lluvia de muerte del inframundo!");
    }

    // MARCAR FASE ANTES DE CAMBIAR
    if (this.phases) {
      this.phases.currentPhase = "BULLETS";
      this.phases.phaseActive = true;
      this.phases.phaseTimer = 0;
      this.phases.changePhase("BULLETS");
    }
  },

  startRedLinePhase() {
    this.makeImmune(99999);

    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    if (this.comments) {
      this.comments.sayComment("¡Sigue mi rastro mortal!");
    }

    // MARCAR FASE ANTES DE CAMBIAR
    if (this.phases) {
      this.phases.currentPhase = "REDLINE";
      this.phases.phaseActive = true;
      this.phases.phaseTimer = 0;
      this.phases.changePhase("REDLINE");
    }
  },

  startYanKenPoPhase() {
    this.makeImmune(99999);

    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    if (this.comments) {
      this.comments.sayComment("¡Última oportunidad, mortal!");
    }

    // MARCAR FASE ANTES DE CAMBIAR
    if (this.phases) {
      this.phases.currentPhase = "YANKENPO";
      this.phases.phaseActive = true;
      this.phases.phaseTimer = 0;
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
    if (this.isImmune) {
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
    if (!this.active || this.isImmune || this.currentHealth <= 0) {
      return;
    }

    if (this.phases && this.phases.isInSpecialPhase()) {
      return;
    }

    const reducedDamage = Math.max(1, Math.floor(amount * 0.7));
    this.currentHealth = Math.max(0, this.currentHealth - reducedDamage);

    const healthPercentage = this.currentHealth / this.maxHealth;
    this.boss.aggressionLevel = 1.0 + (1.0 - healthPercentage) * 0.8;

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

    this.onDamageReceived(healthPercentage);

    if (this.currentHealth <= 0) {
      this.defeat();
    }
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
      this.comments.sayComment("derrota_boss");
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

    // Frames animados
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

    // Imagen estática
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

    // Fallback visual
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

    this.active = false;
    this.boss = null;
    this.currentHealth = this.maxHealth;
    this.isImmune = false;
    this.immunityTimer = 0;

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

    // DOUBLE CHECK: Asegurar que fases estén reseteadas
    if (this.phases && this.phases.phasesExecuted) {
      this.phases.phasesExecuted = {
        SUMMONING: false,
        MINES: false,
        BULLETS: false,
        REDLINE: false,
        YANKENPO: false,
      };
    }

    console.log(
      "✅ Boss modular completamente reseteado - Fases ejecutadas limpiadas"
    );
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
