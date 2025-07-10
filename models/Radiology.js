const mongoose = require('mongoose');

const RadiologySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studyType: { type: String, required: true }, // X-ray, MRI, etc.
  orderedDate: { type: Date, default: Date.now },
  performedDate: Date,
  status: {
    type: String,
    enum: ['ordered', 'scheduled', 'performed', 'reported', 'completed', 'canceled'],
    default: 'ordered'
  },
  report: String,
  imageUrl: String,
  notes: String
});

module.exports = mongoose.model('Radiology', RadiologySchema);