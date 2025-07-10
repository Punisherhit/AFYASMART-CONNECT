const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

// @desc    Register a new doctor
// @route   POST /api/doctors
// @access  Private/Admin
exports.registerDoctor = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, specialty, hospital, licenseNumber } = req.body;

  // Check if doctor already exists
  const existingDoctor = await Doctor.findOne({ $or: [{ email }, { licenseNumber }] });
  if (existingDoctor) {
    return res.status(400).json({ 
      success: false,
      message: 'Doctor with this email or license number already exists' 
    });
  }

  const doctor = await Doctor.create({
    name,
    email,
    phone,
    specialty,
    hospital,
    licenseNumber
  });

  res.status(201).json({
    success: true,
    data: doctor
  });
});

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find().populate('hospital', 'name address');
  res.status(200).json({
    success: true,
    count: doctors.length,
    data: doctors
  });
});

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Private
exports.getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('hospital', 'name address');
  
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  res.status(200).json({
    success: true,
    data: doctor
  });
});

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private/Admin
exports.updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  res.status(200).json({
    success: true,
    data: doctor
  });
});

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
exports.deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get patient information (for doctors)
// @route   GET /api/doctors/patient/:patientId
// @access  Private/Doctor
exports.getPatientInfo = asyncHandler(async (req, res) => {
  // First verify the requesting user is a doctor
  const user = await User.findById(req.user.id);
  if (user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access patient information'
    });
  }

  // Verify the doctor exists
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) {
    return res.status(403).json({
      success: false,
      message: 'Doctor profile not found'
    });
  }

  // Get patient information
  const patient = await Patient.findById(req.params.patientId)
    .populate('user', 'name email')
    .populate('appointments');

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Return patient data (excluding sensitive information)
  const patientData = {
    id: patient._id,
    name: `${patient.firstName} ${patient.lastName}`,
    email: patient.email,
    phone: patient.phone,
    bloodGroup: patient.bloodGroup,
    allergies: patient.allergies,
    appointments: patient.appointments
  };

  res.status(200).json({
    success: true,
    data: patientData
  });
});

// @desc    Search for patients (for doctors)
// @route   GET /api/doctors/patients/search
// @access  Private/Doctor
exports.searchPatients = asyncHandler(async (req, res) => {
  // Verify requesting user is a doctor
  const user = await User.findById(req.user.id);
  if (user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  const { name, email, phone } = req.query;
  const query = {};

  if (name) {
    query.$or = [
      { firstName: { $regex: name, $options: 'i' } },
      { lastName: { $regex: name, $options: 'i' } }
    ];
  }
  if (email) query.email = email;
  if (phone) query.phone = phone;

  if (Object.keys(query).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide search criteria'
    });
  }

  const patients = await Patient.find(query)
    .select('-__v -createdAt -updatedAt')
    .limit(10);

  res.status(200).json({
    success: true,
    count: patients.length,
    data: patients
  });
});