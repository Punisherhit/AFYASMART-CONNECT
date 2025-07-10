const User = require('../models/User');
const Patient = require('../models/Patient');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Utility function to clean patient data before sending response
const cleanPatientData = (patient) => {
  const patientObj = patient.toObject();
  // Remove sensitive or unnecessary fields for client response
  delete patientObj.__v;
  delete patientObj.createdAt;
  delete patientObj.updatedAt;
  // If there are other fields you don't want exposed, add them here
  return patientObj;
};

/**
 * @desc Register a new patient and create a corresponding user account
 * @route POST /api/patients/register
 * @access Public
 */
exports.registerPatient = asyncHandler(async (req, res) => {
  // Validate request body using express-validator results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
      message: 'Validation failed. Please check your input.'
    });
  }

  const {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone,
    email,
    address,
    bloodGroup,
    allergies, // This can be an array or null/undefined
    medicalHistory, // New field from Patient schema
    insuranceInfo,  // New field from Patient schema
    nhifNumber,     // New field from Patient schema
    password
  } = req.body;

  let user, patient; // Declare variables for potential cleanup in catch block

  try {
    // Basic check for essential fields, though express-validator should catch most
    if (!firstName || !lastName || !email || !password || !phone || !dateOfBirth || !gender || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing essential patient registration fields.'
      });
    }

    // Check for existing patient or user with the same email or phone in parallel
    const [existingPatient, existingUser] = await Promise.all([
      Patient.findOne({ $or: [{ email }, { phone }] }),
      User.findOne({ email })
    ]);

    if (existingPatient || existingUser) {
      const message = existingPatient
        ? 'Patient with this email or phone already exists.'
        : 'User with this email already exists.';
      // Use 409 Conflict status code for resource conflicts
      return res.status(409).json({
        success: false,
        message
      });
    }

    // --- Transactional Logic (Simplified without explicit transactions for clarity,
    // --- but cleanup is in place if one part fails) ---

    // 1. Hash password and create the User account first
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      role: 'patient', // Explicitly set role
      phone // Store phone on User model too for login consistency if needed
    });

    // 2. Create the Patient profile, linking it to the newly created User
    patient = await Patient.create({
      user: user._id, // Link patient to the user
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      bloodGroup,
      allergies: allergies || [], // Ensure it's an array
      medicalHistory: medicalHistory || '', // Default to empty string
      insuranceInfo: insuranceInfo || '',   // Default to empty string
      nhifNumber: nhifNumber || ''          // Default to empty string
    });

    // 3. Update the User with the patientId reference
    user.patientId = patient._id;
    await user.save(); // Save the updated user document

    // Generate JWT token for the newly registered patient/user
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        patientId: patient._id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' } // Use environment variable or default
    );

    // Prepare a secure response
    const patientResponse = cleanPatientData(patient);

    res.status(201).json({
      success: true,
      token,
      patient: patientResponse,
      user: { // Return essential user info, not the password
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Patient Registration Error:', error);

    // Rollback: Clean up any created user or patient documents if an error occurred mid-process
    const cleanup = async () => {
      if (patient && patient._id) {
        console.log(`Attempting to clean up patient: ${patient._id}`);
        await Patient.findByIdAndDelete(patient._id);
      }
      if (user && user._id) {
        console.log(`Attempting to clean up user: ${user._id}`);
        await User.findByIdAndDelete(user._id);
      }
    };
    await cleanup();

    // Send a generic server error message in production
    res.status(500).json({
      success: false,
      message: 'Server error during patient registration. Please try again later.',
      // Provide more detail in development mode for debugging
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
});

/**
 * @desc Get patient profile
 * @route GET /api/patients/:id
 * @access Private (Patient or Admin)
 */
exports.getPatientProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate('user', 'name email role'); // Populate user info

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Ensure only the patient or an authorized admin can view this profile
  // Assuming req.user.id is the ID of the authenticated user
  // And req.user.role is the role of the authenticated user
  if (req.user.role !== 'admin' && req.user.patientId.toString() !== patient._id.toString()) {
    res.status(403); // Forbidden
    throw new Error('Not authorized to view this patient profile');
  }

  res.status(200).json({
    success: true,
    data: cleanPatientData(patient)
  });
});

/**
 * @desc Update patient profile
 * @route PUT /api/patients/:id
 * @access Private (Patient or Admin)
 */
exports.updatePatientProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, dateOfBirth, gender, phone, email, address, bloodGroup, allergies, medicalHistory, insuranceInfo, nhifNumber } = req.body;

  let patient = await Patient.findById(id);

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Authorization: Only the patient themselves or an admin can update
  if (req.user.role !== 'admin' && req.user.patientId.toString() !== patient._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this patient profile');
  }

  // Handle potential email/phone conflicts if they are being updated
  if (email && email !== patient.email) {
    const existingPatientByEmail = await Patient.findOne({ email });
    if (existingPatientByEmail) {
      return res.status(409).json({ success: false, message: 'Another patient with this email already exists.' });
    }
  }
  if (phone && phone !== patient.phone) {
    const existingPatientByPhone = await Patient.findOne({ phone });
    if (existingPatientByPhone) {
      return res.status(409).json({ success: false, message: 'Another patient with this phone number already exists.' });
    }
  }

  // Update patient fields
  patient.firstName = firstName || patient.firstName;
  patient.lastName = lastName || patient.lastName;
  patient.dateOfBirth = dateOfBirth || patient.dateOfBirth;
  patient.gender = gender || patient.gender;
  patient.phone = phone || patient.phone;
  patient.email = email || patient.email;
  patient.address = address || patient.address;
  patient.bloodGroup = bloodGroup || patient.bloodGroup;
  patient.allergies = allergies !== undefined ? allergies : patient.allergies; // Allow clearing allergies
  patient.medicalHistory = medicalHistory !== undefined ? medicalHistory : patient.medicalHistory;
  patient.insuranceInfo = insuranceInfo !== undefined ? insuranceInfo : patient.insuranceInfo;
  patient.nhifNumber = nhifNumber !== undefined ? nhifNumber : patient.nhifNumber;


  // If email or phone changed on Patient, update associated User model too
  if (email && email !== patient.email || phone && phone !== patient.phone) {
    const user = await User.findById(patient.user);
    if (user) {
      if (email && email !== patient.email) user.email = email;
      if (phone && phone !== patient.phone) user.phone = phone; // Assuming User model has a phone field
      await user.save();
    }
  }

  const updatedPatient = await patient.save();

  res.status(200).json({
    success: true,
    message: 'Patient profile updated successfully',
    data: cleanPatientData(updatedPatient)
  });
});

/**
 * @desc Delete patient profile (and associated user)
 * @route DELETE /api/patients/:id
 * @access Private (Admin only, or patient themselves if allowed)
 */
exports.deletePatientProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const patient = await Patient.findById(id);

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Authorization: Only admin can delete (or perhaps the patient themselves)
  if (req.user.role !== 'admin') { // Or add req.user.patientId.toString() !== patient._id.toString()
    res.status(403);
    throw new Error('Not authorized to delete this patient profile');
  }

  // Perform deletion (consider soft delete for data integrity in production)
  // Delete associated user first
  if (patient.user) {
    await User.findByIdAndDelete(patient.user);
  }
  await Patient.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Patient and associated user deleted successfully'
  });
});

/**
 * @desc Get all patients (for admin dashboard)
 * @route GET /api/patients
 * @access Private (Admin only)
 */
exports.getAllPatients = asyncHandler(async (req, res) => {
  // Only allow admins to fetch all patients
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to access all patient data');
  }

  const patients = await Patient.find({}).populate('user', 'name email role'); // Populate user info

  res.status(200).json({
    success: true,
    count: patients.length,
    data: patients.map(patient => cleanPatientData(patient))
  });
});

/**
 * @desc Get patient's own profile (authenticated patient)
 * @route GET /api/patients/me
 * @access Private (Patient only)
 */
exports.getMe = asyncHandler(async (req, res) => {
  // Assuming req.user is populated by your authentication middleware
  if (!req.user || !req.user.patientId) {
    res.status(401);
    throw new Error('Not authorized, no patient ID found');
  }

  const patient = await Patient.findById(req.user.patientId).populate('user', 'name email role');

  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found for this user');
  }

  res.status(200).json({
    success: true,
    data: cleanPatientData(patient)
  });
});

/**
 * @desc Update patient's own profile
 * @route PUT /api/patients/me
 * @access Private (Patient only)
 */
exports.updateMe = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.patientId) {
    res.status(401);
    throw new Error('Not authorized, no patient ID found');
  }

  const { firstName, lastName, dateOfBirth, gender, phone, email, address, bloodGroup, allergies, medicalHistory, insuranceInfo, nhifNumber } = req.body;

  let patient = await Patient.findById(req.user.patientId);

  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  // Handle potential email/phone conflicts if they are being updated
  // This check is crucial to prevent one patient from taking another's unique email/phone
  if (email && email !== patient.email) {
    const existingPatientByEmail = await Patient.findOne({ email });
    if (existingPatientByEmail && existingPatientByEmail._id.toString() !== patient._id.toString()) {
      return res.status(409).json({ success: false, message: 'This email is already registered to another patient.' });
    }
  }
  if (phone && phone !== patient.phone) {
    const existingPatientByPhone = await Patient.findOne({ phone });
    if (existingPatientByPhone && existingPatientByPhone._id.toString() !== patient._id.toString()) {
      return res.status(409).json({ success: false, message: 'This phone number is already registered to another patient.' });
    }
  }

  // Update patient fields (only allow patient to update their own non-sensitive details)
  patient.firstName = firstName || patient.firstName;
  patient.lastName = lastName || patient.lastName;
  patient.dateOfBirth = dateOfBirth || patient.dateOfBirth;
  patient.gender = gender || patient.gender;
  patient.phone = phone || patient.phone;
  patient.email = email || patient.email;
  patient.address = address || patient.address;
  patient.bloodGroup = bloodGroup || patient.bloodGroup;
  patient.allergies = allergies !== undefined ? allergies : patient.allergies;
  patient.medicalHistory = medicalHistory !== undefined ? medicalHistory : patient.medicalHistory;
  patient.insuranceInfo = insuranceInfo !== undefined ? insuranceInfo : patient.insuranceInfo;
  patient.nhifNumber = nhifNumber !== undefined ? nhifNumber : patient.nhifNumber;

  // If email or phone changed on Patient, update associated User model too
  if ((email && email !== patient.email) || (phone && phone !== patient.phone)) {
    const user = await User.findById(patient.user);
    if (user) {
      if (email && email !== patient.email) user.email = email;
      if (phone && phone !== patient.phone) user.phone = phone;
      await user.save();
    }
  }

  const updatedPatient = await patient.save();

  res.status(200).json({
    success: true,
    message: 'Your profile has been updated successfully',
    data: cleanPatientData(updatedPatient)
  });
});
