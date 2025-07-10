const axios = require('axios'); // For API calls (if using external drug DB)

class DrugChecker {
  static async check(meds) {
    // Example: Check against hardcoded interactions (replace with real API/Database)
    const INTERACTION_DB = [
      { med1: "warfarin", med2: "ibuprofen", risk: "Bleeding" },
      { med1: "simvastatin", med2: "clarithromycin", risk: "Muscle damage" }
    ];

    const conflicts = [];
    for (let i = 0; i < meds.length; i++) {
      for (let j = i + 1; j < meds.length; j++) {
        const conflict = INTERACTION_DB.find(
          item => (item.med1 === meds[i] && item.med2 === meds[j]) || 
                 (item.med1 === meds[j] && item.med2 === meds[i])
        );
        if (conflict) conflicts.push(conflict);
      }
    }
    return conflicts;
  }
}

module.exports = DrugChecker;