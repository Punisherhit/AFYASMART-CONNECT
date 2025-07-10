// const express = require('express');
// const router = express.Router();
// const { client } = require('../services/redis'); // Centralized Redis client

// // Add patient to queue
// router.post('/add', (req, res) => {
//   const { clinicId, patientId } = req.body;
//   client.lpush(`clinic:${clinicId}`, patientId);
//   res.json({ status: 'Queued!' });
// });

// module.exports = router;