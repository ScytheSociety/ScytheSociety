/**
 * Hell Shooter - Boss Red Line System Optimizado
 * Sistema modular de la fase del hilo rojo CON CUADRÍCULA ANIMADA
 */

const BossRedLine = {
  // ======================================================
  // ESTADO DEL SISTEMA DE HILO ROJO
  // ======================================================

  bossManager: null,

  // Estado de la fase
  phaseActive: false,
  redLineMoving: false,
  showingPreview: false,

  // Ruta y movimiento
  redLinePath: [],
  redLineIndex: 0,
  redLineSpeed: 4,

  // Control del jugador
  originalPlayerSpeed: 1.0,
  playerSlowFactor: 0.05,

  // Estado de ciclos
  cycleCount: 0,
  maxCycles: 10,

  // 🔥 NUEVO: Sistema de cuadrícula animada
  gridLines: [],
  lastGridTime: 0,
  gridInterval: 8000, // 8 segundos entre cuadrículas

  // Configuración
  lineConfig: {
    previewDuration: 2000,
    lineWidth: 8,
    glowBlur: 20,
    trailLength: 20,
  },

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.phaseActive = false;
    this.redLineMoving = false;
    this.showingPreview = false;
    this.redLinePath = [];
    this.redLineIndex = 0;
    this.cycleCount = 0;
    this.gridLines = [];
    this.lastGridTime = 0;
    this.originalPlayerSpeed = Player.getSpeedModifier
      ? Player.getSpeedModifier()
      : 1.0;
    console.log("🔴 Sistema de hilo rojo del boss inicializado");
  },

  // ======================================================
  // CONTROL DE FASE
  // ======================================================

  startPhase() {
    console.log("🔴 === INICIANDO FASE DEL HILO ROJO (10 DIBUJOS) ===");

    this.phaseActive = true;
    this.cycleCount = 0;
    this.maxCycles = 10;
    this.gridLines = [];
    this.lastGridTime = Date.now();

    this.bossManager.makeImmune(9999);

    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    // 🔥 MOVIMIENTO ULTRA LENTO DEL JUGADOR
    if (window.Player && Player.setSpeedModifier) {
      this.originalPlayerSpeed = Player.getSpeedModifier();
      Player.setSpeedModifier(0.05); // 95% más lento
      console.log(
        "🐌 Jugador ahora se mueve ULTRA LENTO (5% velocidad normal)"
      );
    } else {
      console.warn("⚠️ Sistema de velocidad del jugador no disponible");
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🔴 FASE DEL HILO ROJO (10 DIBUJOS) 🔴",
        "#FF0000"
      );
    }

    if (this.bossManager.comments) {
      this.bossManager.comments.sayComment("¡Memoriza mi rastro mortal!");
    }

    setTimeout(() => {
      this.startRedLineCycle();
    }, 2000);
  },

  endPhase() {
    console.log("🔴 Terminando COMPLETAMENTE la fase del hilo rojo");

    this.phaseActive = false;
    this.redLineMoving = false;
    this.showingPreview = false;
    this.redLinePath = [];
    this.redLineIndex = 0;
    this.gridLines = []; // Limpiar cuadrícula

    // Restaurar velocidad del jugador
    if (window.Player && Player.restoreNormalSpeed) {
      Player.restoreNormalSpeed();
      console.log("🏃 Velocidad del jugador restaurada a normal");
    } else if (window.Player && Player.setSpeedModifier) {
      Player.setSpeedModifier(this.originalPlayerSpeed);
      console.log("🏃 Velocidad del jugador restaurada manualmente");
    }

    // Solo hacer vulnerable si completó los 10 ciclos
    if (this.cycleCount >= this.maxCycles) {
      console.log("🔴 Red Line COMPLETADO (10/10) - transición a Yan Ken Po");
      // Mantener inmune para Yan Ken Po
    } else {
      console.log("🔴 Red Line incompleto - boss vulnerable");
      if (this.bossManager) {
        this.bossManager.isImmune = false;
        this.bossManager.immunityTimer = 0;
      }
    }
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  update() {
    if (!this.phaseActive || !this.bossManager || !this.bossManager.active) {
      return;
    }

    if (!this.bossManager.boss) {
      console.error("🔴 Boss desapareció durante Red Line, terminando fase");
      this.endPhase();
      return;
    }

    // 🔥 NUEVO: Actualizar sistema de cuadrícula
    this.updateGridSystem();

    if (this.redLineMoving) {
      this.updateBossMovement();
    }
  },

  // ======================================================
  // SISTEMA DE CUADRÍCULA ANIMADA
  // ======================================================

  updateGridSystem() {
    if (!this.phaseActive) return;

    const currentTime = Date.now();

    // Generar nueva cuadrícula cada 8 segundos
    if (currentTime - this.lastGridTime >= this.gridInterval) {
      this.generateAnimatedGrid();
      this.lastGridTime = currentTime;
    }

    // Actualizar líneas existentes
    this.updateGridLines();
  },

  generateAnimatedGrid() {
    const canvas = window.getCanvas();
    const spacing = 80;

    console.log("🔴 Generando cuadrícula animada");

    // Líneas verticales (de arriba hacia abajo)
    for (let x = spacing; x < canvas.width; x += spacing) {
      this.gridLines.push({
        type: "vertical",
        x: x,
        y: 0,
        targetY: canvas.height,
        speed: 2,
        active: true,
      });
    }

    // Líneas horizontales (de izquierda a derecha)
    for (let y = spacing; y < canvas.height; y += spacing) {
      this.gridLines.push({
        type: "horizontal",
        x: 0,
        y: y,
        targetX: canvas.width,
        speed: 2,
        active: true,
      });
    }
  },

  updateGridLines() {
    if (!window.Player) return;

    // Verificar colisión ANTES de mover líneas
    if (
      Player.checkGridLineCollision &&
      Player.checkGridLineCollision(this.gridLines)
    ) {
      console.log("💥 Jugador golpeado por línea de cuadrícula");
      Player.takeDamage();
    }

    // Actualizar posición de líneas
    for (let i = this.gridLines.length - 1; i >= 0; i--) {
      const line = this.gridLines[i];

      if (line.type === "vertical") {
        line.y += line.speed;
        if (line.y >= line.targetY) {
          this.gridLines.splice(i, 1);
        }
      } else if (line.type === "horizontal") {
        line.x += line.speed;
        if (line.x >= line.targetX) {
          this.gridLines.splice(i, 1);
        }
      }
    }
  },

  updateBossMovement() {
    if (!this.redLineMoving || this.redLinePath.length === 0) return;

    if (!this.bossManager || !this.bossManager.boss) {
      console.error("🔴 Error: Boss no existe en updateBossMovement");
      this.endPhase();
      return;
    }

    // Verificar fin de recorrido
    if (this.redLineIndex >= this.redLinePath.length - 2) {
      console.log("🔴 Boss completó el recorrido del hilo rojo");
      this.endRedLineMovement();
      return;
    }

    // Mover el boss por la línea
    const currentPoint = this.redLinePath[Math.floor(this.redLineIndex)];
    if (!currentPoint) {
      console.log("🔴 Punto no válido, terminando recorrido");
      this.endRedLineMovement();
      return;
    }

    const boss = this.bossManager.boss;
    boss.x = currentPoint.x - boss.width / 2;
    boss.y = currentPoint.y - boss.height / 2;

    // Verificar colisión con el jugador
    if (this.checkCollisionWithPlayer()) {
      console.log("💥 Jugador golpeado por el hilo rojo");
      Player.takeDamage();

      if (this.bossManager.ui) {
        this.bossManager.ui.createParticleEffect(
          boss.x + boss.width / 2,
          boss.y + boss.height / 2,
          "#FF0000",
          20
        );
      }
    }

    this.redLineIndex += this.redLineSpeed;
  },

  checkCollisionWithPlayer() {
    const player = Player;
    const playerPos = player.getPosition();
    const playerSize = player.getSize();
    const boss = this.bossManager.boss;

    return (
      boss.x < playerPos.x + playerSize.width &&
      boss.x + boss.width > playerPos.x &&
      boss.y < playerPos.y + playerSize.height &&
      boss.y + boss.height > playerPos.y
    );
  },

  // ======================================================
  // GESTIÓN DE CICLOS
  // ======================================================

  startRedLineCycle() {
    console.log(
      `🔄 Iniciando dibujo ${this.cycleCount + 1}/${
        this.maxCycles
      } de hilo rojo`
    );

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `🔴 DIBUJO ${this.cycleCount + 1}/10`,
        "#FFFF00"
      );
    }

    if (!this.bossManager || !this.bossManager.boss) {
      console.error("🔴 Error: Boss no existe para iniciar ciclo red line");
      this.endPhase();
      return;
    }

    this.adjustDifficultyForRound(this.cycleCount + 1);
    this.generateWallBouncingPattern(); // 🔥 NUEVA FUNCIÓN

    if (this.redLinePath.length === 0) {
      console.error("🔴 Error: No se pudo generar línea roja");
      this.endPhase();
      return;
    }

    this.showLinePreview();
  },

  adjustDifficultyForRound(roundNumber) {
    if (roundNumber <= 3) {
      this.redLineSpeed = 1.5;
    } else if (roundNumber <= 6) {
      this.redLineSpeed = 2.0;
    } else if (roundNumber <= 8) {
      this.redLineSpeed = 2.5;
    } else {
      this.redLineSpeed = 3.0;
    }

    console.log(`🔴 Dibujo ${roundNumber}/10: Velocidad ${this.redLineSpeed}`);
  },

  showLinePreview() {
    console.log("🔴 Mostrando preview de la línea...");

    this.showingPreview = true;

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("¡MEMORIZA LA RUTA!", "#FFFF00");
    }

    setTimeout(() => {
      this.showingPreview = false;
      console.log("🔴 Preview terminado - boss iniciará movimiento");

      setTimeout(() => {
        this.startRedLineMovement();
      }, 500);
    }, this.lineConfig.previewDuration);
  },

  startRedLineMovement() {
    if (!this.bossManager || !this.bossManager.boss) {
      console.error("🔴 Error: Boss no existe para red line movement");
      this.endPhase();
      return;
    }

    if (this.redLinePath.length === 0) {
      console.error("🔴 Error: No hay línea roja generada");
      this.endPhase();
      return;
    }

    this.redLineIndex = 0;
    this.redLineMoving = true;

    // Posicionar boss al inicio de la línea
    const startPoint = this.redLinePath[0];
    const boss = this.bossManager.boss;

    boss.x = startPoint.x - boss.width / 2;
    boss.y = startPoint.y - boss.height / 2;

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🔴 ¡BOSS EN MOVIMIENTO!",
        "#FF0000"
      );
    }

    console.log("🔴 Boss iniciando movimiento por la línea");
  },

  endRedLineMovement() {
    console.log("🔴 Boss terminó el recorrido - iniciando pausa vulnerable");

    this.redLineMoving = false;
    this.redLinePath = [];
    this.redLineIndex = 0;
    this.cycleCount++;

    // Boss vulnerable por 3 segundos
    if (this.bossManager) {
      this.bossManager.isImmune = false;
      this.bossManager.immunityTimer = 0;
      console.log("🔴 Boss FORZADO a ser vulnerable");
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "⚔️ ¡BOSS VULNERABLE! (3s)",
        "#00FF00"
      );
    }

    if (this.bossManager.comments) {
      this.bossManager.comments.sayRandomComment("combate");
    }

    setTimeout(() => {
      this.decideNextAction();
    }, 3000);
  },

  decideNextAction() {
    const healthPercentage =
      this.bossManager.currentHealth / this.bossManager.maxHealth;

    console.log(`🔴 Dibujo ${this.cycleCount}/${this.maxCycles} completado`);

    // 🔥 SI COMPLETÓ LOS 10 DIBUJOS → VOLVER A HUNTING (NO YAN KEN PO)
    if (this.cycleCount >= this.maxCycles) {
      console.log("🔄 *** 10 DIBUJOS DE RED LINE COMPLETADOS ***");
      console.log("🏃 REGRESANDO A HUNTING - Yan Ken Po solo al 3%");

      this.endPhase();

      // 🔥 VOLVER A HUNTING, NO A YAN KEN PO
      setTimeout(() => {
        if (this.bossManager.movement) {
          this.bossManager.movement.enableFluidHunting();
        }

        if (this.bossManager.ui) {
          this.bossManager.ui.showScreenMessage(
            "🏃 BOSS CAZANDO - Yan Ken Po al 3%",
            "#00FF00"
          );
        }
      }, 500);
      return;
    }

    // Continuar con otro ciclo de Red Line
    console.log(
      `🔄 Continuando dibujo ${this.cycleCount + 1}/${this.maxCycles}`
    );
    this.bossManager.makeImmune(9999);

    setTimeout(() => {
      this.startRedLineCycle();
    }, 1000);
  },

  // ======================================================
  // GENERACIÓN DE FORMAS QUE CHOCAN CON PAREDES
  // ======================================================

  generateWallBouncingPattern() {
    const canvas = window.getCanvas();
    const patterns = [
      "zigzag_walls",
      "star_walls",
      "hell_walls",
      "z_walls",
      "random_walls",
    ];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    console.log(`🔴 Generando patrón que choca con paredes: ${pattern}`);

    switch (pattern) {
      case "zigzag_walls":
        this.generateZigzagWalls(canvas);
        break;
      case "star_walls":
        this.generateStarWalls(canvas);
        break;
      case "hell_walls":
        this.generateHellWalls(canvas);
        break;
      case "z_walls":
        this.generateZWalls(canvas);
        break;
      case "random_walls":
        this.generateRandomWallPattern(canvas);
        break;
      default:
        this.generateZigzagWalls(canvas);
    }

    if (this.redLinePath.length === 0) {
      console.error("🔴 Error: No se generaron puntos para la línea");
      this.generateFallbackLine(canvas);
    }

    console.log(
      `🔴 Patrón ${pattern} generado con ${this.redLinePath.length} puntos`
    );
  },

  generateZigzagWalls(canvas) {
    const margin = 20;
    const points = [
      { x: margin, y: margin }, // Esquina superior izquierda
      { x: canvas.width - margin, y: margin }, // Esquina superior derecha
      { x: margin, y: canvas.height - margin }, // Esquina inferior izquierda
      { x: canvas.width - margin, y: canvas.height - margin }, // Esquina inferior derecha
    ];

    this.createSmoothPath(points);
    console.log("🔴 Zigzag generado tocando todas las esquinas");
  },

  generateStarWalls(canvas) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const margin = 25;

    const points = [
      { x: centerX, y: margin }, // Punta superior (toca techo)
      { x: canvas.width - margin, y: canvas.height - margin }, // Esquina inferior derecha
      { x: margin, y: centerY }, // Punta izquierda (toca pared)
      { x: canvas.width - margin, y: centerY }, // Punta derecha (toca pared)
      { x: margin, y: margin }, // Esquina superior izquierda
      { x: centerX, y: canvas.height - margin }, // Punta inferior (toca suelo)
      { x: centerX, y: margin }, // Volver al inicio
    ];

    this.createSmoothPath(points);
    console.log("🔴 Estrella generada tocando todas las paredes");
  },

  generateHellWalls(canvas) {
    const margin = 30;
    const letterWidth = (canvas.width - margin * 2) / 4;
    const letterHeight = canvas.height - margin * 2;
    const startY = margin;

    const points = [];

    // H - tocando paredes
    const hX = margin;
    points.push({ x: hX, y: startY });
    points.push({ x: hX, y: startY + letterHeight });
    points.push({ x: hX, y: startY + letterHeight / 2 });
    points.push({ x: hX + letterWidth, y: startY + letterHeight / 2 });
    points.push({ x: hX + letterWidth, y: startY });
    points.push({ x: hX + letterWidth, y: startY + letterHeight });

    // E
    const eX = margin + letterWidth * 1.2;
    points.push({ x: eX, y: startY });
    points.push({ x: eX + letterWidth, y: startY });
    points.push({ x: eX, y: startY });
    points.push({ x: eX, y: startY + letterHeight / 2 });
    points.push({ x: eX + letterWidth * 0.7, y: startY + letterHeight / 2 });
    points.push({ x: eX, y: startY + letterHeight / 2 });
    points.push({ x: eX, y: startY + letterHeight });
    points.push({ x: eX + letterWidth, y: startY + letterHeight });

    // L1
    const l1X = margin + letterWidth * 2.4;
    points.push({ x: l1X, y: startY });
    points.push({ x: l1X, y: startY + letterHeight });
    points.push({ x: l1X + letterWidth, y: startY + letterHeight });

    // L2
    const l2X = margin + letterWidth * 3.6;
    points.push({ x: l2X, y: startY });
    points.push({ x: l2X, y: startY + letterHeight });
    points.push({ x: canvas.width - margin, y: startY + letterHeight }); // Toca pared derecha

    this.createSmoothPath(points);
    console.log("🔴 HELL generado ocupando toda la pantalla");
  },

  generateZWalls(canvas) {
    const margin = 25;
    const points = [
      { x: margin, y: margin }, // Esquina superior izquierda
      { x: canvas.width - margin, y: margin }, // Esquina superior derecha
      { x: margin, y: canvas.height - margin }, // Diagonal a inferior izquierda
      { x: canvas.width - margin, y: canvas.height - margin }, // Esquina inferior derecha
    ];

    this.createSmoothPath(points);
    console.log("🔴 Z generado tocando esquinas");
  },

  generateRandomWallPattern(canvas) {
    const margin = 30;
    const points = [];
    const corners = [
      { x: margin, y: margin },
      { x: canvas.width - margin, y: margin },
      { x: canvas.width - margin, y: canvas.height - margin },
      { x: margin, y: canvas.height - margin },
    ];

    // Línea aleatoria que siempre toca al menos 2 esquinas
    const shuffledCorners = corners.sort(() => Math.random() - 0.5);
    points.push(shuffledCorners[0]);
    points.push(shuffledCorners[1]);
    points.push(shuffledCorners[2]);

    this.createSmoothPath(points);
    console.log("🔴 Patrón aleatorio generado tocando esquinas");
  },

  createSmoothPath(points) {
    this.redLinePath = [];

    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];

      const steps = 30;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        this.redLinePath.push({
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        });
      }
    }
  },

  generateFallbackLine(canvas) {
    console.log("🔴 Generando línea de respaldo simple");

    const startX = canvas.width * 0.2;
    const startY = canvas.height * 0.3;
    const endX = canvas.width * 0.8;
    const endY = canvas.height * 0.7;

    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      this.redLinePath.push({
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t,
      });
    }

    console.log(
      "🔴 Línea de respaldo generada con",
      this.redLinePath.length,
      "puntos"
    );
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  draw(ctx) {
    if (this.redLinePath.length === 0 && this.gridLines.length === 0) return;

    ctx.save();

    // Dibujar líneas de cuadrícula
    this.drawGridLines(ctx);

    // Dibujar líneas rojas del boss
    if (this.showingPreview) {
      this.drawPreviewLine(ctx);
    }

    if (this.redLineMoving && this.redLineIndex > 0) {
      this.drawBossTrail(ctx);
    }

    ctx.restore();
  },

  drawGridLines(ctx) {
    if (this.gridLines.length === 0) return;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 0, 0, 0.9)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = 8;

    for (const line of this.gridLines) {
      ctx.beginPath();

      if (line.type === "vertical") {
        ctx.moveTo(line.x, 0);
        ctx.lineTo(line.x, line.y);
      } else if (line.type === "horizontal") {
        ctx.moveTo(0, line.y);
        ctx.lineTo(line.x, line.y);
      }

      ctx.stroke();
    }

    ctx.restore();
  },

  drawPreviewLine(ctx) {
    // Línea roja brillante para memorizar
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = this.lineConfig.lineWidth;
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = this.lineConfig.glowBlur;

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

    // Efecto de parpadeo
    const pulse = Math.sin(window.getGameTime() * 0.5) * 0.4 + 0.6;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = this.lineConfig.lineWidth / 2;
    ctx.stroke();
  },

  drawBossTrail(ctx) {
    const startIndex = Math.max(
      0,
      this.redLineIndex - this.lineConfig.trailLength
    );

    if (startIndex >= this.redLineIndex) return;

    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    ctx.lineWidth = this.lineConfig.lineWidth * 1.5;
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = this.lineConfig.glowBlur * 1.5;

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
  },

  // ======================================================
  // CLEANUP Y UTILIDADES
  // ======================================================

  cleanup() {
    console.log("🧹 Limpiando sistema de hilo rojo");

    this.phaseActive = false;
    this.redLineMoving = false;
    this.showingPreview = false;
    this.redLinePath = [];
    this.redLineIndex = 0;
    this.cycleCount = 0;
    this.gridLines = [];

    // Restaurar velocidad del jugador
    if (window.Player && Player.restoreNormalSpeed) {
      Player.restoreNormalSpeed();
    } else if (window.Player && Player.setSpeedModifier) {
      Player.setSpeedModifier(this.originalPlayerSpeed);
    }
  },

  reset() {
    this.cleanup();
    console.log("🔄 Sistema de hilo rojo reseteado");
  },

  // ======================================================
  // GETTERS
  // ======================================================

  isActive() {
    return this.phaseActive;
  },
  isMoving() {
    return this.redLineMoving;
  },
  isShowingPreview() {
    return this.showingPreview;
  },
  getCurrentCycle() {
    return this.cycleCount;
  },
  getMaxCycles() {
    return this.maxCycles;
  },
  getProgress() {
    if (!this.redLineMoving || this.redLinePath.length === 0) return 0;
    return Math.min(1, this.redLineIndex / this.redLinePath.length);
  },
  getLineLength() {
    return this.redLinePath.length;
  },
};

window.BossRedLine = BossRedLine;

console.log("🔴 boss-redline.js optimizado CON CUADRÍCULA cargado");
