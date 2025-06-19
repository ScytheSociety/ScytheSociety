/**
 * 🎯 Hell Shooter - Sistema de Combos ÉPICO
 *
 * DESCRIPCIÓN GENERAL:
 * Este sistema controla los combos del juego que aparecen en la esquina inferior izquierda.
 * Un combo se forma cuando el jugador elimina enemigos consecutivamente sin recibir daño
 * y sin pasar más de 2 segundos sin eliminar enemigos.
 *
 * FUNCIONALIDADES:
 * - Display visual en esquina inferior izquierda
 * - Multiplicadores de puntuación crecientes
 * - Bonificaciones especiales por combos altos
 * - Efectos especiales (lluvia de power-ups, modo frenesí)
 * - Eventos aleatorios (meteoritos, tiempo lento)
 */

const ComboSystem = {
  // ======================================================
  // 📊 ESTADO DEL COMBO
  // ======================================================

  currentCombo: 0, // Combo actual del jugador
  maxCombo: 0, // Combo máximo alcanzado en esta partida
  lastKillTime: 0, // Timestamp del último enemigo eliminado
  comboTimeLimit: 2000, // Tiempo límite en ms para mantener combo (2 segundos)
  comboDisplay: null, // Elemento HTML del display del combo

  // ======================================================
  // 🎯 CONFIGURACIÓN DE MULTIPLICADORES
  // Cada threshold define:
  // - combo: número mínimo de enemigos eliminados
  // - multiplier: multiplicador de puntos
  // - text: mensaje que aparece al alcanzar este nivel
  // - color: color del mensaje y efectos visuales
  // ======================================================

  comboThresholds: [
    { combo: 0, multiplier: 1.0, text: "", color: "#FFFFFF" },
    { combo: 5, multiplier: 1.2, text: "COMBO x5!", color: "#FFFF00" },
    { combo: 10, multiplier: 1.5, text: "COMBO x10! 🔥", color: "#FF8800" },
    { combo: 15, multiplier: 1.8, text: "COMBO x15! ⚡", color: "#FF4400" },
    { combo: 20, multiplier: 2.0, text: "COMBO x20! 💥", color: "#FF0000" },
    { combo: 30, multiplier: 2.5, text: "MEGA COMBO! 🌟", color: "#FF00FF" },
    { combo: 40, multiplier: 3.0, text: "ULTRA COMBO! 🚀", color: "#00FFFF" },
    { combo: 50, multiplier: 4.0, text: "LEGENDARY! 👑", color: "#FFD700" },
  ],

  // ======================================================
  // 🚀 INICIALIZACIÓN
  // ======================================================

  /**
   * Inicializa el sistema de combos
   * Se llama una vez al inicio del juego
   */
  init() {
    console.log("🎯 Inicializando sistema de combos...");

    this.currentCombo = 0;
    this.maxCombo = 0;
    this.lastKillTime = 0;
    this.createComboDisplay();

    console.log("✅ Sistema de combos ÉPICO inicializado");
  },

  /**
   * Crea el elemento HTML que muestra el combo - POSICIÓN AJUSTADA
   */
  createComboDisplay() {
    if (this.comboDisplay) return;

    console.log("🎨 Creando display visual del combo...");

    this.comboDisplay = document.createElement("div");
    this.comboDisplay.id = "combo-display";

    // 🔥 POSICIÓN MÁS ARRIBA PARA NO TAPAR EL CONTADOR TOTAL
    this.comboDisplay.style.position = "fixed";
    this.comboDisplay.style.bottom = "70px"; // CAMBIADO: de 25px a 70px
    this.comboDisplay.style.left = "15px";
    this.comboDisplay.style.backgroundColor = "transparent";
    this.comboDisplay.style.border = "none";
    this.comboDisplay.style.boxShadow = "none";
    this.comboDisplay.style.backdropFilter = "none";
    this.comboDisplay.style.outline = "none";
    this.comboDisplay.style.borderRadius = "0";
    this.comboDisplay.style.padding = "0";
    this.comboDisplay.style.margin = "0";
    this.comboDisplay.style.color = "#FFD700";
    this.comboDisplay.style.fontSize = "32px";
    this.comboDisplay.style.fontWeight = "bold";
    this.comboDisplay.style.fontFamily = '"Arial", cursive';
    this.comboDisplay.style.fontStyle = "italic";
    this.comboDisplay.style.zIndex = "1000";
    this.comboDisplay.style.display = "none";
    this.comboDisplay.style.transition = "all 0.3s ease";

    // Efecto neón épico
    this.comboDisplay.style.textShadow = `
    0 0 5px currentColor,
    0 0 10px currentColor,
    0 0 15px currentColor,
    0 0 20px currentColor,
    0 0 35px currentColor,
    0 0 40px currentColor
  `;

    document.body.appendChild(this.comboDisplay);

    console.log("✅ Display del combo neón cursivo creado en nueva posición");
  },

  // ======================================================
  // ⚔️ GESTIÓN DE COMBOS
  // ======================================================

  /**
   * 🎯 FUNCIÓN PRINCIPAL: Se llama cada vez que el jugador elimina un enemigo
   * Esta función:
   * 1. Incrementa el combo actual
   * 2. Actualiza el combo máximo si es necesario
   * 3. Actualiza el display visual
   * 4. Verifica si se alcanzó un nuevo threshold
   * 5. Activa bonificaciones especiales
   */
  addKill() {
    // No hacer nada si el juego ha terminado
    if (window.isGameEnded()) return;

    // ===== INCREMENTAR COMBO =====
    this.currentCombo++; // Aumentar combo actual
    this.lastKillTime = Date.now(); // Guardar timestamp actual

    // ===== ACTUALIZAR COMBO MÁXIMO =====
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
      console.log(`🏆 Nuevo combo máximo: ${this.maxCombo}`);
    }

    // ===== ACTUALIZAR DISPLAY VISUAL =====
    this.updateDisplay();

    // ===== VERIFICAR NUEVOS THRESHOLDS =====
    this.checkComboThreshold();

    // ===== ACTIVAR BONIFICACIONES =====
    this.triggerComboBonus();

    console.log(
      `🎯 Combo actualizado: ${this.currentCombo} (Max: ${this.maxCombo})`
    );
  },

  /**
   * 🔄 Se llama cada frame (60 veces por segundo) para verificar si el combo expiró
   * Si han pasado más de 2 segundos sin eliminar enemigos, se rompe el combo
   */
  update() {
    // No hacer nada si el juego ha terminado
    if (window.isGameEnded()) return;

    // Solo verificar si hay un combo activo
    if (this.currentCombo > 0) {
      const timeSinceLastKill = Date.now() - this.lastKillTime;

      // Si han pasado más de 2 segundos, romper combo
      if (timeSinceLastKill > this.comboTimeLimit) {
        this.breakCombo();
      }
    }
  },

  /**
   * 💔 Rompe el combo (por tiempo o daño recibido)
   * Se llama cuando:
   * - Han pasado más de 2 segundos sin eliminar enemigos
   * - El jugador recibe daño
   */
  breakCombo() {
    // Si no hay combo, no hacer nada
    if (this.currentCombo === 0) return;

    console.log(`💔 Combo roto en ${this.currentCombo}`);

    // Si era un combo alto, mostrar mensaje de pérdida
    const wasHighCombo = this.currentCombo >= 10;

    if (wasHighCombo) {
      UI.showScreenMessage(
        `💔 COMBO PERDIDO! (${this.currentCombo})`,
        "#FF0000"
      );
    }

    // Resetear combo a 0
    this.currentCombo = 0;
    this.updateDisplay();
  },

  /**
   * 🩸 Se llama cuando el jugador recibe daño
   * Automáticamente rompe el combo
   */
  onPlayerDamaged() {
    console.log("🩸 Jugador dañado - rompiendo combo");
    this.breakCombo();
  },

  /**
   * 🎊 Verifica si se alcanzó un nuevo threshold de combo
   * Un threshold es un nivel especial (ej: combo 10, 20, 30...)
   * Al alcanzarlo se muestra un mensaje especial y efectos visuales
   */
  checkComboThreshold() {
    // Obtener el threshold actual
    const threshold = this.getCurrentThreshold();

    // Obtener el threshold anterior (combo - 1)
    const previousThreshold = this.getThresholdForCombo(this.currentCombo - 1);

    // Verificar si ACABAMOS de alcanzar un nuevo threshold
    if (
      threshold.combo > previousThreshold.combo &&
      threshold.combo === this.currentCombo
    ) {
      console.log(`🎊 ¡Nuevo threshold alcanzado! ${threshold.text}`);

      // ===== MOSTRAR MENSAJE ÉPICO =====
      UI.showScreenMessage(threshold.text, threshold.color);

      // ===== EFECTO VISUAL ESPECTACULAR =====
      UI.createParticleEffect(
        window.getCanvas().width / 2, // Centro X de la pantalla
        window.getCanvas().height / 2, // Centro Y de la pantalla
        threshold.color, // Color del threshold
        50 // 50 partículas
      );

      // ===== SONIDO ESPECIAL =====
      AudioManager.playSound("powerUp");
    }
  },

  /**
   * 🎁 Activa bonificaciones especiales basadas en el combo actual
   */
  triggerComboBonus() {
    // ===== BONIFICACIONES DE PUNTOS =====

    // Bonus de puntos cada 20 combos (era 25)
    if (this.currentCombo > 0 && this.currentCombo % 20 === 0) {
      const bonusPoints = this.currentCombo * 10;
      window.setScore(window.getScore() + bonusPoints);
      UI.showScreenMessage(`💰 +${bonusPoints} BONUS!`, "#FFD700");
      console.log(
        `💰 Bonus de puntos por combo ${this.currentCombo}: +${bonusPoints}`
      );
    }

    // ===== EVENTOS ESPECIALES MÁS FRECUENTES =====
    // Tiempo lento cada 30 y 60 combos (era 50 y 100)
    if (
      this.currentCombo === 30 ||
      this.currentCombo === 60 ||
      this.currentCombo === 90
    ) {
      if (Math.random() < 0.5) {
        // 50% de probabilidad (era 30%)
        this.triggerSlowMotion();
      }
    }

    // Frenesí cada 40 y 80 combos (era 75)
    if (this.currentCombo === 40 || this.currentCombo === 80) {
      if (Math.random() < 0.6) {
        // 60% probabilidad (era 40%)
        this.triggerFrenzyMode();
      }
    }

    // Lluvia de meteoritos cada 35 y 70 combos
    if (this.currentCombo === 35 || this.currentCombo === 70) {
      if (Math.random() < 0.4) {
        // 40% probabilidad
        this.triggerMeteorShower();
      }
    }

    // MEGA BONUS cada 50 combos (era 100)
    if (this.currentCombo === 50 || this.currentCombo === 100) {
      console.log("🌟 MEGA COMBO! Lluvia especial");
      this.triggerPowerUpRain();
    }
  },

  /**
   * 🌟 Lluvia de power-ups (se activa con combo 25)
   * Crea 3 power-ups con retraso entre ellos
   */
  triggerPowerUpRain() {
    UI.showScreenMessage("🌟 ¡LLUVIA DE PODER! 🌟", "#FFD700");

    // Crear 3 power-ups con delay de 500ms entre cada uno
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        PowerUpManager.forceSpawnPowerUp();
      }, i * 500); // 0ms, 500ms, 1000ms
    }

    AudioManager.playSound("special");
    console.log("🌟 Lluvia de power-ups activada");
  },

  /**
   * ⚡ Modo frenesí (se activa con combo 40)
   * Disparo súper rápido por 30 segundos
   */
  triggerFrenzyMode() {
    // Verificar si ya hay otro evento activo
    if (window.slowMotionActive || window.frenzyModeActive) {
      console.log("🚫 Evento bloqueado: Ya hay otro evento activo");
      return;
    }

    UI.showScreenMessage("⚡ ¡MODO FRENESÍ! ⚡", "#FF00FF");
    window.frenzyModeActive = true;
    console.log(
      "⚡ Iniciando modo frenesí - disparo súper rápido por 15 segundos"
    );

    const originalInterval = BulletManager.autoShootInterval;
    BulletManager.stopAutoShoot();

    const frenzyInterval = setInterval(() => {
      BulletManager.shootBullet();
    }, 30);

    setTimeout(() => {
      clearInterval(frenzyInterval);
      BulletManager.startAutoShoot();
      window.frenzyModeActive = false;
      UI.showScreenMessage("Frenesí terminado", "#FFFFFF");
      console.log("⚡ Modo frenesí terminado - disparo normal restaurado");
    }, 15000);

    AudioManager.playSound("special");
  },

  // ======================================================
  // 🎨 SISTEMA DE DISPLAY VISUAL
  // ======================================================

  /**
   * 🖼️ Actualiza el display visual del combo
   * Muestra:
   * - La palabra "COMBO"
   * - El número actual del combo
   * - El multiplicador de puntos
   * - Cambia colores según el threshold
   */
  /**
   * Actualiza el display visual del combo - MÁS COMPACTO
   */
  updateDisplay() {
    if (!this.comboDisplay) return;

    if (this.currentCombo === 0) {
      this.comboDisplay.style.display = "none";
      return;
    }

    const threshold = this.getCurrentThreshold();

    this.comboDisplay.style.display = "block";

    // 🔥 SOLO EL NÚMERO GRANDE EN NEÓN CURSIVO CON TRAZO
    this.comboDisplay.textContent = this.currentCombo;

    // Actualizar color neón
    this.comboDisplay.style.color = threshold.color;

    // 🔥 EFECTO NEÓN DINÁMICO + TRAZO NEGRO FUERTE
    this.comboDisplay.style.textShadow = `
    /* Trazo negro grueso para legibilidad */
    -2px -2px 0 #000,
    2px -2px 0 #000,
    -2px 2px 0 #000,
    2px 2px 0 #000,
    -3px 0 0 #000,
    3px 0 0 #000,
    0 -3px 0 #000,
    0 3px 0 #000,
    /* Sombra negra adicional */
    0 0 8px rgba(0, 0, 0, 0.9),
    /* Efectos de neón */
    0 0 5px ${threshold.color},
    0 0 10px ${threshold.color},
    0 0 15px ${threshold.color},
    0 0 20px ${threshold.color},
    0 0 35px ${threshold.color},
    0 0 40px ${threshold.color}
  `;

    // Efecto de crecimiento para combos altos
    if (this.currentCombo >= 20) {
      this.comboDisplay.style.fontSize = "36px";
      this.comboDisplay.style.animation =
        "pulse 0.8s ease-in-out infinite alternate";
    } else if (this.currentCombo >= 10) {
      this.comboDisplay.style.fontSize = "34px";
      this.comboDisplay.style.animation = "none";
    } else {
      this.comboDisplay.style.fontSize = "32px";
      this.comboDisplay.style.animation = "none";
    }

    // Efecto de escala al obtener nuevo combo
    this.comboDisplay.style.transform = "scale(1.2)";
    setTimeout(() => {
      if (this.comboDisplay) {
        this.comboDisplay.style.transform = "scale(1)";
      }
    }, 200);
  },

  // ======================================================
  // 🛠️ UTILIDADES Y HELPERS
  // ======================================================

  /**
   * 📊 Obtiene el threshold actual del combo
   * Un threshold define el multiplicador y efectos visuales actuales
   */
  getCurrentThreshold() {
    return this.getThresholdForCombo(this.currentCombo);
  },

  /**
   * 🔍 Obtiene el threshold para un número específico de combo
   * Recorre la lista de thresholds y devuelve el mayor que aplique
   *
   * Ejemplo: Para combo 15
   * - Threshold combo 0: ✅ (15 >= 0)
   * - Threshold combo 5: ✅ (15 >= 5)
   * - Threshold combo 10: ✅ (15 >= 10)
   * - Threshold combo 15: ✅ (15 >= 15) ← Este es el que se devuelve
   * - Threshold combo 20: ❌ (15 < 20)
   */
  getThresholdForCombo(combo) {
    let threshold = this.comboThresholds[0]; // Empezar con el primer threshold

    // Recorrer todos los thresholds
    for (const t of this.comboThresholds) {
      if (combo >= t.combo) {
        threshold = t; // Si el combo es suficiente, usar este threshold
      } else {
        break; // Si el combo no es suficiente, parar (están ordenados)
      }
    }

    return threshold;
  },

  /**
   * 📈 Obtiene el multiplicador actual de puntos
   * Este valor se usa en BulletManager para multiplicar los puntos ganados
   */
  getMultiplier() {
    const multiplier = this.getCurrentThreshold().multiplier;
    console.log(`📈 Multiplicador actual: ${multiplier}x`);
    return multiplier;
  },

  /**
   * 🎯 Obtiene el combo actual
   */
  getCurrentCombo() {
    return this.currentCombo;
  },

  /**
   * 🏆 Obtiene el combo máximo alcanzado en esta partida
   */
  getMaxCombo() {
    return this.maxCombo;
  },

  // ======================================================
  // 🌟 EVENTOS ESPECIALES ALEATORIOS
  // ======================================================

  /**
   * ☄️ Lluvia de meteoritos
   */
  triggerMeteorShower() {
    UI.showScreenMessage("☄️ ¡LLUVIA DE METEORITOS! ☄️", "#FF8800");

    console.log("☄️ Iniciando lluvia de meteoritos - 6 enemigos especiales");

    // Crear 6 enemigos meteorito con delay de 200ms entre cada uno
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (window.EnemyManager && window.EnemyManager.spawnMeteorEnemy) {
          window.EnemyManager.spawnMeteorEnemy();
        }
      }, i * 200);
    }

    AudioManager.playSound("special");
    console.log("☄️ Lluvia de meteoritos activada");
  },

  /**
   * 🌊 Tiempo lento épico
   * Ralentiza todo el juego por 8 segundos
   */
  triggerSlowMotion() {
    // Verificar si ya hay otro evento activo
    if (window.slowMotionActive || window.frenzyModeActive) {
      console.log("🚫 Evento bloqueado: Ya hay otro evento activo");
      return;
    }

    UI.showScreenMessage("🌊 ¡TIEMPO SUBMARINO! 🌊", "#0080FF");
    console.log("🌊 Activando tiempo lento submarino por 8 segundos");

    window.slowMotionActive = true;
    window.slowMotionFactor = 0.08;

    setTimeout(() => {
      window.slowMotionActive = false;
      window.slowMotionFactor = 1.0;
      UI.showScreenMessage("⚡ Superficie alcanzada", "#FFFFFF");
      console.log(
        "🌊 Tiempo submarino terminado - velocidad normal restaurada"
      );
    }, 8000);

    AudioManager.playSound("special");
  },

  /**
   * ✨ Crear efecto visual de tiempo lento
   * Partículas azules flotantes por toda la pantalla
   */
  createSlowMotionEffect() {
    const canvas = window.getCanvas();

    console.log("✨ Creando efectos visuales de tiempo lento");

    // Crear 20 partículas azules con delay entre ellas
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        UI.createParticleEffect(
          Math.random() * canvas.width, // Posición X aleatoria
          Math.random() * canvas.height, // Posición Y aleatoria
          "#00BBFF", // Color azul cian
          5 // 5 partículas por efecto
        );
      }, i * 100); // 100ms entre cada grupo de partículas
    }
  },

  // ======================================================
  // 🧹 LIMPIEZA Y RESET
  // ======================================================

  /**
   * 🧹 Limpia el sistema de combos
   * Remueve el display HTML de la página
   */
  cleanup() {
    console.log("🧹 Limpiando sistema de combos...");

    if (this.comboDisplay && this.comboDisplay.parentNode) {
      this.comboDisplay.parentNode.removeChild(this.comboDisplay);
      this.comboDisplay = null;
      console.log("✅ Display del combo removido de la página");
    }
  },

  /**
   * 🔄 Resetea el sistema de combos
   * Vuelve todos los valores a su estado inicial
   */
  reset() {
    console.log("🔄 Reseteando sistema de combos...");

    this.currentCombo = 0;
    this.maxCombo = 0;
    this.lastKillTime = 0;

    // Ocultar display si existe
    if (this.comboDisplay) {
      this.comboDisplay.style.display = "none";
    }

    console.log("✅ Sistema de combos reseteado completamente");
  },
};

// ======================================================
// 🌐 HACER DISPONIBLE GLOBALMENTE
// ======================================================

// Hacer el objeto disponible para otros archivos JavaScript
window.ComboSystem = ComboSystem;

console.log(
  "🎯 combo.js ÉPICO cargado - Sistema de combos listo para la acción!"
);

// ======================================================
// 📝 NOTAS PARA EL DESARROLLADOR
// ======================================================

/*
🎯 CÓMO FUNCIONA EL SISTEMA DE COMBOS:

1. INICIO:
   - El jugador comienza con combo 0
   - El display está oculto

2. ELIMINAR ENEMIGO:
   - Se llama ComboSystem.addKill()
   - Se incrementa currentCombo
   - Se actualiza el display visual
   - Se verifican bonificaciones

3. MANTENER COMBO:
   - Cada frame se verifica si han pasado >2 segundos
   - Si es así, se rompe el combo automáticamente

4. ROMPER COMBO:
   - Al recibir daño: Player.takeDamage() → ComboSystem.onPlayerDamaged()
   - Por tiempo: ComboSystem.update() → ComboSystem.breakCombo()
   - Se resetea a 0 y se oculta el display

5. BONIFICACIONES:
   - Cada 10 combos: 70% chance de item gratis
   - Combo 25: Lluvia de 3 power-ups
   - Combo 40: Modo frenesí 30 segundos

6. MULTIPLICADORES:
   - Los puntos se multiplican según el threshold actual
   - Ejemplo: Combo 15 = 1.8x puntos
   - Se usa en BulletManager para calcular puntos finales

🎨 PERSONALIZACIÓN:
- Cambiar comboThresholds para ajustar multiplicadores
- Modificar comboTimeLimit para combos más/menos difíciles
- Ajustar posición del display en createComboDisplay()
- Añadir más bonificaciones en triggerComboBonus()

🐛 DEBUGGING:
- Todos los console.log muestran el estado del sistema
- El display muestra el combo y multiplicador en tiempo real
- Las funciones están bien documentadas para facilitar cambios
*/
