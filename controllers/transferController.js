const Assignment = require('../models/Assignment');
const Patient = require('../models/Patient');
const NotificationService = require('../services/notificationService');
const asyncHandler = require('express-async-handler');

// @desc    Accept patient transfer
// @route   POST /api/v1/transfers/:id/accept
// @access  Department Staff
exports.acceptTransfer = asyncHandler(async (req, res) => {
  const transfer = await Assignment.findById(req.params.id);
  
  if (!transfer) {
    return res.status(404).json({
      success: false,
      error: 'Transfer record not found'
    });
  }

  // Verify user is in target department
  if (req.user.department !== transfer.toDepartment) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to accept this transfer'
    });
  }

  // Update transfer status
  transfer.status = 'ACTIVE';
  transfer.assignedTo = req.user._id;
  await transfer.save();

  // Update patient record
  await Patient.findByIdAndUpdate(transfer.patient, {
    currentDepartment: transfer.toDepartment,
    assignedDoctor: req.user.role === 'doctor' ? req.user._id : null
  });

  // Notify originating department
  await NotificationService.createNotification({
    recipients: transfer.assignedBy,
    sender: req.user._id,
    message: `Transfer to ${transfer.toDepartment} accepted`,
    type: 'TRANSFER_ACCEPTED'
  });

  res.status(200).json({
    success: true,
    data: transfer
  });
});

// @desc    Get pending transfers for department
// @route   GET /api/v1/transfers/pending
// @access  Department Staff
exports.getPendingTransfers = asyncHandler(async (req, res) => {
  const transfers = await Assignment.find({
    toDepartment: req.user.department,
    status: 'TRANSFER_PENDING'
  }).populate('patient', 'firstName lastName');

  res.status(200).json({
    success: true,
    count: transfers.length,
    data: transfers
  });
});