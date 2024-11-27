const { Server } = require("socket.io");

const io = new Server(3000, {
  cors: {
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],  // Allow only localhost:5500
    methods: ["GET", "POST"],  // Allow GET and POST methods
    allowedHeaders: ["my-custom-header"], // If you're using custom headers
    credentials: true  // Allow cookies, if needed
  }
});

// Store the current room for each socket
const socketRooms = {};

io.on('connection', (socket) => {
  console.log(`Client connected with id: ${socket.id}`);

  // Event listener for joining a room
  socket.on('joinRoom', (roomName) => {
    // If the client is already in a room, leave the previous room
    if (socketRooms[socket.id]) {
      const previousRoom = socketRooms[socket.id];
      socket.leave(previousRoom);
      socket.to(previousRoom).emit('message', `${socket.id} has left the room.`);
      console.log(`${socket.id} left room: ${previousRoom}`);
    }

    // Join the new room
    socket.join(roomName);
    socketRooms[socket.id] = roomName;  // Update the room the client is in
    console.log(`${socket.id} joined room: ${roomName}`);



  });

  // Event listener for sending messages
  socket.on('sendMessage', (roomName, message) => {
    socket.to(roomName).emit('message', message);  // Send message to everyone in the room
    socket.emit('message', message);  // Optionally send message back to the sender
  });

  // Event listener for leaving a room
  socket.on('leaveRoom', (roomName) => {
    socket.leave(roomName);
    socketRooms[socket.id] = null;  // Remove the room from the socketRooms record
    console.log(`${socket.id} left room: ${roomName}`);
    socket.to(roomName).emit('message', `${socket.id} has left the room.`);
  });

  // Clean up when the client disconnects
  socket.on('disconnect', () => {
    const room = socketRooms[socket.id];
    if (room) {
      socket.to(room).emit('message', `${socket.id} has disconnected.`);
    }
    delete socketRooms[socket.id];  // Remove the client from the room record
    console.log(`Client disconnected: ${socket.id}`);
  });
});

console.log('Server is running on http://localhost:3000');
