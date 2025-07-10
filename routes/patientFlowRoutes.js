// routes/patientFlowRoutes.js
const express = require('express');
const router = express.Router();
const patientFlowController = require('../controllers/patientFlowController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', 
  protect,
  authorize('hospital-admin'),
  patientFlowController.registerPatient
);

router.post('/transfer', 
  protect,
  authorize('doctor'),
  patientFlowController.transferPatient
);

router.post('/complete', 
  protect,
  authorize('receptionist'),
  patientFlowController.completePatientJourney
);

router.post('/register', (req, res) => {
  res.status(200).json({ success: true, message: 'Placeholder' });
});

module.exports = router;