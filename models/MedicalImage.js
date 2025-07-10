const mongoose = require('mongoose');

const medicalImageSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  title: { type: String, required: true },
  description: String,
  imageUrl: { type: String, required: true },
  contentType: { type: String, enum: ['x-ray', 'mri', 'ct-scan', 'ultrasound'] },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('MedicalImage', medicalImageSchema);