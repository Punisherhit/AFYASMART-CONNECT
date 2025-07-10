const Hospital = require('../models/Hospital');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Public
exports.getHospitals = asyncHandler(async (req, res) => {
  const hospitals = await Hospital.find().populate('admin', 'name email');
  res.status(200).json({
    success: true,
    count: hospitals.length,
    data: hospitals
  });
});

// @desc    Get single hospital
// @route   GET /api/hospitals/:id
// @access  Public
exports.getHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id).populate('admin', 'name email');
  
  if (!hospital) {
    return res.status(404).json({
      success: false,
      message: 'Hospital not found'
    });
  }

  res.status(200).json({
    success: true,
    data: hospital
  });
});

// @desc    Create new hospital
// @route   POST /api/hospitals
// @access  Private/Admin
exports.createHospital = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, address, county, phone, facilities, admin } = req.body;

  // Check if hospital already exists
  const existingHospital = await Hospital.findOne({ name });
  if (existingHospital) {
    return res.status(400).json({
      success: false,
      message: 'Hospital with this name already exists'
    });
  }

  const hospital = await Hospital.create({
    name,
    address,
    county,
    phone,
    facilities,
    admin
  });

  res.status(201).json({
    success: true,
    data: hospital
  });
});

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private/Admin
exports.updateHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!hospital) {
    return res.status(404).json({
      success: false,
      message: 'Hospital not found'
    });
  }

  res.status(200).json({
    success: true,
    data: hospital
  });
});

// @desc    Delete hospital
// @route   DELETE /api/hospitals/:id
// @access  Private/Admin
exports.deleteHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndDelete(req.params.id);

  if (!hospital) {
    return res.status(404).json({
      success: false,
      message: 'Hospital not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get hospitals within a radius (in miles)
// @route   GET /api/hospitals/radius/:zipcode/:distance
// @access  Public
exports.getHospitalsInRadius = asyncHandler(async (req, res) => {
  const { zipcode, distance } = req.params;

  // TODO: Implement geocoding and radius search
  // This is a placeholder implementation
  const hospitals = await Hospital.find({
    county: new RegExp(zipcode, 'i')
  }).limit(10);

  res.status(200).json({
    success: true,
    count: hospitals.length,
    data: hospitals
  });
});