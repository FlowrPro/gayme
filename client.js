const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = null;
let players = {};
let food = [];
let camera = { x: 0, y: 0 };

socket.on('init', (data) => {
    player = data.player;
    players = data.players;
    food = data.food;
});

socket.on('newPlayer', (newPlayer) => {
    players[newPlayer.id] = newPlayer;
});

socket.on('update', (updatedPlayers) => {
    players = updatedPlayers;
});

socket.on('playerLeft', (id) => {
    delete players[id];
});

socket.on('gameState', (state) => {
    players = state.players;
    food = state.food;
});

function drawCircle(x, y, size, color) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (player) {
        // Update camera
        camera.x = canvas.width/2 - player.x;
        camera.y = canvas.height/2 - player.y;

        // Draw food
        food.forEach(f => {
            drawCircle(f.x + camera.x, f.y + camera.y, f.size, f.color);
        });

        // Draw players
        Object.values(players).forEach(p => {
            drawCircle(p.x + camera.x, p.y + camera.y, p.size, p.color);
        });

        // Send movement
        const mouseX = mouse.x - canvas.width/2;
        const mouseY = mouse.y - canvas.height/2;
        const angle = Math.atan2(mouseY, mouseX);
        const speed = Math.min(5, player.size/5);
        
        player.x += Math.cos(angle) * speed;
        player.y += Math.sin(angle) * speed;
        
        socket.emit('movement', { x: player.x, y: player.y });
    }

    requestAnimationFrame(gameLoop);
}

let mouse = { x: 0, y: 0 };
canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

gameLoop();
