const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');

// Make sure to properly bind the controller method
router.post('/', (req, res) => {
  chatbotController.handleMessage(req, res)
    .catch(err => {
      console.error('Unhandled error in chatbot route:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

module.exports = router;