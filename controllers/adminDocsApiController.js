/**
 * APIs aligned with docs/admin-*-api-requirements.md (calendar, academic years, RBAC,
 * finance aliases, reports catalog, dashboard extras, exam helpers, timetable periods).
 */
const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const AcademicYear = require('../models/AcademicYear');
const CalendarEvent = require('../models/CalendarEvent');
const PeriodTemplate = require('../models/PeriodTemplate');
const Timetable = require('../models/Timetable');
const RbacRole = require('../models/RbacRole');
const RbacRoleAssignment = require('../models/RbacRoleAssignment');
const Staff = require('../models/Staff');
const GradeScale = require('../models/GradeScale');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');
const FeeHead = require('../models/FeeHead');
const FeeStructureRow = require('../models/FeeStructureRow');
const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const StaffReimbursement = require('../models/StaffReimbursement');
const ExpenseEntry = require('../models/ExpenseEntry');
const ReportJob = require('../models/ReportJob');
const StudentAttendance = require('../models/StudentAttendance');
const Teacher = require('../models/Teacher');
const Notice = require('../models/Notice');
const Admin = require('../models/Admin');

const getSchoolId = (req) => req.admin.schoolId._id || req.admin.schoolId;

async function resolveBranchId(schoolId) {
  let b = await Branch.findOne({ schoolId }).sort({ isMain: -1 });
  if (!b) {
    b = await Branch.create({ schoolId, name: 'Main', isMain: true });
  }
  return b._id;
}

function mapAcademicYearDoc(doc) {
  if (!doc) return null;
  const o = doc._id ? doc.toObject ? doc.toObject() : doc : doc;
  return {
    id: String(o._id),
    name: o.name || o.label,
    startDate: o.startDate ? new Date(o.startDate).toISOString().slice(0, 10) : null,
    endDate: o.endDate ? new Date(o.endDate).toISOString().slice(0, 10) : null,
    status: o.status === 'Inactive' ? 'Closed' : o.status,
    isCurrent: !!(o.isCurrent || o.isDefault)
  };
}

// ---------- Academic years ----------
exports.listAcademicYears = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { status } = req.query;
    const filter = { schoolId };
    if (status) filter.status = status;
    const rows = await AcademicYear.find(filter).sort({ startYear: -1 }).lean();
    res.json({ success: true, data: rows.map(mapAcademicYearDoc) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getAcademicYear = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const row = await AcademicYear.findOne({ _id: req.params.id, schoolId }).lean();
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: mapAcademicYearDoc(row) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createAcademicYear = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { name, startDate, endDate, status, startYear, endYear } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'name, startDate, endDate required' });
    }
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (ed <= sd) return res.status(400).json({ success: false, message: 'endDate must be after startDate' });
    const sy = startYear || sd.getFullYear();
    const ey = endYear || ed.getFullYear();
    const branchId = req.body.branchId || (await resolveBranchId(schoolId));
    const row = await AcademicYear.create({
      schoolId,
      branchId,
      label: name,
      name,
      startYear: sy,
      endYear: ey,
      startDate: sd,
      endDate: ed,
      status: status || 'Draft',
      isDefault: false,
      isCurrent: false
    });
    res.status(201).json({ success: true, data: mapAcademicYearDoc(row) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchAcademicYear = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const updates = { ...req.body };
    if (updates.name) {
      updates.label = updates.name;
    }
    delete updates.isCurrent;
    const row = await AcademicYear.findOneAndUpdate({ _id: req.params.id, schoolId }, updates, { new: true });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: mapAcademicYearDoc(row) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.setCurrentAcademicYear = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const id = req.params.id;
    const exists = await AcademicYear.findOne({ _id: id, schoolId });
    if (!exists) return res.status(404).json({ success: false, message: 'Not found' });
    await AcademicYear.updateMany({ schoolId }, { $set: { isCurrent: false, isDefault: false } });
    await AcademicYear.findByIdAndUpdate(id, { $set: { isCurrent: true, isDefault: true, status: 'Active' } });
    const row = await AcademicYear.findById(id).lean();
    res.json({ success: true, data: mapAcademicYearDoc(row) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteAcademicYear = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const row = await AcademicYear.findOne({ _id: req.params.id, schoolId });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    if (row.status !== 'Draft' && row.status !== 'Closed') {
      return res.status(409).json({ success: false, message: 'Only Draft or Closed years can be deleted' });
    }
    await AcademicYear.deleteOne({ _id: row._id });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ---------- Calendar ----------
exports.listCalendarEvents = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { year, month, category, branchId } = req.query;
    if (!year || !month) return res.status(400).json({ success: false, message: 'year and month required' });
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    const filter = { schoolId, startAt: { $gte: start, $lte: end } };
    if (category) filter.category = category;
    if (branchId) filter.branchId = branchId;
    const data = await CalendarEvent.find(filter).sort({ startAt: 1 }).lean();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getCalendarEvent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const ev = await CalendarEvent.findOne({ _id: req.params.id, schoolId }).lean();
    if (!ev) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: ev });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createCalendarEvent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const ev = await CalendarEvent.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: ev });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchCalendarEvent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const ev = await CalendarEvent.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!ev) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: ev });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteCalendarEvent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const r = await CalendarEvent.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.calendarEventsSummary = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ success: false, message: 'year and month required' });
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    const agg = await CalendarEvent.aggregate([
      { $match: { schoolId: mongoose.Types.ObjectId(schoolId), startAt: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const data = agg.map(a => ({ category: a._id, count: a.count }));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ---------- RBAC ----------
exports.listRbacRoles = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await RbacRole.find({ schoolId }).sort({ name: 1 }).lean();
    res.json({
      success: true,
      data: data.map(r => ({
        ...r,
        id: r.slug,
        permissions: r.permissions ? Object.fromEntries(r.permissions) : {}
      }))
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createRbacRole = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { slug, name, category, description, active } = req.body;
    if (!slug || !name) return res.status(400).json({ success: false, message: 'slug and name required' });
    const raw = req.body.permissions || {};
    const permissions = new Map(Object.entries(raw));
    const role = await RbacRole.create({
      schoolId,
      slug,
      name,
      category: category || 'Academic',
      description: description || '',
      active: active !== false,
      permissions
    });
    res.status(201).json({ success: true, data: role });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: 'Duplicate slug' });
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchRbacRole = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const id = req.params.id;
    const or = [{ slug: id }];
    if (mongoose.Types.ObjectId.isValid(id)) or.push({ _id: id });
    const role = await RbacRole.findOneAndUpdate({ schoolId, $or: or }, req.body, { new: true });
    if (!role) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: role });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteRbacRole = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const role = await RbacRole.findOne({ slug: req.params.id, schoolId });
    if (!role) return res.status(404).json({ success: false, message: 'Not found' });
    const n = await RbacRoleAssignment.countDocuments({ schoolId, roleId: role._id });
    if (n > 0) return res.status(409).json({ success: false, message: 'Role has assignments' });
    await RbacRole.deleteOne({ _id: role._id });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getRolePermissions = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const role = await RbacRole.findOne({ slug: req.params.id, schoolId }).lean();
    if (!role) return res.status(404).json({ success: false, message: 'Not found' });
    const permissions = role.permissions ? Object.fromEntries(role.permissions) : {};
    res.json({ success: true, data: { permissions } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.putRolePermissions = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { permissions: p } = req.body;
    const permissions = new Map(Object.entries(p || {}));
    const role = await RbacRole.findOneAndUpdate(
      { slug: req.params.id, schoolId },
      { $set: { permissions } },
      { new: true }
    );
    if (!role) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: role });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listRoleAssignments = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { roleId, search } = req.query;
    const filter = { schoolId };
    if (roleId) {
      const role = await RbacRole.findOne({ $or: [{ slug: roleId }, { _id: roleId }], schoolId });
      if (role) filter.roleId = role._id;
    }
    let q = RbacRoleAssignment.find(filter).populate('staffId', 'firstName lastName email').populate('roleId', 'name slug');
    const data = await q.lean();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createRoleAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { staffId, roleId, status } = req.body;
    const role = await RbacRole.findOne({ $or: [{ slug: roleId }, { _id: roleId }], schoolId });
    if (!role) return res.status(400).json({ success: false, message: 'Invalid roleId' });
    const a = await RbacRoleAssignment.create({ schoolId, staffId, roleId: role._id, status: status || 'Assigned' });
    res.status(201).json({ success: true, data: a });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchRoleAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const a = await RbacRoleAssignment.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: a });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteRoleAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const r = await RbacRoleAssignment.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ---------- Finance (admin doc paths) ----------
exports.listFeeTypes = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await FeeHead.find({ schoolId }).lean();
    const mapped = data.map(f => ({
      id: String(f._id),
      name: f.name,
      code: f.code || f.type || 'CODE'
    }));
    res.json({ success: true, data: mapped });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createFeeType = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { name, code } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name required' });
    const f = await FeeHead.create({ schoolId, name, code: code || name.slice(0, 3).toUpperCase() });
    return res.status(201).json({ success: true, data: f });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchFeeType = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const f = await FeeHead.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!f) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: f });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteFeeType = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const ref = await FeeStructureRow.countDocuments({ schoolId, feeTypeId: req.params.id });
    if (ref > 0) return res.status(409).json({ success: false, message: 'Fee type in use' });
    const r = await FeeHead.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listFeeStructure = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { academicYearId, classId, feeTypeId, page = 1, pageSize = 50 } = req.query;
    const filter = { schoolId };
    if (academicYearId) filter.academicYearId = academicYearId;
    if (classId) filter.classId = classId;
    if (feeTypeId) filter.feeTypeId = feeTypeId;
    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const [data, total] = await Promise.all([
      FeeStructureRow.find(filter).skip(skip).limit(parseInt(pageSize, 10)).populate('feeTypeId').populate('classId').lean(),
      FeeStructureRow.countDocuments(filter)
    ]);
    res.json({
      success: true,
      data: {
        items: data.map(r => ({
          id: String(r._id),
          academicYearId: String(r.academicYearId),
          classId: String(r.classId),
          feeTypeId: String(r.feeTypeId),
          amount: r.amount,
          currency: r.currency,
          dueDate: r.dueDate ? r.dueDate.toISOString().slice(0, 10) : null
        })),
        total,
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10)
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.upsertFeeStructureRow = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const row = await FeeStructureRow.findOneAndUpdate(
      {
        schoolId,
        academicYearId: req.body.academicYearId,
        classId: req.body.classId,
        feeTypeId: req.body.feeTypeId
      },
      {
        $set: {
          amount: req.body.amount,
          currency: req.body.currency || 'INR',
          dueDate: req.body.dueDate ? new Date(req.body.dueDate) : new Date()
        }
      },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchFeeStructureRow = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const row = await FeeStructureRow.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteFeeStructureRow = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const r = await FeeStructureRow.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.financeFeesSummary = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { academicYearId, asOf } = req.query;
    const filter = { schoolId };
    if (academicYearId) filter.academicYearId = academicYearId;
    const fees = await StudentFee.find(filter).lean();
    let collectedTotal = 0;
    let pendingTotal = 0;
    let overdueTotal = 0;
    fees.forEach(f => {
      collectedTotal += f.paidAmount || 0;
      if (f.status === 'pending' || f.status === 'partial') pendingTotal += f.pendingAmount || 0;
      if (f.status === 'overdue') overdueTotal += f.pendingAmount || 0;
    });
    res.json({ success: true, data: { collectedTotal, pendingTotal, overdueTotal, asOf: asOf || new Date().toISOString() } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.financeFeesLedger = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { studentId, classId, status, search, page = 1, pageSize = 20 } = req.query;
    const filter = { schoolId };
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;
    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const [rows, total] = await Promise.all([
      StudentFee.find(filter).populate('studentId', 'firstName lastName admissionNumber classId').skip(skip).limit(parseInt(pageSize, 10)).lean(),
      StudentFee.countDocuments(filter)
    ]);
    res.json({
      success: true,
      data: {
        items: rows,
        total,
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10)
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listReimbursements = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await StaffReimbursement.find({ schoolId }).populate('staffId', 'firstName lastName').lean();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchReimbursement = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const r = await StaffReimbursement.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: r });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createReimbursement = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const r = await StaffReimbursement.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: r });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listExpenseEntries = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await ExpenseEntry.find({ schoolId }).sort({ date: -1 }).limit(200).lean();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createExpenseEntry = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const e = await ExpenseEntry.create({ ...req.body, schoolId });
    return res.status(201).json({ success: true, data: e });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ---------- Reports catalog ----------
const REPORT_CATALOG = [
  {
    id: 'student_directory',
    name: 'Student directory',
    description: 'Students with class/section/contact',
    category: 'Academics',
    formats: ['pdf', 'xlsx', 'csv'],
    filters: [
      { key: 'classId', label: 'Class', type: 'class', required: false },
      { key: 'dateRange', label: 'Date range', type: 'dateRange', required: false }
    ]
  },
  {
    id: 'attendance_monthly',
    name: 'Attendance monthly',
    category: 'Attendance',
    formats: ['pdf', 'xlsx'],
    filters: [{ key: 'month', label: 'Month', type: 'dateRange', required: true }]
  },
  {
    id: 'fee_outstanding',
    name: 'Fee outstanding',
    category: 'Finance',
    formats: ['xlsx', 'csv'],
    filters: [{ key: 'academicYearId', label: 'Academic year', type: 'select', required: false }]
  },
  {
    id: 'exam_results_summary',
    name: 'Exam results summary',
    category: 'Academics',
    formats: ['pdf', 'xlsx'],
    filters: [
      { key: 'examId', label: 'Exam', type: 'select', required: true },
      { key: 'classId', label: 'Class', type: 'class', required: false }
    ]
  }
];

exports.getReportCatalog = async (req, res) => {
  res.json({ success: true, data: REPORT_CATALOG });
};

exports.previewReport = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { reportId } = req.params;
    const def = REPORT_CATALOG.find(r => r.id === reportId);
    if (!def) return res.status(404).json({ success: false, message: 'Unknown report' });
    const { filters = {}, limit = 50 } = req.body;
    res.json({
      success: true,
      data: {
        columns: [
          { key: 'sample', header: 'Sample' },
          { key: 'value', header: 'Value' }
        ],
        rows: [{ sample: reportId, value: schoolId.toString().slice(-6) }]
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createReportJob = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { reportId } = req.params;
    const def = REPORT_CATALOG.find(r => r.id === reportId);
    if (!def) return res.status(404).json({ success: false, message: 'Unknown report' });
    const job = await ReportJob.create({
      schoolId,
      type: reportId,
      format: req.body.format || 'pdf',
      filters: req.body.filters || {},
      status: 'pending',
      requestedBy: req.admin._id
    });
    res.status(202).json({ success: true, data: { jobId: job._id, status: 'queued' } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getReportJob = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const job = await ReportJob.findOne({ _id: req.params.jobId, schoolId }).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({
      success: true,
      data: { status: job.status, downloadUrl: job.fileUrl || null, error: job.error || null }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ---------- Dashboard bundle ----------
exports.getDashboardBundle = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { academicYearId, from, to } = req.query;
    const [
      totalStudents,
      totalTeachers,
      staffCount,
      notices
    ] = await Promise.all([
      Student.countDocuments({ schoolId, status: { $ne: 'deleted' } }),
      Teacher.countDocuments({ schoolId, status: { $ne: 'deleted' } }),
      Staff.countDocuments({ schoolId }).catch(() => 0),
      Notice.find({ schoolId }).sort({ createdAt: -1 }).limit(5).select('title createdAt category').lean()
    ]);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const attCount = await StudentAttendance.countDocuments({ schoolId, date: { $gte: todayStart }, status: 'present' });
    const attTotal = await StudentAttendance.countDocuments({ schoolId, date: { $gte: todayStart } });
    const attendanceTodayPercent = attTotal ? Math.round((attCount / attTotal) * 100) : null;
    const feeAgg = await StudentFee.aggregate([
      { $match: { schoolId: mongoose.Types.ObjectId(schoolId) } },
      { $group: { _id: null, pending: { $sum: '$pendingAmount' }, total: { $sum: '$amount' } } }
    ]);
    const pending = feeAgg[0]?.pending || 0;
    const totalAmt = feeAgg[0]?.total || 1;
    const feeCollectionPercent = Math.round(((totalAmt - pending) / totalAmt) * 100);
    const events = await CalendarEvent.find({ schoolId, startAt: { $gte: new Date() } })
      .sort({ startAt: 1 })
      .limit(8)
      .select('title startAt endAt allDay')
      .lean();
    res.json({
      success: true,
      data: {
        kpis: {
          totalStudents,
          totalTeachers,
          totalStaff: staffCount,
          attendanceTodayPercent,
          feeCollectionPercent: Number.isFinite(feeCollectionPercent) ? feeCollectionPercent : null,
          openIncidents: null,
          asOf: new Date().toISOString()
        },
        charts: {
          studentPerformance: { labels: [], series: [] },
          earningsVsExpenses: { labels: [], series: [] },
          studentsByGender: { segments: [] },
          weeklyAttendance: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], values: [0, 0, 0, 0, 0] }
        },
        events: events.map(e => ({
          id: String(e._id),
          title: e.title,
          startAt: e.startAt,
          endAt: e.endAt,
          allDay: e.allDay
        })),
        notices: notices.map(n => ({
          id: String(n._id),
          title: n.title,
          postAt: n.createdAt,
          category: n.category || 'Notice'
        }))
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ---------- Exam helpers ----------
exports.getExamSubjectMapping = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const exam = await Exam.findOne({ _id: req.params.examId, schoolId }).lean();
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const rows = (exam.subjectMappingOverride && exam.subjectMappingOverride.length)
      ? exam.subjectMappingOverride
      : [{ classId: exam.classId, subjectId: exam.subjectId, maxMarks: exam.maxMarks, passMarks: exam.passingMarks }];
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.putExamSubjectMapping = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { mapping } = req.body;
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.examId, schoolId },
      { $set: { subjectMappingOverride: mapping || [] } },
      { new: true }
    );
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: exam.subjectMappingOverride });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getExamTimetable = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const exam = await Exam.findOne({ _id: req.params.examId, schoolId }).lean();
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: exam.examTimetable || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchExamTimetable = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.examId, schoolId },
      { $set: { examTimetable: req.body.rows || req.body } },
      { new: true }
    );
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: exam.examTimetable });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getExamMarksGrid = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId, subjectId } = req.query;
    const exam = await Exam.findOne({ _id: req.params.examId, schoolId }).lean();
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const stuFilter = { schoolId, classId: classId || exam.classId, status: 'active' };
    if (sectionId) stuFilter.sectionId = sectionId;
    const students = await Student.find(stuFilter).select('firstName lastName rollNumber').lean();
    const results = await ExamResult.find({ examId: exam._id, schoolId }).lean();
    const byStudent = {};
    results.forEach(r => {
      byStudent[String(r.studentId)] = r;
    });
    res.json({
      success: true,
      data: {
        exam,
        students: students.map(s => ({
          studentId: s._id,
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          rollNumber: s.rollNumber,
          marks: byStudent[String(s._id)] || null
        }))
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchExamMarks = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const exam = await Exam.findOne({ _id: req.params.examId, schoolId });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.resultsPublished) return res.status(409).json({ success: false, message: 'Results published' });
    const { entries = [] } = req.body;
    for (const e of entries) {
      await ExamResult.findOneAndUpdate(
        { examId: exam._id, studentId: e.studentId, schoolId },
        {
          $set: {
            marksObtained: e.marksObtained,
            maxMarks: exam.maxMarks,
            grade: e.grade
          }
        },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: 'Marks updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getExamAnalytics = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const exam = await Exam.findOne({ _id: req.params.examId, schoolId }).lean();
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const passMark = exam.passingMarks || 0;
    const results = await ExamResult.find({ examId: req.params.examId, schoolId }).lean();
    const marks = results.map(r => r.marksObtained).filter(m => m != null);
    const avg = marks.length ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
    const pass = results.filter(r => r.marksObtained >= passMark).length;
    res.json({
      success: true,
      data: {
        count: results.length,
        averageMarks: Math.round(avg * 100) / 100,
        passCount: pass,
        distribution: {}
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listGradeScales = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await GradeScale.find({ schoolId }).lean();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createGradeScale = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const g = await GradeScale.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: g });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchGradeScale = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const g = await GradeScale.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!g) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: g });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteGradeScale = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    await GradeScale.deleteOne({ _id: req.params.id, schoolId });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ---------- Timetable periods & class grid ----------
exports.listPeriodTemplates = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { academicYearId } = req.query;
    const filter = { schoolId };
    if (academicYearId) filter.academicYearId = academicYearId;
    const data = await PeriodTemplate.find(filter).sort({ order: 1 }).lean();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createPeriodTemplate = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const p = await PeriodTemplate.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: p });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchPeriodTemplate = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const p = await PeriodTemplate.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: p });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deletePeriodTemplate = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    await PeriodTemplate.deleteOne({ _id: req.params.id, schoolId });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getClassWeeklyTimetable = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId, academicYearId } = req.query;
    if (!classId) return res.status(400).json({ success: false, message: 'classId required' });
    const filter = { schoolId, classId };
    if (sectionId) filter.sectionId = sectionId;
    if (academicYearId) filter.academicYearId = academicYearId;
    let tt = await Timetable.findOne(filter).lean();
    if (!tt) tt = { slots: [] };
    res.json({ success: true, data: tt });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.putClassWeeklyTimetable = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId, academicYearId, slots } = req.body;
    if (!classId || !Array.isArray(slots)) return res.status(400).json({ success: false, message: 'classId and slots required' });
    const tt = await Timetable.findOneAndUpdate(
      { schoolId, classId, sectionId: sectionId || null, ...(academicYearId && { academicYearId }) },
      { $set: { schoolId, classId, sectionId: sectionId || undefined, academicYearId, slots } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: tt });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ---------- Communication extras ----------
exports.postCommunicationMessage = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const StudentCommunication = require('../models/StudentCommunication');
    const ch = (req.body.channel || 'email');
    const type = ch === 'sms' ? 'sms' : ch === 'in_app' ? 'in_app' : 'email';
    const msg = await StudentCommunication.create({
      schoolId,
      studentId: req.body.studentId || null,
      type,
      message: req.body.body || '',
      subject: req.body.subject || '',
      sentBy: req.admin._id,
      recipient: { type: 'student', name: req.body.audience?.label || '' },
      status: 'pending'
    });
    res.status(201).json({ success: true, data: { messageId: msg._id, status: 'queued' } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getCommunicationNotifications = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { type, page = 1, pageSize = 20 } = req.query;
    const StudentCommunication = require('../models/StudentCommunication');
    const filter = { schoolId };
    if (type === 'fee_reminder') filter.type = 'fee_reminder';
    if (type === 'attendance_alert') filter.type = 'attendance_alert';
    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const [items, total] = await Promise.all([
      StudentCommunication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(pageSize, 10)).lean(),
      StudentCommunication.countDocuments(filter)
    ]);
    res.json({ success: true, data: { items, total, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getCommunicationLog = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { from, to, type, page = 1, pageSize = 20 } = req.query;
    const StudentCommunication = require('../models/StudentCommunication');
    const filter = { schoolId };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    if (type) filter.type = type;
    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const [items, total] = await Promise.all([
      StudentCommunication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(pageSize, 10)).lean(),
      StudentCommunication.countDocuments(filter)
    ]);
    res.json({
      success: true,
      data: {
        items: items.map(i => ({
          date: i.createdAt,
          type: i.type,
          audience: i.recipient?.type || '',
          subject: i.subject || ''
        })),
        total,
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10)
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ---------- Settings school / preferences ----------
exports.getSchoolSettingsSlice = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const School = require('../models/School');
    const s = await School.findById(schoolId).select('schoolName schoolCode timezone').lean();
    if (!s) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({
      success: true,
      data: {
        displayName: s.schoolName,
        schoolCode: s.schoolCode,
        timezone: s.timezone || 'Asia/Kolkata'
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchSchoolSettingsSlice = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const School = require('../models/School');
    const updates = {};
    if (req.body.displayName) updates.schoolName = req.body.displayName;
    if (req.body.timezone) updates.timezone = req.body.timezone;
    const s = await School.findByIdAndUpdate(schoolId, { $set: updates }, { new: true }).select('schoolName schoolCode timezone');
    res.json({ success: true, data: s });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getUserPreferences = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('emailNotifications preferences').lean();
    res.json({
      success: true,
      data: admin.preferences || {
        emailNotifications: true,
        smsAlerts: false,
        weeklyDigest: false
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.patchUserPreferences = async (req, res) => {
  try {
    await Admin.findByIdAndUpdate(req.admin._id, { $set: { preferences: req.body } }, { new: true });
    res.json({ success: true, data: req.body });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
