const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreBoard = document.getElementById('score-board');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Resize canvas to match its CSS display size
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let gameLoopId;
let isGameOver = false;
let score = 0;
let frameCount = 0;

// Game entities
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 18,
    speed: 8,
    color: '#38bdf8' // Cyber blue
};

let balls = [];

// Input handling
let rightPressed = false;
let leftPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') rightPressed = true;
    else if (e.key === 'ArrowLeft') leftPressed = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight') rightPressed = false;
    else if (e.key === 'ArrowLeft') leftPressed = false;
});

// Touch controls for mobile support (Swipe)
let touchStartX = null;
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});
canvas.addEventListener('touchmove', (e) => {
    if (touchStartX === null) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;

    // Move player based on swipe direction
    if (diff > 5) { // Swiping right
        rightPressed = true;
        leftPressed = false;
        touchStartX = currentX; // Track relative movement
    } else if (diff < -5) { // Swiping left
        leftPressed = true;
        rightPressed = false;
        touchStartX = currentX; // Track relative movement
    } else {
        rightPressed = false;
        leftPressed = false;
    }

    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', () => {
    touchStartX = null;
    rightPressed = false;
    leftPressed = false;
});

function initGame() {
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
    balls = [];
    score = 0;
    frameCount = 0;
    isGameOver = false;
    scoreElement.innerText = score;

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreBoard.classList.remove('hidden');

    gameLoop();
}

function createBall() {
    const radius = Math.random() * 10 + 10; // 10 to 20
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const y = -radius;

    // Base speed increases with score -> more difficult over time
    const baseSpeed = 4 + (score * 0.15);
    const speed = baseSpeed + Math.random() * 2.5;

    // Random neon colors
    const colors = [
        '#f43f5e', // Rose
        '#a855f7', // Purple
        '#fbbf24', // Amber
        '#10b981', // Emerald
        '#ec4899'  // Pink
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    balls.push({ x, y, radius, speed, color });
}

function drawPlayer() {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;

    // Glowing effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.fill();

    // Inner core
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0; // reset
    ctx.fill();
}

function drawBalls() {
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;

        ctx.shadowBlur = 15;
        ctx.shadowColor = ball.color;
        ctx.fill();

        // Shine effect
        ctx.beginPath();
        ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.shadowBlur = 0;
        ctx.fill();
    });
}

function drawBackground() {
    // Clear with a slight transparency for trailing effect
    ctx.fillStyle = 'rgba(11, 17, 32, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle star field or particles if desired
    if (frameCount % 4 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
}

function updatePositions() {
    // Player horizontal movement (keyboard)
    if (rightPressed) player.x += player.speed;
    if (leftPressed) player.x -= player.speed;

    // Boundary checks
    if (player.x - player.radius < 0) player.x = player.radius;
    if (player.x + player.radius > canvas.width) player.x = canvas.width - player.radius;

    // Update balls
    balls.forEach(ball => {
        ball.y += ball.speed;
    });

    // Remove off-screen balls & increment score
    for (let i = balls.length - 1; i >= 0; i--) {
        if (balls[i].y - balls[i].radius > canvas.height) {
            balls.splice(i, 1);
            score++;
            scoreElement.innerText = score;

            // Slight pop animation on score update
            scoreBoard.style.transform = 'scale(1.2)';
            setTimeout(() => {
                scoreBoard.style.transform = 'scale(1)';
            }, 100);
        }
    }
}

function checkCollisions() {
    for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        const dx = player.x - ball.x;
        const dy = player.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Collision detection with a small forgiveness margin (e.g., - 2px)
        if (distance < player.radius + ball.radius - 3) {
            isGameOver = true;

            // Explosion effect at player location
            drawExplosion(player.x, player.y, ball.color);
            break;
        }
    }
}

function drawExplosion(x, y, color) {
    ctx.beginPath();
    ctx.arc(x, y, player.radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1.0;
}

function gameOver() {
    cancelAnimationFrame(gameLoopId);
    scoreBoard.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.innerText = score;
}

function gameLoop() {
    if (isGameOver) {
        gameOver();
        return;
    }

    drawBackground();

    updatePositions();
    checkCollisions();

    if (!isGameOver) {
        drawPlayer();
        drawBalls();
    }

    // Spawn new balls dynamically
    // Starts with low frequency, gets faster
    const spawnRate = Math.max(15, 60 - Math.floor(score / 3));
    if (frameCount % spawnRate === 0) {
        createBall();
    }

    frameCount++;
    gameLoopId = requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// Render initial decorative state
ctx.fillStyle = '#0b1120';
ctx.fillRect(0, 0, canvas.width, canvas.height);
drawPlayer();
scoreBoard.style.transition = 'transform 0.1s ease';
