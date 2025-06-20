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
   * Actualizar una mina individual
   */
  updateSingleMine(mine) {
    mine.timer--;
    mine.blinkTimer++;

    // Armar mina después del tiempo de armado
    if (
      !mine.armed &&
      mine.timer <= this.mineConfig.explosionTime - this.mineConfig.armingTime
    ) {
      mine.armed = true;
      console.log("💣 Mina armada y peligrosa");

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage("⚠️ MINA ARMADA", "#FF8800");
      }
    }

    // Activar fase de advertencia
    if (mine.timer <= this.mineConfig.warningTime) {
      mine.warningPhase = true;
    }

    // Aumentar intensidad de parpadeo cerca de la explosión
    if (mine.timer <= 60) {
      // Último segundo
      mine.blinkSpeed = 5; // Parpadeo más rápido
    }
  },

  // ======================================================
  // CREACIÓN DE MINAS
  // ======================================================

  /**
   * Iniciar secuencia inteligente de minas - MEJORADA PARA 90 SEGUNDOS
   */
  startMineSequence() {
    console.log("💣 Boss iniciando secuencia de minas inteligente (90s)");

    this.miningPhase = true;
    this.sequenceActive = true;
    this.mineTimer = 0;
    this.teleportCooldown = 0;

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "💣 ¡SECUENCIA DE MINAS ACTIVADA!",
        "#FF8800"
      );
    }

    // 🔥 TELETRANSPORTE INTELIGENTE CADA 3 SEGUNDOS
    this.teleportInterval = setInterval(() => {
      if (this.sequenceActive) {
        this.intelligentTeleportAndMine();
      }
    }, 3000);

    // 🔥 TERMINAR DESPUÉS DE 90 SEGUNDOS
    setTimeout(() => {
      this.endMineSequence();
    }, 90000);
  },

  /**
   * 🔥 NUEVA: Teletransporte inteligente que sigue al jugador
   */
  intelligentTeleportAndMine() {
    const playerPos = Player.getPosition();
    const canvas = window.getCanvas();

    // 🔥 ESTRATEGIA: Teletransportarse cerca de donde ESTABA el jugador
    let targetX = playerPos.x + (Math.random() - 0.5) * 200;
    let targetY = playerPos.y + (Math.random() - 0.5) * 200;

    // Mantener dentro de pantalla
    targetX = Math.max(100, Math.min(canvas.width - 100, targetX));
    targetY = Math.max(100, Math.min(canvas.height - 100, targetY));

    // Teletransportar boss
    if (this.bossManager.boss) {
      this.bossManager.boss.x = targetX - this.bossManager.boss.width / 2;
      this.bossManager.boss.y = targetY - this.bossManager.boss.height / 2;

      // Efecto visual de teletransporte
      if (this.bossManager.ui) {
        this.bossManager.ui.createParticleEffect(
          targetX,
          targetY,
          "#FF8800",
          30
        );
      }

      // Dejar mina en la posición de teletransporte
      setTimeout(() => {
        const mine = this.createMine(targetX - 20, targetY - 20, 300); // 5 segundos
        mine.armed = true;
        mine.warningPhase = true;
        this.mines.push(mine);

        if (this.bossManager.comments) {
          this.bossManager.comments.sayComment("¡Esquiva esto si puedes!");
        }
      }, 500);
    }
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
   * Explotar una mina específica
   */
  explodeMine(index) {
    if (index < 0 || index >= this.mines.length) return;

    const mine = this.mines[index];

    console.log(`💥 Mina explotando en (${mine.x}, ${mine.y})`);

    // Efectos visuales espectaculares
    this.createExplosionEffects(mine);

    // Verificar daño al jugador
    this.checkPlayerDamage(mine);

    // Verificar daño a otros enemigos
    this.checkEnemyDamage(mine);

    // Eliminar mina
    this.mines.splice(index, 1);

    if (window.AudioManager) {
      AudioManager.playSound("explosion");
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
   * Dibujar una mina individual
   */
  drawSingleMine(ctx, mine) {
    ctx.save();

    // Dibujar zona de peligro
    if (mine.showDangerZone) {
      this.drawDangerZone(ctx, mine);
    }

    // Dibujar la mina
    this.drawMineBody(ctx, mine);

    // Dibujar contador de tiempo
    if (mine.timer < 180) {
      // Mostrar en los últimos 3 segundos
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
    console.log("💣 Secuencia de minas terminada (90s completados)");

    this.miningPhase = false;
    this.sequenceActive = false;

    // 🔥 NUEVO: Si es fase aleatoria, no hacer vulnerable automáticamente
    if (this.bossManager.phases && this.bossManager.phases.isRandomPhase) {
      console.log(
        "💣 Fase aleatoria completada - delegando al sistema de fases"
      );
      return; // El sistema de fases manejará el retorno a Yan Ken Po
    }

    // 🔥 LIMPIAR INTERVALO DE TELETRANSPORTE
    if (this.teleportInterval) {
      clearInterval(this.teleportInterval);
      this.teleportInterval = null;
    }

    // 🔥 CENTRAR BOSS Y MENSAJE FINAL
    if (this.bossManager.movement) {
      this.bossManager.movement.teleportToCenter();
    }

    if (this.bossManager.comments) {
      this.bossManager.comments.sayComment(
        "¡Fase de minas completada! ¡Ahora vengan por mí!"
      );
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "⚔️ ¡BOSS VULNERABLE OTRA VEZ!",
        "#00FF00"
      );
    }

    // El boss vuelve a ser vulnerable
    this.bossManager.isImmune = false;
    this.bossManager.immunityTimer = 0;

    // 🔥 REANUDAR MOVIMIENTO NORMAL
    setTimeout(() => {
      if (this.bossManager.movement) {
        this.bossManager.movement.enableWandering();
      }
    }, 2000);
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
