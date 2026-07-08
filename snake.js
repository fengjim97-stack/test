const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#best-score");
const statusEl = document.querySelector("#status");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const touchButtons = document.querySelectorAll("[data-direction]");

const gridSize = 24;
const tileCount = canvas.width / gridSize;
const tickSpeed = 115;
const directionMap = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore = Number(localStorage.getItem("snake-best-score") || 0);
let timerId = null;
let isPaused = false;
let gameOver = false;

bestScoreEl.textContent = bestScore;
resetGame();
draw();

function resetGame() {
  snake = [
    { x: 12, y: 12 },
    { x: 11, y: 12 },
    { x: 10, y: 12 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { ...direction };
  score = 0;
  gameOver = false;
  isPaused = false;
  scoreEl.textContent = score;
  pauseButton.textContent = "暂停";
  pauseButton.disabled = true;
  placeFood();
}

function startGame() {
  if (timerId) {
    clearInterval(timerId);
  }
  resetGame();
  statusEl.textContent = "游戏进行中：吃掉食物，别撞墙！";
  startButton.textContent = "重新开始";
  pauseButton.disabled = false;
  timerId = setInterval(tick, tickSpeed);
  draw();
}

function togglePause() {
  if (gameOver || !timerId) return;
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? "继续" : "暂停";
  statusEl.textContent = isPaused ? "已暂停，按空格或点击继续。" : "游戏继续！";
}

function tick() {
  if (isPaused || gameOver) return;

  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (isWallCollision(head) || isSnakeCollision(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    updateBestScore();
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake.some((segment) => segment.x === food.x && segment.y === food.y));
}

function updateBestScore() {
  if (score <= bestScore) return;
  bestScore = score;
  localStorage.setItem("snake-best-score", String(bestScore));
  bestScoreEl.textContent = bestScore;
}

function endGame() {
  gameOver = true;
  clearInterval(timerId);
  timerId = null;
  pauseButton.disabled = true;
  statusEl.textContent = `游戏结束！本局得分 ${score}，点击“重新开始”再来一局。`;
  draw();
}

function setDirection(newDirection) {
  const isOpposite = newDirection.x + direction.x === 0 && newDirection.y + direction.y === 0;
  if (!isOpposite) {
    nextDirection = newDirection;
  }
}

function isWallCollision(head) {
  return head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount;
}

function isSnakeCollision(head) {
  return snake.some((segment) => segment.x === head.x && segment.y === head.y);
}

function draw() {
  drawBoard();
  drawFood();
  drawSnake();
  if (gameOver) {
    drawOverlay("游戏结束");
  } else if (isPaused) {
    drawOverlay("已暂停");
  }
}

function drawBoard() {
  ctx.fillStyle = "#081626";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i += 1) {
    const position = i * gridSize;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const inset = index === 0 ? 3 : 4;
    ctx.fillStyle = index === 0 ? "#38bdf8" : "#a3e635";
    roundedRect(
      segment.x * gridSize + inset,
      segment.y * gridSize + inset,
      gridSize - inset * 2,
      gridSize - inset * 2,
      7,
    );
  });
}

function drawFood() {
  const centerX = food.x * gridSize + gridSize / 2;
  const centerY = food.y * gridSize + gridSize / 2;
  const gradient = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 13);
  gradient.addColorStop(0, "#fff7ed");
  gradient.addColorStop(0.45, "#fb7185");
  gradient.addColorStop(1, "rgba(251, 113, 133, 0.2)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawOverlay(text) {
  ctx.fillStyle = "rgba(2, 6, 23, 0.62)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e5f0ff";
  ctx.font = "bold 56px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
    return;
  }

  const newDirection = directionMap[event.code];
  if (newDirection) {
    event.preventDefault();
    setDirection(newDirection);
  }
});

touchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const directionName = button.dataset.direction;
    const key = `Arrow${directionName[0].toUpperCase()}${directionName.slice(1)}`;
    setDirection(directionMap[key]);
  });
});
