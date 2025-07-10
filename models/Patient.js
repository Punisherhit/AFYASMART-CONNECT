const mongoose = require('mongoose');
const Department = require('./Department');

// Get department enums from Department model
const departmentEnums = Department.schema.path('name').enumValues;

const PatientSchema = new mongoose.Schema({
  // --- Core Identification ---
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  nationalId: { type: String, unique: true }, // For national health systems
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },

  // --- Contact Information ---
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true, match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ },
  address: {
    street: String,
    city: String,
    county: String,
    postalCode: String
  },

  // --- Medical Information ---
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] },
  allergies: [{
    name: String,
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] }
  }],
  chronicConditions: [String],
  currentMedications: [{
    name: String,
    dosage: String,
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
  }],

  // --- Hospital System Integration ---
  hospital: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hospital', 
    required: true,
    index: true 
  },
  currentDepartment: {
    type: String,
    enum: departmentEnums
  },
  status: {
    type: String,
    enum: ['PRE_REGISTERED', 'ACTIVE', 'DISCHARGED', 'TRANSFERRED', 'DECEASED'],
    default: 'PRE_REGISTERED'
  },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  insuranceProvider: String,
  policyNumber: String,

  // --- Tracking ---
  visits: [{
    date: { type: Date, default: Date.now },
    department: String,
    diagnosis: String,
    treatment: String,
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtuals
PatientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

PatientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

// Indexes
PatientSchema.index({ hospital: 1, status: 1 });
PatientSchema.index({ 'allergies.name': 1 });

module.exports = mongoose.model('Patient', PatientSchema);