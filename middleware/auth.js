const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');

function getToken(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

function unauthorized(res, msg = 'Not authorized to access this route') {
  return res.status(401).json({ success: false, message: msg });
}

exports.protect = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return unauthorized(res);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin token not valid for this route'
      });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) return unauthorized(res, 'Admin not found');
    req.admin = admin;
    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

exports.requireSuperAdmin = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return unauthorized(res);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required'
      });
    }

    const superAdmin = await SuperAdmin.findById(decoded.id);
    if (!superAdmin) return unauthorized(res, 'Super admin not found');
    req.superAdmin = superAdmin;
    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

exports.requireApprovedSchool = async (req, res, next) => {
  try {
    const admin = req.admin;
    if (!admin || !admin.schoolId) {
      return res.status(403).json({
        success: false,
        message: 'School admin access required'
      });
    }
    const School = require('../models/School');
    const school = await School.findById(admin.schoolId).select('status');
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    if (school.status !== 'Approved') {
      return res.status(403).json({
        success: false,
        message: 'Dashboard access requires an approved school',
        status: school.status
      });
    }
    req.school = school;
    next();
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: e.message
    });
  }
};
