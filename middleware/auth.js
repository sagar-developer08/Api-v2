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

    const admin = await Admin.findById(decoded.id).populate('branchId', 'name city isMain');
    if (!admin) return unauthorized(res, 'Admin not found');
    req.admin = admin;
    // Set branch filter: null branchId = school-level admin (sees all branches), set branchId = branch-level admin
    req.branchFilter = admin.branchId ? { branchId: admin.branchId._id } : {};
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
    // Ensure branchFilter is set (from protect middleware)
    if (!req.branchFilter) {
      req.branchFilter = admin.branchId ? { branchId: admin.branchId._id } : {};
    }
    next();
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: e.message
    });
  }
};

// Helper middleware to add branch filter to query
exports.addBranchFilter = (req, res, next) => {
  // This middleware adds branchFilter to req.query for easy filtering
  // Controllers can use: { ...req.branchFilter, ...otherFilters }
  if (req.branchFilter && Object.keys(req.branchFilter).length > 0) {
    req.queryFilter = { ...req.queryFilter, ...req.branchFilter };
  }
  next();
};

exports.protectStudent = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return unauthorized(res);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Student access required'
      });
    }

    const Student = require('../models/Student');
    const student = await Student.findById(decoded.id)
      .populate('schoolId', 'schoolName schoolCode status')
      .populate('branchId', 'name city isMain');
    if (!student) return unauthorized(res, 'Student not found');

    if (student.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Student account is not active',
        status: student.status
      });
    }

    req.student = student;
    req.branchFilter = { branchId: student.branchId._id };
    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

exports.protectTeacher = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return unauthorized(res);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Teacher access required'
      });
    }

    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findById(decoded.id)
      .populate('schoolId', 'schoolName schoolCode status')
      .populate('branchId', 'name city isMain');
    if (!teacher) return unauthorized(res, 'Teacher not found');

    if (teacher.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Teacher account is not active',
        status: teacher.status
      });
    }

    req.teacher = teacher;
    req.branchFilter = { branchId: teacher.branchId._id };
    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

exports.protectParent = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return unauthorized(res);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Parent access required'
      });
    }

    const Parent = require('../models/Parent');
    const parent = await Parent.findById(decoded.id).populate('schoolId', 'schoolName schoolCode status');
    if (!parent) return unauthorized(res, 'Parent not found');

    if (!parent.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Parent account is not active'
      });
    }

    req.parent = parent;
    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};
