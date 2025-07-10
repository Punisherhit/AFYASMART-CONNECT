const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Department = require('../models/Department');

// Enhanced protect middleware with department verification
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check multiple token sources
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized - No token provided');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user with hospital and department info
    req.user = await User.findById(decoded.id)
      .select('-password')
      .populate('hospital', 'name departments')
      .populate('department');

    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized - User not found');
    }

    // Add department permissions to request
    if (req.user.department) {
      const department = await Department.findOne({
        name: req.user.department,
        hospital: req.user.hospital
      });
      req.department = department;
    }

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401);
    throw new Error('Not authorized - Token verification failed');
  }
});

// Department-aware authorization
exports.authorize = (roles = [], departmentTypes = []) => {
  return asyncHandler(async (req, res, next) => {
    // Role check
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role ${req.user.role} not authorized`);
    }

    // Department type check
    if (departmentTypes.length > 0) {
      if (!req.department || !departmentTypes.includes(req.department.type)) {
        res.status(403);
        throw new Error(`Department ${req.user.department} not authorized`);
      }
    }

    next();
  });
};

// Resource ownership check with department verification
exports.checkOwnership = (model, path = 'user') => {
  return asyncHandler(async (req, res, next) => {
    const resource = await model.findById(req.params.id);

    if (!resource) {
      res.status(404);
      throw new Error('Resource not found');
    }

    // Check ownership
    const isOwner = resource[path]?.toString() === req.user.id;
    const isAdmin = req.user.role === 'super-admin' || req.user.role === 'hospital-admin';
    const isDepartmentHead = req.department?.headOfDepartment?.toString() === req.user.id;

    if (!isOwner && !isAdmin && !isDepartmentHead) {
      res.status(403);
      throw new Error('Not authorized to access this resource');
    }

    req.resource = resource;
    next();
  });
};

// Add department operator check
exports.isDepartmentOperator = asyncHandler(async (req, res, next) => {
  if (!req.department) {
    return res.status(403).json({
      success: false,
      error: 'User not assigned to any department'
    });
  }

  if (!req.department.operators.includes(req.user._id)) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized as department operator'
    });
  }

  next();
});
