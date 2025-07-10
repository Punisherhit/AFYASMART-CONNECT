const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Twilio client
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send email
exports.sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html
  };

  // In development, log instead of sending
  if (process.env.NODE_ENV === 'development') {
    console.log('Email:', mailOptions);
    return { success: true };
  }

  return transporter.sendMail(mailOptions);
};

// Send SMS via Twilio
exports.sendSMS = async ({ to, body }) => {
  // In development, log instead of sending
  if (process.env.NODE_ENV === 'development') {
    console.log(`SMS to ${to}: ${body}`);
    return { success: true };
  }

  return twilioClient.messages.create({
    body,
    from: process.env.TWILIO_PHONE,
    to: to.startsWith('+') ? to : `+${to}`
  });
};