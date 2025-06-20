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
  maxHealth: 2000,
  currentHealth: 2000,

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
   * Crear la entidad boss básica - CENTRADO
   */
  createBoss() {
    const canvas = window.getCanvas();
    const config = GameConfig.BOSS_CONFIG;

    this.boss = {
      x: canvas.width / 2 - (config.size * 1.5) / 2, // CENTRADO
      y: canvas.height / 2 - (config.size * 1.5) / 2, // CENTRADO
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

    console.log("👹 Entidad boss creada en el centro");
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
   * Configurar el boss después de inicializar sistemas - REDISEÑADO
   */
  setupBoss() {
    this.active = true;
    this.currentHealth = this.maxHealth;
    this.isImmune = true; // 🔥 Empezar inmune en INTRO
    this.immunityTimer = 9999;

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

    // Audio
    if (window.AudioManager) {
      AudioManager.playSound("special");
    }

    // 🔥 NUEVO: Iniciar con fase INTRO (10 segundos inmune en el centro)
    if (this.phases) {
      this.phases.changePhase("INTRO");
    }

    // Comentario de entrada después de 2 segundos
    if (this.comments) {
      setTimeout(() => {
        this.comments.sayRandomComment("entrada");
      }, 2000);
    }

    console.log("👹 Boss configurado - Iniciando con fase INTRO");
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
   * El boss recibe daño - MODIFICADO para más resistencia
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

    // 🔥 DAÑO MÁS REDUCIDO para mayor duración
    const reducedDamage = Math.max(1, Math.floor(amount * 0.4)); // Era 0.7, ahora 0.4
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
   * Boss derrotado - MEJORADO CON CONTADORES
   */
  defeat() {
    console.log("👹 === BOSS DERROTADO ===");

    // Marcar como inactivo
    this.active = false;
    this.currentHealth = 0;

    // Comentario de derrota
    if (this.comments) {
      this.comments.sayRandomComment("derrota_boss");
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

    // Puntos bonus épicos
    const bonusPoints = 10000; // 🔥 Aumentado de 5000 a 10000
    if (window.setScore) {
      window.setScore(window.getScore() + bonusPoints);
    }

    if (this.ui) {
      this.ui.showScreenMessage(`+${bonusPoints} PUNTOS BONUS!`, "#FFD700");
    }

    // 🔥 NUEVO: Contar boss como enemigo eliminado para el total
    if (window.incrementTotalEnemiesKilled) {
      window.incrementTotalEnemiesKilled();
      console.log("👹 Boss contado en total de enemigos eliminados");
    }

    // 🔥 NUEVO: Mega combo bonus
    if (window.ComboSystem) {
      window.ComboSystem.addKill(); // Boss cuenta como kill para combo
    }

    // Limpiar sistemas
    this.cleanupSystems();

    // Audio
    if (window.AudioManager) {
      AudioManager.playSound("victory");
    }

    // Victoria después de 2 segundos
    setTimeout(() => {
      console.log("🏆 Llamando a window.victory() desde boss derrotado");
      if (window.victory) {
        window.victory();
      }
    }, 2000);
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
   * Reset forzado (para cambios de pantalla) - CORREGIDO
   */
  forceReset() {
    console.log("🔄 RESET FORZADO del boss");

    // Marcar como inactivo inmediatamente
    this.active = false;

    // Cleanup inmediato de sistemas
    this.cleanupSystems();

    // Reset completo
    this.reset();

    // Restaurar controles del jugador
    if (window.Player && Player.moveSpeed !== 1.0) {
      Player.moveSpeed = 1.0;
      console.log("✅ Velocidad del jugador restaurada");
    }

    console.log("✅ Reset forzado del boss completado");
  },

  /**
   * Limpiar todos los sistemas modulares
   */
  cleanupSystems() {
    console.log("🧹 Limpiando todos los sistemas del boss");

    // Limpiar cada sistema modular si existe
    if (this.movement) {
      this.movement.reset();
    }

    if (this.phases) {
      this.phases.reset();
    }

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

    if (this.comments) {
      this.comments.cleanup();
    }

    console.log("✅ Todos los sistemas del boss limpiados");
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
