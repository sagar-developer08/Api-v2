const Branch = require('../models/Branch');
const AcademicYear = require('../models/AcademicYear');
const ReferenceAcademicYear = require('../models/ReferenceAcademicYear');
const School = require('../models/School');
const SchoolSettings = require('../models/SchoolSettings');

function adminSchoolId(req) {
  return req.admin.schoolId._id || req.admin.schoolId;
}

function assertSchoolScope(req) {
  const sid = adminSchoolId(req);
  if (req.params.schoolId && req.params.schoolId !== sid.toString()) {
    const err = new Error('Cross-tenant access denied');
    err.status = 403;
    throw err;
  }
  return sid;
}

async function ensureReferenceCatalogSeeded() {
  const n = await ReferenceAcademicYear.countDocuments();
  if (n > 0) return;
  const batch = [];
  for (let y = 2022; y <= 2030; y++) {
    batch.push({
      label: `${y}-${y + 1}`,
      startYear: y,
      endYear: y + 1,
      sortOrder: y - 2022,
      isActive: true
    });
  }
  await ReferenceAcademicYear.insertMany(batch);
}

function mapReferenceYear(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    label: o.label,
    startYear: o.startYear,
    endYear: o.endYear,
    startDate: o.startDate ? new Date(o.startDate).toISOString().slice(0, 10) : null,
    endDate: o.endDate ? new Date(o.endDate).toISOString().slice(0, 10) : null,
    sortOrder: o.sortOrder ?? 0,
    isActive: o.isActive !== false
  };
}

function schoolYearStatus(doc) {
  const s = doc.status || 'Active';
  if (s === 'Closed' || s === 'Inactive') return 'archived';
  return 'active';
}

function mapSchoolAcademicYear(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const ref = o.referenceAcademicYearId && typeof o.referenceAcademicYearId === 'object'
    ? o.referenceAcademicYearId
    : null;
  return {
    id: String(o._id),
    schoolId: String(o.schoolId),
    academicYearId: ref ? String(ref._id || ref) : (o.referenceAcademicYearId ? String(o.referenceAcademicYearId) : null),
    label: o.label || o.name || `${o.startYear}-${o.endYear}`,
    startYear: o.startYear,
    endYear: o.endYear,
    isDefault: !!(o.isDefault || o.isCurrent),
    startDate: o.startDate ? new Date(o.startDate).toISOString().slice(0, 10) : null,
    endDate: o.endDate ? new Date(o.endDate).toISOString().slice(0, 10) : null,
    status: schoolYearStatus(o),
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : undefined
  };
}

function mapBranch(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const isDef = !!(o.isMain || o.isDefault);
  return {
    _id: String(o._id),
    id: String(o._id),
    schoolId: String(o.schoolId),
    name: o.name,
    code: o.code || '',
    city: o.city || '',
    address: o.address || '',
    isMain: isDef,
    isDefault: isDef,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : undefined
  };
}

/** GET /api/v1/reference/academic-years */
exports.listReferenceAcademicYears = async (req, res) => {
  try {
    await ensureReferenceCatalogSeeded();
    const { isActive, region, country } = req.query;
    const filter = {};
    if (isActive === 'true' || isActive === true) filter.isActive = true;
    if (isActive === 'false') filter.isActive = false;
    if (region) filter.region = region;
    if (country) filter.country = country;
    const items = await ReferenceAcademicYear.find(filter).sort({ sortOrder: 1, startYear: -1 }).lean();
    res.json({
      success: true,
      data: { items: items.map(mapReferenceYear), total: items.length }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/** GET /api/v1/schools/:schoolId/branches */
exports.listSchoolBranches = async (req, res) => {
  try {
    const schoolId = assertSchoolScope(req);
    const school = await School.findById(schoolId).select('_id').lean();
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    const rows = await Branch.find({ schoolId }).sort({ name: 1 }).lean();
    const data = rows.map(mapBranch);
    res.json({ success: true, data });
  } catch (e) {
    const code = e.status || 500;
    res.status(code).json({ success: false, message: e.message || 'Error listing branches' });
  }
};

/** GET /api/v1/schools/:schoolId/academic-years */
exports.listSchoolAcademicYears = async (req, res) => {
  try {
    const schoolId = assertSchoolScope(req);
    const school = await School.findById(schoolId).select('_id').lean();
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    const { status } = req.query;
    const filter = { schoolId };
    if (status === 'active') {
      filter.status = { $nin: ['Closed', 'Inactive'] };
    } else if (status === 'archived') {
      filter.status = { $in: ['Closed', 'Inactive'] };
    }
    const rows = await AcademicYear.find(filter)
      .populate('referenceAcademicYearId', 'label startYear endYear')
      .sort({ startYear: -1 })
      .lean();
    const items = rows.map(mapSchoolAcademicYear);
    res.json({ success: true, data: { items, total: items.length } });
  } catch (e) {
    const code = e.status || 500;
    res.status(code).json({ success: false, message: e.message || 'Error listing academic years' });
  }
};

async function loadUiPreferences(schoolId) {
  const settings = await SchoolSettings.findOne({ schoolId }).lean();
  const p = settings?.uiPreferences || {};
  return {
    currentBranchId: p.currentBranchId ? String(p.currentBranchId) : null,
    currentAcademicYearId: p.currentAcademicYearId ? String(p.currentAcademicYearId) : null
  };
}

/** GET /api/v1/schools/:schoolId/context */
exports.getSchoolContext = async (req, res) => {
  try {
    const schoolId = assertSchoolScope(req);
    const school = await School.findById(schoolId).select('schoolName schoolCode').lean();
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    const [branchRows, yearRows, preferences] = await Promise.all([
      Branch.find({ schoolId }).sort({ name: 1 }).lean(),
      AcademicYear.find({ schoolId, status: { $nin: ['Closed', 'Inactive'] } })
        .populate('referenceAcademicYearId')
        .sort({ startYear: -1 })
        .lean(),
      loadUiPreferences(schoolId)
    ]);
    res.json({
      success: true,
      data: {
        schoolId: String(schoolId),
        branches: branchRows.map(mapBranch),
        academicYears: yearRows.map(mapSchoolAcademicYear),
        preferences
      }
    });
  } catch (e) {
    const code = e.status || 500;
    res.status(code).json({ success: false, message: e.message || 'Error loading context' });
  }
};

/** PATCH /api/v1/schools/:schoolId/preferences */
exports.patchSchoolPreferences = async (req, res) => {
  try {
    const schoolId = assertSchoolScope(req);
    const school = await School.findById(schoolId).select('_id').lean();
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    const { currentBranchId, currentAcademicYearId } = req.body || {};
    const set = {};
    if (currentBranchId !== undefined) {
      if (currentBranchId === null || currentBranchId === '') {
        set['uiPreferences.currentBranchId'] = null;
      } else {
        const br = await Branch.findOne({ _id: currentBranchId, schoolId });
        if (!br) return res.status(400).json({ success: false, message: 'Invalid currentBranchId for this school' });
        set['uiPreferences.currentBranchId'] = br._id;
      }
    }
    if (currentAcademicYearId !== undefined) {
      if (currentAcademicYearId === null || currentAcademicYearId === '') {
        set['uiPreferences.currentAcademicYearId'] = null;
      } else {
        const ay = await AcademicYear.findOne({ _id: currentAcademicYearId, schoolId });
        if (!ay) return res.status(400).json({ success: false, message: 'Invalid currentAcademicYearId for this school' });
        set['uiPreferences.currentAcademicYearId'] = ay._id;
      }
    }
    if (Object.keys(set).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }
    await SchoolSettings.findOneAndUpdate(
      { schoolId },
      { $set: set },
      { upsert: true, new: true }
    );
    const prefs = await loadUiPreferences(schoolId);
    res.json({ success: true, data: { preferences: prefs } });
  } catch (e) {
    const code = e.status || 500;
    res.status(code).json({ success: false, message: e.message || 'Error updating preferences' });
  }
};
