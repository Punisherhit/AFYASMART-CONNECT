const express = require('express');
const router = express.Router();

// @desc    Get system info for splash screen
// @route   GET /api/system/info
router.get('/info', async (req, res) => {
  res.json({
    name: "AfyaSmart Connect",
    version: "1.0.0",
    description: "Comprehensive hospital management solution",
    features: [
      "Appointment Booking",
      "Medical Records",
      "Real-time Analytics"
    ]
  });
});

module.exports = router;