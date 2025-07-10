const { faqMenu, appointmentTypes } = require('../utils/chatbotMenu');
const ChatSession = require('../models/ChatSession');

exports.handleMessage = async (req, res) => {
  try {
    const { payload, text } = req.body;
    
    // Validate input
    if (!payload && !text) {
      return res.status(400).json({ 
        error: "Either 'payload' or 'text' must be provided" 
      });
    }

    // Determine response based on input
    let responseData = await generateResponse(payload, text);
    
    // Save to chat history if user is authenticated
    if (req.user?.id) {
      await logChatSession(
        req.user.id, 
        payload || text, 
        responseData
      );
    }

    // Send final response
    res.json(responseData);

  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ 
      error: "Chatbot service unavailable",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Helper function to generate appropriate responses
async function generateResponse(payload, text) {
  if (payload) {
    switch (payload) {
      case "BOOK_APPOINTMENT":
        return appointmentTypes;
      case "APPOINTMENT_IN_PERSON":
        return { 
          text: "Redirecting to booking page...", 
          redirect: "/book?type=in-person" 
        };
      default:
        return faqMenu;
    }
  }

  // Text-based responses
  if (text && text.toLowerCase().includes("appointment")) {
    return appointmentTypes;
  }
  
  return faqMenu;
}

// Helper function to log chat sessions
async function logChatSession(userId, message, response) {
  try {
    await ChatSession.findOneAndUpdate(
      { userId },
      { 
        $push: { 
          history: { 
            message, 
            response,
            timestamp: new Date() 
          } 
        } 
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Chat session logging failed:', err.message);
    // Consider adding to a dead-letter queue for retry
  }
}