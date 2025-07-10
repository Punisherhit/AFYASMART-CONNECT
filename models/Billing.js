const mongoose = require('mongoose');

const BillingSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  hospital: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hospital', 
    required: true 
  },
  visit: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' }, // Link to visit
  billingDate: { type: Date, default: Date.now },
  dueDate: { type: Date, default: () => Date.now() + 14*24*60*60*1000 }, // 14 days
  items: [{
    itemCode: String,
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['CONSULTATION', 'LAB_TEST', 'PROCEDURE', 'MEDICATION', 'BED_CHARGES']
    },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    discount: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, default: function() { return this.totalAmount - this.amountPaid; } },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'MPESA', 'CARD', 'INSURANCE', 'BANK_TRANSFER']
  },
  insuranceClaim: {
    claimNumber: String,
    status: String,
    amountCovered: Number
  },
  receiptNumber: String,
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Auto-calculate balance before save
BillingSchema.pre('save', function(next) {
  this.balance = this.totalAmount - this.amountPaid;
  next();
});

// Indexes
BillingSchema.index({ patient: 1, status: 1 });
BillingSchema.index({ hospital: 1, billingDate: -1 });

module.exports = mongoose.model('Billing', BillingSchema);