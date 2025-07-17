const mongoose = require('mongoose');

const TriageSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  triageId: { type: String, required: true, unique: true },
  priority: { type: String, enum: ['Critical', 'Urgent', 'Stable'], required: true },
  symptoms: { type: String, required: true },
  vitals: {
    heartRate: Number,
    bloodPressure: String,
    temperature: Number
  },
  arrivalTime: { type: Date, default: Date.now },
  status: { type: String, enum: ['Waiting', 'Assessed'], default: 'Waiting' }
});

module.exports = mongoose.model('Triage', TriageSchema);
