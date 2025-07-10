const express = require('express');
const protect = require('../middleware/auth');
const LabTest = require('../models/LabTest');

const router = express.Router();

// Order lab test
router.post('/', protect, async (req, res) => {
  try {
    const labTest = new LabTest(req.body);
    await labTest.save();
    res.status(201).json(labTest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update lab test status/results
router.patch('/:id', protect, async (req, res) => {
  try {
    const labTest = await LabTest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!labTest) return res.status(404).json({ error: 'Lab test not found' });
    res.json(labTest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get patient lab history
router.get('/patient/:patientId', protect, async (req, res) => {
  try {
    const labTests = await LabTest.find({ patientId: req.params.patientId })
      .sort('-orderedDate');
    res.json(labTests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;