const express = require('express');
const protect = require('../middleware/auth');
const Radiology = require('../models/Radiology');

const router = express.Router();

// Order radiology study
router.post('/', protect, async (req, res) => {
  try {
    const radiology = new Radiology(req.body);
    await radiology.save();
    res.status(201).json(radiology);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update radiology status/report
router.patch('/:id', protect, async (req, res) => {
  try {
    const radiology = await Radiology.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!radiology) return res.status(404).json({ error: 'Radiology study not found' });
    res.json(radiology);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get patient radiology history
router.get('/patient/:patientId', protect, async (req, res) => {
  try {
    const studies = await Radiology.find({ patientId: req.params.patientId })
      .sort('-orderedDate');
    res.json(studies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;