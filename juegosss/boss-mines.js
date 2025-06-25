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

  // Configuración responsiva de minas
  get mineConfig() {
    const canvas = window.getCanvas();
    const screenScale = Math.min(canvas.width, canvas.height) / 800;
    const mobileScale = GameConfig.isMobile ? 0.7 : 1.0;

    return {
      // 🔥 TAMAÑO NORMAL para minas temporales
      size: Math.max(25, 40 * screenScale * mobileScale), // Volver al tamaño original
      dangerRadius: Math.max(80, 120 * screenScale * mobileScale), // Volver al original
      staticDangerRadius: Math.max(60, 80 * screenScale * mobileScale),
      armingTime: 60,
      explosionTime: 300,
      warningTime: 120,
      blinkSpeed: 10,
      chainReactionRadius: Math.max(100, 150 * screenScale * mobileScale),
      minDistanceBetweenMines: Math.max(40, 60 * screenScale * mobileScale),
    };
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

    // 🔥 COLISIÓN SOLO PARA MINAS ESTÁTICAS
    if (mine.armed && mine.isStatic) {
      this.checkStaticMinePlayerCollision(mine);
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

  checkStaticMinePlayerCollision(mine) {
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

    // 🔥 COLISIÓN DIRECTA SOLO CON MINAS ESTÁTICAS
    if (distance < mine.width / 2 + playerSize.width / 2) {
      console.log("💥 Jugador pisó mina ESTÁTICA");

      player.takeDamage();

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "💥 ¡PISASTE MINA ESTÁTICA!",
          "#FFFF00"
        );
      }

      // Explotar inmediatamente y causar reacción en cadena
      const mineIndex = this.mines.indexOf(mine);
      if (mineIndex !== -1) {
        this.explodeMine(mineIndex);
      }
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

    // 🔥 USAR CONFIGURACIÓN DINÁMICA
    const duration = GameConfig.BOSS_PHASE_CONFIG.MINES_DURATION * (1000 / 60); // Convertir frames a ms
    console.log(`💣 Fase de minas durará ${duration / 1000}s`);

    setTimeout(() => {
      this.endMineSequence();
    }, duration);
  },

  aggressiveTeleportAndMine() {
    const playerPos = Player.getPosition();
    const canvas = window.getCanvas();

    // 🔥 NUEVO: Spawnar minas por TODO EL MAPA (no solo cerca del jugador)
    this.spawnRandomMapMines();

    // Boss sigue apareciendo cerca del jugador pero más lejos
    const baseDistance = GameConfig.isMobile ? 400 : 300;
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

      if (this.bossManager.ui) {
        this.bossManager.ui.createParticleEffect(
          this.bossManager.boss.x + this.bossManager.boss.width / 2,
          this.bossManager.boss.y + this.bossManager.boss.height / 2,
          "#FF8800",
          GameConfig.isMobile ? 15 : 40
        );
      }

      // 🔥 MINA ESPECÍFICA DONDE ESTÁ EL JUGADOR AHORA
      this.spawnTargetedMine(playerPos);

      console.log(
        `💣 Boss teletransportado + minas globales spawneadas (${
          GameConfig.isMobile ? "MÓVIL" : "PC"
        })`
      );
    }
  },

  spawnRandomMapMines() {
    const canvas = window.getCanvas();
    const mineCount = 2 + Math.floor(Math.random() * 2); // 2-3 minas

    for (let i = 0; i < mineCount; i++) {
      // 🔥 POSICIONES COMPLETAMENTE ALEATORIAS EN TODO EL MAPA
      const x = 120 + Math.random() * (canvas.width - 240);
      const y = 120 + Math.random() * (canvas.height - 240);

      const validPos = this.getValidMinePosition(x, y);
      const randomTimer = 420 + Math.random() * 120;

      const mine = this.createMine(validPos.x, validPos.y, randomTimer);
      mine.armed = true;
      mine.type = "global";
      this.mines.push(mine);
    }

    console.log(`💣 ${mineCount} minas globales spawneadas aleatoriamente`);
  },

  spawnTargetedMine(playerPos) {
    // Mina específica donde está el jugador (pero no muy cerca)
    const angle = Math.random() * Math.PI * 2;
    const distance = 180 + Math.random() * 120; // Entre 180-300px del jugador

    const x = playerPos.x + Math.cos(angle) * distance;
    const y = playerPos.y + Math.sin(angle) * distance;

    const canvas = window.getCanvas();
    const clampedX = Math.max(80, Math.min(canvas.width - 80, x));
    const clampedY = Math.max(80, Math.min(canvas.height - 80, y));

    const validPos = this.getValidMinePosition(clampedX, clampedY);
    const randomTimer = 360 + Math.random() * 120;

    const mine = this.createMine(validPos.x, validPos.y, randomTimer);
    mine.armed = true;
    mine.type = "targeted";
    this.mines.push(mine);

    console.log(`💣 Mina dirigida spawneada cerca del jugador`);
  },

  spawnStaticMineField() {
    const canvas = window.getCanvas();
    const playerPos = Player.getPosition();
    const mineCount = 2 + Math.floor(Math.random() * 2); // 2-3 minas

    for (let i = 0; i < mineCount; i++) {
      let x, y;
      const minDistanceFromPlayer = 200;

      // 🔥 NUEVO: Detectar ubicación del jugador y spawnar minas estratégicamente
      if (i === 0) {
        // Primera mina: SIEMPRE cerca de donde está el jugador ahora
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 100; // 150-250px del jugador
        x = playerPos.x + Math.cos(angle) * distance;
        y = playerPos.y + Math.sin(angle) * distance;
        console.log(
          `💣 Mina estratégica 1 dirigida a jugador en (${Math.round(
            playerPos.x
          )}, ${Math.round(playerPos.y)})`
        );
      } else if (i === 1) {
        // Segunda mina: Bloquear posible escape
        if (playerPos.y > canvas.height * 0.7) {
          // Si está abajo, mina arriba para bloquear escape
          x = playerPos.x + (Math.random() - 0.5) * 200;
          y = playerPos.y - 200 - Math.random() * 100;
          console.log(
            `💣 Jugador ABAJO detectado - mina bloqueando escape ARRIBA`
          );
        } else if (playerPos.y < canvas.height * 0.3) {
          // Si está arriba, mina abajo
          x = playerPos.x + (Math.random() - 0.5) * 200;
          y = playerPos.y + 200 + Math.random() * 100;
          console.log(
            `💣 Jugador ARRIBA detectado - mina bloqueando escape ABAJO`
          );
        } else {
          // Si está en el centro, mina lateral
          x = playerPos.x + (Math.random() < 0.5 ? -250 : 250);
          y = playerPos.y + (Math.random() - 0.5) * 150;
          console.log(`💣 Jugador CENTRO detectado - mina lateral`);
        }
      } else if (i === 2) {
        // Tercera mina: Completamente aleatoria para presión general
        x = 120 + Math.random() * (canvas.width - 240);
        y = 120 + Math.random() * (canvas.height - 240);
        console.log(`💣 Mina aleatoria para presión general`);
      }

      // Mantener dentro de pantalla
      x = Math.max(120, Math.min(canvas.width - 120, x));
      y = Math.max(120, Math.min(canvas.height - 120, y));

      // Solo verificar distancia mínima para las minas no dirigidas
      if (i > 0) {
        const distanceToPlayer = Math.sqrt(
          Math.pow(x - playerPos.x, 2) + Math.pow(y - playerPos.y, 2)
        );

        if (distanceToPlayer < minDistanceFromPlayer) {
          const angle = Math.atan2(y - playerPos.y, x - playerPos.x);
          x = playerPos.x + Math.cos(angle) * minDistanceFromPlayer;
          y = playerPos.y + Math.sin(angle) * minDistanceFromPlayer;

          x = Math.max(120, Math.min(canvas.width - 120, x));
          y = Math.max(120, Math.min(canvas.height - 120, y));
        }
      }

      const validPos = this.getValidMinePosition(x, y);

      const staticMine = this.createMine(validPos.x, validPos.y, null);
      staticMine.isStatic = true;
      staticMine.armed = true;
      staticMine.type = "static";

      const staticSizeReduction = 0.7;
      staticMine.width = this.mineConfig.size * staticSizeReduction;
      staticMine.height = this.mineConfig.size * staticSizeReduction;
      staticMine.dangerRadius = this.mineConfig.staticDangerRadius;

      this.mines.push(staticMine);
    }

    // 🔥 AGREGAR AL FINAL - FORZAR MINAS EN LAS 4 ESQUINAS (25% probabilidad)
    if (Math.random() < 0.25) {
      const corners = [
        { x: 80, y: 80 }, // Esquina superior izquierda
        { x: canvas.width - 120, y: 80 }, // Esquina superior derecha
        { x: 80, y: canvas.height - 120 }, // Esquina inferior izquierda
        { x: canvas.width - 120, y: canvas.height - 120 }, // Esquina inferior derecha
      ];

      const randomCorner = corners[Math.floor(Math.random() * corners.length)];

      const cornerMine = this.createMine(randomCorner.x, randomCorner.y, null);
      cornerMine.isStatic = true;
      cornerMine.armed = true;
      cornerMine.type = "corner_static";
      cornerMine.width = this.mineConfig.size * 0.7;
      cornerMine.height = this.mineConfig.size * 0.7;
      cornerMine.dangerRadius = this.mineConfig.staticDangerRadius;

      this.mines.push(cornerMine);
      console.log(
        `💣 Mina en esquina spawneada en (${Math.round(
          randomCorner.x
        )}, ${Math.round(randomCorner.y)})`
      );
    }

    console.log(`💣 Campo de ${mineCount} minas estáticas DIRIGIDAS spawneado`);
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
    const baseSize = this.mineConfig.size;

    return {
      x: x,
      y: y,
      width: baseSize, // Tamaño normal por defecto
      height: baseSize,
      timer: customTimer || this.mineConfig.explosionTime,
      armed: false,
      blinkTimer: 0,
      blinkSpeed: this.mineConfig.blinkSpeed,
      dangerRadius: this.mineConfig.dangerRadius,
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
    console.log(
      `💥 Mina ${mine.type} (${
        mine.isStatic ? "ESTÁTICA" : "TEMPORAL"
      }) explotando en (${mine.x}, ${mine.y})`
    );

    this.createExplosionEffects(mine);
    this.checkPlayerDamage(mine);

    // 🔥 GUARDAR DATOS ANTES DE ELIMINAR para reacción en cadena
    const mineData = {
      x: mine.x,
      y: mine.y,
      width: mine.width,
      height: mine.height,
      type: mine.type,
      isStatic: mine.isStatic,
    };

    // Eliminar mina original PRIMERO
    this.mines.splice(index, 1);

    // Luego activar reacción en cadena
    this.triggerChainReaction(mineData, -1); // -1 porque ya eliminamos la mina

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

      // Verificar si los radios de explosión se superponen
      if (distance <= chainRadius && mine.armed) {
        minesToExplode.push({
          index: i,
          type: mine.type,
          isStatic: mine.isStatic,
          distance: distance,
        });

        console.log(
          `💥 Mina en cadena detectada: ${mine.type} a ${distance.toFixed(1)}px`
        );
      }
    }

    if (minesToExplode.length > 0) {
      console.log(
        `🔥 EXPLOSIÓN EN CADENA: ${minesToExplode.length} minas adicionales`
      );

      // Ordenar por distancia para explotar de cerca a lejos
      minesToExplode.sort((a, b) => a.distance - b.distance);

      // Explotar en secuencia con delays
      minesToExplode.forEach((mineData, delayIndex) => {
        setTimeout(() => {
          // Verificar que la mina aún existe
          if (
            mineData.index < this.mines.length &&
            this.mines[mineData.index]
          ) {
            const currentMine = this.mines[mineData.index];
            // Verificar por posición que es la misma mina
            if (Math.abs(currentMine.x - explodedMine.x) < 500) {
              // Verificación básica
              console.log(`💥 Explotando mina en cadena ${delayIndex + 1}`);
              this.explodeMine(mineData.index);
            }
          }
        }, delayIndex * 150); // 150ms entre explosiones
      });
    } else {
      console.log("🔥 No hay minas en el radio de cadena");
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

    // 🔥 EFECTOS DIFERENTES SEGÚN TIPO
    if (mine.isStatic) {
      // Minas estáticas: Explosión amarilla más intensa
      const waveCount = 8;
      for (let i = 0; i < waveCount; i++) {
        setTimeout(() => {
          const color = i % 2 === 0 ? "#FFFF00" : "#FFA500";
          this.bossManager.ui.createParticleEffect(centerX, centerY, color, 40);
        }, i * 80);
      }

      // Efecto final blanco brillante
      setTimeout(() => {
        this.bossManager.ui.createParticleEffect(
          centerX,
          centerY,
          "#FFFFFF",
          70
        );
      }, 400);
    } else {
      // Minas temporales: Explosión roja/naranja
      const waveCount = 5;
      for (let i = 0; i < waveCount; i++) {
        setTimeout(() => {
          const color = i % 2 === 0 ? "#FF8800" : "#FF0000";
          this.bossManager.ui.createParticleEffect(centerX, centerY, color, 35);
        }, i * 100);
      }
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
  // CLEANUP Y GESTIÓN UNIFICADO (REEMPLAZA LA SECCIÓN ANTERIOR)
  // ======================================================

  // Variable para prevenir limpieza múltiple
  isCleaningUp: false,

  // FUNCIÓN PRINCIPAL DE LIMPIEZA (UNIFICADA)
  performCleanup(reason = "manual", preventDuplicates = true) {
    // Prevenir limpieza múltiple simultánea
    if (preventDuplicates && this.isCleaningUp) {
      console.log(`💣 Limpieza ya en progreso, ignorando: ${reason}`);
      return false;
    }

    this.isCleaningUp = true;
    console.log(`💣 === INICIANDO LIMPIEZA: ${reason.toUpperCase()} ===`);

    try {
      // 1. Limpiar intervalos PRIMERO
      this.clearAllIntervals();

      // 2. Limpiar minas
      this.clearAllMines();

      // 3. Resetear estados
      this.resetMineStates();

      console.log(`💣 ✅ Limpieza ${reason} completada exitosamente`);
      return true;
    } catch (error) {
      console.error(`💣 ❌ Error durante limpieza ${reason}:`, error);
      return false;
    } finally {
      // Siempre liberar el lock de limpieza
      setTimeout(() => {
        this.isCleaningUp = false;
      }, 100);
    }
  },

  clearAllIntervals() {
    const intervals = ["teleportInterval", "staticMineInterval"];
    let clearedCount = 0;

    intervals.forEach((intervalName) => {
      if (this[intervalName]) {
        clearInterval(this[intervalName]);
        this[intervalName] = null;
        clearedCount++;
        console.log(`💣 🔄 Intervalo ${intervalName} limpiado`);
      }
    });

    if (clearedCount > 0) {
      console.log(`💣 📊 Total intervalos limpiados: ${clearedCount}`);
    }
  },

  clearAllMines() {
    const mineCount = this.mines ? this.mines.length : 0;

    if (mineCount > 0) {
      // Registrar tipos de minas antes de limpiar (para debug)
      const mineTypes = {};
      this.mines.forEach((mine) => {
        const type = mine.type || "unknown";
        mineTypes[type] = (mineTypes[type] || 0) + 1;
      });

      console.log(`💣 🧹 Limpiando ${mineCount} minas:`, mineTypes);
    }

    this.mines = [];
    console.log(`💣 ✨ Array de minas vaciado`);
  },

  resetMineStates() {
    this.miningPhase = false;
    this.sequenceActive = false;
    console.log(`💣 🔄 Estados de minado reseteados`);
  },

  // FUNCIONES PÚBLICAS (REEMPLAZAN LAS ANTERIORES)
  endMineSequence() {
    console.log("💣 Secuencia de minas terminada (90s completados)");

    // Usar limpieza unificada
    const success = this.performCleanup("sequence_end");
    if (!success) {
      console.warn("💣 ⚠️ Falló la limpieza al final de secuencia");
      return;
    }

    // Lógica específica del final de secuencia
    this.handleSequenceEndLogic();
  },

  handleSequenceEndLogic() {
    // Si es fase aleatoria, no hacer vulnerable
    if (this.bossManager?.phases?.isRandomPhase) {
      console.log(
        "💣 Fase aleatoria completada - delegando al sistema de fases"
      );
      return;
    }

    // Boss vulnerable y vuelve a hunting
    if (this.bossManager) {
      this.bossManager.isImmune = false;
      this.bossManager.immunityTimer = 0;

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage(
          "⚔️ ¡BOSS VULNERABLE!",
          "#00FF00"
        );
      }

      // Reactivar hunting después de un delay
      setTimeout(() => {
        if (this.bossManager.movement) {
          this.bossManager.movement.enableFluidHunting();
        }
      }, 1000);
    }
  },

  forceCleanupMines() {
    console.log("💣 FORZANDO limpieza total de sistema de minas");
    const success = this.performCleanup("force", false);
    if (success) {
      console.log("💣 Sistema de minas completamente limpiado");
    }
    return success;
  },

  cleanup() {
    console.log("🧹 Limpiando sistema de minas");
    return this.performCleanup("standard");
  },

  reset() {
    console.log("🔄 Sistema de minas reseteado");
    return this.performCleanup("reset");
  },

  // ======================================================
  // FUNCIONES DE DIAGNÓSTICO
  // ======================================================

  getCleanupStatus() {
    return {
      isCleaningUp: this.isCleaningUp,
      mineCount: this.mines ? this.mines.length : 0,
      miningPhase: this.miningPhase,
      sequenceActive: this.sequenceActive,
      hasIntervals: {
        teleport: !!this.teleportInterval,
        static: !!this.staticMineInterval,
      },
    };
  },

  isSystemClean() {
    const status = this.getCleanupStatus();
    return (
      !status.isCleaningUp &&
      status.mineCount === 0 &&
      !status.miningPhase &&
      !status.sequenceActive &&
      !status.hasIntervals.teleport &&
      !status.hasIntervals.static
    );
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
