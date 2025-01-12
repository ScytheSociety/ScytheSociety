import Game from "./game.js";

// Inicializar juego
window.onload = () => {
  const game = new Game();
  game.init();

  // Configurar botón de inicio
  document.getElementById("startButton").onclick = () => {
    game.start();
  };

  // Configurar controles
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      game.jump();
    }
  });
};
