const socket = io('http://localhost:3000');
let currentRoom = null;
let joinedRooms = [];  // Local array to track rooms the user has joined
let personalChats = {}; // Store personal chats with usernames

// Update room list in the sidebar
function updateRoomList() {
    const roomList = document.getElementById('roomList');
    roomList.innerHTML = '';  // Clear the list

    joinedRooms.forEach(room => {
        const roomItem = document.createElement('div');
        roomItem.classList.add('room-item');
        roomItem.textContent = room;
        roomItem.addEventListener('click', () => joinRoom(room));
        roomList.appendChild(roomItem);
    });
}

// Update friend list in the right sidebar
function updateFriendList() {
    const friendList = document.getElementById('friendList');
    friendList.innerHTML = '';  // Clear the list

    for (let friend in personalChats) {
        const friendItem = document.createElement('div');
        friendItem.classList.add('friend-item');
        friendItem.textContent = friend;
        friendItem.addEventListener('click', () => joinRoom(friend));
        friendList.appendChild(friendItem);
    }
}

// Join room function
function joinRoom(roomName) {
    if (roomName && roomName !== currentRoom) {
        currentRoom = roomName;
        socket.emit('joinRoom', roomName);  // Emit to server to join room
        document.getElementById('chatWindow').innerHTML = '';  // Clear chat window
        document.getElementById('currentRoom').textContent = `Current Room: ${roomName}`;  // Display current room
    }
}

// Handle message display
function displayMessage(message) {
    const chatWindow = document.getElementById('chatWindow');
    const div = document.createElement('div');
    const sender = message[1];
    console.log(message);

    div.innerHTML = ` 
    <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
        <img src="${message[2]}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
        <div style="background-color: #333; padding: 12px; border-radius: 8px; max-width: 90%; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">
            <div style="font-weight: bold; color: #7289da;">${sender}</div>
            <div style="color: #dcddde;">${message[0]}</div>
        </div>
    </div>
    `;
    chatWindow.append(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;  // Scroll to the bottom of the chat window

    // Store personal chat for the sender
    if (!personalChats[sender]) {
        personalChats[sender] = [];
    }
    personalChats[sender].push(message);
    updateFriendList();  // Update the friend list when a new message is received
}

// Listen for incoming messages
socket.on('message', (message) => {
    displayMessage(message);
});

// Handle 'Join Room' button functionality
document.getElementById('joinRoomBtn').addEventListener('click', () => {
    const roomName = prompt("Enter room name:");
    if (roomName) {
        if (!joinedRooms.includes(roomName)) {
            joinedRooms.push(roomName);  // Add to the list of joined rooms
            updateRoomList();
        }
        joinRoom(roomName);
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const input = document.getElementById('chatInput');
        const message = [input.value, localStorage.getItem('username'), localStorage.getItem('avatar')];
        if (message && currentRoom) {
            socket.emit('sendMessage', currentRoom, message);
        } else if (!currentRoom) {
            alert("Please join a room first!");
        }
        input.value = '';
    }
});

if (!localStorage.getItem('avatar') || !localStorage.getItem('username')) {
    window.location.href = 'index.html';
}