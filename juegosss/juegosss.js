let gameArea, player, level = 1, enemiesKilled = 0, boneCooldown = 1000, enemySpeed = 1, enemyDropSpeed = 2;
const enemiesToAdvance = [20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240];
let lastBoneTime = 0, levelText, enemiesKilledText, intervalId, startTime;

document.getElementById("startButton").addEventListener("click", startGame);

function startGame() {
    document.getElementById("startButton").style.display = "none";
    gameArea = document.getElementById("gameArea");
    startTime = Date.now(); // Registra el inicio del juego
    initGame();
}

function initGame() {
    createPlayer();
    createGameStats();
    spawnEnemies();
    intervalId = setInterval(moveEnemies, 50);
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

function createGameStats() {
    const statsContainer = document.createElement("div");
    statsContainer.style.position = "absolute";
    statsContainer.style.top = "10px";
    statsContainer.style.width = "100%";
    statsContainer.style.textAlign = "center";
    statsContainer.style.color = "white";
    statsContainer.style.zIndex = "10";

    levelText = document.createElement("div");
    levelText.textContent = `Nivel: ${level}`;
    statsContainer.appendChild(levelText);

    enemiesKilledText = document.createElement("div");
    enemiesKilledText.textContent = `Enemigos eliminados: ${enemiesKilled}`;
    statsContainer.appendChild(enemiesKilledText);

    gameArea.appendChild(statsContainer);
}

function handlePlayerMovement(event) {
    const left = parseInt(player.style.left);
    if ((event.key === "a" || event.key === "ArrowLeft") && left > 0) {
        player.style.left = `${left - 20}px`;
    } else if ((event.key === "d" || event.key === "ArrowRight") && left < 750) {
        player.style.left = `${left + 20}px`;
    }
}

function handleShooting(event) {
    if (event.code === "Space") {
        const now = Date.now();
        if (now - lastBoneTime < boneCooldown) return;

        lastBoneTime = now;

        const bone = document.createElement("img");
        bone.src = config.bone.image;
        bone.classList.add("bone");
        bone.style.left = `${parseInt(player.style.left) + 20}px`;
        bone.style.bottom = "60px";
        gameArea.appendChild(bone);

        const interval = setInterval(() => {
            const bottom = parseInt(bone.style.bottom);
            if (bottom > 600) {
                bone.remove();
                clearInterval(interval);
            } else {
                bone.style.bottom = `${bottom + config.bone.speed}px`;
            }
        }, 20);
    }
}

function spawnEnemies() {
    const enemyCount = 5;
    for (let i = 0; i < enemyCount; i++) {
        const enemy = document.createElement("img");
        enemy.src = config.enemies[level];
        enemy.classList.add("enemy");
        enemy.style.left = `${Math.random() * 750}px`;
        enemy.style.top = `${Math.random() * -600}px`;
        gameArea.appendChild(enemy);
    }
}

function moveEnemies() {
    document.querySelectorAll(".enemy").forEach(enemy => {
        const top = parseInt(enemy.style.top);
        const left = parseInt(enemy.style.left);

        enemy.style.top = `${top + enemyDropSpeed}px`;
        enemy.style.left = `${Math.min(Math.max(left + (Math.random() < 0.5 ? -enemySpeed : enemySpeed), 0), 750)}px`;

        if (top > 550) endGame("¡Perdiste! Un enemigo alcanzó tu posición.");
    });
}

function endGame(message) {
    alert(message);
    clearInterval(intervalId);
    saveGameData(message.includes("¡Ganaste!"));
}

function saveGameData(didWin) {
    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    const score = enemiesKilled * level;

    const name = prompt("Ingresa tu nombre (3-4 caracteres):");
    if (!name || name.length < 3 || name.length > 4) {
        alert("Nombre inválido. Debe tener entre 3 y 4 caracteres.");
        return;
    }

    const gameData = {
        name,
        level,
        enemiesKilled,
        timePlayed,
        score,
        result: didWin ? "Ganó" : "Perdió"
    };

    fetch("saveData.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(gameData)
    }).then(() => {
        alert("Datos guardados. Recarga la página para jugar de nuevo.");
        location.reload();
    });
}
