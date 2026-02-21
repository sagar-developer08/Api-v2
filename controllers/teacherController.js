const Teacher = require('../models/Teacher');
const AcademicYear = require('../models/AcademicYear');
const mongoose = require('mongoose');

const schoolAndBranchQuery = (req) => ({
  schoolId: req.admin.schoolId,
  ...(req.branchFilter || {})
});

// @desc    Get All Teachers
// @route   GET /api/academic/teachers
// @access  Private
exports.getAllTeachers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, academicYear } = req.query;
    const query = schoolAndBranchQuery(req);

    if (academicYear) {
      const academicYearDoc = await AcademicYear.findById(academicYear);
      if (academicYearDoc) {
        let endDate = academicYearDoc.endDate;
        if (!endDate && academicYearDoc.endYear) {
          endDate = new Date(`${academicYearDoc.endYear}-12-31`);
        }
        
        if (endDate) {
          query.joiningDate = { $lte: endDate };
        }
      }
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { designation: regex }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Teacher.countDocuments(query);
    const teachers = await Teacher.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get Teacher by ID
// @route   GET /api/academic/teachers/:id
// @access  Private
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.id, ...schoolAndBranchQuery(req) });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a Teacher
// @route   POST /api/academic/teachers
// @access  Private
exports.createTeacher = async (req, res) => {
  try {
    if (!req.body.branchId) {
      return res.status(400).json({ success: false, message: 'branchId is required' });
    }
    if (req.branchFilter && req.branchFilter.branchId && req.branchFilter.branchId.toString() !== req.body.branchId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only create teachers in your branch' });
    }
    req.body.schoolId = req.admin.schoolId;

    const teacher = await Teacher.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: teacher
    });
  } catch (error) {
    // Handle duplicate error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update Teacher
// @route   PUT /api/academic/teachers/:id
// @access  Private
exports.updateTeacher = async (req, res) => {
  try {
    let teacher = await Teacher.findOne({ _id: req.params.id, ...schoolAndBranchQuery(req) });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: teacher
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete Teacher
// @route   DELETE /api/academic/teachers/:id
// @access  Private
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.id, ...schoolAndBranchQuery(req) });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    await teacher.deleteOne();
    res.status(200).json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Teacher Metrics (Dashboard)
// @route   GET /api/academic/teachers/metrics
// @access  Private
exports.getTeacherMetrics = async (req, res) => {
  try {
    const schoolId = req.admin.schoolId;
    const { academicYear } = req.query;
    const matchQuery = { schoolId: new mongoose.Types.ObjectId(schoolId) };

    let refDate = new Date();

    if (academicYear) {
      const academicYearDoc = await AcademicYear.findById(academicYear);
      if (academicYearDoc) {
        let endDate = academicYearDoc.endDate;
        if (!endDate && academicYearDoc.endYear) {
          endDate = new Date(`${academicYearDoc.endYear}-12-31`);
        }
        
        if (endDate) {
          matchQuery.joiningDate = { $lte: endDate };
          if (endDate < refDate) {
            refDate = endDate;
          }
        }
      }
    }

    // Calculate the date 6 months ago from refDate
    const sixMonthsAgo = new Date(refDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [totalTeachers, byDepartment, joiningTrend] = await Promise.all([
      // Total count
      Teacher.countDocuments(matchQuery),

      // 1. Teachers by Department (designation)
      Teacher.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$designation', count: { $sum: 1 } } },
        { $project: { department: { $ifNull: ['$_id', 'Unassigned'] }, count: 1, _id: 0 } },
        { $sort: { department: 1 } }
      ]),

      // 2. Joining trend - last 6 months based on joiningDate
      Teacher.aggregate([
        { $match: { ...matchQuery, joiningDate: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$joiningDate' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Build the last 6 months labels with counts (fill missing months with 0)
    const joiningTrendMap = {};
    joiningTrend.forEach(m => { joiningTrendMap[m._id] = m.count; });

    const months = [];
    const now = refDate;
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      months.push({
        month: key,
        label,
        count: joiningTrendMap[key] || 0
      });
    }

    res.json({
      totalTeachers,
      teachersByDepartment: byDepartment,
      teachersByStatus: {
        active: totalTeachers,
        inactive: 0
      },
      joiningTrend: months
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
};

