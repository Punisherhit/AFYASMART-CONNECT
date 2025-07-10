const LabResult = require('../models/LabResult');

// Convert FHIR Observation to LabResult
exports.fhirToLabResult = (fhirObservation) => {
  try {
    // Extract relevant data from FHIR Observation
    const values = [];
    
    if (fhirObservation.component) {
      fhirObservation.component.forEach(comp => {
        if (comp.code && comp.code.coding && comp.code.coding[0]) {
          values.push({
            name: comp.code.coding[0].display || comp.code.text,
            value: comp.valueQuantity ? comp.valueQuantity.value : comp.valueString,
            unit: comp.valueQuantity ? comp.valueQuantity.unit : '',
            normalRange: comp.referenceRange ? 
              `${comp.referenceRange[0].low.value}-${comp.referenceRange[0].high.value} ${comp.valueQuantity.unit}` : ''
          });
        }
      });
    }
    
    // Create LabResult document
    return new LabResult({
      testType: mapFhirCategoryToTestType(fhirObservation.category),
      testName: fhirObservation.code.text || 'Lab Test',
      status: mapFhirStatus(fhirObservation.status),
      values,
      flags: detectAbnormalFlags(values)
    });
  } catch (error) {
    console.error('FHIR parsing error:', error);
    throw new Error('Failed to parse FHIR data');
  }
};

// Helper function to map FHIR status to our status
function mapFhirStatus(fhirStatus) {
  const statusMap = {
    'final': 'completed',
    'amended': 'completed',
    'preliminary': 'pending',
    'cancelled': 'cancelled',
    'entered-in-error': 'cancelled'
  };
  return statusMap[fhirStatus] || 'pending';
}

// Helper function to map FHIR category to test type
function mapFhirCategoryToTestType(categories) {
  if (!categories || !categories[0]) return 'other';
  
  const categoryCode = categories[0].coding[0].code;
  const categoryMap = {
    'laboratory': 'blood-test',
    'imaging': 'x-ray',
    'pathology': 'biopsy'
  };
  
  return categoryMap[categoryCode] || 'other';
}

// Detect abnormal flags in values
function detectAbnormalFlags(values) {
  const flags = [];
  
  values.forEach(value => {
    if (value.interpretation === 'H') flags.push('high');
    if (value.interpretation === 'L') flags.push('low');
    if (value.interpretation === 'A') flags.push('abnormal');
    if (value.interpretation === 'C') flags.push('critical');
  });
  
  return flags;
}