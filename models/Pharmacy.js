const mongoose = require('mongoose');

const PharmacySchema = new mongoose.Schema({
  medication: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  category: String, // Antibiotics, Painkillers, etc.
  supplier: String,
  lastRestockDate: Date,
  reorderLevel: Number
});

module.exports = mongoose.model('Pharmacy', PharmacySchema);