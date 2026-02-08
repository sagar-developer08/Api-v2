const Teacher = require('../models/Teacher');
const mongoose = require('mongoose');

// @desc    Get All Teachers
// @route   GET /api/academic/teachers
// @access  Private
exports.getAllTeachers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = { schoolId: req.admin.schoolId };

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
    const teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.admin.schoolId });
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
    req.body.schoolId = req.admin.schoolId;

    // Check for duplicate email within the school (or globally if required, model says unique so likely global or school specific logic handled by indexing failure)
    // Model says email unique: true.

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
    let teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.admin.schoolId });
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
    const teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.admin.schoolId });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    await teacher.deleteOne();
    res.status(200).json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
