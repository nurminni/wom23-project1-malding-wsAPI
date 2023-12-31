const WebSocket = require('ws')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const Url = require('url');

const PORT = process.env.PORT || 5500
const wss = new WebSocket.Server({
    port: PORT,
    allowEIO3: true
});

const jwtSecret = process.env.JWT_SECRET;

const boards = [];
const clients = new Set();
const notePositions = {};
wss.on('connection', (ws, req) => {

    var token = Url.parse(req.url, true).query.access_token;

    const url = req.url.slice(1);
    const urlParams = new URLSearchParams(req.url.slice(url.indexOf("?") + 1));

    let secret;
    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            ws.send(JSON.stringify({
                type: 'error',
                msg: 'ERROR: Invalid token.'
            }));
            ws.close();
        }
        else {
            secret = decoded
        }
    });
    const boardId = urlParams.get('board');
    if (!boards.includes(boardId)) {
        boards.push(boardId);
    }

    // Store the connection in our client-Set:
    if (!clients.has(ws)) {
        ws.createdAt = new Date();
        clients.add(ws);
    }

    boards[boardId] = clients;

    console.log('Client connected:', req.headers['sec-websocket-key'],
        'client count:', clients.size, ws);

    ws.on('message', (rawMessage) => {

        ws.lastMessage = new Date();

        // Convert the raw JSON to an object
        const message = JSON.parse(rawMessage.toString());

        message.clientId = req.headers['sec-websocket-key'];

        if (message.type === 'createNote') {
            clients.forEach(client => {

                // Don't send to our own client (ws)
                if (client === ws) return;
                client.send(JSON.stringify({
                    type: 'createNote',
                    text: message.text,
                    color: message.color,
                    id: message.id,
                    board: message.board
                }));
            });
        }
        else if (message.type === 'editNote'){
            clients.forEach(client => {

                // Don't send to our own client (ws)
                if (client === ws) return;
                client.send(JSON.stringify({
                    type: 'editNote',
                    text: message.text,
                    color: message.color,
                    id: message.id,
                    board: message.board
                }));
            });
        }
        else if (message.type === 'deleteNote') {
            clients.forEach(client => {
                // Don't send to our own client (ws)
                if (client === ws) return;
                client.send(JSON.stringify({
                    type: 'deleteNote',
                    id: message.id,
                }));
            });
        }
        else if (message.type === 'addUser') {
            clients.forEach(client => {
                // Don't send to our own client (ws)
                if (client === ws) return;
                client.send(JSON.stringify({
                    type: 'addUser',
                    email: message.email,
                    board: message.board
                }));
            });
        }
        else if (message.type === 'updateUserToBoard') {
            clients.forEach(client => {
                // Update our own clients (ws) stored board connections
                if (client === ws) {
                    if (!boards.includes(message.board)) {
                        boards.push(message.board);
                        boards[message.board] = client;
                    }
                }
            });
        }
        else if (message.type === 'moveNote') {
            const noteId = message.id;
            const position = message.position;
            // Update the note's position in the server's data structure
            notePositions[noteId] = position;
            // Broadcast the updated position to all clients except the sender
            clients.forEach(client => {
                if (client === ws) return;
                client.send(JSON.stringify({
                    type: 'moveNote',
                    id: noteId,
                    position: position,
                }));
            });
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});