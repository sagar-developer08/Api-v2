/**
 * Admin Staff module — contract for /admin/staff and /schools/:schoolId/staff.
 * Maps DB (snake_case-ish) to API enums (Title Case) for status & employeeType.
 */

const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const Department = require('../models/Department');
const StaffRole = require('../models/StaffRole');
const StaffDocument = require('../models/StaffDocument');
const StaffQualification = require('../models/StaffQualification');
const StaffExperience = require('../models/StaffExperience');
const StaffAttendance = require('../models/StaffAttendance');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads', 'staff');

const STATUS_DB_TO_API = {
  active: 'Active',
  on_leave: 'On Leave',
  inactive: 'Inactive',
  resigned: 'Resigned',
  retired: 'Retired',
  suspended: 'Inactive'
};

const STATUS_API_TO_DB = {
  Active: 'active',
  'On Leave': 'on_leave',
  Inactive: 'inactive',
  Resigned: 'resigned',
  Retired: 'retired'
};

const DOC_TYPES = new Set([
  'Resume',
  'Aadhaar Front',
  'Aadhaar Back',
  'PAN',
  'Education Certificate',
  'Experience Certificate',
  'Other',
  'id-proof',
  'address-proof',
  'qualification',
  'experience',
  'photograph',
  'other'
]);

function adminSchoolId(req) {
  return req.admin.schoolId._id || req.admin.schoolId;
}

function resolveSchool(req, res) {
  const p = req.params.schoolId;
  const sid = adminSchoolId(req);
  if (p && String(p) !== String(sid)) {
    res.status(403).json({ success: false, message: 'School mismatch' });
    return null;
  }
  return sid;
}

function branchFilter(req) {
  return { ...(req.branchFilter || {}) };
}

function schoolBranchQuery(req) {
  return { schoolId: adminSchoolId(req), ...branchFilter(req) };
}

function formatDate(d) {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return x.toISOString().slice(0, 10);
}

function formatIso(d) {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return x.toISOString();
}

function apiStatus(db) {
  return STATUS_DB_TO_API[db] || 'Inactive';
}

function apiEmployeeType(db) {
  if (!db) return 'Non-Teaching';
  const s = String(db).toLowerCase();
  if (s === 'teaching') return 'Teaching';
  return 'Non-Teaching';
}

function dbEmployeeType(api) {
  if (!api || api === 'all') return null;
  return api === 'Teaching' ? 'teaching' : 'non_teaching';
}

function toListItem(s) {
  const dept = s.departmentId && typeof s.departmentId === 'object' ? s.departmentId.name : '';
  return {
    id: String(s._id),
    staffId: s.employeeId || String(s._id),
    photoUrl: s.photoUrl || null,
    firstName: s.firstName || '',
    middleName: s.middleName || '',
    lastName: s.lastName || '',
    department: dept || '',
    designation: s.designation || '',
    mobile: (s.phone || '').replace(/\D/g, '').slice(-10) || s.phone || '',
    email: s.email || '',
    joiningDate: formatDate(s.joinDate) || '',
    status: apiStatus(s.status),
    employeeType: apiEmployeeType(s.employeeType)
  };
}

async function loadNestedProfile(schoolId, staffId) {
  const [qualifications, experience, documents] = await Promise.all([
    StaffQualification.find({ schoolId, staffId }).lean(),
    StaffExperience.find({ schoolId, staffId }).lean(),
    StaffDocument.find({ schoolId, staffId }).lean()
  ]);
  return {
    qualifications: qualifications.map((q) => ({
      id: String(q._id),
      degree: q.degree,
      institution: q.institution || null,
      boardOrUniversity: q.boardOrUniversity || null,
      year: q.year ?? null,
      percentageOrCgpa: q.percentageOrCgpa || null
    })),
    experience: experience.map((e) => ({
      id: String(e._id),
      organisation: e.organisation,
      role: e.role || null,
      fromDate: formatDate(e.fromDate),
      toDate: e.toDate ? formatDate(e.toDate) : null,
      description: e.description || null
    })),
    documents: documents.map((d) => ({
      id: String(d._id),
      type: d.type,
      fileName: d.name,
      fileSize: d.fileSize,
      uploadedAt: formatIso(d.createdAt)
    }))
  };
}

async function toProfile(staffLean) {
  const s = staffLean;
  const dept = s.departmentId && typeof s.departmentId === 'object' ? s.departmentId.name : '';
  const role = s.roleId && typeof s.roleId === 'object' ? s.roleId.name : '';
  const nested = await loadNestedProfile(s.schoolId, s._id);
  return {
    id: String(s._id),
    staffId: s.employeeId || String(s._id),
    photoUrl: s.photoUrl || null,
    firstName: s.firstName || '',
    middleName: s.middleName || '',
    lastName: s.lastName || '',
    department: dept,
    departmentId: s.departmentId ? String(s.departmentId._id || s.departmentId) : null,
    designation: s.designation || '',
    mobile: (s.phone || '').replace(/\D/g, '').slice(-10) || s.phone || '',
    email: s.email || '',
    joiningDate: formatDate(s.joinDate) || '',
    status: apiStatus(s.status),
    employeeType: apiEmployeeType(s.employeeType),
    dateOfBirth: formatDate(s.dateOfBirth),
    bloodGroup: s.bloodGroup || null,
    aadhaar: s.aadhaarMasked ? `XXXX-XXXX-${s.aadhaarMasked}` : null,
    pan: s.pan || null,
    alternateMobile: s.alternatePhone || null,
    emergencyContactName: s.emergencyContactName || null,
    emergencyContactPhone: s.emergencyContactPhone || null,
    addressLine1: s.addressLine1 || s.address || '',
    addressLine2: s.addressLine2 || null,
    city: s.city || '',
    state: s.state || '',
    pincode: s.pincode || '',
    employmentType: s.employmentType || '',
    workShift: s.workShift || null,
    reportingManagerId: s.reportingManagerId ? String(s.reportingManagerId) : null,
    subjectsTaught: (s.subjectsTaught || []).map(String),
    classesAssigned: (s.classesAssigned || []).map((id) => String(id)),
    sectionsAssigned: (s.sectionsAssigned || []).map((id) => String(id)),
    isClassTeacher: !!s.isClassTeacher,
    classTeacherOf: s.classTeacherOf
      ? {
          classId: s.classTeacherOf.classId ? String(s.classTeacherOf.classId) : null,
          sectionId: s.classTeacherOf.sectionId ? String(s.classTeacherOf.sectionId) : null
        }
      : null,
    teachingExperienceYears: s.teachingExperienceYears ?? null,
    salaryType: s.salaryType || null,
    basicSalary: s.basicSalary ?? null,
    allowances: s.allowances || null,
    bankName: s.bankName || null,
    accountNumber: s.accountNumber || null,
    ifscCode: s.ifscCode || null,
    hasSystemAccess: !!s.hasSystemAccess,
    username: s.username || null,
    loginEmail: s.loginEmail || null,
    roleId: s.roleId ? String(s.roleId._id || s.roleId) : null,
    roleName: role || null,
    permissionIds: (s.permissionIds || []).map((id) => String(id)),
    notes: s.notes || null,
    createdAt: formatIso(s.createdAt),
    updatedAt: formatIso(s.updatedAt),
    ...nested
  };
}

const PATCH_SCALAR_KEYS = new Set([
  'firstName',
  'middleName',
  'lastName',
  'email',
  'phone',
  'alternatePhone',
  'emergencyContactName',
  'emergencyContactPhone',
  'dateOfBirth',
  'gender',
  'bloodGroup',
  'aadhaarMasked',
  'pan',
  'address',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'pincode',
  'photoUrl',
  'departmentId',
  'roleId',
  'designation',
  'joinDate',
  'status',
  'employeeType',
  'employmentType',
  'workShift',
  'reportingManagerId',
  'subjectsTaught',
  'classesAssigned',
  'sectionsAssigned',
  'isClassTeacher',
  'classTeacherOf',
  'teachingExperienceYears',
  'salaryType',
  'basicSalary',
  'allowances',
  'bankName',
  'accountNumber',
  'ifscCode',
  'hasSystemAccess',
  'username',
  'loginEmail',
  'permissionIds',
  'notes',
  'branchId',
  'employeeId',
  'password'
]);

function normalizeBodyForDb(body, { isCreate } = {}) {
  const out = { ...body };
  if (out.status && STATUS_API_TO_DB[out.status]) {
    out.status = STATUS_API_TO_DB[out.status];
  }
  const et = dbEmployeeType(out.employeeType);
  if (et) out.employeeType = et;
  if (out.joiningDate && !out.joinDate) out.joinDate = out.joiningDate;
  delete out.joiningDate;
  if (out.mobile && !out.phone) out.phone = out.mobile;
  delete out.mobile;
  if (out.alternateMobile && !out.alternatePhone) out.alternatePhone = out.alternateMobile;
  delete out.alternateMobile;
  if (out.aadhaar && !out.aadhaarMasked) {
    const digits = String(out.aadhaar).replace(/\D/g, '');
    out.aadhaarMasked = digits.slice(-4) || '';
  }
  delete out.aadhaar;
  if (out.dateOfBirth) out.dateOfBirth = new Date(out.dateOfBirth);
  if (out.joinDate) out.joinDate = new Date(out.joinDate);
  if (isCreate && out.draft) delete out.draft;
  delete out.qualifications;
  delete out.experience;
  delete out.documents;
  return out;
}

function validateCreate(body, { draft }) {
  const errors = {};
  const req = (label, cond, msg) => {
    if (!cond) errors[label] = [...(errors[label] || []), msg];
  };
  if (!draft) {
    req('firstName', !!body.firstName?.trim(), 'firstName is required');
    req('gender', !!body.gender, 'gender is required');
    req('dateOfBirth', !!body.dateOfBirth, 'dateOfBirth is required');
    const mobile = (body.mobile || body.phone || '').replace(/\D/g, '');
    req('mobile', mobile.length === 10, 'mobile must be 10 digits');
    req('email', !!body.email?.trim(), 'email is required');
    req('addressLine1', !!(body.addressLine1 || body.address)?.trim(), 'addressLine1 is required');
    req('city', !!body.city?.trim(), 'city is required');
    req('state', !!body.state?.trim(), 'state is required');
    const pin = (body.pincode || '').replace(/\D/g, '');
    req('pincode', pin.length === 6, 'pincode must be 6 digits');
    req('employeeType', !!(body.employeeType && body.employeeType !== 'all'), 'employeeType is required');
    req('departmentId', !!body.departmentId, 'departmentId is required');
    req('designation', !!body.designation?.trim(), 'designation is required');
    req('joiningDate', !!(body.joiningDate || body.joinDate), 'joiningDate is required');
    req('employmentType', !!body.employmentType?.trim(), 'employmentType is required');
  } else {
    req('firstName', !!body.firstName?.trim(), 'firstName is required');
  }
  return Object.keys(errors).length ? errors : null;
}

async function generateEmployeeId(schoolId) {
  const year = new Date().getFullYear();
  const n = await Staff.countDocuments({ schoolId, employeeId: new RegExp(`^STF-${year}-`) });
  return `STF-${year}-${String(n + 1).padStart(4, '0')}`;
}

async function assertNoDuplicates(req, schoolId, branchId, payload, excludeId) {
  const q = { schoolId, branchId };
  if (payload.email?.trim()) {
    const e = await Staff.findOne({ ...q, email: payload.email.trim().toLowerCase(), ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).select('_id');
    if (e) {
      const err = new Error('DUPLICATE_EMAIL');
      err.code = 409;
      throw err;
    }
  }
  const phoneDigits = (payload.phone || '').replace(/\D/g, '');
  if (phoneDigits.length >= 10) {
    const e = await Staff.findOne({
      ...q,
      phone: new RegExp(phoneDigits.slice(-10) + '$'),
      ...(excludeId ? { _id: { $ne: excludeId } } : {})
    }).select('_id');
    if (e) {
      const err = new Error('DUPLICATE_PHONE');
      err.code = 409;
      throw err;
    }
  }
  if (payload.hasSystemAccess && payload.loginEmail?.trim()) {
    const e = await Staff.findOne({
      ...q,
      loginEmail: payload.loginEmail.trim().toLowerCase(),
      ...(excludeId ? { _id: { $ne: excludeId } } : {})
    }).select('_id');
    if (e) {
      const err = new Error('DUPLICATE_LOGIN_EMAIL');
      err.code = 409;
      throw err;
    }
  }
}

async function replaceQualifications(schoolId, staffId, list) {
  await StaffQualification.deleteMany({ schoolId, staffId });
  if (!list?.length) return;
  const docs = list.map((q) => ({
    schoolId,
    staffId,
    degree: q.degree,
    institution: q.institution || '',
    boardOrUniversity: q.boardOrUniversity || '',
    year: q.year != null ? Number(q.year) : undefined,
    percentageOrCgpa: q.percentageOrCgpa || '',
    specialization: q.specialization || ''
  }));
  await StaffQualification.insertMany(docs.filter((d) => d.degree));
}

async function replaceExperience(schoolId, staffId, list) {
  await StaffExperience.deleteMany({ schoolId, staffId });
  if (!list?.length) return;
  const docs = list.map((e) => ({
    schoolId,
    staffId,
    organisation: e.organisation,
    role: e.role || '',
    fromDate: e.fromDate ? new Date(e.fromDate) : undefined,
    toDate: e.toDate ? new Date(e.toDate) : null,
    description: e.description || ''
  }));
  await StaffExperience.insertMany(docs.filter((d) => d.organisation));
}

exports.getSummary = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const filter = schoolBranchQuery(req);
    const [total, byStatusAgg, byDeptAgg] = await Promise.all([
      Staff.countDocuments(filter),
      Staff.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Staff.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'departments',
            localField: 'departmentId',
            foreignField: '_id',
            as: 'd'
          }
        },
        { $unwind: { path: '$d', preserveNullAndEmptyArrays: true } },
        { $group: { _id: { $ifNull: ['$d.name', 'Unassigned'] }, count: { $sum: 1 } } }
      ])
    ]);
    const byStatus = {};
    for (const row of byStatusAgg) {
      const key = apiStatus(row._id || 'inactive');
      byStatus[key] = (byStatus[key] || 0) + row.count;
    }
    const byDepartment = byDeptAgg.map((r) => ({ name: r._id, count: r.count }));
    res.json({
      success: true,
      data: { total, byStatus, byDepartment }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error building staff summary', error: error.message });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const schoolId = adminSchoolId(req);
    const range = req.query.range || 'weekly';
    const days = range === 'weekly' ? 7 : 30;
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0, 0, 0, 0);
    const staffIds = await Staff.find(schoolBranchQuery(req)).distinct('_id');
    const series = await StaffAttendance.aggregate([
      {
        $match: {
          schoolId,
          staffId: { $in: staffIds },
          date: { $gte: start, $lte: end }
        }
      },
      {
        $project: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' } },
          status: 1
        }
      },
      {
        $group: {
          _id: '$day',
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          marked: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data: { range, series } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error building attendance summary', error: error.message });
  }
};

exports.getEligibleManagers = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const excludeId = req.query.excludeId;
    const filter = { ...schoolBranchQuery(req), status: { $in: ['active', 'on_leave'] } };
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }
    const rows = await Staff.find(filter)
      .select('firstName lastName employeeId')
      .sort({ firstName: 1 })
      .limit(500)
      .lean();
    res.json({
      success: true,
      data: rows.map((s) => ({
        id: String(s._id),
        staffId: s.employeeId || String(s._id),
        name: [s.firstName, s.lastName].filter(Boolean).join(' ').trim()
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing managers', error: error.message });
  }
};

exports.list = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const {
      department,
      designation,
      employeeType,
      status,
      q,
      sort = 'joiningDate_desc',
      page = 1,
      pageSize = 20,
      counts
    } = req.query;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));

    const filter = schoolBranchQuery(req);

    if (department && department !== 'all') {
      if (mongoose.Types.ObjectId.isValid(department)) {
        filter.departmentId = new mongoose.Types.ObjectId(department);
      } else {
        const dept = await Department.findOne({
          schoolId: adminSchoolId(req),
          name: new RegExp(`^${department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        })
          .select('_id')
          .lean();
        if (!dept) {
          return res.json({
            success: true,
            data: { items: [], total: 0, page: p, pageSize: ps }
          });
        }
        filter.departmentId = dept._id;
      }
    }

    if (designation && designation !== 'all') {
      filter.designation = new RegExp(`^${designation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }

    const et = dbEmployeeType(employeeType);
    if (et) filter.employeeType = et;

    if (status && status !== 'all') {
      const dbS = STATUS_API_TO_DB[status];
      if (dbS) filter.status = dbS;
    }

    if (q && String(q).trim()) {
      const term = String(q).trim();
      const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const digits = term.replace(/\D/g, '');
      const or = [
        { firstName: re },
        { lastName: re },
        { middleName: re },
        { email: re },
        { employeeId: re },
        { loginEmail: re }
      ];
      if (digits.length) {
        or.push({ phone: new RegExp(digits) });
      }
      filter.$or = or;
    }

    let sortSpec = { joinDate: -1 };
    if (sort === 'joiningDate_asc') sortSpec = { joinDate: 1 };
    else if (sort === 'name_asc') sortSpec = { firstName: 1, lastName: 1 };
    else if (sort === 'name_desc') sortSpec = { firstName: -1, lastName: -1 };

    const skip = (p - 1) * ps;

    const [raw, total] = await Promise.all([
      Staff.find(filter)
        .populate('departmentId', 'name')
        .sort(sortSpec)
        .skip(skip)
        .limit(ps)
        .lean(),
      Staff.countDocuments(filter)
    ]);

    const items = raw.map(toListItem);
    const payload = {
      success: true,
      data: { items, total, page: p, pageSize: ps }
    };

    if (counts === '1' || counts === 'true') {
      const [totalAll, byStatusAgg, byDeptAgg] = await Promise.all([
        Staff.countDocuments(schoolBranchQuery(req)),
        Staff.aggregate([
          { $match: schoolBranchQuery(req) },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Staff.aggregate([
          { $match: schoolBranchQuery(req) },
          {
            $lookup: {
              from: 'departments',
              localField: 'departmentId',
              foreignField: '_id',
              as: 'd'
            }
          },
          { $unwind: { path: '$d', preserveNullAndEmptyArrays: true } },
          { $group: { _id: { $ifNull: ['$d.name', 'Unassigned'] }, count: { $sum: 1 } } }
        ])
      ]);
      const byStatus = {};
      for (const row of byStatusAgg) {
        const key = apiStatus(row._id || 'inactive');
        byStatus[key] = (byStatus[key] || 0) + row.count;
      }
      payload.counts = {
        total: totalAll,
        byStatus,
        byDepartment: byDeptAgg.map((r) => ({ name: r._id, count: r.count }))
      };
    }

    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing staff', error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const staff = await Staff.findOne({
      _id: req.params.id,
      ...schoolBranchQuery(req)
    })
      .populate('departmentId', 'name')
      .populate('roleId', 'name')
      .lean();
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    const profile = await toProfile(staff);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching staff', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const body = req.body || {};
    const draft = !!body.draft;
    const verr = validateCreate(body, { draft });
    if (verr) {
      return res.status(400).json({ success: false, errors: verr });
    }

    const schoolId = adminSchoolId(req);
    let branchId = body.branchId;
    if (req.branchFilter?.branchId) {
      branchId = req.branchFilter.branchId;
    }
    if (!branchId) {
      return res.status(400).json({ success: false, errors: { branchId: ['branchId is required for school-level admin'] } });
    }
    if (
      req.branchFilter?.branchId &&
      String(branchId) !== String(req.branchFilter.branchId)
    ) {
      return res.status(403).json({ success: false, message: 'You can only create staff in your branch' });
    }

    const normalized = normalizeBodyForDb(body, { isCreate: true });
    if (!normalized.employeeId) {
      normalized.employeeId = await generateEmployeeId(schoolId);
    }

    await assertNoDuplicates(req, schoolId, branchId, normalized, null);

    if (normalized.reportingManagerId) {
      const mgr = await Staff.findOne({
        _id: normalized.reportingManagerId,
        schoolId,
        ...branchFilter(req)
      }).select('_id');
      if (!mgr) {
        return res.status(400).json({ success: false, errors: { reportingManagerId: ['Invalid reporting manager'] } });
      }
    }

    const { qualifications, experience } = body;
    delete normalized.id;

    const staff = await Staff.create({
      ...normalized,
      schoolId,
      branchId
    });

    await replaceQualifications(schoolId, staff._id, qualifications);
    await replaceExperience(schoolId, staff._id, experience);

    const full = await Staff.findById(staff._id)
      .populate('departmentId', 'name')
      .populate('roleId', 'name')
      .lean();
    const profile = await toProfile(full);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    if (error.code === 409) {
      const map = {
        DUPLICATE_EMAIL: 'Email already in use',
        DUPLICATE_PHONE: 'Mobile number already in use',
        DUPLICATE_LOGIN_EMAIL: 'Login email already in use'
      };
      return res.status(409).json({ success: false, message: map[error.message] || 'Conflict' });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate key' });
    }
    res.status(500).json({ success: false, message: 'Error creating staff', error: error.message });
  }
};

exports.patch = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const schoolId = adminSchoolId(req);
    const existing = await Staff.findOne({ _id: req.params.id, ...schoolBranchQuery(req) });
    if (!existing) return res.status(404).json({ success: false, message: 'Staff not found' });

    const body = req.body || {};
    const update = {};
    const normalized = normalizeBodyForDb(body, { isCreate: false });
    for (const [k, v] of Object.entries(normalized)) {
      if (PATCH_SCALAR_KEYS.has(k) && v !== undefined) {
        update[k] = v;
      }
    }

    if (Object.keys(update).length) {
      try {
        await assertNoDuplicates(req, schoolId, existing.branchId, { ...existing.toObject(), ...update }, existing._id);
      } catch (e) {
        if (e.code === 409) {
          return res.status(409).json({ success: false, message: 'Email, phone, or login email conflict' });
        }
        throw e;
      }
      if (update.reportingManagerId) {
        const rid = update.reportingManagerId;
        if (String(rid) === String(existing._id)) {
          return res.status(400).json({ success: false, errors: { reportingManagerId: ['Cannot report to self'] } });
        }
        const mgr = await Staff.findOne({ _id: rid, schoolId, ...branchFilter(req) }).select('_id');
        if (!mgr) {
          return res.status(400).json({ success: false, errors: { reportingManagerId: ['Invalid reporting manager'] } });
        }
      }
      Object.assign(existing, update);
      await existing.save();
    }

    if (Array.isArray(body.qualifications)) {
      await replaceQualifications(schoolId, existing._id, body.qualifications);
    }
    if (Array.isArray(body.experience)) {
      await replaceExperience(schoolId, existing._id, body.experience);
    }

    const full = await Staff.findById(existing._id)
      .populate('departmentId', 'name')
      .populate('roleId', 'name')
      .lean();
    const profile = await toProfile(full);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating staff', error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const schoolId = adminSchoolId(req);
    const staff = await Staff.findOneAndDelete({ _id: req.params.id, ...schoolBranchQuery(req) });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    await Promise.all([
      StaffDocument.deleteMany({ schoolId, staffId: staff._id }),
      StaffQualification.deleteMany({ schoolId, staffId: staff._id }),
      StaffExperience.deleteMany({ schoolId, staffId: staff._id })
    ]);
    res.json({ success: true, message: 'Staff deleted (hard delete)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting staff', error: error.message });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const staff = await Staff.findOne({ _id: req.params.id, ...schoolBranchQuery(req) });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'photo file required' });
    const rel = `/uploads/staff/photos/${req.file.filename}`;
    staff.photoUrl = rel;
    await staff.save();
    res.json({ success: true, data: { photoUrl: rel } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading photo', error: error.message });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const staff = await Staff.findOne({ _id: req.params.id, ...schoolBranchQuery(req) });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    if (staff.photoUrl && staff.photoUrl.startsWith('/uploads/')) {
      const fp = path.join(__dirname, '..', staff.photoUrl.replace(/^\//, ''));
      try {
        await fs.unlink(fp);
      } catch (_) {
        /* ignore */
      }
    }
    staff.photoUrl = '';
    await staff.save();
    res.json({ success: true, message: 'Photo removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing photo', error: error.message });
  }
};

exports.listDocuments = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const schoolId = adminSchoolId(req);
    const staff = await Staff.findOne({ _id: req.params.id, ...schoolBranchQuery(req) }).select('_id');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    const docs = await StaffDocument.find({ schoolId, staffId: staff._id }).lean();
    res.json({
      success: true,
      data: docs.map((d) => ({
        id: String(d._id),
        type: d.type,
        fileName: d.name,
        fileSize: d.fileSize,
        uploadedAt: formatIso(d.createdAt)
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing documents', error: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const schoolId = adminSchoolId(req);
    const staff = await Staff.findOne({ _id: req.params.id, ...schoolBranchQuery(req) }).select('_id');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'file is required' });
    const docType = req.body.type || 'Other';
    if (!DOC_TYPES.has(docType)) {
      return res.status(400).json({ success: false, message: `Invalid document type` });
    }
    const rel = `/uploads/staff/documents/${req.file.filename}`;
    const doc = await StaffDocument.create({
      schoolId,
      staffId: staff._id,
      name: req.file.originalname,
      type: docType,
      fileUrl: rel,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.admin._id
    });
    res.status(201).json({
      success: true,
      data: {
        id: String(doc._id),
        type: doc.type,
        fileName: doc.name,
        fileSize: doc.fileSize,
        uploadedAt: formatIso(doc.createdAt)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const schoolId = adminSchoolId(req);
    const doc = await StaffDocument.findOne({
      _id: req.params.documentId,
      schoolId,
      staffId: req.params.id
    }).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    if (!doc.fileUrl || !doc.fileUrl.startsWith('/uploads/')) {
      return res.status(404).json({ success: false, message: 'File not on server' });
    }
    const fp = path.join(__dirname, '..', doc.fileUrl.replace(/^\//, ''));
    res.download(fp, doc.name, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ success: false, message: 'File missing' });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error downloading document', error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    if (resolveSchool(req, res) == null) return;
    const schoolId = adminSchoolId(req);
    const doc = await StaffDocument.findOneAndDelete({
      _id: req.params.documentId,
      schoolId,
      staffId: req.params.id
    });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
      const fp = path.join(__dirname, '..', doc.fileUrl.replace(/^\//, ''));
      try {
        await fs.unlink(fp);
      } catch (_) {
        /* ignore */
      }
    }
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting document', error: error.message });
  }
};
