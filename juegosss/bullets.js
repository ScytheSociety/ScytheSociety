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
  ENEMIES_FOR_SPECIAL: 15, // 🔥 REDUCIDO para más acción

  // ======================================================
  // INICIALIZACIÓN Y CONTROL
  // ======================================================

  /**
   * Inicia el disparo automático - MÁS RÁPIDO
   */
  startAutoShoot() {
    this.stopAutoShoot();

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
      this.shootBullet();
    }, shootDelay);

    console.log(`🔫 Auto-disparo ÉPICO: ${shootDelay}ms`);
  },

  /**
   * Detiene el disparo automático
   */
  stopAutoShoot() {
    if (this.autoShootInterval) {
      clearInterval(this.autoShootInterval);
      this.autoShootInterval = null;
    }
  },

  // ======================================================
  // CREACIÓN DE BALAS - MÁXIMO 3 BALAS
  // ======================================================

  /**
   * Dispara una bala normal - CON SISTEMA ACUMULABLE Y DISPARO DUAL
   */
  shootBullet() {
    const currentTime = Date.now();
    const level = window.getLevel();
    const canvas = window.getCanvas();

    // Cooldown más rápido
    let cooldownTime = Math.max(60, 150 - level * 10);

    // 🔥 OBTENER POWER-UPS ACTIVOS (sistema acumulable)
    const activePowerUps = Player.getActivePowerUps();

    // 🔥 RAPID FIRE MÁS RÁPIDO
    const hasRapidFire = activePowerUps.some((p) => p.id === 3);
    if (hasRapidFire) {
      cooldownTime = 20; // Era 30, ahora 20 (66% más rápido)
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
            // No hacer nada con las balas, el escudo se maneja en player.js
            break;

          case 1: // Disparo Amplio
            bulletCount = Math.max(bulletCount, 7); // Mínimo 7 balas
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
        // Dos balas simétricas a los lados del jugador
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
            velocityX: 0, // Sin ángulo para las balas duales
            velocityY: -bulletSpeed,

            // Propiedades especiales acumulables
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

            // Propiedades especiales acumulables
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
   * Activa el poder especial - MÁS ÉPICO
   */
  activateSpecialPower() {
    if (!this.specialPowerReady || this.specialPowerActive) return;

    this.specialPowerActive = true;
    this.specialPowerReady = false;
    this.enemiesForSpecialPower = 0;

    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();
    const canvas = window.getCanvas();

    // 🔥 MÁS BALAS ESPECIALES
    const bulletCount = 20; // Era 16, ahora 20
    const bulletSpeed = canvas.height * 0.012; // Más rápidas

    // Crear balas en círculo
    for (let i = 0; i < bulletCount; i++) {
      const angle = (i / bulletCount) * Math.PI * 2;

      const specialBullet = {
        x: playerPos.x + playerSize.width / 2 - GameConfig.BULLET_WIDTH / 2,
        y: playerPos.y + playerSize.height / 2 - GameConfig.BULLET_HEIGHT / 2,
        width: GameConfig.BULLET_WIDTH,
        height: GameConfig.BULLET_HEIGHT,
        velocityX: Math.cos(angle) * bulletSpeed,
        velocityY: Math.sin(angle) * bulletSpeed,

        // Propiedades especiales
        explosive: true,
        fromSpecialPower: true,
        life: 4000 / 16.67, // 4 segundos en frames (más duración)

        level: window.getLevel(),
      };

      this.specialBullets.push(specialBullet);
    }

    // Efectos más épicos
    UI.createParticleEffect(
      playerPos.x + playerSize.width / 2,
      playerPos.y + playerSize.height / 2,
      "#FF0000",
      80 // Más partículas
    );

    AudioManager.playSound("special");
    UI.showScreenMessage("🔥 PODER DEVASTADOR 🔥", "#FF0000");

    // Resetear estado
    setTimeout(() => {
      this.specialPowerActive = false;
    }, 4000); // Más duración

    console.log("🔥 Poder especial ÉPICO activado");
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
   * Verifica colisiones de un array de balas
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

        // Notificar al EnemyManager
        EnemyManager.enemiesKilled++;

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
   * Crea una explosión épica
   */
  createExplosion(center, enemies) {
    const explosionRadius = 140; // Radio más grande

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

        // Notificar al EnemyManager
        EnemyManager.enemiesKilled++;

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
