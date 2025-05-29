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

    // 🔥 SISTEMA DE FASES INTELIGENTE
    this.currentPhase = "SUMMONING"; // SUMMONING -> MINES -> BULLETS
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
    this.updateIntelligentMovement();

    // 🔥 SISTEMA DE FASES INTELIGENTE
    this.updateIntelligentPhases();

    // Comentarios aleatorios ocasionales
    if (Math.random() < 0.001) {
      // Menos frecuente
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

    // Determinar si debe activar fase según vida y si no hay fase activa
    let shouldStartPhase = false;
    let targetPhase = null;

    if (
      healthPercentage <= 0.75 &&
      healthPercentage > 0.5 &&
      !this.phaseActive &&
      (this.currentPhase === "SUMMONING" ? false : true) // Permitir activar SUMMONING
    ) {
      shouldStartPhase = true;
      targetPhase = "SUMMONING";
    } else if (
      healthPercentage <= 0.5 &&
      healthPercentage > 0.25 &&
      this.currentPhase !== "MINES" &&
      !this.phaseActive
    ) {
      shouldStartPhase = true;
      targetPhase = "MINES";
    } else if (
      healthPercentage <= 0.25 &&
      this.currentPhase !== "BULLETS" &&
      !this.phaseActive
    ) {
      shouldStartPhase = true;
      targetPhase = "BULLETS";
    }

    // Iniciar fase si corresponde
    if (shouldStartPhase) {
      this.changeIntelligentPhase(targetPhase);
    }

    // Ejecutar fase actual si está activa
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
    } else {
      // 🔥 SIEMPRE perseguir cuando no hay fase activa
      this.huntPlayer();
    }

    // 🔥 AGREGAR: También perseguir durante SUMMONING (pero lento)
    if (this.currentPhase === "SUMMONING" && this.phaseActive) {
      const playerPos = Player.getPosition();
      const bossCenterX = this.boss.x + this.boss.width / 2;
      const bossCenterY = this.boss.y + this.boss.height / 2;

      const dx = playerPos.x - bossCenterX;
      const dy = playerPos.y - bossCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 150) {
        const slowSpeed = this.boss.moveSpeed * 0.8; // Movimiento lento durante invocación
        this.boss.velocityX += (dx / distance) * slowSpeed * 0.1;
        this.boss.velocityY += (dy / distance) * slowSpeed * 0.1;
      }
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
   * 🔥 NUEVO: Invocación inteligente de enemigos
   */
  summonIntelligentEnemies(count) {
    const canvas = window.getCanvas();

    UI.showScreenMessage(`👹 ¡${count} ESBIRROS!`, "#FF4444");

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        // Enemigos más fuertes
        const size = GameConfig.ENEMY_MIN_SIZE * 1.3;

        // Posiciones estratégicas (esquinas)
        const positions = [
          { x: 50, y: 50 },
          { x: canvas.width - 100, y: 50 },
          { x: 50, y: canvas.height - 100 },
          { x: canvas.width - 100, y: canvas.height - 100 },
        ];

        const pos = positions[i % positions.length];

        const minion = {
          x: pos.x,
          y: pos.y,
          width: size,
          height: size,
          velocityX: (Math.random() - 0.5) * 0.006 * canvas.height,
          velocityY: (Math.random() - 0.5) * 0.006 * canvas.height,

          image:
            GameConfig.enemyImages[
              Math.floor(Math.random() * GameConfig.enemyImages.length)
            ],
          speedFactor: 1.5, // Más agresivos
          bounceCount: 0,
          maxBounces: 8,

          level: 10,
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
      }, i * 300);
    }

    AudioManager.playSound("special");
  },

  /**
   * 🔥 NUEVO: Movimiento inteligente del boss
   */
  updateIntelligentMovement() {
    if (this.isImmune && this.phaseActive) {
      // Solo reducir movimiento durante fases activas
      this.boss.velocityX *= 0.95;
      this.boss.velocityY *= 0.95;
    } else {
      // Cambiar patrón de movimiento cada 5 segundos
      if (window.getGameTime() - this.lastPatternChange > 300) {
        this.changeMovementPattern();
      }

      // Ejecutar patrón actual
      switch (this.boss.movementPattern) {
        case "hunting":
          this.huntPlayer();
          break;
        case "circling":
          this.circleAroundPlayer();
          break;
        case "teleporting":
          this.teleportMovement();
          break;
      }
    }

    // Aplicar movimiento
    this.boss.x += this.boss.velocityX;
    this.boss.y += this.boss.velocityY;

    // Mantener en pantalla con rebote suave
    const canvas = window.getCanvas();
    if (this.boss.x < 0) {
      this.boss.x = 0;
      this.boss.velocityX = Math.abs(this.boss.velocityX) * 0.8;
    }
    if (this.boss.x + this.boss.width > canvas.width) {
      this.boss.x = canvas.width - this.boss.width;
      this.boss.velocityX = -Math.abs(this.boss.velocityX) * 0.8;
    }
    if (this.boss.y < 0) {
      this.boss.y = 0;
      this.boss.velocityY = Math.abs(this.boss.velocityY) * 0.8;
    }
    if (this.boss.y + this.boss.height > canvas.height) {
      this.boss.y = canvas.height - this.boss.height;
      this.boss.velocityY = -Math.abs(this.boss.velocityY) * 0.8;
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

    // 🔥 MARCAR COMO INACTIVO INMEDIATAMENTE
    this.active = false;
    this.currentHealth = 0;

    // 🔥 COMENTARIOS DE DERROTA
    this.sayRandomComment("derrota_boss");

    // Efectos de derrota
    UI.showScreenMessage("🏆 ¡BOSS DERROTADO! 🏆", "#FFD700");

    // Efectos visuales más épicos
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

    // Puntos bonus masivos
    const bonusPoints = 5000;
    window.setScore(window.getScore() + bonusPoints);
    UI.showScreenMessage(`+${bonusPoints} PUNTOS BONUS!`, "#FFD700");

    // Limpiar minas y enemigos
    this.mines = [];
    EnemyManager.enemies = [];

    AudioManager.playSound("victory");

    // ⬅️ LLAMADA A VICTORIA
    setTimeout(() => {
      console.log("🏆 Llamando a window.victory() desde nivel 11");
      window.victory();
    }, 2000);

    console.log(
      "🏆 Boss derrotado - secuencia de victoria iniciada desde nivel 11"
    );
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  /**
   * Dibuja el boss y todos sus elementos - SISTEMA COMPLETO
   */
  draw(ctx) {
    if (!this.active || !this.boss) return;

    // Dibujar balas Touhou primero (atrás)
    this.drawBulletPatterns(ctx);

    // Dibujar minas con zonas de peligro
    this.drawIntelligentMines(ctx);

    // Dibujar boss
    this.drawBoss(ctx);

    // Dibujar barra de vida que sigue al boss
    this.drawHealthBar(ctx);
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
   * 🔥 Actualizar todas las balas Touhou
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

      // Verificar colisión con jugador
      const playerPos = Player.getPosition();
      const playerSize = Player.getSize();

      // 🔥 AGRANDAR ÁREA DE COLISIÓN DE LAS BALAS
      const bulletHitbox = 8; // Área de colisión más grande
      const playerHitbox = 4; // Reducir hitbox del jugador para ser más justo

      if (
        bullet.x + bulletHitbox > playerPos.x - playerHitbox &&
        bullet.x - bulletHitbox <
          playerPos.x + playerSize.width + playerHitbox &&
        bullet.y + bulletHitbox > playerPos.y - playerHitbox &&
        bullet.y - bulletHitbox < playerPos.y + playerSize.height + playerHitbox
      ) {
        // Jugador golpeado por bala Touhou
        Player.takeDamage();
        this.bulletPatterns.splice(i, 1);
        continue;
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
   * Resetea el sistema del boss - LIMPIO
   */
  reset() {
    this.boss = null;
    this.active = false;

    // Sistema de vida
    this.currentHealth = 200;
    this.maxHealth = 200;

    // Sistema de fases inteligente
    this.currentPhase = "SUMMONING";
    this.phaseTimer = 0;
    this.phaseActive = false;
    this.phaseCooldown = 0;

    // Sistemas de ataque
    this.bulletPatterns = [];
    this.patternType = "none";

    // Estado básico
    this.isImmune = false;
    this.immunityTimer = 0;
    this.mines = [];
    this.mineTimer = 0;
    this.miningPhase = false;

    // Comentarios
    this.lastCommentTime = 0;
    this.commentCooldown = 300;

    console.log("👹 Sistema del boss inteligente reseteado");
  },

  /**
   * 🔥 NUEVO: Sistema de comentarios sarcásticos del boss
   */
  bossComments: {
    entrada: [
      "¡Scythe Society será destruida!",
      "¡Vengo por la reina Hell!",
      "¡Prepárense para la aniquilación!",
      "¡Su clan no durará ni un minuto!",
      "¡Hell pagará por su insolencia!",
    ],
    combate: [
      "¡Son unos mancos!",
      "¡Scythe Society, más como Scythe Pathetic!",
      "¡Hell debería entrenar mejor a sus seguidores!",
      "¡Qué decepcionante resistencia!",
      "¡Ni siquiera saben apuntar!",
      "¡Mi abuela disparaba mejor!",
      "¡Scythe Society = Scythe Sorry!",
      "¡Hell te abandonará como a todos!",
      "¡Sus balas son como cosquillas!",
      "¡Patéticos mortales!",
      "¡Esto es todo lo que tienen?!",
      "¡Hell eligió mal a sus campeones!",
      "¡Ni sus ancestros los salvarán!",
      "¡Scythe Society, más como Cry Society!",
      "¡Deberían rendirse ahora!",
    ],
    victoria_boss: [
      "¡Hell, aquí voy por ti!",
      "¡Scythe Society ha caído!",
      "¡Vuelvan pronto... si pueden!",
      "¡Digan adiós a su preciada Hell!",
      "¡La oscuridad prevalece!",
    ],
    derrota_boss: [
      "¡Esto no ha terminado!",
      "¡Volveré más fuerte!",
      "¡Hell... me las pagará!",
      "¡No me olvidaré de esto!",
      "¡Mi venganza será eterna!",
    ],
  },

  /**
   * 🔥 NUEVO: Dice un comentario aleatorio
   */
  sayRandomComment(situation) {
    const currentTime = window.getGameTime();

    if (currentTime - this.lastCommentTime < this.commentCooldown) return;

    const comments = this.bossComments[situation];
    if (!comments || comments.length === 0) return;

    const randomComment = comments[Math.floor(Math.random() * comments.length)];
    UI.showScreenMessage(`👹: "${randomComment}"`, "#FF0000");

    this.lastCommentTime = currentTime;
    console.log(`👹 Boss dice: ${randomComment}`);
  },
};

// Hacer disponible globalmente
window.BossManager = BossManager;

console.log("👹 boss.js cargado - Sistema del boss listo");
