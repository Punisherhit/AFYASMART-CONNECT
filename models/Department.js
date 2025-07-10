const mongoose = require('mongoose');

const departmentEnums = [
  // Patient Flow
  'RECEPTION', 'TRIAGE', 'REGISTRATION', 'ADMISSIONS',

  // Clinical Departments
  'EMERGENCY', 'OUTPATIENT', 'INPATIENT', 'INTENSIVE_CARE_UNIT',
  'CARDIOLOGY', 'NEUROLOGY', 'ORTHOPEDICS', 'PEDIATRICS',
  'MATERNITY', 'ONCOLOGY', 'PSYCHIATRY', 'DERMATOLOGY',
  'OPHTHALMOLOGY', 'ENT', 'UROLOGY', 'GASTROENTEROLOGY',
  'ENDOCRINOLOGY', 'PULMONOLOGY', 'NEPHROLOGY', 'RHEUMATOLOGY',

  // Diagnostic Departments
  'LABORATORY', 'RADIOLOGY', 'MRI_SCAN', 'CT_SCAN',
  'ULTRASOUND', 'PHYSIOTHERAPY', 'CARDIAC_CATH_LAB',
  'ELECTROCARDIOGRAM', 'ELECTROENCEPHALOGRAM', 'ENDOSCOPY',

  // Treatment Departments
  'OPERATING_THEATER', 'RECOVERY_ROOM', 'DAY_SURGERY',
  'CHEMOTHERAPY', 'RADIATION_ONCOLOGY', 'DIALYSIS_UNIT',
  'BURN_UNIT', 'PAIN_MANAGEMENT',

  // Support Departments
  'PHARMACY', 'NUTRITION', 'MEDICAL_RECORDS', 'CENTRAL_STERILE_SUPPLY',
  'BIOMEDICAL_ENGINEERING', 'HOUSEKEEPING', 'SECURITY',

  // Administrative
  'BILLING', 'HUMAN_RESOURCES', 'ADMINISTRATION', 'MARKETING',
  'INFORMATION_TECHNOLOGY', 'QUALITY_ASSURANCE',

  // Specialized Units
  'DENTAL', 'DIABETES_CLINIC', 'ALLERGY_CLINIC', 'SPORTS_MEDICINE',
  'REHABILITATION', 'PALLIATIVE_CARE', 'SLEEP_CLINIC',
  'INFECTIOUS_DISEASE', 'GENETICS_CLINIC'
];

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: departmentEnums
  },
  type: {
    type: String,
    enum: ['PATIENT_FLOW', 'CLINICAL', 'DIAGNOSTIC', 'TREATMENT', 'SUPPORT', 'ADMINISTRATIVE', 'SPECIALIZED'],
    required: true
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  doctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  location: String,
  phoneExtension: String,
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  availableBeds: {
    type: Number,
    default: 0
  },
  isOperational: {
    type: Boolean,
    default: true
  },
  colorCode: {
    type: String,
    default: '#4CAF50'
  },
  // New fields for operators
  operatorRoles: {
    type: [String],
    required: true,
    enum: [
      'doctor', 'lab-technician', 'pharmacist', 'receptionist',
      'nurse', 'radiologist', 'department-operator'
    ],
    default: [] // Added default to prevent validation issues on creation if not provided
  },
  operators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  minOperators: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current patient count
DepartmentSchema.virtual('currentPatients', {
  ref: 'Assignment',
  localField: '_id',
  foreignField: 'department',
  match: { status: 'IN_PROGRESS' },
  count: true
});

// Virtual for waiting patients
DepartmentSchema.virtual('waitingPatients', {
  ref: 'Assignment',
  localField: '_id',
  foreignField: 'department',
  match: { status: 'PENDING' },
  count: true
});

// Add validation to ensure minimum operators
DepartmentSchema.pre('save', function(next) {
  if (this.operators.length < this.minOperators) {
    const err = new Error(`Department requires at least ${this.minOperators} operator(s)`);
    return next(err);
  }
  next();
});

module.exports = mongoose.model('Department', DepartmentSchema);
