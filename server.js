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

const boards = []
const clients = new Set()

wss.on('connection', (ws, req) => {
    
    var token = Url.parse(req.url, true).query.access_token;
    console.log(token)

    const url = req.url.slice(1)
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
            console.log(decoded)
        }
    })

    const boardId = urlParams.get('board')
    if(!boards.includes(boardId)) {
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

        if (message.type === 'createNote'){
            boards[message.board].forEach(client => {

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
            boards[message.board].forEach(client => {

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
        else if (message.type === 'deleteNote'){
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
        else if (message.type === 'addUser'){
            clients.forEach(client => {

                // Skicka inte till vår egen klient (ws)
                if (client === ws) return
    
                console.log(client)
                client.send(JSON.stringify({
                    type: 'addUser',
                    email: message.email,
                }));
            })
        }
        

    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
    

});