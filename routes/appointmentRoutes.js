const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const { sendReminder } = require('../services/reminderService');

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
router.post('/', protect, async (req, res) => {
  const { doctorId, date, reason } = req.body;
  
  try {
    // First check availability
    const approvedCount = await Appointment.countDocuments({ 
      date, 
      status: 'Approved' 
    });
    
    if (approvedCount >= 5) {
      return res.status(400).json({
        success: false,
        error: 'This date has reached maximum booking capacity'
      });
    }

    const appointment = new Appointment({
      patientId: req.user.id, // From protect middleware
      doctorId,
      date,
      reason,
      status: 'Pending' // Default status
    });
    
    await appointment.save();
    await sendReminder(appointment);
    
    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Check date availability
// @route   GET /api/appointments/availability
// @access  Public
router.get('/availability', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a date parameter'
      });
    }

    const count = await Appointment.countDocuments({ 
      date, 
      status: 'Approved' 
    });
    
    res.json({ 
      success: true,
      available: count < 5,
      remainingSlots: 5 - count
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get user appointments
// @route   GET /api/appointments/my-appointments
// @access  Private
router.get('/my-appointments', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id })
      .populate('doctorId', 'name specialty');
      
    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;