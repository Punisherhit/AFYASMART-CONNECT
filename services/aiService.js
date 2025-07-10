const Appointment = require('../models/Appointment');
const Analytics = require('../models/Analytics');

class AIService {
  // Predict no-shows using simple heuristic (real implementation would use ML)
  async predictNoShows() {
    const appointments = await Appointment.find({ 
      date: { $gte: new Date() },
      status: 'scheduled'
    }).populate('patientId');
    
    return appointments.map(appt => {
      // Heuristic: Higher risk for patients with previous no-shows
      const prevNoShows = appt.patientId.stats?.noShows || 0;
      const baseRisk = 0.1 + (prevNoShows * 0.15);
      const noShowProbability = Math.min(0.8, baseRisk + (Math.random() * 0.1));
      
      return {
        appointmentId: appt._id,
        patientId: appt.patientId._id,
        patientName: appt.patientId.name,
        appointmentDate: appt.date,
        noShowProbability,
        riskLevel: noShowProbability > 0.4 ? 'High' : noShowProbability > 0.2 ? 'Medium' : 'Low'
      };
    });
  }

  // Predict disease outbreaks (simulated)
  async predictDiseaseOutbreaks() {
    // In a real system, this would analyze EHR data
    return [
      { disease: 'Malaria', riskLevel: 'High', cases: 120, trend: 'Increasing' },
      { disease: 'Cholera', riskLevel: 'Medium', cases: 35, trend: 'Stable' },
      { disease: 'COVID-19', riskLevel: 'Low', cases: 5, trend: 'Decreasing' }
    ];
  }

  // Optimize resource allocation
  async optimizeResources() {
    // This would analyze historical data and current bookings
    return {
      bedUtilization: {
        current: 75,
        optimal: 85,
        recommendation: 'Adjust ICU bed allocation'
      },
      staffAllocation: {
        current: '2 doctors, 5 nurses',
        recommended: '3 doctors, 4 nurses',
        reason: 'Higher patient volume in morning shift'
      }
    };
  }
}

module.exports = new AIService();