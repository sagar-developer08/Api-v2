const School = require('../models/School');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');
const AcademicYear = require('../models/AcademicYear');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Branch = require('../models/Branch');
const ApprovalLog = require('../models/ApprovalLog');
const FeatureConfig = require('../models/FeatureConfig');
const PlatformSettings = require('../models/PlatformSettings');
const PlatformAuditLog = require('../models/PlatformAuditLog');
const MaintenanceMode = require('../models/MaintenanceMode');
const TenantNote = require('../models/TenantNote');
const ImpersonationSession = require('../models/ImpersonationSession');
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
    const { page = 1, limit = 10, search = '', status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { schoolName: new RegExp(search, 'i') },
        { schoolCode: new RegExp(search, 'i') }
      ];
    }
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const [schools, total] = await Promise.all([
      School.find(filter)
        .select('schoolName schoolCode status setupWizardStep setupLocked isSetup createdAt')
        .populate('adminId', 'fullName email mobileNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l)
        .lean(),
      School.countDocuments(filter)
    ]);
    res.status(200).json({
      success: true,
      data: {
        data: schools,
        total,
        page: parseInt(page, 10) || 1,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
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

exports.createSchool = async (req, res) => {
  try {
    const { schoolName, schoolCode, adminEmail, adminName } = req.body;
    if (!schoolName || !schoolCode) {
      return res.status(400).json({ success: false, message: 'schoolName and schoolCode required' });
    }
    const existing = await School.findOne({ schoolCode: (schoolCode || '').toUpperCase().trim() });
    if (existing) return res.status(400).json({ success: false, message: 'School code already exists' });
    const school = await School.create({
      schoolName: schoolName.trim(),
      schoolCode: (schoolCode || '').toUpperCase().trim(),
      status: 'Pending Setup'
    });
    if (adminEmail) {
      const admin = await Admin.findOne({ email: adminEmail.toLowerCase().trim() });
      if (admin) {
        admin.schoolId = school._id;
        await admin.save();
        school.adminId = admin._id;
        await school.save();
      }
    }
    res.status(201).json({ success: true, data: school, message: 'School created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating school', error: error.message });
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

exports.getDashboard = async (req, res) => {
  try {
    const [totalTenants, activeTenants, pendingApprovals, adminCount, recentApprovals] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ status: 'Approved' }),
      School.countDocuments({ status: 'Pending Admin Approval' }),
      Admin.countDocuments(),
      ApprovalLog.find().populate('schoolId', 'schoolName schoolCode').populate('performedBy', 'name email').sort({ createdAt: -1 }).limit(10).lean()
    ]);
    res.status(200).json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        pendingApprovals,
        totalUsers: adminCount,
        platformHealth: 'healthy',
        recentActivity: recentApprovals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message
    });
  }
};

exports.updateSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    const allowed = ['schoolName', 'schoolType', 'boardAffiliation', 'primaryEmail', 'secondaryEmail', 'primaryPhone', 'secondaryPhone', 'website', 'address', 'country', 'state', 'city', 'timezone', 'principal', 'adminOfficer', 'totalStudentCapacity', 'currentAcademicYear', 'schoolStartTime', 'schoolEndTime', 'periodDuration', 'lunchStartTime', 'lunchEndTime', 'minAttendancePercentage', 'policies', 'schoolMotto', 'taxId', 'gstNumber', 'bankDetails', 'status'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    Object.assign(school, updates);
    await school.save();
    const updated = await School.findById(school._id).populate('adminId', 'fullName email mobileNumber').lean();
    res.status(200).json({ success: true, message: 'School updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating school', error: error.message });
  }
};

exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    await School.findByIdAndDelete(req.params.schoolId);
    res.status(200).json({ success: true, message: 'School deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting school', error: error.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role, tenantId } = req.query;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const filter = {};
    if (tenantId) filter.schoolId = tenantId;
    if (search) {
      filter.$or = [
        { fullName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { mobileNumber: new RegExp(search, 'i') }
      ];
    }
    const [users, total] = await Promise.all([
      Admin.find(filter).select('-password').populate('schoolId', 'schoolName schoolCode').skip(skip).limit(l).sort({ createdAt: -1 }).lean(),
      Admin.countDocuments(filter)
    ]);
    res.status(200).json({
      success: true,
      data: {
        data: users,
        total,
        page: parseInt(page, 10) || 1,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing users', error: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await Admin.findById(req.params.id).select('-password').populate('schoolId', 'schoolName schoolCode');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { fullName, email, mobileNumber, password, schoolId } = req.body;
    if (!fullName || !email || !mobileNumber || !password || !schoolId) {
      return res.status(400).json({ success: false, message: 'fullName, email, mobileNumber, password and schoolId are required' });
    }
    const existing = await Admin.findOne({ $or: [{ email: email.toLowerCase() }, { mobileNumber }] });
    if (existing) return res.status(400).json({ success: false, message: 'Email or mobile already registered' });
    const user = await Admin.create({
      fullName,
      email: email.toLowerCase().trim(),
      mobileNumber: String(mobileNumber).trim(),
      password,
      schoolId
    });
    res.status(201).json({ success: true, data: await Admin.findById(user._id).select('-password').populate('schoolId', 'schoolName schoolCode'), message: 'User created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const allowed = ['fullName', 'mobileNumber', 'isActive'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await Admin.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password').populate('schoolId', 'schoolName schoolCode');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user, message: 'User updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await Admin.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user', error: error.message });
  }
};

exports.getFeatureConfig = async (req, res) => {
  try {
    let config = await FeatureConfig.findOne({ tenantId: req.params.tenantId }).lean();
    if (!config) {
      await FeatureConfig.create({
        tenantId: req.params.tenantId,
        features: { attendance: true, homework: true, timetable: true, notices: true, fees: true, exams: true, transport: true, lms: true }
      });
      config = await FeatureConfig.findOne({ tenantId: req.params.tenantId }).lean();
    }
    res.status(200).json({ success: true, data: config.features || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching feature config', error: error.message });
  }
};

exports.updateFeatureConfig = async (req, res) => {
  try {
    const config = await FeatureConfig.findOneAndUpdate(
      { tenantId: req.params.tenantId },
      { $set: { features: req.body } },
      { new: true, upsert: true }
    ).lean();
    res.status(200).json({ success: true, data: config.features || {}, message: 'Feature config updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating feature config', error: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSingleton();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.updateSingleton(req.body);
    res.status(200).json({ success: true, data: settings, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating settings', error: error.message });
  }
};

// Platform Operations
exports.getPlatformOpsJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const data = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching jobs', error: error.message });
  }
};

exports.retryPlatformJob = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Job retry requested' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrying job', error: error.message });
  }
};

exports.getPlatformOpsQueues = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching queues', error: error.message });
  }
};

exports.getPlatformOpsCronJobs = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching cron jobs', error: error.message });
  }
};

exports.getMaintenance = async (req, res) => {
  try {
    const modes = await MaintenanceMode.find({ enabled: true }).populate('tenantId', 'schoolName schoolCode').lean();
    res.status(200).json({ success: true, data: modes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching maintenance', error: error.message });
  }
};

exports.setMaintenance = async (req, res) => {
  try {
    const { tenantId, enabled, message } = req.body;
    const mode = await MaintenanceMode.findOneAndUpdate(
      { tenantId: tenantId || null },
      { enabled: !!enabled, message: message || '' },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, data: mode, message: 'Maintenance mode updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error setting maintenance', error: error.message });
  }
};

// Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, action, userId, tenantId, fromDate, toDate } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (tenantId) filter.tenantId = tenantId;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }
    const skip = (parseInt(page, 10) - 1) * Math.min(100, parseInt(limit, 10) || 10);
    const l = Math.min(100, parseInt(limit, 10) || 10);
    const [data, total] = await Promise.all([
      PlatformAuditLog.find(filter).populate('tenantId', 'schoolName schoolCode').sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      PlatformAuditLog.countDocuments(filter)
    ]);
    res.status(200).json({ success: true, data: { data, total, page: parseInt(page, 10) || 1, limit: l, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching audit logs', error: error.message });
  }
};

// Support
exports.getSupportHealth = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching health', error: error.message });
  }
};

exports.getSupportIssues = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    res.status(200).json({ success: true, data: { data: [], total: 0, page: 1, limit: 10, totalPages: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching issues', error: error.message });
  }
};

exports.getSupportNotes = async (req, res) => {
  try {
    const notes = await TenantNote.find({ tenantId: req.params.tenantId }).populate('createdBy', 'name email').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notes', error: error.message });
  }
};

exports.createSupportNote = async (req, res) => {
  try {
    const { tenantId, note, type } = req.body;
    const doc = await TenantNote.create({ tenantId, note, type: type || 'general', createdBy: req.superAdmin._id });
    res.status(201).json({ success: true, data: doc, message: 'Note created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating note', error: error.message });
  }
};

exports.getImpersonations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 10);
    const l = Math.min(100, parseInt(limit, 10) || 10);
    const [data, total] = await Promise.all([
      ImpersonationSession.find({ superAdminId: req.superAdmin._id }).sort({ startedAt: -1 }).skip(skip).limit(l).lean(),
      ImpersonationSession.countDocuments({ superAdminId: req.superAdmin._id })
    ]);
    res.status(200).json({ success: true, data: { data, total, page: parseInt(page, 10) || 1, limit: l, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching impersonations', error: error.message });
  }
};

exports.startImpersonation = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const session = await ImpersonationSession.create({
      superAdminId: req.superAdmin._id,
      userId,
      reason: reason || '',
      userRole: 'admin'
    });
    const token = generateToken(userId, 'admin');
    res.status(201).json({ success: true, data: { session, token }, message: 'Impersonation started' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error starting impersonation', error: error.message });
  }
};
