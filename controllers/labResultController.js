const LabResult = require('../models/LabResult');

// Create lab result
exports.createLabResult = async (req, res) => {
  try {
    const labResult = new LabResult(req.body);
    await labResult.save();
    res.status(201).json(labResult);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get lab results for a patient
exports.getPatientLabResults = async (req, res) => {
  try {
    const results = await LabResult.find({ patient: req.params.patientId })
      .sort('-resultDate')
      .populate('labTechnician', 'name');
      
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update lab result
exports.updateLabResult = async (req, res) => {
  try {
    const labResult = await LabResult.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!labResult) {
      return res.status(404).json({ error: 'Lab result not found' });
    }
    
    res.json(labResult);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get critical results
exports.getCriticalResults = async (req, res) => {
  try {
    const results = await LabResult.find({
      $or: [
        { status: 'critical' },
        { flags: 'critical' }
      ]
    })
    .populate('patient', 'name')
    .populate('labTechnician', 'name')
    .sort('-resultDate');
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};






// const LabResult = require('../models/LabResult');
// const mongoose = require('mongoose');

// // Create lab result
// exports.createLabResult = async (req, res) => {
//   try {
//     // Validate input
//     if (!req.body || Object.keys(req.body).length === 0) {
//       return res.status(400).json({ 
//         error: 'Invalid input: Request body is empty' 
//       });
//     }

//     const labResult = new LabResult(req.body);
//     await labResult.save();
//     res.status(201).json({
//       success: true,
//       data: labResult,
//       message: 'Lab result created successfully'
//     });
//   } catch (error) {
//     console.error('Error creating lab result:', error);
//     res.status(400).json({ 
//       success: false,
//       error: error.message || 'Failed to create lab result' 
//     });
//   }
// };

// // Get lab results for a patient
// exports.getPatientLabResults = async (req, res) => {
//   try {
//     // Validate patientId
//     if (!mongoose.isValidObjectId(req.params.patientId)) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Invalid patient ID' 
//       });
//     }

//     const results = await LabResult.find({ patient: req.params.patientId })
//       .sort('-resultDate')
//       .populate('labTechnician', 'name');
      
//     res.json({
//       success: true,
//       data: results,
//       message: 'Lab results retrieved successfully'
//     });
//   } catch (error) {
//     console.error('Error fetching patient lab results:', error);
//     res.status(500).json({ 
//       success: false,
//       error: error.message || 'Failed to retrieve lab results' 
//     });
//   }
// };

// // Update lab result
// exports.updateLabResult = async (req, res) => {
//   try {
//     // Validate ID
//     if (!mongoose.isValidObjectId(req.params.id)) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Invalid lab result ID' 
//       });
//     }

//     // Validate input
//     if (!req.body || Object.keys(req.body).length === 0) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Invalid input: Request body is empty' 
//       });
//     }

//     const labResult = await LabResult.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );
    
//     if (!labResult) {
//       return res.status(404).json({ 
//         success: false,
//         error: 'Lab result not found' 
//       });
//     }
    
//     res.json({
//       success: true,
//       data: labResult,
//       message: 'Lab result updated successfully'
//     });
//   } catch (error) {
//     console.error('Error updating lab result:', error);
//     res.status(400).json({ 
//       success: false,
//       error: error.message || 'Failed to update lab result' 
//     });
//   }
// };

// // Get critical results
// exports.getCriticalResults = async (req, res) => {
//   try {
//     const results = await LabResult.find({
//       $or: [
//         { status: 'critical' },
//         { flags: 'critical' }
//       ]
//     })
//     .populate('patient', 'name')
//     .populate('labTechnician', 'name')
//     .sort('-resultDate');
    
//     res.json({
//       success: true,
//       data: results,
//       message: 'Critical lab results retrieved successfully'
//     });
//   } catch (error) {
//     console.error('Error fetching critical lab results:', error);
//     res.status(500).json({ 
//       success: false,
//       error: error.message || 'Failed to retrieve critical lab results' 
//     });
//   }
// };