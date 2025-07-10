const express = require('express');
const router = express.Router();
const nhifService = require('../services/nhifService'); // Adjust path if needed

// @route   GET /api/nhif/verify/:memberNumber
// @desc    Verify NHIF coverage status
router.get('/verify/:memberNumber', async (req, res) => {
  try {
    const { memberNumber } = req.params;
    const result = await nhifService.verifyCoverage(memberNumber);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/nhif/claim
// @desc    Submit an NHIF insurance claim
router.post('/claim', async (req, res) => {
  try {
    const claimData = req.body;
    const result = await nhifService.submitClaim(claimData);
    res.status(201).json({ message: 'Claim submitted successfully', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
