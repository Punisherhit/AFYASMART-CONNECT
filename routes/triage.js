const express = require('express');
const router = express.Router();
const Triage = require('../models/Triage');

// GET /api/triage/queue - all patients waiting triage
router.get('/queue', async (req, res) => {
  const queue = await Triage.find({ status: 'Waiting' }).sort({ arrivalTime: 1 });
  res.json(queue);
});

// GET /api/triage/counts - counts by category
router.get('/counts', async (req, res) => {
  const critical = await Triage.countDocuments({ priority: 'Critical', status: 'Waiting' });
  const urgent = await Triage.countDocuments({ priority: 'Urgent', status: 'Waiting' });
  const stable = await Triage.countDocuments({ priority: 'Stable', status: 'Waiting' });
  const total = critical + urgent + stable;

  res.json({ critical, urgent, stable, total });
});

// GET /api/triage/vitals/summary - average vitals
router.get('/vitals/summary', async (req, res) => {
  const triage = await Triage.find({ status: 'Waiting' });
  const count = triage.length;

  const avg = {
    heartRate: triage.reduce((sum, p) => sum + (p.vitals.heartRate || 0), 0) / count,
    temperature: triage.reduce((sum, p) => sum + (p.vitals.temperature || 0), 0) / count,
    bloodPressure: 'N/A' // Optional to parse average systolic/diastolic
  };

  res.json(avg);
});

// GET /api/triage/:id - get single patient by triageId
router.get('/:id', async (req, res) => {
  const patient = await Triage.findOne({ triageId: req.params.id });
  if (!patient) return res.status(404).json({ error: 'Not found' });
  res.json(patient);
});

// POST /api/triage/new - create new triage entry
router.post('/new', async (req, res) => {
  const { patientName, triageId, priority, symptoms, vitals } = req.body;
  try {
    const newPatient = new Triage({ patientName, triageId, priority, symptoms, vitals });
    await newPatient.save();
    res.status(201).json(newPatient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/triage/:id/assess - mark as assessed
router.put('/:id/assess', async (req, res) => {
  const triage = await Triage.findOneAndUpdate(
    { triageId: req.params.id },
    { status: 'Assessed' },
    { new: true }
  );
  if (!triage) return res.status(404).json({ error: 'Not found' });
  res.json(triage);
});

module.exports = router;
