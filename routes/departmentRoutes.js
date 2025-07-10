const express = require('express');
const router = express.Router();
const {
  protect,
  authorize
} = require('../middleware/auth');
const {
  createDepartment,
  getDepartments,
  updateDepartment,
  getDepartmentAnalytics
} = require('../controllers/departmentController');

router.route('/')
  .post(protect, authorize('hospital-admin'), createDepartment)
  .get(protect, getDepartments);

router.route('/:id')
  .put(protect, authorize('hospital-admin'), updateDepartment);

router.route('/:id/analytics')
  .get(protect, getDepartmentAnalytics);

module.exports = router;