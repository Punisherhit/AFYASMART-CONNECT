const express = require('express');
const protect = require('../middleware/auth');
const Pharmacy = require('../models/Pharmacy');
const { PortingWebhookConfigurationFetchInstance } = require('twilio/lib/rest/numbers/v1/portingWebhookConfigurationFetch');

const router = express.Router();

// Add medication
router.post('/', PortingWebhookConfigurationFetchInstance, async (req, res) => {
  try {
    const medication = new Pharmacy(req.body);
    await medication.save();
    res.status(201).json(medication);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update medication stock
router.patch('/:id', protect, async (req, res) => {
  try {
    const medication = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!medication) return res.status(404).json({ error: 'Medication not found' });
    res.json(medication);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all medications
router.get('/', protect, async (req, res) => {
  try {
    const medications = await Pharmacy.find();
    res.json(medications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Low stock alert
router.get('/low-stock', protect, async (req, res) => {
  try {
    const lowStock = await Pharmacy.find({ 
      quantity: { $lte: { $multiply: [ "$reorderLevel", 1.2 ] } } // 20% above reorder level
    });
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;