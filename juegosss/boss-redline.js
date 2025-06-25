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
    this.maxCycles = 10; // FORZAR 10 rondas

    this.bossManager.makeImmune(9999);

    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    // 🔴 RALENTIZAR JUGADOR EXTREMADAMENTE
    this.originalPlayerSpeed = Player.moveSpeed;
    Player.moveSpeed = 0.03; // SÚPER LENTO (antes era 0.15)

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🔴 FASE DEL HILO ROJO (10 RONDAS) 🔴",
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
    // NO resetear cycleCount aquí para mantener el valor

    // Restaurar velocidad del jugador
    if (window.Player && Player.moveSpeed !== undefined) {
      Player.moveSpeed = this.originalPlayerSpeed;
      console.log("🏃 Velocidad del jugador restaurada a normal");
    }

    // 🔥 NUEVA LÓGICA: Solo hacer vulnerable si NO va a Yan Ken Po
    if (this.cycleCount < this.maxCycles) {
      // Red Line incompleto - volver a hunting
      if (this.bossManager && this.bossManager.boss) {
        this.bossManager.isImmune = false;
        this.bossManager.immunityTimer = 0;
        console.log("🔴 Boss hecho vulnerable - Red Line incompleto");
      }
    } else {
      // Red Line completado - mantener inmune para Yan Ken Po
      console.log(
        "🔴 Red Line COMPLETADO - manteniendo boss inmune para Yan Ken Po"
      );
      // NO cambiar inmunidad aquí
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

  // REEMPLAZAR adjustDifficultyForRound()
  adjustDifficultyForRound(roundNumber) {
    // 🔥 VELOCIDAD AJUSTADA PARA PATRONES GIGANTES
    if (roundNumber <= 3) {
      this.redLineSpeed = 1.5; // MÁS LENTO para patrones complejos
    } else if (roundNumber <= 6) {
      this.redLineSpeed = 2.0;
    } else if (roundNumber <= 8) {
      this.redLineSpeed = 2.5;
    } else {
      this.redLineSpeed = 3.0; // Máximo para últimas rondas
    }

    console.log(
      `🔴 Ronda ${roundNumber}/10: Velocidad ${this.redLineSpeed} (patrones gigantes)`
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

    console.log(`🔴 Ronda ${this.cycleCount}/${this.maxCycles} completada`);

    // Verificar si debe ir a fase final por vida baja
    if (healthPercentage <= 0.03) {
      console.log("🎮 Vida muy baja - iniciando Yan Ken Po");
      this.endPhase();
      if (
        this.bossManager.phases &&
        this.bossManager.phases.forceStartYanKenPo
      ) {
        this.bossManager.phases.forceStartYanKenPo();
      }
      return;
    }

    // 🔥 VERIFICAR SI COMPLETÓ LAS 10 RONDAS
    if (this.cycleCount >= this.maxCycles) {
      console.log("🔄 *** 10 RONDAS DE RED LINE COMPLETADAS ***");
      console.log("🎮 FORZANDO transición directa a Yan Ken Po");

      this.endPhase();

      // USAR LA NUEVA FUNCIÓN FORZADA
      setTimeout(() => {
        if (
          this.bossManager.phases &&
          this.bossManager.phases.forceStartYanKenPo
        ) {
          this.bossManager.phases.forceStartYanKenPo();
        } else {
          console.error("❌ No se pudo forzar Yan Ken Po");
        }
      }, 500);
      return;
    }

    // Continuar con otro ciclo de Red Line
    console.log(
      `🔄 Continuando ronda ${this.cycleCount + 1}/${this.maxCycles}`
    );
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

    const screenScale = Math.min(canvas.width, canvas.height) / 800;
    const mobileScale = GameConfig.isMobile ? 0.8 : 1.0;
    const scale = screenScale * mobileScale;

    const shapes = [
      "zigzag",
      "star",
      "triangle",
      "diamond",
      "spiral",
      "wave",
      "lightning",
      "hell",
      "chaos",
      "zigzag_wall", // AGREGAR ESTE
    ];

    // 40% probabilidad de HELL (más frecuente)
    const shape =
      Math.random() < 0.4
        ? "hell"
        : shapes[Math.floor(Math.random() * (shapes.length - 1))];

    console.log(`🔴 Generando forma: ${shape} (escala: ${scale})`);

    switch (shape) {
      case "zigzag":
        this.generateZigzagPattern(canvas, scale);
        break;
      case "star":
        this.generateStarPattern(canvas, scale);
        break;
      case "triangle":
        this.generateTrianglePattern(canvas, scale);
        break;
      case "diamond":
        this.generateDiamondPattern(canvas, scale);
        break;
      case "spiral":
        this.generateSpiralPattern(canvas, scale);
        break;
      case "wave":
        this.generateWavePattern(canvas, scale);
        break;
      case "lightning":
        this.generateLightningPattern(canvas, scale);
        break;
      case "hell":
        this.generateHellPattern(canvas, scale);
        break;
      case "bouncing":
        this.generateBouncingPattern(canvas, scale);
        break;
      case "zigzag_wall":
        this.generateZigzagWallPattern(canvas, scale);
        break;
    }

    if (this.redLinePath.length === 0) {
      console.error("🔴 Error: No se generaron puntos para la línea");
      this.generateFallbackLine(canvas, scale);
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

  generateStarPattern(canvas, scale = 1.0) {
    console.log("🔴 Generando ESTRELLA GIGANTE con rebotes");

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 🔥 ESTRELLA MÁXIMA QUE TOCA PAREDES
    const margin = 25;
    const outerRadius = Math.min(canvas.width, canvas.height) * 0.48; // 96% de pantalla
    const innerRadius = outerRadius * 0.4;

    const points = [];

    // Generar puntos de estrella tocando límites
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;

      let x = centerX + Math.cos(angle) * radius;
      let y = centerY + Math.sin(angle) * radius;

      // Forzar puntos externos a tocar paredes
      if (i % 2 === 0) {
        if (Math.abs(x - canvas.width) < margin) x = canvas.width - margin;
        if (Math.abs(x) < margin) x = margin;
        if (Math.abs(y - canvas.height) < margin) y = canvas.height - margin;
        if (Math.abs(y) < margin) y = margin;
      }

      points.push({ x, y });
    }

    // Cerrar estrella
    points.push(points[0]);

    // Generar ruta con rebotes
    let allPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      const segmentPoints = this.calculateWallBounces(
        points[i].x,
        points[i].y,
        points[i + 1].x,
        points[i + 1].y,
        canvas
      );
      allPoints = allPoints.concat(segmentPoints);
    }

    this.redLinePath = allPoints;
    console.log(
      `🔴 Estrella gigante: ${this.redLinePath.length} puntos totales`
    );
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
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.45; // Era 0.35
    const turns = 3.5; // Más vueltas
    const points = [];

    const totalSteps = 120; // Más puntos para suavidad
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

  generateTrianglePattern(canvas, scale = 1.0) {
    console.log("🔴 Generando TRIÁNGULO GIGANTE con rebotes");

    // 🔥 TRIÁNGULO QUE TOCA TODAS LAS PAREDES
    const margin = 30;
    const points = [
      { x: canvas.width / 2, y: margin }, // PUNTA SUPERIOR tocando techo
      { x: canvas.width - margin, y: canvas.height - margin }, // ESQUINA INFERIOR DERECHA
      { x: margin, y: canvas.height - margin }, // ESQUINA INFERIOR IZQUIERDA
    ];

    // Generar ruta con rebotes para cada segmento
    let allPoints = [];

    for (let i = 0; i < points.length; i++) {
      const start = points[i];
      const end = points[(i + 1) % points.length]; // Circular

      const segmentPoints = this.calculateWallBounces(
        start.x,
        start.y,
        end.x,
        end.y,
        canvas
      );
      allPoints = allPoints.concat(segmentPoints);
    }

    this.redLinePath = allPoints;
    console.log(
      `🔴 Triángulo gigante: ${this.redLinePath.length} puntos totales`
    );
  },

  generateHellPattern(canvas, scale = 1.0) {
    console.log("🔴 Generando HELL GIGANTE con rebotes en toda la pantalla");

    // 🔥 HELL QUE OCUPA 95% DE LA PANTALLA
    const margin = canvas.width * 0.025; // 2.5% de margen
    const startX = margin;
    const startY = canvas.height * 0.1; // 10% desde arriba
    const totalWidth = canvas.width - margin * 2; // 95% del ancho
    const letterHeight = canvas.height * 0.8; // 80% de altura
    const letterWidth = totalWidth / 4.2; // Espacio para 4 letras

    const points = [];

    // H - GIGANTE tocando paredes
    const hX = startX;
    points.push({ x: hX, y: startY });
    points.push({ x: hX, y: startY + letterHeight });
    points.push({ x: hX, y: startY + letterHeight / 2 });
    points.push({ x: hX + letterWidth * 0.85, y: startY + letterHeight / 2 });
    points.push({ x: hX + letterWidth * 0.85, y: startY });
    points.push({ x: hX + letterWidth * 0.85, y: startY + letterHeight });

    // E - GIGANTE
    const eX = startX + letterWidth * 1.05;
    points.push({ x: eX, y: startY });
    points.push({ x: eX + letterWidth * 0.9, y: startY });
    points.push({ x: eX, y: startY });
    points.push({ x: eX, y: startY + letterHeight / 2 });
    points.push({ x: eX + letterWidth * 0.7, y: startY + letterHeight / 2 });
    points.push({ x: eX, y: startY + letterHeight / 2 });
    points.push({ x: eX, y: startY + letterHeight });
    points.push({ x: eX + letterWidth * 0.9, y: startY + letterHeight });

    // L1 - GIGANTE
    const l1X = startX + letterWidth * 2.1;
    points.push({ x: l1X, y: startY });
    points.push({ x: l1X, y: startY + letterHeight });
    points.push({ x: l1X + letterWidth * 0.8, y: startY + letterHeight });

    // L2 - GIGANTE
    const l2X = startX + letterWidth * 3.15;
    points.push({ x: l2X, y: startY });
    points.push({ x: l2X, y: startY + letterHeight });
    points.push({ x: l2X + letterWidth * 0.8, y: startY + letterHeight });

    // Generar ruta con rebotes entre cada punto
    let allPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      const segmentPoints = this.calculateWallBounces(
        points[i].x,
        points[i].y,
        points[i + 1].x,
        points[i + 1].y,
        canvas
      );
      allPoints = allPoints.concat(segmentPoints);
    }

    this.redLinePath = allPoints;
    console.log(
      `🔴 HELL GIGANTE: ${this.redLinePath.length} puntos con rebotes`
    );
  },

  // NUEVA FUNCIÓN - AGREGAR después de generateHellPattern()
  generateZigzagWallPattern(canvas, scale = 1.0) {
    console.log("🔴 Generando ZIGZAG GIGANTE tocando todas las paredes");

    const margin = 30;

    // Z GIGANTE: esquina superior izquierda → superior derecha → inferior izquierda → inferior derecha
    const points = [
      { x: margin, y: margin }, // Esquina superior izquierda
      { x: canvas.width - margin, y: margin }, // Esquina superior derecha
      { x: margin, y: canvas.height - margin }, // Esquina inferior izquierda (diagonal)
      { x: canvas.width - margin, y: canvas.height - margin }, // Esquina inferior derecha
    ];

    // Generar ruta con rebotes para cada segmento
    let allPoints = [];

    for (let i = 0; i < points.length - 1; i++) {
      const segmentPoints = this.calculateWallBounces(
        points[i].x,
        points[i].y,
        points[i + 1].x,
        points[i + 1].y,
        canvas
      );
      allPoints = allPoints.concat(segmentPoints);
    }

    this.redLinePath = allPoints;
    console.log(
      `🔴 Zigzag gigante: ${this.redLinePath.length} puntos con rebotes`
    );
  },

  generateBouncingPattern(canvas, scale = 1.0) {
    const points = [];
    const startX = canvas.width * 0.1;
    const startY = canvas.height * 0.5;
    const segments = 8;

    for (let i = 0; i <= segments; i++) {
      const x = startX + ((canvas.width * 0.8) / segments) * i;
      let y = startY;

      // Crear rebotes aleatorios
      if (i > 0 && i < segments) {
        const bounce = (Math.random() - 0.5) * canvas.height * 0.4 * scale;
        y += bounce;

        // Mantener dentro de límites
        y = Math.max(canvas.height * 0.1, Math.min(canvas.height * 0.9, y));
      }

      points.push({ x, y });
    }

    this.createSmoothPath(points);
  },

  generateChaosPattern(canvas, scale = 1.0) {
    console.log("🌪️ Generando patrón CAOS total");

    const points = [];
    const segments = 15; // Muchos segmentos

    for (let i = 0; i <= segments; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      points.push({ x, y });
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

  // NUEVA FUNCIÓN - AGREGAR después de generateFallbackLine()
  calculateWallBounces(startX, startY, endX, endY, canvas) {
    console.log(
      `🔴 Calculando rebotes de (${startX}, ${startY}) a (${endX}, ${endY})`
    );

    const points = [];
    const margin = 20; // Margen de las paredes

    let currentX = startX;
    let currentY = startY;
    let velocityX = (endX - startX) * 0.01; // Velocidad inicial
    let velocityY = (endY - startY) * 0.01;

    // Normalizar velocidades para movimiento consistente
    const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    velocityX = (velocityX / magnitude) * 8; // Velocidad base
    velocityY = (velocityY / magnitude) * 8;

    const maxIterations = 2000; // Prevenir bucles infinitos
    let iterations = 0;

    while (iterations < maxIterations) {
      points.push({ x: currentX, y: currentY });

      // Calcular siguiente posición
      const nextX = currentX + velocityX;
      const nextY = currentY + velocityY;

      // Verificar colisiones con paredes y REBOTAR
      if (nextX <= margin || nextX >= canvas.width - margin) {
        velocityX = -velocityX * 0.95; // Rebote horizontal con leve reducción
        console.log(`🔴 Rebote horizontal en X=${nextX}`);
      }

      if (nextY <= margin || nextY >= canvas.height - margin) {
        velocityY = -velocityY * 0.95; // Rebote vertical con leve reducción
        console.log(`🔴 Rebote vertical en Y=${nextY}`);
      }

      // Mantener dentro de límites estrictos
      currentX = Math.max(margin, Math.min(canvas.width - margin, nextX));
      currentY = Math.max(margin, Math.min(canvas.height - margin, nextY));

      // Condición de terminación: cerca del punto final O suficientes rebotes
      const distanceToEnd = Math.sqrt(
        Math.pow(currentX - endX, 2) + Math.pow(currentY - endY, 2)
      );

      if (distanceToEnd < 50 || iterations > 800) {
        // Agregar punto final
        points.push({ x: endX, y: endY });
        break;
      }

      iterations++;
    }

    console.log(
      `🔴 Calculados ${points.length} puntos con ${iterations} iteraciones`
    );
    return points;
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
