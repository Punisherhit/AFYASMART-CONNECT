const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getMe,
  registerHospital,
  registerDoctor
} = require('../controllers/adminController');
const { protect, authorize, loginLimiter } = require('../middleware/adminAuth');
const { getHospitalStats } = require('../controllers/adminController'); // adjust path if needed
// const { getHospitalDoctors, getHospitalAppointments } = require('../controllers/hospitalController');
// const { verifyLicense } = require('../middleware/licenseVerification');




// Public routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Protected routes
router.get('/me', protect, getMe);
router.post('/hospitals', protect, authorize('superadmin'), registerHospital);
router.post('/doctors', protect, authorize('superadmin', 'hospitaladmin'), registerDoctor);

// Add dashboard routes
// router.get('/stats', protect, authorize('hospitaladmin'), getHospitalStats);
// router.get('/doctors', protect, authorize('hospitaladmin'), getHospitalDoctors);
// router.get('/appointments', protect, authorize('hospitaladmin'), getHospitalAppointments);

// Add license verification to doctor registration
// router.post('/doctors', 
//   protect, 
//   authorize('superadmin', 'hospitaladmin'),
//   verifyLicense,  // Add this middleware
//   registerDoctor
// );

module.exports = router;