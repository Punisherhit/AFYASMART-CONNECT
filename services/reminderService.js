const nodemailer = require('nodemailer');
const twilio = require('twilio');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.antondewin457,
    pass: process.env.EMAIL_PASS
  }
});

// Twilio setup
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendReminder = async (appointment) => {
  try {
    const patient = await User.findById(appointment.patientId);
    const doctor = await User.findById(appointment.doctorId);
    
    // Send SMS
    if (patient.phone) {
      await twilioClient.messages.create({
        body: `Reminder: Appointment with Dr. ${doctor.name} on ${appointment.date}`,
        from: process.env.TWILIO_PHONE,
        to: patient.phone
      });
      
      // Record reminder
      appointment.reminders.push({ 
        sentAt: new Date(), 
        method: 'sms' 
      });
    }
    
    // Send Email
    if (patient.email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: patient.email,
        subject: 'Appointment Reminder',
        html: `<p>Your appointment with Dr. ${doctor.name} is scheduled for ${appointment.date}</p>`
      });
      
      appointment.reminders.push({ 
        sentAt: new Date(), 
        method: 'email' 
      });
    }
    
    await appointment.save();
  } catch (err) {
    console.error('Reminder error:', err.message);
  }
};