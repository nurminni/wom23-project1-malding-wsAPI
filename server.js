const WebSocket = require('ws');
require('dotenv').config();

const PORT = process.env.PORT || 5500;
const wss = new WebSocket.Server({
    port: PORT,
    allowEIO3: true,
});

// Create an object to store active WebSocket connections by boardId
const clients = {};

wss.on('connection', (ws, req) => {
    // Check valid token (set token in .env as WS_TOKEN=my-secret-token )
    const url = req.url.slice(1);
    const urlParams = new URLSearchParams(req.url.slice(url.indexOf('?') + 1));
    console.log(urlParams);
    console.log(urlParams.get('token'));
    console.log(urlParams.get('board'));

    if (urlParams.get('token') !== process.env.WS_TOKEN) {
        console.log('Invalid token: ' + urlParams.get('token'));
        ws.send(
            JSON.stringify({
                type: 'error',
                msg: 'ERROR: Invalid token.',
            })
        );
        ws.close();
        return; // Stop handling this connection
    }

    const boardId = urlParams.get('board');

    // Create a Set for this board if it doesn't exist
    if (!clients[boardId]) {
        clients[boardId] = new Set();
    }

    // Add the WebSocket connection to the Set
    clients[boardId].add(ws);

    console.log('Client connected:', req.headers['sec-websocket-key']);
    console.log('client count:', clients[boardId].size);

    ws.on('message', (rawMessage) => {
        // Parse the received message as JSON
        const message = JSON.parse(rawMessage);
        console.log(message);
        // Broadcast the message to all clients on the same board
        clients[boardId].forEach((client) => {
            if (client !== ws) {
                // Send the message to clients other than the sender
                client.send(JSON.stringify({ type: 'paste', text: message.text }));
            }
        });
    });

    ws.on('close', () => {
        // Remove the WebSocket connection from the Set when it's closed
        clients[boardId].delete(ws);
        console.log('Client disconnected');
    });
});
