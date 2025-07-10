const express = require('express');
const router = express.Router();
const {
  createLabResult,
  getPatientLabResults,
  updateLabResult,
  getCriticalResults
} = require('../controllers/labResultController');

// Create a lab result
router.post('/', createLabResult);

// Get results for a specific patient
router.get('/patient/:patientId', getPatientLabResults);

// Update a lab result
router.put('/:id', updateLabResult);

// Get critical results
router.get('/critical', getCriticalResults);

module.exports = router;