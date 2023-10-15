const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

// Setup SQLite database
const db = new sqlite3.Database(`database/${process.env.DB_NAME}`, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the botState database.');
});

// Create table if not exists
db.run(
  'CREATE TABLE IF NOT EXISTS state (chat_id TEXT PRIMARY KEY, isActive INTEGER)',
  (err) => {
    if (err) {
      console.error(err.message);
    }
  }
);

// Fetch bot state for a specific chat
function getBotState(chatId, callback) {
  db.get('SELECT isActive FROM state WHERE chat_id = ?', [chatId], callback);
}

// Set bot state for a specific chat
function setBotState(chatId, isActive, callback) {
  db.run(
    'INSERT OR REPLACE INTO state (chat_id, isActive) VALUES (?, ?)',
    [chatId, isActive],
    callback
  );
}

module.exports = {
  getBotState,
  setBotState,
};
