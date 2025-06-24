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
  PLAYER_SIZE: 80, // Sin cambios
  BULLET_WIDTH: 20, // Sin cambios
  BULLET_HEIGHT: 40, // Sin cambios
  ENEMY_MIN_SIZE: 20, // Era 30, ahora 20 (33% más pequeño)
  ENEMY_MAX_SIZE: 40, // Era 60, ahora 40 (33% más pequeño)

  // ======================================================
  // CONFIGURACIÓN DE NIVELES - CONFIGURACIÓN ORIGINAL BUENA
  // ======================================================

  LEVEL_CONFIG: {
    // Enemigos requeridos por nivel (configuración original)
    enemiesPerLevel: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55],

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

    // Tamaño variable aleatorio 🔥 NUEVO
    sizeVariation: {
      enabled: true,
      minScale: 0.7, // 70% del tamaño base
      maxScale: 1.4, // 140% del tamaño base
      randomChance: 0.3, // 30% de enemigos tendrán tamaño aleatorio
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
        shootDelay: 25,
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

  // 🔥 NUEVO: Configuración específica de fases del boss
  BOSS_PHASE_CONFIG: {
    // Tiempos en frames (60fps)
    INTRO_DURATION: 600, // 10 segundos - Boss inmune en centro
    SUMMONING_DURATION: 1800, // 30 segundos - Invocación
    MINES_DURATION: 2700, // 45 segundos - Minas
    BULLETS_DURATION: 3600, // 60 segundos - Touhou
    REDLINE_COUNT: 10, // 10 hilos rojos
    REDLINE_PAUSE: 180, // 3 segundos entre hilos
    YANKENPO_WINS: 3, // 3 victorias para matar boss

    // Umbrales de vida para activar fases
    HEALTH_THRESHOLDS: {
      SUMMONING: 0.75, // 75%
      MINES: 0.5, // 50%
      BULLETS: 0.3, // 30%
      REDLINE: 0.15, // 15%
      YANKENPO: 0.03, // 3%
    },

    // Mensajes de pausa entre fases
    TRANSITION_MESSAGES: {
      VULNERABLE: "⚔️ ¡Boss vulnerable!",
      IMMUNE: "🛡️ Boss inmune durante fase",
      PHASE_END: "✅ Fase completada",
      HUNTING: "👹 ¡A la caza!",
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
    const mobileScale = this.isMobile ? 0.8 : 1.0;

    // 🔥 TAMAÑOS RESPONSIVOS
    this.PLAYER_SIZE = Math.max(
      40,
      Math.min(baseSize * mobileScale, this.isMobile ? 60 : 80)
    );
    this.BULLET_WIDTH = Math.max(12, this.PLAYER_SIZE * 0.25);
    this.BULLET_HEIGHT = this.BULLET_WIDTH * 2;

    // Enemigos responsivos
    this.ENEMY_MIN_SIZE = Math.max(
      20,
      Math.min(baseSize * 0.6 * mobileScale, this.isMobile ? 35 : 50)
    );
    this.ENEMY_MAX_SIZE = Math.max(
      35,
      Math.min(baseSize * 1.0 * mobileScale, this.isMobile ? 55 : 80)
    );

    console.log(
      `📐 Tamaños responsivos - Jugador: ${this.PLAYER_SIZE}px, Escala móvil: ${mobileScale}`
    );
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
