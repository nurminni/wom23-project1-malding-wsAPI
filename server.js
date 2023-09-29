const WebSocket = require('ws')
require('dotenv').config()

const PORT = process.env.PORT || 5500
const wss = new WebSocket.Server({ 
    port: PORT,
    allowEIO3: true
})

// Set: datatyp "med bara nycklar", Wikipedia: Unlike most other collection types, rather than retrieving a specific element from a set, one typically tests a value for membership in a set. 
const clients = [];

// URL example: ws://my-server?token=my-secret-token
wss.on('connection', (ws, req) => {
    
    // Check valid token (set token in .env as WS_TOKEN=my-secret-token )
    const urlParams = new URLSearchParams(req.url.slice(1));
    if (urlParams.get('access_token') !== process.env.WS_TOKEN) {
        console.log('Invalid token: ' + urlParams.get('access_token'));
        ws.send(JSON.stringify({
            type: 'error',
            msg: 'ERROR: Invalid token.'
        }));
        ws.close();
    }

    const boardId = urlParams.get('board');
    if(!clients.includes(boardId)) clients[boardId] = new Set();

    // Spara connectionen i vårt client-Set:
    if (!clients[boardId].has(ws)) {
        ws.createdAt = new Date()
        clients[boardId].add(ws)
    }
    if(clients[boardId].has(ws)) {
        clients[boardId].add(ws)
    }
    console.log('Client connected:', req.headers['sec-websocket-key'], 
        'client count:', clients.size, ws);

    ws.on('message', (rawMessage) => {

        ws.lastMessage = new Date()
    
        // Vi konverterar vår råa JSON till ett objekt
        const message = JSON.parse(rawMessage.toString())

        message.clientId = req.headers['sec-websocket-key']

        console.log('Received message:', message)

        clients[boardId].forEach(client => {

            // Skicka inte till vår egen klient (ws)
            if (client === ws) return

            client.send(JSON.stringify({
                type: 'paste',
                text: message.text
            }));
        })

    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
    

});