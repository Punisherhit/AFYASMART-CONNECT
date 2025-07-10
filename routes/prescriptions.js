// routes/prescriptions.js
const checkInteractions = require('../middleware/drugCheck');
router.post('/prescribe', authenticateDoctor, checkInteractions, async (req, res) => {
  const { patientId, meds } = req.body;
  const prescription = new Prescription({ doctorId: req.user.id, patientId, meds });
  await prescription.save();
  generatePDF(prescription); // Send to patient/pharmacy
  res.json(prescription);
});