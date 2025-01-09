let config; // Para almacenar la configuración
let gameArea, player, level = 1, score = 0, enemiesKilled = 0, boneCooldown = 1000;
let enemySpeed = 1, enemyDropSpeed = 2;
let lastBoneTime = 0;
let animationId, startTime, isGameRunning = false;
let playerSpeed = 20;
let activePowerUps = {
    speedBoost: false,
    rapidFire: false
};

// Cargar la configuración antes de iniciar el juego
async function loadConfig() {
    try {
        const response = await fetch('../codigos/config.json');
        if (!response.ok) throw new Error('Error al cargar la configuración');
        config = await response.json();
        return true;
    } catch (error) {
        console.error("Error cargando config.json:", error);
        logErrorToServer(error.message, error.stack);
        return false;
    }
}

// Inicialización del juego
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Cargar configuración primero
        if (!await loadConfig()) {
            alert("Error al cargar la configuración del juego");
            return;
        }

        gameArea = document.getElementById("gameArea");
        if (!gameArea) throw new Error("No se encontró el área del juego.");

        document.getElementById("startButton").addEventListener("click", startGame);
        document.getElementById("saveScore").addEventListener("click", saveScore);
        document.getElementById("rankingButton").addEventListener("click", showRanking);
    } catch (error) {
        console.error("Error en la inicialización del juego: ", error);
        logErrorToServer(error.message, error.stack);
    }
});

function startGame() {
    if (isGameRunning) return;
    
    gameArea.innerHTML = '';
    
    document.getElementById("startButton").style.display = "none";
    document.getElementById("rankingButton").style.display = "block";
    startTime = Date.now();
    isGameRunning = true;
    
    resetGameStats();
    createPlayer();
    spawnEnemies();
    
    // Iniciar el bucle del juego usando requestAnimationFrame
    gameLoop();
}

function gameLoop() {
    if (!isGameRunning) return;
    
    moveEnemies();
    if (Math.random() < config.game.powerUpFrequency) {
        spawnPowerUp();
    }
    
    animationId = requestAnimationFrame(gameLoop);
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

function createPlayer() {
    player = document.createElement("img");
    player.src = config.player.image;
    player.classList.add("player");
    player.style.left = `${config.game.width / 2 - config.player.width / 2}px`;
    player.style.bottom = "10px";
    player.style.width = `${config.player.width}px`;
    player.style.height = `${config.player.height}px`;
    gameArea.appendChild(player);

    document.addEventListener("keydown", handlePlayerMovement);
    document.addEventListener("keydown", handleShooting);
}

function handlePlayerMovement(event) {
    if (!isGameRunning) return;
    
    const left = parseInt(player.style.left);
    if ((event.key === "a" || event.key === "ArrowLeft") && left > 0) {
        player.style.left = `${left - playerSpeed}px`;
    } else if ((event.key === "d" || event.key === "ArrowRight") && left < config.game.width - config.player.width) {
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
    bone.style.left = `${parseInt(player.style.left) + (config.player.width / 2) - (config.bone.width / 2)}px`;
    bone.style.bottom = "60px";
    bone.style.width = `${config.bone.width}px`;
    bone.style.height = `${config.bone.height}px`;
    gameArea.appendChild(bone);

    moveBone(bone);
}

function moveBone(bone) {
    const interval = setInterval(() => {
        if (!isGameRunning) {
            clearInterval(interval);
            return;
        }
        
        const bottom = parseInt(bone.style.bottom);
        if (bottom > config.game.height) {
            bone.remove();
            clearInterval(interval);
        } else {
            bone.style.bottom = `${bottom + config.bone.speed}px`;
        }
    }, 20);
}

// Función para los power-ups
function spawnPowerUp() {
    const powerUpTypes = ['speedBoost', 'rapidFire'];
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    const powerUp = document.createElement("img");
    powerUp.src = config.powerUps[type].image;
    powerUp.classList.add("power-up");
    powerUp.dataset.type = type;
    powerUp.style.left = `${Math.random() * (config.game.width - 30)}px`;
    powerUp.style.top = "0px";
    gameArea.appendChild(powerUp);

    movePowerUp(powerUp);
}

function movePowerUp(powerUp) {
    const interval = setInterval(() => {
        if (!isGameRunning) {
            clearInterval(interval);
            powerUp.remove();
            return;
        }

        const top = parseInt(powerUp.style.top);
        if (top > config.game.height) {
            powerUp.remove();
            clearInterval(interval);
        } else {
            powerUp.style.top = `${top + 2}px`;
        }
    }, 20);
}

function handlePowerUpCollection(powerUp) {
    const type = powerUp.dataset.type;
    powerUp.remove();

    // Mostrar mensaje de power-up
    const message = document.createElement("div");
    message.classList.add("power-up-message");
    message.textContent = type === 'speedBoost' ? '¡Velocidad aumentada!' : '¡Disparo rápido!';
    gameArea.appendChild(message);
    
    setTimeout(() => {
        message.style.opacity = "0";
        setTimeout(() => message.remove(), 1000);
    }, 2000);

    if (type === 'speedBoost') {
        activatePowerUp('speedBoost');
    } else if (type === 'rapidFire') {
        activatePowerUp('rapidFire');
    }
}

function activatePowerUp(type) {
    if (type === 'speedBoost') {
        activePowerUps.speedBoost = true;
        playerSpeed = config.player.speed * config.powerUps.speedBoost.multiplier;
        setTimeout(() => {
            if (isGameRunning) {
                activePowerUps.speedBoost = false;
                playerSpeed = config.player.speed;
            }
        }, config.powerUps.speedBoost.duration);
    } else if (type === 'rapidFire') {
        activePowerUps.rapidFire = true;
        const originalCooldown = boneCooldown;
        boneCooldown = config.powerUps.rapidFire.cooldown;
        setTimeout(() => {
            if (isGameRunning) {
                activePowerUps.rapidFire = false;
                boneCooldown = originalCooldown;
            }
        }, config.powerUps.rapidFire.duration);
    }
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
    enemy.style.width = "50px";
    enemy.style.height = "50px";
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

function checkCollisions() {
    const bones = document.querySelectorAll(".bone");
    const enemies = document.querySelectorAll(".enemy");
    const powerUps = document.querySelectorAll(".power-up");
    const playerRect = player.getBoundingClientRect();
    
    // Verificar colisión jugador-enemigo
    enemies.forEach(enemy => {
        const enemyRect = enemy.getBoundingClientRect();
        if (isColliding(playerRect, enemyRect)) {
            endGame("¡Perdiste! Un enemigo te alcanzó.");
            return;
        }
    });
    
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
        
        if (isColliding(powerUpRect, playerRect)) {
            handlePowerUpCollection(powerUp);
        }
    });
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
    if (level < 10 && enemiesKilled >= config.game.enemiesToAdvance[level - 1]) {
        levelUp();
    }
    
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
    cancelAnimationFrame(animationId);
    
    // Limpiar power-ups activos
    activePowerUps.speedBoost = false;
    activePowerUps.rapidFire = false;
    playerSpeed = config.player.speed;
    boneCooldown = config.difficulty[level].boneCooldown;
    
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

function logErrorToServer(message, stack) {
    fetch("logError.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message, stack })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Error registrado en el servidor:", data);
    })
    .catch(error => {
        console.error("Error al enviar el log al servidor:", error);
    });
}
