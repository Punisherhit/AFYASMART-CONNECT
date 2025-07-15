
const mongoose = require('mongoose');

const codingSchema = {
  system: String,
  code: String,
  display: String
};

const referenceSchema = {
  reference: String,
  display: String
};

const quantitySchema = {
  value: Number,
  unit: String,
  system: String,
  code: String
};

const rangeSchema = {
  low: {
    value: Number,
    unit: String
  },
  high: {
    value: Number,
    unit: String
  }
};

const observationSchema = new mongoose.Schema({
  resourceType: { type: String, default: 'Observation' },
  status: { type: String, enum: ['registered', 'preliminary', 'final', 'amended'], default: 'final' },

  category: [{
    coding: [codingSchema]
  }],
  code: {
    coding: [codingSchema]
  },
  subject: referenceSchema,
  effectiveDateTime: Date,
  issued: Date,
  performer: [referenceSchema],
  
  valueQuantity: quantitySchema,

  interpretation: [{
    coding: [codingSchema]
  }],
  
  referenceRange: [rangeSchema],

  note: [{
    authorString: String,
    time: Date,
    text: String
  }]
}, { _id: false });

module.exports = {
  fhirSchema: {
    Observation: observationSchema
  }
};
