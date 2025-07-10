const mongoose = require('mongoose');

const TestResultSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  testType: {
    type: String,
    required: true,
    enum: [
      'BLOOD_TEST', 
      'URINE_ANALYSIS', 
      'X_RAY',
      'MRI',
      'CT_SCAN',
      'ULTRASOUND',
      'ECG',
      'EEG'
    ]
  },
  results: mongoose.Schema.Types.Mixed,
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  department: String,
  isCritical: {
    type: Boolean,
    default: false
  },
  notes: String,
  attachments: [String] // For scan reports/images
}, {
  timestamps: true
});

// Indexes
TestResultSchema.index({ patient: 1, testType: 1 });
TestResultSchema.index({ conductedBy: 1, createdAt: -1 });

module.exports = mongoose.model('TestResult', TestResultSchema);