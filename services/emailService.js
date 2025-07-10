const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send appointment confirmation
exports.sendAppointmentConfirmation = async (data) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: data.patientEmail,
    subject: 'Appointment Confirmation',
    html: `
      <h1>Appointment Confirmation</h1>
      <p>Dear ${data.patientName},</p>
      <p>Your appointment has been successfully booked with Dr. ${data.doctorName}.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li>Hospital: ${data.hospitalName}</li>
        <li>Date: ${new Date(data.date).toLocaleDateString()}</li>
        <li>Time Slot: ${data.timeSlot}</li>
        <li>Appointment ID: ${data.appointmentId}</li>
      </ul>
      <p>Thank you for choosing our service!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Appointment confirmation sent to ${data.patientEmail}`);
  } catch (error) {
    console.error('Error sending appointment confirmation:', error.message);
  }
};