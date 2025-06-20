/**
 * Hell Shooter - Audio Management
 * Sistema de audio con control de volumen - PARTE 1
 */

const AudioManager = {
  // ======================================================
  // SISTEMA DE SONIDOS
  // ======================================================

  sounds: {},
  masterVolume: 0.5,
  backgroundMusicPlaying: false,
  previousVolume: 0.5,

  /**
   * Inicializa el sistema de audio con control de visibilidad
   */
  init() {
    this.loadSounds();
    this.setupVolumeControl();
    this.resumeAudioContext();
    this.setupVisibilityControl(); // 🔥 NUEVO
    console.log("🔊 Sistema de audio inicializado");
  },

  /**
   * 🔥 NUEVO: Configura control de visibilidad para pausar audio - CORREGIDO
   */
  setupVisibilityControl() {
    console.log("🔊 Control de visibilidad deshabilitado");
  },

  /**
   * Carga todos los sonidos del juego
   */
  loadSounds() {
    // Definir sonidos con sus archivos y volúmenes base
    const soundDefinitions = {
      shoot: { file: "sounds/shoot.mp3", baseVolume: 0.3 },
      hit: { file: "sounds/hit.mp3", baseVolume: 0.2 },
      gameOver: { file: "sounds/gameover.mp3", baseVolume: 0.8 },
      victory: { file: "sounds/victory.mp3", baseVolume: 0.8 },
      levelUp: { file: "sounds/levelup.mp3", baseVolume: 0.6 },
      background: { file: "sounds/background.mp3", baseVolume: 0.4 },
      special: { file: "sounds/special.mp3", baseVolume: 0.7 },
      powerUp: { file: "sounds/powerup.mp3", baseVolume: 0.6 },
      heart: { file: "sounds/heart.mp3", baseVolume: 0.5 },
      explosion: { file: "sounds/explosion.mp3", baseVolume: 0.6 },
      damaged: { file: "sounds/damaged.mp3", baseVolume: 0.5 },
    };

    // Crear objetos Audio para cada sonido
    for (const [key, definition] of Object.entries(soundDefinitions)) {
      this.sounds[key] = {
        audio: new Audio(definition.file),
        baseVolume: definition.baseVolume,
        loaded: false,
      };

      // Configurar eventos de carga
      this.sounds[key].audio.addEventListener("canplaythrough", () => {
        this.sounds[key].loaded = true;
        console.log(`🔊 Sonido cargado: ${key}`);
      });

      this.sounds[key].audio.addEventListener("error", (e) => {
        console.warn(`⚠️ Error cargando sonido ${key}:`, e);
      });

      // Precargar
      this.sounds[key].audio.load();
    }

    // Configurar música de fondo para loop
    if (this.sounds.background) {
      this.sounds.background.audio.loop = true;
    }
  },

  /**
   * Configura el control de volumen
   */
  setupVolumeControl() {
    this.updateAllVolumes();
  },

  // ======================================================
  // CONTROL DE VOLUMEN
  // ======================================================

  /**
   * Establece el volumen maestro
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
    console.log(`🔊 Volumen maestro: ${Math.round(this.masterVolume * 100)}%`);
  },

  /**
   * Obtiene el volumen maestro actual
   */
  getMasterVolume() {
    return this.masterVolume;
  },

  /**
   * Actualiza el volumen de todos los sonidos
   */
  updateAllVolumes() {
    for (const [key, sound] of Object.entries(this.sounds)) {
      if (sound.audio) {
        sound.audio.volume = sound.baseVolume * this.masterVolume;
      }
    }
  },

  /**
   * Silencia/activa todos los sonidos
   */
  toggleMute() {
    if (this.masterVolume > 0) {
      this.previousVolume = this.masterVolume;
      this.setMasterVolume(0);
    } else {
      this.setMasterVolume(this.previousVolume || 0.5);
    }
  },

  // ======================================================
  // REPRODUCCIÓN DE SONIDOS
  // ======================================================

  /**
   * Reproduce un sonido específico - NO reproduzca si la app está oculta
   */
  playSound(soundName) {
    // Solo verificar volumen, no pausar por visibilidad
    if (this.masterVolume === 0) {
      return;
    }

    if (!this.sounds[soundName] || this.masterVolume === 0) {
      return;
    }

    const sound = this.sounds[soundName];

    if (!sound.loaded) {
      console.warn(`⚠️ Sonido ${soundName} no está cargado`);
      return;
    }

    try {
      // Crear una copia del audio para permitir solapamiento
      const audioClone = sound.audio.cloneNode();
      audioClone.volume = sound.baseVolume * this.masterVolume;

      // Reproducir
      const playPromise = audioClone.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(`⚠️ Error reproduciendo ${soundName}:`, error);
        });
      }
    } catch (error) {
      console.warn(`⚠️ Error creando copia de ${soundName}:`, error);
    }
  },

  /**
   * Reproduce múltiples sonidos con delay
   */
  playSoundSequence(sounds, delay = 100) {
    sounds.forEach((soundName, index) => {
      setTimeout(() => {
        this.playSound(soundName);
      }, index * delay);
    });
  },

  /**
   * Reproduce un sonido aleatorio de una lista
   */
  playRandomSound(soundNames) {
    if (soundNames.length === 0) return;

    const randomIndex = Math.floor(Math.random() * soundNames.length);
    this.playSound(soundNames[randomIndex]);
  },

  // ======================================================
  // MÚSICA DE FONDO
  // ======================================================

  /**
   * Inicia la música de fondo
   */
  startBackgroundMusic() {
    if (!this.sounds.background || this.backgroundMusicPlaying) {
      return;
    }

    // Si ya está sonando, no reiniciar
    if (this.backgroundMusicPlaying) {
      console.log("🎵 Música ya está reproduciéndose");
      return;
    }

    const bgMusic = this.sounds.background.audio;
    bgMusic.volume = this.sounds.background.baseVolume * this.masterVolume;

    const playPromise = bgMusic.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.backgroundMusicPlaying = true;
          console.log("🎵 Música de fondo iniciada");
        })
        .catch((error) => {
          console.warn(
            "⚠️ No se pudo iniciar la música automáticamente:",
            error
          );
          console.log(
            "💡 La música se iniciará con la primera interacción del usuario"
          );
        });
    }
  },

  /**
   * Detiene la música de fondo
   */
  stopBackgroundMusic() {
    if (!this.sounds.background || !this.backgroundMusicPlaying) {
      return;
    }

    const bgMusic = this.sounds.background.audio;
    bgMusic.pause();
    bgMusic.currentTime = 0;
    this.backgroundMusicPlaying = false;

    console.log("🎵 Música de fondo detenida");
  },

  /**
   * Pausa/reanuda la música de fondo
   */
  toggleBackgroundMusic() {
    if (!this.sounds.background) return;

    const bgMusic = this.sounds.background.audio;

    if (this.backgroundMusicPlaying) {
      bgMusic.pause();
      this.backgroundMusicPlaying = false;
      console.log("⏸️ Música pausada");
    } else {
      const playPromise = bgMusic.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.backgroundMusicPlaying = true;
            console.log("▶️ Música reanudada");
          })
          .catch((error) => {
            console.warn("⚠️ Error reanudando música:", error);
          });
      }
    }
  },

  /**
   * Ajusta el volumen de la música de fondo
   */
  setBackgroundMusicVolume(volume) {
    if (this.sounds.background) {
      this.sounds.background.baseVolume = Math.max(0, Math.min(1, volume));
      this.sounds.background.audio.volume =
        this.sounds.background.baseVolume * this.masterVolume;
    }
  },

  // ======================================================
  // EFECTOS DE SONIDO ESPECIALES
  // ======================================================

  /**
   * Reproduce efecto de sonido con fade in
   */
  playSoundWithFadeIn(soundName, duration = 1000) {
    if (!this.sounds[soundName]) return;

    try {
      const sound = this.sounds[soundName];
      const audioClone = sound.audio.cloneNode();
      const targetVolume = sound.baseVolume * this.masterVolume;

      // Iniciar con volumen 0
      audioClone.volume = 0;
      audioClone.play();

      // Fade in gradual
      const fadeStep = targetVolume / (duration / 50);
      const fadeInterval = setInterval(() => {
        if (audioClone.volume < targetVolume) {
          audioClone.volume = Math.min(
            audioClone.volume + fadeStep,
            targetVolume
          );
        } else {
          clearInterval(fadeInterval);
        }
      }, 50);
    } catch (error) {
      console.warn(`⚠️ Error en fade in de ${soundName}:`, error);
    }
  },

  /**
   * Reproduce efecto de sonido con fade out - CORREGIDO
   */
  playSoundWithFadeOut(soundName, duration = 1000) {
    if (!this.sounds[soundName]) return;

    try {
      const sound = this.sounds[soundName];
      const audioClone = sound.audio.cloneNode();
      const initialVolume = sound.baseVolume * this.masterVolume; // ✅ Correcto

      audioClone.volume = initialVolume;
      audioClone.play();

      // Fade out después de un delay
      setTimeout(() => {
        const fadeStep = initialVolume / (duration / 50); // ✅ CORREGIDO: era "initialVolumen"
        const fadeInterval = setInterval(() => {
          if (audioClone.volume > 0) {
            audioClone.volume = Math.max(audioClone.volume - fadeStep, 0);
          } else {
            audioClone.pause();
            clearInterval(fadeInterval);
          }
        }, 50);
      }, audioClone.duration * 1000 - duration);
    } catch (error) {
      console.warn(`⚠️ Error en fade out de ${soundName}:`, error);
    }
  },

  /**
   * Reproduce sonido con pitch modificado (experimental)
   */
  playSoundWithPitch(soundName, pitchFactor = 1.0) {
    if (!this.sounds[soundName]) return;

    try {
      const sound = this.sounds[soundName];
      const audioClone = sound.audio.cloneNode();
      audioClone.volume = sound.baseVolume * this.masterVolume;
      audioClone.playbackRate = Math.max(0.5, Math.min(2.0, pitchFactor));
      audioClone.play();
    } catch (error) {
      console.warn(`⚠️ Error modificando pitch de ${soundName}:`, error);
    }
  },

  // ======================================================
  // EFECTOS DINÁMICOS
  // ======================================================

  /**
   * Reproduce sonido de explosión con variación aleatoria
   */
  playExplosionSound() {
    const pitchVariation = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
    this.playSoundWithPitch("explosion", pitchVariation);
  },

  /**
   * Reproduce sonido de disparo con variación
   */
  playShootSound() {
    const pitchVariation = 0.9 + Math.random() * 0.2; // 0.9 - 1.1
    this.playSoundWithPitch("shoot", pitchVariation);
  },

  /**
   * Reproduce sonido de golpe con intensidad variable
   */
  playHitSound(intensity = 1.0) {
    const volume = Math.max(0.3, Math.min(1.0, intensity));
    const soundClone = this.sounds.hit?.audio.cloneNode();

    if (soundClone) {
      soundClone.volume =
        this.sounds.hit.baseVolume * this.masterVolume * volume;
      soundClone.play().catch((error) => {
        console.warn("⚠️ Error reproduciendo hit sound:", error);
      });
    }
  },

  // ======================================================
  // GESTIÓN DE CONTEXTO DE AUDIO
  // ======================================================

  /**
   * Intenta reanudar el contexto de audio (para navegadores modernos)
   */
  resumeAudioContext() {
    // Algunos navegadores requieren interacción del usuario para audio
    document.addEventListener(
      "click",
      () => {
        if (!this.backgroundMusicPlaying && this.sounds.background) {
          this.startBackgroundMusic();
        }
      },
      { once: true }
    );

    document.addEventListener(
      "keydown",
      () => {
        if (!this.backgroundMusicPlaying && this.sounds.background) {
          this.startBackgroundMusic();
        }
      },
      { once: true }
    );

    document.addEventListener(
      "touchstart",
      () => {
        if (!this.backgroundMusicPlaying && this.sounds.background) {
          this.startBackgroundMusic();
        }
      },
      { once: true }
    );
  },

  // ======================================================
  // UTILIDADES Y ESTADO
  // ======================================================

  /**
   * Verifica si un sonido está cargado
   */
  isSoundLoaded(soundName) {
    return this.sounds[soundName]?.loaded || false;
  },

  /**
   * Verifica si la música de fondo está reproduciéndose
   */
  isBackgroundMusicPlaying() {
    return this.backgroundMusicPlaying;
  },

  /**
   * Obtiene información de todos los sonidos
   */
  getSoundInfo() {
    const info = {};
    for (const [key, sound] of Object.entries(this.sounds)) {
      info[key] = {
        loaded: sound.loaded,
        baseVolume: sound.baseVolume,
        currentVolume: sound.audio.volume,
        duration: sound.audio.duration || 0,
      };
    }
    return info;
  },

  /**
   * Precarga todos los sonidos
   */
  preloadAllSounds() {
    for (const [key, sound] of Object.entries(this.sounds)) {
      if (!sound.loaded) {
        sound.audio.load();
      }
    }
    console.log("🔊 Precargando todos los sonidos...");
  },

  /**
   * Detiene todos los sonidos activos
   */
  stopAllSounds() {
    for (const [key, sound] of Object.entries(this.sounds)) {
      if (sound.audio) {
        sound.audio.pause();
        sound.audio.currentTime = 0;
      }
    }
    this.backgroundMusicPlaying = false;
    console.log("🔇 Todos los sonidos detenidos");
  },

  // ======================================================
  // EVENTOS Y LIMPIEZA
  // ======================================================

  /**
   * Limpia recursos de audio - CORREGIDO
   */
  cleanup() {
    this.stopAllSounds();

    // 🔥 CORREGIDO: Remover event listeners específicos
    if (this.visibilityChangeHandler) {
      document.removeEventListener(
        "visibilitychange",
        this.visibilityChangeHandler
      );
    }

    if (this.blurHandler) {
      window.removeEventListener("blur", this.blurHandler);
    }

    if (this.focusHandler) {
      window.removeEventListener("focus", this.focusHandler);
    }

    // Limpiar event listeners y recursos
    for (const [key, sound] of Object.entries(this.sounds)) {
      if (sound.audio) {
        sound.audio.removeEventListener("canplaythrough", () => {});
        sound.audio.removeEventListener("error", () => {});
      }
    }

    console.log("🧹 Recursos de audio limpiados");
  },

  // ======================================================
  // GETTERS Y SETTERS
  // ======================================================

  /**
   * Obtiene el volumen de un sonido específico
   */
  getSoundVolume(soundName) {
    return this.sounds[soundName]?.baseVolume || 0;
  },

  /**
   * Establece el volumen base de un sonido específico
   */
  setSoundVolume(soundName, volume) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].baseVolume = Math.max(0, Math.min(1, volume));
      this.sounds[soundName].audio.volume =
        this.sounds[soundName].baseVolume * this.masterVolume;
    }
  },

  /**
   * Obtiene la lista de sonidos disponibles
   */
  getAvailableSounds() {
    return Object.keys(this.sounds);
  },

  /**
   * 🔥 NUEVO: Reanuda solo la música de fondo (no efectos) - CORREGIDO
   */
  resumeBackgroundAudio() {
    // Solo reanudar si fue pausado por visibilidad
    if (!this.pausedByVisibility) return;

    // Restaurar volumen completo de música de fondo
    if (this.sounds.background && this.sounds.background.audio) {
      this.sounds.background.audio.volume =
        this.sounds.background.baseVolume * this.masterVolume;

      // Si no está reproduciéndose, intentar reanudar
      if (this.sounds.background.audio.paused) {
        const playPromise = this.sounds.background.audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.backgroundMusicPlaying = true;
              console.log("🎵 Música de fondo reanudada");
            })
            .catch((error) => {
              console.warn("⚠️ Error reanudando música:", error);
            });
        }
      }
    }

    this.pausedByVisibility = false;
  },
};

// Hacer disponible globalmente
window.AudioManager = AudioManager;

console.log("🔊 audio.js cargado - Sistema de audio listo");
