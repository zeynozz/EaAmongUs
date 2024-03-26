const socket = io('ws://localhost:8080');
const fieldWidth = 1600;
const fieldHeight = 250;
const playerSize = 50;
let playerPositions = {};

const sendMessageButton = document.getElementById('sendMessageButton');
const messageInput = document.getElementById('messageInput');

sendMessageButton.onclick = () => {
    const text = messageInput.value;
    socket.emit('message', text);
    messageInput.value = '';
};

socket.on('connect', () => {
    console.log('Connected as:', socket.id);
    const name = prompt('Enter your name:');
    socket.emit('set_name', name);
});

socket.on('message', text => {
    const el = document.createElement('li');
    el.innerHTML = text;
    document.querySelector('.messages').appendChild(el);
});

socket.on('update users', users => {
    document.getElementById('userContainer').innerHTML = '';
    users.forEach(user => {
        const playerEl = document.createElement('div');
        playerEl.classList.add('player');
        playerEl.id = `player-${user.id}`;
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

        playerPositions[user.id] = { x: 0, y: 0 };
    });
});

socket.on('update position', ({ id, position }) => {
    const playerEl = document.getElementById(`player-${id}`);
    if (playerEl) {
        const newX = Math.max(0, Math.min(fieldWidth - playerSize, position.x));
        const newY = Math.max(0, Math.min(fieldHeight - playerSize, position.y));
        playerEl.style.transform = `translate(${newX}px, ${newY}px)`;
        playerPositions[id] = { x: newX, y: newY };
    }
});

document.addEventListener('keydown', event => {
    const speed = 25;
    const playerId = socket.id;
    const targetPosition = { ...playerPositions[playerId] };

    switch (event.key) {
        case 'ArrowUp':
            targetPosition.y = Math.max(0, targetPosition.y - speed);
            break;
        case 'ArrowDown':
            targetPosition.y = Math.min(fieldHeight - playerSize, targetPosition.y + speed);
            break;
        case 'ArrowLeft':
            targetPosition.x = Math.max(0, targetPosition.x - speed);
            break;
        case 'ArrowRight':
            targetPosition.x = Math.min(fieldWidth - playerSize, targetPosition.x + speed);
            break;
    }
    socket.emit('move', targetPosition);
});

const getPlayerImage = (userId) => {
    const images = ['playerImages/red.png', 'playerImages/pink.png', 'playerImages/blue.png', 'playerImages/yellow.png', 'playerImages/white.png', 'playerImages/purple.png'];
    const index = parseInt(userId.replace(/\D/g, ''), 10) % images.length;
    return images[index];
};
