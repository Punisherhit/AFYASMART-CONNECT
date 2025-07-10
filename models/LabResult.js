const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  testType: { 
    type: String, 
    required: true,
    enum: ['blood-test', 'urine-analysis', 'x-ray', 'mri', 'ct-scan', 'biopsy', 'other']
  },
  testName: {
    type: String,
    required: true
  },
  resultDate: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'abnormal', 'critical'], 
    default: 'pending' 
  },
  values: [{
    name: String,         // e.g., "Hemoglobin"
    value: mongoose.Schema.Types.Mixed, // Can be number or string
    unit: String,         // e.g., "g/dL"
    normalRange: String   // e.g., "13.5-17.5 g/dL"
  }],
  flags: [{
    type: String,
    enum: ['high', 'low', 'abnormal', 'critical']
  }],
  pdfReportUrl: String,   // URL to PDF report in cloud storage
  doctorNotes: String,
  labTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedByDoctor: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Indexes for faster querying
labResultSchema.index({ patient: 1, resultDate: -1 });
labResultSchema.index({ testType: 1, status: 1 });

const LabResult = mongoose.model('LabResult', labResultSchema);

module.exports = LabResult;