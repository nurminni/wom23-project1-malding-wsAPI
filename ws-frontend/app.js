/*if (!localStorage.getItem('access_token')) {
            localStorage.setItem('access_token', urlParams.get('access_token'));
        }
        if (!localStorage.getItem('board')) {
            localStorage.setItem('board', urlParams.get('board'));
        }*/

        // hårdkodat för test, sätt in i WS_TOKEN i .env
        let WS_TOKEN = localStorage.getItem('access_token');
        let payload;
        let boardIds
        if (WS_TOKEN) {
            try {
                const tokenParts = WS_TOKEN.split('.');
                payload = JSON.parse(atob(tokenParts[1]));
                boardIds = payload.boardIds;
                console.log(boardIds);
            } catch (e) {
                console.error(e);
            }
        } else {
            console.error('JWT token not found in localStorage.');
        }

        const boardIdsString = boardIds.join('&board=');
        // Construct the URL with boardIds as URL parameters
        const baseUrl = `ws://localhost:5500/ws-frontend/index.html?token=${WS_TOKEN}`;
        const WS_URL = `${baseUrl}&board=${boardIdsString}`;

        console.log('Constructed URL with boardIds:', urlWithParams);
        
        //console.log(WS_TOKEN)
        //console.log(board)
        
        // wss = SSL-krypterad
        // WS_URL = `wss://ws-pastebin-niklas.azurewebsites.net?token=${WS_TOKEN}`

        //console.log(WS_URL)
        
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