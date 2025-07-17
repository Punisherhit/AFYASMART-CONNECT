require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db'); // Database connection utility
const rateLimit = require('express-rate-limit');
const socket = require('./config/socket'); // Socket.IO configuration

// Initialize Express application
const app = express();

// Connect to the database
connectDB();

// --- Security and Middleware ---
// Apply Helmet for enhanced security headers
app.use(helmet());

// Configure CORS to allow specific origins and methods
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', // Allow specified origins or all (*)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies with a size limit
app.use(express.json({ limit: '10kb' }));

// Logging middleware for development environment
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter); // Apply rate limiting to all requests

// --- Route Imports ---
// Existing routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const labResultRoutes = require('./routes/labResultRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
// const queueRoutes = require('./routes/queue');

// New routes from your provided snippet
const departmentRoutes = require('./routes/departmentRoutes');
const queueRoutes = require('./routes/queueRoutes');
const patientFlowRoutes = require('./routes/patientFlowRoutes');
const transferRoutes = require('./routes/transferRoutes');
const operatorRoutes = require('./routes/operatorRoutes'); // New: Import operator routes
const chatbotRoutes = require('./routes/chatbot.routes'); // New: Import chatbot routes

// Add these after other route imports
const announcementRoutes = require('./routes/announcementRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const systemRoutes = require('./routes/systemRoutes');
const triageRoutes = require('./routes/triage');

// --- API Routes Mounting ---
// Standardizing all API routes under /api/v1/ for consistency
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/lab-results', labResultRoutes);
app.use('/api/v1/admin', adminRoutes); // Already under /api/v1/
app.use('/api/v1/doctors', doctorRoutes);


// Mounting new routes
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/patient-flow', patientFlowRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/operators', operatorRoutes); // New: Mount operator routes
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/v1/triage', triageRoutes);

// Add these before error middleware
app.use('/api/announcements', announcementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/queue', queueRoutes);

// --- Health Check Endpoint ---
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// --- Global Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    // Only send detailed error message in development mode
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// --- Serve Static Assets in Production ---
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the 'client/build' directory
  app.use(express.static(path.join(__dirname, 'client/build')));

  // For any other GET request, serve the 'index.html' file
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// --- Server Configuration ---
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => { // Capture the server instance for Socket.IO
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Initialize Socket.IO with the captured server instance
socket.init(server);

// --- Unhandled Promise Rejection Handling ---
// Gracefully close the server on unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1)); // Close server and exit process
});

module.exports = app;
