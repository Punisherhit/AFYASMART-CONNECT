const express = require('express');
const router = express.Router();
const {
  registerOperator
} = require('../controllers/adminController');
const {
  protect,
  authorize
} = require('../middleware/auth');

// @desc    Register department operator
// @route   POST /api/v1/operators
// @access  Hospital Admin
router.post(
  '/',
  protect,
  authorize('hospital-admin'),
  registerOperator
);

module.exports = router;