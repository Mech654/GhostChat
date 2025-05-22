const socket = io('http://localhost:3000');
let currentRoom = null;
let joinedRooms = []; // Local array to track rooms the user has joined
let personalChats = {}; // Store personal chats with usernames

function updateRoomList() {
  const roomList = document.getElementById('roomList');
  roomList.innerHTML = '';

  joinedRooms.forEach((room) => {
    if (!room.includes('***')) {
      // Only display public rooms here
      const roomItem = document.createElement('div');
      roomItem.classList.add('room-item');
      roomItem.textContent = room;
      roomItem.addEventListener('click', () => joinRoom(room));
      roomList.appendChild(roomItem);
    }
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
  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');

  if (!username || !password) {
    alert('Please provide both username and password.');
    return;
  }

  if (roomName && roomName !== currentRoom) {
    const data = {roomName: roomName, username: username, password: password};

    // Disable join button or show loading indicator until response
    socket.emit('joinRoom', data, (response) => {
      if (response.success) {
        currentRoom = response.roomname; // Update currentRoom with the server-defined name

        if (currentRoom.includes('***')) {
          // Handle private chat
          if (!personalChats[currentRoom]) {
            personalChats[currentRoom] = [];
            updateFriendList();
          }
        } else {
          // Handle public room
          if (!joinedRooms.includes(currentRoom)) {
            joinedRooms.push(currentRoom);
            updateRoomList();
          }
        }

        // Update the UI after joining the room
        document.getElementById('chatWindow').innerHTML = '';
        document.getElementById('currentRoom').textContent =
          `Current Room: ${currentRoom}`;
      } else {
        // Display error message on UI instead of just logging it
        alert(`Failed to join room: ${response.message}`);
        console.error('Failed to join room:', response);
      }

      // Re-enable button or hide loading indicator after response
    });
  }
}

function leaveRoom(roomName) {
  if (roomName && roomName === currentRoom) {
    socket.emit('leaveRoom', {
      roomName: roomName,
      username: localStorage.getItem('username'),
    });
    currentRoom = null;
    document.getElementById('chatWindow').innerHTML = '';
    document.getElementById('currentRoom').textContent = 'Not in any room';
  }
}

function displayMessage(message) {
  const chatWindow = document.getElementById('chatWindow');
  const div = document.createElement('div');
  const sender = message[1];

  const container = document.createElement('div');
  container.style =
    'display: flex; align-items: flex-start; margin-bottom: 10px;';

  const img = document.createElement('img');
  img.src = message[0];
  img.alt = 'Avatar';
  img.style =
    'width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;';

  const messageContainer = document.createElement('div');
  messageContainer.style =
    'background-color: #333; padding: 12px; border-radius: 8px; max-width: 90%; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;';

  const senderDiv = document.createElement('div');
  senderDiv.style = 'font-weight: bold; color: #7289da;';
  senderDiv.textContent = sender;

  const messageDiv = document.createElement('div');
  messageDiv.style = 'color: #dcddde;';
  messageDiv.textContent = message[2];

  messageContainer.appendChild(senderDiv);
  messageContainer.appendChild(messageDiv);

  container.appendChild(img);
  container.appendChild(messageContainer);

  div.appendChild(container);

  // Only display the message if it belongs to the current room
  if (
    (currentRoom.includes('***') && sender !== 'System') ||
    !currentRoom.includes('***')
  ) {
    chatWindow.append(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Add messages to the appropriate storage
  if (currentRoom.includes('***') && sender !== 'System') {
    if (!personalChats[currentRoom]) {
      personalChats[currentRoom] = [];
    }
    personalChats[currentRoom].push(message);
  }
}

socket.on('message', (message) => {
  console.log('New message:', message);
  displayMessage(message);
});

document.getElementById('joinRoomBtn').addEventListener('click', () => {
  const roomName = prompt('Enter room name:');
  if (roomName) {
    joinRoom(roomName);
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    const input = document.getElementById('chatInput');
    const message = [
      input.value,
      localStorage.getItem('username'),
      localStorage.getItem('avatar'),
    ];
    if (message && currentRoom) {
      socket.emit('sendMessage', currentRoom, message);
    } else if (!currentRoom) {
      alert('Please join a room first!');
    }
    input.value = '';
  }
});

if (!localStorage.getItem('username') && !localStorage.getItem('password')) {
  window.location.href = 'index.html';
}
