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

    // 🔥 RALENTIZAR AL JUGADOR INMEDIATAMENTE
    if (window.Player && Player.setSpeedModifier) {
      Player.setSpeedModifier(this.playerSlowFactor);
      console.log(
        `🐌 Jugador ralentizado a ${this.playerSlowFactor}x durante Red Line`
      );
    }

    // 🔥 FORZAR BOSS COMPLETAMENTE INMÓVIL - MÚLTIPLES BLOQUEOS
    if (this.bossManager.movement) {
      this.bossManager.movement.stopMovementAndCenter();
      this.bossManager.movement.enabled = false;
      this.bossManager.movement.huntingEnabled = false; // NUEVO
      this.bossManager.movement.canMove = false; // NUEVO
      console.log("🛡️ Boss FORZADO INMÓVIL - TODOS los movimientos bloqueados");
    }

    // 🔥 NUEVO: DESACTIVAR COMPLETAMENTE EL SISTEMA DE PHASES DURANTE REDLINE
    if (this.bossManager.phases) {
      this.bossManager.phases.redLineForceActive = true; // Flag especial
      console.log("🔴 Sistema de phases BLOQUEADO durante Red Line");
    }

    // 🔥 NUEVO: FORZAR POSICIÓN CENTRAL Y BLOQUEARLA
    const canvas = window.getCanvas();
    const boss = this.bossManager.boss;
    if (boss) {
      boss.x = (canvas.width - boss.width) / 2;
      boss.y = (canvas.height - boss.height) / 2;
      boss.velocityX = 0;
      boss.velocityY = 0;
      // Bloquear cualquier cambio de posición
      boss.isLocked = true;
      console.log("🔒 Boss BLOQUEADO en posición central");
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
    this.gridLines = [];

    // 🔥 RESTAURAR VELOCIDAD DEL JUGADOR
    if (window.Player && Player.restoreNormalSpeed) {
      Player.restoreNormalSpeed();
      console.log("🏃 Velocidad del jugador restaurada a normal");
    } else if (window.Player && Player.setSpeedModifier) {
      Player.setSpeedModifier(this.originalPlayerSpeed);
      console.log("🏃 Velocidad del jugador restaurada manualmente");
    }

    // 🔥 NUEVO: REACTIVAR SISTEMA DE PHASES
    if (this.bossManager.phases) {
      this.bossManager.phases.redLineForceActive = false;
      console.log("🔴 Sistema de phases REACTIVADO");
    }

    // 🔥 NUEVO: DESBLOQUEAR BOSS
    const boss = this.bossManager.boss;
    if (boss) {
      boss.isLocked = false;
      console.log("🔓 Boss DESBLOQUEADO");
    }

    // 🔥 REACTIVAR MOVIMIENTO SOLO SI COMPLETÓ 10 CICLOS
    if (this.cycleCount >= this.maxCycles) {
      console.log("🔴 Red Line COMPLETADO (10/10) - transición a Yan Ken Po");
      // Mantener inmune para Yan Ken Po
    } else {
      console.log("🔴 Red Line incompleto - boss vulnerable y PUEDE MOVERSE");
      if (this.bossManager) {
        this.bossManager.isImmune = false;
        this.bossManager.immunityTimer = 0;
      }

      // REACTIVAR MOVIMIENTO
      if (this.bossManager.movement) {
        this.bossManager.movement.enabled = true;
        this.bossManager.movement.huntingEnabled = true;
        this.bossManager.movement.canMove = true;
        console.log("🏃 Boss PUEDE MOVERSE de nuevo");
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

  // ======================================================
  // FUNCIÓN AUXILIAR RESPONSIVA PARA CUADRÍCULA
  // ======================================================

  generateAnimatedGrid() {
    const canvas = window.getCanvas();

    // 🔥 ESPACIADO AUMENTADO PARA MÁS ESPACIO ENTRE LÍNEAS
    let spacing;

    if (GameConfig.isMobile) {
      // MÓVIL: Espaciado mayor para facilitar el juego
      const screenScale = Math.min(canvas.width, canvas.height) / 600;
      spacing = Math.max(160, 200 * screenScale); // Era 140/180, ahora 160/200 (más espacio)
    } else {
      // PC: Espaciado normal pero aumentado
      const screenScale = Math.min(canvas.width, canvas.height) / 800;
      spacing = Math.max(120, 140 * screenScale); // Era 100/120, ahora 120/140 (más espacio)
    }

    // 🔥 VELOCIDAD LIGERAMENTE REDUCIDA PARA SER MENOS AGRESIVO
    const gridSpeed = GameConfig.isMobile ? 1.0 : 1.5; // Era 1.2/2.0, ahora 1.0/1.5

    console.log(
      `🔴 Cuadrícula MENOS AGRESIVA - Espaciado: ${spacing.toFixed(
        1
      )}px, Velocidad: ${gridSpeed} (${GameConfig.isMobile ? "MÓVIL" : "PC"})`
    );

    // Líneas verticales (de arriba hacia abajo)
    for (let x = spacing; x < canvas.width; x += spacing) {
      this.gridLines.push({
        type: "vertical",
        x: x,
        y: 0,
        targetY: canvas.height,
        speed: gridSpeed,
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
        speed: gridSpeed,
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

    // 🔥 USAR ÍNDICE ENTERO para evitar decimales
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
    console.log("🔴 Boss terminó el recorrido - continuando INMUNE");

    this.redLineMoving = false;
    this.redLinePath = [];
    this.redLineIndex = 0;
    this.cycleCount++;

    // 🔥 BOSS SIGUE INMUNE - NO VULNERABLE
    // NO cambiar inmunidad aquí
    console.log("🔴 Boss MANTIENE inmunidad durante Red Line");

    if (this.bossManager.ui) {
      this.bossManager.ui.showScreenMessage(
        `🔴 DIBUJO ${this.cycleCount}/10 COMPLETADO`,
        "#FFFF00"
      );
    }

    if (this.bossManager.comments) {
      this.bossManager.comments.sayRandomComment("combate");
    }

    // 🔥 SIN PAUSA DE 3 SEGUNDOS - CONTINUAR INMEDIATAMENTE
    setTimeout(() => {
      this.decideNextAction();
    }, 1000); // Solo 1 segundo entre dibujos
  },

  decideNextAction() {
    const healthPercentage =
      this.bossManager.currentHealth / this.bossManager.maxHealth;

    console.log(`🔴 Dibujo ${this.cycleCount}/${this.maxCycles} completado`);

    // 🔥 SI COMPLETÓ LOS 10 DIBUJOS → TERMINAR Y SER VULNERABLE
    if (this.cycleCount >= this.maxCycles) {
      console.log("🔄 *** 10 DIBUJOS DE RED LINE COMPLETADOS ***");
      console.log("🏃 REGRESANDO A HUNTING - Boss ahora VULNERABLE");

      this.endPhase();

      // 🔥 AHORA SÍ HACER VULNERABLE Y ACTIVAR HUNTING
      setTimeout(() => {
        if (this.bossManager) {
          this.bossManager.isImmune = false;
          this.bossManager.immunityTimer = 0;
          console.log("⚔️ Boss FINALMENTE vulnerable después de 10 dibujos");
        }

        if (this.bossManager.movement) {
          this.bossManager.movement.enabled = true; // Reactivar movimiento
          this.bossManager.movement.enableFluidHunting();
        }

        if (this.bossManager.ui) {
          this.bossManager.ui.showScreenMessage(
            "⚔️ ¡BOSS VULNERABLE! Red Line completado",
            "#00FF00"
          );
        }
      }, 500);
      return;
    }

    // 🔥 CONTINUAR CON OTRO DIBUJO - MANTENER INMUNE
    console.log(
      `🔄 Continuando dibujo ${this.cycleCount + 1}/${this.maxCycles}`
    );
    this.bossManager.makeImmune(9999); // Seguir inmune

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
    // 🔥 MÁRGENES RESPONSIVOS
    const responsiveMargin = GameConfig.isMobile
      ? Math.max(50, canvas.width * 0.1) // 10% en móvil, mínimo 50px
      : Math.max(30, canvas.width * 0.05); // 5% en PC, mínimo 30px

    const points = [
      { x: responsiveMargin, y: responsiveMargin }, // Esquina superior izquierda
      { x: canvas.width - responsiveMargin, y: responsiveMargin }, // Esquina superior derecha
      { x: responsiveMargin, y: canvas.height - responsiveMargin }, // Esquina inferior izquierda
      {
        x: canvas.width - responsiveMargin,
        y: canvas.height - responsiveMargin,
      }, // Esquina inferior derecha
    ];

    this.createSmoothPath(points);
    console.log(
      `🔴 Zigzag RESPONSIVO generado - Margen: ${responsiveMargin}px (${
        GameConfig.isMobile ? "MÓVIL" : "PC"
      })`
    );
  },

  generateStarWalls(canvas) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 🔥 MÁRGENES RESPONSIVOS PARA ESTRELLA
    const responsiveMargin = GameConfig.isMobile
      ? Math.max(60, canvas.width * 0.12) // 12% en móvil
      : Math.max(35, canvas.width * 0.06); // 6% en PC

    const points = [
      { x: centerX, y: responsiveMargin }, // Punta superior (toca techo)
      {
        x: canvas.width - responsiveMargin,
        y: canvas.height - responsiveMargin,
      }, // Esquina inferior derecha
      { x: responsiveMargin, y: centerY }, // Punta izquierda (toca pared)
      { x: canvas.width - responsiveMargin, y: centerY }, // Punta derecha (toca pared)
      { x: responsiveMargin, y: responsiveMargin }, // Esquina superior izquierda
      { x: centerX, y: canvas.height - responsiveMargin }, // Punta inferior (toca suelo)
      { x: centerX, y: responsiveMargin }, // Volver al inicio
    ];

    this.createSmoothPath(points);
    console.log(
      `🔴 Estrella RESPONSIVA generada - Margen: ${responsiveMargin}px (${
        GameConfig.isMobile ? "MÓVIL" : "PC"
      })`
    );
  },

  generateHellWalls(canvas) {
    // 🔥 MÁRGENES Y DIMENSIONES RESPONSIVOS
    const responsiveMargin = GameConfig.isMobile
      ? Math.max(40, canvas.width * 0.08) // 8% en móvil
      : Math.max(25, canvas.width * 0.04); // 4% en PC

    const letterWidth = (canvas.width - responsiveMargin * 2) / 4;
    const letterHeight = canvas.height - responsiveMargin * 2;
    const startY = responsiveMargin;

    // 🔥 AJUSTAR ESPACIO ENTRE LETRAS SEGÚN PANTALLA
    const letterSpacing = GameConfig.isMobile
      ? letterWidth * 1.1
      : letterWidth * 1.2;

    const points = [];

    // H - RESPONSIVO
    const hX = responsiveMargin;
    points.push({ x: hX, y: startY });
    points.push({ x: hX, y: startY + letterHeight });
    points.push({ x: hX, y: startY + letterHeight / 2 });
    points.push({ x: hX + letterWidth, y: startY + letterHeight / 2 });
    points.push({ x: hX + letterWidth, y: startY });
    points.push({ x: hX + letterWidth, y: startY + letterHeight });

    // E - RESPONSIVO
    const eX = responsiveMargin + letterSpacing;
    points.push({ x: eX, y: startY });
    points.push({ x: eX + letterWidth, y: startY });
    points.push({ x: eX, y: startY });
    points.push({ x: eX, y: startY + letterHeight / 2 });
    points.push({ x: eX + letterWidth * 0.7, y: startY + letterHeight / 2 });
    points.push({ x: eX, y: startY + letterHeight / 2 });
    points.push({ x: eX, y: startY + letterHeight });
    points.push({ x: eX + letterWidth, y: startY + letterHeight });

    // L1 - RESPONSIVO
    const l1X = responsiveMargin + letterSpacing * 2;
    points.push({ x: l1X, y: startY });
    points.push({ x: l1X, y: startY + letterHeight });
    points.push({ x: l1X + letterWidth, y: startY + letterHeight });

    // L2 - RESPONSIVO (toca pared derecha)
    const l2X = responsiveMargin + letterSpacing * 3;
    points.push({ x: l2X, y: startY });
    points.push({ x: l2X, y: startY + letterHeight });
    points.push({
      x: canvas.width - responsiveMargin,
      y: startY + letterHeight,
    }); // Toca pared derecha

    this.createSmoothPath(points);
    console.log(
      `🔴 HELL RESPONSIVO generado - Margen: ${responsiveMargin}px, Ancho letra: ${letterWidth.toFixed(
        1
      )}px (${GameConfig.isMobile ? "MÓVIL" : "PC"})`
    );
  },

  generateZWalls(canvas) {
    // 🔥 MÁRGENES RESPONSIVOS PARA Z
    const responsiveMargin = GameConfig.isMobile
      ? Math.max(45, canvas.width * 0.09) // 9% en móvil
      : Math.max(30, canvas.width * 0.05); // 5% en PC

    const points = [
      { x: responsiveMargin, y: responsiveMargin }, // Esquina superior izquierda
      { x: canvas.width - responsiveMargin, y: responsiveMargin }, // Esquina superior derecha
      { x: responsiveMargin, y: canvas.height - responsiveMargin }, // Diagonal a inferior izquierda
      {
        x: canvas.width - responsiveMargin,
        y: canvas.height - responsiveMargin,
      }, // Esquina inferior derecha
    ];

    this.createSmoothPath(points);
    console.log(
      `🔴 Z RESPONSIVO generado - Margen: ${responsiveMargin}px (${
        GameConfig.isMobile ? "MÓVIL" : "PC"
      })`
    );
  },

  generateRandomWallPattern(canvas) {
    // 🔥 MÁRGENES RESPONSIVOS PARA PATRÓN ALEATORIO
    const responsiveMargin = GameConfig.isMobile
      ? Math.max(55, canvas.width * 0.11) // 11% en móvil
      : Math.max(35, canvas.width * 0.06); // 6% en PC

    const points = [];
    const corners = [
      { x: responsiveMargin, y: responsiveMargin },
      { x: canvas.width - responsiveMargin, y: responsiveMargin },
      {
        x: canvas.width - responsiveMargin,
        y: canvas.height - responsiveMargin,
      },
      { x: responsiveMargin, y: canvas.height - responsiveMargin },
    ];

    // Línea aleatoria que siempre toca al menos 3 esquinas
    const shuffledCorners = corners.sort(() => Math.random() - 0.5);
    points.push(shuffledCorners[0]);
    points.push(shuffledCorners[1]);
    points.push(shuffledCorners[2]);

    // 🔥 AGREGAR PUNTO MEDIO RESPONSIVO (solo en pantallas grandes)
    if (!GameConfig.isMobile && Math.random() < 0.5) {
      const midPoint = {
        x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.3,
        y: canvas.height / 2 + (Math.random() - 0.5) * canvas.height * 0.3,
      };
      points.splice(2, 0, midPoint); // Insertar en el medio
    }

    this.createSmoothPath(points);
    console.log(
      `🔴 Patrón aleatorio RESPONSIVO generado - Margen: ${responsiveMargin}px, ${
        points.length
      } puntos (${GameConfig.isMobile ? "MÓVIL" : "PC"})`
    );
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
    // 🔥 VERIFICACIONES DE SEGURIDAD
    if (!this.redLinePath || this.redLinePath.length === 0) {
      return;
    }

    if (this.redLineIndex <= 0) {
      return;
    }

    // 🔥 USAR SOLO ÍNDICES ENTEROS
    const currentIndex = Math.floor(this.redLineIndex);
    const startIndex = Math.max(0, currentIndex - this.lineConfig.trailLength);

    if (startIndex >= currentIndex || startIndex >= this.redLinePath.length) {
      return;
    }

    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    ctx.lineWidth = this.lineConfig.lineWidth * 1.5;
    ctx.shadowColor = "#FF0000";
    ctx.shadowBlur = this.lineConfig.glowBlur * 1.5;

    ctx.beginPath();
    let lineStarted = false;

    // 🔥 ITERAR SOLO SOBRE ÍNDICES ENTEROS
    for (
      let i = startIndex;
      i <= currentIndex && i < this.redLinePath.length;
      i++
    ) {
      const point = this.redLinePath[i];

      if (
        !point ||
        typeof point.x !== "number" ||
        typeof point.y !== "number"
      ) {
        console.warn(`⚠️ Punto inválido en índice ${i}:`, point);
        continue;
      }

      if (!lineStarted) {
        ctx.moveTo(point.x, point.y);
        lineStarted = true;
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }

    if (lineStarted) {
      ctx.stroke();
    }
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

    // 🔥 NUEVO: RESETEAR FLAG FORZADO
    this.redLineForceActive = false;
    console.log("🔴 redLineForceActive RESETEADO en cleanup");

    // Restaurar velocidad del jugador
    if (window.Player && Player.restoreNormalSpeed) {
      Player.restoreNormalSpeed();
    } else if (window.Player && Player.setSpeedModifier) {
      Player.setSpeedModifier(this.originalPlayerSpeed);
    }
  },

  reset() {
    this.cleanup();

    // 🔥 NUEVO: FORZAR RESET DE TODOS LOS FLAGS
    this.redLineForceActive = false;
    this.phaseActive = false;
    this.redLineMoving = false;
    this.showingPreview = false;

    console.log("🔄 Sistema de hilo rojo reseteado COMPLETAMENTE");
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
