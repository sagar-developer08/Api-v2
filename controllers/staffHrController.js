const Staff = require('../models/Staff');
const Department = require('../models/Department');
const StaffRole = require('../models/StaffRole');
const StaffAttendance = require('../models/StaffAttendance');
const StaffLeave = require('../models/StaffLeave');
const StaffPayroll = require('../models/StaffPayroll');
const StaffHrSettings = require('../models/StaffHrSettings');
const StaffDocument = require('../models/StaffDocument');
const StaffQualification = require('../models/StaffQualification');
const StaffPerformanceReview = require('../models/StaffPerformanceReview');
const TrainingSession = require('../models/TrainingSession');
const TrainingRecord = require('../models/TrainingRecord');
const StaffAdvance = require('../models/StaffAdvance');
const StaffLoan = require('../models/StaffLoan');
const StaffReimbursement = require('../models/StaffReimbursement');
const mongoose = require('mongoose');

const getSchoolId = (req) => req.admin.schoolId._id || req.admin.schoolId;

const schoolAndBranchFilter = (req) => ({
  schoolId: getSchoolId(req),
  ...(req.branchFilter || {})
});

// Department/StaffRole: show school-wide (branchId null) + current branch when admin is branch-level
const departmentRoleFilter = (req) => {
  const filter = { schoolId: getSchoolId(req) };
  if (req.branchFilter && req.branchFilter.branchId) {
    filter.branchId = { $in: [null, req.branchFilter.branchId] };
  }
  return filter;
};

exports.listStaff = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department, status } = req.query;
    const filter = schoolAndBranchFilter(req);
    if (department) filter.departmentId = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { employeeId: new RegExp(search, 'i') }
      ];
    }
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const [data, total] = await Promise.all([
      Staff.find(filter).populate('departmentId', 'name').populate('roleId', 'name').skip(skip).limit(l).sort({ createdAt: -1 }).lean(),
      Staff.countDocuments(filter)
    ]);
    res.json({
      success: true,
      data: { data, total, page: parseInt(page, 10) || 1, limit: l, totalPages: Math.ceil(total / l) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing staff', error: error.message });
  }
};

exports.getStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, ...schoolAndBranchFilter(req) }).populate('departmentId').populate('roleId').lean();
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching staff', error: error.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    if (!req.body.branchId) {
      return res.status(400).json({ success: false, message: 'branchId is required' });
    }
    if (req.branchFilter && req.branchFilter.branchId && req.branchFilter.branchId.toString() !== req.body.branchId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only create staff in your branch' });
    }
    const staff = await Staff.create({ ...req.body, schoolId: getSchoolId(req) });
    res.status(201).json({ success: true, data: staff, message: 'Staff created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating staff', error: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findOneAndUpdate({ _id: req.params.id, ...schoolAndBranchFilter(req) }, req.body, { new: true });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, data: staff, message: 'Staff updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating staff', error: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findOneAndDelete({ _id: req.params.id, ...schoolAndBranchFilter(req) });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, message: 'Staff deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting staff', error: error.message });
  }
};

exports.listDepartments = async (req, res) => {
  try {
    const filter = departmentRoleFilter(req);
    const data = await Department.find(filter).populate('branchId', 'name city isMain').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing departments', error: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const sid = getSchoolId(req);
    const branchId = req.body.branchId !== undefined ? req.body.branchId : null;
    if (req.branchFilter && req.branchFilter.branchId && branchId && branchId.toString() !== req.branchFilter.branchId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only create departments in your branch or school-wide (null)' });
    }
    const dept = await Department.create({ ...req.body, schoolId: sid, branchId: branchId || undefined });
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating department', error: error.message });
  }
};

exports.listRoles = async (req, res) => {
  try {
    const filter = departmentRoleFilter(req);
    const data = await StaffRole.find(filter).populate('departmentId', 'name').populate('branchId', 'name city isMain').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing roles', error: error.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const sid = getSchoolId(req);
    const branchId = req.body.branchId !== undefined ? req.body.branchId : null;
    if (req.branchFilter && req.branchFilter.branchId && branchId && branchId.toString() !== req.branchFilter.branchId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only create roles in your branch or school-wide (null)' });
    }
    const role = await StaffRole.create({ ...req.body, schoolId: sid, branchId: branchId || undefined });
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating role', error: error.message });
  }
};

exports.markStaffAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { staffId, date, status, checkInTime, checkOutTime, shift } = req.body;
    const att = await StaffAttendance.findOneAndUpdate(
      { schoolId, staffId, date: new Date(date) },
      { status: status || 'present', checkInTime, checkOutTime, shift },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, data: att });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking attendance', error: error.message });
  }
};

exports.getStaffAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { fromDate, toDate, staffId, department } = req.query;
    const filter = { schoolId };
    if (staffId) filter.staffId = staffId;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    const data = await StaffAttendance.find(filter).populate('staffId', 'firstName lastName employeeId').sort({ date: -1 }).limit(200).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
  }
};

exports.getStaffAttendanceStatistics = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { fromDate, toDate } = req.query;
    const filter = { schoolId };
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    const total = await StaffAttendance.countDocuments(filter);
    const present = await StaffAttendance.countDocuments({ ...filter, status: 'present' });
    res.json({ success: true, data: { total, present, absent: total - present } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
  }
};

exports.requestStaffLeave = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const leave = await StaffLeave.create({ ...req.body, schoolId, status: 'pending' });
    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating leave request', error: error.message });
  }
};

exports.getStaffLeaveRequests = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { status, staffId, fromDate, toDate } = req.query;
    const filter = { schoolId };
    if (status) filter.status = status;
    if (staffId) filter.staffId = staffId;
    if (fromDate || toDate) {
      filter.fromDate = {};
      if (fromDate) filter.fromDate.$gte = new Date(fromDate);
      if (toDate) filter.toDate = { ...(filter.toDate || {}), $lte: new Date(toDate) };
    }
    const data = await StaffLeave.find(filter).populate('staffId', 'firstName lastName').sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leave requests', error: error.message });
  }
};

exports.updateStaffLeaveStatus = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { status, remarks } = req.body;
    const leave = await StaffLeave.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { status, remarks, reviewedBy: req.admin._id },
      { new: true }
    );
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
    res.json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating leave status', error: error.message });
  }
};

exports.getStaffLeaveBalance = async (req, res) => {
  try {
    res.json({ success: true, data: { staffId: req.query.staffId, balance: {} } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leave balance', error: error.message });
  }
};

exports.getStaffPayroll = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { month, year, staffId, department } = req.query;
    const filter = { schoolId };
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year, 10);
    if (staffId) filter.staffId = staffId;
    const data = await StaffPayroll.find(filter).populate('staffId', 'firstName lastName employeeId').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching payroll', error: error.message });
  }
};

exports.generateStaffPayroll = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { month, year, staffIds } = req.body;
    const staffList = staffIds && staffIds.length ? await Staff.find({ ...schoolAndBranchFilter(req), _id: { $in: staffIds } }).select('_id') : await Staff.find(schoolAndBranchFilter(req)).select('_id');
    const created = [];
    for (const s of staffList) {
      const existing = await StaffPayroll.findOne({ schoolId, staffId: s._id, month, year });
      if (!existing) {
        const pr = await StaffPayroll.create({ schoolId, staffId: s._id, month, year, status: 'draft' });
        created.push(pr);
      }
    }
    res.status(201).json({ success: true, data: created, message: 'Payroll generated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating payroll', error: error.message });
  }
};

exports.getStaffPayrollById = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const payroll = await StaffPayroll.findOne({ _id: req.params.id, schoolId }).populate('staffId').lean();
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
    res.json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching payroll', error: error.message });
  }
};

exports.updateStaffPayroll = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const payroll = await StaffPayroll.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
    res.json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating payroll', error: error.message });
  }
};

exports.getStaffSettings = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    let settings = await StaffHrSettings.findOne({ schoolId }).lean();
    if (!settings) settings = await StaffHrSettings.create({ schoolId }).then(s => s.toObject());
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
  }
};

exports.updateStaffSettings = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const settings = await StaffHrSettings.findOneAndUpdate({ schoolId }, { $set: req.body }, { new: true, upsert: true }).lean();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating settings', error: error.message });
  }
};

// ---------- Staff Documents ----------
exports.getStaffDocuments = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await StaffDocument.find({ schoolId, staffId: req.params.id }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching documents', error: error.message });
  }
};

exports.uploadStaffDocument = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const doc = await StaffDocument.create({ ...req.body, schoolId, staffId: req.params.id, fileUrl: req.body.fileUrl || '/uploads/placeholder.pdf', uploadedBy: req.admin._id });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
  }
};

// ---------- Staff Qualifications ----------
exports.getStaffQualifications = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await StaffQualification.find({ schoolId, staffId: req.params.id }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching qualifications', error: error.message });
  }
};

exports.addStaffQualification = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const qual = await StaffQualification.create({ ...req.body, schoolId, staffId: req.params.id });
    res.status(201).json({ success: true, data: qual });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding qualification', error: error.message });
  }
};

// ---------- Staff Bulk Import ----------
exports.bulkImportStaff = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { staffList } = req.body;
    if (!Array.isArray(staffList) || staffList.length === 0) {
      return res.status(400).json({ success: false, message: 'staffList array required' });
    }
    const created = [];
    for (const s of staffList) {
      const staff = await Staff.create({ ...s, schoolId: getSchoolId(req), branchId: s.branchId });
      created.push(staff);
    }
    res.status(201).json({ success: true, data: created, message: `${created.length} staff imported` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error importing staff', error: error.message });
  }
};

// ---------- Attendance Reports ----------
exports.getAttendanceReports = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { type, fromDate, toDate } = req.query;
    const filter = { schoolId };
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    const data = await StaffAttendance.find(filter).populate('staffId', 'firstName lastName employeeId departmentId').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance reports', error: error.message });
  }
};

// ---------- Performance Reviews ----------
exports.getPerformanceReviews = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.params.id && !req.path.includes('/performance/reviews')) filter.staffId = req.params.id;
    const data = await StaffPerformanceReview.find(filter).populate('staffId', 'firstName lastName').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reviews', error: error.message });
  }
};

exports.createPerformanceReview = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const review = await StaffPerformanceReview.create({ ...req.body, schoolId, reviewedBy: req.admin._id });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating review', error: error.message });
  }
};

exports.getStaffAppraisals = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.params.id) filter.staffId = req.params.id;
    const data = await StaffPerformanceReview.find(filter).populate('staffId', 'firstName lastName').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching appraisals', error: error.message });
  }
};

// ---------- Training ----------
exports.listTrainingSessions = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.status) filter.status = req.query.status;
    const data = await TrainingSession.find(filter).sort({ date: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing sessions', error: error.message });
  }
};

exports.createTrainingSession = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const session = await TrainingSession.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating session', error: error.message });
  }
};

exports.getTrainingRecords = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.params.sessionId) filter.sessionId = req.params.sessionId;
    if (req.params.staffId) filter.staffId = req.params.staffId;
    const data = await TrainingRecord.find(filter).populate('staffId sessionId').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching records', error: error.message });
  }
};

exports.markTrainingAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { sessionId, staffId, attended } = req.body;
    const record = await TrainingRecord.findOneAndUpdate(
      { schoolId, sessionId, staffId },
      { attended: attended !== false },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking attendance', error: error.message });
  }
};

// ---------- Finance (Advances, Loans, Reimbursements) ----------
exports.getStaffAdvances = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.staffId || req.params.id) filter.staffId = req.query.staffId || req.params.id;
    const data = await StaffAdvance.find(filter).populate('staffId', 'firstName lastName').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching advances', error: error.message });
  }
};

exports.createStaffAdvance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const advance = await StaffAdvance.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: advance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating advance', error: error.message });
  }
};

exports.getStaffLoans = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.staffId || req.params.id) filter.staffId = req.query.staffId || req.params.id;
    const data = await StaffLoan.find(filter).populate('staffId', 'firstName lastName').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching loans', error: error.message });
  }
};

exports.createStaffLoan = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const loan = await StaffLoan.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating loan', error: error.message });
  }
};

exports.getStaffReimbursements = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.staffId || req.params.id) filter.staffId = req.query.staffId || req.params.id;
    const data = await StaffReimbursement.find(filter).populate('staffId', 'firstName lastName').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reimbursements', error: error.message });
  }
};

exports.createStaffReimbursement = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const reimb = await StaffReimbursement.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: reimb });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating reimbursement', error: error.message });
  }
};
