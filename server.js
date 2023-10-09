const WebSocket = require('ws')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const Url = require('url');

const PORT = process.env.PORT || 5500
const wss = new WebSocket.Server({
    port: PORT,
    allowEIO3: true
})

const jwtSecret = process.env.JWT_SECRET

// Set: datatyp "med bara nycklar", Wikipedia: Unlike most other collection types, rather than retrieving a specific element from a set, one typically tests a value for membership in a set. 
const boards = []
const clients = new Set()
const notePositions = {};
//console.log(wss)
// URL example: ws://my-server?token=my-secret-token
wss.on('connection', (ws, req) => {

    var token = Url.parse(req.url, true).query.access_token;
    console.log(token)

    // Check valid token (set token in .env as WS_TOKEN=my-secret-token )
    const url = req.url.slice(1)
    const urlParams = new URLSearchParams(req.url.slice(url.indexOf("?") + 1));
    //console.log(urlParams)
    //console.log(urlParams.get('access_token'))
    //console.log(urlParams.get('board'))

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
            console.log(decoded)
        }
    })

    /*if (urlParams.get('access_token') !== process.env.WS_TOKEN) {
        console.log('Invalid token: ' + urlParams.get('access_token'));
        ws.send(JSON.stringify({
            type: 'error',
            msg: 'ERROR: Invalid token.'
        }));
        ws.close();
    }*/

    const boardId = urlParams.get('board')
    if (!boards.includes(boardId)) {
        boards.push(boardId)
    }

    // Spara connectionen i vårt client-Set:
    if (!clients.has(ws)) {
        ws.createdAt = new Date()
        clients.add(ws)
    }

    boards[boardId] = clients

    console.log('Client connected:', req.headers['sec-websocket-key'],
        'client count:', clients.size, ws);

    ws.on('message', (rawMessage) => {

        ws.lastMessage = new Date()

        // Vi konverterar vår råa JSON till ett objekt
        const message = JSON.parse(rawMessage.toString())

        message.clientId = req.headers['sec-websocket-key']

        console.log('Received message:', message)

        if (message.type === 'createNote') {
            clients.forEach(client => {

                // Skicka inte till vår egen klient (ws)
                if (client === ws) return

                console.log(client)
                client.send(JSON.stringify({
                    type: 'createNote',
                    text: message.text,
                    color: message.color,
                    id: message.id,
                    board: message.board
                }));
            })
        }
        else if (message.type === 'editNote'){
            clients.forEach(client => {

                // Skicka inte till vår egen klient (ws)
                if (client === ws) return
    
                console.log(client)
                client.send(JSON.stringify({
                    type: 'editNote',
                    text: message.text,
                    color: message.color,
                    id: message.id,
                    board: message.board
                }));
            })
        }
        else if (message.type === 'deleteNote') {
            clients.forEach(client => {

                // Skicka inte till vår egen klient (ws)
                if (client === ws) return

                console.log(client)
                client.send(JSON.stringify({
                    type: 'deleteNote',
                    id: message.id,
                }));
            })
        }
        else if (message.type === 'addUser') {
            clients.forEach(client => {

                // Skicka inte till vår egen klient (ws)
                if (client === ws) return

                console.log(client)
                client.send(JSON.stringify({
                    type: 'addUser',
                    email: message.email,
                    board: message.board
                }));
            })
        }
        else if (message.type === 'updateUserToBoard') {
            clients.forEach(client => {

                // Skicka inte till vår egen klient (ws)
                if (client === ws) {
                    if (!boards.includes(message.board)) {
                        boards.push(message.board)
                        boards[message.board] = client
                    }
                }
            })
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