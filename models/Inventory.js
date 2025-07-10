const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  description: String,
  category: String, // Medical, Office, etc.
  quantity: { type: Number, required: true },
  unit: String, // boxes, pieces, etc.
  reorderLevel: Number,
  lastOrderDate: Date,
  supplier: String,
  location: String // Storage location
});

module.exports = mongoose.model('Inventory', InventorySchema);