// Select the element with the class 'createBox' and get the first matching element
const createBox = document.querySelector('.createBox');

// Select the element with the class 'notes' and get the first matching element
const notesContainer = document.querySelector('.notes');

// Select the element with the ID 'userInput'
const input = document.getElementById('userInput');

// Initialize a variable to keep track of the color index
let colorIndex = 0;

// Function to generate a random color
function getRandomColor() {
    const randomColors = ["#c2ff3d", "#ff3de8", "#3dc2ff", "#04e022", "#bc83e6", "#ebb328"];
    colorIndex = (colorIndex + 1) % randomColors.length;
    return randomColors[colorIndex];
}

// Function to create and style a new note
function createNote(text) {
    // Create a new 'div' element for the note
    const note = document.createElement('div');
    note.className = 'note';
    
    // Set the background color of the 'div' element
    note.style.background = getRandomColor();

    // Create a 'h3' element for the text
    const noteText = document.createElement('h3');
    noteText.textContent = text;

    // Add the 'h3' element to the 'div' element
    note.appendChild(noteText);

    // Add a 'dblclick' event listener to remove the note
    note.addEventListener('dblclick', function () {
        note.remove();
    });

    // Append the new 'div' element to the 'notes' container
    notesContainer.appendChild(note);
}

// Function to handle the 'keydown' event
function handleKeyDown(event) {
    if (event.keyCode === 13) { // Enter key
        const text = input.value.trim();
        if (text) {
            createNote(text);
            input.value = '';
            input.focus();
            sendMessage(text);
        }
    }
}

// Function to send a message over WebSocket
function sendMessage(text) {
    const message = {
        type: 'paste',
        text: text,
    };

    socket.send(JSON.stringify(message));
}

// Add a 'keydown' event listener to the 'userInput' element
input.addEventListener('keydown', handleKeyDown);

// Add a 'click' event listener to the element with the ID 'create'
document.getElementById("create").addEventListener("click", function() {
    createBox.style.display = "block";
});

// WebSocket Connection
const WS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
const board = "65140bbf3923bcbdedc859a9";
const WS_URL = `ws://localhost:5500/ws-frontend/index.html?token=${WS_TOKEN}&board=${board}`;
const socket = new WebSocket(WS_URL);

socket.addEventListener('open', function (event) {
    console.log('Connected to WebSocket server');
});

socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);

    if (data.type === 'paste') {
        createNote(data.text);
    } else if (data.type === 'error') {
        console.error(data.msg);
    }
});
