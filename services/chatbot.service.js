// const openai = require('../utils/nlp'); // Or direct API call

// exports.getReply = async (message, userId) => {
//   // Rule-based replies (simple)
//   if (message.includes("appointment")) {
//     return "Book appointments at /book-appointment. Need help?";
//   }

//   // AI-powered (OpenAI example)
//   const response = await openai.chat.completions.create({
//     model: "gpt-3.5-turbo",
//     messages: [{ role: "user", content: message }],
//   });
//   return response.choices[0].message.content;
// };

const { processMessage } = require('../utils/nlp');
const Announcement = require('../models/Announcement');

exports.getReply = async (message, userId) => {
  // New: Check for announcements queries
  if (message.toLowerCase().includes('announcements') || message.toLowerCase().includes('news')) {
    const announcements = await Announcement.find().limit(3);
    return {
      text: 'Latest announcements:',
      announcements: announcements.map(a => `${a.title}\n${a.content.slice(0,50)}...`)
    };
  }

  // Rule-based replies first
  if (message.toLowerCase().includes("appointment")) {
    return "You can book appointments at /book-appointment. Would you like me to guide you through the process?";
  }
  
  // Then fall back to AI
  return await processMessage(message);
};