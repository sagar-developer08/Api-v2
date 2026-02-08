const Student = require('../models/Student');
// const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Guardian = require('../models/Guardian');
const AcademicYear = require('../models/AcademicYear');
const mongoose = require('mongoose');

// --- Students ---

// @desc    Get all students (with pagination, filtering, search)
// @route   GET /api/academic/students
// @access  Private
exports.getAllStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      classId,
      sectionId,
      status,
      academicYear, // This is an ID filter in our case, or could be a label join
      sortBy = 'firstName',
      sortOrder = 'asc'
    } = req.query;

    const query = { schoolId: req.admin.schoolId };

    // Filtering
    if (classId) query.classId = classId;
    if (sectionId) query.sectionId = sectionId;
    if (status) query.status = status;
    if (academicYear) query.academicYearId = academicYear;

    // Search (Regex for simple implementation)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
        { admissionNumber: searchRegex }
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions = {};
    const order = sortOrder === 'desc' ? -1 : 1;
    sortOptions[sortBy] = order;

    // Execute Query
    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('academicYearId', 'label')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Transform response to match requirements format
    const transformedData = students.map(student => ({
      id: student._id,
      studentId: student.studentId || '', // Check if this field is populated
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      avatar: student.avatar,
      className: student.classId?.name,
      classId: student.classId?._id,
      sectionName: student.sectionId?.name,
      sectionId: student.sectionId?._id,
      rollNumber: student.rollNumber,
      status: student.status,
      admissionDate: student.admissionDate,
      academicYear: student.academicYearId?.label,
      address: student.address
    }));

    res.status(200).json({
      success: true, 
      count: students.length,
      data: transformedData,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum * limitNum < total,
      hasPrev: pageNum > 1
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get Student by ID
// @route   GET /api/academic/students/:id
// @access  Private
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, schoolId: req.admin.schoolId })
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('academicYearId', 'label');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const response = {
      id: student._id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      email: student.email,
      phone: student.phone,
      alternatePhone: student.alternatePhone,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      aadhaarNumber: student.aadhaarNumber,
      avatar: student.avatar,
      className: student.classId?.name,
      classId: student.classId?._id,
      sectionName: student.sectionId?.name,
      sectionId: student.sectionId?._id,
      rollNumber: student.rollNumber,
      status: student.status,
      admissionDate: student.admissionDate,
      admissionNumber: student.admissionNumber,
      academicYear: student.academicYearId?.label,
      address: student.address,
      communicationAddress: student.communicationAddress,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a student
// @route   POST /api/academic/students
// @access  Private
exports.createStudent = async (req, res) => {
  try {
    req.body.schoolId = req.admin.schoolId;

    // Auto-generate studentId if not provided could be done here or pre-save hook
    // For now assuming passed in body or generated

    const student = await Student.create(req.body);

    res.status(201).json({
      success: true,
      id: student._id,
      studentId: student.studentId,
      message: 'Student created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update Student
// @route   PUT/PATCH /api/academic/students/:id
// @access  Private
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findOne({ _id: req.params.id, schoolId: req.admin.schoolId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      id: student._id,
      message: 'Student updated successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete Student
// @route   DELETE /api/academic/students/:id
// @access  Private
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, schoolId: req.admin.schoolId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await student.deleteOne();
    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Student Statistics
// @route   GET /api/academic/students/statistics
// @access  Private
exports.getStudentStatistics = async (req, res) => {
  try {
    const { academicYear, classId } = req.query;
    const matchStage = { schoolId: req.admin.schoolId };

    if (academicYear) matchStage.academicYearId = new mongoose.Types.ObjectId(academicYear);
    if (classId) matchStage.classId = new mongoose.Types.ObjectId(classId);

    const totalStudents = await Student.countDocuments(matchStage);
    const activeStudents = await Student.countDocuments({ ...matchStage, status: 'active' });
    const inactiveStudents = await Student.countDocuments({ ...matchStage, status: 'inactive' });
    const graduatedStudents = await Student.countDocuments({ ...matchStage, status: 'graduated' });
    const transferredStudents = await Student.countDocuments({ ...matchStage, status: 'transferred' });

    // New students counts (this month/last month)
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const newStudentsThisMonth = await Student.countDocuments({
      ...matchStage,
      createdAt: { $gte: firstDayThisMonth }
    });

    const newStudentsLastMonth = await Student.countDocuments({
      ...matchStage,
      createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth }
    });

    // Group by Class
    const byClass = await Student.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$classId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: '_id',
          as: 'classData'
        }
      },
      { $unwind: '$classData' },
      {
        $project: {
          classId: '$_id',
          className: '$classData.name',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Admission Trend (Last 6 months simplified)
    // Complex aggregation omitted for brevity, can implement if rigorously needed.

    res.status(200).json({
      totalStudents,
      activeStudents,
      inactiveStudents,
      graduatedStudents,
      transferredStudents,
      newStudentsThisMonth,
      newStudentsLastMonth,
      byClass,
      byStatus: {
        active: activeStudents,
        inactive: inactiveStudents,
        graduated: graduatedStudents,
        transferred: transferredStudents
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Student Guardians ---

// @desc    Get Student Guardians
// @route   GET /api/academic/students/:id/guardians
// @access  Private
exports.getStudentGuardians = async (req, res) => {
  try {
    const guardians = await Guardian.find({
      studentId: req.params.id,
      schoolId: req.admin.schoolId
    });

    // Formatting response to match spec
    const formattedGuardians = guardians.map(g => ({
      id: g._id,
      studentId: g.studentId,
      type: g.type,
      name: g.name,
      relationship: g.relationship,
      phone: g.phone,
      email: g.email,
      address: g.address,
      occupation: g.occupation,
      qualification: g.qualification,
      income: g.income,
      isPrimary: g.isPrimary,
      isEmergencyContact: g.isEmergencyContact,
      createdAt: g.createdAt
    }));

    res.status(200).json({ guardians: formattedGuardians });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add Guardian
// @route   POST /api/academic/students/:id/guardians
// @access  Private
exports.addGuardian = async (req, res) => {
  try {
    const { id } = req.params;
    // Verify student exists and belongs to school
    const student = await Student.findOne({ _id: id, schoolId: req.admin.schoolId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const guardianMsg = await Guardian.create({
      ...req.body,
      studentId: id,
      schoolId: req.admin.schoolId
    });

    res.status(201).json({
      id: guardianMsg._id,
      message: 'Guardian added successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// --- Teachers ---
// Moved to teacherController.js

// --- Sections ---

// @desc    Get all sections
// @route   GET /api/academic/sections
// @access  Private
exports.getAllSections = async (req, res) => {
  try {
    const sections = await Section.find({ schoolId: req.admin.schoolId });

    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create a section
// @route   POST /api/academic/sections
// @access  Private
exports.createSection = async (req, res) => {
  try {
    req.body.schoolId = req.admin.schoolId;
    const section = await Section.create(req.body);

    res.status(201).json({
      success: true,
      data: section
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// --- Subjects ---

// @desc    Get all subjects
// @route   GET /api/academic/subjects
// @access  Private
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ schoolId: req.admin.schoolId });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create a subject
// @route   POST /api/academic/subjects
// @access  Private
exports.createSubject = async (req, res) => {
  try {
    req.body.schoolId = req.admin.schoolId;
    const subject = await Subject.create(req.body);

    res.status(201).json({
      success: true,
      data: subject
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
