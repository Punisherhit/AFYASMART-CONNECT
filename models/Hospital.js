const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a hospital name'],
    unique: true,
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  county: {
    type: String,
    required: [true, 'Please add a county']
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  facilities: [String],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  departments: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department' 
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  bedCapacity: Number,
  specialty: {
    type: String,
    enum: ['GENERAL', 'CHILDREN', 'MATERNITY', 'TRAUMA', 'CANCER', 'CARDIAC']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  website: String,
  coordinates: {
    // GeoJSON
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for patient count
HospitalSchema.virtual('patientCount', {
  ref: 'Patient',
  localField: '_id',
  foreignField: 'hospital',
  count: true
});

// Virtual for doctor count
HospitalSchema.virtual('doctorCount', {
  ref: 'Doctor',
  localField: '_id',
  foreignField: 'hospital',
  count: true
});

module.exports = mongoose.model('Hospital', HospitalSchema);