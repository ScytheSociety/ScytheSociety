/**
 * Hell Shooter - Boss Mines System OPTIMIZADO
 * Sistema modular de minas explosivas del boss
 */

const BossMines = {
  // ======================================================
  // ESTADO DEL SISTEMA DE MINAS
  // ======================================================

  bossManager: null,
  mines: [],
  miningPhase: false,
  sequenceActive: false,
  teleportInterval: null,

  // Configuración de minas
  mineConfig: {
    size: 40,
    dangerRadius: 120, // Radio más grande
    armingTime: 60,
    explosionTime: 300, // 5 segundos
    warningTime: 120,
    blinkSpeed: 10,
    chainReactionRadius: 150, // 🔥 NUEVO: Radio de explosión en cadena
  },

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.mines = [];
    this.miningPhase = false;
    this.sequenceActive = false;
    console.log("💣 Sistema de minas del boss inicializado");
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  update() {
    if (!this.bossManager.active) return;

    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mine = this.mines[i];
      this.updateSingleMine(mine);

      if (mine.timer <= 0) {
        this.explodeMine(i);
      }
    }
  },

  updateSingleMine(mine) {
    mine.timer--;
    mine.blinkTimer++;

    // Armar mina
    if (
      !mine.armed &&
      mine.timer <= this.mineConfig.explosionTime - this.mineConfig.armingTime
    ) {
      mine.armed = true;
    }

    // Fase de advertencia
    if (mine.timer <= this.mineConfig.warningTime) {
      mine.warningPhase = true;
    }

    // Parpadeo rápido al final
    if (mine.timer <= 60) {
      mine.blinkSpeed = 5;
    }
  },

  // ======================================================
  // 🔥 SISTEMA DE MINAS MEJORADO
  // ======================================================

  /**
   * 🔥 CORREGIDO: Secuencia agresiva de 90 segundos
   */
  startMineSequence() {
    console.log("💣 === INICIANDO FASE DE MINAS AGRESIVA (90s) ===");

    this.miningPhase = true;
    this.sequenceActive = true;

    // 🔥 ESTRATEGIA AGRESIVA:
    // - Teletransporte cada 1.5 segundos
    // - Mina inmediata en cada teletransporte
    // - Minas estáticas cada 5 segundos
    // - Minas con timer aleatorio

    this.teleportInterval = setInterval(() => {
      if (this.sequenceActive) {
        this.aggressiveTeleportAndMine();
      }
    }, 1500); // 🔥 MÁS RÁPIDO: cada 1.5 segundos

    // 🔥 MINAS ESTÁTICAS cada 5 segundos
    this.staticMineInterval = setInterval(() => {
      if (this.sequenceActive) {
        this.spawnStaticMineField();
      }
    }, 5000);

    // Terminar después de 90 segundos
    setTimeout(() => {
      this.endMineSequence();
    }, 90000);
  },

  /**
   * 🔥 NUEVO: Teletransporte agresivo cerca del jugador
   */
  aggressiveTeleportAndMine() {
    const playerPos = Player.getPosition();
    const canvas = window.getCanvas();

    // 🔥 POSICIONES MUY CERCA DEL JUGADOR (más agresivo)
    const huntingPositions = [
      { x: playerPos.x + 120, y: playerPos.y + 80 },
      { x: playerPos.x - 120, y: playerPos.y + 80 },
      { x: playerPos.x + 80, y: playerPos.y - 120 },
      { x: playerPos.x - 80, y: playerPos.y - 120 },
      { x: playerPos.x + 100, y: playerPos.y },
      { x: playerPos.x - 100, y: playerPos.y },
      { x: playerPos.x, y: playerPos.y + 100 },
      { x: playerPos.x, y: playerPos.y - 100 },
    ];

    const validPositions = huntingPositions.filter(
      (pos) =>
        pos.x >= 80 &&
        pos.x <= canvas.width - 80 &&
        pos.y >= 80 &&
        pos.y <= canvas.height - 80
    );

    if (validPositions.length > 0 && this.bossManager.boss) {
      const targetPos =
        validPositions[Math.floor(Math.random() * validPositions.length)];

      // 🔥 TELETRANSPORTAR BOSS AGRESIVAMENTE
      this.bossManager.boss.x = targetPos.x - this.bossManager.boss.width / 2;
      this.bossManager.boss.y = targetPos.y - this.bossManager.boss.height / 2;

      // Efecto visual intenso
      if (this.bossManager.ui) {
        this.bossManager.ui.createParticleEffect(
          targetPos.x,
          targetPos.y,
          "#FF8800",
          40
        );
      }

      // 🔥 MINA INMEDIATA con timer aleatorio
      const randomTimer = 180 + Math.random() * 120; // 3-5 segundos
      const mine = this.createMine(
        targetPos.x - 20,
        targetPos.y - 20,
        randomTimer
      );
      mine.armed = true;
      mine.type = "teleport"; // Tipo especial
      this.mines.push(mine);

      console.log(
        `💣 Boss teletransportado a (${Math.round(targetPos.x)}, ${Math.round(
          targetPos.y
        )}) + mina`
      );
    }
  },

  /**
   * 🔥 NUEVO: Campo de minas estáticas
   */
  spawnStaticMineField() {
    const canvas = window.getCanvas();
    const playerPos = Player.getPosition();

    // 🔥 3-4 minas estáticas en posiciones estratégicas
    const mineCount = 3 + Math.floor(Math.random() * 2);

    for (let i = 0; i < mineCount; i++) {
      // Posiciones que bloquean rutas de escape
      let x, y;

      if (i === 0) {
        // Primera mina: bloquear ruta hacia esquina superior izquierda
        x = playerPos.x - 150 - Math.random() * 100;
        y = playerPos.y - 150 - Math.random() * 100;
      } else if (i === 1) {
        // Segunda mina: bloquear ruta hacia esquina superior derecha
        x = playerPos.x + 150 + Math.random() * 100;
        y = playerPos.y - 150 - Math.random() * 100;
      } else if (i === 2) {
        // Tercera mina: bloquear escape hacia abajo
        x = playerPos.x + (Math.random() - 0.5) * 200;
        y = playerPos.y + 200 + Math.random() * 100;
      } else {
        // Mina extra: posición aleatoria peligrosa
        x = playerPos.x + (Math.random() - 0.5) * 300;
        y = playerPos.y + (Math.random() - 0.5) * 300;
      }

      // Mantener dentro de pantalla
      x = Math.max(60, Math.min(canvas.width - 60, x));
      y = Math.max(60, Math.min(canvas.height - 60, y));

      // 🔥 MINA ESTÁTICA (sin timer, explota solo por cadena o daño)
      const staticMine = this.createMine(x, y, null);
      staticMine.isStatic = true; // 🔥 NUEVA propiedad
      staticMine.armed = true;
      staticMine.type = "static";
      this.mines.push(staticMine);
    }

    console.log(`💣 Campo de ${mineCount} minas estáticas spawneado`);
  },

  /**
   * 🔥 CORREGIDO: Crear mina con tipos
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
      dangerRadius: this.mineConfig.dangerRadius,
      showDangerZone: true,
      warningPhase: false,
      pulseIntensity: 0,
      glowIntensity: 0.5,

      // 🔥 NUEVAS propiedades
      isStatic: false, // Mina estática (no explota por timer)
      type: "normal", // normal, teleport, static
    };
  },

  // ======================================================
  // 🔥 SISTEMA DE EXPLOSIONES EN CADENA
  // ======================================================

  /**
   * 🔥 MEJORADO: Explotar mina con cadena
   */
  explodeMine(index) {
    if (index < 0 || index >= this.mines.length) return;

    const mine = this.mines[index];
    console.log(`💥 Mina ${mine.type} explotando en (${mine.x}, ${mine.y})`);

    // Efectos visuales
    this.createExplosionEffects(mine);

    // Verificar daño al jugador
    this.checkPlayerDamage(mine);

    // 🔥 EXPLOSIÓN EN CADENA
    this.triggerChainReaction(mine, index);

    // Eliminar mina original
    this.mines.splice(index, 1);

    if (window.AudioManager) {
      AudioManager.playSound("explosion");
    }
  },

  /**
   * 🔥 NUEVO: Sistema de explosión en cadena
   */
  triggerChainReaction(explodedMine, excludeIndex) {
    const chainRadius = this.mineConfig.chainReactionRadius;
    const explodedX = explodedMine.x + explodedMine.width / 2;
    const explodedY = explodedMine.y + explodedMine.height / 2;

    // Buscar minas cercanas para explosión en cadena
    const minesToExplode = [];

    for (let i = 0; i < this.mines.length; i++) {
      if (i === excludeIndex) continue; // No explotar la misma mina

      const mine = this.mines[i];
      const mineX = mine.x + mine.width / 2;
      const mineY = mine.y + mine.height / 2;

      const distance = Math.sqrt(
        Math.pow(explodedX - mineX, 2) + Math.pow(explodedY - mineY, 2)
      );

      if (distance <= chainRadius && mine.armed) {
        minesToExplode.push(i);
      }
    }

    // Explotar minas en cadena con delay
    if (minesToExplode.length > 0) {
      console.log(`🔥 Explosión en cadena: ${minesToExplode.length} minas`);

      minesToExplode.forEach((mineIndex, delay) => {
        setTimeout(() => {
          // Verificar que la mina aún existe (podría haber sido eliminada por otra cadena)
          if (mineIndex < this.mines.length && this.mines[mineIndex]) {
            this.explodeMine(mineIndex);
          }
        }, delay * 150); // 150ms entre explosiones
      });
    }
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
   * Crear efectos visuales de explosión
   */
  createExplosionEffects(mine) {
    if (!this.bossManager.ui) return;

    const centerX = mine.x + mine.width / 2;
    const centerY = mine.y + mine.height / 2;

    // Múltiples ondas según tipo de mina
    const waveCount = mine.type === "static" ? 7 : 5;

    for (let i = 0; i < waveCount; i++) {
      setTimeout(() => {
        const color =
          mine.type === "static"
            ? "#FFFF00"
            : i % 2 === 0
            ? "#FF8800"
            : "#FF0000";
        this.bossManager.ui.createParticleEffect(centerX, centerY, color, 35);
      }, i * 100);
    }

    // Onda de choque especial para minas estáticas
    if (mine.type === "static") {
      setTimeout(() => {
        this.bossManager.ui.createParticleEffect(
          centerX,
          centerY,
          "#FFFFFF",
          60
        );
      }, 300);
    }
  },

  // ======================================================
  // RENDERIZADO MEJORADO
  // ======================================================

  draw(ctx) {
    for (const mine of this.mines) {
      this.drawSingleMine(ctx, mine);
    }
  },

  drawSingleMine(ctx, mine) {
    ctx.save();

    // Zona de peligro
    if (mine.showDangerZone) {
      this.drawDangerZone(ctx, mine);
    }

    // Cuerpo de la mina con tipo
    this.drawMineBody(ctx, mine);

    // 🔥 CONTADOR solo para minas con timer
    if (!mine.isStatic && mine.timer < 180) {
      this.drawTimeCounter(ctx, mine);
    }

    // 🔥 INDICADOR de mina estática
    if (mine.isStatic) {
      this.drawStaticIndicator(ctx, mine);
    }

    ctx.restore();
  },

  drawDangerZone(ctx, mine) {
    const centerX = mine.x + mine.width / 2;
    const centerY = mine.y + mine.height / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, mine.dangerRadius, 0, Math.PI * 2);

    // Color según tipo y fase
    if (mine.isStatic) {
      // Minas estáticas: amarillo constante
      ctx.strokeStyle = "rgba(255, 255, 0, 0.7)";
      ctx.fillStyle = "rgba(255, 255, 0, 0.1)";
    } else if (mine.warningPhase) {
      // Rojo parpadeante
      const alpha = 0.3 + Math.sin(mine.blinkTimer * 0.5) * 0.2;
      ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.1})`;
    } else {
      // Naranja normal
      ctx.strokeStyle = "rgba(255, 136, 0, 0.6)";
      ctx.fillStyle = "rgba(255, 136, 0, 0.05)";
    }

    ctx.fill();
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
  },

  drawMineBody(ctx, mine) {
    let mineColor;

    // Color según tipo
    if (mine.isStatic) {
      mineColor = "#FFFF00"; // Amarillo para estáticas
    } else {
      mineColor = mine.armed ? "#FF0000" : "#FF8800";
    }

    // Parpadeo cuando está por explotar
    if (!mine.isStatic && mine.timer < 60) {
      const blinkIntensity =
        mine.blinkTimer % mine.blinkSpeed < mine.blinkSpeed / 2;
      ctx.globalAlpha = blinkIntensity ? 1.0 : 0.3;
      mineColor = "#FFFFFF";
    }

    // Sombra
    ctx.shadowColor = mineColor;
    ctx.shadowBlur = 15;

    // Cuerpo
    ctx.fillStyle = mineColor;
    ctx.fillRect(mine.x, mine.y, mine.width, mine.height);

    // Borde
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(mine.x, mine.y, mine.width, mine.height);

    // Centro
    ctx.fillStyle = "#FFFFFF";
    const centerSize = mine.width * 0.3;
    ctx.fillRect(
      mine.x + (mine.width - centerSize) / 2,
      mine.y + (mine.height - centerSize) / 2,
      centerSize,
      centerSize
    );

    // Detalles según tipo
    this.drawMineDetails(ctx, mine);
  },

  drawMineDetails(ctx, mine) {
    const centerX = mine.x + mine.width / 2;
    const centerY = mine.y + mine.height / 2;

    if (mine.armed) {
      ctx.strokeStyle = mine.isStatic
        ? "#000000"
        : mine.warningPhase
        ? "#FFFF00"
        : "#FF8800";
      ctx.lineWidth = 2;

      // Cruz central
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY);
      ctx.lineTo(centerX + 10, centerY);
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX, centerY + 10);
      ctx.stroke();
    }

    // Pulso para minas con timer bajo
    if (!mine.isStatic && mine.timer < 120) {
      const pulseRadius = Math.max(1, 5 + Math.sin(mine.blinkTimer * 0.3) * 8);
      ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  /**
   * 🔥 NUEVO: Indicador para minas estáticas
   */
  drawStaticIndicator(ctx, mine) {
    const centerX = mine.x + mine.width / 2;
    const textY = mine.y - 15;

    ctx.fillStyle = "#FFFF00";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    // Contorno negro
    ctx.strokeText("∞", centerX, textY);
    // Símbolo infinito amarillo
    ctx.fillText("∞", centerX, textY);
  },

  drawTimeCounter(ctx, mine) {
    const centerX = mine.x + mine.width / 2;
    const textY = mine.y - 10;

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    const timeLeft = Math.ceil(mine.timer / 60);

    ctx.strokeText(timeLeft.toString(), centerX, textY);
    ctx.fillText(timeLeft.toString(), centerX, textY);
  },

  // ======================================================
  // CLEANUP
  // ======================================================

  endMineSequence() {
    console.log("💣 Secuencia de minas terminada (90s completados)");

    this.miningPhase = false;
    this.sequenceActive = false;

    // Limpiar intervalos
    if (this.teleportInterval) {
      clearInterval(this.teleportInterval);
      this.teleportInterval = null;
    }

    if (this.staticMineInterval) {
      clearInterval(this.staticMineInterval);
      this.staticMineInterval = null;
    }

    // 🔥 NUEVA lógica: Si es fase aleatoria, no hacer vulnerable
    if (this.bossManager.phases && this.bossManager.phases.isRandomPhase) {
      console.log(
        "💣 Fase aleatoria completada - delegando al sistema de fases"
      );
      return;
    }

    // Boss vulnerable y vuelve a hunting
    this.bossManager.isImmune = false;
    this.bossManager.immunityTimer = 0;

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("⚔️ ¡BOSS VULNERABLE!", "#00FF00");
    }

    // Entrar en modo hunting fluido
    setTimeout(() => {
      if (this.bossManager.movement) {
        this.bossManager.movement.enableFluidHunting();
      }
    }, 1000);
  },

  cleanup() {
    console.log("🧹 Limpiando sistema de minas");
    this.mines = [];
    this.miningPhase = false;
    this.sequenceActive = false;

    if (this.teleportInterval) {
      clearInterval(this.teleportInterval);
      this.teleportInterval = null;
    }

    if (this.staticMineInterval) {
      clearInterval(this.staticMineInterval);
      this.staticMineInterval = null;
    }
  },

  reset() {
    this.cleanup();
    console.log("🔄 Sistema de minas reseteado");
  },

  // ======================================================
  // GETTERS
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
  getStaticMineCount() {
    return this.mines.filter((mine) => mine.isStatic).length;
  },
};

window.BossMines = BossMines;
console.log(
  "💣 boss-mines.js OPTIMIZADO cargado - Sistema de minas mejorado listo"
);
