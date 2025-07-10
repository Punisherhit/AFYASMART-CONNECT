const express = require('express');
const protect = require('../middleware/auth');
const Inventory = require('../models/Inventory');

const router = express.Router();

// Add inventory item
router.post('/', protect, async (req, res) => {
  try {
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update inventory item
router.patch('/:id', protect, async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all inventory
router.get('/', protect, async (req, res) => {
  try {
    const inventory = await Inventory.find();
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reorder alerts
router.get('/reorder-alerts', protect, async (req, res) => {
  try {
    const alerts = await Inventory.find({ 
      quantity: { $lte: "$reorderLevel" } 
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;