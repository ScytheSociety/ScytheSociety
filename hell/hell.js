document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("startButton");
  const startScreen = document.getElementById("startScreen");
  const playerScreen = document.getElementById("playerScreen");
  const backgroundAudio = document.getElementById("backgroundAudio");
  const trackPlayer = document.getElementById("trackPlayer");
  const prevTrack = document.getElementById("prevTrack");
  const nextTrack = document.getElementById("nextTrack");
  const pauseBackground = document.getElementById("pauseBackground");
  const trackTitle = document.getElementById("trackTitle");

  // Configuración de sonidos
  const backgroundTrack = "assets/sonidos/background.mp3";
  const tracks = [
    "AILIN.mp3",
    "ALACRAN.mp3",
    "AMAZEUS.mp3",
    "ESTEBAN.mp3",
    "FORZA.mp3",
    "FYE.mp3",
    "GIKAL.mp3",
    "ITOLMASTER.mp3",
    "JONY.mp3",
    "JOSUEMAGIC.mp3",
    "LIGHTO.mp3",
    "MIU.mp3",
    "MUNKY.mp3",
    "PALADINOSAURIO.mp3",
    "PANDA.mp3",
    "PAPERMAN.mp3",
    "RAMLOZ.mp3",
    "RODRI.mp3",
    "ROSSEN.mp3",
    "SCYTHE.mp3",
    "TOMCRUZ.mp3",
  ].map((track) => `assets/sonidos/${track}`);
  let currentTrackIndex = 0;

  // Mostrar reproductor
  startButton.addEventListener("click", () => {
    startScreen.classList.add("d-none");
    playerScreen.classList.remove("d-none");

    // Configuración del audio de fondo
    backgroundAudio.src = backgroundTrack;
    backgroundAudio.play();

    // Cargar primera pista
    loadTrack();
  });

  // Funciones para el reproductor
  function loadTrack() {
    trackPlayer.src = tracks[currentTrackIndex];
    trackTitle.textContent = tracks[currentTrackIndex]
      .split("/")
      .pop()
      .replace(".mp3", "");
    trackPlayer.play();
  }

  prevTrack.addEventListener("click", () => {
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadTrack();
  });

  nextTrack.addEventListener("click", () => {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack();
  });

  // Cambiar automáticamente al siguiente archivo MP3
  trackPlayer.addEventListener("ended", () => {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack();
  });

  pauseBackground.addEventListener("click", () => {
    if (backgroundAudio.paused) {
      backgroundAudio.play();
      pauseBackground.textContent = "⏸ Fondo";
    } else {
      backgroundAudio.pause();
      pauseBackground.textContent = "▶ Fondo";
    }
  });
});
