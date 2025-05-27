/**
 * Hell Shooter - Bullet Management
 * Sistema de balas balanceado y corregido - PARTE 1
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
  currentShootDelay: 200,

  // Sistema de poder especial
  enemiesKilledForSpecial: 0,
  specialPowerReady: false,
  specialPowerActive: false,

  // Rapid Fire temporal
  rapidFireActive: false,
  rapidFireDelay: 30,

  // ======================================================
  // INICIALIZACIÓN Y CONTROL
  // ======================================================

  /**
   * Inicia el disparo automático
   */
  startAutoShoot() {
    this.stopAutoShoot(); // Limpiar intervalo anterior

    const level = window.getLevel();
    this.currentShootDelay = GameConfig.getLevelConfig(level).shootDelay;

    // Si rapid fire está activo, usar su delay
    const shootDelay = this.rapidFireActive
      ? this.rapidFireDelay
      : this.currentShootDelay;

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

  /**
   * Actualiza la velocidad de disparo
   */
  updateShootSpeed() {
    if (this.autoShootInterval) {
      this.startAutoShoot(); // Reiniciar con nueva velocidad
    }
  },

  /**
   * Activa/desactiva rapid fire
   */
  setRapidFire(active, customDelay = null) {
    this.rapidFireActive = active;

    if (active && customDelay) {
      this.rapidFireDelay = customDelay;
    }

    // Actualizar velocidad de disparo
    this.updateShootSpeed();

    console.log(`⚡ Rapid Fire: ${active ? "ON" : "OFF"}`);
  },

  // ======================================================
  // CREACIÓN DE BALAS
  // ======================================================

  /**
   * Dispara una bala normal
   */
  shootBullet() {
    const player = Player;
    const level = window.getLevel();
    const canvas = window.getCanvas();

    // Velocidad de bala aumenta con nivel
    const bulletSpeed =
      GameConfig.PLAYER_CONFIG.shooting.bulletSpeed + level * 0.002;

    // Obtener power-up activo
    const activePowerUp = player.getActivePowerUp();

    // Determinar número de balas y configuración
    let bulletCount = 1;
    let spreadAngle = 0;
    let bulletConfig = {
      penetrating: false,
      explosive: false,
      size: {
        width: GameConfig.BULLET_WIDTH,
        height: GameConfig.BULLET_HEIGHT,
      },
    };

    // Configurar según power-up activo
    if (activePowerUp) {
      switch (activePowerUp.id) {
        case 0: // Penetrante
          bulletConfig.penetrating = true;
          bulletConfig.penetrationCount = 3;
          break;

        case 1: // Disparo Amplio - SOLO 3 BALAS
          bulletCount = 7; // 🔥 CAMBIAR DE 3 A 7
          spreadAngle = Math.PI / 6; // 🔥 CAMBIAR ÁNGULO: de Math.PI / 8 a Math.PI / 6 (30 grados para mejor distribución)
          break;

        case 2: // Explosivo
          bulletConfig.explosive = true;
          break;

        case 3: // Rapid Fire - Balas más grandes
          bulletConfig.size.width *=
            GameConfig.POWERUP_CONFIG.types.RAPID_FIRE.bulletSizeMultiplier;
          bulletConfig.size.height *=
            GameConfig.POWERUP_CONFIG.types.RAPID_FIRE.bulletSizeMultiplier;
          break;
      }
    } else {
      // SIN POWER-UP: Máximo 2 balas normales según nivel
      bulletCount = Math.min(2, Math.floor(level / 3) + 1);
      if (bulletCount > 1) {
        spreadAngle = Math.PI / 16; // Separación pequeña
      }
    }

    // Crear las balas
    const playerPos = player.getPosition();
    const playerSize = player.getSize();

    for (let i = 0; i < bulletCount; i++) {
      const offset = i - Math.floor(bulletCount / 2);
      const angle = offset * spreadAngle;

      const bullet = {
        x: playerPos.x + playerSize.width / 2 - bulletConfig.size.width / 2,
        y: playerPos.y - bulletConfig.size.height,
        width: bulletConfig.size.width,
        height: bulletConfig.size.height,
        velocityX: Math.sin(angle) * bulletSpeed,
        velocityY: -Math.cos(angle) * bulletSpeed,

        // Propiedades especiales
        penetrating: bulletConfig.penetrating,
        penetrationCount: bulletConfig.penetrationCount || 0,
        explosive: bulletConfig.explosive,

        // Metadatos
        fromSpecialPower: false,
        level: level,
      };

      this.bullets.push(bullet);
    }

    // Sonido de disparo (solo si el juego está activo)
    if (!window.isGameEnded()) {
      AudioManager.playSound("shoot");
    }
  },

  /**
   * Activa el poder especial
   */
  activateSpecialPower() {
    if (!this.specialPowerReady || this.specialPowerActive) return;

    this.specialPowerActive = true;
    this.specialPowerReady = false;
    this.enemiesKilledForSpecial = 0;

    const player = Player;
    const playerPos = player.getPosition();
    const playerSize = player.getSize();
    const canvas = window.getCanvas();

    // Configuración del poder especial
    const config = GameConfig.PLAYER_CONFIG.specialPower;
    const bulletSpeed = canvas.height * 0.012;

    // Crear balas en círculo
    for (let i = 0; i < config.bulletCount; i++) {
      const angle = (i / config.bulletCount) * Math.PI * 2;

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
        life: config.duration / 16.67, // Convertir ms a frames (60fps)

        level: window.getLevel(),
      };

      this.specialBullets.push(specialBullet);
    }

    // Efectos visuales y sonoros
    UI.createParticleEffect(
      playerPos.x + playerSize.width / 2,
      playerPos.y + playerSize.height / 2,
      "#FF0000",
      50
    );

    AudioManager.playSound("special");
    UI.showScreenMessage("¡PODER ESPECIAL!", "#FF0000");

    // Resetear estado después de la duración
    setTimeout(() => {
      this.specialPowerActive = false;
    }, config.duration);

    console.log("🔥 Poder especial activado");
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

      // Mover bala
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
   * Limpia balas fuera de pantalla o sin vida
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
    let enemiesKilled = 0;

    // Verificar balas normales
    enemiesKilled += this.checkBulletCollisions(this.bullets, enemies, false);

    // Verificar balas especiales
    enemiesKilled += this.checkBulletCollisions(
      this.specialBullets,
      enemies,
      true
    );

    return enemiesKilled;
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
          this.enemiesKilledForSpecial++;
          this.checkSpecialPowerReady();
        }

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
   * Verifica colisiones con el boss
   */
  checkBossCollisions() {
    if (!BossManager.isActive()) return;

    const boss = BossManager.getBoss();
    let hitCount = 0;

    // Verificar balas normales
    hitCount += this.checkBossHits(this.bullets, boss);

    // Verificar balas especiales
    hitCount += this.checkBossHits(this.specialBullets, boss);

    if (hitCount > 0) {
      BossManager.takeDamage(hitCount);
    }
  },

  /**
   * Verifica impactos contra el boss
   */
  checkBossHits(bulletArray, boss) {
    let hitCount = 0;

    for (let j = bulletArray.length - 1; j >= 0; j--) {
      const bullet = bulletArray[j];

      if (this.checkCollision(bullet, boss)) {
        hitCount++;

        // Crear explosión si es bala explosiva
        if (bullet.explosive) {
          UI.createExplosionEffect(
            bullet.x + bullet.width / 2,
            bullet.y + bullet.height / 2
          );
        }

        // Eliminar bala (el boss no tiene penetración)
        bulletArray.splice(j, 1);
      }
    }

    return hitCount;
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

  /**
   * Crea una explosión que daña enemigos cercanos
   */
  createExplosion(center, enemies) {
    const explosionRadius =
      GameConfig.POWERUP_CONFIG.types.EXPLOSIVE.explosionRadius;

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

        // Puntos por explosión
        const explosionPoints = 5 * window.getLevel();
        window.setScore(window.getScore() + explosionPoints);

        console.log("💥 Enemigo eliminado por explosión");
      }
    }
  },

  /**
   * Verifica si el poder especial está listo
   */
  checkSpecialPowerReady() {
    const required = GameConfig.PLAYER_CONFIG.specialPower.enemiesRequired;

    if (this.enemiesKilledForSpecial >= required) {
      this.specialPowerReady = true;
      this.enemiesKilledForSpecial = required; // Cap al máximo

      UI.showScreenMessage("¡PODER ESPECIAL LISTO!", "#FF0000");
      console.log("🔥 Poder especial cargado");
    }
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
   * Dibuja un array de balas
   */
  drawBulletArray(ctx, bulletArray, isSpecial) {
    for (const bullet of bulletArray) {
      ctx.save();

      // Configurar efectos visuales según tipo
      if (bullet.penetrating) {
        ctx.shadowColor = "#FFFF00";
        ctx.shadowBlur = 8;

        // Estela para balas penetrantes
        ctx.strokeStyle = "#FFFF00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bullet.x + bullet.width / 2, bullet.y + bullet.height);
        ctx.lineTo(bullet.x + bullet.width / 2, bullet.y + bullet.height + 10);
        ctx.stroke();
      } else if (bullet.explosive) {
        ctx.shadowColor = "#FF8800";
        ctx.shadowBlur = 8;
      } else if (isSpecial) {
        ctx.shadowColor = "#FF0000";
        ctx.shadowBlur = 15;

        // Partículas para balas especiales
        if (window.getGameTime() % 3 === 0) {
          UI.createParticleEffect(
            bullet.x + bullet.width / 2,
            bullet.y + bullet.height / 2,
            "#FF3333",
            1
          );
        }
      }

      // Calcular rotación según dirección
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
    const required = GameConfig.PLAYER_CONFIG.specialPower.enemiesRequired;
    return Math.min(this.enemiesKilledForSpecial / required, 1.0);
  },

  /**
   * Resetea el sistema de balas
   */
  reset() {
    this.stopAutoShoot();

    this.bullets = [];
    this.specialBullets = [];
    this.enemiesKilledForSpecial = 0;
    this.specialPowerReady = false;
    this.specialPowerActive = false;
    this.rapidFireActive = false;
    this.lastShootTime = 0;

    console.log("🔫 Sistema de balas reseteado");
  },
};

// Hacer disponible globalmente
window.BulletManager = BulletManager;

console.log("🔫 bullets.js cargado - Sistema de balas listo");
