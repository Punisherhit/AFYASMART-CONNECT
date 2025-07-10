const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Security headers: Sets various HTTP headers for security
exports.securityHeaders = helmet();

// Rate limiting: Limits repeated requests to public APIs to prevent abuse
exports.limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Max 100 requests per IP address within the window
  message: 'Too many requests from this IP, please try again after 15 minutes' // Message sent when limit is exceeded
});

// Data sanitization: An array of middleware to clean incoming data
exports.sanitizeData = [
  mongoSanitize(), // Prevents NoSQL query injection by sanitizing user-supplied data
  xss(), // Prevents Cross-Site Scripting (XSS) attacks by sanitizing user input
  hpp() // Prevents HTTP Parameter Pollution attacks by ensuring unique query parameters
];

// CORS configuration: Defines Cross-Origin Resource Sharing options
exports.corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // Allows requests from specified origin or any origin (*)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'] // Allowed request headers
};
