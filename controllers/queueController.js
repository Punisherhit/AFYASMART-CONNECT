const Assignment = require('../models/Assignment');
const Patient = require('../models/Patient');
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Get department queue
// @route   GET /api/v1/queue/:department
// @access  Department Staff
exports.getQueue = asyncHandler(async (req, res) => {
  const department = req.params.department;

  // Verify user has access to this department
  if (req.user.department !== department && 
      !['super-admin', 'hospital-admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to view this queue'
    });
  }

  const queue = await Assignment.find({
    department,
    hospital: req.user.hospital,
    status: { $in: ['PENDING', 'IN_PROGRESS'] }
  })
  .populate({
    path: 'patient',
    select: 'firstName lastName gender age bloodType'
  })
  .populate({
    path: 'assignedBy',
    select: 'name role'
  })
  .sort({
    priority: -1, // High priority first
    createdAt: 1  // Then by arrival time
  });

  res.status(200).json({
    success: true,
    count: queue.length,
    data: queue
  });
});

// @desc    Assign patient to doctor
// @route   PUT /api/v1/queue/:id/assign
// @access  Department Staff
exports.assignToDoctor = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    return res.status(404).json({
      success: false,
      error: 'Assignment not found'
    });
  }

  // Verify assignment is in user's department
  if (assignment.department !== req.user.department && 
      !['super-admin', 'hospital-admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to modify this assignment'
    });
  }

  // Check doctor exists and is in same department
  const doctor = await User.findOne({
    _id: req.body.doctorId,
    department: assignment.department,
    role: 'doctor'
  });

  if (!doctor) {
    return res.status(400).json({
      success: false,
      error: 'Invalid doctor assignment'
    });
  }

  // Update assignment
  assignment.status = 'IN_PROGRESS';
  assignment.currentDoctor = req.body.doctorId;
  assignment.assignedAt = new Date();
  await assignment.save();

  // Update patient record
  await Patient.findByIdAndUpdate(assignment.patient, {
    currentDepartment: assignment.department,
    assignedDoctor: req.body.doctorId,
    status: 'IN_TREATMENT'
  });

  // Create notification for doctor
  await Notification.create({
    recipient: req.body.doctorId,
    sender: req.user.id,
    message: `New patient assigned in ${assignment.department}`,
    type: 'PATIENT_ASSIGNMENT',
    data: {
      assignmentId: assignment._id,
      patientId: assignment.patient
    }
  });

  res.status(200).json({
    success: true,
    data: assignment
  });
});

// @desc    Complete assignment
// @route   PUT /api/v1/queue/:id/complete
// @access  Doctor
exports.completeAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  // Verify assignment belongs to doctor
  if (assignment.currentDoctor.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to complete this assignment'
    });
  }

  assignment.status = 'COMPLETED';
  assignment.completedAt = new Date();
  assignment.notes = req.body.notes;
  await assignment.save();

  // Update patient status if no further treatment needed
  if (!req.body.requiresFollowUp) {
    await Patient.findByIdAndUpdate(assignment.patient, {
      status: 'DISCHARGED',
      assignedDoctor: null
    });
  }

  res.status(200).json({
    success: true,
    data: assignment
  });
});