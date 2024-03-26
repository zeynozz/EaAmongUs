const http = require('http').createServer();
const io = require('socket.io')(http, { cors: { origin: "*" } });

let users = {};

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('set_name', (name) => {
        console.log('User', socket.id, 'set name to:', name);
        users[socket.id] = { id: socket.id, name: name, position: { x: 0, y: 0 } };
        io.emit('update users', Object.values(users));
    });

    socket.on('message', (message) => {
        console.log(message);
        io.emit('message', `${users[socket.id].name} : ${message}`);
    });

    socket.on('move', (position) => {
        if (users[socket.id]) {
            users[socket.id].position = position;
            io.emit('update position', { id: socket.id, position });
        }
    });

    socket.on('disconnect', () => {
        console.log('a user disconnected');
        delete users[socket.id];
        io.emit('update users', Object.values(users));
    });
});

http.listen(8080, () => console.log('listening on http://localhost:8080'));
