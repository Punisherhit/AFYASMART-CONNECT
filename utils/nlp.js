// For OpenAI integration (install package first: npm install openai)
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Store this in your .env file
});

exports.processMessage = async (message) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI processing error:", error);
    return "I'm having trouble understanding. Please try again later.";
  }
};