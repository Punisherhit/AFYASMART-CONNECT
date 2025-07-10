const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Department = require('./Department'); // Import the Department model

// Get department enums from Department model
// This assumes that the Department model has a 'name' field which is an enum.
// If 'name' is not an enum, or if the enum values are stored differently,
// this line might need adjustment based on the actual Department schema.
const departmentEnums = Department.schema.path('name').enumValues;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
role: {
  type: String,
  enum: [
    'patient', 'doctor', 'hospital-admin', 'super-admin', 
    'lab-technician', 'pharmacist', 'receptionist', 'nurse', 
    'radiologist', 'physiotherapist', 'dietitian', 'department-operator'
  ],
  default: 'patient'
},
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  department: {
    type: String,
    enum: departmentEnums, // Now dynamically getting enums from Department model
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  isActive: { // New field
    type: Boolean,
    default: true
  },
  lastLogin: Date, // New field
  permissions: [String] // New field
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
