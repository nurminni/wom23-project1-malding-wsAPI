const WebSocket = require('ws');
require('dotenv').config();

const PORT = process.env.PORT || 5500;
const wss = new WebSocket.Server({
    port: PORT,
    allowEIO3: true
});

const boards = {}; // Use an object to store WebSocket connections for different boards

wss.on('connection', (ws, req) => {
    const url = req.url.slice(1);
    const urlParams = new URLSearchParams(req.url.slice(url.indexOf("?") + 1));

    if (urlParams.get('token') !== process.env.WS_TOKEN) {
        console.log('Invalid token: ' + urlParams.get('token'));
        ws.send(JSON.stringify({
            type: 'error',
            msg: 'ERROR: Invalid token.'
        }));
        ws.close();
        return;
    }

    const boardId = urlParams.get('board');

    // Create a Set for the board if it doesn't exist
    if (!boards[boardId]) {
        boards[boardId] = new Set();
    }

    // Add the WebSocket connection to the Set for the board
    boards[boardId].add(ws);

    console.log('Client connected:', req.headers['sec-websocket-key'],
        'client count:', boards[boardId].size, ws);

    ws.on('message', (rawMessage) => {
        const message = JSON.parse(rawMessage.toString());
        message.clientId = req.headers['sec-websocket-key'];

        console.log('Received message:', message);

        // Check if the received message is a note creation message
        if (message.type === 'createNote') {
            // Broadcast the note creation message to all clients except the sender
            boards[boardId].forEach(client => {
                if (client !== ws) { // Exclude the sender
                    client.send(JSON.stringify({
                        type: 'createNote',
                        text: message.text,
                    }));
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');

        // Remove the WebSocket connection from the Set when the client disconnects
        boards[boardId].delete(ws);
    });
});
