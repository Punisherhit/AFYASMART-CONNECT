const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { check } = require('express-validator');
// const protect = require('../middleware/auth');
const { protect } = require('../middleware/auth');

const { requireRole } = require('../middleware/role'); // ✅ fixed

// Public routes
router.get('/', hospitalController.getHospitals);
router.get('/:id', hospitalController.getHospital);
router.get('/radius/:zipcode/:distance', hospitalController.getHospitalsInRadius);

// Protected routes (Admin only)
router.post(
  '/',
  [
    protect,
    requireRole('admin'), // ✅ updated
    check('name', 'Hospital name is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
    check('county', 'County is required').not().isEmpty(),
    check('phone', 'Phone number is required').not().isEmpty()
  ],
  hospitalController.createHospital
);

router.put(
  '/:id',
  [
    protect,
    requireRole('admin'), // ✅ updated
    check('name', 'Hospital name is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty()
  ],
  hospitalController.updateHospital
);

router.delete(
  '/:id',
  [protect, requireRole('admin')], // ✅ updated
  hospitalController.deleteHospital
);

module.exports = router;
