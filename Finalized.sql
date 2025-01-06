-- creating tables

CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,  -- Changed to TEXT for usernames
    password TEXT NOT NULL,
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
    Channel_name TEXT UNIQUE NOT NULL,
    private BOOLEAN DEFAULT 0
);

-- Table for many-to-many relationship between users and public channels
CREATE TABLE PublicChannels (
    user_id INTEGER,  -- Foreign key to Users (INTEGER)
    channel_id INTEGER,  -- Foreign key to Channels (INTEGER)
    channel_name TEXT,  -- Channel name for reference
    PRIMARY KEY (user_id, channel_id),  -- Ensures unique combination of user and channel
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (channel_id) REFERENCES Channels(id)
);

-- Table for private channels (one-to-one messaging between users)
CREATE TABLE PrivateChannels (
    channel_id INTEGER PRIMARY KEY AUTOINCREMENT,
    channelname TEXT UNIQUE NOT NULL,
    user_id1 INTEGER,  -- First user (INTEGER)
    user_id2 INTEGER,  -- Second user (INTEGER)
    FOREIGN KEY (user_id1) REFERENCES Users(id),
    FOREIGN KEY (user_id2) REFERENCES Users(id)
);

