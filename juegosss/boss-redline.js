/**
 * Hell Shooter - Boss Red Line System Optimizado
 * Sistema modular de la fase del hilo rojo
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
    this.originalPlayerSpeed = Player.moveSpeed;
    console.log("🔴 Sistema de hilo rojo del boss inicializado");
  },

  // ======================================================
  // CONTROL DE FASE
  // ======================================================

  startPhase() {
    console.log("🔴 === INICIANDO FASE DEL HILO ROJO (10 RONDAS) ===");

    this.phaseActive = true;
    this.cycleCount = 0;
    this.maxCycles = 10;

    this.bossManager.makeImmune(9999);

    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    // Ralentizar jugador
    this.originalPlayerSpeed = Player.moveSpeed;
    Player.moveSpeed = this.playerSlowFactor;

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🔴 FASE DEL HILO ROJO 🔴",
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
    this.cycleCount = 0;

    // Restaurar velocidad del jugador
    if (window.Player && Player.moveSpeed !== undefined) {
      Player.moveSpeed = this.originalPlayerSpeed;
      console.log("🏃 Velocidad del jugador restaurada a normal");
    }

    // Boss vulnerable
    if (this.bossManager && this.bossManager.boss) {
      this.bossManager.isImmune = false;
      this.bossManager.immunityTimer = 0;
      console.log("🔴 Boss hecho vulnerable al terminar Red Line");
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

    if (this.redLineMoving) {
      this.updateBossMovement();
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
      `🔄 Iniciando ronda ${this.cycleCount + 1}/${this.maxCycles} de hilo rojo`
    );

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `🔴 RONDA ${this.cycleCount + 1}/10`,
        "#FFFF00"
      );
    }

    if (!this.bossManager || !this.bossManager.boss) {
      console.error("🔴 Error: Boss no existe para iniciar ciclo red line");
      this.endPhase();
      return;
    }

    this.adjustDifficultyForRound(this.cycleCount + 1);
    this.generateComplexGeometricLine();

    if (this.redLinePath.length === 0) {
      console.error("🔴 Error: No se pudo generar línea roja");
      this.endPhase();
      return;
    }

    this.showLinePreview();
  },

  adjustDifficultyForRound(roundNumber) {
    if (roundNumber <= 3) {
      this.redLineSpeed = 3;
    } else if (roundNumber <= 6) {
      this.redLineSpeed = 4;
    } else {
      this.redLineSpeed = 5;
    }

    console.log(
      `🔴 Ronda ${roundNumber}: Velocidad ajustada a ${this.redLineSpeed}`
    );
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

    // Verificar si debe ir a fase final
    if (healthPercentage <= 0.03) {
      console.log("🎮 Vida muy baja - iniciando Yan Ken Po");
      this.endPhase();
      if (this.bossManager.phases) {
        this.bossManager.phases.startFinalPhase();
      }
      return;
    }

    // Verificar si alcanzó el máximo de ciclos
    if (this.cycleCount >= this.maxCycles) {
      console.log("🔄 Máximo de ciclos alcanzado - terminando fase");
      this.endPhase();

      if (this.bossManager.movement) {
        this.bossManager.movement.enableFluidHunting();
      }
      return;
    }

    // Continuar con otro ciclo
    console.log("🔄 Continuando con nuevo ciclo de hilo rojo");
    this.bossManager.makeImmune(9999);

    setTimeout(() => {
      this.startRedLineCycle();
    }, 1000);
  },

  // ======================================================
  // GENERACIÓN DE FORMAS GEOMÉTRICAS
  // ======================================================

  generateComplexGeometricLine() {
    const canvas = window.getCanvas();

    if (!canvas) {
      console.error("🔴 Error: Canvas no existe para generar línea");
      return;
    }

    const shapes = [
      "zigzag",
      "star",
      "triangle",
      "diamond",
      "spiral",
      "wave",
      "lightning",
    ];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    console.log(`🔴 Generando forma geométrica: ${shape}`);

    switch (shape) {
      case "zigzag":
        this.generateZigzagPattern(canvas);
        break;
      case "star":
        this.generateStarPattern(canvas);
        break;
      case "triangle":
        this.generateTrianglePattern(canvas);
        break;
      case "diamond":
        this.generateDiamondPattern(canvas);
        break;
      case "spiral":
        this.generateSpiralPattern(canvas);
        break;
      case "wave":
        this.generateWavePattern(canvas);
        break;
      case "lightning":
        this.generateLightningPattern(canvas);
        break;
    }

    if (this.redLinePath.length === 0) {
      console.error("🔴 Error: No se generaron puntos para la línea");
      this.generateFallbackLine(canvas);
    }

    console.log(
      `🔴 Forma ${shape} generada con ${this.redLinePath.length} puntos`
    );
  },

  generateZigzagPattern(canvas) {
    const points = [];
    const segments = 6;
    const width = canvas.width * 0.8;
    const height = canvas.height * 0.6;
    const startX = canvas.width * 0.1;
    const startY = canvas.height * 0.2;

    for (let i = 0; i <= segments; i++) {
      const x = startX + (width / segments) * i;
      const y = startY + (i % 2 === 0 ? 0 : height);
      points.push({ x, y });
    }

    this.createSmoothPath(points);
  },

  generateStarPattern(canvas) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(canvas.width, canvas.height) * 0.3;
    const innerRadius = outerRadius * 0.5;
    const points = [];

    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }

    points.push(points[0]);
    this.createSmoothPath(points);
  },

  generateTrianglePattern(canvas) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;

    const points = [];
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }

    points.push(points[0]);
    this.createSmoothPath(points);
  },

  generateDiamondPattern(canvas) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const width = Math.min(canvas.width, canvas.height) * 0.4;
    const height = Math.min(canvas.width, canvas.height) * 0.3;

    const points = [
      { x: centerX, y: centerY - height },
      { x: centerX + width, y: centerY },
      { x: centerX, y: centerY + height },
      { x: centerX - width, y: centerY },
      { x: centerX, y: centerY - height },
    ];

    this.createSmoothPath(points);
  },

  generateSpiralPattern(canvas) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.35;
    const turns = 2.5;
    const points = [];

    const totalSteps = 80;
    for (let i = 0; i <= totalSteps; i++) {
      const t = i / totalSteps;
      const angle = t * Math.PI * 2 * turns;
      const radius = t * maxRadius;

      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }

    this.createSmoothPath(points);
  },

  generateWavePattern(canvas) {
    const points = [];
    const amplitude = canvas.height * 0.2;
    const frequency = 3;
    const centerY = canvas.height / 2;

    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = canvas.width * 0.1 + t * canvas.width * 0.8;
      const y = centerY + Math.sin(t * Math.PI * 2 * frequency) * amplitude;

      points.push({ x, y });
    }

    this.createSmoothPath(points);
  },

  generateLightningPattern(canvas) {
    const points = [];
    const startX = canvas.width * 0.2;
    const startY = canvas.height * 0.2;
    const endX = canvas.width * 0.8;
    const endY = canvas.height * 0.8;

    points.push({ x: startX, y: startY });

    const segments = 8;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const baseX = startX + (endX - startX) * t;
      const baseY = startY + (endY - startY) * t;

      const deviation = (Math.random() - 0.5) * 100;
      const perpX =
        -(endY - startY) /
        Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      const perpY =
        (endX - startX) /
        Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

      points.push({
        x: baseX + perpX * deviation,
        y: baseY + perpY * deviation,
      });
    }

    this.createSmoothPath(points);
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
    if (this.redLinePath.length === 0) return;

    ctx.save();

    if (this.showingPreview) {
      this.drawPreviewLine(ctx);
    }

    if (this.redLineMoving && this.redLineIndex > 0) {
      this.drawBossTrail(ctx);
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

    if (Player.moveSpeed !== this.originalPlayerSpeed) {
      Player.moveSpeed = this.originalPlayerSpeed;
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

console.log("🔴 boss-redline.js optimizado cargado");
