document.addEventListener("DOMContentLoaded", function () {
  const skull = document.createElement("div");
  skull.id = "skull";
  skull.innerHTML = "💀"; // Representa la calavera
  document.getElementById("game-board").appendChild(skull);

  const gameContainer = document.getElementById("game-container");
  const startButton = document.getElementById("play-button");
  const gameBoard = document.getElementById("game-board");
  const winMessage = document.getElementById("win-message");
  const loseMessage = document.getElementById("lose-message");
  let skullPositionX = 125; // Posición inicial de la calavera en el eje X
  let bullets = [];
  let level = 1;
  let enemySpeed = 1;

  // Mostrar el tablero del juego y ocultar la pantalla de bienvenida
  startButton.addEventListener("click", function () {
    document.getElementById("welcome-screen").style.display = "none";
    gameBoard.style.display = "flex";
  });

  // Mover la calavera con las teclas de flecha
  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      skullPositionX = Math.max(0, skullPositionX - 10);
    } else if (event.key === "ArrowRight") {
      skullPositionX = Math.min(250, skullPositionX + 10); // Evitar que se mueva fuera del área del tablero
    } else if (event.key === " ") {
      createBullet();
    }
    skull.style.left = skullPositionX + "px"; // Actualiza la posición de la calavera
  });

  // Crear el hueso (disparo) cuando se presiona la barra espaciadora
  function createBullet() {
    if (bullets.length === 0) {
      const bullet = document.createElement("div");
      bullet.classList.add("bullet");
      bullet.style.left = skullPositionX + 15 + "px"; // Centrado en la calavera
      bullet.style.bottom = "70px"; // Posición inicial
      bullet.innerHTML = "🦴"; // Hueso
      document.getElementById("game-board").appendChild(bullet);
      bullets.push(bullet);
      moveBullet(bullet);
    }
  }

  // Mover los huesos
  function moveBullet(bullet) {
    let bulletPosition = parseInt(bullet.style.bottom);
    const bulletInterval = setInterval(function () {
      if (bulletPosition < 600) {
        bulletPosition += 5 * level; // Aumenta la velocidad conforme el nivel sube
        bullet.style.bottom = bulletPosition + "px";
      } else {
        clearInterval(bulletInterval);
        bullet.remove();
        bullets.shift(); // Quita el primer hueso
      }
    }, 20);
  }

  // Aumentar la velocidad del juego al subir de nivel
  function levelUp() {
    level++;
    enemySpeed += 0.5;
    bullets.forEach((bullet) => clearInterval(bullet.interval));
    bullets = []; // Restablecer los disparos
    // Aquí podrías ajustar la velocidad de los enemigos y otros elementos de acuerdo a 'enemySpeed'
  }

  // Simular enemigos que se mueven hacia abajo
  function spawnEnemies() {
    const enemy = document.createElement("div");
    enemy.classList.add("enemy");
    enemy.style.left = Math.random() * 250 + "px"; // Posición aleatoria inicial
    enemy.style.top = "0px";
    document.getElementById("game-board").appendChild(enemy);
    moveEnemy(enemy);
  }

  // Mover los enemigos
  function moveEnemy(enemy) {
    let enemyPosition = 0;
    const enemyInterval = setInterval(() => {
      enemyPosition += enemySpeed;
      enemy.style.top = enemyPosition + "px";

      // Colisión con los huesos
      bullets.forEach((bullet, index) => {
        if (
          bullet.offsetTop >= enemy.offsetTop &&
          bullet.offsetTop <= enemy.offsetTop + 50 &&
          bullet.offsetLeft >= enemy.offsetLeft &&
          bullet.offsetLeft <= enemy.offsetLeft + 50
        ) {
          enemy.remove();
          bullet.remove();
          bullets.shift(); // Quita el primer hueso
          levelUp();
        }
      });

      // Colisión con la calavera
      if (enemyPosition >= 600) {
        clearInterval(enemyInterval);
        enemy.remove();
        gameOver();
      }
    }, 100);
  }

  // Manejar el final del juego
  function gameOver() {
    winMessage.style.display = "none";
    loseMessage.style.display = "block";
  }

  // Generar enemigos continuamente
  setInterval(spawnEnemies, 2000); // Espacio de tiempo para spawnear enemigos
});
