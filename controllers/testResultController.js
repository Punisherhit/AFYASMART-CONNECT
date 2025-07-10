const TestResult = require('../models/TestResult');
const Assignment = require('../models/Assignment');
const NotificationService = require('../services/notificationService');
const asyncHandler = require('express-async-handler');

// @desc    Record test results
// @route   POST /api/v1/test-results
// @access  Lab Technician, Radiologist
exports.recordTestResult = asyncHandler(async (req, res) => {
  const { assignmentId, testType, results, isCritical } = req.body;

  // Get assignment
  const assignment = await Assignment.findById(assignmentId)
    .populate('patient', 'assignedDoctor');

  if (!assignment) {
    return res.status(404).json({
      success: false,
      error: 'Assignment not found'
    });
  }

  // Create test result
  const testResult = await TestResult.create({
    patient: assignment.patient,
    testType,
    results,
    conductedBy: req.user._id,
    hospital: req.user.hospital,
    department: req.user.department
  });

  // Update assignment
  assignment.testResult = testResult._id;
  assignment.status = 'COMPLETED';
  await assignment.save();

  // Notify doctor if critical result
  if (isCritical && assignment.patient.assignedDoctor) {
    await NotificationService.sendCriticalResult(
      assignment.patient._id,
      testType,
      results,
      assignment.patient.assignedDoctor
    );
  }

  res.status(201).json({
    success: true,
    data: testResult
  });
});

// @desc    Get test results for patient
// @route   GET /api/v1/test-results/patient/:patientId
// @access  Doctor
exports.getPatientTestResults = asyncHandler(async (req, res) => {
  const results = await TestResult.find({
    patient: req.params.patientId,
    hospital: req.user.hospital
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
});