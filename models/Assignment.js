const mongoose = require('mongoose');
const Department = require('./Department');

// Get department enums from Department model
const departmentEnums = Department.schema.path('name').enumValues;

const AssignmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  department: {
    type: String,
    enum: departmentEnums,
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'TRANSFERRED'],
    default: 'PENDING'
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  notes: String,
  testResults: mongoose.Schema.Types.Mixed,
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  transferHistory: [{
    fromDepartment: String,
    toDepartment: String,
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transferredAt: Date,
    notes: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);