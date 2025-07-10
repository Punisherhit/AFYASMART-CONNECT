const express = require('express');
const Appointment = require('../models/Appointment');
const router = express.Router();
const { protect } = require('../middleware/auth');
const checkDailyLimit = require('../middleware/bookingLimit');


exports.approveAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const appointment = await Appointment.findById(appointmentId);

  // Check daily limit before approving
  const dailyAppointments = await Appointment.countDocuments({ 
    date: appointment.date, 
    status: 'Approved' 
  });

  if (dailyAppointments >= 5) {
    return res.status(400).json({ error: "Daily slot limit reached" });
  }

  appointment.status = 'Approved';
  await appointment.save();
  
  res.json({ message: "Appointment approved", appointment });
};