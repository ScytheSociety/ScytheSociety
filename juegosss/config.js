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

  // Dimensiones dinámicas
  PLAYER_SIZE: 80,
  BULLET_WIDTH: 20,
  BULLET_HEIGHT: 40,
  ENEMY_MIN_SIZE: 30,
  ENEMY_MAX_SIZE: 60,

  // ======================================================
  // CONFIGURACIÓN DE NIVELES - 10 NIVELES BALANCEADOS
  // ======================================================

  LEVEL_CONFIG: {
    // Enemigos requeridos por nivel (más progresivo)
    enemiesPerLevel: [60, 100, 160, 240, 340, 460, 600, 760, 940, 1200],

    // Velocidad de spawn de enemigos
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
  // CONFIGURACIÓN DEL JUGADOR
  // ======================================================

  PLAYER_CONFIG: {
    initialLives: 7,
    maxLives: 9, // 🔥 CORREGIDO: Era 14, ahora 9
    invulnerabilityFrames: 120, // 2 segundos a 60fps

    // Sistema de disparo mejorado
    shooting: {
      baseDelay: 200, // Milisegundos entre disparos
      delayReduction: 15, // Reducción por nivel
      minDelay: 80, // Mínimo delay
      maxBullets: 2, // 🔥 MÁXIMO 2 BALAS NORMALES
      bulletSpeed: 0.015, // Velocidad base de balas
    },

    // Poder especial
    specialPower: {
      enemiesRequired: 25, // Enemigos para cargar
      duration: 4000, // 4 segundos
      bulletCount: 16, // Balas en círculo
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
  // CONFIGURACIÓN DE POWER-UPS MEJORADA
  // ======================================================

  POWERUP_CONFIG: {
    spawnChance: 0.008, // Probabilidad por frame
    heartSpawnChance: 0.01, // Corazones más frecuentes

    // Tipos de power-ups
    types: {
      SHIELD: {
        id: 0, // Mantener el mismo ID para no romper el sistema
        name: "Escudo Protector",
        color: "#00FF00",
        duration: 4000, // 4 segundos
        description: "Inmunidad total al daño",
      },
      WIDE_SHOT: {
        id: 1,
        name: "Disparo Amplio",
        color: "#00FFFF",
        duration: 6000, // 6 segundos
        description: "Dispara 7 balas en abanico", // 🔥 Aumentado de 3 a 7
      },
      EXPLOSIVE: {
        id: 2,
        name: "Balas Explosivas",
        color: "#FF8800",
        duration: 7000, // 7 segundos
        explosionRadius: 120, // 🔥 RADIO MÁS AMPLIO
        description: "Las balas explotan al impactar",
      },
      RAPID_FIRE: {
        id: 3,
        name: "Disparo Súper Rápido",
        color: "#FF00FF",
        duration: 5000, // 5 segundos
        shootDelay: 30, // Muy rápido
        bulletSizeMultiplier: 1.5, // 🔥 BALAS MÁS GRANDES
        description: "Disparo ultra-rápido con balas grandes",
      },
      SHIELD: {
        id: 4,
        name: "Escudo Protector",
        color: "#00FF00",
        duration: 6000, // 6 segundos
        description: "Inmunidad total al daño", // 🔥 INMUNIDAD TOTAL
      },
    },
  },

  // ======================================================
  // CONFIGURACIÓN DEL BOSS (NIVEL 10)
  // ======================================================

  BOSS_CONFIG: {
    health: 50, // Vida del boss
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

    console.log(
      `📱 Dispositivo: ${this.isMobile ? "Móvil" : "Desktop"}, Touch: ${
        this.isTouch
      }`
    );
  },

  /**
   * Actualiza los tamaños según el canvas
   */
  updateSizes(canvas) {
    const baseSize = Math.min(canvas.width, canvas.height) / 20;

    this.PLAYER_SIZE = Math.max(40, Math.min(baseSize, 80));
    this.BULLET_WIDTH = this.PLAYER_SIZE * 0.25;
    this.BULLET_HEIGHT = this.BULLET_WIDTH * 2;
    this.ENEMY_MIN_SIZE = Math.max(25, Math.min(baseSize * 0.8, 50));
    this.ENEMY_MAX_SIZE = Math.max(40, Math.min(baseSize * 1.2, 80));

    console.log(`📐 Tamaños actualizados - Jugador: ${this.PLAYER_SIZE}px`);
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
