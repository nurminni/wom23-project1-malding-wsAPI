/*if (!localStorage.getItem('access_token')) {
            localStorage.setItem('access_token', urlParams.get('access_token'));
        }
        if (!localStorage.getItem('board')) {
            localStorage.setItem('board', urlParams.get('board'));
        }*/

        // hårdkodat för test, sätt in i WS_TOKEN i .env
        const WS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        const board = "65140bbf3923bcbdedc859a9"

        //console.log(WS_TOKEN)
        //console.log(board)
        
        // wss = SSL-krypterad
        // WS_URL = `wss://ws-pastebin-niklas.azurewebsites.net?token=${WS_TOKEN}`
        WS_URL = `ws://localhost:5500/ws-frontend/index.html?token=${WS_TOKEN}&board=${board}`

        console.log(WS_URL)
        
        // Create a WebSocket connection
        const socket = new WebSocket(WS_URL);

        // Connection established 
        socket.onopen = function (event) {
            console.log('Connected to WebSocket server');
        };

        // Message listener
        socket.onmessage = function (event) {
            console.log('Received message:', event.data);
            const data = JSON.parse(event.data);

            if (data.type == 'paste') {
                document.querySelector('#out').innerText = data.text;
                document.querySelector('#err').innerText = '';
            } else if (data.type == 'error') {
                document.querySelector('#err').innerText = data.msg;
            }
        };

        // Connection closed 
        socket.onclose = function (event) {
            console.log('Connection closed');
        };

        /*document.querySelector('#in').addEventListener('input', (evt) => {
            socket.send(JSON.stringify({
                type: 'paste',
                text: evt.target.value
            }));
        });*/