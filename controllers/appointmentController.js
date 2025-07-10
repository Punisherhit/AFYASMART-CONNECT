const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const asyncHandler = require('express-async-handler');
const { sendAppointmentConfirmation } = require('../services/emailService');
const patient = await Patient.findById(req.user.patientId);


// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private (patient)
exports.bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, hospitalId, date, timeSlot, reason, notes } = req.body;
  
  // Validate input
  if (!doctorId || !hospitalId || !date || !timeSlot || !reason) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if patient exists
  const patient = await Patient.findById(req.user.patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  // Check if doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  // Check if hospital exists
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital not found');
  }

  // Check if doctor is available at the requested time
  const existingAppointment = await Appointment.findOne({
    doctor: doctorId,
    date: date,
    timeSlot: timeSlot
  });

  if (existingAppointment) {
    res.status(400);
    throw new Error('Doctor is not available at this time slot');
  }

  // Create appointment
  const appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctorId,
    hospital: hospitalId,
    date,
    timeSlot,
    reason,
    notes: notes || '',
    status: 'pending'
  });

  // Send confirmation email
  await sendAppointmentConfirmation({
    patientEmail: req.user.email,
    patientName: `${patient.firstName} ${patient.lastName}`,
    doctorName: `${doctor.firstName} ${doctor.lastName}`,
    hospitalName: hospital.name,
    date: date,
    timeSlot: timeSlot,
    appointmentId: appointment._id
  });

  res.status(201).json({
    success: true,
    data: appointment
  });
});

// @desc    Get patient appointments
// @route   GET /api/appointments/my-appointments
// @access  Private (patient)
exports.getMyAppointments = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.user.patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient profile not found');
  }

  const appointments = await Appointment.find({ patient: patient._id })
    .populate('doctor', 'firstName lastName specialty')
    .populate('hospital', 'name address');

  res.json({
    success: true,
    count: appointments.length,
    data: appointments
  });
});

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (patient or doctor)
exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Check if user is authorized (patient or doctor associated with appointment)
  const isPatient = appointment.patient.equals(req.user.patientId);
  const isDoctor = req.user.role === 'doctor' && appointment.doctor.equals(req.user.doctorId);
  
  if (!isPatient && !isDoctor) {
    res.status(403);
    throw new Error('Not authorized to update this appointment');
  }

  // Validate status transition
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    cancelled: [],
    completed: []
  };

  if (!validTransitions[appointment.status].includes(status)) {
    res.status(400);
    throw new Error(`Invalid status transition from ${appointment.status} to ${status}`);
  }

  appointment.status = status;
  await appointment.save();

  res.json({
    success: true,
    data: appointment
  });
});