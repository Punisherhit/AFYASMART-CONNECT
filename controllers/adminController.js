const Admin = require('../models/Admin');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const User = require('../models/User'); // Assuming User model is needed for doctor registration
const Department = require('../models/Department'); // Import the Department model
const Assignment = require('../models/Assignment'); // Import Assignment model for analytics
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); // Import asyncHandler
const { sendEmail } = require('../services/emailService'); // Import sendEmail service
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing

// @desc    Register admin
// @route   POST /api/v1/admin/register
// @access  Public
exports.registerAdmin = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, hospital } = req.body;

  // Create admin
  const admin = await Admin.create({
    name,
    email,
    password,
    role,
    hospital
  });

  // Create token
  const token = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  res.status(201).json({
    success: true,
    token,
    data: admin
  });
});

// @desc    Login admin
// @route   POST /api/v1/admin/login
// @access  Public
exports.loginAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email and password'
    });
  }

  // Check for admin
  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Check if password matches
  const isMatch = await admin.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Create token
  const token = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  res.status(200).json({
    success: true,
    token,
    data: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      hospital: admin.hospital
    }
  });
});

// Create hospital admin after hospital registration (Helper function)
exports.createHospitalAdmin = async (hospitalId, hospitalName) => {
  // Generate admin credentials
  const adminEmail = `admin@${hospitalName.toLowerCase().replace(/\s+/g, '')}.com`;
  const tempPassword = Math.random().toString(36).slice(-8);

  const admin = await User.create({ // Assuming User model is used for all users, including admins
    name: `${hospitalName} Admin`,
    email: adminEmail,
    password: tempPassword,
    role: 'hospital-admin', // Use the role from the User schema
    hospital: hospitalId
  });

  return { admin, tempPassword };
};

// @desc    Register hospital
// @route   POST /api/v1/admin/hospitals
// @access  Private (Admin)
exports.registerHospital = asyncHandler(async (req, res, next) => {
  const { name, address, county, phone, facilities } = req.body;

  // Create hospital
  const hospital = await Hospital.create({
    name,
    address,
    county,
    phone,
    facilities: facilities || [] // Use provided facilities or an empty array
  });

  // Create hospital admin user
  const { admin: hospitalAdmin, tempPassword } = await exports.createHospitalAdmin(hospital._id, hospital.name);

  // Create core departments
  const coreDepartments = [
    { name: 'RECEPTION', type: 'PATIENT_FLOW' },
    { name: 'TRIAGE', type: 'PATIENT_FLOW' },
    { name: 'REGISTRATION', type: 'PATIENT_FLOW' },
    { name: 'EMERGENCY', type: 'CLINICAL' },
    { name: 'OUTPATIENT', type: 'CLINICAL' },
    { name: 'LABORATORY', type: 'DIAGNOSTIC' },
    { name: 'RADIOLOGY', type: 'DIAGNOSTIC' },
    { name: 'PHARMACY', type: 'SUPPORT' },
    { name: 'BILLING', type: 'ADMINISTRATIVE' },
    { name: 'MEDICAL_RECORDS', type: 'ADMINISTRATIVE' }
  ];

  const createdDepts = [];
  for (const dept of coreDepartments) {
    // For core departments, we might not assign operators immediately,
    // or assign a default set if needed by the Department schema's minOperators.
    // Assuming operatorRoles and operators might be optional at initial creation
    // or handled by a default in the Department model.
    const newDept = await Department.create({
      ...dept,
      hospital: hospital._id,
      operatorRoles: [], // Default empty or based on department type
      operators: []      // Default empty
    });
    createdDepts.push(newDept);
  }

  // Link hospital to admin and departments
  hospital.admin = hospitalAdmin._id; // Assuming admin field exists in Hospital model
  hospital.departments = createdDepts.map(dept => dept._id); // Assuming departments field exists in Hospital model
  await hospital.save();

  res.status(201).json({
    success: true,
    data: hospital,
    departments: createdDepts,
    adminCredentials: {
      email: hospitalAdmin.email, // Use hospitalAdmin for email
      password: tempPassword
    }
  });
});

// @desc    Register doctor
// @route   POST /api/v1/admin/doctors
// @access  Private (Admin)
exports.registerDoctor = asyncHandler(async (req, res, next) => {
  const { name, email, phone, specialty, licenseNumber, hospital } = req.body;

  // Check if doctor already exists
  const existingDoctor = await Doctor.findOne({ $or: [{ email }, { licenseNumber }] });
  if (existingDoctor) {
    return res.status(400).json({
      success: false,
      error: 'Doctor with this email or license already exists'
    });
  }

  // Create doctor
  const doctor = await Doctor.create({
    name,
    email,
    phone,
    specialty,
    licenseNumber,
    hospital
  });

  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8);

  // Create user account for doctor
  const user = await User.create({
    name,
    email,
    password: tempPassword,
    role: 'doctor',
    // Assuming phone and specialty are also fields in the User model if needed
    // phone: phone,
    // specialty: specialty,
    doctorId: doctor._id // Link the user to the doctor profile
  });

  res.status(201).json({
    success: true,
    data: doctor,
    credentials: {
      email,
      tempPassword
    }
  });
});

// Add license verification middleware
exports.verifyLicense = async (req, res, next) => {
  const { licenseNumber } = req.body;

  // Check with medical board API (pseudo-code)
  // const isValid = await MedicalBoardAPI.verifyLicense(licenseNumber);
  const isValid = true; // For development

  if (!isValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid medical license number'
    });
  }

  next();
};

// @desc    Get current logged in admin
// @route   GET /api/v1/admin/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // Assuming req.admin.id is populated by an auth middleware
  const admin = await Admin.findById(req.admin.id)
    .populate('hospital', 'name address county');

  if (!admin) {
    return res.status(404).json({
      success: false,
      error: 'Admin not found'
    });
  }

  res.status(200).json({
    success: true,
    data: admin
  });
});


// Get hospital statistics
exports.getHospitalStats = asyncHandler(async (req, res, next) => {
  // Assuming req.admin.hospital is populated by an auth middleware
  const hospitalId = req.admin.hospital;

  const stats = {
    appointments: await Appointment.countDocuments({ hospital: hospitalId }),
    patients: await Patient.countDocuments({ hospital: hospitalId }),
    doctors: await Doctor.countDocuments({ hospital: hospitalId }),
    revenue: await Billing.aggregate([ // Assuming Billing model is imported
      { $match: { hospital: hospitalId } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ])
  };

  res.status(200).json({ success: true, data: stats });
});

// Get hospital doctors
exports.getHospitalDoctors = asyncHandler(async (req, res, next) => {
  // Assuming req.admin.hospital is populated by an auth middleware
  const doctors = await Doctor.find({ hospital: req.admin.hospital })
    .populate('appointments'); // Assuming 'appointments' is a field in Doctor model

  res.status(200).json({ success: true, data: doctors });
});

// Get hospital appointments
exports.getHospitalAppointments = asyncHandler(async (req, res, next) => {
  // Assuming req.admin.hospital is populated by an auth middleware
  const appointments = await Appointment.find({
    hospital: req.admin.hospital,
    date: { $gte: new Date() } // Assuming 'date' field exists in Appointment model
  })
    .populate('patient doctor') // Assuming 'patient' and 'doctor' fields exist in Appointment model
    .sort('date');

  res.status(200).json({ success: true, data: appointments });
});

// @desc    Create new department with operators
// @route   POST /api/v1/departments
// @access  Hospital Admin
exports.createDepartment = asyncHandler(async (req, res) => {
  const { name, type, location, operatorRoles, operatorIds } = req.body;

  // Verify hospital admin permissions
  if (req.user.role !== 'hospital-admin') {
    return res.status(403).json({
      success: false,
      error: 'Only hospital admins can create departments'
    });
  }

  // Check if department exists
  const existingDept = await Department.findOne({
    name,
    hospital: req.user.hospital
  });

  if (existingDept) {
    return res.status(400).json({
      success: false,
      error: `Department ${name} already exists in this hospital`
    });
  }

  // Verify operators
  const operators = [];
  for (const operatorId of operatorIds) {
    const operator = await User.findOne({
      _id: operatorId,
      hospital: req.user.hospital
    });

    if (!operator) {
      return res.status(400).json({
        success: false,
        error: `Operator ${operatorId} not found in this hospital`
      });
    }

    // Verify operator has required role
    if (!operatorRoles.includes(operator.role)) {
      return res.status(400).json({
        success: false,
        error: `Operator ${operator.name} lacks required role for this department`
      });
    }

    operators.push(operator._id);
  }

  // Create department
  const department = await Department.create({
    name,
    type,
    location,
    operatorRoles,
    operators,
    hospital: req.user.hospital,
    headOfDepartment: operators[0] // First operator is HOD
  });

  // Update operators' department assignment
  await User.updateMany(
    { _id: { $in: operators } },
    { $set: { department: name } }
  );

  res.status(201).json({
    success: true,
    data: department
  });
});

// @desc    Get all departments in a hospital
// @route   GET /api/v1/departments
// @access  Hospital Staff
exports.getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ hospital: req.user.hospital })
    .populate('headOfDepartment', 'name email phone')
    .populate('doctors', 'name specialty');

  res.status(200).json({
    success: true,
    count: departments.length,
    data: departments
  });
});

// @desc    Update department
// @route   PUT /api/v1/departments/:id
// @access  Hospital Admin
exports.updateDepartment = asyncHandler(async (req, res) => {
  let department = await Department.findById(req.params.id);

  if (!department) {
    return res.status(404).json({
      success: false,
      error: 'Department not found'
    });
  }

  // Verify department belongs to hospital
  if (department.hospital.toString() !== req.user.hospital.toString()) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to update this department'
    });
  }

  department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: department
  });
});

// @desc    Get department analytics
// @route   GET /api/v1/departments/:id/analytics
// @access  Department Head
exports.getDepartmentAnalytics = asyncHandler(async (req, res) => {
  const department = await Department.findOne({
    _id: req.params.id,
    hospital: req.user.hospital
  });

  if (!department) {
    return res.status(404).json({
      success: false,
      error: 'Department not found'
    });
  }

  // Check if user is HOD or admin
  const isHod = department.headOfDepartment?.toString() === req.user.id;
  const isAdmin = ['super-admin', 'hospital-admin'].includes(req.user.role);

  if (!isHod && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Only department heads can view analytics'
    });
  }

  const [currentPatients, waitingPatients, doctors] = await Promise.all([
    Assignment.countDocuments({
      department: department.name, // Assuming 'department' field in Assignment is the name
      status: 'IN_PROGRESS'
    }),
    Assignment.countDocuments({
      department: department.name,
      status: 'PENDING'
    }),
    User.countDocuments({
      department: department.name,
      role: 'doctor'
    })
  ]);

  res.status(200).json({
    success: true,
    data: {
      department: department.name,
      currentPatients,
      waitingPatients,
      doctors,
      availableBeds: department.availableBeds,
      // Ensure availableBeds is not zero to avoid division by zero
      bedOccupancy: department.availableBeds > 0 ? ((currentPatients / department.availableBeds) * 100).toFixed(2) : '0.00'
    }
  });
});

// @desc    Add operator to department
// @route   POST /api/v1/departments/:id/operators
// @access  Hospital Admin
exports.addOperator = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return res.status(404).json({
      success: false,
      error: 'Department not found'
    });
  }

  // Verify hospital admin permissions
  if (department.hospital.toString() !== req.user.hospital.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to modify this department'
    });
  }

  const { operatorId } = req.body;
  const operator = await User.findOne({
    _id: operatorId,
    hospital: req.user.hospital
  });

  if (!operator) {
    return res.status(404).json({
      success: false,
      error: 'User not found in this hospital'
    });
  }

  // Verify operator has required role
  if (!department.operatorRoles.includes(operator.role)) {
    return res.status(400).json({
      success: false,
      error: `User role ${operator.role} not permitted in this department`
    });
  }

  // Add operator to department
  if (!department.operators.includes(operator._id)) {
    department.operators.push(operator._id);
    await department.save();

    // Update operator's department
    operator.department = department.name;
    await operator.save();
  }

  res.status(200).json({
    success: true,
    data: department
  });
});

// @desc    Register department operator
// @route   POST /api/v1/admin/operators
// @access  Hospital Admin
exports.registerOperator = asyncHandler(async (req, res) => {
  // HOSPITAL ADMIN CHECK
  if (req.user.role !== 'hospital-admin') {
    return res.status(403).json({
      success: false,
      error: 'Only hospital admins can register operators'
    });
  }

  const { name, email, phone, role, department } = req.body;

  // Validate operator role
  const validRoles = [
    'doctor', 'lab-technician', 'pharmacist', 'receptionist',
    'nurse', 'radiologist', 'department-operator'
  ];

  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      error: `Invalid operator role: ${role}`
    });
  }

  // Check if department exists
  const dept = await Department.findOne({
    name: department,
    hospital: req.user.hospital
  });

  if (!dept) {
    return res.status(404).json({
      success: false,
      error: `Department ${department} not found`
    });
  }

  // Check if role is permitted in department
  if (!dept.operatorRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      error: `Role ${role} not permitted in ${department} department`
    });
  }

  // Create operator user
  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const operator = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    hospital: req.user.hospital,
    department,
    phone
  });

  // Add operator to department
  dept.operators.push(operator._id);
  await dept.save();

  res.status(201).json({
    success: true,
    data: operator,
    credentials: {
      email,
      password: tempPassword
    }
  });
});
