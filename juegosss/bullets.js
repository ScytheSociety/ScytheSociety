/**
 * Hell Shooter - Bullet Management CORREGIDO
 * Sistema de balas basado en el código original funcional
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
  ENEMIES_FOR_SPECIAL: 25,

  // ======================================================
  // INICIALIZACIÓN Y CONTROL
  // ======================================================

  /**
   * Inicia el disparo automático
   */
  startAutoShoot() {
    this.stopAutoShoot(); // Limpiar intervalo anterior

    const level = window.getLevel();

    // 🔥 CORREGIDO: Cálculo de delay como en el código original
    const baseDelay = 200;
    const reductionPerLevel = 15;
    const minDelay = 80;
    const shootDelay = Math.max(
      minDelay,
      baseDelay - level * reductionPerLevel
    );

    this.autoShootInterval = setInterval(() => {
      this.shootBullet();
    }, shootDelay);

    console.log(`🔫 Auto-disparo iniciado: ${shootDelay}ms`);
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
  // CREACIÓN DE BALAS - CORREGIDO SEGÚN CÓDIGO ORIGINAL
  // ======================================================

  /**
   * Dispara una bala normal - BASADO EN EL CÓDIGO ORIGINAL
   */
  shootBullet() {
    const currentTime = Date.now();
    const level = window.getLevel();
    const canvas = window.getCanvas();

    // 🔥 CORREGIDO: Cooldown como en el original
    const cooldownTime = Math.max(80, 200 - level * 12);

    if (currentTime - this.lastShootTime > cooldownTime) {
      // 🔥 CORREGIDO: Velocidad de bala como en el original
      const bulletSpeed = canvas.height * (0.015 + level * 0.002);

      // Obtener power-up activo
      const activePowerUp = Player.getActivePowerUp();

      // 🔥 CORREGIDO: Configuración como en el original
      let bulletCount = 1;
      let spreadAngle = Math.PI / 12;
      let bulletConfig = {
        penetrating: false,
        explosive: false,
        penetrationCount: 0,
      };

      // Configurar según power-up activo
      if (activePowerUp) {
        switch (activePowerUp.id) {
          case 0: // Penetrante
            bulletConfig.penetrating = true;
            bulletConfig.penetrationCount = 3;
            break;

          case 1: // Disparo Amplio
            bulletCount = 7; // 🔥 Como en el original
            spreadAngle = Math.PI / 8; // 🔥 Como en el original
            break;

          case 2: // Explosivo
            bulletConfig.explosive = true;
            break;

          case 3: // Rapid Fire - manejado por el intervalo
            break;
        }
      } else if (level >= 3) {
        // 🔥 CORREGIDO: Sin power-up, máximo 5 balas como en el original
        bulletCount = Math.min(1 + Math.floor(level / 3), 5);
      }

      // 🔥 CORREGIDO: Crear balas exactamente como en el original
      const playerPos = Player.getPosition();
      const playerSize = Player.getSize();

      for (let i = 0; i < bulletCount; i++) {
        const offset = i - Math.floor(bulletCount / 2);
        const angle = offset * spreadAngle;

        const bullet = {
          x: playerPos.x + playerSize.width / 2 - GameConfig.BULLET_WIDTH / 2,
          y: playerPos.y - GameConfig.BULLET_HEIGHT,
          width: GameConfig.BULLET_WIDTH,
          height: GameConfig.BULLET_HEIGHT,
          velocityX: Math.sin(angle) * bulletSpeed,
          velocityY: -Math.cos(angle) * bulletSpeed, // 🔥 CORREGIDO: Hacia arriba

          // Propiedades especiales
          penetrating: bulletConfig.penetrating,
          penetrationCount: bulletConfig.penetrationCount,
          explosive: bulletConfig.explosive,

          // Metadatos
          fromSpecialPower: false,
          level: level,
        };

        this.bullets.push(bullet);
      }

      this.lastShootTime = currentTime;

      // Sonido solo si el juego está activo
      if (!window.isGameEnded()) {
        AudioManager.playSound("shoot");
      }
    }
  },

  /**
   * Activa el poder especial - CORREGIDO
   */
  activateSpecialPower() {
    if (!this.specialPowerReady || this.specialPowerActive) return;

    this.specialPowerActive = true;
    this.specialPowerReady = false;
    this.enemiesForSpecialPower = 0;

    const playerPos = Player.getPosition();
    const playerSize = Player.getSize();
    const canvas = window.getCanvas();

    // 🔥 CORREGIDO: Configuración como en el original
    const bulletCount = 16;
    const bulletSpeed = canvas.height * 0.01;

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
        life: 3000 / 16.67, // 3 segundos en frames

        level: window.getLevel(),
      };

      this.specialBullets.push(specialBullet);
    }

    // Efectos
    UI.createParticleEffect(
      playerPos.x + playerSize.width / 2,
      playerPos.y + playerSize.height / 2,
      "#FF0000",
      50
    );

    AudioManager.playSound("special");
    UI.showScreenMessage("🔥 PODER ESPECIAL", "#FF0000");

    // Resetear estado
    setTimeout(() => {
      this.specialPowerActive = false;
    }, 3000);

    console.log("🔥 Poder especial activado");
  },

  // ======================================================
  // ACTUALIZACIÓN Y MOVIMIENTO - CORREGIDO
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

      // 🔥 CORREGIDO: Movimiento simple y directo
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
  // SISTEMA DE COLISIONES - CORREGIDO
  // ======================================================

  /**
   * Verifica colisiones con enemigos - CORREGIDO
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
   * Verifica colisiones de un array de balas - CORREGIDO
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

        // 🔥 CORREGIDO: Solo contar para poder especial si no es bala especial
        if (!isSpecial) {
          this.enemiesForSpecialPower++;
          this.checkSpecialPowerReady();
        }

        // 🔥 CORREGIDO: Notificar al EnemyManager
        EnemyManager.enemiesKilled++;

        // Calcular puntos
        const basePoints = 10 * window.getLevel();
        window.setScore(window.getScore() + basePoints);

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
   * Verifica si el poder especial está listo - CORREGIDO
   */
  checkSpecialPowerReady() {
    if (this.enemiesForSpecialPower >= this.ENEMIES_FOR_SPECIAL) {
      this.specialPowerReady = true;
      this.enemiesForSpecialPower = this.ENEMIES_FOR_SPECIAL; // Cap al máximo

      UI.showScreenMessage("🔥 PODER ESPECIAL LISTO", "#FF0000");
      console.log("🔥 Poder especial cargado");
    }
  },

  /**
   * Crea una explosión que daña enemigos cercanos
   */
  createExplosion(center, enemies) {
    const explosionRadius = 120; // Radio fijo

    // Crear efecto visual
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

        // 🔥 CORREGIDO: Notificar al EnemyManager
        EnemyManager.enemiesKilled++;

        // Puntos por explosión
        const explosionPoints = 5 * window.getLevel();
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
  // RENDERIZADO - CORREGIDO
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
   * Dibuja un array de balas
   */
  drawBulletArray(ctx, bulletArray, isSpecial) {
    for (const bullet of bulletArray) {
      ctx.save();

      // Configurar efectos visuales según tipo
      if (bullet.penetrating) {
        ctx.shadowColor = "#FFFF00";
        ctx.shadowBlur = 8;
      } else if (bullet.explosive) {
        ctx.shadowColor = "#FF8800";
        ctx.shadowBlur = 8;
      } else if (isSpecial) {
        ctx.shadowColor = "#FF0000";
        ctx.shadowBlur = 15;
      }

      // 🔥 CORREGIDO: Rotación basada en dirección
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

    console.log("🔫 Sistema de balas reseteado");
  },
};

// Hacer disponible globalmente
window.BulletManager = BulletManager;
