const socket = io('http://localhost:3000');
let currentRoom = null; 


function displayMessage(message) {
  console.log(message[2]);
  const chatWindow = document.getElementById('chatWindow');
  const div = document.createElement('div');


  div.innerHTML = `
  <div style="display: flex; align-items: flex-start; margin-bottom: 10px; font-family: Arial, sans-serif;">
    <img src="${message[2]}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
    <div>
      <div style="font-weight: bold; color: #7289da;">${message[1]}</div>
      <div style="color: #dcddde;">${message[0]}</div>
    </div>
  </div>`;



  chatWindow.append(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}



document.getElementById('joinRoomBtn').addEventListener('click', () => {
  const roomName = prompt("Enter room name:");
  if (roomName) {
    if (roomName !== currentRoom) {
      currentRoom = roomName; 
      socket.emit('joinRoom', roomName); 
    }
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


socket.on('message', (message) => {
  displayMessage(message);
});


socket.on('connect', () => {
  //not used anymore
});
