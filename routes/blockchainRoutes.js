const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');

// 🔒 (Optional) Protect routes if needed
// const authenticate = require('../middleware/auth');
// router.use(authenticate);

/**
 * @route POST /api/blockchain/audit
 * @desc Add access audit to blockchain
 * @body { recordId: String, recordType: "ehr" | "lab" | "radiology" }
 */
router.post('/audit', async (req, res) => {
  try {
    const { recordId, recordType } = req.body;

    if (!recordId || !recordType) {
      return res.status(400).json({ error: 'recordId and recordType are required' });
    }

    const result = await blockchainService.generateAuditTrail(recordId, recordType);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/blockchain/verify/:type/:id
 * @desc Verify record integrity from blockchain
 */
router.get('/verify/:type/:id', async (req, res) => {
  try {
    const { id, type } = req.params;
    const result = await blockchainService.verifyRecord(id, type);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/blockchain/chain
 * @desc View the full blockchain
 */
router.get('/chain', (req, res) => {
  try {
    res.status(200).json(blockchainService.chain);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/blockchain/record/:type/:id
 * @desc Fetch raw record data from DB (debug/testing only)
 */
router.get('/record/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const record = await blockchainService.getRecord(id, type);

    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
