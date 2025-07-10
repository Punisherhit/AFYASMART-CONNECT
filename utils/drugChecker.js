const axios = require('axios');

// REAL API Integration (using RxNav API)
module.exports.checkDrugInteractions = async (medications) => {
  try {
    // 1. Convert med names to RxCUI codes
    const rxcuiPromises = medications.map(med => 
      axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(med.name)}`)
    );
    
    const rxcuiResponses = await Promise.all(rxcuiPromises);
    const rxcuis = rxcuiResponses.map(res => 
      res.data.idGroup?.rxnormId?.[0] || null
    ).filter(Boolean);

    // 2. Check interactions
    if (rxcuis.length < 2) return [];
    
    const interactionRes = await axios.get(
      `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join('+')}`
    );
    
    // 3. Parse warnings
    return interactionRes.data?.fullInteractionTypeGroup?.[0]?.fullInteractionType?.flatMap(interaction => 
      interaction.interactionPair.map(pair => ({
        severity: pair.severity,
        description: pair.description,
        drugs: interaction.minConcept.map(d => d.name)
      }))
    ) || [];
    
  } catch (error) {
    console.error('Drug API Error:', error);
    return []; // Fail safe
  }
};

// Fallback to OpenFDA if needed
module.exports.checkOpenFDAInteractions = async (medications) => {
  // ... (previous implementation)
};