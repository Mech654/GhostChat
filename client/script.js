const socket = io('http://localhost:3000');
let currentRoom = null;
let joinedRooms = [];  // Local array to track rooms the user has joined
let personalChats = {}; // Store personal chats with usernames

function updateRoomList() {
    const roomList = document.getElementById('roomList');
    roomList.innerHTML = '';

    joinedRooms.forEach(room => {
        const roomItem = document.createElement('div');
        roomItem.classList.add('room-item');
        roomItem.textContent = room;
        roomItem.addEventListener('click', () => joinRoom(room));
        roomList.appendChild(roomItem);
    });
}

function updateFriendList() {
    const friendList = document.getElementById('friendList');
    friendList.innerHTML = '';
    for (let friend in personalChats) {
        const friendItem = document.createElement('div');
        friendItem.classList.add('friend-item');
        friendItem.textContent = friend;
        friendItem.addEventListener('click', () => joinRoom(friend));
        friendList.appendChild(friendItem);
    }
}

function joinRoom(roomName) {
    if (roomName && roomName !== currentRoom) {
        currentRoom = roomName;
        socket.emit('joinRoom', roomName); // No callback
        document.getElementById('chatWindow').innerHTML = '';
        document.getElementById('currentRoom').textContent = `Current Room: ${roomName}`;
    }
}
const username = localStorage.getItem('username');
function displayMessage(message) {
    const chatWindow = document.getElementById('chatWindow');
    const div = document.createElement('div');
    const sender = message[1];
    console.log(message);
    
    // innerHTML er en dårlig måde at indsætte HTML på, da det kan være usikkert.
    // og kan føre til XSS
    // det kan løses ved lave nye elementer og indsætte dem i stedet
    // og bruge textContent i stedet for innerHTML hvor der skal indsættes tekst
/*  
    const sender = message[1]; // Username is the second element
    const avatar = message[0]; // Avatar is the third element
    const postContent = message[2]; // Post content is the first element

    div.innerHTML = ` 
    <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
        <img src="${avatar}" alt="Avatar" style="width: 60px; height: 60px; border-radius: 50%; margin-right: 10px;">
        <div style="background-color: #333; padding: 12px; border-radius: 8px; max-width: 90%; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">
            <div style="font-weight: bold; color: #7289da;">${sender}</div>
            <div style="color: #dcddde;">${postContent}</div>
        </div>
    </div>
    `; */
    
    // et Exempel på en måde at løse XSS på
    const container = document.createElement('div');
    container.style = "display: flex; align-items: flex-start; margin-bottom: 10px;";

    const img = document.createElement('img');
    img.src = message[0];
    img.alt = "Avatar";
    img.style = "width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;";

    const messageContainer = document.createElement('div');
    messageContainer.style = "background-color: #333; padding: 12px; border-radius: 8px; max-width: 90%; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;";

    const senderDiv = document.createElement('div');
    senderDiv.style = "font-weight: bold; color: #7289da;";
    senderDiv.textContent = sender;

    const messageDiv = document.createElement('div');
    messageDiv.style = "color: #dcddde;";
    messageDiv.textContent = message[2];
    
    messageContainer.appendChild(senderDiv);
    messageContainer.appendChild(messageDiv);

    container.appendChild(img);
    container.appendChild(messageContainer);
    
    div.appendChild(container);

    chatWindow.append(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    if (sender !== username && sender !== "System" && !personalChats[sender]) {
        personalChats[sender] = [];
    }

    if(sender !== "System" && username !== sender) {
        personalChats[sender].push(message);
        updateFriendList();
    }
}

socket.on('message', (message) => {
    displayMessage(message);
});

document.getElementById('joinRoomBtn').addEventListener('click', () => {
    const roomName = prompt("Enter room name:");
    if (roomName) {
        if (!joinedRooms.includes(roomName)) {
            joinedRooms.push(roomName);
            updateRoomList();
        }
        joinRoom(roomName);
    }
});

document.addEventListener('keydown', function(event) {  // Send message on Enter key press                                                          
    if (event.key === 'Enter') {
        const input = document.getElementById('chatInput');
        const message = [input.value, localStorage.getItem('username'), localStorage.getItem('avatar')];                                                  
        if (message && currentRoom) {
            socket.emit('sendMessage', currentRoom, message); // No callback
        } else if (!currentRoom) {
            alert("Please join a room first!");
        }
        input.value = '';
    }
});



if (!localStorage.getItem('username') && !localStorage.getItem('password')) {
    window.location.href = 'index.html';
}