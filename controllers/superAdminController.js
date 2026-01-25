const School = require('../models/School');
const SuperAdmin = require('../models/SuperAdmin');
const AcademicYear = require('../models/AcademicYear');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Branch = require('../models/Branch');
const ApprovalLog = require('../models/ApprovalLog');
const generateToken = require('../utils/generateToken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const superAdmin = await SuperAdmin.findOne({ email: (email || '').toLowerCase().trim() })
      .select('+password');
    if (!superAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    const valid = await superAdmin.comparePassword(password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    const token = generateToken(superAdmin._id, 'superadmin');
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        superAdmin: {
          id: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

exports.listSchools = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const schools = await School.find(filter)
      .select('schoolName schoolCode status setupWizardStep setupLocked createdAt')
      .populate('adminId', 'fullName email mobileNumber')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({
      success: true,
      data: schools
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error listing schools',
      error: error.message
    });
  }
};

exports.getSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId)
      .populate('adminId', 'fullName email mobileNumber')
      .lean();
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    const [academicYears, classes, sections, branches, approvalLogs] = await Promise.all([
      AcademicYear.find({ schoolId: school._id }).lean(),
      Class.find({ schoolId: school._id }).sort({ order: 1 }).lean(),
      Section.find({ schoolId: school._id }).lean(),
      Branch.find({ schoolId: school._id }).lean(),
      ApprovalLog.find({ schoolId: school._id })
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean()
    ]);
    res.status(200).json({
      success: true,
      data: {
        ...school,
        academicYears,
        classes,
        sections,
        branches,
        approvalLogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching school',
      error: error.message
    });
  }
};

exports.approve = async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    if (school.status !== 'Pending Admin Approval') {
      return res.status(400).json({
        success: false,
        message: `School is not pending approval (current status: ${school.status})`
      });
    }
    school.status = 'Approved';
    await school.save();
    await ApprovalLog.create({
      schoolId: school._id,
      action: 'approved',
      performedBy: req.superAdmin._id,
      remarks: req.body.remarks || undefined
    });
    res.status(200).json({
      success: true,
      message: 'School approved',
      data: { schoolId: school._id, status: school.status }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving school',
      error: error.message
    });
  }
};

exports.reject = async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    if (school.status !== 'Pending Admin Approval') {
      return res.status(400).json({
        success: false,
        message: `School is not pending approval (current status: ${school.status})`
      });
    }
    school.status = 'Rejected';
    await school.save();
    await ApprovalLog.create({
      schoolId: school._id,
      action: 'rejected',
      performedBy: req.superAdmin._id,
      remarks: req.body.remarks || undefined
    });
    res.status(200).json({
      success: true,
      message: 'School rejected',
      data: { schoolId: school._id, status: school.status }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting school',
      error: error.message
    });
  }
};
