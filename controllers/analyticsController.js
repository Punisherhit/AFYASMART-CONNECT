const Appointment = require('../models/Appointment');

exports.getDiseaseRates = async (req, res) => {
  // Sample aggregation - customize based on your data
  const diseaseRates = await Appointment.aggregate([
    { $match: { status: 'Approved' } },
    { $group: { 
      _id: '$reason', 
      count: { $sum: 1 },
      percentage: { 
        $avg: { 
          $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] 
        } 
      }
    }},
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  res.json(diseaseRates);
};