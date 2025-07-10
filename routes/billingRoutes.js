const express = require('express');
const protect = require('../middleware/auth');
const Billing = require('../models/Billing');
const nhifService = require('../services/nhifService'); // New import for NHIF service
const { protect } = require('../middleware/adminAuth');

const router = express.Router();

/**
 * @route POST /api/billing
 * @desc Create a new invoice
 * @access Private (requires authentication)
 */
router.post('/', protect, async (req, res) => {
  try {
    const invoice = new Billing(req.body);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    console.error('Error creating invoice:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route POST /api/billing/:id/payments
 * @desc Record a payment for a specific invoice
 * @access Private (requires authentication)
 */
router.post('/:id/payments', protect, async (req, res) => {
  try {
    const invoice = await Billing.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Add the new payment to the invoice's payments array
    invoice.payments.push(req.body);

    // Calculate total paid amount and update invoice status accordingly
    const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    if (paidAmount >= invoice.totalAmount) {
      invoice.status = 'paid';
    } else if (paidAmount > 0) {
      invoice.status = 'partially_paid';
    }

    await invoice.save(); // Save the updated invoice
    res.json(invoice);
  } catch (err) {
    console.error('Error recording payment:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route GET /api/billing/patient/:patientId
 * @desc Get billing history (invoices) for a specific patient
 * @access Private (requires authentication)
 */
router.get('/patient/:patientId', protect, async (req, res) => {
  try {
    // Find all invoices for the given patient ID and sort by date (latest first)
    const invoices = await Billing.find({ patientId: req.params.patientId })
      .sort('-date');
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching patient billing history:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route POST /api/billing/:id/verify-insurance
 * @desc Verify NHIF coverage for a given member number
 * @access Private (requires authentication)
 * @body {string} memberNumber - The NHIF member number to verify
 */
router.post('/:id/verify-insurance', protect, async (req, res) => {
  try {
    const { memberNumber } = req.body;
    // Call the NHIF service to verify coverage
    const coverage = await nhifService.verifyCoverage(memberNumber);
    res.json(coverage);
  } catch (err) {
    console.error('Error verifying NHIF coverage:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route POST /api/billing/:id/submit-nhif-claim
 * @desc Submit an NHIF claim for a specific invoice
 * @access Private (requires authentication)
 * @body {string} memberNumber - The NHIF member number associated with the claim
 */
router.post('/:id/submit-nhif-claim', protect, async (req, res) => {
  try {
    // Find the invoice to gather details for the claim
    const invoice = await Billing.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Prepare claim data from the invoice and request body
    const claimData = {
      patientId: invoice.patientId,
      invoiceId: invoice._id,
      items: invoice.items,
      totalAmount: invoice.totalAmount,
      memberNumber: req.body.memberNumber // Member number passed in the request body
    };

    // Submit the claim using the NHIF service
    const claimResult = await nhifService.submitClaim(claimData);
    res.json(claimResult);
  } catch (err) {
    console.error('Error submitting NHIF claim:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
