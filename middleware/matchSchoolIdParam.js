const mongoose = require('mongoose');

/**
 * Ensures :schoolId matches the authenticated admin's school (tenant isolation).
 */
module.exports = function matchSchoolIdParam(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.schoolId)) {
    return res.status(400).json({ success: false, message: 'Invalid school id' });
  }
  const admin = req.admin;
  if (!admin || !admin.schoolId) {
    return res.status(403).json({ success: false, message: 'School admin access required' });
  }
  const adminSid = (admin.schoolId._id || admin.schoolId).toString();
  if (req.params.schoolId !== adminSid) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};
