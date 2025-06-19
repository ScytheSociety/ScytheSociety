/**
 * Hell Shooter - Boss Management
 * Sistema del boss final del nivel 10
 */

const BossManager = {
  // ======================================================
  // ESTADO DEL BOSS
  // ======================================================

  // Duración de cada fase en frames (60fps)
  PHASE_DURATIONS: {
    SUMMONING: 900, // 15 segundos (15 * 60fps)
    MINES: 1500, // 25 segundos (25 * 60fps)
    BULLETS: 2100, // 35 segundos (35 * 60fps)
  },

  boss: null,
  active: false,

  // Barra de vida
  maxHealth: 50,
  currentHealth: 50,

  // Sistema de fases
  currentPhase: 1,
  lastPhaseChange: 0,

  // Sistema de inmunidad
  isImmune: false,
  immunityTimer: 0,

  // Sistema de invocación
  summonTimer: 0,
  lastSummonTime: 0,

  // Sistema de teletransporte
  teleportTimer: 0,
  teleportCooldown: 0,

  // Sistema de minas
  mines: [],
  mineTimer: 0,
  miningPhase: false,

  // 🔥 NUEVO: Sistema de línea roja
  redLinePhase: false,
  redLinePath: [],
  redLineIndex: 0,
  redLineSpeed: 0,
  playerSlowFactor: 0.2, // Jugador se mueve al 20% de velocidad

  // 🔥 NUEVO: Sistema de Yan Ken Po
  yanKenPoPhase: false,
  yanKenPoRound: 0,
  yanKenPoChoices: ["✊", "✋", "✌️"], // Piedra, Papel, Tijera
  bossChoice: null,
  playerChoice: null,
  yanKenPoButtons: [],

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  /**
   * Inicializa el boss para el nivel 11 - LIMPIO SIN DUPLICIDADES
   */
  init() {
    const canvas = window.getCanvas();
    const config = GameConfig.BOSS_CONFIG;

    // 🔥 BOSS MÁS GRANDE Y CON MUCHA MÁS VIDA
    this.boss = {
      x: canvas.width / 2 - (config.size * 1.5) / 2,
      y: 80,
      width: config.size * 1.5, // 🔥 CORREGIDO: Era solo config.size
      height: config.size * 1.5, // 🔥 CORREGIDO: Era solo config.size
      velocityX: 0,
      velocityY: 0,
      targetX: canvas.width / 2 - (config.size * 1.5) / 2,
      targetY: 80,

      // Visual mejorado
      color: "#8B0000",
      glowIntensity: 0,

      // Comportamiento más inteligente
      moveSpeed: config.speed * 1.5,
      aggressionLevel: 1.0,

      // 🔥 NUEVO: Sistema de movimiento fluido
      movementPattern: "hunting", // hunting, circling, teleporting
      patternTimer: 0,
      lastPatternChange: 0,
    };

    // 🔥 VIDA MASIVA PARA BOSS INTELIGENTE
    this.maxHealth = 200;
    this.currentHealth = 200;
    this.active = true;

    // 🔥 SISTEMA DE FASES INTELIGENTE - EMPEZAR SIN FASE
    this.currentPhase = "HUNTING"; // Empezar persiguiendo
    this.phaseTimer = 0;
    this.phaseActive = false;
    this.phaseCooldown = 0;

    // 🔥 SISTEMA DE BALAS TOUHOU
    this.bulletPatterns = [];
    this.patternType = "none";

    // 🔥 SISTEMAS BÁSICOS (SOLO LOS NECESARIOS)
    this.isImmune = false;
    this.immunityTimer = 0;
    this.mines = [];
    this.mineTimer = 0;
    this.miningPhase = false;

    // Comentarios y efectos
    this.lastCommentTime = 0;
    this.commentCooldown = 300;

    // Efectos de entrada
    UI.showScreenMessage("👹 ¡EL REY DEL INFIERNO APARECE! 👹", "#FF0000");
    this.sayRandomComment("entrada");
    AudioManager.playSound("special");

    UI.createParticleEffect(
      this.boss.x + this.boss.width / 2,
      this.boss.y + this.boss.height / 2,
      "#8B0000",
      100
    );

    console.log("👹 Boss INTELIGENTE inicializado - ¡Pelea épica!");
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Actualiza el boss cada frame - SISTEMA INTELIGENTE POR FASES
   */
  update() {
    if (!this.active || !this.boss) return;

    // Actualizar sistemas básicos
    this.updateImmunity();

    // 🔥 NUEVO: Verificar fase final (3% de vida)
    if (
      this.currentHealth <= 6 &&
      !this.yanKenPoPhase &&
      this.currentPhase !== "FINAL"
    ) {
      this.startFinalPhase();
      return;
    }

    // 🔥 NUEVO: Manejar fase de Yan Ken Po
    if (this.yanKenPoPhase) {
      this.updateYanKenPo();
      return;
    }

    // 🔥 NUEVO: Manejar fase de línea roja
    if (this.redLinePhase) {
      this.updateRedLine();
      return;
    }

    // Actualizar movimiento inteligente solo si no hay fases especiales activas
    if (!this.yanKenPoPhase && !this.redLinePhase) {
      this.updateIntelligentMovement();
    }

    // 🔥 SISTEMA DE FASES INTELIGENTE
    this.updateIntelligentPhases();

    // 🔥 IMPORTANTE: Las minas deben seguir activas aunque termine la fase
    this.updateIntelligentMines();

    // Comentarios aleatorios ocasionales
    if (Math.random() < 0.003) {
      this.sayRandomComment("combate");
    }

    // Verificar derrota
    this.checkDefeat();
  },

  /**
   * 🔥 NUEVO: Sistema de fases inteligente basado en vida
   */
  updateIntelligentPhases() {
    const healthPercentage = this.currentHealth / this.maxHealth;

    console.log(
      `👹 Boss vida: ${Math.round(healthPercentage * 100)}% - Fase actual: ${
        this.currentPhase
      } - Fase activa: ${this.phaseActive}`
    );

    // 🔥 NUEVO: Verificar fase de línea roja al 10%
    if (
      healthPercentage <= 0.1 &&
      healthPercentage > 0.03 &&
      !this.redLinePhase &&
      this.currentPhase !== "REDLINE"
    ) {
      this.startRedLinePhase();
      return;
    }

    // 🔥 VERIFICAR ACTIVACIÓN DE FASES NORMALES
    let shouldStartPhase = false;
    let targetPhase = null;

    // FASE SUMMONING al 75%
    if (
      healthPercentage <= 0.75 &&
      healthPercentage > 0.5 &&
      !this.phaseActive &&
      !this.redLinePhase
    ) {
      if (this.currentPhase !== "SUMMONING") {
        shouldStartPhase = true;
        targetPhase = "SUMMONING";
        console.log("👹 Activando fase SUMMONING");
      }
    }
    // FASE MINES al 50%
    else if (
      healthPercentage <= 0.5 &&
      healthPercentage > 0.25 &&
      !this.phaseActive &&
      !this.redLinePhase
    ) {
      if (this.currentPhase !== "MINES") {
        shouldStartPhase = true;
        targetPhase = "MINES";
        console.log("👹 Activando fase MINES");
      }
    }
    // FASE BULLETS al 25%
    else if (
      healthPercentage <= 0.25 &&
      healthPercentage > 0.1 &&
      !this.phaseActive &&
      !this.redLinePhase
    ) {
      if (this.currentPhase !== "BULLETS") {
        shouldStartPhase = true;
        targetPhase = "BULLETS";
        console.log("👹 Activando fase BULLETS");
      }
    }

    // Iniciar fase si corresponde
    if (shouldStartPhase && targetPhase) {
      this.changeIntelligentPhase(targetPhase);
    }

    // Ejecutar fase actual si está activa
    if (this.phaseActive) {
      switch (this.currentPhase) {
        case "SUMMONING":
          this.executeSummoningPhase();
          break;
        case "MINES":
          this.executeMinesPhase();
          break;
        case "BULLETS":
          this.executeBulletsPhase();
          break;
      }
    } else if (!this.redLinePhase && !this.yanKenPoPhase) {
      // 🔥 PERSEGUIR JUGADOR cuando no hay fase activa
      this.huntPlayer();
    }
  },

  /**
   * 🔥 NUEVO: Cambio inteligente de fase
   */
  changeIntelligentPhase(newPhase) {
    console.log(`👹 Boss cambiando a fase: ${newPhase}`);

    this.currentPhase = newPhase;
    this.phaseTimer = 0;
    this.phaseActive = true;

    // Limpiar sistemas anteriores
    this.mines = [];
    this.bulletPatterns = [];

    // Volverse inmune durante toda la fase
    this.isImmune = true;
    this.immunityTimer = 9999; // Inmunidad hasta que termine la fase
    this.phaseActive = true;

    // Teletransportarse al centro para fase
    this.teleportToCenter();

    // Mensaje de fase
    const phaseMessages = {
      SUMMONING: "⚔️ FASE DE INVOCACIÓN",
      MINES: "💣 FASE DE MINAS",
      BULLETS: "🌟 FASE TOUHOU",
    };

    UI.showScreenMessage(phaseMessages[newPhase], "#FF0000");
  },

  /**
   * 🔥 NUEVO: Teletransporte al centro para fases
   */
  teleportToCenter() {
    const canvas = window.getCanvas();

    // Efecto visual en posición actual
    UI.createParticleEffect(
      this.boss.x + this.boss.width / 2,
      this.boss.y + this.boss.height / 2,
      "#8B0000",
      50
    );

    // Ir al centro
    this.boss.x = canvas.width / 2 - this.boss.width / 2;
    this.boss.y = canvas.height / 2 - this.boss.height / 2;
    this.boss.targetX = this.boss.x;
    this.boss.targetY = this.boss.y;

    // Efecto visual en nueva posición
    UI.createParticleEffect(
      this.boss.x + this.boss.width / 2,
      this.boss.y + this.boss.height / 2,
      "#FF0000",
      50
    );

    AudioManager.playSound("special");
  },

  /**
   * 🔥 FASE 1: Solo invocaciones + persecución
   */
  executeSummoningPhase() {
    this.phaseTimer++;

    // Invocar enemigos cada 4 segundos
    if (this.phaseTimer % 240 === 0) {
      this.summonIntelligentEnemies(3);
    }

    // Verificar si la fase debe terminar
    if (this.phaseTimer >= this.PHASE_DURATIONS.SUMMONING) {
      this.endCurrentPhase();
    }
  },

  /**
   * 🔥 FASE 2: Minas + teletransporte
   */
  executeMinesPhase() {
    this.phaseTimer++;

    // Ciclo de minas cada 8 segundos
    if (this.phaseTimer % 480 === 0) {
      this.startMineSequence();
    }

    // Teletransporte más frecuente
    if (this.phaseTimer % 180 === 0) {
      this.intelligentTeleport();
    }

    // Actualizar minas
    this.updateIntelligentMines();

    // Verificar si la fase debe terminar
    if (this.phaseTimer >= this.PHASE_DURATIONS.MINES) {
      this.endCurrentPhase();
    }
  },

  /**
   * 🔥 FASE 3: Balas estilo Touhou + todo combinado
   */
  executeBulletsPhase() {
    this.phaseTimer++;

    // Patrón de balas cada 6 segundos
    if (this.phaseTimer % 360 === 0) {
      this.startBulletPattern();
    }

    // Invocaciones ocasionales
    if (this.phaseTimer % 420 === 0) {
      this.summonIntelligentEnemies(2);
    }

    // 🔥 NUEVO: Escudos protectores durante fase Touhou
    if (this.phaseTimer % 300 === 0) {
      // Cada 5 segundos
      this.spawnProtectiveShield();
    }

    // Actualizar sistemas
    this.updateBulletPatterns();
    this.updateIntelligentMines();

    // Verificar si la fase debe terminar
    if (this.phaseTimer >= this.PHASE_DURATIONS.BULLETS) {
      this.endCurrentPhase();
    }
  },

  /**
   * 🔥 NUEVO: Spawn escudo protector durante fase Touhou
   */
  spawnProtectiveShield() {
    const canvas = window.getCanvas();

    // Crear power-up de escudo
    const shieldPowerUp = {
      x: Math.random() * (canvas.width - 60) + 30,
      y: Math.random() * (canvas.height - 60) + 30,
      width: 50,
      height: 50,
      velocityX: 0,
      velocityY: 0,
      type: {
        id: 0, // Escudo
        name: "Escudo Protector",
        color: "#00FF00",
        duration: 240, // 4 segundos
      },
      pulseTimer: 0,
      glowIntensity: 1.0,
      spawnTime: window.getGameTime(),
    };

    PowerUpManager.powerUps.push(shieldPowerUp);

    UI.showScreenMessage("🛡️ ¡ESCUDO DISPONIBLE!", "#00FF00");
    console.log("🛡️ Escudo protector spawneado durante fase Touhou");
  },

  endCurrentPhase() {
    console.log(`👹 Terminando fase: ${this.currentPhase}`);
    this.phaseActive = false;
    this.isImmune = false;
    this.immunityTimer = 0;
    this.phaseTimer = 0;

    // Limpiar sistemas de la fase
    this.mines = [];
    this.bulletPatterns = [];

    // 🔥 NUEVO: Limpiar todos los intervalos activos
    if (this.miningPhase) {
      this.miningPhase = false;
    }

    UI.showScreenMessage("⚔️ BOSS VULNERABLE", "#00FF00");
  },

  /**
   * 🔥 CORREGIDO: Invocación inteligente de enemigos SIN resetear contador global
   */
  summonIntelligentEnemies(count) {
    const canvas = window.getCanvas();

    UI.showScreenMessage(
      `👹 ¡${count} ESBIRROS DE TODOS LOS NIVELES!`,
      "#FF4444"
    );

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        // 🔥 ENEMIGOS DE NIVELES ALEATORIOS (1-10)
        const randomLevel = 1 + Math.floor(Math.random() * 10);
        const size = GameConfig.ENEMY_MIN_SIZE + randomLevel * 3; // Tamaño según nivel

        // Posiciones estratégicas mejoradas
        const positions = [
          { x: 50, y: 50 },
          { x: canvas.width - 100, y: 50 },
          { x: 50, y: canvas.height - 100 },
          { x: canvas.width - 100, y: canvas.height - 100 },
          { x: canvas.width / 4, y: 50 },
          { x: (canvas.width * 3) / 4, y: 50 },
        ];

        const pos = positions[i % positions.length];

        const minion = {
          x: pos.x,
          y: pos.y,
          width: size,
          height: size,
          velocityX: (Math.random() - 0.5) * 0.008 * canvas.height,
          velocityY: (Math.random() - 0.5) * 0.008 * canvas.height,

          // 🔥 IMAGEN SEGÚN NIVEL ALEATORIO
          image:
            GameConfig.enemyImages[
              Math.min(randomLevel - 1, GameConfig.enemyImages.length - 1)
            ],
          speedFactor: 1.0 + randomLevel * 0.1, // Más rápidos según nivel
          bounceCount: 0,
          maxBounces: 5 + randomLevel,

          level: randomLevel, // 🔥 NIVEL ALEATORIO
          type: "boss_minion",
          isBossMinion: true,

          // Sistema de escalado
          dynamicScaling: {
            enabled: true,
            baseSize: size,
            currentScale: 1.0,
            scaleDirection: 1,
            scaleSpeed: 0.004,
            minScale: 0.8,
            maxScale: 1.3,
            pulseTimer: 0,
          },
        };

        EnemyManager.enemies.push(minion);
        UI.createParticleEffect(
          pos.x + size / 2,
          pos.y + size / 2,
          "#8B0000",
          25
        );

        console.log(`👹 Esbirro nivel ${randomLevel} invocado`);
      }, i * 400); // 400ms entre cada invocación
    }

    AudioManager.playSound("special");
  },

  /**
   * 🔥 CORREGIDO: Movimiento constante del boss
   */
  updateIntelligentMovement() {
    // 🔥 MOVIMIENTO CONSTANTE - SIEMPRE ACTIVO
    let movementFactor = 1.0;

    // Solo reducir durante fases específicas, nunca eliminar completamente
    if (
      this.phaseActive &&
      (this.currentPhase === "MINES" || this.currentPhase === "BULLETS")
    ) {
      movementFactor = 0.4; // Reducido pero no eliminado
    }

    // Durante Yan Ken Po: DETENERSE COMPLETAMENTE
    if (this.yanKenPoPhase) {
      this.boss.velocityX = 0;
      this.boss.velocityY = 0;
      // Mantener en el centro
      const canvas = window.getCanvas();
      this.boss.x = canvas.width / 2 - this.boss.width / 2;
      this.boss.y = canvas.height / 2 - this.boss.height / 2;
      return;
    }

    // Durante hilo rojo: seguir la ruta
    if (this.redLinePhase && this.redLineMoving) {
      // El movimiento se maneja en updateRedLine()
      return;
    }

    // 🔥 MOVIMIENTO NORMAL - SIEMPRE ACTIVO
    if (!this.phaseActive || this.currentPhase === "SUMMONING") {
      this.huntPlayer();
    } else {
      this.huntPlayerSlow();
    }

    // 🔥 APLICAR MOVIMIENTO SIEMPRE
    this.boss.x += this.boss.velocityX * movementFactor;
    this.boss.y += this.boss.velocityY * movementFactor;

    // 🔥 REBOTES EN PAREDES - RÁPIDOS
    const canvas = window.getCanvas();
    const bounceSpeed = 0.9; // Rebote rápido

    if (this.boss.x < 0) {
      this.boss.x = 0;
      this.boss.velocityX = Math.abs(this.boss.velocityX) * bounceSpeed;
    }
    if (this.boss.x + this.boss.width > canvas.width) {
      this.boss.x = canvas.width - this.boss.width;
      this.boss.velocityX = -Math.abs(this.boss.velocityX) * bounceSpeed;
    }
    if (this.boss.y < 0) {
      this.boss.y = 0;
      this.boss.velocityY = Math.abs(this.boss.velocityY) * bounceSpeed;
    }
    if (this.boss.y + this.boss.height > canvas.height) {
      this.boss.y = canvas.height - this.boss.height;
      this.boss.velocityY = -Math.abs(this.boss.velocityY) * bounceSpeed;
    }

    // Efectos visuales
    this.boss.glowIntensity = 0.5 + Math.sin(window.getGameTime() * 0.1) * 0.3;
  },

  /**
   * 🔥 Cambiar patrón de movimiento
   */
  changeMovementPattern() {
    const patterns = ["hunting", "circling", "teleporting"];
    const currentIndex = patterns.indexOf(this.boss.movementPattern);
    this.boss.movementPattern = patterns[(currentIndex + 1) % patterns.length];
    this.lastPatternChange = window.getGameTime();
    this.patternTimer = 0;

    console.log(`👹 Boss cambió a patrón: ${this.boss.movementPattern}`);
  },

  /**
   * 🔥 Perseguir al jugador inteligentemente
   */
  huntPlayer() {
    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();

    const playerCenterX = playerPos.x + playerSize.width / 2;
    const playerCenterY = playerPos.y + playerSize.height / 2;
    const bossCenterX = this.boss.x + this.boss.width / 2;
    const bossCenterY = this.boss.y + this.boss.height / 2;

    const dx = playerCenterX - bossCenterX;
    const dy = playerCenterY - bossCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 🔥 PERSECUCIÓN CONSTANTE Y DIRECTA
    if (distance > 100) {
      // Mantener distancia mínima de 100px
      const speed = this.boss.moveSpeed * 1.8; // Velocidad constante
      this.boss.velocityX = (dx / distance) * speed;
      this.boss.velocityY = (dy / distance) * speed;
    } else {
      // Estar muy cerca - moverse en círculos pequeños
      this.boss.velocityX *= 0.5;
      this.boss.velocityY *= 0.5;
    }

    // Limitar velocidad máxima
    const maxSpeed = this.boss.moveSpeed * 2.5;
    const currentSpeed = Math.sqrt(
      this.boss.velocityX ** 2 + this.boss.velocityY ** 2
    );
    if (currentSpeed > maxSpeed) {
      this.boss.velocityX = (this.boss.velocityX / currentSpeed) * maxSpeed;
      this.boss.velocityY = (this.boss.velocityY / currentSpeed) * maxSpeed;
    }
  },

  /**
   * 🔥 NUEVO: Perseguir jugador lentamente durante fases
   */
  huntPlayerSlow() {
    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();

    const playerCenterX = playerPos.x + playerSize.width / 2;
    const playerCenterY = playerPos.y + playerSize.height / 2;
    const bossCenterX = this.boss.x + this.boss.width / 2;
    const bossCenterY = this.boss.y + this.boss.height / 2;

    const dx = playerCenterX - bossCenterX;
    const dy = playerCenterY - bossCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Movimiento lento durante fases
    if (distance > 200) {
      const slowSpeed = this.boss.moveSpeed * 0.8;
      this.boss.velocityX += (dx / distance) * slowSpeed * 0.2;
      this.boss.velocityY += (dy / distance) * slowSpeed * 0.2;
    }

    // Limitar velocidad lenta
    const maxSlowSpeed = this.boss.moveSpeed * 1.5;
    const currentSpeed = Math.sqrt(
      this.boss.velocityX ** 2 + this.boss.velocityY ** 2
    );
    if (currentSpeed > maxSlowSpeed) {
      this.boss.velocityX = (this.boss.velocityX / currentSpeed) * maxSlowSpeed;
      this.boss.velocityY = (this.boss.velocityY / currentSpeed) * maxSlowSpeed;
    }
  },

  /**
   * 🔥 Círculos alrededor del jugador
   */
  circleAroundPlayer() {
    this.patternTimer += 0.05;

    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();
    const playerCenterX = playerPos.x + playerSize.width / 2;
    const playerCenterY = playerPos.y + playerSize.height / 2;

    const radius = 200;
    const targetX = playerCenterX + Math.cos(this.patternTimer) * radius;
    const targetY = playerCenterY + Math.sin(this.patternTimer) * radius;

    const dx = targetX - (this.boss.x + this.boss.width / 2);
    const dy = targetY - (this.boss.y + this.boss.height / 2);

    this.boss.velocityX = dx * 0.02;
    this.boss.velocityY = dy * 0.02;
  },

  /**
   * 🔥 Movimiento con teletransporte
   */
  teleportMovement() {
    this.patternTimer++;

    if (this.patternTimer > 120) {
      // 2 segundos
      this.intelligentTeleport();
      this.patternTimer = 0;
    }
  },

  /**
   * 🔥 Teletransporte inteligente
   */
  intelligentTeleport() {
    const canvas = window.getCanvas();
    const playerPos = Player.getPosition();

    // Efecto en posición actual
    UI.createParticleEffect(
      this.boss.x + this.boss.width / 2,
      this.boss.y + this.boss.height / 2,
      "#8B0000",
      30
    );

    // Posiciones estratégicas cerca del jugador pero no encima
    const positions = [
      { x: playerPos.x - 200, y: playerPos.y - 150 },
      { x: playerPos.x + 200, y: playerPos.y - 150 },
      { x: playerPos.x, y: playerPos.y - 300 },
      { x: playerPos.x - 150, y: playerPos.y + 150 },
      { x: playerPos.x + 150, y: playerPos.y + 150 },
    ];

    // Filtrar posiciones válidas
    const validPositions = positions.filter(
      (pos) =>
        pos.x >= 0 &&
        pos.x + this.boss.width <= canvas.width &&
        pos.y >= 0 &&
        pos.y + this.boss.height <= canvas.height
    );

    if (validPositions.length > 0) {
      const newPos =
        validPositions[Math.floor(Math.random() * validPositions.length)];
      this.boss.x = newPos.x;
      this.boss.y = newPos.y;

      // Efecto en nueva posición
      UI.createParticleEffect(
        this.boss.x + this.boss.width / 2,
        this.boss.y + this.boss.height / 2,
        "#FF0000",
        30
      );

      AudioManager.playSound("special");
    }
  },

  // ======================================================
  // SISTEMA DE INMUNIDAD
  // ======================================================

  /**
   * Hace al boss inmune por un tiempo
   */
  makeImmune(duration) {
    this.isImmune = true;
    this.immunityTimer = duration;

    UI.showScreenMessage("🛡️ BOSS INMUNE 🛡️", "#00FFFF");
    console.log(`🛡️ Boss inmune por ${duration} frames`);
  },

  /**
   * Actualiza el sistema de inmunidad
   */
  updateImmunity() {
    if (this.isImmune) {
      this.immunityTimer--;

      if (this.immunityTimer <= 0) {
        this.isImmune = false;
        UI.showScreenMessage("⚔️ Boss vulnerable", "#FFFF00");
        console.log("⚔️ Boss ya no es inmune");
      }
    }
  },

  // ======================================================
  // SISTEMA DE INVOCACIÓN
  // ======================================================

  // ======================================================
  // SISTEMA DE TELETRANSPORTE
  // ======================================================

  // ======================================================
  // SISTEMA DE MINAS
  // ======================================================

  // ======================================================
  // SISTEMA DE DAÑO
  // ======================================================

  /**
   * 🔥 CORREGIR: takeDamage() con reacciones inteligentes completas
   */
  takeDamage(amount) {
    // Verificaciones básicas
    if (!this.active || this.isImmune) {
      console.log("👹 Boss inmune - no recibe daño");
      return;
    }

    if (this.currentHealth <= 0) {
      console.log("👹 Boss ya está muerto");
      return;
    }

    // 🔥 NUEVO: Inmune durante fases activas
    if (this.phaseActive) {
      console.log("👹 Boss inmune durante fase activa");
      return;
    }

    // 🔥 NUEVO: Durante fase final, no recibir daño normal
    if (this.yanKenPoPhase) {
      console.log("👹 Boss inmune durante Yan Ken Po");
      return;
    }

    // 🔥 DAÑO REDUCIDO PARA MAYOR DURACIÓN
    const reducedDamage = Math.max(1, Math.floor(amount * 0.7)); // 30% menos daño
    this.currentHealth = Math.max(0, this.currentHealth - reducedDamage);

    // Aumentar agresividad según daño recibido
    const healthPercentage = this.currentHealth / this.maxHealth;
    this.boss.aggressionLevel = 1.0 + (1.0 - healthPercentage) * 0.8;

    // Efecto visual de daño más sutil
    UI.createParticleEffect(
      this.boss.x + this.boss.width / 2,
      this.boss.y + this.boss.height / 2,
      "#FFFF00",
      8
    );

    AudioManager.playSound("hit");

    console.log(
      `👹 Boss recibió ${reducedDamage} daño. Vida: ${this.currentHealth}/${
        this.maxHealth
      } (${Math.round(healthPercentage * 100)}%)`
    );

    // 🔥 REACCIONES INTELIGENTES AL DAÑO
    this.reactToDamage(healthPercentage);

    // 🔥 VERIFICAR DERROTA
    if (this.currentHealth <= 0) {
      console.log("👹 Boss derrotado!");

      // 🔥 Contar al boss como enemigo eliminado en el total
      if (window.incrementTotalEnemiesKilled) {
        window.incrementTotalEnemiesKilled();
        console.log("👑 Boss eliminado y contado en total global");
      }

      setTimeout(() => this.defeat(), 200);
    }
  },

  /**
   * 🔥 NUEVA: Reacciones inteligentes al recibir daño
   */
  reactToDamage(healthPercentage) {
    // Teletransporte defensivo si vida muy baja
    if (healthPercentage < 0.2 && Math.random() < 0.3) {
      this.intelligentTeleport();
      UI.showScreenMessage("👹 ¡Teletransporte defensivo!", "#FF00FF");
    }

    // Invocación de emergencia
    if (healthPercentage < 0.15 && Math.random() < 0.2) {
      this.summonIntelligentEnemies(2);
      UI.showScreenMessage("👹 ¡Refuerzos de emergencia!", "#FF0000");
    }

    // Comentarios según el daño
    if (Math.random() < 0.1) {
      if (healthPercentage > 0.5) {
        this.sayRandomComment("combate");
      } else {
        // Comentarios más desesperados
        const desperateComments = [
          "¡Impossible! ¿Cómo me hieren?",
          "¡No puede ser! ¡Soy invencible!",
          "¡Mi poder se desvanece!",
          "¡Esto no debería pasar!",
          "¡Malditos mortales!",
          "¡No me derrotarán tan fácil!",
        ];

        const randomComment =
          desperateComments[
            Math.floor(Math.random() * desperateComments.length)
          ];
        UI.showScreenMessage(`👹: "${randomComment}"`, "#FF0000");
      }
    }
  },

  /**
   * Verifica si el boss está derrotado - CORREGIDO
   */
  checkDefeat() {
    if (this.currentHealth <= 0 && this.active) {
      console.log("👹 Boss derrotado - iniciando secuencia de victoria");
      this.defeat();
    }
  },

  /**
   * Boss derrotado - CORREGIDO PARA NIVEL 11
   */
  defeat() {
    console.log("👹 === BOSS DERROTADO EN NIVEL 11 ===");

    // Marcar como inactivo inmediatamente
    this.active = false;
    this.currentHealth = 0;

    // 🔥 COMENTARIO OBLIGATORIO DE DERROTA
    this.sayRandomComment("derrota_boss");

    // Efectos de derrota
    UI.showScreenMessage("🏆 ¡BOSS DERROTADO! 🏆", "#FFD700");

    // Efectos visuales épicos
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        UI.createParticleEffect(
          this.boss.x + this.boss.width / 2,
          this.boss.y + this.boss.height / 2,
          "#FFD700",
          50
        );
      }, i * 200);
    }

    // Puntos bonus
    const bonusPoints = 5000;
    window.setScore(window.getScore() + bonusPoints);
    UI.showScreenMessage(`+${bonusPoints} PUNTOS BONUS!`, "#FFD700");

    // Limpiar sistemas
    this.mines = [];
    EnemyManager.enemies = [];

    AudioManager.playSound("victory");

    // Victoria después de 2 segundos
    setTimeout(() => {
      console.log("🏆 Llamando a window.victory() desde boss derrotado");
      window.victory();
    }, 2000);

    console.log("🏆 Boss derrotado - secuencia de victoria iniciada");
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  /**
   * Dibuja el boss y todos sus elementos - SISTEMA COMPLETO
   */
  draw(ctx) {
    if (!this.active || !this.boss) return;

    // 🔥 NUEVO: Dibujar línea roja si está activa
    if (this.redLinePhase && this.redLinePath.length > 0) {
      this.drawRedLine(ctx);
    }

    // Dibujar balas Touhou
    this.drawBulletPatterns(ctx);

    // Dibujar minas
    this.drawIntelligentMines(ctx);

    // Dibujar boss
    this.drawBoss(ctx);

    // Dibujar barra de vida
    this.drawHealthBar(ctx);

    // 🔥 NUEVO: Dibujar indicador de Yan Ken Po
    if (
      this.yanKenPoPhase &&
      this.bossChoice !== null &&
      this.playerChoice === null
    ) {
      this.drawBossChoice(ctx);
    }
  },

  /**
   * 🔥 NUEVO: Dibujar minas inteligentes con zonas de peligro mejoradas
   */
  drawIntelligentMines(ctx) {
    for (const mine of this.mines) {
      ctx.save();

      // 🔥 ZONA DE PELIGRO MÁS VISIBLE
      if (mine.showDangerZone) {
        ctx.beginPath();
        ctx.arc(
          mine.x + mine.width / 2,
          mine.y + mine.height / 2,
          mine.dangerRadius,
          0,
          Math.PI * 2
        );

        // Color según fase
        if (mine.warningPhase) {
          // Rojo parpadeante en fase de advertencia
          const alpha = 0.3 + Math.sin(mine.blinkTimer * 0.5) * 0.2;
          ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
          ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.1})`;
          ctx.fill();
        } else {
          // Naranja normal
          ctx.strokeStyle = "rgba(255, 136, 0, 0.6)";
          ctx.fillStyle = "rgba(255, 136, 0, 0.05)";
          ctx.fill();
        }

        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 🔥 MINA MÁS VISIBLE
      let mineColor = mine.armed ? "#FF0000" : "#FF8800";

      // Parpadeo intenso cuando está por explotar
      if (mine.timer < 60) {
        const blinkIntensity = mine.blinkTimer % 10 < 5;
        ctx.globalAlpha = blinkIntensity ? 1.0 : 0.3;
        mineColor = "#FFFFFF"; // Blanco al parpadear
      }

      // Sombra para la mina
      ctx.shadowColor = mineColor;
      ctx.shadowBlur = 15;

      // Cuerpo de la mina
      ctx.fillStyle = mineColor;
      ctx.fillRect(mine.x, mine.y, mine.width, mine.height);

      // Borde visible
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.strokeRect(mine.x, mine.y, mine.width, mine.height);

      // Indicador central
      ctx.fillStyle = "#FFFFFF";
      const centerSize = mine.width * 0.3;
      ctx.fillRect(
        mine.x + (mine.width - centerSize) / 2,
        mine.y + (mine.height - centerSize) / 2,
        centerSize,
        centerSize
      );

      // 🔥 CONTADOR DE TIEMPO VISIBLE
      if (mine.timer < 180) {
        // Mostrar en los últimos 3 segundos
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;

        const timeLeft = Math.ceil(mine.timer / 60);
        const textX = mine.x + mine.width / 2;
        const textY = mine.y - 10;

        ctx.strokeText(timeLeft.toString(), textX, textY);
        ctx.fillText(timeLeft.toString(), textX, textY);
      }

      ctx.restore();
    }
  },

  /**
   * 🔥 Dibujar boss con efectos mejorados según fase
   */
  drawBoss(ctx) {
    ctx.save();

    // 🔥 EFECTOS SEGÚN FASE Y ESTADO
    if (this.isImmune) {
      ctx.shadowColor = "#00FFFF";
      ctx.shadowBlur = 25;
      ctx.globalAlpha = 0.8 + Math.sin(window.getGameTime() * 0.4) * 0.2;
    } else {
      // Color según vida
      const healthPercentage = this.currentHealth / this.maxHealth;
      if (healthPercentage < 0.3) {
        ctx.shadowColor = "#FF0000";
        ctx.shadowBlur = 20 + Math.sin(window.getGameTime() * 0.3) * 10;
      } else {
        ctx.shadowColor = this.boss.color;
        ctx.shadowBlur = 15 + this.boss.glowIntensity * 10;
      }
    }

    // 🔥 AURA SEGÚN FASE
    const phaseColors = {
      SUMMONING: "#8B0000",
      MINES: "#FF8800",
      BULLETS: "#9B59B6",
    };

    const auraColor = phaseColors[this.currentPhase] || "#8B0000";

    // Dibujar aura de fase
    ctx.beginPath();
    ctx.arc(
      this.boss.x + this.boss.width / 2,
      this.boss.y + this.boss.height / 2,
      this.boss.width * 0.8,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = `${auraColor}60`;
    ctx.lineWidth = 4;
    ctx.stroke();

    console.log(`👹 Dibujando boss en fase ${this.currentPhase}`);

    // Intentar dibujar con frames animados
    let bossDibujado = false;
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

    // Fallback a imagen estática
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

    // Fallback visual garantizado
    if (!bossDibujado) {
      // Cuerpo principal
      ctx.fillStyle = auraColor;
      ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);

      // Bordes múltiples
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(
        this.boss.x,
        this.boss.y,
        this.boss.width,
        this.boss.height
      );

      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.boss.x + 3,
        this.boss.y + 3,
        this.boss.width - 6,
        this.boss.height - 6
      );

      // Características faciales mejoradas
      const centerX = this.boss.x + this.boss.width / 2;
      const centerY = this.boss.y + this.boss.height / 2;

      // Ojos más grandes y expresivos
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(centerX - 35, centerY - 35, 25, 25);
      ctx.fillRect(centerX + 10, centerY - 35, 25, 25);

      // Pupilas brillantes
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(centerX - 30, centerY - 30, 15, 15);
      ctx.fillRect(centerX + 15, centerY - 30, 15, 15);

      // Boca amenazante
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
    }

    ctx.restore();
  },

  /**
   * 🔥 NUEVO: Dibuja la barra de vida que SIGUE AL BOSS y es más pequeña
   */
  drawHealthBar(ctx) {
    // 🔥 BARRA MÁS PEQUEÑA QUE SIGUE AL BOSS
    const barWidth = this.boss.width * 1.2; // Proporcional al boss
    const barHeight = 8; // Más delgada
    const x = this.boss.x + (this.boss.width - barWidth) / 2; // Centrada sobre el boss
    const y = this.boss.y + this.boss.height + 25; // Debajo del boss

    // Fondo de la barra con transparencia
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

    // Borde más sutil
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // 🔥 BARRA DE VIDA CON SEGMENTOS
    const healthPercentage = this.currentHealth / this.maxHealth;
    const healthWidth = barWidth * healthPercentage;

    // Color según vida restante con transición suave
    let healthColor;
    if (healthPercentage > 0.6) {
      healthColor = "#00FF00"; // Verde
    } else if (healthPercentage > 0.3) {
      healthColor = "#FFFF00"; // Amarillo
    } else if (healthPercentage > 0.15) {
      healthColor = "#FF8800"; // Naranja
    } else {
      healthColor = "#FF0000"; // Rojo crítico
    }

    // Barra de vida principal
    ctx.fillStyle = healthColor;
    ctx.fillRect(x, y, healthWidth, barHeight);

    // 🔥 EFECTO DE PULSACIÓN EN VIDA BAJA
    if (healthPercentage < 0.3) {
      const pulseAlpha = 0.3 + Math.sin(window.getGameTime() * 0.2) * 0.3;
      ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
      ctx.fillRect(x, y, healthWidth, barHeight);
    }

    // 🔥 SEGMENTOS DE VIDA (líneas divisorias)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const segmentX = x + (barWidth / 4) * i;
      ctx.beginPath();
      ctx.moveTo(segmentX, y);
      ctx.lineTo(segmentX, y + barHeight);
      ctx.stroke();
    }

    // 🔥 TEXTO DE VIDA MÁS PEQUEÑO Y ENCIMA
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    const healthText = `${this.currentHealth}/${this.maxHealth}`;
    const textX = this.boss.x + this.boss.width / 2;
    const textY = y + barHeight + 18; // Texto debajo de la barra

    // Contorno negro
    ctx.strokeText(healthText, textX, textY);
    // Texto blanco
    ctx.fillText(healthText, textX, textY);

    // 🔥 INDICADOR DE FASE MÁS PEQUEÑO
    ctx.font = "bold 8px Arial";
    ctx.fillStyle = this.isImmune ? "#00FFFF" : "#FFD700";
    const phaseText = this.isImmune
      ? `INMUNE - ${this.currentPhase}`
      : this.currentPhase;

    // Contorno
    ctx.strokeText(phaseText, textX, textY - 12);
    // Texto
    ctx.fillText(phaseText, textX, textY - 12);

    // 🔥 INDICADOR DE INMUNIDAD VISUAL
    if (this.isImmune) {
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x - 3, y - 3, barWidth + 6, barHeight + 6);
      ctx.setLineDash([]); // Restaurar línea sólida
    }
  },

  /**
   * 🔥 NUEVO: Inicia secuencia inteligente de minas
   */
  startMineSequence() {
    console.log("💣 Boss iniciando secuencia de minas inteligente");

    this.miningPhase = true;
    this.mineTimer = 0;

    // Volverse inmune durante toda la secuencia
    this.makeImmune(480); // 8 segundos de inmunidad total

    // Ir al centro para lanzar minas
    this.teleportToCenter();

    UI.showScreenMessage("💣 ¡SECUENCIA DE MINAS ACTIVADA!", "#FF8800");

    // Programar 6 minas con patrón inteligente
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.spawnIntelligentMine();
      }, i * 800); // Una mina cada 0.8 segundos
    }

    // Terminar secuencia después de las explosiones
    setTimeout(() => {
      this.endMineSequence();
    }, 8000);
  },

  /**
   * 🔥 Crear mina inteligente con zona de peligro
   */
  spawnIntelligentMine() {
    const canvas = window.getCanvas();
    const playerPos = Player.getPosition();

    // Posiciones estratégicas que bloquean rutas de escape
    const strategicPositions = [
      // Cerca del jugador pero no encima
      { x: playerPos.x + 100, y: playerPos.y + 100 },
      { x: playerPos.x - 100, y: playerPos.y + 100 },
      { x: playerPos.x, y: playerPos.y + 150 },
      { x: playerPos.x, y: playerPos.y - 150 },
      // Centros estratégicos
      { x: canvas.width / 4, y: canvas.height / 2 },
      { x: (canvas.width * 3) / 4, y: canvas.height / 2 },
    ];

    const position =
      strategicPositions[this.mines.length % strategicPositions.length];

    // Ajustar posición para que esté dentro de la pantalla
    const adjustedX = Math.max(60, Math.min(canvas.width - 60, position.x));
    const adjustedY = Math.max(60, Math.min(canvas.height - 60, position.y));

    const mine = {
      x: adjustedX - 20,
      y: adjustedY - 20,
      width: 40,
      height: 40,
      timer: 240, // 4 segundos para explotar
      armed: false,
      blinkTimer: 0,

      // Zona de peligro más clara
      dangerRadius: 100,
      showDangerZone: true,
      warningPhase: false, // Para cambiar color antes de explotar
    };

    this.mines.push(mine);

    // Efectos visuales mejorados
    UI.createParticleEffect(adjustedX, adjustedY, "#FF8800", 20);
    UI.showScreenMessage("💣 ¡MINA COLOCADA!", "#FF8800");

    console.log(`💣 Mina inteligente colocada en (${adjustedX}, ${adjustedY})`);
  },

  /**
   * 🔥 Actualizar minas inteligentes
   */
  updateIntelligentMines() {
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mine = this.mines[i];

      mine.timer--;
      mine.blinkTimer++;

      // Armar mina después de 1 segundo
      if (!mine.armed && mine.timer <= 180) {
        mine.armed = true;
        console.log("💣 Mina armada y peligrosa");
      }

      // Fase de advertencia (últimos 2 segundos)
      if (mine.timer <= 120) {
        mine.warningPhase = true;
      }

      // Explotar mina
      if (mine.timer <= 0) {
        this.explodeIntelligentMine(i);
      }
    }
  },

  /**
   * 🔥 Explosión inteligente de mina
   */
  explodeIntelligentMine(index) {
    if (index < 0 || index >= this.mines.length) return;

    const mine = this.mines[index];

    console.log(`💥 Mina inteligente explotando en (${mine.x}, ${mine.y})`);

    // Efecto visual más espectacular
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        UI.createParticleEffect(
          mine.x + mine.width / 2,
          mine.y + mine.height / 2,
          i % 2 === 0 ? "#FF8800" : "#FF0000",
          30
        );
      }, i * 100);
    }

    // Verificar daño al jugador
    const player = Player;
    const playerPos = player.getPosition();
    const playerSize = player.getSize();

    const distance = Math.sqrt(
      Math.pow(
        playerPos.x + playerSize.width / 2 - (mine.x + mine.width / 2),
        2
      ) +
        Math.pow(
          playerPos.y + playerSize.height / 2 - (mine.y + mine.height / 2),
          2
        )
    );

    if (distance < mine.dangerRadius) {
      player.takeDamage();
      UI.showScreenMessage("💥 ¡DAÑADO POR MINA!", "#FF0000");
      console.log("💥 Jugador dañado por explosión de mina");
    }

    // Eliminar mina
    this.mines.splice(index, 1);

    AudioManager.playSound("explosion");
  },

  /**
   * 🔥 Terminar secuencia de minas
   */
  endMineSequence() {
    console.log("💣 Secuencia de minas terminada");

    this.miningPhase = false;
    this.mines = []; // Limpiar minas restantes

    UI.showScreenMessage("⚔️ ¡BOSS VULNERABLE OTRA VEZ!", "#00FF00");

    // El boss vuelve a ser vulnerable y móvil
    this.isImmune = false;
    this.immunityTimer = 0;
  },

  /**
   * 🔥 Minas rápidas para fase final
   */
  spawnQuickMines(count) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const canvas = window.getCanvas();

        const mine = {
          x: 100 + Math.random() * (canvas.width - 200),
          y: 100 + Math.random() * (canvas.height - 200),
          width: 30,
          height: 30,
          timer: 180, // 3 segundos solamente
          armed: true,
          blinkTimer: 0,
          dangerRadius: 80,
          showDangerZone: true,
          warningPhase: true, // Inmediatamente en advertencia
        };

        this.mines.push(mine);
        UI.createParticleEffect(mine.x + 15, mine.y + 15, "#FF4400", 15);
      }, i * 200);
    }

    UI.showScreenMessage("💣 ¡MINAS RÁPIDAS!", "#FF4400");
  },

  /**
   * 🔥 NUEVO: Sistema de balas estilo Touhou
   */
  startBulletPattern() {
    const patterns = ["spiral", "walls", "cross", "rain"];
    this.patternType = patterns[Math.floor(Math.random() * patterns.length)];

    console.log(`🌟 Boss iniciando patrón: ${this.patternType}`);

    // Volverse inmune durante el patrón
    this.makeImmune(300); // 5 segundos

    // Ir al centro para mejor posicionamiento
    this.teleportToCenter();

    switch (this.patternType) {
      case "spiral":
        this.createSpiralPattern();
        break;
      case "walls":
        this.createWallPattern();
        break;
      case "cross":
        this.createCrossPattern();
        break;
      case "rain":
        this.createRainPattern();
        break;
    }

    UI.showScreenMessage(
      `🌟 PATRÓN ${this.patternType.toUpperCase()}!`,
      "#FFD700"
    );
  },

  /**
   * 🔥 Patrón espiral de balas
   */
  createSpiralPattern() {
    let angle = 0;
    let spiralTimer = 0;

    const spiralInterval = setInterval(() => {
      if (!this.active || spiralTimer > 240) {
        // 4 segundos
        clearInterval(spiralInterval);
        return;
      }

      // Crear 2 balas por frame (menos densidad)
      for (let i = 0; i < 2; i++) {
        const bulletAngle = angle + (i * Math.PI * 2) / 2;
        this.createTouhouBullet(bulletAngle, 0.002, "#FF6B6B"); // Más lento
      }
      angle += 0.15; // Rotación más lenta
      spiralTimer++;
    }, 50); // Cada 50ms
  },

  /**
   * 🔥 Patrón de muros con espacios
   */
  createWallPattern() {
    let wallCount = 0;

    const wallInterval = setInterval(() => {
      if (!this.active || wallCount >= 4) {
        clearInterval(wallInterval);
        return;
      }

      this.createWallOfBullets();
      wallCount++;
    }, 1000); // Un muro cada segundo
  },

  /**
   * 🔥 Crear muro de balas con espacios para esquivar
   */
  createWallOfBullets() {
    const canvas = window.getCanvas();
    const bulletCount = 12;
    const playerPos = Player.getPosition();

    // Crear espacio MÁS GRANDE para esquivar
    const safeZoneStart =
      Math.floor((playerPos.x / canvas.width) * bulletCount) - 2;
    const safeZoneEnd = safeZoneStart + 4; // Espacio más amplio

    for (let i = 0; i < bulletCount; i++) {
      // No crear balas en la zona segura
      if (i >= safeZoneStart && i <= safeZoneEnd) continue;

      const x = (canvas.width / bulletCount) * i;
      const bullet = {
        x: x,
        y: -20,
        width: 12,
        height: 12,
        velocityX: 0,
        velocityY: 0.004 * canvas.height,
        color: "#4ECDC4",
        life: 300,
        type: "touhou",
      };

      this.bulletPatterns.push(bullet);
    }

    console.log("🧱 Muro de balas creado con zona segura");
  },

  /**
   * 🔥 Patrón en cruz
   */
  createCrossPattern() {
    let crossTimer = 0;

    const crossInterval = setInterval(() => {
      if (!this.active || crossTimer > 180) {
        // 3 segundos
        clearInterval(crossInterval);
        return;
      }

      // Disparar en 4 direcciones principales
      const directions = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

      directions.forEach((angle) => {
        this.createTouhouBullet(angle, 0.004, "#9B59B6");
      });

      // Direcciones diagonales cada 30 frames
      if (crossTimer % 30 === 0) {
        const diagonals = [
          Math.PI / 4,
          (3 * Math.PI) / 4,
          (5 * Math.PI) / 4,
          (7 * Math.PI) / 4,
        ];
        diagonals.forEach((angle) => {
          this.createTouhouBullet(angle, 0.003, "#E74C3C");
        });
      }

      crossTimer++;
    }, 100); // Cada 100ms
  },

  /**
   * 🔥 Patrón de lluvia dirigida
   */
  createRainPattern() {
    let rainTimer = 0;

    const rainInterval = setInterval(() => {
      if (!this.active || rainTimer > 200) {
        // 3.3 segundos
        clearInterval(rainInterval);
        return;
      }

      // Disparar hacia la posición del jugador con dispersión
      const playerPos = Player.getPosition();
      const playerSize = Player.getSize();

      const targetX = playerPos.x + playerSize.width / 2;
      const targetY = playerPos.y + playerSize.height / 2;

      const bossCenterX = this.boss.x + this.boss.width / 2;
      const bossCenterY = this.boss.y + this.boss.height / 2;

      const baseAngle = Math.atan2(
        targetY - bossCenterY,
        targetX - bossCenterX
      );

      // Crear 3 balas con ligera dispersión
      for (let i = 0; i < 3; i++) {
        const spreadAngle = baseAngle + (Math.random() - 0.5) * 0.5;
        this.createTouhouBullet(spreadAngle, 0.005, "#F39C12");
      }

      rainTimer++;
    }, 80); // Cada 80ms
  },

  /**
   * 🔥 Crear bala Touhou individual
   */
  createTouhouBullet(angle, speed, color) {
    const canvas = window.getCanvas();
    const bossCenterX = this.boss.x + this.boss.width / 2;
    const bossCenterY = this.boss.y + this.boss.height / 2;

    const bullet = {
      x: bossCenterX - 6,
      y: bossCenterY - 6,
      width: 12,
      height: 12,
      velocityX: Math.cos(angle) * speed * canvas.width,
      velocityY: Math.sin(angle) * speed * canvas.height,
      color: color,
      life: 500, // 🔥 Más vida para que crucen la pantalla
      type: "touhou",
      glowIntensity: 0,
    };
    this.bulletPatterns.push(bullet);
  },

  /**
   * 🔥 CORREGIDO: Actualizar balas Touhou con mejor manejo de muerte
   */
  updateBulletPatterns() {
    const canvas = window.getCanvas();

    for (let i = this.bulletPatterns.length - 1; i >= 0; i--) {
      const bullet = this.bulletPatterns[i];

      // Mover bala
      bullet.x += bullet.velocityX;
      bullet.y += bullet.velocityY;
      bullet.life--;

      // Efecto de brillo
      bullet.glowIntensity = 0.5 + Math.sin(window.getGameTime() * 0.3) * 0.3;

      // 🔥 VERIFICACIÓN MEJORADA: Solo verificar colisión si el jugador está vivo
      if (Player.getLives() > 0) {
        const playerPos = Player.getPosition();
        const playerSize = Player.getSize();

        // Verificar colisión con hitbox más precisa
        if (
          bullet.x < playerPos.x + playerSize.width &&
          bullet.x + bullet.width > playerPos.x &&
          bullet.y < playerPos.y + playerSize.height &&
          bullet.y + bullet.height > playerPos.y
        ) {
          console.log("💥 Bala Touhou impactó al jugador");

          // Eliminar la bala ANTES de aplicar daño
          this.bulletPatterns.splice(i, 1);

          // 🔥 APLICAR DAÑO Y VERIFICAR RESULTADO
          const playerDied = Player.takeDamage();

          // 🔥 VERIFICACIÓN INMEDIATA: Si el jugador murió, activar game over
          if (Player.getLives() <= 0) {
            console.log(
              "💀 Jugador murió por bala Touhou - activando game over inmediatamente"
            );
            // Usar setTimeout para evitar conflictos de estado
            setTimeout(() => {
              if (window.gameOver && typeof window.gameOver === "function") {
                window.gameOver();
              }
            }, 50); // 50ms de delay para asegurar que el estado se actualice
            return; // Salir inmediatamente de la función
          }

          continue; // Continuar con la siguiente bala
        }
      }

      // Eliminar balas fuera de pantalla o sin vida
      if (
        bullet.life <= 0 ||
        bullet.x < -50 ||
        bullet.x > canvas.width + 50 ||
        bullet.y < -50 ||
        bullet.y > canvas.height + 50
      ) {
        this.bulletPatterns.splice(i, 1);
      }
    }
  },

  /**
   * 🔥 Dibujar balas Touhou
   */
  drawBulletPatterns(ctx) {
    for (const bullet of this.bulletPatterns) {
      ctx.save();

      // Efecto de brillo
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8 + bullet.glowIntensity * 5;

      // Dibujar bala circular con brillo
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(
        bullet.x + bullet.width / 2,
        bullet.y + bullet.height / 2,
        bullet.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Núcleo brillante
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(
        bullet.x + bullet.width / 2,
        bullet.y + bullet.height / 2,
        bullet.width / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.restore();
    }
  },

  /**
   * 🔥 AGREGAR: Movimiento agresivo para fase final
   */
  aggressiveMovement() {
    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();

    const playerCenterX = playerPos.x + playerSize.width / 2;
    const playerCenterY = playerPos.y + playerSize.height / 2;
    const bossCenterX = this.boss.x + this.boss.width / 2;
    const bossCenterY = this.boss.y + this.boss.height / 2;

    const dx = playerCenterX - bossCenterX;
    const dy = playerCenterY - bossCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Movimiento más agresivo y rápido
    const speed = this.boss.moveSpeed * 2.0;
    this.boss.velocityX += (dx / distance) * speed * 0.4;
    this.boss.velocityY += (dy / distance) * speed * 0.4;

    // Límite de velocidad más alto
    const maxSpeed = this.boss.moveSpeed * 3;
    const currentSpeed = Math.sqrt(
      this.boss.velocityX ** 2 + this.boss.velocityY ** 2
    );
    if (currentSpeed > maxSpeed) {
      this.boss.velocityX = (this.boss.velocityX / currentSpeed) * maxSpeed;
      this.boss.velocityY = (this.boss.velocityY / currentSpeed) * maxSpeed;
    }
  },

  // ======================================================
  // UTILIDADES Y GETTERS
  // ======================================================

  /**
   * Verifica colisión entre dos objetos
   */
  checkCollision(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  },

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
  getCurrentPhase() {
    return this.currentPhase;
  },
  getMines() {
    return this.mines;
  },
  isImmune() {
    return this.isImmune;
  },

  /**
   * 🔥 CORREGIDO: Actualizar método reset para incluir limpieza completa
   */
  reset() {
    // Usar el reset forzado
    this.forceReset();

    // Reset de variables base
    this.boss = null;
    this.currentHealth = 200;
    this.maxHealth = 200;
    this.currentPhase = "SUMMONING";
    this.phaseTimer = 0;
    this.bulletPatterns = [];
    this.patternType = "none";
    this.isImmune = false;
    this.immunityTimer = 0;
    this.mines = [];
    this.mineTimer = 0;
    this.miningPhase = false;
    this.lastCommentTime = 0;
    this.commentCooldown = 300;

    console.log("👹 Sistema del boss COMPLETAMENTE reseteado");
  },

  /**
   * 🔥 NUEVO: Sistema de comentarios sarcásticos del boss
   */
  /**
   * 🔥 SISTEMA DE COMENTARIOS ÉPICOS Y SOMBRÍOS DEL BOSS
   */
  bossComments: {
    entrada: [
      "¡Scythe Society será destruida para siempre!",
      "¡Vengo por la reina Hell y toda su legión!",
      "¡Prepárense para la aniquilación total!",
      "¡Su clan patético no durará ni un minuto!",
      "¡Hell pagará por su insolencia con sangre!",
      "¡Soy la pesadilla que acecha sus sueños!",
      "¡El reino de las sombras me pertenece!",
    ],
    combate: [
      "¡Son unos mancos patéticos!",
      "¡Scythe Society, más como Scythe Pathetic!",
      "¡Hell debería entrenar mejor a sus lacayos!",
      "¡Qué decepcionante resistencia ofrecen!",
      "¡Ni siquiera saben apuntar correctamente!",
      "¡Mi abuela muerta disparaba mejor!",
      "¡Scythe Society = Scythe Sorry!",
      "¡Hell te abandonará como a todos!",
      "¡Toda la culpa es de Red por ser tan débil!",
      "¡Eso es demasiado heterosexual de tu parte!",
      "¡Sus balas son como cosquillas de bebé!",
      "¡Patéticos mortales sin esperanza!",
      "¡Esto es todo lo que tienen?! ¡Ja!",
      "¡Hell eligió mal a sus campeones!",
      "¡Ni sus ancestros podrán salvarlos!",
      "¡Scythe Society, más como Cry Society!",
      "¡Deberían rendirse ahora y suplicar!",
      "¡Soy la oscuridad que devora la luz!",
      "¡Sus almas me pertenecen ahora!",
      "¡El terror apenas ha comenzado!",
      "¡Pronto conocerán el verdadero miedo!",
      "¡Su sangre manchará estas tierras!",
      "¡La muerte será su único escape!",
      "¡Hell no podrá protegerlos por siempre!",
      "¡Soy el eco de sus peores pesadillas!",
    ],
    victoria_boss: [
      "¡Hell, aquí voy por ti, mi amor perdido!",
      "¡Scythe Society ha caído en las tinieblas!",
      "¡Vuelvan pronto... si es que pueden regenerarse!",
      "¡Digan adiós a su preciada Hell para siempre!",
      "¡La oscuridad prevalece sobre la luz!",
      "¡Sus almas ahora me pertenecen!",
      "¡El reino de Hell será mío!",
    ],
    derrota_boss: [
      "¡Esto no ha terminado, volveré!",
      "¡Volveré más fuerte desde las profundidades!",
      "¡Hell... me las pagará con creces!",
      "¡No me olvidaré de esto jamás!",
      "¡Mi venganza será eterna y sombría!",
      "¡Las sombras me protegerán hasta mi regreso!",
      "¡Pronto me regeneraré en el abismo!",
      "¡Hell no ha visto lo último de mí!",
      "¡Scythe Society... nos veremos de nuevo!",
      "¡La oscuridad nunca puede ser derrotada!",
      "¡Desde el inframundo planearé mi venganza!",
      "¡Red será el primero en caer cuando regrese!",
    ],
  },

  /**
   * 🔥 CORREGIDO: Sistema de comentarios que usa el nuevo método
   */
  sayRandomComment(situation) {
    const currentTime = window.getGameTime();
    const cooldown = situation === "combate" ? 180 : 300;

    if (currentTime - this.lastCommentTime < cooldown) return;

    const comments = this.bossComments[situation];
    if (!comments || comments.length === 0) return;

    const randomComment = comments[Math.floor(Math.random() * comments.length)];

    // 🔥 USAR EL NUEVO MÉTODO DE MENSAJE ENCIMA DEL BOSS
    this.showBossMessage(randomComment);

    this.lastCommentTime = currentTime;
    console.log(`👹 Boss dice: ${randomComment}`);
  },

  /**
   * 🔥 NUEVO: Muestra comentario del boss con estilo épico y sombrío
   */
  showBossComment(comment) {
    const commentElement = document.createElement("div");
    commentElement.style.cssText = `
    position: fixed;
    top: 15%;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(139, 0, 0, 0.9) 100%);
    color: #FF0000;
    font-size: 18px;
    font-weight: bold;
    font-family: var(--gothic-font), cursive;
    text-align: center;
    padding: 15px 25px;
    border-radius: 15px;
    border: 3px solid #8B0000;
    box-shadow: 
      0 0 30px rgba(255, 0, 0, 0.8),
      0 0 50px rgba(139, 0, 0, 0.6),
      inset 0 0 20px rgba(0, 0, 0, 0.8);
    text-shadow: 
      -2px -2px 0 #000,
      2px -2px 0 #000,
      -2px 2px 0 #000,
      2px 2px 0 #000,
      0 0 10px #FF0000,
      0 0 20px #FF0000,
      0 0 30px #FF0000;
    z-index: 2000;
    max-width: 80vw;
    word-wrap: break-word;
    backdrop-filter: blur(5px);
    animation: bossCommentAppear 0.5s ease-out;
  `;

    commentElement.innerHTML = `👹 "${comment}" 👹`;
    document.body.appendChild(commentElement);

    // Eliminar después de 4 segundos
    setTimeout(() => {
      if (commentElement.parentNode) {
        commentElement.style.opacity = "0";
        commentElement.style.transform = "translateX(-50%) translateY(-20px)";

        setTimeout(() => {
          if (commentElement.parentNode) {
            document.body.removeChild(commentElement);
          }
        }, 500);
      }
    }, 4000);
  },

  // ======================================================
  // 🔥 FASE DEL HILO ROJO - CICLO CORRECTO
  // ======================================================

  /**
   * 🔥 CORREGIDO: Ralentizar SÚPER LENTO al jugador en fase hilo rojo
   */
  startRedLinePhase() {
    console.log("🔴 === INICIANDO FASE DEL HILO ROJO ===");

    this.redLinePhase = true;
    this.isImmune = true;
    this.immunityTimer = 9999;

    // Detener movimiento del boss
    this.boss.velocityX = 0;
    this.boss.velocityY = 0;

    // 🔥 RALENTIZAR SÚPER MEGA LENTO AL JUGADOR
    Player.moveSpeed = 0.05; // Era 0.1, ahora 0.05 (SÚPER LENTO)
    console.log("🐌 Jugador SÚPER MEGA LENTO durante fase del hilo rojo");

    UI.showScreenMessage("🔴 FASE DEL HILO ROJO 🔴", "#FF0000");
    this.showBossMessage("¡Sigue mi rastro mortal!");

    setTimeout(() => {
      this.startRedLineCycle();
    }, 1000);
  },

  /**
   * Inicia un ciclo completo de hilo rojo
   */
  startRedLineCycle() {
    console.log("🔄 Iniciando nuevo ciclo de hilo rojo");

    // Generar nueva línea aleatoria
    this.generateSimpleRedLine();

    // PASO 1: Mostrar línea brevemente y que desaparezca
    this.showLineQuickly();
  },

  /**
   * Muestra la línea brevemente y la hace desaparecer
   */
  showLineQuickly() {
    console.log("🔴 Mostrando línea rápidamente...");

    this.showingPreview = true;

    // Mostrar por solo 1 segundo
    setTimeout(() => {
      this.showingPreview = false;
      console.log("🔴 Línea desaparecida - boss iniciará movimiento");

      // Inmediatamente después iniciar movimiento del boss
      setTimeout(() => {
        this.startRedLineMovement();
      }, 200); // Pequeño delay para transición
    }, 1000); // Solo 1 segundo para ver la línea
  },

  /**
   * Inicia el movimiento del boss por la línea
   */
  startRedLineMovement() {
    if (this.redLinePath.length === 0) {
      console.error("🔴 Error: No hay línea roja generada");
      this.endRedLinePhase();
      return;
    }

    this.redLineIndex = 0;
    this.redLineSpeed = 4; // Velocidad constante
    this.redLineMoving = true;

    // Posicionar boss al inicio de la línea
    const startPoint = this.redLinePath[0];
    this.boss.x = startPoint.x - this.boss.width / 2;
    this.boss.y = startPoint.y - this.boss.height / 2;

    console.log("🔴 Boss iniciando movimiento por la línea");
  },

  /**
   * Actualiza la fase del hilo rojo
   */
  updateRedLine() {
    if (!this.redLineMoving) return;

    // Verificar si completó el recorrido
    if (this.redLineIndex >= this.redLinePath.length - 1) {
      this.endRedLineMovement();
      return;
    }

    // Mover el boss por la línea
    const currentPoint = this.redLinePath[this.redLineIndex];
    this.boss.x = currentPoint.x - this.boss.width / 2;
    this.boss.y = currentPoint.y - this.boss.height / 2;

    // Verificar colisión con el jugador
    if (this.checkCollisionWithPlayer()) {
      console.log("💥 Jugador golpeado por el hilo rojo");

      // Aplicar daño al jugador
      Player.takeDamage();

      // Efecto visual
      UI.createParticleEffect(
        this.boss.x + this.boss.width / 2,
        this.boss.y + this.boss.height / 2,
        "#FF0000",
        20
      );
    }

    // Avanzar en la línea
    this.redLineIndex += this.redLineSpeed;
  },

  /**
   * Termina el movimiento de la línea (no la fase completa)
   */
  endRedLineMovement() {
    console.log("🔴 Boss terminó el recorrido - iniciando pausa vulnerable");

    this.redLineMoving = false;
    this.redLinePath = []; // Limpiar la línea anterior
    this.redLineIndex = 0;

    // Boss se vuelve vulnerable por 1 segundo
    this.isImmune = false;
    this.immunityTimer = 0;

    // Detener movimiento del boss
    this.boss.velocityX = 0;
    this.boss.velocityY = 0;

    // Mensaje de vulnerable + comentario aleatorio del boss
    UI.showScreenMessage("⚔️ ¡BOSS VULNERABLE! (1s)", "#00FF00");
    this.sayRandomComment("combate"); // Comentario aleatorio

    // Después de 1 segundo, verificar si continúa o va a Yan Ken Po
    setTimeout(() => {
      const healthPercentage = this.currentHealth / this.maxHealth;

      if (healthPercentage <= 0.03) {
        // Ir a fase final Yan Ken Po
        console.log("🎮 Vida muy baja - iniciando Yan Ken Po");
        this.endRedLinePhase(); // Limpiar fase de hilo rojo
        this.startFinalPhase();
      } else {
        // Continuar con otro ciclo de hilo rojo
        console.log("🔄 Continuando con nuevo ciclo de hilo rojo");
        this.isImmune = true; // Volver a ser inmune
        this.immunityTimer = 9999;

        setTimeout(() => {
          this.startRedLineCycle(); // Nuevo ciclo
        }, 500); // Pequeño delay antes del siguiente ciclo
      }
    }, 1000); // 1 segundo vulnerable
  },

  /**
   * 🔥 CORREGIDO: Terminar fase hilo rojo y restaurar velocidad
   */
  endRedLinePhase() {
    console.log("🔴 Terminando COMPLETAMENTE la fase del hilo rojo");

    this.redLinePhase = false;
    this.redLineMoving = false;
    this.showingPreview = false;
    this.redLinePath = [];
    this.redLineIndex = 0;

    // 🔥 RESTAURAR velocidad normal del jugador SIEMPRE
    Player.moveSpeed = 1.0;
    console.log("🏃 Velocidad del jugador restaurada a normal");

    // Boss se vuelve vulnerable
    this.isImmune = false;
    this.immunityTimer = 0;
  },

  /**
   * 🔥 CORREGIDO: Manejo de pérdida en Yan Ken Po
   */
  handleYanKenPoLoss() {
    UI.showScreenMessage("¡PERDISTE! Nueva fase aleatoria", "#FF0000");
    console.log("🎮 Yan Ken Po perdido - iniciando fase aleatoria");

    // Limpiar sistema Yan Ken Po
    this.endYanKenPoPhase();
    this.yanKenPoPhase = false;
    this.yanKenPoRound = 0;

    // 🔥 SELECCIONAR FASE ALEATORIA
    const phases = ["SUMMONING", "MINES", "BULLETS", "REDLINE"];
    const randomPhase = phases[Math.floor(Math.random() * phases.length)];

    console.log(`🎲 Fase aleatoria seleccionada: ${randomPhase}`);

    setTimeout(() => {
      if (randomPhase === "REDLINE") {
        this.startRedLinePhase();
      } else {
        this.changeIntelligentPhase(randomPhase);
        this.phaseActive = true;
        this.phaseTimer = 0;
      }
    }, 2000);
  },

  /**
   * Dibuja la línea roja (solo durante preview breve)
   */
  drawRedLine(ctx) {
    if (this.redLinePath.length === 0) return;

    ctx.save();

    // Solo mostrar línea durante el preview rápido
    if (this.showingPreview) {
      // Línea roja brillante para memorizar rápidamente
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 8;
      ctx.shadowColor = "#FF0000";
      ctx.shadowBlur = 20;

      ctx.beginPath();
      for (let i = 0; i < this.redLinePath.length; i++) {
        const point = this.redLinePath[i];
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.stroke();

      // Efecto de parpadeo intenso para llamar la atención
      const pulse = Math.sin(window.getGameTime() * 0.5) * 0.4 + 0.6;
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = "#FFFF00";
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // NO mostrar estela durante el movimiento para mayor dificultad
    // El jugador debe recordar la línea

    ctx.restore();
  },

  // ======================================================
  // FUNCIONES DE LÍNEAS ALEATORIAS (sin cambios)
  // ======================================================

  /**
   * Genera una línea completamente aleatoria (sin patrones)
   */
  generateSimpleRedLine() {
    const canvas = window.getCanvas();
    this.redLinePath = [];

    console.log("🔴 Generando línea COMPLETAMENTE ALEATORIA");

    // Generar línea aleatoria verdadera
    this.generateTrueRandomLine(canvas);
  },

  /**
   * Genera una línea verdaderamente aleatoria
   */
  generateTrueRandomLine(canvas) {
    // Punto de inicio aleatorio en los bordes
    const startPoint = this.getRandomBorderPoint(canvas);

    // Número aleatorio de segmentos (entre 3 y 8)
    const segments = 3 + Math.floor(Math.random() * 6);

    console.log(`🔴 Creando línea aleatoria con ${segments} segmentos`);

    let currentX = startPoint.x;
    let currentY = startPoint.y;

    // Agregar punto inicial
    this.redLinePath.push({ x: currentX, y: currentY });

    // Generar segmentos aleatorios
    for (let i = 0; i < segments; i++) {
      const segment = this.generateRandomSegment(
        canvas,
        currentX,
        currentY,
        i,
        segments
      );

      // Agregar todos los puntos del segmento
      for (const point of segment) {
        this.redLinePath.push(point);
      }

      // Actualizar posición actual al final del segmento
      if (segment.length > 0) {
        const lastPoint = segment[segment.length - 1];
        currentX = lastPoint.x;
        currentY = lastPoint.y;
      }
    }

    console.log(`🔴 Línea generada con ${this.redLinePath.length} puntos`);
  },

  /**
   * Obtiene un punto aleatorio en los bordes de la pantalla
   */
  getRandomBorderPoint(canvas) {
    const border = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left

    switch (border) {
      case 0: // Top
        return { x: Math.random() * canvas.width, y: 0 };
      case 1: // Right
        return { x: canvas.width, y: Math.random() * canvas.height };
      case 2: // Bottom
        return { x: Math.random() * canvas.width, y: canvas.height };
      case 3: // Left
        return { x: 0, y: Math.random() * canvas.height };
      default:
        return { x: 0, y: 0 };
    }
  },

  /**
   * Genera un segmento aleatorio desde la posición actual
   */
  generateRandomSegment(canvas, startX, startY, segmentIndex, totalSegments) {
    const segment = [];

    // Determinar tipo de segmento aleatorio
    const segmentType = Math.floor(Math.random() * 4);
    // 0 = línea recta, 1 = curva suave, 2 = zigzag corto, 3 = arco

    // Punto de destino aleatorio
    const endX = Math.random() * canvas.width;
    const endY = Math.random() * canvas.height;

    // Número de puntos en este segmento (densidad aleatoria)
    const pointCount = 15 + Math.floor(Math.random() * 25); // 15-40 puntos

    switch (segmentType) {
      case 0: // Línea recta
        segment.push(
          ...this.generateStraightSegment(
            startX,
            startY,
            endX,
            endY,
            pointCount
          )
        );
        break;

      case 1: // Curva suave
        segment.push(
          ...this.generateCurvedSegment(startX, startY, endX, endY, pointCount)
        );
        break;

      case 2: // Zigzag corto
        segment.push(
          ...this.generateZigzagSegment(startX, startY, endX, endY, pointCount)
        );
        break;

      case 3: // Arco
        segment.push(
          ...this.generateArcSegment(startX, startY, endX, endY, pointCount)
        );
        break;
    }

    return segment;
  },

  /**
   * Genera un segmento de línea recta
   */
  generateStraightSegment(startX, startY, endX, endY, pointCount) {
    const points = [];

    for (let i = 0; i <= pointCount; i++) {
      const t = i / pointCount;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      points.push({ x, y });
    }

    return points;
  },

  /**
   * Genera un segmento curvo suave
   */
  generateCurvedSegment(startX, startY, endX, endY, pointCount) {
    const points = [];

    // Punto de control aleatorio para la curva
    const controlX = (startX + endX) / 2 + (Math.random() - 0.5) * 200;
    const controlY = (startY + endY) / 2 + (Math.random() - 0.5) * 200;

    for (let i = 0; i <= pointCount; i++) {
      const t = i / pointCount;

      // Curva cuadrática de Bézier
      const x =
        Math.pow(1 - t, 2) * startX +
        2 * (1 - t) * t * controlX +
        Math.pow(t, 2) * endX;
      const y =
        Math.pow(1 - t, 2) * startY +
        2 * (1 - t) * t * controlY +
        Math.pow(t, 2) * endY;

      points.push({ x, y });
    }

    return points;
  },

  /**
   * Genera un segmento con zigzag
   */
  generateZigzagSegment(startX, startY, endX, endY, pointCount) {
    const points = [];
    const amplitude = 30 + Math.random() * 50; // Amplitud del zigzag
    const frequency = 2 + Math.random() * 4; // Frecuencia del zigzag

    for (let i = 0; i <= pointCount; i++) {
      const t = i / pointCount;
      const baseX = startX + (endX - startX) * t;
      const baseY = startY + (endY - startY) * t;

      // Añadir oscilación perpendicular
      const perpX =
        -(endY - startY) /
        Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const perpY =
        (endX - startX) /
        Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

      const offset = Math.sin(t * Math.PI * frequency) * amplitude;
      const x = baseX + perpX * offset;
      const y = baseY + perpY * offset;

      points.push({ x, y });
    }

    return points;
  },

  /**
   * Genera un segmento en arco
   */
  generateArcSegment(startX, startY, endX, endY, pointCount) {
    const points = [];

    // Centro del arco (desplazado aleatoriamente)
    const centerX = (startX + endX) / 2 + (Math.random() - 0.5) * 150;
    const centerY = (startY + endY) / 2 + (Math.random() - 0.5) * 150;

    // Radio del arco
    const radiusStart = Math.sqrt(
      Math.pow(startX - centerX, 2) + Math.pow(startY - centerY, 2)
    );
    const radiusEnd = Math.sqrt(
      Math.pow(endX - centerX, 2) + Math.pow(endY - centerY, 2)
    );

    // Ángulos
    const angleStart = Math.atan2(startY - centerY, startX - centerX);
    const angleEnd = Math.atan2(endY - centerY, endX - centerX);

    // Determinar la dirección del arco
    let angleDiff = angleEnd - angleStart;
    if (Math.abs(angleDiff) > Math.PI) {
      angleDiff =
        angleDiff > 0 ? angleDiff - 2 * Math.PI : angleDiff + 2 * Math.PI;
    }

    for (let i = 0; i <= pointCount; i++) {
      const t = i / pointCount;
      const angle = angleStart + angleDiff * t;
      const radius = radiusStart + (radiusEnd - radiusStart) * t;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      points.push({ x, y });
    }

    return points;
  },

  // ======================================================
  // 🔥 NUEVA FASE FINAL: YAN KEN PO
  // ======================================================

  startFinalPhase() {
    console.log("🎮 Iniciando fase final: YAN KEN PO");

    this.currentPhase = "FINAL";
    this.yanKenPoPhase = true;
    this.yanKenPoRound = 0;
    this.isImmune = true;
    this.immunityTimer = 9999;

    // Limpiar otros sistemas
    this.mines = [];
    this.bulletPatterns = [];

    // Mover al centro
    this.teleportToCenter();

    UI.showScreenMessage("🎮 ¡FASE FINAL: YAN KEN PO!", "#FFD700");

    // Crear botones después de un delay
    setTimeout(() => {
      this.createYanKenPoButtons();
    }, 1000);
  },

  /**
   * 🔥 CORREGIDO: Crear botones Yan Ken Po encima del boss - CUADRADOS
   */
  createYanKenPoButtons() {
    const canvas = window.getCanvas();

    // 🔥 POSICIÓN ENCIMA DEL BOSS
    const bossX = this.boss.x + this.boss.width / 2;
    const bossY = this.boss.y - 120; // Encima del boss

    // Crear contenedor de botones
    const container = document.createElement("div");
    container.id = "yankenpo-container";
    container.style.cssText = `
    position: fixed;
    top: ${bossY}px;
    left: ${bossX - 150}px;
    display: flex;
    gap: 15px;
    z-index: 2000;
    transform: translateX(-50%);
  `;

    // 🔥 BOTONES CUADRADOS
    this.yanKenPoChoices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.innerHTML = `
      <div style="font-size: 30px; margin-bottom: 5px;">${choice}</div>
      <div style="font-size: 14px; font-weight: bold;">${index + 1}</div>
    `;
      button.style.cssText = `
      width: 80px;
      height: 80px;
      border-radius: 8px;
      border: 3px solid #FFD700;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    `;

      button.onmouseover = () => {
        button.style.transform = "scale(1.1)";
        button.style.boxShadow = "0 0 15px #FFD700";
      };

      button.onmouseout = () => {
        button.style.transform = "scale(1)";
        button.style.boxShadow = "none";
      };

      button.onclick = () => this.playerChooseYanKenPo(index);
      container.appendChild(button);
    });

    document.body.appendChild(container);

    // 🔥 LISTENER DE TECLADO MEJORADO Y CORREGIDO
    this.yanKenPoKeyListener = (e) => {
      if (this.playerChoice !== null || !this.yanKenPoPhase) return;

      console.log(
        `🎮 Tecla detectada: "${e.key}" | Código: "${e.code}" | KeyCode: ${e.keyCode}`
      );

      let choiceIndex = -1;

      // 🔥 DETECCIÓN COMPLETA DE TECLAS 1, 2, 3
      if (
        e.key === "1" ||
        e.code === "Digit1" ||
        e.code === "Numpad1" ||
        e.keyCode === 49 ||
        e.which === 49
      ) {
        choiceIndex = 0; // Piedra
        console.log("🎮 PIEDRA seleccionada (1)");
      } else if (
        e.key === "2" ||
        e.code === "Digit2" ||
        e.code === "Numpad2" ||
        e.keyCode === 50 ||
        e.which === 50
      ) {
        choiceIndex = 1; // Papel
        console.log("🎮 PAPEL seleccionado (2)");
      } else if (
        e.key === "3" ||
        e.code === "Digit3" ||
        e.code === "Numpad3" ||
        e.keyCode === 51 ||
        e.which === 51
      ) {
        choiceIndex = 2; // Tijera
        console.log("🎮 TIJERA seleccionada (3)");
      }

      if (choiceIndex !== -1) {
        e.preventDefault();
        e.stopPropagation();
        this.playerChooseYanKenPo(choiceIndex);
      }
    };

    // 🔥 AGREGAR LISTENER EN MÚLTIPLES EVENTOS
    document.addEventListener("keydown", this.yanKenPoKeyListener, true);
    document.addEventListener("keypress", this.yanKenPoKeyListener, true);
    window.addEventListener("keydown", this.yanKenPoKeyListener, true);

    // Desactivar controles del jugador durante Yan Ken Po
    this.originalPlayerControls = Player.setupControls;
    Player.setupControls = () => {};

    UI.showScreenMessage(
      `Ronda ${this.yanKenPoRound + 1}/3 - Presiona 1, 2 o 3`,
      "#FFFFFF"
    );
  },

  /**
   * 🔥 CORREGIDO: Validación mejorada para Yan Ken Po
   */
  playerChooseYanKenPo(choiceIndex) {
    // 🔥 VALIDACIONES ESTRICTAS
    if (!this.yanKenPoPhase) {
      console.log("🚫 Yan Ken Po no está activo");
      return;
    }

    if (!this.active) {
      console.log("🚫 Boss no está activo");
      return;
    }

    if (this.playerChoice !== null) {
      console.log("🚫 Ya se eligió una opción");
      return;
    }

    if (window.isGameEnded()) {
      console.log("🚫 El juego ha terminado");
      return;
    }

    this.playerChoice = choiceIndex;

    // Remover TODOS los listeners inmediatamente
    if (this.yanKenPoKeyListener) {
      document.removeEventListener("keydown", this.yanKenPoKeyListener, true);
      document.removeEventListener("keypress", this.yanKenPoKeyListener, true);
      window.removeEventListener("keydown", this.yanKenPoKeyListener, true);
      this.yanKenPoKeyListener = null;
    }

    // Boss elige aleatoriamente
    this.bossChoice = Math.floor(Math.random() * 3);

    // Ocultar botones inmediatamente
    const container = document.getElementById("yankenpo-container");
    if (container) {
      container.style.display = "none";
    }

    // Mostrar elecciones
    this.showYanKenPoResult();
  },

  /**
   * 🔥 NUEVO: Reset completo del boss (llamar al cambiar pantallas)
   */
  forceReset() {
    console.log("🔄 RESET FORZADO del boss");

    // Detener TODAS las fases
    this.yanKenPoPhase = false;
    this.redLinePhase = false;
    this.phaseActive = false;
    this.active = false;

    // Limpiar timers y estados
    this.playerChoice = null;
    this.bossChoice = null;
    this.yanKenPoRound = 0;

    // Limpiar listeners
    if (this.yanKenPoKeyListener) {
      document.removeEventListener("keydown", this.yanKenPoKeyListener, true);
      document.removeEventListener("keypress", this.yanKenPoKeyListener, true);
      window.removeEventListener("keydown", this.yanKenPoKeyListener, true);
      this.yanKenPoKeyListener = null;
    }

    // Restaurar controles del jugador
    if (this.originalPlayerControls) {
      Player.setupControls = this.originalPlayerControls;
    }

    // Restaurar velocidad del jugador
    Player.moveSpeed = 1.0;

    console.log("✅ Boss completamente reseteado");
  },

  /**
   * 🔥 CORREGIDO: Limpiar completamente el sistema Yan Ken Po
   */
  endYanKenPoPhase() {
    console.log("🧹 Limpiando sistema Yan Ken Po completamente");

    // Restaurar controles del jugador
    if (this.originalPlayerControls) {
      Player.setupControls = this.originalPlayerControls;
      Player.setupControls(window.getCanvas());
    }

    // 🔥 LIMPIAR TODOS LOS LISTENERS
    if (this.yanKenPoKeyListener) {
      document.removeEventListener("keydown", this.yanKenPoKeyListener, true);
      document.removeEventListener("keypress", this.yanKenPoKeyListener, true);
      window.removeEventListener("keydown", this.yanKenPoKeyListener, true);
      this.yanKenPoKeyListener = null;
    }

    // 🔥 LIMPIAR BOTONES COMPLETAMENTE
    const container = document.getElementById("yankenpo-container");
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
      console.log("✅ Botones Yan Ken Po eliminados");
    }

    // Resetear variables
    this.yanKenPoPhase = false;
    this.playerChoice = null;
    this.bossChoice = null;
  },

  /**
   * 🔥 NUEVO: Mostrar mensaje del boss encima de él (estilo comic)
   */
  showBossMessage(message) {
    // Limpiar mensaje anterior si existe
    const existingMessage = document.getElementById("boss-speech-bubble");
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageElement = document.createElement("div");
    messageElement.id = "boss-speech-bubble";

    // 🔥 POSICIÓN ENCIMA DEL BOSS
    const bossX = this.boss.x + this.boss.width / 2;
    const bossY = this.boss.y - 60; // Encima del boss

    messageElement.style.cssText = `
    position: fixed;
    top: ${bossY}px;
    left: ${bossX}px;
    transform: translateX(-50%);
    background: transparent;
    border: none;
    color: #FF0000;
    font-size: 14px;
    font-weight: bold;
    font-family: Arial, cursive;
    text-align: center;
    padding: 8px 12px;
    border-radius: 12px;
    max-width: ${this.boss.width}px;
    word-wrap: break-word;
    z-index: 1999;
    text-shadow: 
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000,
      0 0 5px #000,
      0 0 10px #FF0000;
    animation: bossMessageFloat 0.3s ease-out;
    pointer-events: none;
  `;

    messageElement.textContent = message;
    document.body.appendChild(messageElement);

    // Eliminar después de 3 segundos
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.style.opacity = "0";
        messageElement.style.transform = "translateX(-50%) translateY(-10px)";
        setTimeout(() => {
          if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
          }
        }, 300);
      }
    }, 3000);
  },

  showYanKenPoResult() {
    const choices = this.yanKenPoChoices;
    const playerEmoji = choices[this.playerChoice];
    const bossEmoji = choices[this.bossChoice];

    UI.showScreenMessage(`TÚ: ${playerEmoji} vs BOSS: ${bossEmoji}`, "#FFFFFF");

    // Determinar ganador (0=piedra, 1=papel, 2=tijera)
    let playerWins = false;

    if (this.playerChoice === this.bossChoice) {
      UI.showScreenMessage("¡EMPATE! Repite", "#FFFF00");
      setTimeout(() => this.repeatYanKenPo(), 2000);
      return;
    }

    if (
      (this.playerChoice === 0 && this.bossChoice === 2) || // Piedra vs Tijera
      (this.playerChoice === 1 && this.bossChoice === 0) || // Papel vs Piedra
      (this.playerChoice === 2 && this.bossChoice === 1)
    ) {
      // Tijera vs Papel
      playerWins = true;
    }

    if (playerWins) {
      this.handleYanKenPoWin();
    } else {
      this.handleYanKenPoLoss();
    }
  },

  handleYanKenPoWin() {
    UI.showScreenMessage("¡GANASTE! Boss -1% vida", "#00FF00");

    this.currentHealth -= 2; // 1% de 200
    this.yanKenPoRound++;

    // Verificar si el boss murió
    if (this.currentHealth <= 0) {
      this.defeat();
      return;
    }

    // Verificar si completamos las 3 rondas
    if (this.yanKenPoRound >= 3) {
      UI.showScreenMessage("¡BOSS DERROTADO!", "#FFD700");
      setTimeout(() => this.defeat(), 2000);
    } else {
      // Siguiente ronda
      setTimeout(() => this.nextYanKenPoRound(), 2000);
    }
  },

  handleYanKenPoLoss() {
    UI.showScreenMessage("¡PERDISTE! Prepárate...", "#FF0000");

    // Limpiar botones
    const container = document.getElementById("yankenpo-container");
    if (container) container.remove();

    // Volver a fase de línea roja
    this.yanKenPoPhase = false;
    setTimeout(() => this.startRedLinePhase(), 2000);
  },

  repeatYanKenPo() {
    this.playerChoice = null;
    this.bossChoice = null;

    // Mostrar botones de nuevo
    const container = document.getElementById("yankenpo-container");
    if (container) container.style.display = "flex";
  },

  nextYanKenPoRound() {
    this.playerChoice = null;
    this.bossChoice = null;

    // Recrear botones
    const oldContainer = document.getElementById("yankenpo-container");
    if (oldContainer) oldContainer.remove();

    this.createYanKenPoButtons();
  },

  updateYanKenPo() {
    // El sistema de Yan Ken Po se maneja principalmente con eventos de botones
    // Esta función puede estar vacía o manejar animaciones del boss
  },

  checkCollisionWithPlayer() {
    const player = Player;
    const playerPos = player.getPosition();
    const playerSize = player.getSize();

    return (
      this.boss.x < playerPos.x + playerSize.width &&
      this.boss.x + this.boss.width > playerPos.x &&
      this.boss.y < playerPos.y + playerSize.height &&
      this.boss.y + this.boss.height > playerPos.y
    );
  },

  drawRedLine(ctx) {
    ctx.save();

    // Solo dibujar si no está oculta
    if (!this.hideRedLine) {
      // Dibujar la línea completa en rojo transparente
      ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
      ctx.lineWidth = 15;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "#FF0000";
      ctx.shadowBlur = 20;

      ctx.beginPath();
      for (let i = 0; i < this.redLinePath.length; i++) {
        const point = this.redLinePath[i];
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.stroke();

      // Efecto de parpadeo mientras se muestra
      const pulse = Math.sin(window.getGameTime() * 0.2) * 0.3 + 0.7;
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = "#FFFF00";
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    // Siempre dibujar una pequeña estela detrás del boss cuando se mueve
    if (this.redLineSpeed > 0 && this.redLineIndex > 0) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
      ctx.lineWidth = 20;
      ctx.shadowColor = "#FF0000";
      ctx.shadowBlur = 30;

      // Dibujar solo los últimos 20 puntos como estela
      const startIndex = Math.max(0, this.redLineIndex - 20);

      ctx.beginPath();
      for (
        let i = startIndex;
        i <= this.redLineIndex && i < this.redLinePath.length;
        i++
      ) {
        const point = this.redLinePath[i];
        if (i === startIndex) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  },

  drawBossChoice(ctx) {
    const centerX = this.boss.x + this.boss.width / 2;
    const centerY = this.boss.y - 50;

    ctx.save();
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;

    ctx.strokeText("?", centerX, centerY);
    ctx.fillText("?", centerX, centerY);
    ctx.restore();
  },
};

// Hacer disponible globalmente
window.BossManager = BossManager;

// 🔥 SISTEMA MEJORADO: Boss habla al inicializar
const originalInit = BossManager.init;
BossManager.init = function () {
  originalInit.call(this);

  // Comentario de entrada después de 2 segundos
  setTimeout(() => {
    this.sayRandomComment("entrada");
  }, 2000);

  // Comentarios regulares cada 8-12 segundos durante el combate
  const commentInterval = setInterval(() => {
    if (!this.active) {
      clearInterval(commentInterval);
      return;
    }

    if (Math.random() < 0.7) {
      // 70% probabilidad cada intervalo
      this.sayRandomComment("combate");
    }
  }, 8000 + Math.random() * 4000); // Entre 8-12 segundos
};

console.log("👹 boss.js cargado - Sistema del boss listo");
