const Prescription = require('../models/Prescription');
const { generatePDF } = require('../utils/pdfGenerator');
const { checkDrugInteractions } = require('../utils/drugChecker');

// Create new prescription
exports.createPrescription = async (req, res) => {
  try {
const { patient, medications } = req.body;

// Check for drug interactions
const interactions = await checkDrugInteractions(medications);

const newPrescription = new Prescription({
  patient,
  doctor: req.user.id,
  medications,
  interactions
});

const prescription = await newPrescription.save();

// Generate PDF
const pdfBuffer = await generatePDF(prescription);

// After generating PDF
const patientRecord = await Patient.findById(patient).populate('user');
if (patientRecord.user.email) {
  await emailService.sendPrescription(
    patientRecord.user.email, 
    prescription,
    pdfBuffer
  );
}

// In real app: send to S3 and email to patient
res.status(201).json({
  success: true,
  prescription,
  interactions,
  pdfUrl: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`
});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get patient's prescriptions
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.params.patientId })
      .populate('doctor', 'name specialty');
      
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

