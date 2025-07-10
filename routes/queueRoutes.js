const express = require('express');
const router = express.Router();
const {
  protect,
  authorize
} = require('../middleware/auth');
const {
  getQueue,
  assignToDoctor,
  completeAssignment
} = require('../controllers/queueController');

router.route('/:department')
  .get(protect, authorize('doctor', 'nurse'), getQueue);

router.route('/:id/assign')
  .put(protect, authorize('doctor', 'nurse'), assignToDoctor);

router.route('/:id/complete')
  .put(protect, authorize('doctor'), completeAssignment);

module.exports = router;