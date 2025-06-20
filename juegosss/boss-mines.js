/**
 * Hell Shooter - Boss Mines System
 * Sistema modular de minas explosivas del boss
 */

const BossMines = {
  // ======================================================
  // ESTADO DEL SISTEMA DE MINAS
  // ======================================================

  bossManager: null,

  // Lista de minas activas
  mines: [],

  // Estado de secuencias
  miningPhase: false,
  mineTimer: 0,
  sequenceActive: false,

  // Configuración de minas
  mineConfig: {
    size: 40,
    dangerRadius: 100,
    armingTime: 60, // 1 segundo para armarse
    explosionTime: 240, // 4 segundos total hasta explotar
    warningTime: 120, // Últimos 2 segundos en modo advertencia
    blinkSpeed: 10, // Velocidad de parpadeo
  },

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  /**
   * Inicializar el sistema de minas
   */
  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.initMineSystem();
    console.log("💣 Sistema de minas del boss inicializado");
  },

  /**
   * Configurar sistema de minas
   */
  initMineSystem() {
    this.mines = [];
    this.miningPhase = false;
    this.mineTimer = 0;
    this.sequenceActive = false;
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Actualizar sistema de minas
   */
  update() {
    if (!this.bossManager.active) return;

    // Actualizar todas las minas activas
    this.updateMines();

    // Actualizar timer general
    this.mineTimer++;
  },

  /**
   * Actualizar todas las minas individuales
   */
  updateMines() {
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mine = this.mines[i];

      this.updateSingleMine(mine);

      // Verificar si la mina debe explotar
      if (mine.timer <= 0) {
        this.explodeMine(i);
      }
    }
  },

  /**
   * Actualizar una mina individual - CORREGIDA para tipos
   */
  updateSingleMine(mine) {
    mine.blinkTimer++;

    if (mine.type === "timer") {
      // Mina de tiempo - cuenta regresiva normal
      mine.timer--;

      // Parpadeo más rápido al final
      if (mine.timer <= 60) {
        // Último segundo
        mine.blinkSpeed = 3;
        mine.warningPhase = true;
      } else if (mine.timer <= 120) {
        // Últimos 2 segundos
        mine.blinkSpeed = 6;
        mine.warningPhase = true;
      }
    } else if (mine.type === "proximity") {
      // Mina de proximidad - verificar si el jugador está cerca
      const playerPos = Player.getPosition();
      const playerSize = Player.getSize();

      const playerCenterX = playerPos.x + playerSize.width / 2;
      const playerCenterY = playerPos.y + playerSize.height / 2;
      const mineCenterX = mine.x + mine.width / 2;
      const mineCenterY = mine.y + mine.height / 2;

      const distance = Math.sqrt(
        Math.pow(playerCenterX - mineCenterX, 2) +
          Math.pow(playerCenterY - mineCenterY, 2)
      );

      // Si el jugador pisa la mina, activarla
      if (distance < mine.activationRadius) {
        console.log("💥 Mina de proximidad activada por jugador");
        mine.timer = 0; // Explotar inmediatamente
        mine.type = "timer"; // Cambiar a tipo timer para que explote
      }
    }
  },

  // ======================================================
  // CREACIÓN DE MINAS
  // ======================================================

  /**
   * Iniciar secuencia de minas con teletransporte - CORREGIDA
   */
  startMineSequence() {
    console.log("💣 Boss iniciando secuencia de minas con teletransporte");

    this.miningPhase = true;
    this.sequenceActive = true;
    this.mineTimer = 0;

    // Boss se vuelve inmune durante la secuencia
    this.bossManager.makeImmune(600); // 10 segundos

    // Centrar boss inicialmente
    if (this.bossManager.movement) {
      this.bossManager.movement.teleportToCenter();
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "💣 ¡SECUENCIA DE MINAS ACTIVADA!",
        "#FF8800"
      );
    }

    // 🔥 NUEVA SECUENCIA: Teletransporte + Minas
    let mineCount = 0;
    const totalMines = 8;

    const placeMineWithTeleport = () => {
      if (mineCount >= totalMines || !this.sequenceActive) {
        this.endMineSequence();
        return;
      }

      // Teletransportar a posición aleatoria
      this.teleportToRandomPosition();

      // Esperar 500ms y colocar mina
      setTimeout(() => {
        if (this.sequenceActive) {
          this.placeMineAtBossPosition();
          mineCount++;

          // Programar siguiente mina después de 1.5 segundos
          setTimeout(() => {
            placeMineWithTeleport();
          }, 1500);
        }
      }, 500);
    };

    // Iniciar secuencia después de 1 segundo
    setTimeout(() => {
      placeMineWithTeleport();
    }, 1000);
  },

  /**
   * Teletransportar boss a posición aleatoria - NUEVO
   */
  teleportToRandomPosition() {
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;

    if (!boss || !canvas) return;

    // Efecto visual en posición actual
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#8B0000",
        25
      );
    }

    // Generar posición aleatoria con márgenes
    const margin = 100;
    const newX =
      margin + Math.random() * (canvas.width - boss.width - margin * 2);
    const newY =
      margin + Math.random() * (canvas.height - boss.height - margin * 2);

    // Teletransportar
    boss.x = newX;
    boss.y = newY;

    // Efecto visual en nueva posición
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#FF0000",
        30
      );
    }

    if (window.AudioManager) {
      AudioManager.playSound("special");
    }

    console.log(
      `💣 Boss teletransportado a (${Math.round(newX)}, ${Math.round(newY)})`
    );
  },

  /**
   * Colocar mina en la posición actual del boss - NUEVO
   */
  placeMineAtBossPosition() {
    const boss = this.bossManager.boss;
    if (!boss) return;

    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    // Decidir tipo de mina aleatoriamente
    const mineType = Math.random();

    if (mineType < 0.6) {
      // 60% - Mina de tiempo (3 segundos)
      this.createTimerMine(centerX - 20, centerY - 20);
    } else {
      // 40% - Mina de proximidad (permanente hasta pisarla)
      this.createProximityMine(centerX - 20, centerY - 20);
    }

    // Efecto visual
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(centerX, centerY, "#FF8800", 15);
    }

    console.log(
      `💣 Mina colocada en posición del boss (${Math.round(
        centerX
      )}, ${Math.round(centerY)})`
    );
  },

  /**
   * Crear mina con contador de 3 segundos - NUEVO
   */
  createTimerMine(x, y) {
    const mine = {
      x: x,
      y: y,
      width: this.mineConfig.size,
      height: this.mineConfig.size,
      timer: 180, // 3 segundos a 60fps
      armed: true, // Armada inmediatamente
      blinkTimer: 0,
      blinkSpeed: 8,

      // Tipo específico
      type: "timer",
      dangerRadius: 120,
      showDangerZone: true,
      warningPhase: true,

      // Efectos visuales
      pulseIntensity: 0,
      glowIntensity: 0.8,

      // 🔥 EXPLOSIÓN EN CADENA
      chainExplosion: true,
    };

    this.mines.push(mine);

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("💣 ¡MINA TEMPORAL!", "#FF4400");
    }

    console.log("💣 Mina temporal creada (3 segundos)");
  },

  /**
   * Crear mina de proximidad (se activa al pisarla) - NUEVO
   */
  createProximityMine(x, y) {
    const mine = {
      x: x,
      y: y,
      width: this.mineConfig.size,
      height: this.mineConfig.size,
      timer: 9999, // No explota por tiempo
      armed: true,
      blinkTimer: 0,
      blinkSpeed: 15, // Parpadeo más lento

      // Tipo específico
      type: "proximity",
      dangerRadius: 80, // Radio más pequeño
      showDangerZone: true,
      warningPhase: false, // No está en fase de advertencia
      activationRadius: 50, // Radio para activarse

      // Efectos visuales diferentes
      pulseIntensity: 0,
      glowIntensity: 0.5,

      // Color diferente
      color: "#FF6600",
    };

    this.mines.push(mine);

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "💣 ¡MINA DE PROXIMIDAD!",
        "#FF6600"
      );
    }

    console.log("💣 Mina de proximidad creada (se activa al pisarla)");
  },

  /**
   * Crear mina inteligente con posicionamiento estratégico
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

    const mine = this.createMine(adjustedX - 20, adjustedY - 20);

    this.mines.push(mine);

    // Efectos visuales
    if (this.bossManager.ui) {
      this.bossManager.ui.createParticleEffect(
        adjustedX,
        adjustedY,
        "#FF8800",
        20
      );
      this.bossManager.ui.showScreenMessage("💣 ¡MINA COLOCADA!", "#FF8800");
    }

    console.log(`💣 Mina inteligente colocada en (${adjustedX}, ${adjustedY})`);
  },

  /**
   * Crear mina básica
   */
  createMine(x, y, customTimer = null) {
    return {
      x: x,
      y: y,
      width: this.mineConfig.size,
      height: this.mineConfig.size,
      timer: customTimer || this.mineConfig.explosionTime,
      armed: false,
      blinkTimer: 0,
      blinkSpeed: this.mineConfig.blinkSpeed,

      // Zona de peligro
      dangerRadius: this.mineConfig.dangerRadius,
      showDangerZone: true,
      warningPhase: false,

      // Efectos visuales
      pulseIntensity: 0,
      glowIntensity: 0.5,
    };
  },

  /**
   * Crear minas rápidas para emergencias
   */
  spawnQuickMines(count) {
    console.log(`💣 Spawneando ${count} minas rápidas`);

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const canvas = window.getCanvas();

        const mine = this.createMine(
          100 + Math.random() * (canvas.width - 200),
          100 + Math.random() * (canvas.height - 200),
          180 // 3 segundos solamente
        );

        // Configuración para minas rápidas
        mine.armed = true;
        mine.warningPhase = true;
        mine.blinkSpeed = 7;
        mine.dangerRadius = 80;
        mine.width = 30;
        mine.height = 30;

        this.mines.push(mine);

        if (this.bossManager.ui) {
          this.bossManager.ui.createParticleEffect(
            mine.x + 15,
            mine.y + 15,
            "#FF4400",
            15
          );
        }
      }, i * 200);
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("💣 ¡MINAS RÁPIDAS!", "#FF4400");
    }
  },

  /**
   * Crear patrón de minas en formación
   */
  spawnMinePattern(pattern = "cross") {
    const canvas = window.getCanvas();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let positions = [];

    switch (pattern) {
      case "cross":
        positions = [
          { x: centerX, y: centerY - 150 },
          { x: centerX, y: centerY + 150 },
          { x: centerX - 150, y: centerY },
          { x: centerX + 150, y: centerY },
        ];
        break;

      case "circle":
        const radius = 180;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          positions.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
          });
        }
        break;

      case "line":
        for (let i = 0; i < 5; i++) {
          positions.push({
            x: 100 + (i * (canvas.width - 200)) / 4,
            y: centerY,
          });
        }
        break;
    }

    positions.forEach((pos, index) => {
      setTimeout(() => {
        const mine = this.createMine(pos.x - 20, pos.y - 20);
        this.mines.push(mine);

        if (this.bossManager.ui) {
          this.bossManager.ui.createParticleEffect(pos.x, pos.y, "#FF8800", 15);
        }
      }, index * 300);
    });

    console.log(
      `💣 Patrón de minas "${pattern}" creado con ${positions.length} minas`
    );
  },

  // ======================================================
  // EXPLOSIONES
  // ======================================================

  /**
   * Explotar una mina específica - CORREGIDA con explosión en cadena
   */
  explodeMine(index) {
    if (index < 0 || index >= this.mines.length) return;

    const mine = this.mines[index];

    console.log(`💥 Mina ${mine.type} explotando en (${mine.x}, ${mine.y})`);

    // Efectos visuales espectaculares
    this.createExplosionEffects(mine);

    // Verificar daño al jugador
    this.checkPlayerDamage(mine);

    // 🔥 EXPLOSIÓN EN CADENA - otras minas en el radio
    if (mine.chainExplosion) {
      this.triggerChainExplosion(mine, index);
    }

    // Eliminar mina
    this.mines.splice(index, 1);

    if (window.AudioManager) {
      AudioManager.playSound("explosion");
    }
  },

  /**
   * Explosión en cadena - activar otras minas cercanas - NUEVO
   */
  triggerChainExplosion(explodedMine, explodedIndex) {
    const chainRadius = 150; // Radio para activar otras minas
    const explodedCenterX = explodedMine.x + explodedMine.width / 2;
    const explodedCenterY = explodedMine.y + explodedMine.height / 2;

    // Lista para minas a explotar (para evitar modificar array mientras iteramos)
    const minesToExplode = [];

    for (let i = 0; i < this.mines.length; i++) {
      if (i === explodedIndex) continue; // No la mina que ya explotó

      const otherMine = this.mines[i];
      const otherCenterX = otherMine.x + otherMine.width / 2;
      const otherCenterY = otherMine.y + otherMine.height / 2;

      const distance = Math.sqrt(
        Math.pow(explodedCenterX - otherCenterX, 2) +
          Math.pow(explodedCenterY - otherCenterY, 2)
      );

      if (distance < chainRadius) {
        minesToExplode.push(i);
        console.log(
          `⛓️ Mina en cadena detectada a distancia ${Math.round(distance)}`
        );
      }
    }

    // Explotar minas en cadena con delay para efecto visual
    minesToExplode.forEach((mineIndex, chainIndex) => {
      setTimeout(() => {
        // Verificar que la mina aún existe (índices pueden cambiar)
        if (mineIndex < this.mines.length) {
          this.explodeMine(mineIndex);
        }
      }, chainIndex * 200); // 200ms entre cada explosión en cadena
    });

    if (minesToExplode.length > 0) {
      console.log(
        `⛓️ Activando ${minesToExplode.length} explosiones en cadena`
      );

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          `⛓️ ¡CADENA x${minesToExplode.length + 1}!`,
          "#FF8800"
        );
      }
    }
  },

  /**
   * Crear efectos visuales de explosión
   */
  createExplosionEffects(mine) {
    if (!this.bossManager.ui) return;

    const centerX = mine.x + mine.width / 2;
    const centerY = mine.y + mine.height / 2;

    // Múltiples ondas de partículas
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.bossManager.ui.createParticleEffect(
          centerX,
          centerY,
          i % 2 === 0 ? "#FF8800" : "#FF0000",
          30
        );
      }, i * 100);
    }

    // Onda de choque visual
    setTimeout(() => {
      this.bossManager.ui.createParticleEffect(centerX, centerY, "#FFFF00", 50);
    }, 200);
  },

  /**
   * Verificar daño al jugador
   */
  checkPlayerDamage(mine) {
    const player = Player;
    const playerPos = player.getPosition();
    const playerSize = player.getSize();

    const playerCenterX = playerPos.x + playerSize.width / 2;
    const playerCenterY = playerPos.y + playerSize.height / 2;
    const mineCenterX = mine.x + mine.width / 2;
    const mineCenterY = mine.y + mine.height / 2;

    const distance = Math.sqrt(
      Math.pow(playerCenterX - mineCenterX, 2) +
        Math.pow(playerCenterY - mineCenterY, 2)
    );

    if (distance < mine.dangerRadius) {
      player.takeDamage();

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "💥 ¡DAÑADO POR MINA!",
          "#FF0000"
        );
      }

      console.log("💥 Jugador dañado por explosión de mina");
    }
  },

  /**
   * Verificar daño a enemigos cercanos
   */
  checkEnemyDamage(mine) {
    if (!window.EnemyManager) return;

    const mineCenterX = mine.x + mine.width / 2;
    const mineCenterY = mine.y + mine.height / 2;

    for (let i = EnemyManager.enemies.length - 1; i >= 0; i--) {
      const enemy = EnemyManager.enemies[i];

      const enemyCenterX = enemy.x + enemy.width / 2;
      const enemyCenterY = enemy.y + enemy.height / 2;

      const distance = Math.sqrt(
        Math.pow(enemyCenterX - mineCenterX, 2) +
          Math.pow(enemyCenterY - mineCenterY, 2)
      );

      if (distance < mine.dangerRadius * 0.8) {
        // Radio ligeramente menor para enemigos
        // Eliminar enemigo
        EnemyManager.enemies.splice(i, 1);

        if (this.bossManager.ui) {
          this.bossManager.ui.createParticleEffect(
            enemyCenterX,
            enemyCenterY,
            "#FFFF00",
            20
          );
        }

        console.log("💥 Enemigo eliminado por explosión de mina");
      }
    }
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  /**
   * Dibujar todas las minas
   */
  draw(ctx) {
    for (const mine of this.mines) {
      this.drawSingleMine(ctx, mine);
    }
  },

  /**
   * Dibujar una mina individual con tipos diferentes - CORREGIDA
   */
  drawSingleMine(ctx, mine) {
    ctx.save();

    // Dibujar zona de peligro según tipo
    if (mine.showDangerZone) {
      this.drawDangerZone(ctx, mine);
    }

    // Dibujar la mina según su tipo
    if (mine.type === "timer") {
      this.drawTimerMine(ctx, mine);
    } else if (mine.type === "proximity") {
      this.drawProximityMine(ctx, mine);
    } else {
      this.drawMineBody(ctx, mine); // Fallback para minas antiguas
    }

    // Dibujar contador de tiempo solo para minas de tiempo
    if (mine.type === "timer" && mine.timer < 180) {
      this.drawTimeCounter(ctx, mine);
    }

    ctx.restore();
  },

  /**
   * Dibujar zona de peligro de la mina
   */
  drawDangerZone(ctx, mine) {
    const centerX = mine.x + mine.width / 2;
    const centerY = mine.y + mine.height / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, mine.dangerRadius, 0, Math.PI * 2);

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
  },

  /**
   * Dibujar cuerpo de la mina
   */
  drawMineBody(ctx, mine) {
    let mineColor = mine.armed ? "#FF0000" : "#FF8800";

    // Parpadeo intenso cuando está por explotar
    if (mine.timer < 60) {
      const blinkIntensity =
        mine.blinkTimer % mine.blinkSpeed < mine.blinkSpeed / 2;
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

    // Detalles adicionales
    this.drawMineDetails(ctx, mine);
  },

  /**
   * Dibujar detalles de la mina
   */
  drawMineDetails(ctx, mine) {
    const centerX = mine.x + mine.width / 2;
    const centerY = mine.y + mine.height / 2;

    // Líneas de advertencia
    if (mine.armed) {
      ctx.strokeStyle = mine.warningPhase ? "#FFFF00" : "#FF8800";
      ctx.lineWidth = 2;

      // Cruz central
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY);
      ctx.lineTo(centerX + 10, centerY);
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX, centerY + 10);
      ctx.stroke();
    }

    // Pulso de energía cuando está por explotar
    if (mine.timer < 120) {
      const pulseRadius = Math.max(1, 5 + Math.sin(mine.blinkTimer * 0.3) * 8); // 🔥 CORREGIDO: Math.max(1, ...)
      ctx.strokeStyle = `rgba(255, 255, 0, 0.8)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  /**
   * Dibujar mina de tiempo (3 segundos) - NUEVO
   */
  drawTimerMine(ctx, mine) {
    let mineColor = "#FF4400";

    // Parpadeo intenso cuando está por explotar
    if (mine.timer < 60) {
      const blinkIntensity =
        mine.blinkTimer % mine.blinkSpeed < mine.blinkSpeed / 2;
      ctx.globalAlpha = blinkIntensity ? 1.0 : 0.3;
      mineColor = "#FFFFFF";
    } else if (mine.timer < 120) {
      const blinkIntensity =
        mine.blinkTimer % mine.blinkSpeed < mine.blinkSpeed / 2;
      ctx.globalAlpha = blinkIntensity ? 1.0 : 0.7;
      mineColor = "#FF6600";
    }

    // Sombra para la mina
    ctx.shadowColor = mineColor;
    ctx.shadowBlur = 20;

    // Cuerpo de la mina (circular para diferenciarse)
    const centerX = mine.x + mine.width / 2;
    const centerY = mine.y + mine.height / 2;
    const radius = mine.width / 2;

    ctx.fillStyle = mineColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Borde visible
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Indicador central
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Líneas de advertencia en cruz
    ctx.strokeStyle = mine.warningPhase ? "#FFFF00" : "#FF8800";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY);
    ctx.lineTo(centerX + 12, centerY);
    ctx.moveTo(centerX, centerY - 12);
    ctx.lineTo(centerX, centerY + 12);
    ctx.stroke();

    // Pulso de energía cuando está por explotar
    if (mine.timer < 120) {
      const pulseRadius = radius + Math.sin(mine.blinkTimer * 0.3) * 8;
      ctx.strokeStyle = `rgba(255, 255, 0, 0.8)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  /**
   * Dibujar mina de proximidad (se activa al pisarla) - NUEVO
   */
  drawProximityMine(ctx, mine) {
    const mineColor = mine.color || "#FF6600";

    // Parpadeo lento para minas de proximidad
    const blinkIntensity =
      mine.blinkTimer % mine.blinkSpeed < mine.blinkSpeed / 2;
    ctx.globalAlpha = blinkIntensity ? 1.0 : 0.6;

    // Sombra para la mina
    ctx.shadowColor = mineColor;
    ctx.shadowBlur = 15;

    // Cuerpo de la mina (hexagonal para diferenciarse)
    const centerX = mine.x + mine.width / 2;
    const centerY = mine.y + mine.height / 2;
    const radius = mine.width / 2;

    // Dibujar hexágono
    ctx.fillStyle = mineColor;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    // Borde visible
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Indicador central (triángulo de advertencia)
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 8);
    ctx.lineTo(centerX - 7, centerY + 5);
    ctx.lineTo(centerX + 7, centerY + 5);
    ctx.closePath();
    ctx.fill();

    // Símbolo de exclamación
    ctx.fillStyle = "#000000";
    ctx.fillRect(centerX - 1, centerY - 3, 2, 4);
    ctx.fillRect(centerX - 1, centerY + 2, 2, 2);

    // Ondas de proximidad
    const waveRadius = radius + Math.sin(mine.blinkTimer * 0.2) * 15;
    ctx.strokeStyle = `rgba(255, 102, 0, 0.4)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },

  /**
   * Dibujar contador de tiempo
   */
  drawTimeCounter(ctx, mine) {
    const centerX = mine.x + mine.width / 2;
    const textY = mine.y - 10;

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    const timeLeft = Math.ceil(mine.timer / 60);

    // Contorno negro
    ctx.strokeText(timeLeft.toString(), centerX, textY);
    // Texto blanco
    ctx.fillText(timeLeft.toString(), centerX, textY);
  },

  // ======================================================
  // GESTIÓN DE SECUENCIAS
  // ======================================================

  /**
   * Terminar secuencia de minas
   */
  endMineSequence() {
    console.log("💣 Secuencia de minas terminada");

    this.miningPhase = false;
    this.sequenceActive = false;

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "⚔️ ¡BOSS VULNERABLE OTRA VEZ!",
        "#00FF00"
      );
    }

    // El boss vuelve a ser vulnerable
    this.bossManager.isImmune = false;
    this.bossManager.immunityTimer = 0;
  },

  /**
   * Limpiar todas las minas
   */
  cleanup() {
    console.log("🧹 Limpiando sistema de minas");
    this.mines = [];
    this.miningPhase = false;
    this.sequenceActive = false;
    this.mineTimer = 0;
  },

  // ======================================================
  // RESET
  // ======================================================

  /**
   * Reset del sistema de minas
   */
  reset() {
    this.cleanup();
    this.initMineSystem();
    console.log("🔄 Sistema de minas reseteado");
  },

  // ======================================================
  // GETTERS Y UTILIDADES
  // ======================================================

  getMines() {
    return this.mines;
  },

  getMineCount() {
    return this.mines.length;
  },

  isMiningPhaseActive() {
    return this.miningPhase;
  },

  getArmedMineCount() {
    return this.mines.filter((mine) => mine.armed).length;
  },

  /**
   * Verificar si hay minas cerca de una posición
   */
  checkMinesNearPosition(x, y, radius = 100) {
    return this.mines.some((mine) => {
      const distance = Math.sqrt(
        Math.pow(x - (mine.x + mine.width / 2), 2) +
          Math.pow(y - (mine.y + mine.height / 2), 2)
      );
      return distance < radius;
    });
  },

  /**
   * Obtener la mina más cercana a una posición
   */
  getClosestMineToPosition(x, y) {
    if (this.mines.length === 0) return null;

    let closestMine = this.mines[0];
    let closestDistance = Math.sqrt(
      Math.pow(x - (closestMine.x + closestMine.width / 2), 2) +
        Math.pow(y - (closestMine.y + closestMine.height / 2), 2)
    );

    for (let i = 1; i < this.mines.length; i++) {
      const mine = this.mines[i];
      const distance = Math.sqrt(
        Math.pow(x - (mine.x + mine.width / 2), 2) +
          Math.pow(y - (mine.y + mine.height / 2), 2)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestMine = mine;
      }
    }

    return { mine: closestMine, distance: closestDistance };
  },
};

// Hacer disponible globalmente
window.BossMines = BossMines;

console.log("💣 boss-mines.js cargado - Sistema de minas listo");
