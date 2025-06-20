/**
 * Hell Shooter - Boss Comments System Optimizado
 * Sistema modular de comentarios épicos y sombríos del boss
 */

const BossComments = {
  // ======================================================
  // ESTADO DEL SISTEMA DE COMENTARIOS
  // ======================================================

  bossManager: null,

  // Control de timing
  lastCommentTime: 0,
  commentCooldowns: {
    entrada: 300,
    combate: 180,
    derrota_boss: 0,
    fase: 120,
    dano: 60,
  },

  // Estado de comentarios
  activeComments: [],
  maxActiveComments: 3,

  // Configuración visual
  commentConfig: {
    duration: 4000,
    fadeDuration: 500,
    maxWidth: "300px",
    fontSize: "14px",
    position: "above_boss",
  },

  // ======================================================
  // BASE DE DATOS DE COMENTARIOS
  // ======================================================

  commentDatabase: {
    entrada: [
      "¡Scythe Society será destruida para siempre!",
      "¡Vengo por la reina Hell y toda su legión!",
      "¡Prepárense para la aniquilación total!",
      "¡Su clan patético no durará ni un minuto!",
      "¡Hell pagará por su insolencia con sangre!",
      "¡Soy la pesadilla que acecha sus sueños!",
      "¡El reino de las sombras me pertenece!",
      "¡Desde las profundidades del abismo vengo!",
      "¡Hell conocerá el verdadero terror!",
      "¡Scythe Society... su final ha llegado!",
    ],

    combate: [
      "¡Son unos mancos patéticos!",
      "¡Scythe Society, más como Scythe Pathetic!",
      "¡Hell debería entrenar mejor a sus lacayos!",
      "¡Qué decepcionante resistencia ofrecen!",
      "¡Ni siquiera saben apuntar correctamente!",
      "¡Mi abuela muerta disparaba mejor!",
      "¡Scythe Society = Scythe Sorry!",
      "¡Hell te abandonará como a todos!",
      "¡Toda la culpa es de Red por ser tan débil!",
      "¡Eso es demasiado heterosexual de tu parte!",
      "¡Sus balas son como cosquillas de bebé!",
      "¡Patéticos mortales sin esperanza!",
      "¡Esto es todo lo que tienen?! ¡Ja!",
      "¡Hell eligió mal a sus campeones!",
      "¡Ni sus ancestros podrán salvarlos!",
      "¡Scythe Society, más como Cry Society!",
      "¡Deberían rendirse ahora y suplicar!",
      "¡Soy la oscuridad que devora la luz!",
      "¡Sus almas me pertenecen ahora!",
      "¡El terror apenas ha comenzado!",
      "¡Pronto conocerán el verdadero miedo!",
      "¡Su sangre manchará estas tierras!",
      "¡La muerte será su único escape!",
      "¡Hell no podrá protegerlos por siempre!",
      "¡Soy el eco de sus peores pesadillas!",
      "¡Cada disparo los acerca más a la tumba!",
      "¡Hell debería estar avergonzada de ustedes!",
      "¡Red es un comandante incompetente!",
      "¡Scythe Society? ¡Más bien Scythe Tragedy!",
    ],

    victoria_boss: [
      "¡Hell, aquí voy por ti, mi amor perdido!",
      "¡Scythe Society ha caído en las tinieblas!",
      "¡Vuelvan pronto... si es que pueden regenerarse!",
      "¡Digan adiós a su preciada Hell para siempre!",
      "¡La oscuridad prevalece sobre la luz!",
      "¡Sus almas ahora me pertenecen!",
      "¡El reino de Hell será mío!",
      "¡Hell pagará por haberme traicionado!",
      "¡Scythe Society no era rival para mí!",
      "¡Pronto toda la galaxia será oscuridad!",
    ],

    derrota_boss: [
      "¡Esto no ha terminado, volveré!",
      "¡Volveré más fuerte desde las profundidades!",
      "¡Hell... me las pagará con creces!",
      "¡No me olvidaré de esto jamás!",
      "¡Mi venganza será eterna y sombría!",
      "¡Las sombras me protegerán hasta mi regreso!",
      "¡Pronto me regeneraré en el abismo!",
      "¡Hell no ha visto lo último de mí!",
      "¡Scythe Society... nos veremos de nuevo!",
      "¡La oscuridad nunca puede ser derrotada!",
      "¡Desde el inframundo planearé mi venganza!",
      "¡Red será el primero en caer cuando regrese!",
      "¡Imposible... ¿cómo pueden ser tan fuertes?!",
      "¡Hell... te subestimé una vez más...!",
      "¡Malditos sean todos ustedes!",
    ],

    fase_summoning: [
      "¡Mis esbirros harán el trabajo sucio!",
      "¡Legiones del abismo, vengan a mí!",
      "¡No estoy solo en esta batalla!",
      "¡Hell enfrentará a todo mi ejército!",
      "¡Cada enemigo que invoco es su pesadilla!",
    ],

    fase_mines: [
      "¡Esquiven esto si pueden!",
      "¡El suelo bajo sus pies es traicionero!",
      "¡Cada paso podría ser el último!",
      "¡Las minas conocen su ubicación!",
      "¡Hell aprenderá a temer el suelo!",
    ],

    fase_bullets: [
      "¡Lluvia de muerte del inframundo!",
      "¡Esquiven mi ballet mortal!",
      "¡Cada bala tiene su nombre grabado!",
      "¡Hell danzará con la muerte!",
      "¡Mis patrones son arte letal!",
    ],

    fase_redline: [
      "¡Sigue mi rastro mortal!",
      "¡El hilo rojo marca su destino!",
      "¡Mi ruta es su perdición!",
      "¡Cada movimiento mío es calculado!",
      "¡Hell no podrá predecir mi camino!",
    ],

    fase_yankenpo: [
      "¡Última oportunidad, mortal!",
      "¡El destino se decide aquí!",
      "¡Yan Ken Po determinará el ganador!",
      "¡Hell vs las fuerzas del mal!",
      "¡Que gane el mejor estratega!",
    ],

    dano_alto: [
      "¡Impossible! ¿Cómo me hieren?",
      "¡No puede ser! ¡Soy invencible!",
      "¡Mi poder se desvanece!",
      "¡Esto no debería pasar!",
      "¡Malditos mortales!",
      "¡No me derrotarán tan fácil!",
      "¡Hell tiene más fuerza de la que pensé!",
      "¡Cada herida me hace más peligroso!",
      "¡Su determinación es... admirable!",
      "¡Pero aún no han visto mi poder real!",
    ],

    dano_bajo: [
      "¡Eso apenas me ha rozado!",
      "¡¿Es eso todo lo que tienen?!",
      "¡Hell debería intentar más fuerte!",
      "¡Mi armadura de sombras me protege!",
      "¡Necesitarán más que eso!",
    ],

    inmunidad: [
      "¡Soy intocable ahora!",
      "¡Sus ataques no me afectan!",
      "¡Hell desperdicia munición!",
      "¡Mi escudo de oscuridad es perfecto!",
      "¡Observen mi poder absoluto!",
    ],

    vida_critica: [
      "¡No... esto no puede estar pasando!",
      "¡Mi poder se desvanece!",
      "¡Hell... han llegado demasiado lejos!",
      "¡Pero aún no he usado todo mi poder!",
      "¡La desesperación me hace más fuerte!",
      "¡Si caigo, me llevaré todo conmigo!",
    ],
  },

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================

  init(bossManagerRef) {
    this.bossManager = bossManagerRef;
    this.lastCommentTime = 0;
    this.activeComments = [];
    console.log("💬 Sistema de comentarios del boss inicializado");
  },

  // ======================================================
  // ACTUALIZACIÓN PRINCIPAL
  // ======================================================

  update() {
    if (!this.bossManager.active) return;

    this.updateActiveComments();
    this.updateBossMessagePosition();
    this.updateAutomaticComments();
  },

  updateBossMessagePosition() {
    const bossMessage = document.getElementById("boss-speech-bubble");
    if (bossMessage && this.bossManager.boss) {
      const boss = this.bossManager.boss;
      const canvas = window.getCanvas();

      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const bossScreenX = rect.left + boss.x + boss.width / 2;
        const bossScreenY = rect.top + boss.y - 80;

        bossMessage.style.left = `${bossScreenX}px`;
        bossMessage.style.top = `${bossScreenY}px`;
        bossMessage.style.transform = "translateX(-50%)";
        bossMessage.style.transition = "left 0.1s ease, top 0.1s ease";
      }
    }
  },

  updateActiveComments() {
    const currentTime = Date.now();

    for (let i = this.activeComments.length - 1; i >= 0; i--) {
      const comment = this.activeComments[i];
      const elapsed = currentTime - comment.startTime;

      if (elapsed > comment.duration - this.commentConfig.fadeDuration) {
        const fadeProgress =
          (elapsed - (comment.duration - this.commentConfig.fadeDuration)) /
          this.commentConfig.fadeDuration;
        comment.element.style.opacity = Math.max(0, 1 - fadeProgress);
        comment.element.style.transform =
          comment.baseTransform + ` translateY(-${fadeProgress * 10}px)`;
      }

      if (elapsed > comment.duration) {
        this.removeComment(i);
      }
    }
  },

  updateAutomaticComments() {
    const currentTime = window.getGameTime();

    if (currentTime - this.lastCommentTime > 600) {
      // Cada 10 segundos
      if (Math.random() < 0.3) {
        // 30% de probabilidad
        this.sayRandomComment("combate");
      }
    }
  },

  // ======================================================
  // SISTEMA PRINCIPAL DE COMENTARIOS
  // ======================================================

  sayRandomComment(situation) {
    const currentTime = window.getGameTime();
    const cooldown = this.commentCooldowns[situation] || 180;

    if (
      currentTime - this.lastCommentTime < cooldown &&
      situation !== "derrota_boss"
    ) {
      return;
    }

    const comments = this.commentDatabase[situation];
    if (!comments || comments.length === 0) {
      console.warn(`💬 No hay comentarios para la situación: ${situation}`);
      return;
    }

    const randomComment = comments[Math.floor(Math.random() * comments.length)];
    this.showBossMessage(randomComment, situation);

    this.lastCommentTime = currentTime;
    console.log(`👹 Boss dice (${situation}): ${randomComment}`);
  },

  sayComment(text, situation = "custom") {
    this.showBossMessage(text, situation);
    console.log(`👹 Boss dice: ${text}`);
  },

  showBossMessage(message, category = "combate") {
    // Eliminar mensaje anterior si existe
    const existingMessage = document.getElementById("boss-speech-bubble");
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageElement = this.createMessageElement(message, category);

    // Posicionar relativo al boss
    if (this.bossManager.boss) {
      const boss = this.bossManager.boss;
      messageElement.style.left = `${boss.x + boss.width / 2}px`;
      messageElement.style.top = `${boss.y - 100}px`;
      messageElement.style.transform = "translateX(-50%)";
    } else {
      this.positionMessage(messageElement, category);
    }

    messageElement.id = "boss-speech-bubble";
    document.body.appendChild(messageElement);

    this.animateMessageEntrance(messageElement);

    const commentObj = {
      element: messageElement,
      startTime: Date.now(),
      duration: this.getDuration(category),
      message: message,
      category: category,
      baseTransform: messageElement.style.transform,
    };

    this.activeComments.push(commentObj);
  },

  createMessageElement(message, category) {
    const messageElement = document.createElement("div");
    messageElement.className = "boss-comment";

    const styles = this.getMessageStyles(category);
    messageElement.style.cssText = styles;
    messageElement.innerHTML = this.formatMessage(message, category);

    return messageElement;
  },

  getMessageStyles(category) {
    const baseStyles = `
      position: fixed;
      z-index: 1999;
      font-family: Arial, cursive;
      font-weight: bold;
      text-align: center;
      padding: 8px 12px;
      border-radius: 12px;
      max-width: ${this.commentConfig.maxWidth};
      word-wrap: break-word;
      pointer-events: none;
      transition: all 0.3s ease;
      backdrop-filter: blur(5px);
      border: 2px solid;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.8);
    `;

    const categoryStyles = {
      entrada: `
        background: linear-gradient(135deg, rgba(139, 0, 0, 0.95), rgba(0, 0, 0, 0.95));
        color: #FF0000;
        border-color: #FF0000;
        font-size: 16px;
        text-shadow: 
          -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000,
          0 0 10px #FF0000, 0 0 20px #FF0000;
      `,

      combate: `
        background: rgba(0, 0, 0, 0.9);
        color: #FF4444;
        border-color: #FF4444;
        font-size: ${this.commentConfig.fontSize};
        text-shadow: 
          -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000,
          0 0 5px #FF4444;
      `,

      derrota_boss: `
        background: linear-gradient(135deg, rgba(139, 0, 0, 0.95), rgba(255, 0, 0, 0.95));
        color: #FFFFFF;
        border-color: #FF0000;
        font-size: 18px;
        text-shadow: 
          -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000,
          0 0 15px #FF0000, 0 0 30px #FF0000;
      `,

      vida_critica: `
        background: rgba(255, 0, 0, 0.9);
        color: #FFFFFF;
        border-color: #FFFFFF;
        font-size: 15px;
        text-shadow: 
          -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000,
          0 0 10px #FFFFFF;
        animation: pulse 1s infinite;
      `,

      fase: `
        background: linear-gradient(135deg, rgba(75, 0, 130, 0.95), rgba(139, 0, 139, 0.95));
        color: #FFD700;
        border-color: #FFD700;
        font-size: 15px;
        text-shadow: 
          -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000,
          0 0 8px #FFD700;
      `,

      default: `
        background: rgba(0, 0, 0, 0.8);
        color: #FFFFFF;
        border-color: #FFFFFF;
        font-size: ${this.commentConfig.fontSize};
        text-shadow: 
          -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
      `,
    };

    return baseStyles + (categoryStyles[category] || categoryStyles.default);
  },

  formatMessage(message, category) {
    const prefixes = {
      entrada: "👹",
      combate: "👹",
      derrota_boss: "💀",
      vida_critica: "⚠️",
      fase: "🔥",
      default: "👹",
    };

    const prefix = prefixes[category] || prefixes.default;
    return `${prefix} "${message}" ${prefix}`;
  },

  positionMessage(element, category) {
    const boss = this.bossManager.boss;

    if (boss) {
      const bossX = boss.x + boss.width / 2;
      const bossY = boss.y - 80;

      element.style.left = `${bossX}px`;
      element.style.top = `${bossY}px`;
      element.style.transform = "translateX(-50%)";
    } else {
      element.style.top = "20%";
      element.style.left = "50%";
      element.style.transform = "translateX(-50%)";
    }
  },

  animateMessageEntrance(element) {
    element.style.opacity = "0";
    element.style.transform += " scale(0.8) translateY(-10px)";

    setTimeout(() => {
      element.style.opacity = "1";
      element.style.transform = element.style.transform
        .replace("scale(0.8)", "scale(1)")
        .replace("translateY(-10px)", "translateY(0)");
    }, 50);
  },

  getDuration(category) {
    const durations = {
      entrada: 6000,
      combate: 4000,
      derrota_boss: 8000,
      vida_critica: 5000,
      fase: 4000,
      default: 4000,
    };

    return durations[category] || durations.default;
  },

  removeComment(index) {
    if (index >= 0 && index < this.activeComments.length) {
      const comment = this.activeComments[index];

      if (comment.element.parentNode) {
        comment.element.parentNode.removeChild(comment.element);
      }

      this.activeComments.splice(index, 1);
    }
  },

  // ======================================================
  // REACCIONES A EVENTOS
  // ======================================================

  onDamageReceived(healthPercentage) {
    if (Math.random() < 0.15) {
      // 15% probabilidad
      if (healthPercentage > 0.5) {
        this.sayRandomComment("dano_bajo");
      } else if (healthPercentage > 0.2) {
        this.sayRandomComment("dano_alto");
      } else {
        this.sayRandomComment("vida_critica");
      }
    }
  },

  onPhaseChange(newPhase) {
    const phaseKey = `fase_${newPhase.toLowerCase()}`;

    if (this.commentDatabase[phaseKey]) {
      this.sayRandomComment(phaseKey);
    } else {
      this.sayComment(`¡Hora de la fase ${newPhase}!`, "fase");
    }
  },

  onImmunityActivated() {
    if (Math.random() < 0.4) {
      // 40% probabilidad
      this.sayRandomComment("inmunidad");
    }
  },

  // ======================================================
  // UTILIDADES
  // ======================================================

  configure(config) {
    this.commentConfig = { ...this.commentConfig, ...config };
  },

  addCustomComments(category, comments) {
    if (!this.commentDatabase[category]) {
      this.commentDatabase[category] = [];
    }

    this.commentDatabase[category].push(...comments);
    console.log(
      `💬 Agregados ${comments.length} comentarios a categoría: ${category}`
    );
  },

  clearActiveComments() {
    this.activeComments.forEach((comment, index) => {
      this.removeComment(index);
    });
    this.activeComments = [];
  },

  forceComment(text, category = "custom") {
    const oldCooldown = this.lastCommentTime;
    this.lastCommentTime = 0;

    this.sayComment(text, category);

    this.lastCommentTime = oldCooldown;
  },

  // ======================================================
  // CLEANUP Y RESET
  // ======================================================

  cleanup() {
    console.log("🧹 Limpiando sistema de comentarios");

    this.clearActiveComments();
    this.lastCommentTime = 0;
  },

  reset() {
    this.cleanup();
    console.log("🔄 Sistema de comentarios reseteado");
  },

  // ======================================================
  // GETTERS
  // ======================================================

  getActiveCommentCount() {
    return this.activeComments.length;
  },
  getCommentDatabase() {
    return this.commentDatabase;
  },
  getCategoryCount(category) {
    return this.commentDatabase[category]
      ? this.commentDatabase[category].length
      : 0;
  },

  getStats() {
    const stats = {
      activeComments: this.activeComments.length,
      maxActiveComments: this.maxActiveComments,
      totalCategories: Object.keys(this.commentDatabase).length,
      totalComments: 0,
      lastCommentTime: this.lastCommentTime,
    };

    Object.values(this.commentDatabase).forEach((comments) => {
      stats.totalComments += comments.length;
    });

    return stats;
  },

  getCategoryStats() {
    const categoryStats = {};

    Object.keys(this.commentDatabase).forEach((category) => {
      categoryStats[category] = {
        count: this.commentDatabase[category].length,
        cooldown: this.commentCooldowns[category] || 180,
      };
    });

    return categoryStats;
  },
};

window.BossComments = BossComments;

console.log("💬 boss-comments.js optimizado cargado");
