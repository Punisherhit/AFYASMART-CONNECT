// routes/results.js
router.get('/results/:patientId', authenticateUser, checkLabPermissions, async (req, res) => {
  const results = await LabResults.find({ patientId: req.params.patientId });
  res.json(results);
});