const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '../../.env')});
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const {Server} = require('socket.io');

// AES-256-CBC encryption setup
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const key = process.env.KEY;

const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(key)
  .digest('base64')
  .substr(0, 32); // Hash the key to ensure it's 32 bytes long

// Function to encrypt data
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Function to decrypt data
function decrypt(text) {
  console.log('text is: ' + text);
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = parts.join(':');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

let socketRooms = {};

// SQLite database setup
// 1. Remember to change the path.
// 2. Be careful if you want to put .db in your workspace because some local server extensions in vscode make the site refresh when binard code is changed.

// Define the absolute path where the database will be stored, including the file name 'database.db'
const absoluteDbPath = path.resolve(
  'C:\\Users\\ahme1636\\Desktop',
  'database.db',
);

// Initialize the SQLite database
let db = new sqlite3.Database(absoluteDbPath, (err) => {
  if (err) {
    console.error(
      'Error opening database at path:',
      absoluteDbPath,
      '\n',
      err.message,
    );
  } else {
    console.log('Connected to the SQLite database at:', absoluteDbPath);
  }
});

async function initializeAllTables() {
  return new Promise((resolve, reject) => {
    const queries = [
      `CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT
      )`,

      `CREATE TABLE IF NOT EXISTS Posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        user_id INTEGER,
        channel_id TEXT,
        FOREIGN KEY (user_id) REFERENCES Users(id),
        FOREIGN KEY (channel_id) REFERENCES Channels(id)
      )`,

      `CREATE TABLE IF NOT EXISTS Channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Channel_name TEXT UNIQUE NOT NULL,
        private BOOLEAN DEFAULT 0
      )`,

      `CREATE TABLE IF NOT EXISTS PublicChannels (
        channel_id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_name TEXT,
        FOREIGN KEY (channel_id) REFERENCES Channels(id)
      )`,

      `CREATE TABLE IF NOT EXISTS PrivateChannels (
        channel_id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_name TEXT UNIQUE NOT NULL,
        user_id1 INTEGER,
        user_id2 INTEGER,
        FOREIGN KEY (user_id1) REFERENCES Users(id),
        FOREIGN KEY (user_id2) REFERENCES Users(id)
      )`,
    ];

    queries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err) {
          console.error(`Error creating table ${index + 1}:`, err.message);
          reject(err);
        } else {
          console.log(`Successfully created table ${index + 1}`);
        }
      });
    });
    resolve();
  });
}

async function savePost(message, user_id, channel_id) {
  return new Promise((resolve, reject) => {
    const query = `
        INSERT INTO Posts (message, user_id, channel_id)
        VALUES (?, ?, ?);
        `;
    const encryptedMessage = encrypt(message);
    db.run(query, [encryptedMessage, user_id, channel_id], function (err) {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        console.log('Successfully saved post');
        resolve();
      }
    });
  });
}

async function saveUser(username, password, avatar) {
  return new Promise((resolve) => {
    const query = `
        INSERT INTO Users (username, password, avatar)
        VALUES (?, ?, ?);
    `;
    db.run(query, [username, password, avatar], function (err) {
      if (err) {
        console.error(`Error:`, err.message);
        resolve(false); // Return false on error
      } else {
        console.log('Successfully saved user');
        resolve(true); // Return true on success
      }
    });
  });
}

async function getUser(username, password) {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT * FROM Users
        WHERE username = ? AND password = ?;
    `;
    db.get(query, [username, password], (err, row) => {
      if (err) {
        console.error(`Error:`, err.message);
        reject(false); // On error, reject with false
      } else {
        if (row) {
          console.log('User exists and password is correct');
          resolve(true); // User exists and password matches
        } else {
          console.log('User does not exist or password is incorrect');
          resolve(false); // User doesn't exist or password doesn't match
        }
      }
    });
  });
}

async function checkForChannelName(tableName, username) {
  return new Promise((resolve, reject) => {
    const one = username + '***' + tableName;
    const two = tableName + '***' + username;

    const query = `
        SELECT * FROM Channels WHERE Channel_name IN (?, ?, ?);
    `;
    db.get(query, [tableName, one, two], (err, row) => {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        if (row) {
          console.log(`Row with Channel_name "${tableName}" exists`);
          // Return both the existence status and the 'private' attribute value if it exists
          console.log('row name: ' + row.Channel_name);
          resolve({
            exists: true,
            private: row.private,
            channel_name: row.Channel_name,
            table: row.Channel_name,
          });
        } else {
          console.log(`Row with Channel_name "${tableName}" does not exist`);
          resolve({exists: false});
        }
      }
    });
  });
}

async function isTheRoomAUser(roomName) {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT * FROM Users WHERE username = ?;
    `;
    db.get(query, [roomName], (err, row) => {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        if (row) {
          console.log(`Row with username "${roomName}" exists`);
          resolve(true);
        } else {
          console.log(`Row with username "${roomName}" does not exist`);
          resolve(false);
        }
      }
    });
  });
}

function generateRandomRoomName() {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

async function savePrivateChannel(channelName, user_id1, user_id2) {
  return new Promise((resolve, reject) => {
    const query = `
        INSERT INTO PrivateChannels (channel_name, user_id1, user_id2)
        VALUES (?, ?, ?);
    `;
    db.run(query, [channelName, user_id1, user_id2], function (err) {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        console.log('Successfully saved private channel');
        resolve();
      }
    });
  });
}

async function savePublicChannel(channelName) {
  return new Promise((resolve, reject) => {
    const query = `
        INSERT INTO PublicChannels (channel_name)
        VALUES (?);
    `;
    db.run(query, [channelName], function (err) {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        console.log('Successfully saved public channel');
        resolve();
      }
    });
  });
}

async function saveToChannels(channelName, private) {
  return new Promise((resolve, reject) => {
    const query = `
        INSERT INTO Channels (Channel_name, private)
        VALUES (?, ?);
    `;
    db.run(query, [channelName, private], function (err) {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function saveInPosts(message, user_id, channel_id) {
  return new Promise((resolve, reject) => {
    const query = `
        INSERT INTO Posts (message, user_id, channel_id)
        VALUES (?, ?, ?);
    `;
    db.run(query, [message, user_id, channel_id], function (err) {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function getUserAvatar(username) {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT avatar FROM Users WHERE username = ?;
    `;
    db.get(query, [username], (err, row) => {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        if (row) {
          resolve(row.avatar);
        } else {
          resolve(null);
        }
      }
    });
  });
}

async function getUserAvatarById(user_id) {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT avatar FROM Users WHERE id = ?;
    `;
    db.get(query, [user_id], (err, row) => {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        if (row) {
          resolve(row.avatar);
        } else {
          resolve(null);
        }
      }
    });
  });
}

async function getUsernameById(user_id) {
  return new Promise((resolve, reject) => {
    const query = `

        SELECT username FROM Users WHERE id = ?;
    `;
    db.get(query, [user_id], (err, row) => {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        if (row) {
          resolve(row.username);
        } else {
          resolve(null);
        }
      }
    });
  });
}

async function getUserId(username) {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT id FROM Users WHERE username = ?;
    `;
    db.get(query, [username], (err, row) => {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        if (row) {
          resolve(row.id);
        } else {
          resolve(null);
        }
      }
    });
  });
}

async function getEarlierMessages(channelName) {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT * FROM Posts WHERE channel_id = ?;
    `;
    db.all(query, [channelName], (err, rows) => {
      if (err) {
        console.error(`Error:`, err.message);
        reject(err);
      } else {
        if (rows) {
          resolve(rows);
        } else {
          resolve([]);
        }
      }
    });
  });
}

// Socket.IO setup
const io = new Server(3000, {
  cors: {
    origin: ['http://127.0.0.1:5501', 'http://localhost:5500'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

function generateRoomName(user1, user2) {
  return user1 + '***' + user2;
}

io.on('connection', (socket) => {
  // Object to track rooms the user is in
  const socketRooms = {};

  socket.on('joinRoom', async (data, callback) => {
    // Notice the `callback` here
    const {roomName, username, password} = data;
    try {
      // If the user is already in a room, leave the previous room
      if (socketRooms[socket.id]) {
        const previousRoom = socketRooms[socket.id];
        socket.leave(previousRoom);
      }

      // Check if the room exists and proceed with joining or creating a new room
      const {
        exists,
        private: privateValue,
        channel_name,
        table,
      } = await checkForChannelName(roomName, username);
      console.log('the value is of private is: ' + privateValue);
      if (exists) {
        if (privateValue == 1) {
          if (table != roomName) {
            console.log('roomName: ' + roomName + ' table: ' + table);
            //Make sure that the user is THE user
            const realUser = await getUser(username, password);
            if (!realUser) {
              throw new Error('Invalid user');
            }
            socket.join(channel_name); // Join user to this room/channel
            callback({success: true, roomname: channel_name});
          } else {
            callback({success: false, roomname: roomName});
            console.log('Unauthorized access');
          }
        } else {
          socket.join(roomName); // Join user to this room/channel
          callback({success: true, roomname: roomName});
        }
      } else {
        // Check if the room is a user
        const isUser = await isTheRoomAUser(roomName);
        if (isUser && table != roomName) {
          console.log('roomName: ' + roomName + ' table: ' + table);
          const realUser = await getUser(username, password);
          if (!realUser) {
            throw new Error('Invalid user');
          }
          const generatedRoomName = generateRoomName(username, roomName); // Generate new room name
          savePrivateChannel(generatedRoomName, roomName, username); // Create a new private channel
          saveToChannels(generatedRoomName, true);
          socket.join(generatedRoomName); // Join user to the generated private room
          callback({success: true, roomname: generatedRoomName});
        } else {
          savePublicChannel(roomName); // Create a new public channel with this name
          saveToChannels(roomName, false); // Create a new public channel
          socket.join(roomName); // Join user to the public room
          callback({success: true, roomname: roomName});
        }
      }

      // Save the room for the user to keep track of where they are
      socketRooms[socket.id] = roomName;

      //send earlier messages
      const earlierMessages = await getEarlierMessages(
        privateValue == 1 ? channel_name : roomName,
      );

      if (earlierMessages.length > 0) {
        for (const message of earlierMessages) {
          const decryptedMessage = decrypt(message.message);

          const avatar = await getUserAvatarById(message.user_id);
          const othersUsername = await getUsernameById(message.user_id);

          socket.emit('message', [avatar, othersUsername, decryptedMessage]);
        }
      }
    } catch (err) {
      // Handle error
      console.error('Error during room join:', err);
      callback({success: true, roomname: roomName});
    }
  });

  socket.on('sendMessage', async (roomName, message) => {
    try {
      if (!roomName || !message || message.length < 3) {
        throw new Error('Invalid message format or missing room');
      }

      const [messageText, username, avatar] = message; // Ensure correct destructuring
      const userId = await getUserId(username);

      // Save the message to the database
      await savePost(messageText, userId, roomName);

      const userAvatar = await getUserAvatar(username);
      // Emit the message to all clients in the room, including the sender
      socket.to(roomName).emit('message', [userAvatar, username, messageText]); // Correct order: [avatar, name, post]
      socket.emit('message', [userAvatar, username, messageText]); // Send the message back to the sender in the correct order
    } catch (err) {
      console.error(
        `Error in 'sendMessage' for room "${roomName}":`,
        err.message,
      );
    }
  });

  socket.on('register', async (data, callback) => {
    const {username, password, profileImage} = data;

    try {
      const user = await saveUser(username, password, profileImage);
      if (user) {
        callback({success: true, user});
        console.log(`User ${username} successfully registered`);
      } else {
        callback({success: false, message: 'Registration failed'});
        console.log(`User ${username} registration failed`);
      }
    } catch (err) {
      console.error(`Error in 'register' for user "${username}":`, err.message);
      callback({success: false, message: err.message});
    }
  });

  socket.on('login', async (data, callback) => {
    const {username, password} = data;
    console.log(`Received login request for user: ${username}`);

    try {
      const user = await getUser(username, password);
      if (user) {
        callback({success: true, user});
        console.log(`User ${username} successfully logged in`);
      } else {
        callback({
          success: false,
          message: 'Username or password was incorrect.',
        });
        console.log(`User ${username} login failed`);
      }
    } catch (err) {
      console.error(`Error in 'login' for user "${username}":`, err.message);
      callback({success: false, message: err.message});
    }
  });

  // Clean up the socket's room data when the user disconnects
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Clean up the room data
    delete socketRooms[socket.id];
  });
});

//Only run once for table generation
//initializeAllTables();
