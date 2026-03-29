const mongoose = require('mongoose');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Staff = require('../models/Staff');

function adminSchoolId(req) {
  return req.admin.schoolId._id || req.admin.schoolId;
}

function resolveSchoolId(req) {
  const sid = adminSchoolId(req);
  if (req.params.schoolId && req.params.schoolId !== sid.toString()) {
    const err = new Error('Cross-tenant access denied');
    err.status = 403;
    throw err;
  }
  return sid;
}

function normalizeDeptCode(code) {
  if (code == null || String(code).trim() === '') return '';
  return String(code).replace(/\s+/g, '').toUpperCase();
}

function mapDepartment(doc) {
  if (!doc) return null;
  const o = doc._id ? (doc.toObject ? doc.toObject() : doc) : doc;
  return {
    id: String(o._id),
    name: o.name,
    code: normalizeDeptCode(o.code) || o.code,
    description: o.description ?? null,
    status: o.status === 'inactive' ? 'inactive' : 'active',
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined
  };
}

function mapDesignation(doc, deptName) {
  if (!doc) return null;
  const o = doc._id ? (doc.toObject ? doc.toObject() : doc) : doc;
  const dep = o.departmentId && typeof o.departmentId === 'object' ? o.departmentId : null;
  const dName = deptName || (dep && dep.name) || '';
  const dId = dep && dep._id ? String(dep._id) : o.departmentId ? String(o.departmentId) : '';
  return {
    id: String(o._id),
    name: o.name,
    departmentId: dId,
    departmentName: dName,
    department: dep ? { id: String(dep._id), name: dep.name } : undefined,
    level: o.level ?? o.levelLabel ?? o.hierarchyLevel ?? null,
    description: o.description ?? null,
    status: o.status === 'inactive' ? 'inactive' : 'active',
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined
  };
}

async function assertDepartmentCodeUnique(schoolId, code, excludeId) {
  const c = normalizeDeptCode(code);
  if (!c) return;
  const q = {
    schoolId,
    code: new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  };
  if (excludeId) q._id = { $ne: excludeId };
  const exists = await Department.findOne(q).select('_id').lean();
  if (exists) {
    const err = new Error('Department code already exists for this school');
    err.status = 400;
    throw err;
  }
}

// ---------- Departments ----------
exports.listDepartments = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req);
    const {
      search,
      status,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      pageSize = 10
    } = req.query;
    const filter = { schoolId };
    if (status === 'active' || status === 'inactive') {
      filter.status = status;
    }
    if (search && String(search).trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { code: rx }];
    }
    const sort = {};
    const dir = sortOrder === 'desc' ? -1 : 1;
    sort[sortBy === 'createdAt' ? 'createdAt' : 'name'] = dir;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10));
    const skip = (p - 1) * ps;
    const [rows, total] = await Promise.all([
      Department.find(filter).sort(sort).skip(skip).limit(ps).lean(),
      Department.countDocuments(filter)
    ]);
    const items = rows.map(mapDepartment);
    res.json({
      success: true,
      data: { items, total, page: p, pageSize: ps }
    });
  } catch (e) {
    const code = e.status || 500;
    res.status(code).json({ success: false, message: e.message || 'Error listing departments' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req);
    const { name, description, status: st } = req.body;
    const code = normalizeDeptCode(req.body.code);
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    if (!code) {
      return res.status(400).json({ success: false, message: 'code is required; use uppercase letters, numbers, hyphens — no spaces' });
    }
    if (/\s/.test(String(req.body.code || ''))) {
      return res.status(400).json({ success: false, message: 'code must not contain spaces' });
    }
    await assertDepartmentCodeUnique(schoolId, code);
    const status = st === 'inactive' ? 'inactive' : 'active';
    const doc = await Department.create({
      schoolId,
      branchId: null,
      name: name.trim(),
      code,
      description: description != null ? String(description).trim() || null : null,
      status
    });
    res.status(201).json({ success: true, data: mapDepartment(doc) });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate department code' });
    }
    const code = e.status || 500;
    res.status(code).json({ success: false, message: e.message || 'Error creating department' });
  }
};

exports.patchDepartment = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req);
    const id = req.params.departmentId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const existing = await Department.findOne({ _id: id, schoolId });
    if (!existing) return res.status(404).json({ success: false, message: 'Department not found' });
    const updates = {};
    if (req.body.name != null) updates.name = String(req.body.name).trim();
    if (req.body.description !== undefined) {
      updates.description = req.body.description == null ? null : String(req.body.description).trim() || null;
    }
    if (req.body.status != null) {
      updates.status = req.body.status === 'inactive' ? 'inactive' : 'active';
    }
    if (req.body.code != null) {
      const code = normalizeDeptCode(req.body.code);
      if (!code) {
        return res.status(400).json({ success: false, message: 'code cannot be empty' });
      }
      if (/\s/.test(String(req.body.code))) {
        return res.status(400).json({ success: false, message: 'code must not contain spaces' });
      }
      await assertDepartmentCodeUnique(schoolId, code, existing._id);
      updates.code = code;
    }
    const doc = await Department.findOneAndUpdate({ _id: id, schoolId }, { $set: updates }, { new: true });
    res.json({ success: true, data: mapDepartment(doc) });
  } catch (e) {
    const code = e.status || 500;
    res.status(code).json({ success: false, message: e.message || 'Error updating department' });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req);
    const id = req.params.departmentId;
    const existing = await Department.findOne({ _id: id, schoolId });
    if (!existing) return res.status(404).json({ success: false, message: 'Department not found' });
    const [desCount, staffCount] = await Promise.all([
      Designation.countDocuments({ schoolId, departmentId: id }),
      Staff.countDocuments({ schoolId, departmentId: id })
    ]);
    if (desCount > 0 || staffCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete department: designations or staff still reference it'
      });
    }
    await Department.deleteOne({ _id: id, schoolId });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || 'Error deleting department' });
  }
};

// ---------- Designations ----------
exports.listDesignations = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req);
    const {
      search,
      departmentId,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      pageSize = 10
    } = req.query;
    const filter = { schoolId };
    if (departmentId) filter.departmentId = departmentId;
    if (req.query.status === 'active' || req.query.status === 'inactive') {
      filter.status = req.query.status;
    }
    if (search && String(search).trim()) {
      filter.name = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    const sort = {};
    const dir = sortOrder === 'desc' ? -1 : 1;
    sort[sortBy === 'createdAt' ? 'createdAt' : 'name'] = dir;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10));
    const skip = (p - 1) * ps;
    const [rows, total] = await Promise.all([
      Designation.find(filter).populate('departmentId', 'name').sort(sort).skip(skip).limit(ps).lean(),
      Designation.countDocuments(filter)
    ]);
    const items = rows.map((r) => mapDesignation(r));
    res.json({ success: true, data: { items, total, page: p, pageSize: ps } });
  } catch (e) {
    const code = e.status || 500;
    res.status(code).json({ success: false, message: e.message || 'Error listing designations' });
  }
};

exports.createDesignation = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req);
    const { name, departmentId, level, description, status: st } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    if (!departmentId) {
      return res.status(400).json({ success: false, message: 'departmentId is required' });
    }
    const dept = await Department.findOne({ _id: departmentId, schoolId }).lean();
    if (!dept) {
      return res.status(400).json({ success: false, message: 'departmentId not found for this school' });
    }
    if (dept.status === 'inactive') {
      return res.status(400).json({ success: false, message: 'Cannot link to an inactive department' });
    }
    const status = st === 'inactive' ? 'inactive' : 'active';
    const doc = await Designation.create({
      schoolId,
      departmentId,
      name: name.trim(),
      level: level != null ? String(level).trim() || null : null,
      description: description != null ? String(description).trim() || null : null,
      status
    });
    const populated = await Designation.findById(doc._id).populate('departmentId', 'name').lean();
    res.status(201).json({ success: true, data: mapDesignation(populated) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || 'Error creating designation' });
  }
};

exports.patchDesignation = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req);
    const id = req.params.designationId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const existing = await Designation.findOne({ _id: id, schoolId });
    if (!existing) return res.status(404).json({ success: false, message: 'Designation not found' });
    const updates = {};
    if (req.body.name != null) updates.name = String(req.body.name).trim();
    if (req.body.level !== undefined) {
      updates.level = req.body.level == null ? null : String(req.body.level).trim() || null;
    }
    if (req.body.description !== undefined) {
      updates.description = req.body.description == null ? null : String(req.body.description).trim() || null;
    }
    if (req.body.status != null) {
      updates.status = req.body.status === 'inactive' ? 'inactive' : 'active';
    }
    if (req.body.departmentId != null) {
      const dept = await Department.findOne({ _id: req.body.departmentId, schoolId }).lean();
      if (!dept) {
        return res.status(400).json({ success: false, message: 'departmentId not found for this school' });
      }
      if (dept.status === 'inactive') {
        return res.status(400).json({ success: false, message: 'Cannot link to an inactive department' });
      }
      updates.departmentId = req.body.departmentId;
    }
    const doc = await Designation.findOneAndUpdate({ _id: id, schoolId }, { $set: updates }, { new: true })
      .populate('departmentId', 'name')
      .lean();
    res.json({ success: true, data: mapDesignation(doc) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || 'Error updating designation' });
  }
};

exports.deleteDesignation = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req);
    const id = req.params.designationId;
    const existing = await Designation.findOne({ _id: id, schoolId }).lean();
    if (!existing) return res.status(404).json({ success: false, message: 'Designation not found' });
    const byId = await Staff.countDocuments({ schoolId, designationId: id });
    const byName =
      existing.name &&
      (await Staff.countDocuments({
        schoolId,
        designation: new RegExp(`^${String(existing.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      }));
    if (byId > 0 || byName > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete designation: staff records still reference it'
      });
    }
    await Designation.deleteOne({ _id: id, schoolId });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || 'Error deleting designation' });
  }
};
