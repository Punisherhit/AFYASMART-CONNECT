const mongoose = require('mongoose');
const ChatSchema = new mongoose.Schema({
  userId: String,
  message: String,
  reply: String,
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Chat', ChatSchema);