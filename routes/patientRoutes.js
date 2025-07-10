const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Patient = require('../models/Patient');
const { parseFHIR, saveLabResult } = require('../utils/fhirParser');
const asyncHandler = require('express-async-handler');

// @desc    Register a new patient
// @route   POST /api/patients
// @access  Public
router.post('/', asyncHandler(async (req, res) => {
  const { 
    firstName, 
    lastName, 
    dateOfBirth, 
    gender, 
    phone, 
    email, 
    address, 
    bloodGroup, 
    allergies 
  } = req.body;

  // Check for existing patient
  const existingPatient = await Patient.findOne({ $or: [{ email }, { phone }] });
  if (existingPatient) {
    res.status(400);
    throw new Error('Patient already exists with this email or phone');
  }

  const patient = await Patient.create({
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone,
    email,
    address,
    bloodGroup,
    allergies
  });

  res.status(201).json({
    success: true,
    data: patient
  });
}));

// @desc    Get patient profile
// @route   GET /api/patients/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id })
    .populate('userId', ['name', 'email', 'phone']);

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  res.json({
    success: true,
    data: patient
  });
}));

// @desc    Update patient profile
// @route   PUT /api/patients/me
// @access  Private
router.put('/me', protect, asyncHandler(async (req, res) => {
  const { dob, bloodType, allergies, medicalHistory, insuranceInfo } = req.body;

  if (!dob && !bloodType && !allergies && !medicalHistory && !insuranceInfo) {
    res.status(400);
    throw new Error('At least one field is required');
  }

  let patient = await Patient.findOne({ userId: req.user.id });

  if (!patient) {
    patient = new Patient({
      userId: req.user.id,
      dob,
      bloodType,
      allergies,
      medicalHistory,
      insuranceInfo
    });
  } else {
    if (dob) patient.dob = dob;
    if (bloodType) patient.bloodType = bloodType;
    if (allergies) patient.allergies = allergies;
    if (medicalHistory) patient.medicalHistory = medicalHistory;
    if (insuranceInfo) patient.insuranceInfo = insuranceInfo;
  }

  await patient.save();

  res.json({
    success: true,
    data: patient
  });
}));

// @desc    Process FHIR lab results
// @route   POST /api/patients/:id/lab-results/fhir
// @access  Private
router.post('/:id/lab-results/fhir', protect, asyncHandler(async (req, res) => {
  const labResult = await saveLabResult(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Lab result processed successfully',
    data: labResult
  });
}));

// Add this route
router.get('/:id', protect, asyncHandler(async (req, res) => {
  // Allow patients to access their own data
  if (req.user.role === 'patient' && req.params.id !== req.user.patientId) {
    res.status(403);
    throw new Error('Not authorized to access this patient record');
  }
  
  await getPatientById(req, res);
}));


// Protected patient profile endpoint
router.get('/me', protect, asyncHandler(async (req, res) => {
  if (req.user.role !== 'patient') {
    res.status(403);
    throw new Error('Not authorized as patient');
  }

  const patient = await Patient.findById(req.user.patientId);
  
  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  res.json({
    success: true,
    data: patient
  });
}));

// Protected update patient profile
router.put('/me', protect, asyncHandler(async (req, res) => {
  if (req.user.role !== 'patient') {
    res.status(403);
    throw new Error('Not authorized as patient');
  }

  // Only allow updating specific fields
  const { address, phone, allergies } = req.body;
  
  const patient = await Patient.findById(req.user.patientId);
  
  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  if (address) patient.address = address;
  if (phone) patient.phone = phone;
  if (allergies) patient.allergies = allergies;

  await patient.save();

  res.json({
    success: true,
    data: patient
  });
}));

module.exports = router;