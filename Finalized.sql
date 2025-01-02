-- creating tables

CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,  -- Changed to TEXT for usernames
    avatar TEXT
);

CREATE TABLE Posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    user_id INTEGER,  -- Foreign key reference to Users (INTEGER for user IDs)
    channel_id INTEGER,  -- Foreign key reference to Channels (TEXT for channel IDs)
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (channel_id) REFERENCES Channels(id)
);

CREATE TABLE Channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Now auto-incremented for channel IDs
    Channelname TEXT UNIQUE NOT NULL,
    private BOOLEAN DEFAULT 0
);

-- Table for many-to-many relationship between users and public channels
CREATE TABLE PublicChannels (
    user_id INTEGER,  -- Foreign key to Users (INTEGER)
    channel_id INTEGER,  -- Foreign key to Channels (INTEGER)
    PRIMARY KEY (user_id, channel_id),  -- Ensures unique combination of user and channel
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (channel_id) REFERENCES Channels(id)
);

-- Table for private channels (one-to-one messaging between users)
CREATE TABLE PrivateChannels (
    channel_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id1 INTEGER,  -- First user (INTEGER)
    user_id2 INTEGER,  -- Second user (INTEGER)
    FOREIGN KEY (user_id1) REFERENCES Users(id),
    FOREIGN KEY (user_id2) REFERENCES Users(id)
);

-- create channels
INSERT INTO Channels (Channelname) VALUES ('The second best channel in the world');
INSERT INTO Channels (Channelname) VALUES ('Another channel');

-- creating users
INSERT INTO Users (username) VALUES ('Mech654');

-- adding users to channels
INSERT INTO PublicChannels (user_id, channel_id) VALUES (1, 1);
INSERT INTO PublicChannels (user_id, channel_id) VALUES (1, 2);
INSERT INTO PublicChannels (user_id, channel_id) VALUES (2, 1);

-- creating a new post
INSERT INTO Posts (message, user_id, channel_id) VALUES ('hello world', 1, 1);

-- Selection of data

-- get specific Post
SELECT U.username, p.message, c.Channelname as channel_name 
FROM Posts p
LEFT JOIN Users U ON p.user_id = U.id
LEFT JOIN Channels C ON p.channel_id = C.id
WHERE p.id = 1;

-- get all posts in a channel
SELECT U.username, p.message, c.Channelname as channel_name 
FROM Posts p
LEFT JOIN Users U ON p.user_id = U.id
LEFT JOIN Channels C ON p.channel_id = C.id
WHERE p.channel_id = 1;

-- get all users in a public channel
SELECT U.username, c.Channelname as channel_name
FROM PublicChannels pc
JOIN Users U ON pc.user_id = U.id
JOIN Channels c ON pc.channel_id = c.id
WHERE pc.channel_id = 1;

-- get all channels a user is in
SELECT c.Channelname, pc.channel_id 
FROM PublicChannels pc
JOIN Channels c ON pc.channel_id = c.id
WHERE pc.user_id = 1;

-- get all posts by a user
SELECT p.message, c.Channelname as channel_name
FROM Posts p
JOIN Channels c ON p.channel_id = c.id
WHERE p.user_id = 1;
