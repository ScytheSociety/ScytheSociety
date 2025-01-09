let gameArea, player, level = 1, score = 0, enemiesKilled = 0, boneCooldown = 1000;
let enemySpeed = 1, enemyDropSpeed = 2;
let lastBoneTime = 0;
let intervalId, startTime, isGameRunning = false;
let playerSpeed = 20;

document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("saveScore").addEventListener("click", saveScore);
document.getElementById("rankingButton").addEventListener("click", showRanking);

function startGame() {
    if (isGameRunning) return;
    
    document.getElementById("startButton").style.display = "none";
    document.getElementById("rankingButton").style.display = "block";
    gameArea = document.getElementById("gameArea");
    startTime = Date.now();
    isGameRunning = true;
    
    resetGameStats();
    initGame();
}

function resetGameStats() {
    level = 1;
    score = 0;
    enemiesKilled = 0;
    boneCooldown = config.difficulty[1].boneCooldown;
    enemySpeed = config.difficulty[1].enemySpeed;
    enemyDropSpeed = config.difficulty[1].enemyDropSpeed;
    playerSpeed = config.player.speed;
    
    updateGameStats();
}

function updateGameStats() {
    document.getElementById("levelText").textContent = `Nivel: ${level}`;
    document.getElementById("scoreText").textContent = `Puntuación: ${score}`;
    document.getElementById("enemiesKilledText").textContent = `Enemigos eliminados: ${enemiesKilled}`;
}

function initGame() {
    createPlayer();
    spawnEnemies();
    intervalId = setInterval(() => {
        moveEnemies();
        if (Math.random() < config.game.powerUpFrequency) {
            spawnPowerUp();
        }
    }, 50);
}

function createPlayer() {
    player = document.createElement("img");
    player.src = config.player.image;
    player.classList.add("player");
    player.style.left = "375px";
    player.style.bottom = "10px";
    gameArea.appendChild(player);

    document.addEventListener("keydown", handlePlayerMovement);
    document.addEventListener("keydown", handleShooting);
}

function handlePlayerMovement(event) {
    if (!isGameRunning) return;
    
    const left = parseInt(player.style.left);
    if ((event.key === "a" || event.key === "ArrowLeft") && left > 0) {
        player.style.left = `${left - playerSpeed}px`;
    } else if ((event.key === "d" || event.key === "ArrowRight") && left < config.game.width - 50) {
        player.style.left = `${left + playerSpeed}px`;
    }
}

function handleShooting(event) {
    if (!isGameRunning || event.code !== "Space") return;
    
    const now = Date.now();
    if (now - lastBoneTime < boneCooldown) return;
    
    lastBoneTime = now;
    createBone();
}

function createBone() {
    const bone = document.createElement("img");
    bone.src = config.bone.image;
    bone.classList.add("bone");
    bone.style.left = `${parseInt(player.style.left) + 20}px`;
    bone.style.bottom = "60px";
    gameArea.appendChild(bone);

    moveBone(bone);
}

function moveBone(bone) {
    const interval = setInterval(() => {
        const bottom = parseInt(bone.style.bottom);
        if (bottom > config.game.height) {
            bone.remove();
            clearInterval(interval);
        } else {
            bone.style.bottom = `${bottom + config.bone.speed}px`;
        }
    }, 20);
}

function spawnEnemies() {
    const enemyCount = Math.min(config.game.initialEnemyCount + level - 1, 10);
    for (let i = 0; i < enemyCount; i++) {
        createEnemy();
    }
}

function createEnemy() {
    const enemy = document.createElement("img");
    enemy.src = config.enemies[level];
    enemy.classList.add("enemy");
    enemy.style.left = `${Math.random() * (config.game.width - 50)}px`;
    enemy.style.top = `${Math.random() * -600}px`;
    gameArea.appendChild(enemy);
}

function moveEnemies() {
    document.querySelectorAll(".enemy").forEach(enemy => {
        const top = parseInt(enemy.style.top);
        const left = parseInt(enemy.style.left);
        
        if (level > 5) {
            const amplitude = 30;
            const frequency = 0.05;
            const horizontalMove = Math.sin(top * frequency) * amplitude;
            enemy.style.left = `${Math.min(Math.max(left + horizontalMove, 0), config.game.width - 50)}px`;
        } else {
            enemy.style.left = `${Math.min(Math.max(left + (Math.random() < 0.5 ? -enemySpeed : enemySpeed), 0), config.game.width - 50)}px`;
        }
        
        enemy.style.top = `${top + enemyDropSpeed}px`;
        
        if (top > config.game.height - 50) {
            endGame("¡Perdiste! Un enemigo alcanzó tu posición.");
        }
    });
    
    checkCollisions();
}

function spawnPowerUp() {
  const powerUp = document.createElement("img");
  const type = Math.random() < 0.5 ? "speedBoost" : "rapidFire";
  
  powerUp.src = config.powerUps[type].image;
  powerUp.classList.add("power-up", type);
  powerUp.style.left = `${Math.random() * (config.game.width - 30)}px`;
  powerUp.style.top = "0px";
  powerUp.dataset.type = type;
  gameArea.appendChild(powerUp);

  movePowerUp(powerUp);
}

function movePowerUp(powerUp) {
  const interval = setInterval(() => {
      const top = parseInt(powerUp.style.top) + 2;
      if (top > config.game.height) {
          powerUp.remove();
          clearInterval(interval);
      } else {
          powerUp.style.top = `${top}px`;
      }
  }, 20);
}

function checkCollisions() {
  const bones = document.querySelectorAll(".bone");
  const enemies = document.querySelectorAll(".enemy");
  const powerUps = document.querySelectorAll(".power-up");
  
  bones.forEach(bone => {
      const boneRect = bone.getBoundingClientRect();
      
      enemies.forEach(enemy => {
          const enemyRect = enemy.getBoundingClientRect();
          
          if (isColliding(boneRect, enemyRect)) {
              handleEnemyDeath(enemy);
              bone.remove();
          }
      });
  });
  
  powerUps.forEach(powerUp => {
      const powerUpRect = powerUp.getBoundingClientRect();
      const playerRect = player.getBoundingClientRect();
      
      if (isColliding(powerUpRect, playerRect)) {
          handlePowerUpCollection(powerUp);
      }
  });
}

function handlePowerUpCollection(powerUp) {
  const type = powerUp.dataset.type;
  const powerUpConfig = config.powerUps[type];
  
  if (type === "speedBoost") {
      const originalSpeed = playerSpeed;
      playerSpeed *= powerUpConfig.multiplier;
      setTimeout(() => playerSpeed = originalSpeed, powerUpConfig.duration);
  } else if (type === "rapidFire") {
      const originalCooldown = boneCooldown;
      boneCooldown = powerUpConfig.cooldown;
      setTimeout(() => boneCooldown = originalCooldown, powerUpConfig.duration);
  }
  
  powerUp.remove();
}

function isColliding(rect1, rect2) {
  return !(rect1.right < rect2.left || 
           rect1.left > rect2.right || 
           rect1.bottom < rect2.top || 
           rect1.top > rect2.bottom);
}

function handleEnemyDeath(enemy) {
  createExplosion(enemy);
  enemy.remove();
  enemiesKilled++;
  score += 100 * level;
  updateGameStats();
  checkLevelProgress();
}

function createExplosion(enemy) {
  const explosion = document.createElement("div");
  explosion.classList.add("explosion");
  explosion.style.left = enemy.style.left;
  explosion.style.top = enemy.style.top;
  gameArea.appendChild(explosion);
  
  setTimeout(() => explosion.remove(), 500);
}

function checkLevelProgress() {
  if (level <= 10 && enemiesKilled >= config.game.enemiesToAdvance[level - 1]) {
      levelUp();
  }
  
  // Regenerar enemigos si no hay suficientes
  const currentEnemies = document.querySelectorAll(".enemy").length;
  if (currentEnemies < 3) {
      spawnEnemies();
  }
}

function levelUp() {
  if (level < 10) {
      level++;
      const difficulty = config.difficulty[level];
      enemySpeed = difficulty.enemySpeed;
      enemyDropSpeed = difficulty.enemyDropSpeed;
      boneCooldown = difficulty.boneCooldown;
      
      showLevelUpMessage();
      updateGameStats();
      spawnEnemies();
  } else if (level === 10 && enemiesKilled >= config.game.enemiesToAdvance[9]) {
      endGame("¡Felicidades! ¡Has completado todos los niveles!");
  }
}

function showLevelUpMessage() {
  const message = document.createElement("div");
  message.classList.add("level-up-message");
  message.textContent = `¡Nivel ${level}!`;
  gameArea.appendChild(message);
  
  setTimeout(() => {
      message.style.opacity = "0";
      setTimeout(() => message.remove(), 1000);
  }, 2000);
}

function endGame(message) {
  isGameRunning = false;
  clearInterval(intervalId);
  
  const timePlayed = Math.floor((Date.now() - startTime) / 1000);
  const gameOverModal = document.getElementById("gameOver");
  const gameOverTitle = document.getElementById("gameOverTitle");
  const gameOverStats = document.getElementById("gameOverStats");
  
  gameOverTitle.textContent = message;
  gameOverStats.innerHTML = `
      Nivel alcanzado: ${level}<br>
      Puntuación final: ${score}<br>
      Enemigos eliminados: ${enemiesKilled}<br>
      Tiempo jugado: ${timePlayed} segundos
  `;
  
  gameOverModal.style.display = "block";
}

function saveScore() {
  const playerName = document.getElementById("playerName").value;
  if (!playerName || playerName.length < 3 || playerName.length > 4) {
      alert("Por favor, ingresa un nombre válido (3-4 caracteres)");
      return;
  }
  
  const gameData = {
      name: playerName,
      level,
      score,
      enemiesKilled,
      timePlayed: Math.floor((Date.now() - startTime) / 1000),
      result: level === 10 ? "Ganó" : "Perdió"
  };
  
  fetch("saveData.php", {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify(gameData)
  })
  .then(response => response.json())
  .then(data => {
      if (data.status === "success") {
          alert("¡Puntuación guardada! Recarga la página para jugar de nuevo.");
          location.reload();
      } else {
          alert("Error al guardar la puntuación. Intenta de nuevo.");
      }
  })
  .catch(error => {
      alert("Error al guardar la puntuación. Intenta de nuevo.");
      console.error(error);
  });
}

function showRanking() {
    fetch("getRanking.php")
        .then(response => response.json())
        .then(data => {
            const rankingList = document.getElementById("rankingList");
            rankingList.innerHTML = '';

            data.slice(0, 50).forEach((item, index) => {
                const rankingItem = document.createElement("div");
                rankingItem.className = "ranking-item";
                rankingItem.innerHTML = `
                    <span>#${index + 1}</span>
                    <span>${item.name}</span>
                    <span>${item.score} pts</span>
                    <span>Nivel ${item.level}</span>
                `;
                rankingList.appendChild(rankingItem);
            });

            document.getElementById("rankingModal").style.display = "block";
        })
        .catch(error => console.error('Error al cargar ranking:', error));
}

function closeRanking() {
    document.getElementById("rankingModal").style.display = "none";
}

function saveScore() {
    const playerName = document.getElementById("playerName").value;
    if (!playerName || playerName.length < 3 || playerName.length > 4) {
        alert("Por favor, ingresa un nombre válido (3-4 caracteres)");
        return;
    }
    
    const gameData = {
        name: playerName,
        level,
        score,
        enemiesKilled,
        timePlayed: Math.floor((Date.now() - startTime) / 1000),
        result: level === 10 ? "Ganó" : "Perdió"
    };
    
    fetch("saveData.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(gameData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            alert("¡Puntuación guardada!");
            showRanking();
        } else {
            alert("Error al guardar la puntuación. Intenta de nuevo.");
        }
    })
    .catch(error => {
        alert("Error al guardar la puntuación. Intenta de nuevo.");
        console.error(error);
    });
}