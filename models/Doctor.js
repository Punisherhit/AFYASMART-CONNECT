const mongoose = require('mongoose');
const Department = require('./Department');

const departmentEnums = Department.schema.path('name').enumValues;

const DoctorSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  licenseNumber: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  specialty: {
    type: String,
    required: true,
    enum: [
      'Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Orthopedics',
      'Dermatology', 'Psychiatry', 'Radiology', 'General Surgery', 'Internal Medicine'
    ]
  },
  department: {
    type: String,
    enum: departmentEnums,
    required: function() {
      return this.role === 'doctor'; // Only required for doctors, not admins
    }
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  availableSlots: [{
    day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
    startTime: String,
    endTime: String
  }],
  isOnCall: { type: Boolean, default: false },
  maxPatients: { type: Number, default: 15 },
  currentAppointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  ratings: [{
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    score: { type: Number, min: 1, max: 5 },
    feedback: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual for average rating
DoctorSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, curr) => acc + curr.score, 0);
  return (sum / this.ratings.length).toFixed(1);
});

// Indexes
DoctorSchema.index({ specialty: 1, department: 1 });
DoctorSchema.index({ 'availableSlots.day': 1, 'availableSlots.startTime': 1 });

module.exports = mongoose.model('Doctor', DoctorSchema);