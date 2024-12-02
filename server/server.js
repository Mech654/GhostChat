const { Server } = require("socket.io");
const sqlite3 = require('sqlite3').verbose();


let db = new sqlite3.Database('database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});


function checkForTableExist(tableName) {
  db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (id INTEGER PRIMARY KEY, avatar TEXT, name TEXT, post TEXT)`, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    }
  });
}


function insertData(tableName, data) {
  db.run(`INSERT INTO ${tableName} (post, name, avatar) VALUES (?, ?, ?)`, [data[0], data[1], data[2]], function (err) {
    if (err) {
      console.error('Error inserting data:', err.message);
    }
  });
}


function getData(tableName){
  db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
    if (err) {
      console.error('Error selecting data:', err.message);
    } else {
      return rows;
    }
  });
}



const io = new Server(3000, {
  cors: {
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

const socketRooms = {};





io.on('connection', (socket) => {
  console.log(`Client connected with id: ${socket.id}`);

  socket.on('joinRoom', (roomName) => {
    if (socketRooms[socket.id]) {
      const previousRoom = socketRooms[socket.id];
      socket.leave(previousRoom);
      socket.to(previousRoom).emit('message', `${socket.id} has left the room.`);
      console.log(`${socket.id} left room: ${previousRoom}`);
    }

    socket.join(roomName);
    socketRooms[socket.id] = roomName;
    console.log(`${socket.id} joined room: ${roomName}`);

    checkForTableExist(roomName);
    const messages = getData(roomName);
    if (messages) {
      messages.forEach((message) => {
      socket.emit('message', message);
      });
    }
  });

  socket.on('sendMessage', (roomName, message) => {
    socket.to(roomName).emit('message', message);
    socket.emit('message', message);
    checkForTableExist(roomName);
    insertData(roomName, message);
  });

  socket.on('leaveRoom', (roomName) => {
    socket.leave(roomName);
    socketRooms[socket.id] = null;
    console.log(`${socket.id} left room: ${roomName}`);
    socket.to(roomName).emit('message', `${socket.id} has left the room.`);
  });
});

console.log('Server is running on http://localhost:3000');
