// routes/mpesa.js
const mpesa = require('daraja-sdk');
const mpesaLimiter = require('../middleware/rateLimit');

router.post('/pay', mpesaLimiter, async (req, res) => {
  const { phone, amount } = req.body;
  const response = await mpesa.stkPush(phone, amount);
  res.json(response); // Handle callback to confirm payment
});