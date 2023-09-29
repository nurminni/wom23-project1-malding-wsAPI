const WebSocket = require('ws');
const jwt = require('jsonwebtoken'); // Import the jsonwebtoken library
require('dotenv').config();

const PORT = process.env.WS_PORT || 3030;
const wss = new WebSocket.Server({ port: PORT });

const userBoards = {}; // Store user associations with boards

wss.on('connection', (ws, req) => {
    // Extract board IDs and token from the URL
    const urlParams = new URLSearchParams(req.url.slice(1));
    const token = urlParams.get('token');
    const boardIds = urlParams.getAll('boardId'); // Get multiple board IDs

    // Verify the JWT token
    try {
        // Replace 'YOUR_SECRET_KEY' with the actual secret key used for signing the JWT in Del 1
        const decoded = jwt.verify(token, '11bb1f4df8c3650f0caa84467f7471aeebf890e51d7ebdbbc9341c6891a1edbb');

        // Optionally, you can access information from the decoded token to perform authorization checks.

        // Store the WebSocket connection with associated board IDs for this user
        if (!userBoards[token]) {
            userBoards[token] = new Set();
        }

        // Add the user's board IDs to their set
        boardIds.forEach((boardId) => {
            userBoards[token].add(boardId);
        });

        console.log('Client connected:', req.headers['sec-websocket-key'], 
            'to boards:', [...userBoards[token]].join(', '), 'client count:', userBoards[token].size);

        ws.on('message', (rawMessage) => {
            ws.lastMessage = new Date();

            // Convert raw JSON to an object
            const message = JSON.parse(rawMessage.toString());
            message.clientId = req.headers['sec-websocket-key'];

            console.log('Received message:', message);

            // Broadcast the message to all clients on the same boards
            boardIds.forEach((boardId) => {
                userBoards[token].forEach((client) => {
                    if (client !== ws) {
                        client.send(JSON.stringify({
                            type: 'paste',
                            text: message.text
                        }));
                    }
                });
            });
        });

        ws.on('close', () => {
            // Remove the WebSocket connection from associated boards when disconnected
            boardIds.forEach((boardId) => {
                userBoards[token].delete(ws);
            });
            console.log('Client disconnected from boards:', [...boardIds].join(', '));
        });
    } catch (err) {
        console.log('Invalid token:', err.message);
        ws.send(JSON.stringify({
            type: 'error',
            msg: 'ERROR: Invalid token.'
        }));
        ws.close();
        return;
    }
});

console.log(`WebSocket server is running on port ${PORT}`);
