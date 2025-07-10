const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');

router.post('/', async (req, res) => {
  try {
    const { message, userId } = req.body;
    const sessionId = req.headers['x-session-id'] || generateSessionId();
    
    const result = await chatbotController.handleMessage({
      ...req.body,
      sessionId
    });

    res.header('X-Session-ID', sessionId).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9);
}

module.exports = router;