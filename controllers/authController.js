const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const twilio = require('twilio'); // Added twilio import

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email and password'
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Verify password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Create token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

exports.patientLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Check for user
  const user = await User.findOne({ email, role: 'patient' }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Get patient profile
  const patient = await Patient.findById(user.patientId);

  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  // Create token
  const token = jwt.sign(
    { id: user._id, role: user.role, patientId: patient._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  res.json({
    success: true,
    token,
    patient,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Forgot Password via Email
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const patient = await Patient.findOne({ email });

  if (!patient) {
    return res.status(404).json({ success: false, error: 'There is no patient with that email' });
  }

  // Get reset token
  const resetToken = patient.getResetPasswordToken();

  await patient.save({ validateBeforeSave: false });

  // Create reset URL (This would typically be sent in an email)
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/patient/resetpassword/${resetToken}`;

  res.status(200).json({
    success: true,
    data: 'Password reset email sent (in a real app, this would be sent to the patient\'s email address). Token for testing: ' + resetToken // For testing purposes, remove in production
  });
});

// Forgot Password via SMS
exports.forgotPasswordSMS = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  // Validate input
  if (!phone) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a phone number'
    });
  }

  try {
    // Find the patient by phone number and role
    const patient = await Patient.findOne({ phone });

    if (!patient) {
      return res.status(404).json({ success: false, error: 'There is no patient with that phone number' });
    }

    // Get reset token from the Patient model
    const resetToken = patient.getResetPasswordToken();

    await patient.save({ validateBeforeSave: false }); // Save the token and expiry to the patient document

    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Construct the message body. You might want to include a link to reset here too.
    const messageBody = `Your AfyaSmart password reset token: ${resetToken}. This token is valid for 10 minutes.`;

    await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE, // Your Twilio phone number
      to: phone // Patient's phone number
    });

    res.status(200).json({ success: true, message: 'Password reset SMS sent' });
  } catch (err) {
    console.error('Error sending SMS:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send password reset SMS. Please try again later.' });
  }
});


// Reset Password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const patient = await Patient.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!patient) {
    return res.status(400).json({ success: false, error: 'Invalid or expired token' });
  }

  // Set new password
  // Assuming patient.user field links to the User model, where the actual password is stored
  const user = await User.findById(patient.user);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Associated user account not found.' });
  }

  // Hash the new password before saving
  const salt = await bcrypt.genSalt(10); // Make sure bcrypt is imported if not already
  user.password = await bcrypt.hash(req.body.password, salt);


  // Clear reset token fields from Patient model
  patient.resetPasswordToken = undefined;
  patient.resetPasswordExpire = undefined;

  await patient.save(); // Save changes to patient model
  await user.save(); // Save changes to user model

  res.status(200).json({ success: true, data: 'Password updated successfully' });
});


// Login limiter
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per window
  message: 'Too many login attempts, please try again later'
});

// Forgot password limiter
exports.forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per window
  message: 'Too many password reset requests, please try again later'
});