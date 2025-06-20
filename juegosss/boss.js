/**
 * Hell Shooter - Boss Manager (Controlador Principal)
 * Coordina todos los sistemas del boss y maneja el estado principal
 */

const BossManager = {
  // ======================================================
  // ESTADO PRINCIPAL DEL BOSS
  // ======================================================

  boss: null,
  active: false,

  // Estadísticas básicas
  maxHealth: 200,
  currentHealth: 200,

  // Sistemas modulares (se cargan dinámicamente)
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

  // ======================================================
  // INICIALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Inicializa el boss y todos sus sistemas modulares
   */
  async init() {
    console.log("👹 === INICIALIZANDO BOSS MODULAR ===");

    // Cargar todos los módulos
    await this.loadModules();

    // Crear el boss base
    this.createBoss();

    // Inicializar todos los sistemas
    this.initializeSystems();

    // Configurar el boss
    this.setupBoss();

    console.log("👹 Boss modular completamente inicializado");
  },

  /**
   * Cargar todos los módulos del boss
   */
  async loadModules() {
    console.log("📦 Cargando módulos del boss...");

    try {
      // Los módulos se asignan automáticamente cuando se cargan
      this.movement = window.BossMovement;
      this.phases = window.BossPhases;
      this.mines = window.BossMines;
      this.bullets = window.BossBullets;
      this.redline = window.BossRedLine;
      this.yankenpo = window.BossYanKenPo;
      this.ui = window.BossUI;
      this.comments = window.BossComments;

      console.log("✅ Todos los módulos cargados correctamente");
    } catch (error) {
      console.error("❌ Error cargando módulos:", error);
    }
  },

  /**
   * Crear la entidad boss básica
   */
  createBoss() {
    const canvas = window.getCanvas();
    const config = GameConfig.BOSS_CONFIG;

    this.boss = {
      x: canvas.width / 2 - (config.size * 1.5) / 2,
      y: canvas.height / 2 - (config.size * 1.5) / 2,
      width: config.size * 1.5,
      height: config.size * 1.5,
      velocityX: 0,
      velocityY: 0,

      // Propiedades visuales
      color: "#8B0000",
      glowIntensity: 0,

      // Propiedades de comportamiento
      moveSpeed: config.speed * 1.5,
      aggressionLevel: 1.0,
    };

    console.log("👹 Entidad boss creada");
  },

  /**
   * Inicializar todos los sistemas modulares
   */
  initializeSystems() {
    console.log("🔧 Inicializando sistemas modulares...");

    // Pasar referencia del boss a todos los módulos
    const bossRef = this;

    if (this.movement) {
      this.movement.init(bossRef);
      console.log("✅ Sistema de movimiento inicializado");
    }

    if (this.phases) {
      this.phases.init(bossRef);
      console.log("✅ Sistema de fases inicializado");
    }

    if (this.mines) {
      this.mines.init(bossRef);
      console.log("✅ Sistema de minas inicializado");
    }

    if (this.bullets) {
      this.bullets.init(bossRef);
      console.log("✅ Sistema de balas inicializado");
    }

    if (this.redline) {
      this.redline.init(bossRef);
      console.log("✅ Sistema de hilo rojo inicializado");
    }

    if (this.yankenpo) {
      this.yankenpo.init(bossRef);
      console.log("✅ Sistema Yan Ken Po inicializado");
    }

    if (this.ui) {
      this.ui.init(bossRef);
      console.log("✅ Sistema de UI inicializado");
    }

    if (this.comments) {
      this.comments.init(bossRef);
      console.log("✅ Sistema de comentarios inicializado");
    }
  },

  /**
   * Configurar el boss después de inicializar sistemas
   */
  setupBoss() {
    this.active = true;
    this.currentHealth = this.maxHealth;

    // 🔥 FASE DE INTRODUCCIÓN: 10 SEGUNDOS INMUNE EN EL CENTRO
    this.isImmune = true;
    this.immunityTimer = 600; // 10 segundos a 60fps
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

    // 🔥 SECUENCIA DE MENSAJES DE INTRODUCCIÓN
    if (this.comments) {
      setTimeout(() => {
        this.comments.sayComment(
          "¡Scythe Society será destruida para siempre!"
        );
      }, 1000);

      setTimeout(() => {
        this.comments.sayComment("¡Vengo por la reina Hell y toda su legión!");
      }, 4000);

      setTimeout(() => {
        this.comments.sayComment("¡Prepárense para la aniquilación total!");
      }, 7000);
    }

    // Audio
    if (window.AudioManager) {
      AudioManager.playSound("special");
    }

    // 🔥 COMENZAR MOVIMIENTO DESPUÉS DE 10 SEGUNDOS
    setTimeout(() => {
      this.endIntroductionPhase();
    }, 10000);
  },

  /**
   * 🔥 NUEVA: Termina la fase de introducción
   */
  endIntroductionPhase() {
    console.log("👹 Terminando fase de introducción - boss vulnerable");

    this.introductionPhase = false;
    this.isImmune = false;
    this.immunityTimer = 0;

    // Comenzar movimiento fluido
    if (this.movement) {
      this.movement.enableWandering();
    }

    // Mensaje de vulnerabilidad
    if (this.comments) {
      this.comments.sayComment("¡Ahora vengan por mí si pueden!");
    }

    if (this.ui) {
      this.ui.showScreenMessage("⚔️ ¡BOSS VULNERABLE!", "#00FF00");
    }
  },

  // ======================================================
  // LOOP PRINCIPAL DE ACTUALIZACIÓN
  // ======================================================

  /**
   * Actualización principal del boss (coordinador)
   */
  update() {
    if (!this.active || !this.boss) return;

    // Actualizar inmunidad
    this.updateImmunity();

    // Actualizar sistemas modulares
    this.updateSystems();

    // 🎯 EJECUTAR CONTROL DE FASES
    this.executePhaseSequence();

    // Verificar derrota
    this.checkDefeat();
  },

  /**
   * Actualizar todos los sistemas modulares
   */
  updateSystems() {
    // Movimiento
    if (this.movement) {
      this.movement.update();
    }

    // Fases
    if (this.phases) {
      this.phases.update();
    }

    // Minas
    if (this.mines) {
      this.mines.update();
    }

    // Balas Touhou
    if (this.bullets) {
      this.bullets.update();
    }

    // Hilo rojo
    if (this.redline) {
      this.redline.update();
    }

    // Yan Ken Po
    if (this.yankenpo) {
      this.yankenpo.update();
    }

    // UI
    if (this.ui) {
      this.ui.update();
    }

    // Comentarios
    if (this.comments) {
      this.comments.update();
    }
  },

  /**
   * 🎯 CONTROL PRINCIPAL DE SECUENCIA DE FASES - COMPLETAMENTE CORREGIDO
   * Ejecuta las fases según el porcentaje de vida del boss
   */
  executePhaseSequence() {
    if (!this.active || !this.boss) return;

    // 🔥 NO EJECUTAR DURANTE LA FASE DE INTRODUCCIÓN
    if (this.introductionPhase) {
      return;
    }

    const healthPercentage = this.currentHealth / this.maxHealth;
    const currentPhase = this.phases?.getCurrentPhase() || "HUNTING";
    const isPhaseActive = this.phases?.isPhaseActive() || false;

    // 🔥 DEBUG LOGS
    console.log(
      `👹 DEBUG - Vida: ${Math.round(
        healthPercentage * 100
      )}%, Fase: ${currentPhase}, Activa: ${isPhaseActive}`
    );

    // ========== FASE FINAL: YAN KEN PO (3% de vida) ==========
    if (healthPercentage <= 0.03 && !this.yankenpo.isActive()) {
      console.log("🎮 INICIANDO FASE FINAL: Yan Ken Po");
      this.startYanKenPoPhase();
      return;
    }

    // ========== FASE 4: HILO ROJO (15% de vida) ==========
    if (
      healthPercentage <= 0.15 &&
      healthPercentage > 0.03 &&
      !this.redline.isActive()
    ) {
      console.log("🔴 INICIANDO FASE 4: Hilo Rojo");
      this.startRedLinePhase();
      return;
    }

    // ========== FASE 3: BALAS TOUHOU (30% de vida) ==========
    if (
      healthPercentage <= 0.3 &&
      healthPercentage > 0.15 &&
      currentPhase !== "BULLETS" &&
      !isPhaseActive
    ) {
      console.log("🌟 INICIANDO FASE 3: Balas Touhou");
      this.startBulletsPhase();
      return;
    }

    // ========== FASE 2: MINAS (50% de vida) ==========
    if (
      healthPercentage <= 0.5 &&
      healthPercentage > 0.3 &&
      currentPhase !== "MINES" &&
      !isPhaseActive
    ) {
      console.log("💣 INICIANDO FASE 2: Minas");
      this.startMinesPhase();
      return;
    }

    // ========== FASE 1: INVOCACIÓN (75% de vida) ==========
    if (
      healthPercentage <= 0.75 &&
      healthPercentage > 0.5 &&
      currentPhase !== "SUMMONING" &&
      !isPhaseActive
    ) {
      console.log("⚔️ INICIANDO FASE 1: Invocación");
      this.startSummoningPhase();
      return;
    }

    // ========== MODO HUNTING ENTRE FASES ==========
    if (!isPhaseActive && currentPhase !== "HUNTING") {
      console.log("🏃 Boss entrando en modo HUNTING");
      this.enterHuntingMode();
    }
  },

  /**
   * 🔥 NUEVA: Entrar en modo hunting fluido
   */
  enterHuntingMode() {
    if (this.phases) {
      this.phases.currentPhase = "HUNTING";
      this.phases.phaseActive = false;
    }

    // Boss vulnerable
    this.isImmune = false;
    this.immunityTimer = 0;

    // 🔥 MOVIMIENTO FLUIDO INMEDIATO
    if (this.movement) {
      this.movement.enableFluidHunting(); // Nueva función
    }

    if (this.ui) {
      this.ui.showScreenMessage("🏃 Boss cazando...", "#FFFF00");
    }
  },

  /**
   * 🔥 NUEVA: Verifica si debe iniciar Yan Ken Po por vida baja
   */
  checkYanKenPoTrigger() {
    const healthPercentage = this.currentHealth / this.maxHealth;

    if (
      healthPercentage <= 0.03 &&
      !this.yankenpo.isActive() &&
      (!this.phases || !this.phases.isRandomPhase)
    ) {
      console.log("🎮 Vida crítica - iniciando Yan Ken Po");
      this.startYanKenPoPhase();
      return true;
    }

    return false;
  },

  // ======================================================
  // 🎭 FUNCIONES DE INICIO DE FASES ESPECÍFICAS
  // ======================================================

  /**
   * 🔱 Fase 2: Invocación (60 segundos)
   * 75% a 50% de vida
   */
  startSummoningPhase() {
    console.log("⚔️ === INICIANDO FASE DE INVOCACIÓN ===");

    // Hacer inmune por 60 segundos (3600 frames a 60fps)
    this.makeImmune(3600);

    // Detener movimiento y centrar
    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    // Mostrar mensaje del boss
    if (this.comments) {
      this.comments.sayComment("¡Legiones del abismo, vengan a mí!");
    }

    // Iniciar fase después de 1 segundo
    setTimeout(() => {
      if (this.phases) {
        this.phases.changePhase("SUMMONING");
      }
    }, 1000);
  },

  /**
   * 💣 Fase 4: Minas (90 segundos)
   * 50% a 30% de vida
   */
  startMinesPhase() {
    console.log("💣 === INICIANDO FASE DE MINAS ===");

    // Hacer inmune por 90 segundos (5400 frames a 60fps)
    this.makeImmune(5400);

    // Detener movimiento y centrar
    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    // Mostrar mensaje del boss
    if (this.comments) {
      this.comments.sayComment("¡El suelo bajo sus pies es traicionero!");
    }

    // Iniciar fase después de 1 segundo
    setTimeout(() => {
      if (this.mines) {
        this.mines.startMineSequence();
      }
    }, 1000);
  },

  /**
   * 🌟 Fase 6: Balas Touhou (120 segundos)
   * 30% a 15% de vida
   */
  startBulletsPhase() {
    console.log("🌟 === INICIANDO FASE DE BALAS TOUHOU ===");

    // Hacer inmune por 120 segundos (7200 frames a 60fps)
    this.makeImmune(7200);

    // Detener movimiento y centrar
    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    // Mostrar mensaje del boss
    if (this.comments) {
      this.comments.sayComment("¡Lluvia de muerte del inframundo!");
    }

    // Iniciar fase después de 1 segundo
    setTimeout(() => {
      if (this.bullets) {
        this.bullets.startBulletPattern();
      }
    }, 1000);
  },

  /**
   * 🔴 Fase 8: Hilo Rojo (10 rondas)
   * 15% a 3% de vida
   */
  startRedLinePhase() {
    console.log("🔴 === INICIANDO FASE DEL HILO ROJO ===");

    // Hacer inmune hasta completar (inmunidad infinita)
    this.makeImmune(99999);

    // Detener movimiento y centrar
    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    // Mostrar mensaje del boss
    if (this.comments) {
      this.comments.sayComment("¡Sigue mi rastro mortal!");
    }

    // Iniciar fase después de 1 segundo
    setTimeout(() => {
      if (this.redline) {
        this.redline.startPhase();
      }
    }, 1000);
  },

  /**
   * 🎮 Fase Final: Yan Ken Po
   * 3% a 0% de vida
   */
  startYanKenPoPhase() {
    console.log("🎮 === INICIANDO FASE FINAL: YAN KEN PO ===");

    // Hacer inmune permanentemente
    this.makeImmune(99999);

    // Detener movimiento y centrar
    if (this.movement) {
      this.movement.stopMovementAndCenter();
    }

    // Mostrar mensaje del boss
    if (this.comments) {
      this.comments.sayComment("¡Última oportunidad, mortal!");
    }

    // Iniciar fase después de 1 segundo
    setTimeout(() => {
      if (this.yankenpo) {
        this.yankenpo.startPhase();
      }
    }, 1000);
  },

  // ======================================================
  // SISTEMA DE INMUNIDAD
  // ======================================================

  /**
   * Hacer al boss inmune por un tiempo
   */
  makeImmune(duration) {
    this.isImmune = true;
    this.immunityTimer = duration;

    if (this.ui) {
      this.ui.showScreenMessage("🛡️ BOSS INMUNE 🛡️", "#00FFFF");
    }

    console.log(`🛡️ Boss inmune por ${duration} frames`);
  },

  /**
   * Actualizar el sistema de inmunidad
   */
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

  /**
   * El boss recibe daño
   */
  takeDamage(amount) {
    // Verificaciones básicas
    if (!this.active || this.isImmune || this.currentHealth <= 0) {
      console.log("👹 Boss inmune o ya derrotado - no recibe daño");
      return;
    }

    // Verificar si está en fase especial
    if (this.phases && this.phases.isInSpecialPhase()) {
      console.log("👹 Boss inmune durante fase especial");
      return;
    }

    // Aplicar daño reducido
    const reducedDamage = Math.max(1, Math.floor(amount * 0.7));
    this.currentHealth = Math.max(0, this.currentHealth - reducedDamage);

    // Aumentar agresividad
    const healthPercentage = this.currentHealth / this.maxHealth;
    this.boss.aggressionLevel = 1.0 + (1.0 - healthPercentage) * 0.8;

    // Efectos visuales
    if (this.ui) {
      this.ui.createParticleEffect(
        this.boss.x + this.boss.width / 2,
        this.boss.y + this.boss.height / 2,
        "#FFFF00",
        8
      );
    }

    // Audio
    if (window.AudioManager) {
      AudioManager.playSound("hit");
    }

    console.log(
      `👹 Boss recibió ${reducedDamage} daño. Vida: ${this.currentHealth}/${
        this.maxHealth
      } (${Math.round(healthPercentage * 100)}%)`
    );

    // Notificar a los sistemas sobre el daño
    this.onDamageReceived(healthPercentage);

    // Verificar derrota
    if (this.currentHealth <= 0) {
      this.defeat();
    }
  },

  /**
   * Reacciones al recibir daño
   */
  onDamageReceived(healthPercentage) {
    // Notificar a los sistemas modulares
    if (this.phases) {
      this.phases.onDamageReceived(healthPercentage);
    }

    if (this.movement) {
      this.movement.onDamageReceived(healthPercentage);
    }

    if (this.comments) {
      this.comments.onDamageReceived(healthPercentage);
    }
  },

  // ======================================================
  // SISTEMA DE DERROTA
  // ======================================================

  /**
   * Verificar si el boss está derrotado
   */
  checkDefeat() {
    if (this.currentHealth <= 0 && this.active) {
      this.defeat();
    }
  },

  /**
   * Boss derrotado
   */
  defeat() {
    console.log("👹 === BOSS DERROTADO ===");

    // Marcar como inactivo
    this.active = false;
    this.currentHealth = 0;

    // Comentario de derrota
    if (this.comments) {
      this.comments.sayComment("derrota_boss");
    }

    // Efectos de derrota
    if (this.ui) {
      this.ui.showScreenMessage("🏆 ¡BOSS DERROTADO! 🏆", "#FFD700");

      // Efectos visuales épicos
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

    // Puntos bonus
    const bonusPoints = 5000;
    if (window.setScore) {
      window.setScore(window.getScore() + bonusPoints);
    }

    if (this.ui) {
      this.ui.showScreenMessage(`+${bonusPoints} PUNTOS BONUS!`, "#FFD700");
    }

    // Limpiar sistemas
    this.cleanupSystems();

    // Audio
    if (window.AudioManager) {
      AudioManager.playSound("victory");
    }

    // Contar como enemigo eliminado
    if (window.incrementTotalEnemiesKilled) {
      window.incrementTotalEnemiesKilled();
    }

    // Victoria después de 2 segundos
    setTimeout(() => {
      console.log("🏆 Llamando a window.victory() desde boss derrotado");
      if (window.victory) {
        window.victory();
      }
    }, 2000);
  },

  /**
   * Limpiar todos los sistemas al derrotar al boss
   */
  cleanupSystems() {
    if (this.mines) {
      this.mines.cleanup();
    }

    if (this.bullets) {
      this.bullets.cleanup();
    }

    if (this.redline) {
      this.redline.cleanup();
    }

    if (this.yankenpo) {
      this.yankenpo.cleanup();
    }

    if (this.ui) {
      this.ui.cleanup();
    }

    // Limpiar enemigos
    if (window.EnemyManager) {
      EnemyManager.enemies = [];
    }
  },

  // ======================================================
  // RENDERIZADO PRINCIPAL
  // ======================================================

  /**
   * Dibujar el boss y todos sus sistemas
   */
  draw(ctx) {
    if (!this.active || !this.boss) return;

    // Dibujar sistemas modulares
    this.drawSystems(ctx);

    // Dibujar el boss principal
    this.drawBoss(ctx);

    // Dibujar UI
    if (this.ui) {
      this.ui.draw(ctx);
    }
  },

  /**
   * Dibujar todos los sistemas modulares
   */
  drawSystems(ctx) {
    // Hilo rojo (fondo)
    if (this.redline) {
      this.redline.draw(ctx);
    }

    // Balas Touhou
    if (this.bullets) {
      this.bullets.draw(ctx);
    }

    // Minas
    if (this.mines) {
      this.mines.draw(ctx);
    }

    // Yan Ken Po UI
    if (this.yankenpo) {
      this.yankenpo.draw(ctx);
    }
  },

  /**
   * Dibujar el boss principal
   */
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

    // Intentar dibujar con imagen
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

  /**
   * Dibujar boss con fallback visual
   */
  drawBossFallback(ctx) {
    const phaseColor = this.phases
      ? this.phases.getCurrentPhaseColor()
      : "#8B0000";

    // Cuerpo principal
    ctx.fillStyle = phaseColor;
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
  // SISTEMA DE RESET
  // ======================================================

  /**
   * Reset completo del boss
   */
  reset() {
    console.log("🔄 RESET COMPLETO del boss modular");

    // Reset estado principal
    this.active = false;
    this.boss = null;
    this.currentHealth = this.maxHealth;
    this.isImmune = false;
    this.immunityTimer = 0;

    // Reset todos los sistemas modulares
    if (this.movement) this.movement.reset();
    if (this.phases) this.phases.reset();
    if (this.mines) this.mines.reset();
    if (this.bullets) this.bullets.reset();
    if (this.redline) this.redline.reset();
    if (this.yankenpo) this.yankenpo.reset();
    if (this.ui) this.ui.reset();
    if (this.comments) this.comments.reset();

    console.log("✅ Boss modular completamente reseteado");
  },

  /**
   * Reset forzado (para cambios de pantalla)
   */
  forceReset() {
    console.log("🔄 RESET FORZADO del boss");

    // Cleanup inmediato
    this.cleanupSystems();
    this.reset();

    // Restaurar controles del jugador
    if (window.Player && Player.moveSpeed !== 1.0) {
      Player.moveSpeed = 1.0;
    }
  },

  // ======================================================
  // GETTERS Y UTILIDADES
  // ======================================================

  // Getters públicos
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

  // Getters de sistemas
  getCurrentPhase() {
    return this.phases ? this.phases.getCurrentPhase() : "UNKNOWN";
  },

  getMines() {
    return this.mines ? this.mines.getMines() : [];
  },

  /**
   * Verificar colisión entre dos objetos
   */
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

console.log(
  "👹 boss.js (controlador principal) cargado - Sistema modular listo"
);
