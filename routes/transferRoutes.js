// routes/transferRoutes.js
const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { protect, authorize } = require('../middleware/auth');

router.post('/:id/accept', 
  protect,
  authorize('doctor', 'nurse'),
  transferController.acceptTransfer
);

router.get('/pending', 
  protect,
  authorize('doctor', 'nurse'),
  transferController.getPendingTransfers
);

module.exports = router;