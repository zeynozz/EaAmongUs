const socket = io('ws://localhost:8080');
const fieldWidth = 1600;
const fieldHeight = 600;
const playerSize = 50;
let playerPositions = {};

const params = new URLSearchParams(window.location.search);
const name = params.get('username');

const sendMessageButton = document.getElementById('sendMessageButton');
const messageInput = document.getElementById('messageInput');

sendMessageButton.onclick = () => {
    const text = messageInput.value;
    socket.emit('message', text);
    messageInput.value = '';
};

socket.on('connect', () => {
    console.log('Connected as:', socket.id);
    socket.emit('set_name', name);
});

socket.on('message', text => {
    const el = document.createElement('li');
    el.innerHTML = text;
    document.querySelector('.messages').appendChild(el);
});

socket.on('update users', users => {
    document.getElementById('userContainer').innerHTML = '';
    users.forEach((user, index) => {
        const playerEl = document.createElement('div');
        playerEl.classList.add('player');
        playerEl.id = `player-${user.id}`;

        // Bestimme die Startposition basierend auf dem Index des Spielers
        const angle = (index / users.length) * Math.PI * 2;
        const radiusX = fieldWidth / 2 - 15 - playerSize / 2;
        const radiusY = fieldHeight / 2 - 15 - playerSize / 2;
        const startPositionX = fieldWidth / 2 + Math.cos(angle) * radiusX;
        const startPositionY = fieldHeight / 2 + Math.sin(angle) * radiusY;

        playerEl.style.transform = `translate(${startPositionX}px, ${startPositionY}px)`;

        document.getElementById('userContainer').appendChild(playerEl);

        const img = document.createElement('img');
        img.src = getPlayerImage(user.id);
        img.alt = 'Player Image';
        img.classList.add('player-image');
        const nameTag = document.createElement('div');
        nameTag.textContent = user.name;
        nameTag.classList.add('player-name');
        playerEl.appendChild(img);
        playerEl.appendChild(nameTag);

        playerPositions[user.id] = { x: startPositionX, y: startPositionY };
    });
});



socket.on('update position', ({ id, position }) => {
    const playerEl = document.getElementById(`player-${id}`);
    if (playerEl) {
        // Begrenze die neuen Positionen innerhalb der runden Grenzen
        const centerX = fieldWidth / 2;
        const centerY = fieldHeight / 2;
        const distance = Math.sqrt(Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2));
        if (distance <= fieldWidth / 2 - 15 - playerSize / 2) {
            playerEl.style.transform = `translate(${position.x}px, ${position.y}px)`;
            playerPositions[id] = { x: position.x, y: position.y };
        }
    }

    // Erstelle ein Rechteck um den Spieler für Kollisionserkennung
    const playerRect = {
        x: position.x,
        y: position.y,
        width: playerSize,
        height: playerSize
    };
    // Überprüfe Kollisionen mit anderen Spielern
    let collisionDetected = false;
    for (const playerId in playerPositions) {
        if (playerId !== id) {
            const otherPlayerRect = {
                x: playerPositions[playerId].x,
                y: playerPositions[playerId].y,
                width: playerSize,
                height: playerSize
            };

            // Wenn Kollision mit einem anderen Spieler auftritt, markiere die Kollision
            if (detectCollision(playerRect, otherPlayerRect)) {
                collisionDetected = true;
                break;
            }
        }
    }
});


document.addEventListener('keydown', event => {
    const speed = 25;
    const playerId = socket.id;
    const targetPosition = { ...playerPositions[playerId] };

    switch (event.key) {
        case 'ArrowUp':
            targetPosition.y = Math.max(15, targetPosition.y - speed);
            break;
        case 'ArrowDown':
            targetPosition.y = Math.min(fieldHeight - 15 - playerSize, targetPosition.y + speed);
            break;
        case 'ArrowLeft':
            targetPosition.x = Math.max(15, targetPosition.x - speed);
            break;
        case 'ArrowRight':
            targetPosition.x = Math.min(fieldWidth - 15 - playerSize, targetPosition.x + speed);
            break;
    }
    socket.emit('move', targetPosition);
});

const getPlayerImage = (userId) => {
    const images = ['playerImages/red.png', 'playerImages/pink.png', 'playerImages/blue.png', 'playerImages/yellow.png', 'playerImages/white.png', 'playerImages/purple.png'];
    const index = parseInt(userId.replace(/\D/g, ''), 10) % images.length;
    return images[index];
};
