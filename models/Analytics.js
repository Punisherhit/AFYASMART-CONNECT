const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  type: { 
    type: String,
    enum: ['no_show_prediction', 'disease_outbreak', 'resource_utilization'],
    required: true
  },
  date: { type: Date, default: Date.now },
  data: mongoose.Schema.Types.Mixed, // Flexible structure for different analytics
  insights: String,
  confidenceScore: Number
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);