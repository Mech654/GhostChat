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
        socket.emit('joinRoom', roomName, (error) => {
            if (error) {
                alert(`Failed to join room: ${error}`);
            } else {
                document.getElementById('chatWindow').innerHTML = '';
                document.getElementById('currentRoom').textContent = `Current Room: ${roomName}`;
            }
        });
    }
}

function displayMessage(message) {
    const chatWindow = document.getElementById('chatWindow');
    const div = document.createElement('div');
    const sender = message[1];
    console.log(message);

    div.innerHTML = ` 
    <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
        <img src="${message[0]}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
        <div style="background-color: #333; padding: 12px; border-radius: 8px; max-width: 90%; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">
            <div style="font-weight: bold; color: #7289da;">${sender}</div>
            <div style="color: #dcddde;">${message[2]}</div>
        </div>
    </div>
    `;
    chatWindow.append(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    if (!personalChats[sender]) {
        personalChats[sender] = [];
    }
    personalChats[sender].push(message);
    updateFriendList();
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
        const message = [localStorage.getItem('avatar'), localStorage.getItem('username'), input.value];                                                 
        if (message && currentRoom) {
            socket.emit('sendMessage', currentRoom, message, (error) => {
                if (error) {
                    console.error(`Failed to send message: ${error}`);
                }
            });
        } else if (!currentRoom) {
            alert("Please join a room first!");
        }
        input.value = '';
    }
});

if (!localStorage.getItem('avatar') || !localStorage.getItem('username')) {
    window.location.href = 'index.html';
}
