// middleware/audit.js
const auditAction = (action) => {
  return (req, res, next) => {
    const log = new AuditLog({
      userId: req.user.id,
      action,
      timestamp: new Date()
    });
    log.save(); // Store in MongoDB
    next();
  };
};