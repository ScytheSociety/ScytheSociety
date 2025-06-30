/**
 * Hell Shooter - Game Configuration
 * Configuración central del juego balanceada - LÍMITE DE VIDAS CORREGIDO
 */

const GameConfig = {
  // ======================================================
  // CONFIGURACIÓN GENERAL
  // ======================================================

  MAX_LEVELS: 10,
  MAX_LIVES: 9, // 🔥 CORREGIDO: Era 14, ahora 9

  // Detección de dispositivo
  isMobile: false,
  isTouch: false,

  // Recursos gráficos
  backgroundImages: [],
  enemyImages: [],
  playerImage: null,
  bulletImage: null,
  bossImage: null,

  // Dimensiones dinámicas - TAMAÑOS REDUCIDOS
  // 🔥 TAMAÑOS BASE MÁS PEQUEÑOS
  PLAYER_SIZE: 80, // Sin cambios
  BULLET_WIDTH: 20, // Sin cambios
  BULLET_HEIGHT: 40, // Sin cambios
  ENEMY_MIN_SIZE: 18, // Era 20, ahora 18 (10% más pequeño)
  ENEMY_MAX_SIZE: 35, // Era 40, ahora 35 (12.5% más pequeño)

  // ======================================================
  // CONFIGURACIÓN DE NIVELES - CONFIGURACIÓN ORIGINAL BUENA
  // ======================================================

  LEVEL_CONFIG: {
    // Enemigos requeridos por nivel (configuración original)
    enemiesPerLevel: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],

    // Velocidad de spawn de enemigos (configuración original)
    spawnDelay: [
      80, // Nivel 1 - Más lento
      70, // Nivel 2
      60, // Nivel 3
      50, // Nivel 4
      45, // Nivel 5
      40, // Nivel 6
      35, // Nivel 7
      30, // Nivel 8
      25, // Nivel 9
      20, // Nivel 10
    ],
  },

  // ======================================================
  // CONFIGURACIÓN DEL JUGADOR REBALANCEADA
  // ======================================================

  PLAYER_CONFIG: {
    initialLives: 7,
    maxLives: 9,
    invulnerabilityFrames: 120,

    // Sistema de disparo rebalanceado
    shooting: {
      baseDelay: 180, // Era 200
      delayReduction: 12, // Era 15
      minDelay: 70, // Era 80
      maxBullets: 2,
      bulletSpeed: 0.016, // Ligeramente más rápido
    },

    // Poder especial SIN EXPLOSIÓN
    specialPower: {
      enemiesRequired: 20, // Era 25 (más frecuente)
      duration: 4000,
      bulletCount: 18, // Era 16
    },
  },

  // ======================================================
  // CONFIGURACIÓN DE ENEMIGOS
  // ======================================================

  ENEMY_CONFIG: {
    baseSpeed: 0.003,
    speedIncrease: 0.0002, // Por nivel

    // 🔥 MODIFICADO: Tamaño variable aleatorio
    sizeVariation: {
      enabled: true,
      minScale: 0.6, // Era 0.7, ahora 0.6 (más pequeño)
      maxScale: 1.3, // 🔥 AUMENTADO: Era 1.2, ahora 1.3 (máximo más grande)
      randomChance: 0.5, // 🔥 AUMENTADO: Era 0.3, ahora 0.5 (50% de enemigos tendrán tamaño aleatorio)

      // Factor de reducción específico para móvil
      mobileReduction: 0.7, // En móvil, todos los enemigos 30% más pequeños
    },

    // Rebotes y colisiones
    wallBounce: 0.9,
    enemyBounce: 1.1,
    maxSpeed: 0.02,
  },

  // ======================================================
  // CONFIGURACIÓN DE POWER-UPS REBALANCEADA
  // ======================================================

  POWERUP_CONFIG: {
    spawnChance: 0.002,
    heartSpawnChance: 0.006,

    types: {
      SHIELD: {
        id: 0,
        name: "Escudo Protector",
        color: "#00FF00",
        duration: 480, // Era 300 (5s), ahora 480 (8s)
        description: "Inmunidad total al daño",
      },
      WIDE_SHOT: {
        id: 1,
        name: "Disparo Amplio",
        color: "#00FFFF",
        duration: 600, // Era 360 (6s), ahora 600 (10s)
        description: "Dispara 5 balas en abanico",
      },
      EXPLOSIVE: {
        id: 2,
        name: "Balas Explosivas",
        color: "#FF8800",
        duration: 480, // Era 300 (5s), ahora 480 (8s)
        explosionRadius: 150,
        description: "Las balas explotan al impactar",
      },
      RAPID_FIRE: {
        id: 3,
        name: "Disparo Súper Rápido",
        color: "#FF00FF",
        duration: 600, // Era 360 (6s), ahora 600 (10s)
        shootDelay: 25, // 🔥 NUEVO: Valor de referencia (no usado directamente)
        speedReduction: 0.25, // 🔥 NUEVO: Reduce el tiempo de espera al 25% (4x más rápido)
        description: "Disparo ultra-rápido",
      },
    },
  },

  // ======================================================
  // CONFIGURACIÓN DEL BOSS (NIVEL 10)
  // ======================================================

  BOSS_CONFIG: {
    health: 500, // Vida del boss
    size: 120, // Tamaño
    speed: 0.002, // Velocidad base

    // Fases del boss
    phases: {
      // Fase 1: 100%-60% vida
      phase1: {
        healthThreshold: 0.6,
        moveSpeed: 0.002,
        summonInterval: 300, // Frames entre invocaciones
        summonCount: 2, // Enemigos por invocación
        immunityDuration: 180, // 3 segundos inmune
      },

      // Fase 2: 60%-30% vida
      phase2: {
        healthThreshold: 0.3,
        moveSpeed: 0.004, // Más rápido
        summonInterval: 200, // Más frecuente
        summonCount: 3,
        immunityDuration: 150,
        teleportChance: 0.02, // Puede teletransportarse
      },

      // Fase 3: 30%-10% vida
      phase3: {
        healthThreshold: 0.1,
        moveSpeed: 0.006, // Muy rápido
        summonInterval: 150,
        summonCount: 4,
        immunityDuration: 120,
        teleportChance: 0.04,
        teleportFrequency: 120, // Teletransporte cada 2 segundos
      },

      // Fase Final: 10%-0% vida
      finalPhase: {
        healthThreshold: 0,
        moveSpeed: 0.008, // Súper rápido
        mineSpawning: true, // 🔥 LANZA MINAS
        mineInterval: 60, // Cada segundo
        mineExplosionDelay: 180, // 3 segundos para explotar
        mineDamageRadius: 100,
      },
    },
  },

  // REEMPLAZAR BOSS_PHASE_CONFIG
  BOSS_PHASE_CONFIG: {
    // Tiempos en frames (60fps) - SECUENCIA CORREGIDA
    INTRO_DURATION: 600, // 10 segundos - Boss inmune en centro
    SUMMONING_DURATION: 3600, // 60 segundos - Invocación (75% vida)
    MINES_DURATION: 5400, // 90 segundos - Minas (50% vida)
    BULLETS_DURATION: 7200, // 120 segundos - Touhou (25% vida)
    REDLINE_COUNT: 10, // 10 hilos rojos (10% vida)
    REDLINE_PAUSE: 180, // 3 segundos entre hilos
    YANKENPO_WINS: 3, // 3 victorias para matar boss (3% vida)

    // 🔥 UMBRALES CORREGIDOS
    HEALTH_THRESHOLDS: {
      SUMMONING: 0.75, // 75% vida
      MINES: 0.5, // 50% vida
      BULLETS: 0.25, // 25% vida
      REDLINE: 0.1, // 10% vida
      YANKENPO: 0.03, // 3% vida - INMUNE HASTA MORIR
    },

    // 🔥 FASES ALEATORIAS REDUCIDAS (cuando pierdes Yan Ken Po)
    RANDOM_PHASE_DURATIONS: {
      SUMMONING: 1800, // 30s (en lugar de 60s)
      MINES: 2700, // 45s (en lugar de 90s)
      BULLETS: 3600, // 60s (en lugar de 120s)
      REDLINE: 5, // 5 rondas (en lugar de 10)
    },

    // 🔥 LÍMITES DE FASES ALEATORIAS
    RANDOM_PHASE_LIMITS: {
      maxExecutions: 3, // Máximo 3 veces cada fase
      cooldownBetweenPhases: 2000, // 2s entre fase y Yan Ken Po
      yankenpoRetryDelay: 3000, // 3s antes de nuevo Yan Ken Po
    },

    // Mensajes
    TRANSITION_MESSAGES: {
      VULNERABLE: "⚔️ ¡Boss vulnerable!",
      IMMUNE: "🛡️ Boss inmune durante fase",
      PHASE_END: "✅ Fase completada",
      HUNTING: "👹 ¡A la caza!",
      YANKENPO_FINAL: "💀 Solo Yan Ken Po puede matarlo",
      RANDOM_PHASE: "🎲 Fase aleatoria activada",
    },

    // Dentro de BOSS_PHASE_CONFIG, agregar:
    getDurationInMs(phase) {
      const durations = {
        SUMMONING: this.SUMMONING_DURATION,
        MINES: this.MINES_DURATION,
        BULLETS: this.BULLETS_DURATION,
        INTRO: this.INTRO_DURATION,
      };

      const frames = durations[phase] || 0;
      return (frames * 1000) / 60; // Convertir frames a milisegundos
    },
  },

  // DENTRO DE BOSS_PHASE_CONFIG, REEMPLAZAR:
  REDLINE_COUNT: 10, // 10 hilos rojos
  REDLINE_PAUSE: 180, // 3 segundos entre hilos

  // CON ESTO:
  REDLINE_CONFIG: {
    totalRounds: 10,
    pauseBetweenRounds: 180, // 3 segundos
    playerSlowFactor: 0.05, // Jugador súper lento
    bossSpeed: 4, // Velocidad del boss en la línea
    wallBounceReduction: 0.95, // Reducir velocidad en rebotes (opcional)

    // Configuración de patrones
    patterns: {
      fullScreen: true, // Usar toda la pantalla
      forceWallBounce: true, // Forzar rebotes en paredes
      minWallDistance: 50, // Distancia mínima a paredes
      pathComplexity: "extreme", // Complejidad de rutas
    },
  },

  // Agregar después de BOSS_CONFIG:
  COMBO_CONFIG: {
    timeLimit: 2000, // 2 segundos para mantener combo
    thresholds: [
      { combo: 0, multiplier: 1.0, text: "", color: "#FFFFFF" },
      { combo: 5, multiplier: 1.2, text: "COMBO x5!", color: "#FFFF00" },
      { combo: 10, multiplier: 1.5, text: "COMBO x10! 🔥", color: "#FF8800" },
      { combo: 15, multiplier: 1.8, text: "COMBO x15! ⚡", color: "#FF4400" },
      { combo: 20, multiplier: 2.0, text: "COMBO x20! 💥", color: "#FF0000" },
      { combo: 30, multiplier: 2.5, text: "MEGA COMBO! 🌟", color: "#FF00FF" },
      { combo: 40, multiplier: 3.0, text: "ULTRA COMBO! 🚀", color: "#00FFFF" },
      { combo: 50, multiplier: 4.0, text: "LEGENDARY! 👑", color: "#FFD700" },
    ],
  },

  YANKENPO_CONFIG: {
    roundsToWin: 3,
    selectionTimeLimit: 180, // 3 segundos
    countdownDuration: 3,
    resultDisplayTime: 2000,
  },

  // ======================================================
  // EFECTOS VISUALES Y SONIDO
  // ======================================================

  EFFECTS_CONFIG: {
    particleCount: 30,
    explosionRadius: 120, // Radio de efectos de explosión

    // Colores del juego
    colors: {
      player: "#FF0000",
      bullets: "#FFFFFF",
      enemies: "#8B0000",
      explosions: "#FF8800",
      hearts: "#FF0000",
      powerUps: "#FFD700",
    },
  },

  // ======================================================
  // MÉTODOS UTILITARIOS
  // ======================================================

  /**
   * Detecta el tipo de dispositivo
   */
  detectDevice() {
    this.isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    this.isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Detectar también tablets como móviles para el sistema de pausa
    const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(
      navigator.userAgent
    );
    if (isTablet) {
      this.isMobile = true;
    }

    console.log(
      `📱 Dispositivo: ${this.isMobile ? "Móvil/Tablet" : "Desktop"}, Touch: ${
        this.isTouch
      }`
    );
  },

  /**
   * Actualiza los tamaños según el canvas
   */
  updateSizes(canvas) {
    const baseSize = Math.min(canvas.width, canvas.height) / 20;

    // 🔥 FACTOR DE ESCALA MÁS DIFERENCIADO
    const mobileScale = this.isMobile ? 0.65 : 1.1; // 🔥 Era 0.65/1.0, ahora 0.65/1.1 (PC 10% más grande)

    // 🔥 TAMAÑOS RESPONSIVOS MÁS CONTROLADOS
    this.PLAYER_SIZE = Math.max(
      35, // Mínimo más pequeño (era 40)
      Math.min(baseSize * mobileScale, this.isMobile ? 50 : 85) // 🔥 Máximo PC aumentado a 85 (era 80)
    );

    this.BULLET_WIDTH = Math.max(10, this.PLAYER_SIZE * 0.25);
    this.BULLET_HEIGHT = this.BULLET_WIDTH * 2;

    // 🔥 ENEMIGOS EN PC MÁS GRANDES
    this.ENEMY_MIN_SIZE = Math.max(
      this.isMobile ? 15 : 20, // 🔥 Mínimo en PC aumentado a 20 (era 15)
      Math.min(baseSize * 0.5 * mobileScale, this.isMobile ? 25 : 50) // 🔥 Máximo PC aumentado a 50 (era 45)
    );

    this.ENEMY_MAX_SIZE = Math.max(
      this.isMobile ? 25 : 35, // 🔥 Mínimo en PC aumentado a 35 (era 25)
      Math.min(baseSize * 0.8 * mobileScale, this.isMobile ? 40 : 75) // 🔥 Máximo PC aumentado a 75 (era 70)
    );

    console.log(
      `📐 Tamaños SÚPER responsivos - Jugador: ${this.PLAYER_SIZE}px, ` +
        `Enemigos: ${this.ENEMY_MIN_SIZE}-${this.ENEMY_MAX_SIZE}px, ` +
        `Escala: ${mobileScale} (${this.isMobile ? "MÓVIL" : "PC"})`
    );
  },

  // 🔥 NUEVA FUNCIÓN: Obtener tamaño de enemigo con reducción móvil aplicada
  getResponsiveEnemySize(baseSize, level = 1) {
    let finalSize = baseSize;

    // Aplicar variación de tamaño si está habilitada
    if (this.ENEMY_CONFIG.sizeVariation.enabled) {
      if (Math.random() < this.ENEMY_CONFIG.sizeVariation.randomChance) {
        const scale =
          this.ENEMY_CONFIG.sizeVariation.minScale +
          Math.random() *
            (this.ENEMY_CONFIG.sizeVariation.maxScale -
              this.ENEMY_CONFIG.sizeVariation.minScale);
        finalSize *= scale;
      }
    }

    // 🔥 MODIFICADO: Reducción móvil vs aumento PC
    if (this.isMobile) {
      // En móvil, reducción como antes
      finalSize *= this.ENEMY_CONFIG.sizeVariation.mobileReduction;
    } else {
      // 🔥 NUEVO: En PC, aumentar un 20% para enemigos más grandes
      finalSize *= 1.2; // 20% más grandes en PC
    }

    // Aplicar crecimiento por nivel (más controlado)
    const levelGrowth = 1 + (level - 1) * 0.05; // 5% por nivel
    finalSize *= levelGrowth;

    // 🔥 MODIFICADO: Límites más grandes para PC
    if (this.isMobile) {
      finalSize = Math.max(15, Math.min(finalSize, 35)); // Entre 15-35px en móvil
    } else {
      finalSize = Math.max(25, Math.min(finalSize, 70)); // 🔥 Entre 25-70px en PC (antes 20-60px)
    }

    return Math.round(finalSize);
  },

  /**
   * Obtiene la configuración de un nivel específico
   */
  getLevelConfig(level) {
    const levelIndex = Math.min(
      level - 1,
      this.LEVEL_CONFIG.enemiesPerLevel.length - 1
    );

    return {
      enemiesRequired: this.LEVEL_CONFIG.enemiesPerLevel[levelIndex],
      spawnDelay: this.LEVEL_CONFIG.spawnDelay[levelIndex],
      enemySpeed:
        this.ENEMY_CONFIG.baseSpeed + level * this.ENEMY_CONFIG.speedIncrease,
      shootDelay: Math.max(
        this.PLAYER_CONFIG.shooting.minDelay,
        this.PLAYER_CONFIG.shooting.baseDelay -
          level * this.PLAYER_CONFIG.shooting.delayReduction
      ),
    };
  },

  /**
   * Obtiene configuración de power-up por tipo
   */
  getPowerUpConfig(type) {
    return this.POWERUP_CONFIG.types[type] || null;
  },

  /**
   * Calcula el tamaño aleatorio de un enemigo
   */
  getRandomEnemySize(baseSize) {
    if (!this.ENEMY_CONFIG.sizeVariation.enabled) {
      return baseSize;
    }

    if (Math.random() < this.ENEMY_CONFIG.sizeVariation.randomChance) {
      const scale =
        this.ENEMY_CONFIG.sizeVariation.minScale +
        Math.random() *
          (this.ENEMY_CONFIG.sizeVariation.maxScale -
            this.ENEMY_CONFIG.sizeVariation.minScale);
      return baseSize * scale;
    }

    return baseSize;
  },

  /**
   * Valida si un nivel es válido
   */
  isValidLevel(level) {
    return level >= 1 && level <= this.MAX_LEVELS;
  },
};

// Hacer disponible globalmente
window.GameConfig = GameConfig;

console.log(
  "⚙️ config.js cargado - Configuración del juego lista con límite de 9 vidas"
);
