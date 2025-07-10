const DrugChecker = require('../services/DrugChecker'); // Hypothetical service

const checkInteractions = async (req, res, next) => {
  const conflicts = await DrugChecker.check(req.body.meds);
  if (conflicts.length > 0) {
    return res.status(400).json({ 
      warning: "Drug interactions detected!", 
      conflicts 
    });
  }
  next();
};

module.exports = checkInteractions;