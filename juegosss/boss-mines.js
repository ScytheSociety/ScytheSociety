/**
 * Hell Shooter - Boss Mines System Optimizado
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
  staticMineInterval: null,

  // Al inicio del archivo, reemplazar mineConfig:
  mineConfig: {
    size: GameConfig.isMobile ? 35 : 40, // Más pequeñas en móvil
    dangerRadius: GameConfig.isMobile ? 100 : 120, // Radio menor en móvil
    staticDangerRadius: GameConfig.isMobile ? 70 : 80,
    armingTime: 60,
    explosionTime: 300,
    warningTime: 120,
    blinkSpeed: 10,
    chainReactionRadius: GameConfig.isMobile ? 130 : 150,
    minDistanceBetweenMines: GameConfig.isMobile ? 80 : 60,
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
  // SISTEMA DE MINAS MEJORADO
  // ======================================================

  startMineSequence() {
    console.log("💣 === INICIANDO FASE DE MINAS AGRESIVA (90s) ===");

    this.miningPhase = true;
    this.sequenceActive = true;

    // Teletransporte cada 2.5 segundos
    this.teleportInterval = setInterval(() => {
      if (this.sequenceActive) {
        this.aggressiveTeleportAndMine();
      }
    }, 2500);

    // Minas estáticas cada 5 segundos
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

  aggressiveTeleportAndMine() {
    const playerPos = Player.getPosition();
    const canvas = window.getCanvas();

    // Distancias adaptadas por dispositivo
    const baseDistance = GameConfig.isMobile ? 400 : 300; // Más lejos en móvil
    const extraDistance = GameConfig.isMobile ? 200 : 150;

    const huntingPositions = [
      { x: playerPos.x + baseDistance, y: playerPos.y + extraDistance },
      { x: playerPos.x - baseDistance, y: playerPos.y + extraDistance },
      { x: playerPos.x + extraDistance, y: playerPos.y - baseDistance },
      { x: playerPos.x - extraDistance, y: playerPos.y - baseDistance },
      { x: playerPos.x + (baseDistance + 50), y: playerPos.y },
      { x: playerPos.x - (baseDistance + 50), y: playerPos.y },
      { x: playerPos.x, y: playerPos.y + (baseDistance + 50) },
      { x: playerPos.x, y: playerPos.y - (baseDistance + 50) },
    ];

    // Márgenes más grandes en móvil
    const margin = GameConfig.isMobile ? 200 : 150;
    const validPositions = huntingPositions.filter(
      (pos) =>
        pos.x >= margin &&
        pos.x <= canvas.width - margin &&
        pos.y >= margin &&
        pos.y <= canvas.height - margin
    );

    if (validPositions.length > 0 && this.bossManager.boss) {
      const targetPos =
        validPositions[Math.floor(Math.random() * validPositions.length)];

      // Boss aparece AÚN más lejos en móvil
      const bossVariation = GameConfig.isMobile ? 200 : 150;
      const bossX =
        targetPos.x -
        this.bossManager.boss.width / 2 +
        (Math.random() - 0.5) * bossVariation;
      const bossY =
        targetPos.y -
        this.bossManager.boss.height / 2 +
        (Math.random() - 0.5) * bossVariation;

      const bossMargin = GameConfig.isMobile ? 120 : 80;
      this.bossManager.boss.x = Math.max(
        bossMargin,
        Math.min(canvas.width - this.bossManager.boss.width - bossMargin, bossX)
      );
      this.bossManager.boss.y = Math.max(
        bossMargin,
        Math.min(
          canvas.height - this.bossManager.boss.height - bossMargin,
          bossY
        )
      );

      // Crear efecto visual
      if (this.bossManager.ui) {
        this.bossManager.ui.createParticleEffect(
          this.bossManager.boss.x + this.bossManager.boss.width / 2,
          this.bossManager.boss.y + this.bossManager.boss.height / 2,
          "#FF8800",
          GameConfig.isMobile ? 15 : 40
        );
      }

      // Mina más lejos del jugador en móvil
      const mineDistanceFromPlayer = GameConfig.isMobile ? 250 : 180;

      let mineX, mineY;
      let attempts = 0;

      do {
        mineX = targetPos.x - 20 + (Math.random() - 0.5) * 100;
        mineY = targetPos.y - 20 + (Math.random() - 0.5) * 100;

        const distanceToPlayer = Math.sqrt(
          Math.pow(mineX - playerPos.x, 2) + Math.pow(mineY - playerPos.y, 2)
        );

        if (distanceToPlayer >= mineDistanceFromPlayer) {
          break;
        }
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        const angle = Math.random() * Math.PI * 2;
        mineX = playerPos.x + Math.cos(angle) * mineDistanceFromPlayer;
        mineY = playerPos.y + Math.sin(angle) * mineDistanceFromPlayer;
      }

      const minePos = this.getValidMinePosition(mineX, mineY);
      const randomTimer = 420 + Math.random() * 120; // Más tiempo para reaccionar
      const mine = this.createMine(minePos.x, minePos.y, randomTimer);
      mine.armed = true;
      mine.type = "teleport";
      this.mines.push(mine);

      console.log(
        `💣 Boss teletransportado LEJOS (${
          GameConfig.isMobile ? "MÓVIL" : "PC"
        })`
      );
    }
  },

  spawnStaticMineField() {
    const canvas = window.getCanvas();
    const playerPos = Player.getPosition();
    const mineCount = 2 + Math.floor(Math.random() * 2); // 2-3 minas (era 3-4)

    for (let i = 0; i < mineCount; i++) {
      let x, y;
      const minDistanceFromPlayer = 200; // Distancia mínima del jugador

      if (i === 0) {
        // Bloquear ruta hacia esquina superior izquierda - MÁS LEJOS
        x = playerPos.x - 250 - Math.random() * 100; // Era 200
        y = playerPos.y - 250 - Math.random() * 100; // Era 200
      } else if (i === 1) {
        // Bloquear ruta hacia esquina superior derecha - MÁS LEJOS
        x = playerPos.x + 250 + Math.random() * 100; // Era 200
        y = playerPos.y - 250 - Math.random() * 100; // Era 200
      } else if (i === 2) {
        // Bloquear escape hacia abajo - MÁS LEJOS
        x = playerPos.x + (Math.random() - 0.5) * 200; // Era 150
        y = playerPos.y + 300 + Math.random() * 100; // Era 250
      }

      // Mantener dentro de pantalla con más margen
      x = Math.max(120, Math.min(canvas.width - 120, x)); // Era 80
      y = Math.max(120, Math.min(canvas.height - 120, y)); // Era 80

      // 🔥 NUEVO: Verificar que no esté muy cerca del jugador
      const distanceToPlayer = Math.sqrt(
        Math.pow(x - playerPos.x, 2) + Math.pow(y - playerPos.y, 2)
      );

      if (distanceToPlayer < minDistanceFromPlayer) {
        // Mover la mina más lejos en dirección opuesta al jugador
        const angle = Math.atan2(y - playerPos.y, x - playerPos.x);
        x = playerPos.x + Math.cos(angle) * minDistanceFromPlayer;
        y = playerPos.y + Math.sin(angle) * minDistanceFromPlayer;

        // Reajustar dentro de pantalla
        x = Math.max(120, Math.min(canvas.width - 120, x));
        y = Math.max(120, Math.min(canvas.height - 120, y));
      }

      const validPos = this.getValidMinePosition(x, y);

      // Crear mina estática con más tiempo
      const staticMine = this.createMine(validPos.x, validPos.y, null);
      staticMine.isStatic = true;
      staticMine.armed = true;
      staticMine.type = "static";
      staticMine.dangerRadius = this.mineConfig.staticDangerRadius;
      this.mines.push(staticMine);
    }

    console.log(`💣 Campo de ${mineCount} minas estáticas spawneado MÁS LEJOS`);
  },

  // Función para evitar minas superpuestas
  getValidMinePosition(x, y) {
    const maxAttempts = 10;
    let attempts = 0;
    let validX = x;
    let validY = y;

    while (attempts < maxAttempts) {
      let tooClose = false;

      for (const existingMine of this.mines) {
        const distance = Math.sqrt(
          Math.pow(validX - existingMine.x, 2) +
            Math.pow(validY - existingMine.y, 2)
        );

        if (distance < this.mineConfig.minDistanceBetweenMines) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        break;
      }

      // Intentar nueva posición
      validX = x + (Math.random() - 0.5) * 120;
      validY = y + (Math.random() - 0.5) * 120;
      attempts++;
    }

    return { x: validX, y: validY };
  },

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
      dangerRadius: this.mineConfig.dangerRadius, // Se ajustará para estáticas
      showDangerZone: true,
      warningPhase: false,
      pulseIntensity: 0,
      glowIntensity: 0.5,
      isStatic: false,
      type: "normal",
    };
  },

  // ======================================================
  // SISTEMA DE EXPLOSIONES
  // ======================================================

  explodeMine(index) {
    if (index < 0 || index >= this.mines.length) return;

    const mine = this.mines[index];
    console.log(`💥 Mina ${mine.type} explotando en (${mine.x}, ${mine.y})`);

    this.createExplosionEffects(mine);
    this.checkPlayerDamage(mine);
    this.triggerChainReaction(mine, index);

    // Eliminar mina original
    this.mines.splice(index, 1);

    if (window.AudioManager) {
      AudioManager.playSound("explosion");
    }
  },

  triggerChainReaction(explodedMine, excludeIndex) {
    const chainRadius = this.mineConfig.chainReactionRadius;
    const explodedX = explodedMine.x + explodedMine.width / 2;
    const explodedY = explodedMine.y + explodedMine.height / 2;

    const minesToExplode = [];

    for (let i = 0; i < this.mines.length; i++) {
      if (i === excludeIndex) continue;

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

    if (minesToExplode.length > 0) {
      console.log(`🔥 Explosión en cadena: ${minesToExplode.length} minas`);

      minesToExplode.forEach((mineIndex, delay) => {
        setTimeout(() => {
          if (mineIndex < this.mines.length && this.mines[mineIndex]) {
            this.explodeMine(mineIndex);
          }
        }, delay * 150);
      });
    }
  },

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

  createExplosionEffects(mine) {
    if (!this.bossManager.ui) return;

    const centerX = mine.x + mine.width / 2;
    const centerY = mine.y + mine.height / 2;
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

    if (mine.showDangerZone) {
      this.drawDangerZone(ctx, mine);
    }

    this.drawMineBody(ctx, mine);

    if (!mine.isStatic && mine.timer < 180) {
      this.drawTimeCounter(ctx, mine);
    }

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

    if (mine.isStatic) {
      ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
      ctx.fillStyle = "rgba(255, 255, 0, 0.15)";
    } else if (mine.warningPhase) {
      const alpha = 0.4 + Math.sin(mine.blinkTimer * 0.5) * 0.3;
      ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.15})`;
    } else {
      ctx.strokeStyle = "rgba(255, 136, 0, 0.7)";
      ctx.fillStyle = "rgba(255, 136, 0, 0.08)";
    }

    ctx.fill();
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
  },

  drawMineBody(ctx, mine) {
    const centerX = mine.x + mine.width / 2;
    const centerY = mine.y + mine.height / 2;
    const radius = mine.width / 2;

    // Color base según tipo y estado
    let baseColor = mine.isStatic
      ? "#FFAA00"
      : mine.armed
      ? "#CC0000"
      : "#FF6600";

    if (!mine.isStatic && mine.timer < 60) {
      const blinkIntensity =
        mine.blinkTimer % mine.blinkSpeed < mine.blinkSpeed / 2;
      ctx.globalAlpha = blinkIntensity ? 1.0 : 0.4;
      baseColor = "#FFFFFF";
    }

    // Sombra y resplandor
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = mine.isStatic ? 25 : 20;

    // Cuerpo principal (círculo)
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius
    );
    gradient.addColorStop(0, this.lightenColor(baseColor, 0.3));
    gradient.addColorStop(0.7, baseColor);
    gradient.addColorStop(1, this.darkenColor(baseColor, 0.3));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Borde exterior
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Borde interior
    ctx.strokeStyle = this.darkenColor(baseColor, 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    // Centro brillante
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    this.drawMineDetails(ctx, mine, centerX, centerY, radius);
  },

  drawMineDetails(ctx, mine, centerX, centerY, radius) {
    if (mine.armed) {
      // Cruz central más detallada
      ctx.strokeStyle = mine.isStatic
        ? "#000000"
        : mine.warningPhase
        ? "#FFFF00"
        : "#FFAA00";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(centerX - radius * 0.6, centerY);
      ctx.lineTo(centerX + radius * 0.6, centerY);
      ctx.moveTo(centerX, centerY - radius * 0.6);
      ctx.lineTo(centerX, centerY + radius * 0.6);
      ctx.stroke();

      // Pequeños círculos en los extremos de la cruz
      const crossPoints = [
        { x: centerX - radius * 0.6, y: centerY },
        { x: centerX + radius * 0.6, y: centerY },
        { x: centerX, y: centerY - radius * 0.6 },
        { x: centerX, y: centerY + radius * 0.6 },
      ];

      ctx.fillStyle = ctx.strokeStyle;
      crossPoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Pulso de advertencia para minas con timer bajo
    if (!mine.isStatic && mine.timer < 120) {
      const pulseRadius = radius + 5 + Math.sin(mine.blinkTimer * 0.4) * 15;
      const pulseAlpha = 0.8 - ((mine.blinkTimer % 60) / 60) * 0.6;

      ctx.strokeStyle = `rgba(255, 255, 0, ${pulseAlpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Efecto de peligro para minas estáticas
    if (mine.isStatic) {
      const dangerPulse = Math.sin(mine.blinkTimer * 0.1) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255, 255, 0, ${dangerPulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  drawStaticIndicator(ctx, mine) {
    const centerX = mine.x + mine.width / 2;
    const textY = mine.y - 20;

    // Fondo para el símbolo
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(centerX - 15, textY - 15, 30, 20);

    ctx.fillStyle = "#FFFF00";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;

    ctx.strokeText("∞", centerX, textY);
    ctx.fillText("∞", centerX, textY);
  },

  drawTimeCounter(ctx, mine) {
    const centerX = mine.x + mine.width / 2;
    const textY = mine.y - 15;

    const timeLeft = Math.ceil(mine.timer / 60);

    // Fondo para el contador
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(centerX - 12, textY - 12, 24, 18);

    // Color del texto según tiempo restante
    let textColor = "#FFFFFF";
    if (timeLeft <= 2) {
      textColor = "#FF0000";
    } else if (timeLeft <= 3) {
      textColor = "#FFAA00";
    }

    ctx.fillStyle = textColor;
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    ctx.strokeText(timeLeft.toString(), centerX, textY);
    ctx.fillText(timeLeft.toString(), centerX, textY);
  },

  // ======================================================
  // FUNCIONES AUXILIARES PARA COLORES
  // ======================================================

  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  },

  darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = (num >> 16) - amt;
    const G = ((num >> 8) & 0x00ff) - amt;
    const B = (num & 0x0000ff) - amt;
    return (
      "#" +
      (
        0x1000000 +
        (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
        (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
        (B > 255 ? 255 : B < 0 ? 0 : B)
      )
        .toString(16)
        .slice(1)
    );
  },

  // ======================================================
  // CLEANUP Y GESTIÓN
  // ======================================================

  endMineSequence() {
    console.log("💣 Secuencia de minas terminada (90s completados)");

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

    // Si es fase aleatoria, no hacer vulnerable
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

console.log("💣 boss-mines.js optimizado cargado");
