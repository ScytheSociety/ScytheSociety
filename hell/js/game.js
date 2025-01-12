class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.player = null;
    this.blocks = [];
    this.platforms = [];
    this.sounds = [];
    this.backgroundMusic = null;
    this.isPlaying = false;
    this.meta = null;
    this.playerImage = null;
    this.blockImage = null;
    this.backgroundImage = null;
    this.cameraOffset = 0;
    this.keys = {
      left: false,
      right: false,
    };
    this.touchStart = null;
    this.lastTouchTime = 0;
    this.doubleTapDelay = 300;
    this.scale = 1;
    this.baseWidth = 1920;
    this.baseHeight = 1080;

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    this.setupControls();
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      if (e.code === "ArrowLeft") this.keys.left = true;
      if (e.code === "ArrowRight") this.keys.right = true;
      if (e.code === "Space") this.jump();
    });

    document.addEventListener("keyup", (e) => {
      if (e.code === "ArrowLeft") this.keys.left = false;
      if (e.code === "ArrowRight") this.keys.right = false;
    });

    this.canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        const currentTime = Date.now();
        if (currentTime - this.lastTouchTime < this.doubleTapDelay) {
          this.jump();
        }
        this.lastTouchTime = currentTime;
        this.touchStart = e.touches[0].clientX;
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        if (this.touchStart === null) return;
        const touchCurrent = e.touches[0].clientX;
        const diff = touchCurrent - this.touchStart;

        this.keys.left = diff < -10;
        this.keys.right = diff > 10;

        this.touchStart = touchCurrent;
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        this.keys.left = false;
        this.keys.right = false;
        this.touchStart = null;
      },
      { passive: false }
    );
  }

  resizeCanvas() {
    const container = document.getElementById("gameContainer");
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;

    const scaleX = containerWidth / this.baseWidth;
    const scaleY = containerHeight / this.baseHeight;
    this.scale = Math.min(scaleX, scaleY);

    if (this.player) {
      this.player.speed = 5 * this.scale;
      this.player.width = 50 * this.scale;
      this.player.height = 50 * this.scale;
      this.player.jumpForce = -15 * this.scale;
      this.player.gravity = 0.8 * this.scale;
    }
  }

  async init() {
    await this.loadResources();

    const scaledPlayerSize = 50 * this.scale;
    this.player = {
      x: 50,
      y: this.canvas.height - scaledPlayerSize - 50,
      width: scaledPlayerSize,
      height: scaledPlayerSize,
      speed: 5 * this.scale,
      jumping: false,
      jumpForce: -15 * this.scale,
      velocity: 0,
      gravity: 0.8 * this.scale,
      onGround: false,
    };

    this.initBlocksAndPlatforms();
    this.gameLoop();
  }

  async loadResources() {
    await Promise.all([
      new Promise((resolve) => {
        this.playerImage = new Image();
        this.playerImage.onload = resolve;
        this.playerImage.src = "assets/images/player/player.png";
      }),
      new Promise((resolve) => {
        this.blockImage = new Image();
        this.blockImage.onload = resolve;
        this.blockImage.src = "assets/images/blocks/block.png";
      }),
      new Promise((resolve) => {
        this.backgroundImage = new Image();
        this.backgroundImage.onload = resolve;
        this.backgroundImage.src = "assets/images/backgrounds/background.png";
      }),
    ]);

    for (let i = 1; i <= 22; i++) {
      const audio = new Audio(`assets/audio/sound${i}.mp3`);
      audio.volume = 0.5;
      this.sounds.push(audio);
    }

    this.backgroundMusic = new Audio("assets/audio/background-music.mp3");
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.2;
  }

  initBlocksAndPlatforms() {
    this.platforms.push({
      x: 0,
      y: this.canvas.height - 50 * this.scale,
      width: this.canvas.width * 3,
      height: 50 * this.scale,
    });

    const blockConfigs = [
      { name: "AILIN", height: 200 },
      { name: "ALACRAN", height: 150 },
      { name: "AMAZEUS", height: 250 },
      { name: "ESTEBAN", height: 180 },
      { name: "FORZA", height: 220 },
      { name: "FYE", height: 160 },
      { name: "GIKAL", height: 240 },
      { name: "ITOLMASTER", height: 190 },
      { name: "JONY", height: 170 },
      { name: "JOSUEMAGIC", height: 210 },
      { name: "LIGHTO", height: 230 },
      { name: "MIU", height: 200 },
      { name: "MUNKY", height: 260 },
      { name: "PALADINOSAURIO", height: 180 },
      { name: "PANDA", height: 220 },
      { name: "PAPERMAN", height: 170 },
      { name: "RAMLOZ", height: 240 },
      { name: "RODRI", height: 190 },
      { name: "ROSSEN", height: 210 },
      { name: "SCYTHE", height: 230 },
      { name: "TOMCRUZ", height: 200 },
      { name: "RED", height: 250 },
    ];

    let lastX = 300 * this.scale;
    blockConfigs.forEach((config, i) => {
      const scaledHeight = config.height * this.scale;
      const block = {
        x: lastX,
        y: this.canvas.height - scaledHeight,
        width: 50 * this.scale,
        height: 50 * this.scale,
        name: config.name,
        broken: false,
        respawnTime: null,
      };
      this.blocks.push(block);

      if (config.height > 150) {
        let platformHeight = 150;
        while (platformHeight < config.height - 50) {
          this.platforms.push({
            x: lastX - 70 * this.scale,
            y: this.canvas.height - platformHeight * this.scale,
            width: 50 * this.scale,
            height: 20 * this.scale,
          });
          platformHeight += 100;
        }
      }

      lastX += 200 * this.scale;
    });

    this.meta = {
      x: lastX + 100 * this.scale,
      y: this.canvas.height - 150 * this.scale,
      width: 50 * this.scale,
      height: 150 * this.scale,
    };
  }

  update() {
    if (!this.isPlaying) return;

    if (this.keys.left) this.player.x -= this.player.speed;
    if (this.keys.right) this.player.x += this.player.speed;

    this.player.velocity += this.player.gravity;
    this.player.y += this.player.velocity;

    this.player.x = Math.max(
      0,
      Math.min(this.player.x, this.meta.x + 100 * this.scale)
    );

    const idealOffset = -this.player.x + this.canvas.width * 0.3;
    const maxOffset = 0;
    const minOffset = -this.meta.x + this.canvas.width * 0.7;
    this.cameraOffset = Math.max(minOffset, Math.min(maxOffset, idealOffset));

    this.player.onGround = false;

    this.platforms.forEach((platform) => {
      if (this.checkCollision(this.player, platform)) {
        if (this.player.velocity > 0) {
          this.player.y = platform.y - this.player.height;
          this.player.velocity = 0;
          this.player.onGround = true;
          this.player.jumping = false;
        }
      }
    });

    const currentTime = Date.now();
    this.blocks.forEach((block, index) => {
      if (!block.broken && this.checkCollision(this.player, block)) {
        block.broken = true;
        block.respawnTime = currentTime + 10000;
        if (this.sounds[index]) {
          this.sounds[index].play();
        }
      }

      if (
        block.broken &&
        block.respawnTime &&
        currentTime >= block.respawnTime
      ) {
        block.broken = false;
        block.respawnTime = null;
      }
    });

    if (this.checkCollision(this.player, this.meta)) {
      this.victory();
    }
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(this.cameraOffset, 0);
    this.ctx.scale(this.scale, this.scale);

    // Dibujar fondo
    if (this.backgroundImage) {
      const bgWidth = this.canvas.width / this.scale;
      const bgHeight = this.canvas.height / this.scale;
      this.ctx.drawImage(
        this.backgroundImage,
        -this.cameraOffset / this.scale,
        0,
        bgWidth,
        bgHeight
      );
    } else {
      const bgWidth = this.canvas.width / this.scale;
      const bgHeight = this.canvas.height / this.scale;
      this.ctx.fillStyle = "#87CEEB";
      this.ctx.fillRect(-this.cameraOffset / this.scale, 0, bgWidth, bgHeight);
    }

    this.ctx.fillStyle = "#8B4513";
    this.platforms.forEach((platform) => {
      this.ctx.fillRect(
        platform.x,
        platform.y,
        platform.width,
        platform.height
      );
    });

    this.blocks.forEach((block) => {
      if (!block.broken) {
        if (this.blockImage) {
          this.ctx.drawImage(
            this.blockImage,
            block.x,
            block.y,
            block.width,
            block.height
          );
        } else {
          this.ctx.fillStyle = "#4CAF50";
          this.ctx.fillRect(block.x, block.y, block.width, block.height);
        }

        this.ctx.fillStyle = "white";
        this.ctx.strokeStyle = "black";
        this.ctx.font = "bold 16px Arial";
        this.ctx.textAlign = "center";
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(
          block.name,
          block.x + block.width / 2,
          block.y - 15
        );
        this.ctx.fillText(block.name, block.x + block.width / 2, block.y - 15);
      }
    });

    this.ctx.fillStyle = "#FF4081";
    this.ctx.fillRect(
      this.meta.x,
      this.meta.y,
      this.meta.width,
      this.meta.height
    );

    this.ctx.fillStyle = "white";
    this.ctx.strokeStyle = "black";
    this.ctx.font = "bold 24px Arial";
    this.ctx.lineWidth = 4;
    this.ctx.strokeText(
      "META",
      this.meta.x + this.meta.width / 2,
      this.meta.y - 20
    );
    this.ctx.fillText(
      "META",
      this.meta.x + this.meta.width / 2,
      this.meta.y - 20
    );

    if (this.playerImage) {
      this.ctx.drawImage(
        this.playerImage,
        this.player.x,
        this.player.y,
        this.player.width,
        this.player.height
      );
    } else {
      this.ctx.fillStyle = "#2196F3";
      this.ctx.fillRect(
        this.player.x,
        this.player.y,
        this.player.width,
        this.player.height
      );
    }

    this.ctx.restore();
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  start() {
    this.isPlaying = true;
    document.getElementById("startScreen").style.display = "none";
    this.canvas.style.display = "block";
    this.backgroundMusic.play();
  }

  victory() {
    this.isPlaying = false;
    this.backgroundMusic.pause();
    alert("¡FELIZ CUMPLEAÑOS HELL!");
    location.reload();
  }

  jump() {
    if (this.player.onGround) {
      this.player.jumping = true;
      this.player.velocity = this.player.jumpForce;
      this.player.onGround = false;
    }
  }
}

export default Game;
