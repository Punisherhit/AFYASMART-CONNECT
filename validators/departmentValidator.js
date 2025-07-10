const { body } = require('express-validator');

exports.validateDepartmentCreation = [
  body('name').isIn(Department.schema.path('name').enumValues),
  body('type').isIn(['CLINICAL', 'DIAGNOSTIC', 'SUPPORT']),
  body('location').optional().isString()
];