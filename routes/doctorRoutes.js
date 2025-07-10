const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth'); // Fixed import

// Public routes
router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctor);

// Protected routes
router.post(
  '/',
  [
    protect,
    authorize('hospital-admin'), // Use authorize instead of requireRole
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('phone', 'Phone is required').not().isEmpty(),
      check('specialty', 'Specialty is required').not().isEmpty(),
      check('hospital', 'Hospital is required').not().isEmpty(),
      check('licenseNumber', 'License number is required').not().isEmpty()
    ]
  ],
  doctorController.registerDoctor
);

// Update doctor
router.put(
  '/:id', 
  [
    protect,
    authorize('hospital-admin')
  ],
  doctorController.updateDoctor
);

// Delete doctor
router.delete(
  '/:id',
  [
    protect,
    authorize('hospital-admin')
  ],
  doctorController.deleteDoctor
);

// Doctor-specific patient access
router.get(
  '/patient/:patientId',
  [
    protect,
    authorize('doctor')
  ],
  doctorController.getPatientInfo
);

// Patient search
router.get(
  '/patients/search',
  [
    protect,
    authorize('doctor')
  ],
  doctorController.searchPatients
);

module.exports = router;