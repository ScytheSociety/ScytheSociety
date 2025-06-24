/**
 * Hell Shooter - Bullet Management ÉPICO
 * Sistema de balas con MÁXIMO 3 BALAS y más acción
 */

const BulletManager = {
  // ======================================================
  // ARRAYS DE BALAS
  // ======================================================

  bullets: [],
  specialBullets: [],

  // ======================================================
  // SISTEMA DE DISPARO AUTOMÁTICO
  // ======================================================

  autoShootInterval: null,
  lastShootTime: 0,

  // Sistema de poder especial
  enemiesForSpecialPower: 0,
  specialPowerReady: false,
  specialPowerActive: false,
  ENEMIES_FOR_SPECIAL: GameConfig.PLAYER_CONFIG.specialPower.enemiesRequired,

  // ======================================================
  // INICIALIZACIÓN Y CONTROL
  // ======================================================

  /**
   * 🔥 NUEVO: Verifica si el auto-disparo está funcionando correctamente
   */
  isAutoShootActive() {
    return this.autoShootInterval !== null;
  },

  /**
   * 🔥 NUEVO: Fuerza el reinicio del auto-disparo con verificación
   */
  forceRestartAutoShoot() {
    console.log("🔫 FORZANDO reinicio completo del auto-disparo");

    // Detener cualquier intervalo existente
    this.stopAutoShoot();

    // Esperar un frame y luego reiniciar
    setTimeout(() => {
      if (!window.isGameEnded() && window.isCurrentlyPlaying()) {
        this.startAutoShoot();

        // Verificar que funcionó
        setTimeout(() => {
          if (!this.autoShootInterval) {
            console.error("🚨 ERROR: Auto-disparo falló al reiniciar");
            // Intentar una vez más
            this.startAutoShoot();
          } else {
            console.log("✅ Auto-disparo reiniciado exitosamente");
          }
        }, 500);
      }
    }, 100);
  },

  /**
   * Inicia el disparo automático - VERSION MEJORADA CON VERIFICACIÓN
   */
  startAutoShoot() {
    // SIEMPRE detener primero para evitar múltiples intervalos
    this.stopAutoShoot();

    // Verificar que estamos en condiciones de disparar
    if (window.isGameEnded && window.isGameEnded()) {
      console.log("🔫 No iniciar auto-disparo: juego terminado");
      return;
    }

    if (!window.isCurrentlyPlaying || !window.isCurrentlyPlaying()) {
      console.log("🔫 No iniciar auto-disparo: no estamos jugando");
      return;
    }

    const level = window.getLevel();

    // 🔥 MÁS RÁPIDO: Disparo base más veloz
    const baseDelay = 150; // Era 200ms, ahora 150ms
    const reductionPerLevel = 12; // Era 15ms, ahora 12ms
    const minDelay = 60; // Era 80ms, ahora 60ms
    const shootDelay = Math.max(
      minDelay,
      baseDelay - level * reductionPerLevel
    );

    this.autoShootInterval = setInterval(() => {
      // Verificación adicional antes de cada disparo
      if (!window.isGameEnded() && window.isCurrentlyPlaying()) {
        this.shootBullet();
      } else {
        console.log("🔫 Deteniendo auto-disparo: condiciones no válidas");
        this.stopAutoShoot();
      }
    }, shootDelay);

    console.log(
      `🔫 Auto-disparo ÉPICO iniciado: ${shootDelay}ms (Intervalo: ${this.autoShootInterval})`
    );
  },

  /**
   * Detiene el disparo automático - VERSION MEJORADA
   */
  stopAutoShoot() {
    if (this.autoShootInterval) {
      clearInterval(this.autoShootInterval);
      this.autoShootInterval = null;
      console.log("🔫 Auto-disparo detenido correctamente");
    }
  },

  /**
   * 🔥 NUEVO: Función de diagnóstico
   */
  getAutoShootStatus() {
    return {
      active: this.autoShootInterval !== null,
      intervalId: this.autoShootInterval,
      gameEnded: window.isGameEnded ? window.isGameEnded() : "unknown",
      currentlyPlaying: window.isCurrentlyPlaying
        ? window.isCurrentlyPlaying()
        : "unknown",
      level: window.getLevel ? window.getLevel() : "unknown",
    };
  },

  // ======================================================
  // CREACIÓN DE BALAS - MÁXIMO 3 BALAS
  // ======================================================

  shootBullet() {
    const currentTime = Date.now();
    const level = window.getLevel();
    const canvas = window.getCanvas();

    // Cooldown del disparo normal
    let cooldownTime = Math.max(60, 150 - level * 10);

    // 🔥 OBTENER POWER-UPS ACTIVOS (sistema acumulable)
    const activePowerUps = Player.getActivePowerUps();

    // 🔥 RAPID FIRE GARANTIZADO MÁS RÁPIDO - DINÁMICO
    const hasRapidFire = activePowerUps.some((p) => p.id === 3);
    if (hasRapidFire) {
      // 🔥 NUEVO: Siempre 60% más rápido que el disparo normal actual
      cooldownTime = Math.floor(cooldownTime * 0.4); // 60% más rápido
      cooldownTime = Math.max(15, cooldownTime); // Mínimo absoluto 15ms
    }

    if (currentTime - this.lastShootTime > cooldownTime) {
      // 🔥 Velocidad de bala más rápida
      const bulletSpeed = canvas.height * (0.018 + level * 0.003);

      // 🔥 DISPARO DUAL DESDE NIVEL 5
      let bulletCount = 1;
      if (level >= 5) {
        bulletCount = 2; // Siempre 2 balas desde nivel 5
      }

      // Configurar efectos de power-ups
      let bulletConfig = {
        penetrating: false,
        explosive: false,
        penetrationCount: 0,
        shouldBounce: false,
        lifeTime: 0,
      };

      // 🔥 SISTEMA ACUMULABLE - aplicar todos los efectos
      for (const powerUp of activePowerUps) {
        switch (powerUp.id) {
          case 0: // Escudo (ya no hay balas penetrantes)
            break;

          case 1: // Disparo Amplio Escalable
            bulletCount = Math.max(bulletCount, 5 + level);
            break;

          case 2: // Explosivo
            bulletConfig.explosive = true;
            break;

          // case 3 (Rapid Fire) ya se maneja arriba
        }
      }

      // Crear balas
      const playerPos = Player.getPosition();
      const playerSize = Player.getSize();

      // 🔥 POSICIONAMIENTO DUAL MEJORADO
      if (bulletCount === 2 && level >= 5) {
        const spacing = playerSize.width * 0.3;

        for (let i = 0; i < 2; i++) {
          const offsetX = i === 0 ? -spacing : spacing;

          const bullet = {
            x:
              playerPos.x +
              playerSize.width / 2 +
              offsetX -
              GameConfig.BULLET_WIDTH / 2,
            y: playerPos.y - GameConfig.BULLET_HEIGHT,
            width: GameConfig.BULLET_WIDTH,
            height: GameConfig.BULLET_HEIGHT,
            velocityX: 0,
            velocityY: -bulletSpeed,
            ...bulletConfig,
            fromSpecialPower: false,
            level: level,
          };

          this.bullets.push(bullet);
        }
      } else {
        // Sistema original para otros casos
        const spreadAngle = bulletCount > 2 ? Math.PI / 4 : Math.PI / 12;

        for (let i = 0; i < bulletCount; i++) {
          const offset = i - Math.floor(bulletCount / 2);
          const angle = offset * spreadAngle;

          const bullet = {
            x: playerPos.x + playerSize.width / 2 - GameConfig.BULLET_WIDTH / 2,
            y: playerPos.y - GameConfig.BULLET_HEIGHT,
            width: GameConfig.BULLET_WIDTH,
            height: GameConfig.BULLET_HEIGHT,
            velocityX: Math.sin(angle) * bulletSpeed,
            velocityY: -Math.cos(angle) * bulletSpeed,
            ...bulletConfig,
            fromSpecialPower: false,
            level: level,
          };

          this.bullets.push(bullet);
        }
      }

      this.lastShootTime = currentTime;

      if (!window.isGameEnded()) {
        AudioManager.playSound("shoot");
      }
    }
  },

  /**
   * Activa el poder especial - SIN EXPLOSIÓN
   */
  activateSpecialPower() {
    if (!this.specialPowerReady || this.specialPowerActive) return;

    this.specialPowerActive = true;
    this.specialPowerReady = false;
    this.enemiesForSpecialPower = 0;

    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();
    const canvas = window.getCanvas();

    const bulletCount = GameConfig.PLAYER_CONFIG.specialPower.bulletCount;
    const bulletSpeed = canvas.height * 0.014; // Mantener o mover a config

    // Crear balas en círculo - SIN PROPIEDAD EXPLOSIVA
    for (let i = 0; i < bulletCount; i++) {
      const angle = (i / bulletCount) * Math.PI * 2;

      const specialBullet = {
        x: playerPos.x + playerSize.width / 2 - GameConfig.BULLET_WIDTH / 2,
        y: playerPos.y + playerSize.height / 2 - GameConfig.BULLET_HEIGHT / 2,
        width: GameConfig.BULLET_WIDTH,
        height: GameConfig.BULLET_HEIGHT,
        velocityX: Math.cos(angle) * bulletSpeed,
        velocityY: Math.sin(angle) * bulletSpeed,

        // 🔥 SIN EXPLOSIÓN - solo balas penetrantes
        penetrating: true,
        penetrationCount: 3, // Atraviesa 3 enemigos
        fromSpecialPower: true,
        life: 300, // 5 segundos

        level: window.getLevel(),
      };

      this.specialBullets.push(specialBullet);
    }

    // Efectos
    UI.createParticleEffect(
      playerPos.x + playerSize.width / 2,
      playerPos.y + playerSize.height / 2,
      "#FF0000",
      60
    );

    AudioManager.playSound("special");
    UI.showScreenMessage("🔥 PODER PENETRANTE 🔥", "#FF0000");

    setTimeout(() => {
      this.specialPowerActive = false;
    }, 4000);

    console.log("🔥 Poder especial penetrante activado");
  },

  // ======================================================
  // ACTUALIZACIÓN Y MOVIMIENTO
  // ======================================================

  /**
   * Actualiza todas las balas
   */
  update() {
    this.updateRegularBullets();
    this.updateSpecialBullets();
    this.cleanupBullets();
  },

  /**
   * Actualiza balas normales
   */
  updateRegularBullets() {
    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];

      // Movimiento más fluido
      bullet.x += bullet.velocityX;
      bullet.y += bullet.velocityY;
    }
  },

  /**
   * Actualiza balas especiales
   */
  updateSpecialBullets() {
    for (let i = 0; i < this.specialBullets.length; i++) {
      const bullet = this.specialBullets[i];

      // Reducir vida
      bullet.life--;

      // Mover bala
      bullet.x += bullet.velocityX;
      bullet.y += bullet.velocityY;
    }
  },

  /**
   * Limpia balas fuera de pantalla
   */
  cleanupBullets() {
    const canvas = window.getCanvas();

    // Limpiar balas normales
    this.bullets = this.bullets.filter(
      (bullet) =>
        bullet.x + bullet.width > 0 &&
        bullet.x < canvas.width &&
        bullet.y + bullet.height > 0 &&
        bullet.y < canvas.height
    );

    // Limpiar balas especiales
    this.specialBullets = this.specialBullets.filter(
      (bullet) =>
        bullet.life > 0 &&
        bullet.x + bullet.width > 0 &&
        bullet.x < canvas.width &&
        bullet.y + bullet.height > 0 &&
        bullet.y < canvas.height
    );
  },

  // ======================================================
  // SISTEMA DE COLISIONES
  // ======================================================

  /**
   * Verifica colisiones con enemigos
   */
  checkEnemyCollisions(enemies) {
    let totalKilled = 0;

    // Verificar balas normales
    totalKilled += this.checkBulletCollisions(this.bullets, enemies, false);

    // Verificar balas especiales
    totalKilled += this.checkBulletCollisions(
      this.specialBullets,
      enemies,
      true
    );

    return totalKilled;
  },

  /**
   * 🔥 CORREGIDO: Verificar colisiones de un array de balas - NO resetear contador en boss level
   */
  checkBulletCollisions(bulletArray, enemies, isSpecial) {
    let enemiesKilled = 0;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      let enemyHit = false;
      let explosionSource = null;

      // Verificar cada bala
      for (let j = bulletArray.length - 1; j >= 0; j--) {
        const bullet = bulletArray[j];

        if (this.checkCollision(bullet, enemy)) {
          enemyHit = true;

          // Configurar explosión si es bala explosiva
          if (bullet.explosive) {
            explosionSource = {
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
            };
          }

          // Manejar penetración
          if (bullet.penetrating && bullet.penetrationCount > 0) {
            bullet.penetrationCount--;
            if (bullet.penetrationCount <= 0) {
              bulletArray.splice(j, 1);
            }
          } else {
            bulletArray.splice(j, 1);
          }

          break;
        }
      }

      // Procesar impacto en enemigo
      if (enemyHit) {
        enemies.splice(i, 1);
        enemiesKilled++;

        // Solo contar para poder especial si no es bala especial
        if (!isSpecial) {
          this.enemiesForSpecialPower++;
          this.checkSpecialPowerReady();
        }

        // 🔥 INCREMENTAR COMBO en el sistema de combos
        if (window.ComboSystem) {
          window.ComboSystem.addKill();
        }

        // 🔥 SIEMPRE incrementar contador total global
        if (window.incrementTotalEnemiesKilled) {
          window.incrementTotalEnemiesKilled();
        }

        // Contador para pasar de nivel: solo enemigos del nivel actual
        if (!enemy.isBossMinion) {
          // Verificar si el enemigo pertenece al nivel actual
          const enemyLevel = enemy.level || window.getLevel(); // Fallback al nivel actual

          if (enemyLevel === window.getLevel()) {
            EnemyManager.enemiesKilled++;
            console.log(
              `🎯 Enemigo del nivel ${enemyLevel} eliminado. Para pasar nivel: ${EnemyManager.enemiesKilled}/${EnemyManager.enemiesRequired}`
            );
          } else {
            console.log(
              `🎯 Enemigo de nivel anterior (${enemyLevel}) eliminado (NO cuenta para pasar nivel, SÍ para total)`
            );
          }
        } else {
          console.log(
            `👹 Esbirro del boss eliminado (NO cuenta para pasar nivel, SÍ para total)`
          );
        }

        // Calcular puntos con combo
        const basePoints = 10 * window.getLevel();
        const comboMultiplier = window.ComboSystem
          ? window.ComboSystem.getMultiplier()
          : 1;
        const finalPoints = Math.floor(basePoints * comboMultiplier);

        window.setScore(window.getScore() + finalPoints);

        AudioManager.playSound("hit");

        // Manejar explosión
        if (explosionSource) {
          this.createExplosion(explosionSource, enemies);
        }
      }
    }

    return enemiesKilled;
  },

  /**
   * Verifica si el poder especial está listo
   */
  checkSpecialPowerReady() {
    if (this.enemiesForSpecialPower >= this.ENEMIES_FOR_SPECIAL) {
      this.specialPowerReady = true;
      this.enemiesForSpecialPower = this.ENEMIES_FOR_SPECIAL;

      UI.showScreenMessage("🔥 PODER LISTO", "#FF0000");
      console.log("🔥 Poder especial cargado");
    }
  },

  /**
   * 🔥 CORREGIDO: Crear explosión épica - NO incrementar contador para esbirros
   */
  createExplosion(center, enemies) {
    const explosionRadius = 200; // 🔥 AUMENTADO: Era 140, ahora 200 (43% más grande)

    // Crear efecto visual más épico
    UI.createExplosionEffect(center.x, center.y);

    // Dañar enemigos en el radio
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      const enemyCenter = {
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
      };

      const distance = Math.sqrt(
        Math.pow(enemyCenter.x - center.x, 2) +
          Math.pow(enemyCenter.y - center.y, 2)
      );

      if (distance < explosionRadius) {
        enemies.splice(i, 1);

        // 🔥 SIEMPRE incrementar contador total global
        if (window.incrementTotalEnemiesKilled) {
          window.incrementTotalEnemiesKilled();
        }

        // Contador para pasar de nivel: solo enemigos del nivel actual
        if (!enemy.isBossMinion) {
          // Verificar si el enemigo pertenece al nivel actual
          const enemyLevel = enemy.level || window.getLevel(); // Fallback al nivel actual

          if (enemyLevel === window.getLevel()) {
            EnemyManager.enemiesKilled++;
            console.log(
              `💥 Enemigo del nivel ${enemyLevel} eliminado por explosión ÉPICA. Para pasar nivel: ${EnemyManager.enemiesKilled}/${EnemyManager.enemiesRequired}`
            );
          } else {
            console.log(
              `💥 Enemigo de nivel anterior (${enemyLevel}) eliminado por explosión ÉPICA (NO cuenta para pasar nivel, SÍ para total)`
            );
          }
        } else {
          console.log(
            `💥 Esbirro del boss eliminado por explosión ÉPICA (NO cuenta para pasar nivel, SÍ para total)`
          );
        }

        // 🔥 INCREMENTAR COMBO
        if (window.ComboSystem) {
          window.ComboSystem.addKill();
        }

        // Puntos por explosión con combo
        const basePoints = 5 * window.getLevel();
        const comboMultiplier = window.ComboSystem
          ? window.ComboSystem.getMultiplier()
          : 1;
        const explosionPoints = Math.floor(basePoints * comboMultiplier);

        window.setScore(window.getScore() + explosionPoints);
      }
    }
  },

  /**
   * Verifica colisión entre dos objetos
   */
  checkCollision(obj1, obj2) {
    // ⬅️ AGREGAR VALIDACIÓN PARA EVITAR ERROR
    if (
      !obj1 ||
      !obj2 ||
      typeof obj1.x === "undefined" ||
      typeof obj2.x === "undefined"
    ) {
      return false;
    }

    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  },

  // ======================================================
  // RENDERIZADO
  // ======================================================

  /**
   * Dibuja todas las balas
   */
  draw(ctx) {
    // Dibujar balas normales
    this.drawBulletArray(ctx, this.bullets, false);

    // Dibujar balas especiales
    this.drawBulletArray(ctx, this.specialBullets, true);
  },

  /**
   * Dibuja un array de balas con efectos épicos
   */
  drawBulletArray(ctx, bulletArray, isSpecial) {
    for (const bullet of bulletArray) {
      ctx.save();

      // Configurar efectos visuales según tipo
      if (bullet.penetrating) {
        ctx.shadowColor = "#FFFF00";
        ctx.shadowBlur = 12; // Más brillo
      } else if (bullet.explosive) {
        ctx.shadowColor = "#FF8800";
        ctx.shadowBlur = 12; // Más brillo
      } else if (isSpecial) {
        ctx.shadowColor = "#FF0000";
        ctx.shadowBlur = 20; // Mucho más brillo
      }

      // Rotación basada en dirección
      const angle =
        Math.atan2(bullet.velocityY, bullet.velocityX) + Math.PI / 2;

      // Trasladar y rotar
      ctx.translate(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
      ctx.rotate(angle);

      // Dibujar bala
      if (GameConfig.bulletImage && GameConfig.bulletImage.complete) {
        ctx.drawImage(
          GameConfig.bulletImage,
          -bullet.width / 2,
          -bullet.height / 2,
          bullet.width,
          bullet.height
        );
      } else {
        // Respaldo visual
        let color = "#FFFFFF";
        if (bullet.penetrating) color = "#FFFF00";
        else if (bullet.explosive) color = "#FF8800";
        else if (isSpecial) color = "#FF3333";

        ctx.fillStyle = color;
        ctx.fillRect(
          -bullet.width / 2,
          -bullet.height / 2,
          bullet.width,
          bullet.height
        );
      }

      ctx.restore();
    }
  },

  // ======================================================
  // GETTERS Y CONTROL
  // ======================================================

  getBullets() {
    return this.bullets;
  },
  getSpecialBullets() {
    return this.specialBullets;
  },
  isSpecialPowerReady() {
    return this.specialPowerReady;
  },
  isSpecialPowerActive() {
    return this.specialPowerActive;
  },
  getSpecialPowerProgress() {
    return Math.min(
      this.enemiesForSpecialPower / this.ENEMIES_FOR_SPECIAL,
      1.0
    );
  },

  /**
   * Resetea el sistema de balas
   */
  reset() {
    this.stopAutoShoot();

    this.bullets = [];
    this.specialBullets = [];
    this.enemiesForSpecialPower = 0;
    this.specialPowerReady = false;
    this.specialPowerActive = false;
    this.lastShootTime = 0;

    console.log("🔫 Sistema de balas ÉPICO reseteado");
  },

  /**
   * Verifica colisiones con el boss
   */
  checkBossCollisions() {
    if (!BossManager.isActive()) return;

    const boss = BossManager.getBoss();
    if (!boss) return;

    // Verificar que estamos en nivel de boss
    if (window.getLevel() !== 11) return;

    // Verificar balas normales contra boss
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      if (this.checkCollision(bullet, boss)) {
        BossManager.takeDamage(1);
        this.bullets.splice(i, 1);
      }
    }

    // Verificar balas especiales contra boss
    for (let i = this.specialBullets.length - 1; i >= 0; i--) {
      const bullet = this.specialBullets[i];

      if (this.checkCollision(bullet, boss)) {
        BossManager.takeDamage(2); // Más daño con balas especiales
        this.specialBullets.splice(i, 1);
      }
    }
  },
};

// Hacer disponible globalmente
window.BulletManager = BulletManager;

console.log("🔫 bullets.js ÉPICO cargado");
