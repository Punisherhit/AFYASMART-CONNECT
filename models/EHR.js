const mongoose = require('mongoose');

const EHRSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  visitDate: { type: Date, default: Date.now },
  symptoms: [String],
  diagnosis: String,
  treatment: String,
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  notes: String,
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{
    name: String,
    url: String,
    type: String // lab-report, scan, etc.
  }]
});

module.exports = mongoose.model('EHR', EHRSchema);