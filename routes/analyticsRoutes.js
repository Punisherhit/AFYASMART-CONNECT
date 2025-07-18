const express = require('express');
// const protect = require('../middleware/auth');
const Analytics = require('../models/Analytics');
const Appointment = require('../models/Appointment'); // Still needed if other parts of aiService or Analytics model rely on it
const aiService = require('../services/aiService'); // New import for AI service
const { protect } = require('../middleware/adminAuth');

const router = express.Router();

/**
 * @route GET /api/analytics/no-show-predictions
 * @desc Generate and retrieve no-show predictions using AI service
 * @access Private (requires authentication)
 */
router.get('/no-show-predictions', protect, async (req, res) => {
  try {
    // Use the AI service to get no-show predictions
    const predictions = await aiService.predictNoShows();

    // Save the predictions to the analytics database for historical tracking
    const analyticsRecord = new Analytics({
      type: 'no_show_prediction',
      data: predictions,
      insights: 'Identified high-risk appointments for proactive intervention' // Insight can be generated by AI too
    });
    await analyticsRecord.save();

    // Respond with the generated predictions
    res.json(predictions);
  } catch (err) {
    // Handle any errors during prediction generation or saving
    console.error('Error generating no-show predictions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/analytics/disease-outbreak
 * @desc Get simulated disease outbreak predictions
 * @access Private (requires authentication)
 */
router.get('/disease-outbreak', protect, async (req, res) => {
  try {
    // Simulated outbreak prediction (as per original logic, can be updated to use aiService in future)
    const outbreaks = [
      { disease: 'Malaria', riskLevel: 'High', cases: 120, trend: 'Increasing' },
      { disease: 'Cholera', riskLevel: 'Medium', cases: 35, trend: 'Stable' },
      { disease: 'COVID-19', riskLevel: 'Low', cases: 5, trend: 'Decreasing' }
    ];

    // Save the simulated outbreak data to the analytics database
    const analyticsRecord = new Analytics({
      type: 'disease_outbreak',
      data: outbreaks,
      insights: 'Malaria outbreak predicted based on seasonal patterns' // Example insight
    });
    await analyticsRecord.save();

    // Respond with the outbreak data
    res.json(outbreaks);
  } catch (err) {
    // Handle any errors during fetching/saving outbreak data
    console.error('Error fetching disease outbreak predictions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route GET /api/analytics/resource-optimization
 * @desc Optimize healthcare resource allocation using AI service
 * @access Private (requires authentication)
 */
router.get('/resource-optimization', protect, async (req, res) => {
  try {
    // Use the AI service to get resource optimization recommendations
    const optimization = await aiService.optimizeResources();

    // Save the optimization results to the analytics database
    const analyticsRecord = new Analytics({
      type: 'resource_utilization',
      data: optimization,
      insights: 'Resource allocation recommendations based on predicted demand' // Example insight
    });
    await analyticsRecord.save();

    // Respond with the optimization results
    res.json(optimization);
  } catch (err) {
    // Handle any errors during resource optimization or saving
    console.error('Error optimizing resources:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
