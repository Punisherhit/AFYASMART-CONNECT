const mongoose = require('mongoose');

const LabTestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  testType: { type: String, required: true },
  orderedDate: { type: Date, default: Date.now },
  sampleCollectedDate: Date,
  status: {
    type: String,
    enum: ['ordered', 'sample_collected', 'processing', 'completed', 'canceled'],
    default: 'ordered'
  },
  result: String,
  resultDate: Date,
  notes: String
});

module.exports = mongoose.model('LabTest', LabTestSchema);