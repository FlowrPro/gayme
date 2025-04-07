const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const players = {};
const food = [];

const WIDTH = 2000;
const HEIGHT = 2000;

// Generate initial food
for (let i = 0; i < 200; i++) {
    food.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: 5,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    // Create new player
    players[socket.id] = {
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: 20,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        id: socket.id
    };

    // Send initial state to new player
    socket.emit('init', {
        player: players[socket.id],
        players: players,
        food: food
    });

    // Broadcast new player to others
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('movement', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            
            // Check food collision
            for (let i = food.length - 1; i >= 0; i--) {
                const dx = food[i].x - players[socket.id].x;
                const dy = food[i].y - players[socket.id].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < players[socket.id].size + food[i].size) {
                    players[socket.id].size += 1;
                    food.splice(i, 1);
                    // Add new food
                    food.push({
                        x: Math.random() * WIDTH,
                        y: Math.random() * HEIGHT,
                        size: 5,
                        color: `hsl(${Math.random() * 360}, 100%, 50%)`
                    });
                }
            }

            io.emit('update', players);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
        console.log('Player disconnected:', socket.id);
    });
});

// Game loop
setInterval(() => {
    io.emit('gameState', {
        players: players,
        food: food
    });
}, 1000 / 60);

http.listen(3000, () => {
    console.log('Server running on port 3000');
});
