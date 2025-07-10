const Assignment = require('../models/Assignment');
const Patient = require('../models/Patient');
const Department = require('../models/Department');
const Billing = require('../models/Billing'); // Assuming Billing model is needed for completePatientJourney
const NotificationService = require('../services/notificationService');
const asyncHandler = require('express-async-handler');

// @desc    Register patient and assign initial department
// @route   POST /api/v1/patient-flow/register
// @access  Hospital Admin
exports.registerPatient = asyncHandler(async (req, res) => {
  const { firstName, lastName, dateOfBirth, gender, phone, department: initialDepartmentName } = req.body;

  // Create patient
  const patient = await Patient.create({
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phone,
    hospital: req.user.hospital,
    status: 'REGISTERED' // Changed from 'ACTIVE' to 'REGISTERED' as per new Patient schema enum
  });

  // Find the initial department to ensure it exists and has operators
  const initialDepartment = await Department.findOne({
    name: initialDepartmentName,
    hospital: req.user.hospital
  });

  if (!initialDepartment) {
    return res.status(404).json({
      success: false,
      error: `Department ${initialDepartmentName} not found in this hospital`
    });
  }

  if (initialDepartment.operators.length === 0) {
    return res.status(400).json({
      success: false,
      error: `Department ${initialDepartmentName} has no active operators. Cannot assign patient.`
    });
  }

  // Assign to initial department
  const assignment = await Assignment.create({
    patient: patient._id,
    department: initialDepartment.name, // Store department name
    assignedBy: req.user._id,
    hospital: req.user.hospital,
    status: 'PENDING' // Initial status for a new assignment
  });

  // Update patient's current department
  patient.currentDepartment = initialDepartment.name;
  await patient.save();

  // Notify department (assuming NotificationService is correctly implemented)
  await NotificationService.sendDepartmentAlert(
    initialDepartment.name,
    req.user.hospital,
    `New patient registered: ${firstName} ${lastName} (ID: ${patient._id})`,
    req.user._id
  );

  res.status(201).json({
    success: true,
    data: {
      patient,
      assignment
    }
  });
});

// @desc    Assign patient to a specific department (can be used after initial registration)
// @route   POST /api/v1/patient-flow/assign-to-department
// @access  Hospital Admin, Department Operator (e.g., Receptionist, Triage)
exports.assignToDepartment = asyncHandler(async (req, res) => {
  const { patientId, departmentName } = req.body;

  // Find the patient
  const patient = await Patient.findOne({ _id: patientId, hospital: req.user.hospital });
  if (!patient) {
    return res.status(404).json({
      success: false,
      error: 'Patient not found or not in this hospital'
    });
  }

  // Check department has active operators
  const department = await Department.findOne({
    name: departmentName,
    hospital: req.user.hospital
  });

  if (!department) {
    return res.status(404).json({
      success: false,
      error: `Department ${departmentName} not found in this hospital`
    });
  }

  if (department.operators.length === 0) {
    return res.status(400).json({
      success: false,
      error: `Department ${departmentName} has no active operators. Cannot assign patient.`
    });
  }

  // Create a new assignment record
  const assignment = await Assignment.create({
    patient: patient._id,
    department: department.name,
    assignedBy: req.user._id,
    hospital: req.user.hospital,
    status: 'PENDING' // Set status to PENDING for new assignments
  });

  // Update patient's current department
  patient.currentDepartment = department.name;
  await patient.save();

  // Notify the target department
  await NotificationService.sendDepartmentAlert(
    department.name,
    req.user.hospital,
    `Patient ${patient.firstName} ${patient.lastName} (ID: ${patient._id}) assigned to your department.`,
    req.user._id
  );

  res.status(200).json({
    success: true,
    data: {
      patient,
      assignment
    }
  });
});


// @desc    Transfer patient between departments
// @route   POST /api/v1/patient-flow/transfer
// @access  Doctor, Department Operator (authorized to initiate transfers)
exports.transferPatient = asyncHandler(async (req, res) => {
  const { patientId, fromDepartment, toDepartment, reason } = req.body;

  // Verify requesting user's department matches the 'fromDepartment'
  // This assumes req.user.department is the name of the department the user is currently in.
  if (req.user.department !== fromDepartment) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to transfer from this department. User is not assigned to the "from" department.'
    });
  }

  // Find the patient
  const patient = await Patient.findOne({ _id: patientId, hospital: req.user.hospital });
  if (!patient) {
    return res.status(404).json({
      success: false,
      error: 'Patient not found or not in this hospital'
    });
  }

  // Ensure the patient's current department matches the 'fromDepartment'
  if (patient.currentDepartment !== fromDepartment) {
    return res.status(400).json({
      success: false,
      error: `Patient is currently in ${patient.currentDepartment}, not ${fromDepartment}. Cannot initiate transfer.`
    });
  }

  // Check if the target department exists and is operational (optional, but good practice)
  const targetDepartment = await Department.findOne({ name: toDepartment, hospital: req.user.hospital });
  if (!targetDepartment || !targetDepartment.isOperational) {
    return res.status(400).json({
      success: false,
      error: `Target department ${toDepartment} not found or not operational.`
    });
  }
  // Also check if target department has operators, similar to assignToDepartment
  if (targetDepartment.operators.length === 0) {
    return res.status(400).json({
      success: false,
      error: `Target department ${toDepartment} has no active operators. Cannot transfer patient.`
    });
  }


  // Create a new transfer assignment record
  const transfer = await Assignment.create({
    patient: patient._id,
    fromDepartment: fromDepartment,
    toDepartment: toDepartment,
    assignedBy: req.user._id, // The user initiating the transfer
    hospital: req.user.hospital,
    status: 'TRANSFER_PENDING', // Status indicating it's awaiting acceptance at the new department
    notes: reason
  });

  // Update patient's current department to the new department
  // This updates the patient's location immediately. The 'TRANSFER_PENDING' status
  // on the assignment indicates the process is not fully complete from a workflow perspective.
  patient.currentDepartment = toDepartment;
  await patient.save();

  // Notify target department about the pending transfer
  await NotificationService.sendTransferNotification({
    toDepartment: toDepartment,
    hospitalId: req.user.hospital,
    patientId: patient._id,
    fromDoctor: req.user._id, // The user who initiated the transfer
    message: `Patient ${patient.firstName} ${patient.lastName} (ID: ${patient._id}) transferred from ${fromDepartment}. Reason: ${reason}`
  });

  res.status(201).json({
    success: true,
    data: transfer,
    message: `Patient ${patient.firstName} ${patient.lastName} transferred to ${toDepartment}.`
  });
});

// @desc    Complete patient journey (Discharge)
// @route   POST /api/v1/patient-flow/complete
// @access  Receptionist, Billing Staff, Hospital Admin
exports.completePatientJourney = asyncHandler(async (req, res) => {
  const { patientId, billingDetails } = req.body;

  // Find the patient
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return res.status(404).json({
      success: false,
      error: 'Patient not found'
    });
  }

  // Verify patient is in a final discharge-related department (e.g., PHARMACY, BILLING)
  // Or, allow discharge from any department if the user has the right role (e.g., Hospital Admin)
  const isFinalStageDepartment = ['PHARMACY', 'BILLING'].includes(patient.currentDepartment);
  const isAuthorizedRole = ['hospital-admin', 'receptionist'].includes(req.user.role); // Assuming these roles can discharge

  if (!isFinalStageDepartment && !isAuthorizedRole) {
    return res.status(400).json({
      success: false,
      error: 'Patient not in final discharge stage or user not authorized to discharge from this department.'
    });
  }

  // Update patient status to DISCHARGED and clear current department
  patient.status = 'DISCHARGED';
  patient.currentDepartment = null; // Patient is no longer in any specific department
  await patient.save();

  // Create billing record if details are provided
  let billingRecord = null;
  if (billingDetails) {
    billingRecord = await Billing.create({
      ...billingDetails,
      patient: patient._id,
      hospital: req.user.hospital,
      billedBy: req.user._id // Record who created the billing
    });
  }

  // Complete all active/pending assignments for this patient
  await Assignment.updateMany(
    { patient: patient._id, status: { $ne: 'COMPLETED' } }, // Find all assignments not yet completed
    { status: 'COMPLETED', completedAt: new Date() } // Mark them as completed
  );

  // Optionally, send a discharge notification
  await NotificationService.sendHospitalAlert(
    req.user.hospital,
    `Patient ${patient.firstName} ${patient.lastName} (ID: ${patient._id}) has been discharged.`,
    req.user._id
  );

  res.status(200).json({
    success: true,
    data: {
      patient,
      billing: billingRecord // Return the billing record if created
    },
    message: `Patient ${patient.firstName} ${patient.lastName} successfully discharged.`
  });
});
