const rateLimit = require('express-rate-limit');

// Limit M-Pesa API calls to 10 requests/minute
const mpesaLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, 
  message: "Too many M-Pesa requests! Calm down, bro."
});

module.exports = mpesaLimiter;