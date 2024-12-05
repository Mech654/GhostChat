const { Server } = require("socket.io");
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Function to create table if not exists
async function checkForTableExist(tableName) {
  return new Promise((resolve, reject) => {
    const query = `CREATE TABLE IF NOT EXISTS "${tableName}" (
      id INTEGER PRIMARY KEY,
      avatar TEXT,
      name TEXT,
      post TEXT
    )`;
    
    db.run(query, (err) => {
      if (err) {
        reject(`Error creating table "${tableName}": ${err.message}`);
      } else {
        console.log(`Table "${tableName}" checked/created.`);
        resolve();
      }
    });
  });
}

async function insertData(tableName, data) {
  return new Promise((resolve, reject) => {
    // Når man inserter data i en database er det en god ide
    // at santiere dataen først
    // eller bruge prepared statements.
    /*
    db.run(preparedStmt, data, (err) => {
      if (err) {
        reject(`Error inserting data into "${tableName}": ${err.message}`);
      } else {
        resolve(`Data inserted into "${tableName}".`);
      }
    });
    */

    // med Prepared statements
    // evt. lav 3 tables med med posts, users channels hvor posts referer til users og den channel som beskeden er i
    const preparedStmt = db.prepare('INSERT INTO ' + tableName + ' (post, name, avatar) VALUES (?, ?, ?)');
    preparedStmt.finalize();
    preparedStmt.run(data, (err) => {
      if (err) {
        reject(`Error inserting data into "${tableName}": ${err.message}`);
      } else {
        resolve(`Data inserted into "${tableName}".`);
      }
    })

  });
}

// Function to get data from table
async function getData(tableName) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM "${tableName}"`;
    console.log(query);
    db.all(query, (err, rows) => {
      if (err) {
        reject(`Error selecting data from "${tableName}": ${err.message}`);
      } else {
        resolve(rows);
      }
    });
  });
}

// Initialize socket.io server
const io = new Server(3000, {
  cors: {
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

const socketRooms = {};

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`Client connected with id: ${socket.id}`);
  socket.on('joinRoom', async (roomName) => {
    try {
      // Leave previous room if present
      if (socketRooms[socket.id]) {
        const previousRoom = socketRooms[socket.id];
        socket.leave(previousRoom);
        socket.to(previousRoom).emit('message', `${socket.id} has left the room.`);
        console.log(`${socket.id} left room: ${previousRoom}`);
      }

      socket.join(roomName);
      socketRooms[socket.id] = roomName;
      console.log(`${socket.id} joined room: ${roomName}`);

      // Ensure the table exists
      //await checkForTableExist(roomName);

      // Retrieve and send existing messages
      const messages = await getData(roomName);
      messages.forEach((message) => {
        const messageArray = [message.avatar, message.name, message.post];
        socket.emit('message', messageArray);
      });
    } catch (err) {
      console.error(`Error in 'joinRoom' for room "${roomName}":`, err.message);
    }
  });

  socket.on('sendMessage', async (roomName, message) => {
    try {

      //await checkForTableExist(roomName);

      // Broadcast message to room and to the sender
      socket.to(roomName).emit('message', message);
      socket.emit('message', message);
      console.log(`Message sent to room "${roomName}":`, message);
      
      //await insertData(roomName, message); // Crashes here
    } catch (err) {
      console.error(`Error in 'sendMessage' for room "${roomName}":`, err.message);
    }
  });

  socket.on('leaveRoom', (roomName) => {
    try {
      socket.leave(roomName);
      socketRooms[socket.id] = null;
      console.log(`${socket.id} left room: ${roomName}`);
      socket.to(roomName).emit('message', `${socket.id} has left the room.`);
    } catch (err) {
      console.error(`Error in 'leaveRoom' for room "${roomName}":`, err.message);
    }
  });
});

console.log('Server is running on {current.address}:3000');
  