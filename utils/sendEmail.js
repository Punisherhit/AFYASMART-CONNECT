const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter (use environment variables)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // For development: log to console instead of sending
  if (process.env.NODE_ENV === 'development') {
    console.log('Email not sent in development mode');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Body:', options.html);
    return;
  }

  // Send mail with defined transport object
  const mailOptions = {
    from: `AfyaSmart Connect <${process.env.SMTP_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;