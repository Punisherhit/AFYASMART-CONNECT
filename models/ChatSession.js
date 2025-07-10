const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  history: [{
    message: String,
    response: String,
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  context: {
    lastIntent: String,
    pendingAction: String, // e.g., "BOOKING_APPOINTMENT"
    tempData: Object // Store temporary conversation data
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days TTL
  }
});

// Auto-delete expired sessions
chatSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);