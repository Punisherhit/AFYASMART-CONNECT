const express = require('express');
const protect = require('../middleware/auth');
const EHR = require('../models/EHR');
const blockchainService = require('../services/blockchainService'); // This was already correctly imported

const router = express.Router();

/**
 * @route POST /api/ehr
 * @desc Create a new EHR record and add to blockchain audit trail
 * @access Private (requires authentication)
 */
router.post('/', protect, async (req, res) => {
  try {
    // Create a new EHR document with data from request body and the doctor's ID from authenticated user
    const ehr = new EHR({ ...req.body, doctorId: req.user.id });
    await ehr.save(); // Save the new EHR record to the database

    // Add the EHR record's ID to the blockchain for an audit trail
    // This ensures data integrity and a verifiable history
    const auditResult = await blockchainService.generateAuditTrail(ehr._id, 'ehr');

    // Respond with the created EHR and the blockchain audit result
    res.status(201).json({ ehr, blockchain: auditResult });
  } catch (err) {
    // Handle any errors during EHR creation or blockchain interaction
    console.error('Error creating EHR record:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route GET /api/ehr/patient/:patientId
 * @desc Get all EHR records for a specific patient
 * @access Private (requires authentication)
 */
router.get('/patient/:patientId', protect, async (req, res) => {
  try {
    // Find all EHR records for the given patient ID
    // Populate the doctorId to include doctor's name and specialty
    // Sort records by visitDate in descending order (latest first)
    const ehrRecords = await EHR.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name specialty')
      .sort('-visitDate');

    // Respond with the found EHR records
    res.json(ehrRecords);
  } catch (err) {
    // Handle any errors during fetching EHR records
    console.error('Error fetching patient EHR history:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route POST /api/ehr/:id/attachments
 * @desc Add an attachment to an existing EHR record
 * @access Private (requires authentication)
 */
router.post('/:id/attachments', protect, async (req, res) => {
  try {
    // Find the EHR record by its ID
    const ehr = await EHR.findById(req.params.id);
    // If no EHR record is found, return a 404 error
    if (!ehr) {
      return res.status(404).json({ error: 'EHR record not found' });
    }

    // Add the new attachment data (from req.body) to the attachments array
    ehr.attachments.push(req.body);
    await ehr.save(); // Save the updated EHR record

    // Respond with the updated EHR record
    res.json(ehr);
  } catch (err) {
    // Handle any errors during adding attachment
    console.error('Error adding EHR attachment:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/**
 * @route GET /api/ehr/:id/verify
 * @desc Verify the integrity of a specific EHR record using blockchain
 * @access Private (requires authentication)
 */
router.get('/:id/verify', protect, async (req, res) => {
  try {
    // Call the blockchain service to verify the record's integrity
    // The 'ehr' type is passed to specify the type of record being verified
    const verification = await blockchainService.verifyRecord(req.params.id, 'ehr');
    // Respond with the verification result
    res.json(verification);
  } catch (err) {
    // Handle any errors during verification
    console.error('Error verifying EHR record integrity:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

