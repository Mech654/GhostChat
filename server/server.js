const { Server } = require("socket.io");
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('C:/Users/ahme1636/Desktop/database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

async function checkForTableExist(tableName) {
  console.log(`Checking if table "${tableName}" exists...`);
  return new Promise((resolve, reject) => {
    const query = `CREATE TABLE IF NOT EXISTS "${tableName}" (
      id INTEGER PRIMARY KEY,
      avatar TEXT,
      name TEXT,
      post TEXT
    )`;
    db.run(query, (err) => {
      if (err) {
        console.error(`Error creating table "${tableName}":`, err.message);
        reject(err);
      } else {
        console.log(`Table "${tableName}" checked/created.`);
        resolve();
      }
    });
  });
}

async function insertData(tableName, data) {
  console.log(`Inserting data into table "${tableName}":`, data);
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO "${tableName}" (avatar, name, post) VALUES (?, ?, ?)`;
    db.run(query, [data.avatar, data.name, data.post], (err) => {
      if (err) {
        console.error(`Error inserting data into "${tableName}":`, err.message);
        reject(err);
      } else {
        console.log(`Data inserted into "${tableName}".`);
        resolve();
      }
    });
  });
}

async function getData(tableName) {
  console.log(`Fetching data from table "${tableName}"...`);
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM "${tableName}"`;
    db.all(query, (err, rows) => {
      if (err) {
        console.error(`Error selecting data from "${tableName}":`, err.message);
        reject(err);
      } else {
        console.log(`Fetched data from "${tableName}":`, rows);
        resolve(rows);
      }
    });
  });
}

const io = new Server(3000, {
  cors: {
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const socketRooms = {};

io.on('connection', (socket) => {
  console.log(`Client connected with id: ${socket.id}`);

  socket.on('joinRoom', async (roomName) => {
    console.log(`${socket.id} trying to join room: ${roomName}`);
    try {
        if (socketRooms[socket.id]) {
            const previousRoom = socketRooms[socket.id];
            socket.leave(previousRoom);
            console.log(`${socket.id} left room: ${previousRoom}`);
        }

        socket.join(roomName);
        socketRooms[socket.id] = roomName;
        console.log(`${socket.id} joined room: ${roomName}`);

        await checkForTableExist(roomName);
        const messages = await getData(roomName);

        if (messages && messages.length > 0) {
            messages.forEach((message) => {
                socket.emit('message', [message.avatar, message.name, message.post]);
            });
            console.log(`${socket.id} has received previous messages for room "${roomName}"`);
        } else {
            console.log(`No messages found in room "${roomName}".`);
            socket.emit('message', ["", "System", "No messages yet in this room."]);
        }

    } catch (err) {
        console.error(`Error in 'joinRoom' for room "${roomName}":`, err.message);
    }
  });
  socket.on('sendMessage', async (roomName, message) => {
    console.log(`Received message in room "${roomName}" from client ${socket.id}:`, message);
    try {
        if (!roomName || !message || message.length < 3) {
            throw new Error('Invalid message format or missing room');
        }

        const [messageText, username, avatar] = message;  // Ensure correct destructuring
        await checkForTableExist(roomName);  // Ensure the table exists for the room
        await insertData(roomName, { avatar, name: username, post: messageText });  // Insert message into DB

        // Emit the message to all clients in the room, including the sender
        socket.to(roomName).emit('message', [avatar, username, messageText]);  // Correct order: [avatar, name, post]
        socket.emit('message', [avatar, username, messageText]);  // Send the message back to the sender in the correct order

        console.log(`Message from ${socket.id} successfully sent in room "${roomName}"`);
    } catch (err) {
        console.error(`Error in 'sendMessage' for room "${roomName}":`, err.message);
    }
});


  socket.on('leaveRoom', (roomName) => {
    console.log(`${socket.id} is leaving room: ${roomName}`);
    try {
      socket.leave(roomName);
      socketRooms[socket.id] = null;
      console.log(`${socket.id} left room: ${roomName}`);
    } catch (err) {
      console.error(`Error in 'leaveRoom' for room "${roomName}":`, err.message);
    }
  });
});

console.log('Server is running on port 3000');
