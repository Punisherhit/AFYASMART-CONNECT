const { faqMenu, appointmentTypes } = require('../utils/chatbotMenu');
const ChatSession = require('../models/ChatSession');

exports.handleMessage = async (req, res) => {
  try {
    // 1. Validate request body exists
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: "Request body must be a JSON object",
        solution: "Set Content-Type: application/json and send valid JSON"
      });
    }

    // 2. Destructure with default values
    const { payload = null, text = null } = req.body;
    
    // 3. Validate at least one field exists
    if (!payload && !text) {
      return res.status(400).json({ 
        error: "Either 'payload' or 'text' must be provided",
        example_request: {
          payload: "BOOK_APPOINTMENT",
          text: "How do I book an appointment?"
        }
      });
    }

    // 4. Generate response
    const responseData = await generateResponse(payload, text);
    
    // 5. Log chat session if authenticated
    if (req.user?.id) {
      await logChatSession(
        req.user.id, 
        payload || text, 
        responseData
      ).catch(err => {
        console.error('Non-blocking chat log error:', err);
      });
    }

    // 6. Send success response
    res.json({
      success: true,
      data: responseData,
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Chatbot processing error:', err);
    res.status(500).json({ 
      error: "Chatbot service unavailable",
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack
      })
    });
  }
};

// Helper function to generate appropriate responses
async function generateResponse(payload, text) {
  // Payload-based responses
  if (payload) {
    switch (payload) {
      case "BOOK_APPOINTMENT":
        return { 
          type: "appointment_options",
          data: appointmentTypes 
        };
      case "APPOINTMENT_IN_PERSON":
        return { 
          type: "redirect",
          text: "Redirecting to booking page...", 
          redirect: "/book?type=in-person",
          immediate: true
        };
      default:
        return {
          type: "faq_menu",
          data: faqMenu
        };
    }
  }

  // Text-based responses
  if (text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("appointment")) {
      return {
        type: "appointment_options",
        data: appointmentTypes
      };
    }
    
    if (lowerText.includes("hello") || lowerText.includes("hi")) {
      return {
        type: "greeting",
        text: "Hello! How can I help you today?",
        options: faqMenu
      };
    }
  }
  
  // Default fallback
  return {
    type: "faq_menu",
    data: faqMenu
  };
}

// Helper function to log chat sessions
async function logChatSession(userId, message, response) {
  const sessionData = {
    userId,
    lastActivity: new Date(),
    $push: { 
      history: { 
        message, 
        response,
        timestamp: new Date() 
      } 
    }
  };

  await ChatSession.findOneAndUpdate(
    { userId },
    sessionData,
    { upsert: true, new: true }
  );
}