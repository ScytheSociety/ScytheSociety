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

  // Configuración de líneas - CORREGIDA
  lineConfig: {
    previewDuration: 1000, // 1 segundo para memorizar (sin cambios)
    lineWidth: 10, // Más gruesa para mejor visibilidad
    glowBlur: 25, // Más brillo
    trailLength: 25, // Estela más larga
    minSegments: 4, // Más segmentos mínimos
    maxSegments: 6, // Menos segmentos máximos para evitar complejidad excesiva
    pointsPerSegment: 20, // Menos densidad para movimiento más fluido
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
   * Iniciar la fase del hilo rojo - CORREGIDA velocidad jugador extrema
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

    // 🔥 JUGADOR SÚPER SÚPER LENTO durante TODA la fase
    if (window.Player) {
      this.originalPlayerSpeed = window.Player.moveSpeed;
      window.Player.moveSpeed = 0.02; // Era 0.05, ahora 0.02 = 98% más lento
      console.log("🐌 Jugador EXTREMADAMENTE LENTO durante fase del hilo rojo");
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
   * Mostrar preview de la línea - CORREGIDA
   */
  showLinePreview() {
    console.log("🔴 Mostrando preview de la línea por 1 segundo...");

    this.showingPreview = true;

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage("👁️ ¡MEMORIZA LA RUTA!", "#FFFF00");
    }

    // 🔥 PREVIEW CORTO: Solo 1 segundo para memorizar
    setTimeout(() => {
      this.showingPreview = false;
      console.log(
        "🔴 Preview terminado - línea desaparece, boss iniciará movimiento"
      );

      if (this.bossManager.ui) {
        this.bossManager.ui.showScreenMessage("🔴 ¡LÍNEA OCULTA!", "#FF0000");
      }

      // Pequeño delay antes del movimiento para crear tensión
      setTimeout(() => {
        this.startRedLineMovement();
      }, 500);
    }, 1000); // Solo 1 segundo de preview
  },

  /**
   * Iniciar movimiento del boss por la línea - CORREGIDA velocidad
   */
  startRedLineMovement() {
    // 🔥 VERIFICAR QUE EL BOSS EXISTE
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

    // 🔥 VELOCIDAD MÁS RÁPIDA DEL BOSS
    this.redLineSpeed = 6; // Era 4, ahora 6 (50% más rápido)

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
        "🔴 ¡BOSS EN MOVIMIENTO RÁPIDO!",
        "#FF0000"
      );
    }

    console.log("🔴 Boss iniciando movimiento RÁPIDO por la línea");
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
   * Generar línea roja con rebotes en paredes - CORREGIDA
   */
  generateRedLine() {
    this.redLinePath = [];

    const canvas = window.getCanvas();

    // 🔥 VERIFICAR QUE EL CANVAS EXISTE
    if (!canvas) {
      console.error("🔴 Error: Canvas no existe para generar línea");
      return;
    }

    console.log("🔴 Generando línea con rebotes inteligentes");

    // Márgenes para mantener línea dentro del área visible
    const margin = 50;
    const boundaries = {
      left: margin,
      right: canvas.width - margin,
      top: margin + 50, // Evitar UI superior
      bottom: canvas.height - margin,
    };

    // Punto inicial aleatorio en el borde
    let currentPoint = this.getRandomBorderPoint(canvas, boundaries);
    this.redLinePath.push({ x: currentPoint.x, y: currentPoint.y });

    // Generar 4-6 segmentos con rebotes
    const segmentCount = 4 + Math.floor(Math.random() * 3);
    let currentDirection = this.getRandomDirection();

    for (let segment = 0; segment < segmentCount; segment++) {
      const segmentLength = 80 + Math.random() * 120; // Longitud variable
      const newSegment = this.generateSegmentWithBounces(
        currentPoint,
        currentDirection,
        segmentLength,
        boundaries
      );

      // Agregar puntos del segmento
      newSegment.points.forEach((point) => {
        this.redLinePath.push(point);
      });

      // Actualizar para siguiente segmento
      if (newSegment.points.length > 0) {
        currentPoint = newSegment.points[newSegment.points.length - 1];
        currentDirection = newSegment.finalDirection;
      }
    }

    console.log(
      `🔴 Línea generada con ${this.redLinePath.length} puntos y rebotes`
    );

    // 🔥 VERIFICAR QUE SE GENERARON PUNTOS
    if (this.redLinePath.length === 0) {
      console.error("🔴 Error: No se generaron puntos para la línea");
      this.generateFallbackLine(canvas);
    }
  },

  /**
   * Generar segmento con rebotes en paredes - NUEVO
   */
  generateSegmentWithBounces(startPoint, direction, maxLength, boundaries) {
    const points = [];
    let currentX = startPoint.x;
    let currentY = startPoint.y;
    let currentDirX = Math.cos(direction);
    let currentDirY = Math.sin(direction);
    let remainingLength = maxLength;

    const stepSize = 5; // Tamaño de paso para detectar colisiones

    while (remainingLength > 0) {
      // Calcular próxima posición
      const nextX = currentX + currentDirX * stepSize;
      const nextY = currentY + currentDirY * stepSize;

      // Verificar colisiones con límites
      let bounced = false;

      // Rebote en paredes laterales
      if (nextX <= boundaries.left || nextX >= boundaries.right) {
        currentDirX = -currentDirX; // Invertir dirección X
        bounced = true;
        console.log("🔴 Rebote en pared lateral");
      }

      // Rebote en paredes superior/inferior
      if (nextY <= boundaries.top || nextY >= boundaries.bottom) {
        currentDirY = -currentDirY; // Invertir dirección Y
        bounced = true;
        console.log("🔴 Rebote en pared vertical");
      }

      // Si rebotó, recalcular posición
      if (bounced) {
        currentX = Math.max(boundaries.left, Math.min(boundaries.right, nextX));
        currentY = Math.max(boundaries.top, Math.min(boundaries.bottom, nextY));
      } else {
        currentX = nextX;
        currentY = nextY;
      }

      // Agregar punto
      points.push({ x: currentX, y: currentY });

      remainingLength -= stepSize;

      // Evitar bucles infinitos
      if (points.length > 200) {
        console.warn("🔴 Segmento muy largo, cortando");
        break;
      }
    }

    // Calcular dirección final
    const finalDirection = Math.atan2(currentDirY, currentDirX);

    return {
      points: points,
      finalDirection: finalDirection,
    };
  },

  /**
   * Obtener dirección aleatoria - NUEVO
   */
  getRandomDirection() {
    // Direcciones preferidas (evitar ángulos muy verticales)
    const angles = [
      0, // Derecha
      Math.PI / 4, // Diagonal derecha-abajo
      Math.PI / 2, // Abajo
      (3 * Math.PI) / 4, // Diagonal izquierda-abajo
      Math.PI, // Izquierda
      (5 * Math.PI) / 4, // Diagonal izquierda-arriba
      (3 * Math.PI) / 2, // Arriba
      (7 * Math.PI) / 4, // Diagonal derecha-arriba
    ];

    return angles[Math.floor(Math.random() * angles.length)];
  },

  /**
   * Calcular rebotes de la línea en las paredes - NUEVO
   */
  calculateBounces(startX, startY, endX, endY, canvas, margin) {
    const points = [];
    const segmentPoints = 25; // Densidad de puntos por segmento

    let currentX = startX;
    let currentY = startY;
    let dirX = endX - startX;
    let dirY = endY - startY;

    // Normalizar dirección
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length === 0) return points;

    dirX /= length;
    dirY /= length;

    let remainingDistance = length;
    const stepSize = length / segmentPoints;

    for (let i = 0; i < segmentPoints && remainingDistance > 0; i++) {
      // Calcular siguiente punto
      const nextX = currentX + dirX * stepSize;
      const nextY = currentY + dirY * stepSize;

      // Verificar colisión con paredes y rebotar
      let bounced = false;

      // Rebote en pared izquierda o derecha
      if (nextX <= margin || nextX >= canvas.width - margin) {
        dirX = -dirX; // Invertir dirección X
        bounced = true;
        currentX = nextX <= margin ? margin : canvas.width - margin;
      } else {
        currentX = nextX;
      }

      // Rebote en pared superior o inferior
      if (nextY <= margin || nextY >= canvas.height - margin) {
        dirY = -dirY; // Invertir dirección Y
        bounced = true;
        currentY = nextY <= margin ? margin : canvas.height - margin;
      } else {
        currentY = nextY;
      }

      points.push({ x: currentX, y: currentY });

      if (bounced) {
        console.log(
          `🔴 Rebote en (${Math.round(currentX)}, ${Math.round(currentY)})`
        );
      }

      remainingDistance -= stepSize;
    }

    return points;
  },

  /**
   * Generar línea aleatoria con rebotes en paredes - NUEVO
   */
  generateBouncingRandomLine(canvas, margin, safeWidth, safeHeight) {
    // Punto de inicio aleatorio en el área segura
    let currentX = margin + Math.random() * safeWidth;
    let currentY = margin + Math.random() * safeHeight;

    // Dirección inicial aleatoria
    let directionX = (Math.random() - 0.5) * 2; // -1 a 1
    let directionY = (Math.random() - 0.5) * 2;

    // Normalizar dirección
    const magnitude = Math.sqrt(
      directionX * directionX + directionY * directionY
    );
    directionX /= magnitude;
    directionY /= magnitude;

    const stepSize = 15; // Tamaño del paso
    const maxPoints = 120; // Máximo de puntos

    this.redLinePath.push({ x: currentX, y: currentY });

    for (let i = 0; i < maxPoints; i++) {
      // Calcular nueva posición
      const newX = currentX + directionX * stepSize;
      const newY = currentY + directionY * stepSize;

      // 🔥 VERIFICAR REBOTES EN PAREDES
      if (newX <= margin || newX >= canvas.width - margin) {
        directionX = -directionX; // Rebote horizontal
        console.log(`🔴 Rebote horizontal en X=${Math.round(newX)}`);
      }

      if (newY <= margin || newY >= canvas.height - margin) {
        directionY = -directionY; // Rebote vertical
        console.log(`🔴 Rebote vertical en Y=${Math.round(newY)}`);
      }

      // Actualizar posición con rebotes aplicados
      currentX = Math.max(margin, Math.min(canvas.width - margin, newX));
      currentY = Math.max(margin, Math.min(canvas.height - margin, newY));

      this.redLinePath.push({ x: currentX, y: currentY });

      // Cambio de dirección ocasional (10% probabilidad)
      if (Math.random() < 0.1) {
        const angleChange = (Math.random() - 0.5) * 0.8; // Cambio ligero
        const currentAngle = Math.atan2(directionY, directionX);
        const newAngle = currentAngle + angleChange;

        directionX = Math.cos(newAngle);
        directionY = Math.sin(newAngle);
      }
    }

    console.log(
      `🔴 Línea aleatoria con rebotes: ${this.redLinePath.length} puntos`
    );
  },

  /**
   * Generar línea de respaldo simple con rebotes - NUEVO
   */
  generateSafeBouncingLine(canvas, margin, safeWidth, safeHeight) {
    console.log("🔴 Generando línea de respaldo con rebotes");

    // Línea simple que rebota en forma de zigzag
    const startX = margin + 50;
    const startY = margin + 50;
    const endX = canvas.width - margin - 50;
    const endY = canvas.height - margin - 50;

    const segments = 8;
    const pointsPerSegment = 15;

    for (let seg = 0; seg <= segments; seg++) {
      const segmentProgress = seg / segments;

      // Zigzag que rebota en los bordes
      let x, y;

      if (seg % 2 === 0) {
        // Segmento hacia la derecha
        x = startX + (endX - startX) * segmentProgress;
        y =
          startY + Math.sin(segmentProgress * Math.PI * 2) * (safeHeight * 0.3);
      } else {
        // Segmento hacia la izquierda
        x =
          endX -
          (endX - startX) * (segmentProgress - Math.floor(segmentProgress));
        y =
          startY + Math.sin(segmentProgress * Math.PI * 2) * (safeHeight * 0.3);
      }

      // Asegurar que esté dentro del área segura
      x = Math.max(margin, Math.min(canvas.width - margin, x));
      y = Math.max(margin, Math.min(canvas.height - margin, y));

      // Crear puntos intermedios para suavidad
      if (seg > 0) {
        const prevPoint = this.redLinePath[this.redLinePath.length - 1];

        for (let p = 1; p <= pointsPerSegment; p++) {
          const t = p / pointsPerSegment;
          const interpX = prevPoint.x + (x - prevPoint.x) * t;
          const interpY = prevPoint.y + (y - prevPoint.y) * t;

          this.redLinePath.push({ x: interpX, y: interpY });
        }
      } else {
        this.redLinePath.push({ x, y });
      }
    }

    console.log(
      `🔴 Línea de respaldo creada con ${this.redLinePath.length} puntos`
    );
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
   * Obtener punto aleatorio en los bordes con límites - CORREGIDA
   */
  getRandomBorderPoint(canvas, boundaries = null) {
    if (!boundaries) {
      boundaries = {
        left: 50,
        right: canvas.width - 50,
        top: 100, // Más abajo para evitar UI
        bottom: canvas.height - 50,
      };
    }

    const border = Math.floor(Math.random() * 4);

    switch (border) {
      case 0: // Top
        return {
          x:
            boundaries.left +
            Math.random() * (boundaries.right - boundaries.left),
          y: boundaries.top,
        };
      case 1: // Right
        return {
          x: boundaries.right,
          y:
            boundaries.top +
            Math.random() * (boundaries.bottom - boundaries.top),
        };
      case 2: // Bottom
        return {
          x:
            boundaries.left +
            Math.random() * (boundaries.right - boundaries.left),
          y: boundaries.bottom,
        };
      case 3: // Left
        return {
          x: boundaries.left,
          y:
            boundaries.top +
            Math.random() * (boundaries.bottom - boundaries.top),
        };
      default:
        return { x: boundaries.left, y: boundaries.top };
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
