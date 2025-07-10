// middleware/role.js

/**
 * Middleware to require a specific user role
 * @param {string} role - Required role (e.g. 'admin', 'HOSPITAL_ADMIN')
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: `Access denied: Requires ${role} role` });
    }
    next();
  };
};

/**
 * Middleware to check if Hospital Admin is authorized for a specific hospital
 * Requires: req.user.hospitals to be an array of authorized hospital IDs
 */
const isHospitalAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'HOSPITAL_ADMIN') {
    return res.status(403).json({ message: 'Access denied: Not a Hospital Admin' });
  }

  const hospitalId = req.params.hospitalId || req.body.hospital;
  if (!hospitalId || !req.user.hospitals || !req.user.hospitals.includes(hospitalId)) {
    return res.status(403).json({ message: 'Not authorized for this hospital' });
  }

  next();
};

module.exports = {
  requireRole,
  isHospitalAdmin
};
