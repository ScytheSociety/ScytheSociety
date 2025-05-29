/**
 * Hell Shooter - Boss Management
 * Sistema del boss final del nivel 10
 */

const BossManager = {
  // ======================================================
  // ESTADO DEL BOSS
  // ======================================================

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
   * Inicializa el boss para el nivel 10
   */
  init() {
    const canvas = window.getCanvas();
    const config = GameConfig.BOSS_CONFIG;

    // 🔥 BOSS APARECE EN EL CENTRO SUPERIOR
    this.boss = {
      x: canvas.width / 2 - config.size / 2,
      y: 50,
      width: config.size,
      height: config.size,
      velocityX: 0,
      velocityY: 0,
      targetX: canvas.width / 2 - config.size / 2,
      targetY: 50,

      // Visual
      color: "#8B0000",
      glowIntensity: 0,

      // Comportamiento mejorado
      moveSpeed: config.speed,
      aggressionLevel: 1.0,
      teleportCooldown: 0,
      lastTeleport: 0,
    };

    // 🔥 MÁS VIDA PARA EL BOSS
    this.maxHealth = 80; // Era 50, ahora 80
    this.currentHealth = 80;

    this.active = true;
    // 🔥 NUEVOS: Sistema de comentarios
    this.lastCommentTime = 0;
    this.commentCooldown = 300; // 5 segundos entre comentarios

    this.currentPhase = 1;
    this.isImmune = false;
    this.immunityTimer = 0;
    this.summonTimer = 0;
    this.teleportTimer = 0;
    this.teleportCooldown = 0;
    this.mines = [];
    this.mineTimer = 0;
    this.miningPhase = false;

    // 🔥 NUEVOS: Sistema de comentarios
    this.lastCommentTime = 0;
    this.commentCooldown = 300; // 5 segundos entre comentarios

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

    console.log("👹 Boss inicializado - ¡Pelea final!");
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Actualiza el boss cada frame
   */
  update() {
    if (!this.active || !this.boss) return;

    // Actualizar sistemas
    this.updatePhase();
    this.updateMovement();
    this.updateImmunity();
    this.updateSummoning();
    this.updateTeleport();
    // 🔥 COMENTARIOS ALEATORIOS DURANTE COMBATE
    if (Math.random() < 0.002) {
      // 0.2% por frame
      this.sayRandomComment("combate");
    }
    this.updateMines();

    // Verificar si está derrotado
    this.checkDefeat();
  },

  /**
   * Actualiza la fase actual del boss
   */
  updatePhase() {
    const healthPercentage = this.currentHealth / this.maxHealth;
    const config = GameConfig.BOSS_CONFIG.phases;
    let newPhase = this.currentPhase;

    // Determinar fase según salud
    if (healthPercentage <= config.finalPhase.healthThreshold) {
      newPhase = 4; // Fase final
    } else if (healthPercentage <= config.phase3.healthThreshold) {
      newPhase = 3;
    } else if (healthPercentage <= config.phase2.healthThreshold) {
      newPhase = 2;
    } else {
      newPhase = 1;
    }

    // Cambio de fase
    if (newPhase !== this.currentPhase) {
      this.changePhase(newPhase);
    }

    // Activar fase de minas al 10% de vida
    if (healthPercentage <= 0.1 && !this.miningPhase) {
      this.activateMiningPhase();
    }
  },

  /**
   * Cambia a una nueva fase
   */
  changePhase(newPhase) {
    this.currentPhase = newPhase;
    this.lastPhaseChange = window.getGameTime();

    // Efectos visuales de cambio de fase
    UI.showScreenMessage(`¡FASE ${newPhase}!`, "#FF0000");

    UI.createParticleEffect(
      this.boss.x + this.boss.width / 2,
      this.boss.y + this.boss.height / 2,
      "#FF0000",
      50
    );

    // Volverse inmune temporalmente
    const phaseConfig = this.getPhaseConfig();
    this.makeImmune(phaseConfig.immunityDuration);

    // Teletransportarse inmediatamente
    if (newPhase >= 2) {
      this.teleport();
    }

    console.log(`👹 Boss cambió a fase ${newPhase}`);
  },

  /**
   * Actualiza el movimiento del boss
   */
  updateMovement() {
    const canvas = window.getCanvas();
    const phaseConfig = this.getPhaseConfig();
    const speed = phaseConfig.moveSpeed * this.boss.aggressionLevel;

    // Movimiento hacia el objetivo
    const dx = this.boss.targetX - this.boss.x;
    const dy = this.boss.targetY - this.boss.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      this.boss.velocityX = (dx / distance) * speed;
      this.boss.velocityY = (dy / distance) * speed;
    } else {
      // Llegó al objetivo, elegir nuevo objetivo
      this.chooseNewTarget();
    }

    // Aplicar movimiento
    this.boss.x += this.boss.velocityX;
    this.boss.y += this.boss.velocityY;

    // Mantener dentro de la pantalla
    this.boss.x = Math.max(
      0,
      Math.min(canvas.width - this.boss.width, this.boss.x)
    );
    this.boss.y = Math.max(0, Math.min(canvas.height / 2, this.boss.y)); // Solo mitad superior

    // Actualizar efectos visuales
    this.boss.glowIntensity = 0.5 + Math.sin(window.getGameTime() * 0.1) * 0.3;
  },

  /**
   * Elige un nuevo objetivo de movimiento
   */
  chooseNewTarget() {
    const canvas = window.getCanvas();
    const margin = this.boss.width;

    // Posiciones predefinidas (esquinas y centro superior)
    const positions = [
      { x: margin, y: 50 }, // Esquina superior izquierda
      { x: canvas.width - margin - this.boss.width, y: 50 }, // Esquina superior derecha
      { x: canvas.width / 2 - this.boss.width / 2, y: 50 }, // Centro superior
      { x: canvas.width / 4 - this.boss.width / 2, y: 100 }, // Izquierda media
      { x: (canvas.width * 3) / 4 - this.boss.width / 2, y: 100 }, // Derecha media
    ];

    // Elegir posición aleatoria
    const newTarget = positions[Math.floor(Math.random() * positions.length)];
    this.boss.targetX = newTarget.x;
    this.boss.targetY = newTarget.y;
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

  /**
   * Actualiza el sistema de invocación de enemigos
   */
  updateSummoning() {
    if (this.isImmune) return; // No invocar mientras es inmune

    const phaseConfig = this.getPhaseConfig();
    const gameTime = window.getGameTime();

    this.summonTimer++;

    if (this.summonTimer >= phaseConfig.summonInterval) {
      this.summonEnemies(phaseConfig.summonCount);
      this.summonTimer = 0;
      this.lastSummonTime = gameTime;

      // Volverse inmune temporalmente después de invocar
      this.makeImmune(phaseConfig.immunityDuration);
    }
  },

  /**
   * Invoca enemigos de diferentes niveles
   */
  summonEnemies(count) {
    const canvas = window.getCanvas();

    UI.showScreenMessage("👹 ¡INVOCANDO ESBIRROS!", "#FF4444");

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        // Enemigos de niveles aleatorios (1-9)
        const enemyLevel = 1 + Math.floor(Math.random() * 9);
        const size = GameConfig.ENEMY_MIN_SIZE + Math.random() * 20;

        // Posición aleatoria en los bordes
        let x, y;
        const side = Math.floor(Math.random() * 4);

        switch (side) {
          case 0: // Arriba
            x = Math.random() * canvas.width;
            y = -size;
            break;
          case 1: // Derecha
            x = canvas.width;
            y = Math.random() * canvas.height;
            break;
          case 2: // Abajo
            x = Math.random() * canvas.width;
            y = canvas.height;
            break;
          case 3: // Izquierda
            x = -size;
            y = Math.random() * canvas.height;
            break;
        }

        // Crear enemigo súbdito
        const minion = {
          x: x,
          y: y,
          width: size,
          height: size,
          velocityX: (Math.random() - 0.5) * 0.004 * canvas.height,
          velocityY: (Math.random() - 0.5) * 0.004 * canvas.height,

          image:
            GameConfig.enemyImages[
              Math.min(enemyLevel - 1, GameConfig.enemyImages.length - 1)
            ],
          speedFactor: 1.2, // Más agresivos
          bounceCount: 0,
          maxBounces: 5,

          level: enemyLevel,
          type: "boss_minion",
          isBossMinion: true,
        };

        EnemyManager.enemies.push(minion);

        // Efecto visual de invocación
        UI.createParticleEffect(x, y, "#8B0000", 20);
      }, i * 200); // Espaciar invocaciones
    }

    AudioManager.playSound("special");
    console.log(`👹 Boss invocó ${count} esbirros`);
  },

  // ======================================================
  // SISTEMA DE TELETRANSPORTE
  // ======================================================

  /**
   * Actualiza el sistema de teletransporte
   */
  updateTeleport() {
    const phaseConfig = this.getPhaseConfig();

    if (!phaseConfig.teleportChance) return;

    // Reducir cooldown
    if (this.teleportCooldown > 0) {
      this.teleportCooldown--;
      return;
    }

    // Verificar si debe teletransportarse
    this.teleportTimer++;

    const shouldTeleport =
      phaseConfig.teleportFrequency &&
      this.teleportTimer >= phaseConfig.teleportFrequency;
    const randomTeleport = Math.random() < phaseConfig.teleportChance;

    if (shouldTeleport || randomTeleport) {
      this.teleport();
      this.teleportTimer = 0;
      this.teleportCooldown = 60; // 1 segundo de cooldown
    }
  },

  /**
   * Teletransporta al boss
   */
  teleport() {
    const canvas = window.getCanvas();

    // Efecto visual en posición actual
    UI.createParticleEffect(
      this.boss.x + this.boss.width / 2,
      this.boss.y + this.boss.height / 2,
      "#8B0000",
      50
    );

    // Nueva posición aleatoria
    const margin = this.boss.width;
    this.boss.x =
      margin + Math.random() * (canvas.width - margin * 2 - this.boss.width);
    this.boss.y = 50 + Math.random() * 100; // Parte superior

    // Actualizar objetivo
    this.boss.targetX = this.boss.x;
    this.boss.targetY = this.boss.y;

    // Efecto visual en nueva posición
    UI.createParticleEffect(
      this.boss.x + this.boss.width / 2,
      this.boss.y + this.boss.height / 2,
      "#FF0000",
      50
    );

    UI.showScreenMessage("💨 TELETRANSPORTE 💨", "#FF00FF");
    AudioManager.playSound("special");

    console.log("💨 Boss se teletransportó");
  },

  // ======================================================
  // SISTEMA DE MINAS
  // ======================================================

  /**
   * 🔥 NUEVO: Activa fase de minas con inmunidad
   */
  activateMiningPhase() {
    this.miningPhase = true;
    this.mineTimer = 0;

    // 🔥 IR AL CENTRO DE LA PANTALLA
    const canvas = window.getCanvas();
    this.boss.targetX = canvas.width / 2 - this.boss.width / 2;
    this.boss.targetY = canvas.height / 2 - this.boss.height / 2;

    // 🔥 INMUNIDAD TOTAL DURANTE MINAS
    this.makeImmune(600); // 10 segundos de inmunidad

    UI.showScreenMessage("💣 ¡MODO MINAS ACTIVADO! 💣", "#FF8800");
    this.sayRandomComment("combate");
    console.log("💣 Fase de minas activada - Boss inmune");
  },

  /**
   * Actualiza el sistema de minas
   */
  updateMines() {
    if (!this.miningPhase) return;

    const config = GameConfig.BOSS_CONFIG.phases.finalPhase;

    // Crear nuevas minas
    this.mineTimer++;
    if (this.mineTimer >= config.mineInterval) {
      this.spawnMine();
      this.mineTimer = 0;
    }

    // Actualizar minas existentes
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mine = this.mines[i];

      mine.timer--;

      // Armar mina después de 1 segundo
      if (!mine.armed && mine.timer <= config.mineExplosionDelay - 60) {
        mine.armed = true;
        console.log("💣 Mina armada");
      }

      // Explotar mina
      if (mine.timer <= 0) {
        this.explodeMine(i);
      }
    }
  },

  /**
   * 🔥 NUEVO: Spawn mejorado de minas con área de peligro
   */
  spawnMine() {
    const canvas = window.getCanvas();
    const config = GameConfig.BOSS_CONFIG.phases.finalPhase;

    const mine = {
      x: 50 + Math.random() * (canvas.width - 100),
      y: 50 + Math.random() * (canvas.height - 100),
      width: 35,
      height: 35,
      timer: config.mineExplosionDelay,
      armed: false,
      blinkTimer: 0,

      // 🔥 NUEVO: Área de peligro visual
      dangerRadius: config.mineDamageRadius,
      showDangerZone: true,
    };

    this.mines.push(mine);

    UI.createParticleEffect(mine.x + 17, mine.y + 17, "#FF8800", 15);
    UI.showScreenMessage("💣 ¡MINA COLOCADA!", "#FF8800");

    console.log("💣 Nueva mina con zona de peligro colocada");
  },

  /**
   * Explota una mina
   */
  explodeMine(index) {
    if (index < 0 || index >= this.mines.length) return;

    const mine = this.mines[index];
    const config = GameConfig.BOSS_CONFIG.phases.finalPhase;

    // Crear explosión
    UI.createExplosionEffect(mine.x + mine.width / 2, mine.y + mine.height / 2);

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

    if (distance < config.mineDamageRadius) {
      player.takeDamage();
      console.log("💥 Jugador dañado por mina");
    }

    // Eliminar mina
    this.mines.splice(index, 1);

    AudioManager.playSound("explosion");
    console.log("💥 Mina explotó");
  },

  // ======================================================
  // SISTEMA DE DAÑO
  // ======================================================

  /**
   * El boss recibe daño - CORREGIDO PARA NIVEL 11
   */
  takeDamage(amount) {
    // 🔥 VERIFICAR SI ESTÁ ACTIVO Y NO INMUNE
    if (!this.active || this.isImmune) {
      console.log("👹 Boss no puede recibir daño - inactivo o inmune");
      return;
    }

    // 🔥 VERIFICAR SI YA ESTÁ MUERTO
    if (this.currentHealth <= 0) {
      console.log("👹 Boss ya está muerto - no recibir más daño");
      return;
    }

    this.currentHealth = Math.max(0, this.currentHealth - amount);

    // Aumentar agresividad según daño recibido
    const healthPercentage = this.currentHealth / this.maxHealth;
    this.boss.aggressionLevel = 1.0 + (1.0 - healthPercentage) * 0.5;

    // Efecto visual de daño
    UI.createParticleEffect(
      this.boss.x + this.boss.width / 2,
      this.boss.y + this.boss.height / 2,
      "#FFFF00",
      15
    );

    AudioManager.playSound("hit");

    console.log(
      `👹 Boss recibió ${amount} daño. Vida: ${this.currentHealth}/${this.maxHealth}`
    );

    // 🔥 VERIFICAR DERROTA INMEDIATAMENTE
    if (this.currentHealth <= 0) {
      console.log("👹 Boss vida = 0, iniciando derrota...");
      setTimeout(() => this.defeat(), 100); // Pequeño delay para evitar problemas
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
   * Dibuja el boss y sus elementos - CORREGIDO
   */
  draw(ctx) {
    // 🔥 VERIFICAR SI ESTÁ ACTIVO Y TIENE BOSS
    if (!this.active || !this.boss) {
      console.log("👹 Boss no activo o no existe - no dibujar");
      return;
    }

    console.log(
      `👹 Dibujando boss en posición: (${this.boss.x}, ${this.boss.y})`
    );

    // Dibujar boss
    this.drawBoss(ctx);

    // Dibujar barra de vida
    this.drawHealthBar(ctx);

    // Dibujar minas
    this.drawMines(ctx);
  },

  /**
   * Dibuja el boss - CORREGIDO CON FALLBACK VISIBLE PARA NIVEL 11
   */
  drawBoss(ctx) {
    ctx.save();

    // Efecto de inmunidad
    if (this.isImmune) {
      ctx.shadowColor = "#00FFFF";
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.7 + Math.sin(window.getGameTime() * 0.3) * 0.3;
    } else {
      ctx.shadowColor = this.boss.color;
      ctx.shadowBlur = 10 + this.boss.glowIntensity * 10;
    }

    console.log(
      `👹 Dibujando boss en nivel 11: (${this.boss.x}, ${this.boss.y}) tamaño ${this.boss.width}x${this.boss.height}`
    );

    // 🔥 INTENTAR ANIMACIÓN CON FRAMES
    let bossDibujado = false;
    if (GameConfig.bossFrames && GameConfig.bossFrames.length > 0) {
      // Cambiar frame cada 15 frames del juego (4 FPS de animación)
      const frameIndex =
        Math.floor(window.getGameTime() / 15) % GameConfig.bossFrames.length;
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
        console.log(`👹 Boss dibujado con frame ${frameIndex} en nivel 11`);
      }
    }

    // 🔥 FALLBACK AL GIF ESTÁTICO
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
      console.log("👹 Boss dibujado con imagen estática en nivel 11");
    }

    // 🔥 FALLBACK VISUAL GARANTIZADO (SIEMPRE VISIBLE)
    if (!bossDibujado) {
      console.log("👹 Usando fallback visual para boss en nivel 11");

      // Fondo del boss MÁS VISIBLE
      ctx.fillStyle = "#8B0000";
      ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);

      // Borde visible MÁS GRUESO
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(
        this.boss.x,
        this.boss.y,
        this.boss.width,
        this.boss.height
      );

      // Segundo borde rojo
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.boss.x + 2,
        this.boss.y + 2,
        this.boss.width - 4,
        this.boss.height - 4
      );

      // Detalles adicionales más visibles
      ctx.fillStyle = "#FFFFFF";
      const centerX = this.boss.x + this.boss.width / 2;
      const centerY = this.boss.y + this.boss.height / 2;

      // Ojos malvados más grandes
      ctx.fillRect(centerX - 30, centerY - 30, 20, 20);
      ctx.fillRect(centerX + 10, centerY - 30, 20, 20);

      // Pupilas rojas
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(centerX - 25, centerY - 25, 10, 10);
      ctx.fillRect(centerX + 15, centerY - 25, 10, 10);

      // Boca más grande
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(centerX - 25, centerY + 10, 50, 10);

      // Texto "BOSS" para identificación
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("BOSS", centerX, centerY - 50);

      // Texto de vida
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px Arial";
      ctx.fillText(
        `${this.currentHealth}/${this.maxHealth}`,
        centerX,
        centerY + 60
      );

      console.log("👹 Boss fallback dibujado correctamente en nivel 11");
    }

    ctx.restore();
  },

  // 🔥 NUEVO: Función auxiliar para dibujar boss estático
  drawStaticBoss(ctx) {
    if (GameConfig.bossImage && GameConfig.bossImage.complete) {
      ctx.drawImage(
        GameConfig.bossImage,
        this.boss.x,
        this.boss.y,
        this.boss.width,
        this.boss.height
      );
    } else {
      // Respaldo visual
      ctx.fillStyle = this.boss.color;
      ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);

      // Detalles adicionales
      ctx.fillStyle = "#FFFFFF";
      const centerX = this.boss.x + this.boss.width / 2;
      const centerY = this.boss.y + this.boss.height / 2;

      // Ojos malvados
      ctx.fillRect(centerX - 20, centerY - 20, 10, 10);
      ctx.fillRect(centerX + 10, centerY - 20, 10, 10);

      // Boca
      ctx.fillRect(centerX - 15, centerY + 10, 30, 5);
    }
  },

  /**
   * 🔥 NUEVO: Dibuja la barra de vida ABAJO del boss
   */
  drawHealthBar(ctx) {
    const canvas = window.getCanvas();
    const barWidth = canvas.width * 0.4; // Más pequeña
    const barHeight = 15; // Más delgada
    const x = (canvas.width - barWidth) / 2;
    const y = this.boss.y + this.boss.height + 15; // ABAJO del boss

    // Fondo de la barra
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(x - 3, y - 3, barWidth + 6, barHeight + 6);

    // Borde
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Vida actual
    const healthPercentage = this.currentHealth / this.maxHealth;
    const healthWidth = barWidth * healthPercentage;

    // Color según vida restante
    let healthColor = "#00FF00";
    if (healthPercentage < 0.3) healthColor = "#FF0000";
    else if (healthPercentage < 0.6) healthColor = "#FFFF00";

    ctx.fillStyle = healthColor;
    ctx.fillRect(x, y, healthWidth, barHeight);

    // Texto más pequeño
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `${this.currentHealth}/${this.maxHealth}`,
      canvas.width / 2,
      y + barHeight / 2 + 4
    );

    // Indicador de fase más pequeño
    ctx.font = "bold 10px Arial";
    ctx.fillText(
      `FASE ${this.currentPhase}`,
      canvas.width / 2,
      y + barHeight + 15
    );
  },

  /**
   * 🔥 NUEVO: Dibuja zona de peligro de las minas
   */
  drawMines(ctx) {
    for (const mine of this.mines) {
      ctx.save();

      // 🔥 DIBUJAR ZONA DE PELIGRO ROJA
      if (mine.showDangerZone) {
        ctx.beginPath();
        ctx.arc(
          mine.x + mine.width / 2,
          mine.y + mine.height / 2,
          mine.dangerRadius,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = "#FF0000";
        ctx.setLineDash([5, 5]); // Línea punteada
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.setLineDash([]); // Restaurar línea sólida
      }

      // Parpadeo cuando está por explotar
      const timeLeft = mine.timer;
      if (timeLeft < 60) {
        mine.blinkTimer++;
        if (mine.blinkTimer % 8 < 4) {
          ctx.globalAlpha = 0.3;
        }
      }

      // Color según estado
      ctx.fillStyle = mine.armed ? "#FF0000" : "#FF8800";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;

      // Dibujar mina más grande
      ctx.fillRect(mine.x, mine.y, mine.width, mine.height);

      // Indicador visual
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(mine.x + 12, mine.y + 12, 11, 11);

      ctx.restore();
    }
  },

  // ======================================================
  // UTILIDADES Y GETTERS
  // ======================================================

  /**
   * Obtiene la configuración de la fase actual
   */
  getPhaseConfig() {
    const config = GameConfig.BOSS_CONFIG.phases;

    switch (this.currentPhase) {
      case 1:
        return config.phase1;
      case 2:
        return config.phase2;
      case 3:
        return config.phase3;
      case 4:
        return config.finalPhase;
      default:
        return config.phase1;
    }
  },

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
   * Resetea el sistema del boss
   */
  reset() {
    this.boss = null;
    this.active = false;
    this.currentHealth = 50;
    this.maxHealth = 50;
    this.currentPhase = 1;
    this.isImmune = false;
    this.immunityTimer = 0;
    this.summonTimer = 0;
    this.teleportTimer = 0;
    this.teleportCooldown = 0;
    this.mines = [];
    this.mineTimer = 0;
    this.miningPhase = false;

    console.log("👹 Sistema del boss reseteado");
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
