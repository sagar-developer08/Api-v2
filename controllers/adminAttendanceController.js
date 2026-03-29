/**
 * Admin attendance API (/admin/attendance/... and /schools/:schoolId/attendance/...).
 *
 * UI statuses: present | absent | late | excused | none (unmarked = no document).
 * DB may also store on-leave, half-day (students) or half_day, leave, early_exit (staff/teacher);
 * those are normalized to "excused" in API responses where appropriate.
 */

const mongoose = require('mongoose');
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const Section = require('../models/Section');
const Class = require('../models/Class');
const School = require('../models/School');
const Teacher = require('../models/Teacher');
const TeacherAttendance = require('../models/TeacherAttendance');
const Staff = require('../models/Staff');
const StaffAttendance = require('../models/StaffAttendance');

const API_STUDENT_STATUSES = new Set(['present', 'absent', 'late', 'excused', 'none']);

function adminSchoolId(req) {
  return req.admin.schoolId._id || req.admin.schoolId;
}

function resolveSchoolId(req, res) {
  const param = req.params.schoolId;
  const sid = adminSchoolId(req);
  if (param && String(param) !== String(sid)) {
    res.status(403).json({ success: false, message: 'School mismatch' });
    return null;
  }
  return sid;
}

function parseISODate(str) {
  if (!str || typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const d = new Date(`${str}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function utcDayBoundsFromISO(isoDate) {
  const d = parseISODate(isoDate);
  if (!d) return null;
  const start = new Date(d);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function eachDateInclusiveISO(fromStr, toStr) {
  const from = parseISODate(fromStr);
  const to = parseISODate(toStr);
  if (!from || !to || from > to) return [];
  const out = [];
  const cur = new Date(from);
  cur.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(0, 0, 0, 0);
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function isWeekendISO(isoDate) {
  const d = parseISODate(isoDate);
  if (!d) return false;
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

function validateMarkDate(isoDate, query) {
  const allowNonWorkingDay = query.allowNonWorkingDay === 'true' || query.allowWeekend === 'true';
  const allowFuture = query.allowFuture === 'true';
  if (!isoDate) return { ok: false, code: 400, message: 'date is required (YYYY-MM-DD)' };
  const d = parseISODate(isoDate);
  if (!d) return { ok: false, code: 400, message: 'Invalid date; use YYYY-MM-DD' };
  const endToday = new Date();
  endToday.setUTCHours(23, 59, 59, 999);
  if (!allowFuture && d > endToday) {
    return { ok: false, code: 400, message: 'Future-dated attendance is not allowed' };
  }
  if (!allowNonWorkingDay && isWeekendISO(isoDate)) {
    return { ok: false, code: 400, message: 'Date is not a school working day (weekend); pass allowNonWorkingDay=true to override' };
  }
  return { ok: true, date: d, bounds: utcDayBoundsFromISO(isoDate) };
}

function dbStudentStatusToApi(status) {
  if (status === 'on-leave' || status === 'half-day') return 'excused';
  return status;
}

function apiStudentStatusToDb(status) {
  if (status === 'none') return null;
  if (!API_STUDENT_STATUSES.has(status)) return undefined;
  return status;
}

function dbStaffLikeStatusToApi(status) {
  if (status === 'half_day' || status === 'leave' || status === 'early_exit') return 'excused';
  return status;
}

async function loadSectionForSchool(req, schoolId, classId, sectionId) {
  const filter = { _id: sectionId, schoolId, classId, ...req.branchFilter };
  const section = await Section.findOne(filter).lean();
  if (!section) return null;
  const cls = await Class.findOne({ _id: classId, schoolId, ...req.branchFilter }).lean();
  if (!cls) return null;
  return { section, class: cls };
}

async function rosterStudents(req, schoolId, classId, sectionId, academicYearId) {
  const filter = {
    schoolId,
    classId,
    sectionId,
    status: 'active',
    ...req.branchFilter
  };
  if (academicYearId) filter.academicYearId = academicYearId;
  return Student.find(filter)
    .select('firstName lastName rollNumber')
    .sort({ rollNumber: 1, firstName: 1 })
    .lean();
}

/** ---------- 3.1 Summary ---------- */
exports.getSummary = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) return;

    const {
      from,
      to,
      cohort = 'students',
      classId,
      academicYearId,
      granularity = 'day'
    } = req.query;

    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'Query params from and to are required (YYYY-MM-DD)' });
    }
    const fromD = parseISODate(from);
    const toD = parseISODate(to);
    if (!fromD || !toD || fromD > toD) {
      return res.status(400).json({ success: false, message: 'Invalid from/to date range' });
    }
    const toEnd = new Date(toD);
    toEnd.setUTCHours(23, 59, 59, 999);

    if (cohort === 'students') {
      const studentFilter = { schoolId, status: 'active', ...req.branchFilter };
      if (classId) studentFilter.classId = classId;
      if (academicYearId) studentFilter.academicYearId = academicYearId;
      const studentIds = await Student.find(studentFilter).distinct('_id');
      if (!studentIds.length) {
        return res.json({
          success: true,
          data: {
            cohort: 'students',
            granularity,
            from,
            to,
            classId: classId || null,
            academicYearId: academicYearId || null,
            series: []
          }
        });
      }

      const match = {
        schoolId,
        studentId: { $in: studentIds },
        date: { $gte: fromD, $lte: toEnd }
      };
      if (classId) match.classId = new mongoose.Types.ObjectId(classId);

      const raw = await StudentAttendance.aggregate([
        { $match: match },
        {
          $project: {
            day: {
              $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' }
            },
            status: 1
          }
        },
        {
          $group: {
            _id: '$day',
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
            excused: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$status',
                      ['excused', 'on-leave', 'half-day']
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            marked: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      let series = raw.map((row) => {
        const marked = row.marked || 0;
        const presentLike = row.present + row.late;
        const rate = marked > 0 ? Math.round((presentLike / marked) * 1000) / 10 : null;
        return {
          period: row._id,
          present: row.present,
          absent: row.absent,
          late: row.late,
          excused: row.excused,
          marked,
          attendanceRatePercent: rate
        };
      });

      if (granularity === 'month') {
        const byMonth = {};
        for (const row of series) {
          const m = row.period.slice(0, 7);
          if (!byMonth[m]) {
            byMonth[m] = { present: 0, absent: 0, late: 0, excused: 0, marked: 0 };
          }
          byMonth[m].present += row.present;
          byMonth[m].absent += row.absent;
          byMonth[m].late += row.late;
          byMonth[m].excused += row.excused;
          byMonth[m].marked += row.marked;
        }
        series = Object.keys(byMonth)
          .sort()
          .map((m) => {
            const b = byMonth[m];
            const presentLike = b.present + b.late;
            const rate = b.marked > 0 ? Math.round((presentLike / b.marked) * 1000) / 10 : null;
            return { period: m, ...b, attendanceRatePercent: rate };
          });
      }

      return res.json({
        success: true,
        data: {
          cohort: 'students',
          granularity,
          from,
          to,
          classId: classId || null,
          academicYearId: academicYearId || null,
          series
        }
      });
    }

    if (cohort === 'teachers') {
      const tf = { schoolId, status: 'active', ...req.branchFilter };
      const teacherIds = await Teacher.find(tf).distinct('_id');
      const match = {
        schoolId,
        ...(teacherIds.length ? { teacherId: { $in: teacherIds } } : {}),
        date: { $gte: fromD, $lte: toEnd }
      };
      const raw = await TeacherAttendance.aggregate([
        { $match: match },
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
            excused: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['excused', 'half_day', 'leave']] },
                  1,
                  0
                ]
              }
            },
            marked: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      const series = raw.map((row) => {
        const marked = row.marked || 0;
        const presentLike = row.present + row.late;
        const rate = marked > 0 ? Math.round((presentLike / marked) * 1000) / 10 : null;
        return {
          period: row._id,
          present: row.present,
          absent: row.absent,
          late: row.late,
          excused: row.excused,
          marked,
          attendanceRatePercent: rate
        };
      });
      return res.json({
        success: true,
        data: { cohort: 'teachers', granularity: 'day', from, to, series }
      });
    }

    if (cohort === 'staff') {
      const sf = { schoolId, status: 'active', ...req.branchFilter };
      const staffIds = await Staff.find(sf).distinct('_id');
      const match = {
        schoolId,
        ...(staffIds.length ? { staffId: { $in: staffIds } } : {}),
        date: { $gte: fromD, $lte: toEnd }
      };
      const raw = await StaffAttendance.aggregate([
        { $match: match },
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
            excused: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['excused', 'half_day', 'early_exit']] },
                  1,
                  0
                ]
              }
            },
            marked: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      const series = raw.map((row) => {
        const marked = row.marked || 0;
        const presentLike = row.present + row.late;
        const rate = marked > 0 ? Math.round((presentLike / marked) * 1000) / 10 : null;
        return {
          period: row._id,
          present: row.present,
          absent: row.absent,
          late: row.late,
          excused: row.excused,
          marked,
          attendanceRatePercent: rate
        };
      });
      return res.json({
        success: true,
        data: { cohort: 'staff', granularity: 'day', from, to, series }
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid cohort; use students, teachers, or staff'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error building attendance summary', error: error.message });
  }
};

/** ---------- 3.2 Matrix ---------- */
exports.getMatrix = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) return;

    const { classId, sectionId, from, to, academicYearId } = req.query;
    if (!classId || !sectionId || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'classId, sectionId, from, and to are required'
      });
    }

    const ctx = await loadSectionForSchool(req, schoolId, classId, sectionId);
    if (!ctx) {
      return res.status(404).json({ success: false, message: 'Class/section not found for this school' });
    }

    const students = await rosterStudents(req, schoolId, classId, sectionId, academicYearId);
    if (!students.length) {
      return res.status(404).json({ success: false, message: 'No active students in this section' });
    }

    const dates = eachDateInclusiveISO(from, to);
    if (!dates.length) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    const fromD = parseISODate(from);
    const toD = parseISODate(to);
    const toEnd = new Date(toD);
    toEnd.setUTCHours(23, 59, 59, 999);

    const rosterIds = students.map((s) => s._id);
    const records = await StudentAttendance.find({
      schoolId,
      classId,
      sectionId,
      studentId: { $in: rosterIds },
      date: { $gte: fromD, $lte: toEnd }
    })
      .select('studentId date status')
      .lean();

    const cells = {};
    for (const r of records) {
      const day = new Date(r.date).toISOString().slice(0, 10);
      const key = `${r.studentId}_${day}`;
      cells[key] = dbStudentStatusToApi(r.status);
    }

    res.json({
      success: true,
      data: {
        students: students.map((s) => ({
          id: s._id,
          name: [s.firstName, s.lastName].filter(Boolean).join(' ').trim(),
          rollNumber: s.rollNumber || ''
        })),
        dates,
        cells,
        saveStrategy: 'PUT /attendance/day replaces marks for roster students for that calendar day only'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error building attendance matrix', error: error.message });
  }
};

/** ---------- 3.3 Day GET / PUT ---------- */
exports.getDay = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) return;

    const { date, classId, sectionId, academicYearId } = req.query;
    if (!date || !classId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: 'date, classId, and sectionId are required'
      });
    }

    const ctx = await loadSectionForSchool(req, schoolId, classId, sectionId);
    if (!ctx) {
      return res.status(404).json({ success: false, message: 'Class/section not found for this school' });
    }

    const students = await rosterStudents(req, schoolId, classId, sectionId, academicYearId);
    if (!students.length) {
      return res.status(404).json({ success: false, message: 'No active students in this section' });
    }

    const bounds = utcDayBoundsFromISO(date);
    if (!bounds) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const rosterIds = students.map((s) => s._id);
    const records = await StudentAttendance.find({
      schoolId,
      studentId: { $in: rosterIds },
      date: { $gte: bounds.start, $lt: bounds.end }
    })
      .select('studentId status')
      .lean();

    const byStudent = Object.fromEntries(records.map((r) => [String(r.studentId), r.status]));

    const entries = students.map((s) => {
      const st = byStudent[String(s._id)];
      return {
        studentId: s._id,
        name: [s.firstName, s.lastName].filter(Boolean).join(' ').trim(),
        rollNumber: s.rollNumber || '',
        status: st ? dbStudentStatusToApi(st) : 'none'
      };
    });

    const school = await School.findById(schoolId).select('minAttendancePercentage').lean();

    res.json({
      success: true,
      data: {
        date,
        classId,
        sectionId,
        entries,
        policyMinAttendancePercentage: school?.minAttendancePercentage ?? null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading day attendance', error: error.message });
  }
};

/**
 * PUT .../attendance/day — idempotent replace for roster students on that date:
 * removes existing marks for roster members for the day, then inserts one row per entry with status !== none.
 */
exports.putDay = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) return;

    const { date, classId, sectionId, entries, academicYearId } = req.body || {};
    if (!date || !classId || !sectionId || !Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        message: 'Body must include date, classId, sectionId, and entries[]'
      });
    }

    const v = validateMarkDate(date, req.query);
    if (!v.ok) return res.status(v.code).json({ success: false, message: v.message });

    const ctx = await loadSectionForSchool(req, schoolId, classId, sectionId);
    if (!ctx) {
      return res.status(404).json({ success: false, message: 'Class/section not found for this school' });
    }

    const students = await rosterStudents(req, schoolId, classId, sectionId, academicYearId);
    if (!students.length) {
      return res.status(404).json({ success: false, message: 'No active students in this section' });
    }

    const rosterSet = new Set(students.map((s) => String(s._id)));
    for (const e of entries) {
      const sid = e.studentId != null ? String(e.studentId) : '';
      if (!rosterSet.has(sid)) {
        return res.status(400).json({
          success: false,
          message: `studentId ${e.studentId} is not in this section roster`
        });
      }
      const mapped = apiStudentStatusToDb(e.status);
      if (mapped === undefined) {
        return res.status(400).json({
          success: false,
          message: `Invalid status "${e.status}"; use present, absent, late, excused, or none`
        });
      }
    }

    const bounds = v.bounds;
    const rosterIds = students.map((s) => s._id);

    await StudentAttendance.deleteMany({
      schoolId,
      studentId: { $in: rosterIds },
      date: { $gte: bounds.start, $lt: bounds.end }
    });

    const lastByStudent = new Map();
    for (const e of entries) {
      lastByStudent.set(String(e.studentId), e);
    }
    const toInsert = [];
    for (const e of lastByStudent.values()) {
      const mapped = apiStudentStatusToDb(e.status);
      if (mapped === null) continue;
      toInsert.push({
        schoolId,
        studentId: e.studentId,
        classId,
        sectionId,
        date: bounds.start,
        status: mapped,
        markedBy: req.admin._id
      });
    }

    if (toInsert.length) {
      await StudentAttendance.insertMany(toInsert);
    }

    res.json({
      success: true,
      message: 'Attendance saved (replaced marks for roster students for this date)',
      data: { date, classId, sectionId, savedCount: toInsert.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving day attendance', error: error.message });
  }
};

function parseCsvIds(str) {
  if (!str || typeof str !== 'string') return [];
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function staffRoster(req, schoolId, { departmentId, staffIds }) {
  const filter = { schoolId, status: 'active', ...req.branchFilter };
  if (departmentId) filter.departmentId = departmentId;
  const ids = parseCsvIds(staffIds);
  if (ids.length) {
    const oids = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (!oids.length) return [];
    filter._id = { $in: oids };
  }
  return Staff.find(filter)
    .select('firstName lastName departmentId')
    .sort({ firstName: 1 })
    .lean();
}

async function teacherRoster(req, schoolId, { teacherIds }) {
  const filter = { schoolId, status: 'active', ...req.branchFilter };
  const ids = parseCsvIds(teacherIds);
  if (ids.length) {
    const oids = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (!oids.length) return [];
    filter._id = { $in: oids };
  }
  return Teacher.find(filter)
    .select('firstName lastName')
    .sort({ firstName: 1 })
    .lean();
}

const API_STAFF_STATUSES = new Set(['present', 'absent', 'late', 'excused', 'none']);

function apiStaffStatusToDb(status) {
  if (status === 'none') return null;
  if (!API_STAFF_STATUSES.has(status)) return undefined;
  return status;
}

/** ---------- 3.4 Staff / teacher day ---------- */
exports.getStaffDay = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) return;

    const { date, cohort = 'staff', departmentId, staffIds, teacherIds } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required' });
    }

    const bounds = utcDayBoundsFromISO(date);
    if (!bounds) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    if (cohort === 'teachers') {
      const roster = await teacherRoster(req, schoolId, { teacherIds });
      if (!roster.length) {
        return res.status(404).json({ success: false, message: 'No teachers matched filters' });
      }
      const ids = roster.map((t) => t._id);
      const records = await TeacherAttendance.find({
        schoolId,
        teacherId: { $in: ids },
        date: { $gte: bounds.start, $lt: bounds.end }
      })
        .select('teacherId status')
        .lean();
      const byId = Object.fromEntries(records.map((r) => [String(r.teacherId), r.status]));
      const entries = roster.map((t) => {
        const st = byId[String(t._id)];
        return {
          id: t._id,
          name: [t.firstName, t.lastName].filter(Boolean).join(' ').trim(),
          status: st ? dbStaffLikeStatusToApi(st) : 'none'
        };
      });
      return res.json({ success: true, data: { date, cohort: 'teachers', entries } });
    }

    const roster = await staffRoster(req, schoolId, { departmentId, staffIds });
    if (!roster.length) {
      return res.status(404).json({ success: false, message: 'No staff matched filters' });
    }
    const ids = roster.map((s) => s._id);
    const records = await StaffAttendance.find({
      schoolId,
      staffId: { $in: ids },
      date: { $gte: bounds.start, $lt: bounds.end }
    })
      .select('staffId status')
      .lean();
    const byId = Object.fromEntries(records.map((r) => [String(r.staffId), r.status]));
    const entries = roster.map((s) => {
      const st = byId[String(s._id)];
      return {
        id: s._id,
        name: [s.firstName, s.lastName].filter(Boolean).join(' ').trim(),
        status: st ? dbStaffLikeStatusToApi(st) : 'none'
      };
    });
    res.json({ success: true, data: { date, cohort: 'staff', entries } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading staff-day attendance', error: error.message });
  }
};

exports.putStaffDay = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) return;

    const { date, cohort = 'staff', entries, departmentId } = req.body || {};
    if (!date || !Array.isArray(entries)) {
      return res.status(400).json({ success: false, message: 'date and entries[] are required' });
    }

    const v = validateMarkDate(date, req.query);
    if (!v.ok) return res.status(v.code).json({ success: false, message: v.message });

    const bounds = v.bounds;

    if (cohort === 'teachers') {
      const teacherIds = [...new Set(entries.map((e) => e.teacherId || e.staffId || e.id).filter(Boolean))];
      if (!teacherIds.length) {
        return res.status(400).json({ success: false, message: 'Each entry needs teacherId (or id)' });
      }
      const tFilter = { _id: { $in: teacherIds }, schoolId, status: 'active', ...req.branchFilter };
      const found = await Teacher.find(tFilter).select('_id').lean();
      if (found.length !== teacherIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more teacherIds are invalid or not in your school/branch'
        });
      }
      for (const e of entries) {
        const mapped = apiStaffStatusToDb(e.status);
        if (mapped === undefined) {
          return res.status(400).json({ success: false, message: `Invalid status "${e.status}"` });
        }
      }
      await TeacherAttendance.deleteMany({
        schoolId,
        teacherId: { $in: teacherIds },
        date: { $gte: bounds.start, $lt: bounds.end }
      });
      const lastByT = new Map();
      for (const e of entries) {
        const tid = e.teacherId || e.staffId || e.id;
        lastByT.set(String(tid), e);
      }
      const docs = [];
      for (const e of lastByT.values()) {
        const mapped = apiStaffStatusToDb(e.status);
        if (mapped === null) continue;
        docs.push({
          schoolId,
          teacherId: e.teacherId || e.staffId || e.id,
          date: bounds.start,
          status: mapped
        });
      }
      if (docs.length) await TeacherAttendance.insertMany(docs);
      return res.json({
        success: true,
        message: 'Teacher attendance saved (replaced marks for listed IDs for this date)',
        data: { date, cohort: 'teachers', savedCount: docs.length }
      });
    }

    const staffIds = [...new Set(entries.map((e) => e.staffId || e.id).filter(Boolean))];
    if (!staffIds.length) {
      return res.status(400).json({ success: false, message: 'Each entry needs staffId (or id)' });
    }
    const sFilter = { _id: { $in: staffIds }, schoolId, status: 'active', ...req.branchFilter };
    if (departmentId) sFilter.departmentId = departmentId;
    const foundStaff = await Staff.find(sFilter).select('_id').lean();
    if (foundStaff.length !== staffIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more staffIds are invalid or do not match school/branch/department'
      });
    }
    for (const e of entries) {
      const mapped = apiStaffStatusToDb(e.status);
      if (mapped === undefined) {
        return res.status(400).json({ success: false, message: `Invalid status "${e.status}"` });
      }
    }
    await StaffAttendance.deleteMany({
      schoolId,
      staffId: { $in: staffIds },
      date: { $gte: bounds.start, $lt: bounds.end }
    });
    const lastByS = new Map();
    for (const e of entries) {
      const sid = e.staffId || e.id;
      lastByS.set(String(sid), e);
    }
    const docs = [];
    for (const e of lastByS.values()) {
      const mapped = apiStaffStatusToDb(e.status);
      if (mapped === null) continue;
      docs.push({
        schoolId,
        staffId: e.staffId || e.id,
        date: bounds.start,
        status: mapped
      });
    }
    if (docs.length) await StaffAttendance.insertMany(docs);
    res.json({
      success: true,
      message: 'Staff attendance saved (replaced marks for listed IDs for this date)',
      data: { date, cohort: 'staff', savedCount: docs.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving staff-day attendance', error: error.message });
  }
};

/** ---------- 3.5 Monthly report (table) ---------- */
exports.getMonthlyReport = async (req, res) => {
  try {
    const schoolId = resolveSchoolId(req, res);
    if (!schoolId) return;

    const { month, classId, sectionId, academicYearId } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Query param month is required (YYYY-MM)'
      });
    }
    if (!classId) {
      return res.status(400).json({ success: false, message: 'classId is required' });
    }

    const [y, m] = month.split('-').map(Number);
    const fromD = new Date(Date.UTC(y, m - 1, 1));
    const toD = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    const studentFilter = {
      schoolId,
      classId,
      status: 'active',
      ...req.branchFilter
    };
    if (sectionId) studentFilter.sectionId = sectionId;
    if (academicYearId) studentFilter.academicYearId = academicYearId;

    const students = await Student.find(studentFilter)
      .select('firstName lastName rollNumber sectionId')
      .sort({ rollNumber: 1, firstName: 1 })
      .lean();

    if (!students.length) {
      return res.status(404).json({ success: false, message: 'No students found for report' });
    }

    const ids = students.map((s) => s._id);
    const attFilter = {
      schoolId,
      classId,
      studentId: { $in: ids },
      date: { $gte: fromD, $lte: toD }
    };
    if (sectionId) attFilter.sectionId = sectionId;

    const records = await StudentAttendance.find(attFilter).select('studentId status').lean();

    const byStudent = {};
    for (const r of records) {
      const k = String(r.studentId);
      if (!byStudent[k]) {
        byStudent[k] = { present: 0, absent: 0, late: 0, excused: 0, marked: 0 };
      }
      byStudent[k].marked += 1;
      const apiS = dbStudentStatusToApi(r.status);
      if (apiS === 'present') byStudent[k].present += 1;
      else if (apiS === 'absent') byStudent[k].absent += 1;
      else if (apiS === 'late') byStudent[k].late += 1;
      else if (apiS === 'excused') byStudent[k].excused += 1;
    }

    const school = await School.findById(schoolId).select('minAttendancePercentage').lean();
    const rows = students.map((s) => {
      const b = byStudent[String(s._id)] || {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        marked: 0
      };
      const presentLike = b.present + b.late;
      const pct = b.marked > 0 ? Math.round((presentLike / b.marked) * 1000) / 10 : null;
      return {
        studentId: s._id,
        name: [s.firstName, s.lastName].filter(Boolean).join(' ').trim(),
        rollNumber: s.rollNumber || '',
        sectionId: s.sectionId,
        ...b,
        attendancePercentage: pct
      };
    });

    res.json({
      success: true,
      data: {
        month,
        classId,
        sectionId: sectionId || null,
        policyMinAttendancePercentage: school?.minAttendancePercentage ?? null,
        rows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error building monthly attendance report',
      error: error.message
    });
  }
};
