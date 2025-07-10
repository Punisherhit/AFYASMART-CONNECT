const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true,
    index: true 
  },
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  department: String, // Added for department tracking
  diagnosis: String, // Added clinical context
  medications: [{
    name: { 
      type: String, 
      required: true,
      uppercase: true 
    },
    dosage: { 
      type: String, 
      required: true 
    },
    frequency: { 
      type: String, 
      required: true,
      enum: ['OD', 'BD', 'TDS', 'QID', 'PRN'] 
    },
    duration: { 
      type: String, 
      required: true 
    },
    form: {
      type: String,
      enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment']
    },
    quantity: Number
  }],
  issueDate: { 
    type: Date, 
    default: Date.now 
  },
  expiryDate: { 
    type: Date, 
    default: () => Date.now() + 30*24*60*60*1000 // 30 days default
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  instructions: {
    type: String,
    maxlength: 500
  },
  pharmacyNotes: String, // For pharmacist use
  refillsAllowed: { type: Number, default: 0 },
  refillsUsed: { type: Number, default: 0 },
  isDigitalSignature: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes
PrescriptionSchema.index({ patient: 1, status: 1 });
PrescriptionSchema.index({ doctor: 1, issueDate: -1 });

module.exports = mongoose.model('Prescription', PrescriptionSchema);