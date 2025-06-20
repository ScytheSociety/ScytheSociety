/**
 * Hell Shooter - Boss Red Line System
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
  playerSlowFactor: 0.05, // Jugador SÚPER LENTO

  // Configuración de líneas
  lineConfig: {
    previewDuration: 1000, // 1 segundo para memorizar
    lineWidth: 8,
    glowBlur: 20,
    trailLength: 20, // Puntos de estela
    minSegments: 3,
    maxSegments: 8,
    pointsPerSegment: 25, // Densidad de puntos
  },

  // Estado de ciclos
  cycleCount: 0,
  maxCycles: 5, // Máximo 5 ciclos antes de ir a Yan Ken Po
  vulnerabilityDuration: 1000, // 1 segundo vulnerable

  // Tipos de líneas disponibles
  lineTypes: ["random", "zigzag", "curve", "arc", "spiral"],

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  /**
   * Inicializar el sistema de hilo rojo
   */
  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.initRedLineSystem();
    console.log("🔴 Sistema de hilo rojo del boss inicializado");
  },

  /**
   * Configurar sistema de hilo rojo
   */
  initRedLineSystem() {
    this.phaseActive = false;
    this.redLineMoving = false;
    this.showingPreview = false;
    this.redLinePath = [];
    this.redLineIndex = 0;
    this.cycleCount = 0;
    this.originalPlayerSpeed = Player.moveSpeed;
  },

  // ======================================================
  // CONTROL DE FASE
  // ======================================================

  /**
   * Iniciar la fase del hilo rojo - CORREGIDO PARA RALENTIZAR JUGADOR
   */
  startPhase() {
    console.log("🔴 === INICIANDO FASE DEL HILO ROJO ===");

    this.phaseActive = true;
    this.cycleCount = 0;
    this.bossManager.makeImmune(9999);

    // Detener movimiento del boss
    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
    }

    // 🔥 CORREGIDO: Ralentizar SÚPER LENTO al jugador durante TODA la fase
    if (window.Player) {
      this.originalPlayerSpeed = window.Player.moveSpeed; // Guardar velocidad original
      window.Player.moveSpeed = this.playerSlowFactor; // 0.05 = 95% más lento
      console.log(
        "🐌 Jugador SÚPER MEGA LENTO durante TODA la fase del hilo rojo"
      );
    }

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        "🔴 FASE DEL HILO ROJO 🔴",
        "#FF0000"
      );
    }

    if (this.bossManager.comments) {
      this.bossManager.comments.showBossMessage("¡Sigue mi rastro mortal!");
    }

    // Iniciar primer ciclo después de un delay
    setTimeout(() => {
      this.startRedLineCycle();
    }, 1000);
  },

  /**
   * Terminar la fase del hilo rojo - CORREGIDO PARA RESTAURAR VELOCIDAD
   */
  endPhase() {
    console.log("🔴 Terminando COMPLETAMENTE la fase del hilo rojo");

    this.phaseActive = false;
    this.redLineMoving = false;
    this.showingPreview = false;
    this.redLinePath = [];
    this.redLineIndex = 0;
    this.cycleCount = 0;

    // 🔥 VERIFICAR QUE EL JUGADOR EXISTE antes de restaurar velocidad
    if (window.Player && Player.moveSpeed !== undefined) {
      Player.moveSpeed = this.originalPlayerSpeed || 1.0; // Restaurar velocidad original
      console.log("🏃 Velocidad del jugador restaurada a normal en Red Line");
    }

    // 🔥 VERIFICAR QUE EL BOSS EXISTE antes de hacerlo vulnerable
    if (this.bossManager && this.bossManager.boss) {
      this.bossManager.isImmune = false;
      this.bossManager.immunityTimer = 0;
      console.log("🔴 Boss hecho vulnerable al terminar Red Line");
    } else {
      console.warn("🔴 Warning: Boss no existe al terminar Red Line");
    }
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  /**
   * Actualizar sistema de hilo rojo
   */
  update() {
    // 🔥 VERIFICAR que la fase y el boss siguen activos
    if (!this.phaseActive || !this.bossManager || !this.bossManager.active) {
      return;
    }

    // 🔥 VERIFICAR que el boss existe físicamente
    if (!this.bossManager.boss) {
      console.error("🔴 Boss desapareció durante Red Line, terminando fase");
      this.endPhase();
      return;
    }

    // Actualizar movimiento del boss por la línea
    if (this.redLineMoving) {
      this.updateBossMovement();
    }
  },

  /**
   * Actualizar movimiento del boss por la línea
   */
  updateBossMovement() {
    // Verificaciones de seguridad
    if (!this.redLineMoving || this.redLinePath.length === 0) {
      return;
    }

    if (!this.bossManager || !this.bossManager.boss) {
      console.error("🔴 Error: Boss no existe en updateBossMovement");
      this.endPhase();
      return;
    }

    // 🔥 MEJORAR la verificación de fin de recorrido
    if (this.redLineIndex >= this.redLinePath.length - 2) {
      // 🔥 CAMBIADO: -2 en lugar de -1
      console.log("🔴 Boss completó el recorrido del hilo rojo");
      this.endRedLineMovement();
      return;
    }

    // Mover el boss por la línea
    const currentPoint = this.redLinePath[Math.floor(this.redLineIndex)]; // 🔥 AGREGADO: Math.floor
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

      // Aplicar daño al jugador
      Player.takeDamage();

      // Efecto visual
      if (this.bossManager.ui) {
        this.bossManager.ui.createParticleEffect(
          boss.x + boss.width / 2,
          boss.y + boss.height / 2,
          "#FF0000",
          20
        );
      }
    }

    // Avanzar en la línea - 🔥 VELOCIDAD AJUSTABLE
    this.redLineIndex += this.redLineSpeed;
  },

  /**
   * Verificar colisión del boss con el jugador
   */
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

  /**
   * Iniciar un ciclo completo de hilo rojo
   */
  startRedLineCycle() {
    console.log(
      `🔄 Iniciando ciclo ${this.cycleCount + 1}/${this.maxCycles} de hilo rojo`
    );

    // 🔥 VERIFICAR QUE EL BOSS EXISTE ANTES DE CONTINUAR
    if (!this.bossManager || !this.bossManager.boss) {
      console.error("🔴 Error: Boss no existe para iniciar ciclo red line");
      this.endPhase();
      return;
    }

    // Generar nueva línea aleatoria
    this.generateRedLine();

    // 🔥 VERIFICAR QUE LA LÍNEA SE GENERÓ CORRECTAMENTE
    if (this.redLinePath.length === 0) {
      console.error("🔴 Error: No se pudo generar línea roja");
      this.endPhase();
      return;
    }

    // PASO 1: Mostrar línea brevemente
    this.showLinePreview();
  },

  /**
   * Mostrar preview de la línea
   */
  showLinePreview() {
    console.log("🔴 Mostrando preview de la línea...");

    this.showingPreview = true;

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("¡MEMORIZA LA RUTA!", "#FFFF00");
    }

    // Mostrar por tiempo configurado
    setTimeout(() => {
      this.showingPreview = false;
      console.log("🔴 Preview terminado - boss iniciará movimiento");

      // Pequeño delay antes del movimiento
      setTimeout(() => {
        this.startRedLineMovement();
      }, 200);
    }, this.lineConfig.previewDuration);
  },

  /**
   * Iniciar movimiento del boss por la línea
   */
  startRedLineMovement() {
    // 🔥 VERIFICAR QUE EL BOSS EXISTE
    if (!this.bossManager || !this.bossManager.boss) {
      console.error("🔴 Error: Boss no existe para red line movement");
      this.endPhase(); // Terminar la fase si no hay boss
      return;
    }

    if (this.redLinePath.length === 0) {
      console.error("🔴 Error: No hay línea roja generada");
      this.endPhase(); // 🔥 CORREGIDO: usar endPhase en lugar de endRedLinePhase
      return;
    }

    this.redLineIndex = 0;
    this.redLineMoving = true;

    // Posicionar boss al inicio de la línea
    const startPoint = this.redLinePath[0];
    const boss = this.bossManager.boss;

    // 🔥 VERIFICACIÓN ADICIONAL
    if (!boss) {
      console.error("🔴 Error: Boss null en startRedLineMovement");
      this.endPhase();
      return;
    }

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

  /**
   * Terminar movimiento de la línea (no la fase completa) - INTEGRADO
   */
  endRedLineMovement() {
    console.log(
      "🔴 Boss terminó el recorrido - notificando a sistema de fases"
    );

    this.redLineMoving = false;
    this.redLinePath = [];
    this.redLineIndex = 0;

    // Notificar al sistema de fases que terminó este hilo
    if (this.bossManager.phases) {
      // En el nuevo sistema, la fase maneja la secuencia
      console.log("🔴 Hilo rojo completado, esperando siguiente...");
    }

    // El boss NO se hace vulnerable aquí, eso lo maneja el sistema de fases
    console.log("🔴 Hilo rojo individual completado");
  },

  /**
   * 🔥 NUEVO: Método para ser llamado por el sistema de fases
   */
  startRedLineCycleFromPhases() {
    console.log("🔴 Iniciando ciclo de hilo rojo desde sistema de fases");
    this.startRedLineCycle();
  },

  /**
   * 🔥 NUEVO: Verificar si el hilo actual terminó
   */
  isCurrentRedLineComplete() {
    return !this.redLineMoving && this.redLinePath.length === 0;
  },

  /**
   * Decidir la siguiente acción - CORREGIDO
   */
  decideNextAction() {
    const healthPercentage =
      this.bossManager.currentHealth / this.bossManager.maxHealth;

    console.log(
      `🔴 Decidiendo siguiente acción - Vida: ${Math.round(
        healthPercentage * 100
      )}% - Ciclo: ${this.cycleCount}/${this.maxCycles}`
    );

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
      console.log("🔄 Máximo de ciclos alcanzado - cambiando de fase");
      this.endPhase();
      if (this.bossManager.phases) {
        this.bossManager.phases.handleYanKenPoLoss(); // Fase aleatoria
      }
      return;
    }

    // 🔥 CORREGIDO: NO hacer inmune inmediatamente
    // Continuar con otro ciclo DESPUÉS de un pequeño delay
    console.log("🔄 Continuando con nuevo ciclo de hilo rojo");

    setTimeout(() => {
      // 🔥 AHORA SÍ hacer inmune cuando empiece el nuevo ciclo
      this.bossManager.makeImmune(9999);
      this.startRedLineCycle();
    }, 1000); // 1 segundo de delay antes del siguiente ciclo
  },

  /**
   * Terminar TODA la fase del hilo rojo (no solo el movimiento)
   */
  endRedLinePhase() {
    console.log("🔴 Terminando TODA la fase del hilo rojo");

    this.endPhase(); // Llamar al método principal que ya existe
  },

  // ======================================================
  // GENERACIÓN DE LÍNEAS
  // ======================================================

  /**
   * Generar línea roja aleatoria
   */
  generateRedLine() {
    this.redLinePath = [];

    const canvas = window.getCanvas();

    // 🔥 VERIFICAR QUE EL CANVAS EXISTE
    if (!canvas) {
      console.error("🔴 Error: Canvas no existe para generar línea");
      return;
    }

    const lineType =
      this.lineTypes[Math.floor(Math.random() * this.lineTypes.length)];

    console.log(`🔴 Generando línea tipo: ${lineType}`);

    switch (lineType) {
      case "random":
        this.generateRandomLine(canvas);
        break;
      case "zigzag":
        this.generateZigzagLine(canvas);
        break;
      case "curve":
        this.generateCurvedLine(canvas);
        break;
      case "arc":
        this.generateArcLine(canvas);
        break;
      case "spiral":
        this.generateSpiralLine(canvas);
        break;
    }

    console.log(`🔴 Línea generada con ${this.redLinePath.length} puntos`);

    // 🔥 VERIFICAR QUE SE GENERARON PUNTOS
    if (this.redLinePath.length === 0) {
      console.error("🔴 Error: No se generaron puntos para la línea");
      // Generar línea simple de respaldo
      this.generateFallbackLine(canvas);
    }
  },

  /**
   * Generar línea completamente aleatoria
   */
  generateRandomLine(canvas) {
    const startPoint = this.getRandomBorderPoint(canvas);
    const segments =
      this.lineConfig.minSegments +
      Math.floor(
        Math.random() *
          (this.lineConfig.maxSegments - this.lineConfig.minSegments)
      );

    let currentX = startPoint.x;
    let currentY = startPoint.y;

    this.redLinePath.push({ x: currentX, y: currentY });

    for (let i = 0; i < segments; i++) {
      const segment = this.generateRandomSegment(canvas, currentX, currentY);

      for (const point of segment) {
        this.redLinePath.push(point);
      }

      if (segment.length > 0) {
        const lastPoint = segment[segment.length - 1];
        currentX = lastPoint.x;
        currentY = lastPoint.y;
      }
    }
  },

  /**
   * Generar línea en zigzag
   */
  generateZigzagLine(canvas) {
    const startX = Math.random() * canvas.width;
    const startY = 50;
    const endX = Math.random() * canvas.width;
    const endY = canvas.height - 50;

    const segments = 6;
    const amplitude = 80 + Math.random() * 40;

    for (let i = 0; i <= segments * this.lineConfig.pointsPerSegment; i++) {
      const t = i / (segments * this.lineConfig.pointsPerSegment);
      const baseX = startX + (endX - startX) * t;
      const baseY = startY + (endY - startY) * t;

      const zigzagOffset = Math.sin(t * Math.PI * segments) * amplitude;
      const perpX =
        -(endY - startY) /
        Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

      this.redLinePath.push({
        x: baseX + perpX * zigzagOffset,
        y: baseY,
      });
    }
  },

  /**
   * Generar línea curva suave
   */
  generateCurvedLine(canvas) {
    const startPoint = this.getRandomBorderPoint(canvas);
    const endPoint = this.getRandomBorderPoint(canvas);

    // Puntos de control para curva Bézier
    const controlPoints = [];
    const numControls = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numControls; i++) {
      controlPoints.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
      });
    }

    // Generar curva usando interpolación
    const totalPoints = this.lineConfig.pointsPerSegment * 4;

    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      const point = this.calculateBezierPoint(
        t,
        startPoint,
        controlPoints,
        endPoint
      );
      this.redLinePath.push(point);
    }
  },

  /**
   * Generar línea en arco
   */
  generateArcLine(canvas) {
    const centerX = canvas.width / 2 + (Math.random() - 0.5) * 200;
    const centerY = canvas.height / 2 + (Math.random() - 0.5) * 200;
    const radius = 150 + Math.random() * 100;

    const startAngle = Math.random() * Math.PI * 2;
    const endAngle = startAngle + Math.PI * (0.5 + Math.random());

    const totalPoints = this.lineConfig.pointsPerSegment * 3;

    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      const angle = startAngle + (endAngle - startAngle) * t;

      this.redLinePath.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }
  },

  /**
   * Generar línea en espiral
   */
  generateSpiralLine(canvas) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 3;

    const turns = 2 + Math.random() * 2;
    const totalPoints = this.lineConfig.pointsPerSegment * 5;

    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      const angle = t * Math.PI * 2 * turns;
      const radius = t * maxRadius;

      this.redLinePath.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }
  },

  /**
   * 🔥 NUEVO: Generar línea simple de respaldo
   */
  generateFallbackLine(canvas) {
    console.log("🔴 Generando línea de respaldo simple");

    const startX = canvas.width * 0.2;
    const startY = canvas.height * 0.3;
    const endX = canvas.width * 0.8;
    const endY = canvas.height * 0.7;

    // Línea recta simple con 20 puntos
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
  // UTILIDADES DE GENERACIÓN
  // ======================================================

  /**
   * Obtener punto aleatorio en los bordes
   */
  getRandomBorderPoint(canvas) {
    const border = Math.floor(Math.random() * 4);

    switch (border) {
      case 0: // Top
        return { x: Math.random() * canvas.width, y: 50 };
      case 1: // Right
        return { x: canvas.width - 50, y: Math.random() * canvas.height };
      case 2: // Bottom
        return { x: Math.random() * canvas.width, y: canvas.height - 50 };
      case 3: // Left
        return { x: 50, y: Math.random() * canvas.height };
      default:
        return { x: 50, y: 50 };
    }
  },

  /**
   * Generar segmento aleatorio
   */
  generateRandomSegment(canvas, startX, startY) {
    const endX = Math.random() * canvas.width;
    const endY = Math.random() * canvas.height;
    const segmentType = Math.floor(Math.random() * 3);

    const points = [];
    const pointCount = this.lineConfig.pointsPerSegment;

    switch (segmentType) {
      case 0: // Línea recta
        for (let i = 0; i <= pointCount; i++) {
          const t = i / pointCount;
          points.push({
            x: startX + (endX - startX) * t,
            y: startY + (endY - startY) * t,
          });
        }
        break;

      case 1: // Curva
        const controlX = (startX + endX) / 2 + (Math.random() - 0.5) * 200;
        const controlY = (startY + endY) / 2 + (Math.random() - 0.5) * 200;

        for (let i = 0; i <= pointCount; i++) {
          const t = i / pointCount;
          const x =
            (1 - t) ** 2 * startX + 2 * (1 - t) * t * controlX + t ** 2 * endX;
          const y =
            (1 - t) ** 2 * startY + 2 * (1 - t) * t * controlY + t ** 2 * endY;
          points.push({ x, y });
        }
        break;

      case 2: // Zigzag
        const amplitude = 30 + Math.random() * 50;
        for (let i = 0; i <= pointCount; i++) {
          const t = i / pointCount;
          const baseX = startX + (endX - startX) * t;
          const baseY = startY + (endY - startY) * t;
          const offset = Math.sin(t * Math.PI * 3) * amplitude;

          const perpX =
            -(endY - startY) /
            Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
          const perpY =
            (endX - startX) /
            Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

          points.push({
            x: baseX + perpX * offset,
            y: baseY + perpY * offset,
          });
        }
        break;
    }

    return points;
  },

  /**
   * Calcular punto en curva Bézier
   */
  calculateBezierPoint(t, start, controls, end) {
    // Implementación simplificada para múltiples puntos de control
    if (controls.length === 1) {
      // Curva cuadrática
      const control = controls[0];
      return {
        x:
          (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
        y:
          (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y,
      };
    } else {
      // Interpolación lineal entre múltiples puntos
      const totalSegments = controls.length + 1;
      const segmentIndex = Math.floor(t * totalSegments);
      const segmentT = t * totalSegments - segmentIndex;

      let p1, p2;
      if (segmentIndex === 0) {
        p1 = start;
        p2 = controls[0];
      } else if (segmentIndex >= controls.length) {
        p1 = controls[controls.length - 1];
        p2 = end;
      } else {
        p1 = controls[segmentIndex - 1];
        p2 = controls[segmentIndex];
      }

      return {
        x: p1.x + (p2.x - p1.x) * segmentT,
        y: p1.y + (p2.y - p1.y) * segmentT,
      };
    }
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  /**
   * Dibujar la línea roja
   */
  draw(ctx) {
    if (this.redLinePath.length === 0) return;

    ctx.save();

    // Solo mostrar línea durante el preview
    if (this.showingPreview) {
      this.drawPreviewLine(ctx);
    }

    // Dibujar estela cuando el boss se mueve
    if (this.redLineMoving && this.redLineIndex > 0) {
      this.drawBossTrail(ctx);
    }

    ctx.restore();
  },

  /**
   * Dibujar línea de preview
   */
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

    // Efecto de parpadeo para llamar la atención
    const pulse = Math.sin(window.getGameTime() * 0.5) * 0.4 + 0.6;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = this.lineConfig.lineWidth / 2;
    ctx.stroke();
  },

  /**
   * Dibujar estela del boss
   */
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
  // RESET Y CLEANUP
  // ======================================================

  /**
   * Limpiar sistema
   */
  cleanup() {
    console.log("🧹 Limpiando sistema de hilo rojo");

    this.phaseActive = false;
    this.redLineMoving = false;
    this.showingPreview = false;
    this.redLinePath = [];
    this.redLineIndex = 0;
    this.cycleCount = 0;

    // Restaurar velocidad del jugador
    if (Player.moveSpeed !== this.originalPlayerSpeed) {
      Player.moveSpeed = this.originalPlayerSpeed;
    }
  },

  /**
   * Reset del sistema
   */
  reset() {
    this.cleanup();
    this.initRedLineSystem();
    console.log("🔄 Sistema de hilo rojo reseteado");
  },

  // ======================================================
  // GETTERS Y UTILIDADES
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

  getCurrentPosition() {
    if (!this.redLineMoving || this.redLineIndex >= this.redLinePath.length) {
      return null;
    }
    return this.redLinePath[this.redLineIndex];
  },
};

// Hacer disponible globalmente
window.BossRedLine = BossRedLine;

console.log("🔴 boss-redline.js cargado - Sistema de hilo rojo listo");
