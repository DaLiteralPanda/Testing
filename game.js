// Game Configuration
const config = {
    playerSpeed: 5,
    asteroidSpeed: 2,
    asteroidSpawnRate: 60,
    powerUpSpawnRate: 300,
    levelUpScore: 500
};

// Game State
let gameState = {
    isPlaying: false,
    score: 0,
    highScore: localStorage.getItem('spaceExplorerHighScore') || 0,
    level: 1,
    frameCount: 0
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game Objects
class Player {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 100;
        this.speed = config.playerSpeed;
        this.keys = {};
    }

    update() {
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.x -= this.speed;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.x += this.speed;
        }
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.y -= this.speed;
        }
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.y += this.speed;
        }

        // Boundary checking
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }

    draw() {
        // Draw spaceship
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Ship body
        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 20);
        ctx.lineTo(15, 20);
        ctx.closePath();
        ctx.fill();
        
        // Ship window
        ctx.fillStyle = '#4dabf7';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Engine glow
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(-10, 20);
        ctx.lineTo(-5, 25 + Math.random() * 5);
        ctx.lineTo(0, 20);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(5, 25 + Math.random() * 5);
        ctx.lineTo(10, 20);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Asteroid {
    constructor() {
        this.width = 30 + Math.random() * 30;
        this.height = this.width;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = config.asteroidSpeed + (gameState.level - 1) * 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.color = `hsl(${Math.random() * 60 + 20}, 50%, 40%)`;
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        
        // Draw irregular asteroid shape
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
            const angle = (Math.PI * 2 / points) * i;
            const radius = this.width / 2 * (0.7 + Math.random() * 0.3);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    isOffScreen() {
        return this.y > canvas.height;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class PowerUp {
    constructor() {
        this.width = 25;
        this.height = 25;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = 2;
        this.angle = 0;
    }

    update() {
        this.y += this.speed;
        this.angle += 0.05;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);
        
        // Draw star power-up
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#ffed4e';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const x = Math.cos(angle) * 12;
            const y = Math.sin(angle) * 12;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * 5;
            const innerY = Math.sin(innerAngle) * 5;
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    isOffScreen() {
        return this.y > canvas.height;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1;
        this.decay = 0.02;
        this.size = Math.random() * 3 + 1;
        this.color = `hsl(${Math.random() * 60 + 10}, 100%, 60%)`;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

// Game Objects Arrays
let player;
let asteroids = [];
let powerUps = [];
let particles = [];

// Collision Detection
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Create explosion particles
function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y));
    }
}

// Update Score Display
function updateScoreDisplay() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('highScore').textContent = gameState.highScore;
    document.getElementById('level').textContent = gameState.level;
    
    // Pulse animation
    const scoreElement = document.getElementById('score');
    scoreElement.classList.add('pulse');
    setTimeout(() => scoreElement.classList.remove('pulse'), 300);
}

// Game Loop
function gameLoop() {
    if (!gameState.isPlaying) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw player
    player.update();
    player.draw();

    // Spawn asteroids
    if (gameState.frameCount % config.asteroidSpawnRate === 0) {
        asteroids.push(new Asteroid());
    }

    // Spawn power-ups
    if (gameState.frameCount % config.powerUpSpawnRate === 0) {
        powerUps.push(new PowerUp());
    }

    // Update and draw asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].update();
        asteroids[i].draw();

        // Check collision with player
        if (checkCollision(player.getBounds(), asteroids[i].getBounds())) {
            gameOver();
            return;
        }

        // Remove off-screen asteroids and award points
        if (asteroids[i].isOffScreen()) {
            asteroids.splice(i, 1);
            gameState.score += 10;
            updateScoreDisplay();
        }
    }

    // Update and draw power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].update();
        powerUps[i].draw();

        // Check collision with player
        if (checkCollision(player.getBounds(), powerUps[i].getBounds())) {
            createExplosion(powerUps[i].x + powerUps[i].width / 2, powerUps[i].y + powerUps[i].height / 2);
            powerUps.splice(i, 1);
            gameState.score += 50;
            updateScoreDisplay();
        } else if (powerUps[i].isOffScreen()) {
            powerUps.splice(i, 1);
        }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    // Level up
    const newLevel = Math.floor(gameState.score / config.levelUpScore) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        updateScoreDisplay();
    }

    gameState.frameCount++;
    requestAnimationFrame(gameLoop);
}

// Game Over
function gameOver() {
    gameState.isPlaying = false;
    
    // Update high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('spaceExplorerHighScore', gameState.highScore);
    }
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// Start Game
function startGame() {
    // Reset game state
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.level = 1;
    gameState.frameCount = 0;
    
    // Reset objects
    player = new Player();
    asteroids = [];
    powerUps = [];
    particles = [];
    
    // Update display
    updateScoreDisplay();
    
    // Hide screens
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    // Start game loop
    gameLoop();
}

// Input Handling
document.addEventListener('keydown', (e) => {
    if (player) {
        player.keys[e.key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (player) {
        player.keys[e.key] = false;
    }
});

// Button Handlers
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// Initialize high score display
document.getElementById('highScore').textContent = gameState.highScore;
