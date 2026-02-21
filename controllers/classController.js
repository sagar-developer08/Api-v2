const Section = require('../models/Section');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const AcademicYear = require('../models/AcademicYear');
const mongoose = require('mongoose');

const schoolAndBranchQuery = (req) => ({
  schoolId: req.admin.schoolId,
  ...(req.branchFilter || {})
});

// @desc    Get All Classes
// @route   GET /api/academic/classes
// @access  Private
exports.getAllClasses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      grade,
      academicYear,
      status,
      teacherId,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const query = schoolAndBranchQuery(req);

    if (grade) query.grade = grade;
    if (status) query.status = status;
    if (teacherId) query.teacherId = teacherId;
    if (academicYear) query.academicYearId = academicYear; // Assuming Filter sends ID or handle logic

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { code: regex }, { grade: regex }];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const total = await Class.countDocuments(query);
    const classes = await Class.find(query)
      .populate('teacherId', 'firstName lastName')
      .populate('academicYearId', 'label')
      .populate('subjects.subjectId', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Populate student counts manually or via aggregation for better performance
    // For now, simpler map
    const data = await Promise.all(classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({ classId: cls._id, ...schoolAndBranchQuery(req) });
        return {
            id: cls._id,
            name: cls.name,
            code: cls.code,
            grade: cls.grade,
            section: cls.section,
            academicYear: cls.academicYearId?.label,
            teacherId: cls.teacherId?._id,
            teacherName: cls.teacherId ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}` : null,
            studentCount,
            maxStudents: cls.maxStudents,
            subjects: cls.subjects ? cls.subjects.map(s => s.subjectId?.name).filter(name => name) : [], 
            status: cls.status,
            isArchived: cls.isArchived,
            roomNumber: cls.roomNumber,
            description: cls.description,
            startTime: cls.startTime,
            endTime: cls.endTime,
            weeklyOffDay: cls.weeklyOffDay,
            workingDays: cls.workingDays,
            createdAt: cls.createdAt,
            updatedAt: cls.updatedAt
        };
    }));

    res.status(200).json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum * limitNum < total,
      hasPrev: pageNum > 1
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Class by ID
// @route   GET /api/academic/classes/:id
// @access  Private
exports.getClassById = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, ...schoolAndBranchQuery(req) })
      .populate('teacherId', 'firstName lastName')
      .populate('academicYearId', 'label')
      .populate('subjects.subjectId', 'name code')
      .populate('subjects.teacherId', 'firstName lastName');

    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const studentCount = await Student.countDocuments({ classId: cls._id });

    const response = {
        id: cls._id,
        name: cls.name,
        code: cls.code,
        grade: cls.grade,
        section: cls.section,
        academicYear: cls.academicYearId?.label,
        teacherId: cls.teacherId?._id,
        teacherName: cls.teacherId ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}` : null,
        studentCount,
        maxStudents: cls.maxStudents,
        subjects: cls.subjects.map(s => ({
          id: s.subjectId?._id,
          name: s.subjectId?.name,
          code: s.subjectId?.code,
          type: s.type,
          teacher: s.teacherId ? {
            id: s.teacherId._id,
            name: `${s.teacherId.firstName} ${s.teacherId.lastName}`
          } : null
        })),
        status: cls.status,
        isArchived: cls.isArchived,
        roomNumber: cls.roomNumber,
        description: cls.description,
        startTime: cls.startTime,
        endTime: cls.endTime,
        weeklyOffDay: cls.weeklyOffDay,
        workingDays: cls.workingDays,
        schedule: cls.schedule || [],
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt
    };

    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Class
// @route   POST /api/academic/classes
// @access  Private
exports.createClass = async (req, res) => {
  try {
    const branchId = req.body.branchId;
    if (!branchId) {
      return res.status(400).json({ success: false, message: 'branchId is required' });
    }
    if (req.branchFilter && req.branchFilter.branchId && req.branchFilter.branchId.toString() !== branchId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only create classes in your branch' });
    }
    req.body.schoolId = req.admin.schoolId;
    req.body.branchId = branchId;

    // Handle 'subjects' if passed as array of strings (names) or IDs
    if (req.body.subjects && Array.isArray(req.body.subjects) && req.body.subjects.length > 0) {
       const processedSubjects = [];
       const subjectQuery = { schoolId: req.admin.schoolId, branchId };
       // Get all subjects that match the names provided (if they are names)
       const subjectNames = req.body.subjects.filter(s => !mongoose.isValidObjectId(s));
       const subjectIds = req.body.subjects.filter(s => mongoose.isValidObjectId(s));
       
       subjectIds.forEach(id => processedSubjects.push({ subjectId: id }));

       if (subjectNames.length > 0) {
          const foundSubjects = await Subject.find({
              ...subjectQuery,
              name: { $in: subjectNames.map(n => new RegExp(`^${n}$`, 'i')) }
          });

          foundSubjects.forEach(sub => processedSubjects.push({ subjectId: sub._id }));

          const foundNamesLowerCase = foundSubjects.map(s => s.name.toLowerCase());
          const missingNames = subjectNames.filter(name => !foundNamesLowerCase.includes(name.toLowerCase()));

          if (missingNames.length > 0) {
              const newSubjectsData = missingNames.map(name => ({
                  schoolId: req.admin.schoolId,
                  branchId,
                  name: name,
                  code: name.substring(0, 3).toUpperCase(),
                  type: 'Theory'
              }));
              const createdSubjects = await Subject.insertMany(newSubjectsData);
              createdSubjects.forEach(sub => processedSubjects.push({ subjectId: sub._id }));
          }
       }

       req.body.subjects = processedSubjects;
    }

    const cls = await Class.create(req.body);
    res.status(201).json({ id: cls._id, message: 'Class created successfully' });
  } catch (error) {
    // Better error message for casting issues
    if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: error.message, details: error.errors });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update Class
// @route   PUT /api/academic/classes/:id
// @access  Private
exports.updateClass = async (req, res) => {
  try {
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, ...schoolAndBranchQuery(req) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.status(200).json({ id: cls._id, message: 'Class updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete Class
// @route   DELETE /api/academic/classes/:id
// @access  Private
exports.deleteClass = async (req, res) => {
  try {
    const cls = await Class.findOneAndDelete({ _id: req.params.id, ...schoolAndBranchQuery(req) });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Archive Class
// @route   PUT /api/academic/classes/:id/archive
// @access  Private
exports.archiveClass = async (req, res) => {
  try {
    const { isArchived } = req.body;
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, ...schoolAndBranchQuery(req) },
      { isArchived, status: isArchived ? 'archived' : 'active' },
      { new: true }
    );
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.status(200).json({ id: cls._id, isArchived: cls.isArchived, message: 'Class archived successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get Class Statistics
// @route   GET /api/academic/classes/statistics/stats
// @access  Private
exports.getClassStatistics = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const query = schoolAndBranchQuery(req);
    if (academicYear) query.academicYearId = academicYear;

    const totalClasses = await Class.countDocuments(query);
    const activeClasses = await Class.countDocuments({ ...query, status: 'active' });
    const archivedClasses = await Class.countDocuments({ ...query, status: 'archived' });
    
    // Total students across all matching classes
    const classes = await Class.find(query).select('_id');
    const classIds = classes.map(c => c._id);
    const totalStudents = await Student.countDocuments({ classId: { $in: classIds } });
    
    const averageStudentsPerClass = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;

    // By Grade
    const byGrade = await Class.aggregate([
      { $match: query },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $project: { grade: '$_id', count: 1, _id: 0 } }
    ]);

    res.status(200).json({
      totalClasses,
      activeClasses,
      archivedClasses,
      totalStudents,
      averageStudentsPerClass,
      byGrade,
      capacityUtilization: {
          average: 0, // Implement if needed
          overCapacity: 0,
          underCapacity: 0
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign Class Teacher
// @route   PUT /api/academic/classes/:id/teacher
// @access  Private
exports.assignClassTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, ...schoolAndBranchQuery(req) },
      { teacherId },
      { new: true }
    ).populate('teacherId', 'firstName lastName');

    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    
    res.status(200).json({
      id: cls._id,
      teacherId: cls.teacherId._id,
      teacherName: `${cls.teacherId.firstName} ${cls.teacherId.lastName}`,
      message: 'Class teacher assigned successfully'
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// --- Overview Tab ---

// @desc    Get Class Overview Metrics
// @route   GET /api/academic/classes/:id/overview
// @access  Private
exports.getClassOverview = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id)
       .populate('teacherId');
    if(!cls) return res.status(404).json({message: 'Class not found'});
    
    const studentCount = await Student.countDocuments({classId: cls._id});
    const subjectsCount = await Subject.countDocuments(schoolAndBranchQuery(req)); // Simplified

    const occupied = studentCount;
    const totalCap = cls.maxStudents || 50;
    const percentage = Math.round((occupied / totalCap) * 100);

    res.status(200).json({
      classTeacher: cls.teacherId ? {
        id: cls.teacherId._id,
        name: `${cls.teacherId.firstName} ${cls.teacherId.lastName}`,
        email: cls.teacherId.email,
        avatar: null
      } : null,
      totalStudents: studentCount,
      totalSubjects: subjectsCount,
      classCapacity: {
        total: totalCap,
        occupied,
        available: totalCap - occupied,
        percentage
      },
      attendancePercentage: 0 // Placeholder
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

// @desc    Get Class Subjects
// @route   GET /api/academic/classes/:id/subjects
// @access  Private
exports.getClassSubjects = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate('subjects.subjectId', 'name code')
      .populate('subjects.teacherId', 'firstName lastName email avatar');
    
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const subjects = cls.subjects.map(s => ({
      id: s.subjectId?._id,
      name: s.subjectId?.name,
      code: s.subjectId?.code,
      type: s.type,
      teacher: s.teacherId ? {
        id: s.teacherId._id,
        name: `${s.teacherId.firstName} ${s.teacherId.lastName}`,
        email: s.teacherId.email,
        avatar: s.teacherId.avatar
      } : null,
      assignedAt: s.assignedAt
    }));

    res.status(200).json({ subjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add Subject to Class
exports.addSubjectToClass = async (req, res) => {
  try {
    const { subjectId, type, teacherId } = req.body;
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    // Check if already exists
    if (cls.subjects.some(s => s.subjectId.toString() === subjectId)) {
      return res.status(400).json({ message: 'Subject already added to class' });
    }

    cls.subjects.push({ subjectId, type, teacherId });
    await cls.save();

    // Populate for response
    await cls.populate([
      { path: 'subjects.subjectId', select: 'name code' },
      { path: 'subjects.teacherId', select: 'firstName lastName' }
    ]);

    const added = cls.subjects[cls.subjects.length - 1];
    res.status(201).json({
      success: true,
      message: 'Subject added successfully',
      subject: {
        id: added.subjectId._id,
        name: added.subjectId.name,
        code: added.subjectId.code,
        type: added.type,
        teacher: added.teacherId ? {
          id: added.teacherId._id,
          name: `${added.teacherId.firstName} ${added.teacherId.lastName}`
        } : null
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Assign Teacher to Subject
exports.assignSubjectTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const { id, subjectId } = req.params;

    const cls = await Class.findOneAndUpdate(
      { _id: id, "subjects.subjectId": subjectId },
      { $set: { "subjects.$.teacherId": teacherId } },
      { new: true }
    ).populate('subjects.teacherId', 'firstName lastName email');

    if (!cls) return res.status(404).json({ message: 'Class or Subject not found' });

    const updatedSubject = cls.subjects.find(s => s.subjectId.toString() === subjectId);
    
    res.status(200).json({
      success: true,
      message: 'Teacher assigned successfully',
      subject: {
        id: updatedSubject.subjectId,
        teacher: updatedSubject.teacherId ? {
          id: updatedSubject.teacherId._id,
          name: `${updatedSubject.teacherId.firstName} ${updatedSubject.teacherId.lastName}`,
          email: updatedSubject.teacherId.email
        } : null
      }
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update Subject Type
exports.updateSubjectType = async (req, res) => {
  try {
    const { type } = req.body;
    const { id, subjectId } = req.params;

    const cls = await Class.findOneAndUpdate(
      { _id: id, "subjects.subjectId": subjectId },
      { $set: { "subjects.$.type": type } },
      { new: true }
    );

    if (!cls) return res.status(404).json({ message: 'Class or Subject not found' });

    res.status(200).json({
      success: true,
      message: 'Subject type updated',
      subject: { id: subjectId, type }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove Subject from Class
exports.removeSubjectFromClass = async (req, res) => {
  try {
    const { id, subjectId } = req.params;
    const cls = await Class.findByIdAndUpdate(
      id,
      { $pull: { subjects: { subjectId: subjectId } } },
      { new: true }
    );
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.status(200).json({ success: true, message: 'Subject removed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get Available Teachers (for subjects)
exports.getAvailableTeachers = async (req, res) => {
  try {
     const Teacher = require('../models/Teacher');
     const { subjectId } = req.query;
     const query = { ...schoolAndBranchQuery(req), status: 'active' };
     // Add subject filtering logic if Teacher model supports 'specialization' or similar
     const teachers = await Teacher.find(query).select('firstName lastName email avatar subjects'); // Assuming subjects in teacher model
     
     res.status(200).json({
       data: teachers.map(t => ({
         id: t._id,
         firstName: t.firstName,
         lastName: t.lastName,
         email: t.email,
         avatar: t.avatar,
         subjects: t.subjects // Assuming array of strings or subject Ids
       }))
     });
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
};

// @desc    Get Top Students
// @route   GET /api/academic/classes/:id/students/rankings
// @access  Private
exports.getClassRankings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const students = await Student.find({classId: req.params.id})
      .limit(limit)
      .lean(); // Add logic for marks if available

      res.status(200).json({
        students: students.map((s, i) => ({
             id: s._id,
             firstName: s.firstName,
             lastName: s.lastName,
             rollNumber: s.rollNumber,
             avatar: s.avatar,
             totalMarks: 0,
             percentage: 0,
             rank: i + 1
        }))
      });
  } catch (error) {
      res.status(500).json({message: error.message});
  }
};

// @desc    Get Class Monitor
// @route   GET /api/academic/classes/:id/monitor
// @access  Private
exports.getClassMonitor = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id).populate('monitorId');
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    if (!cls.monitorId) return res.status(200).json({ monitor: null });

    const s = cls.monitorId;
    res.status(200).json({
      monitor: {
        id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        rollNumber: s.rollNumber,
        avatar: s.avatar,
        email: s.email,
        status: s.status
      }
    }); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Class Monitor
exports.updateClassMonitor = async (req, res) => {
  try {
    const { studentId } = req.body;
    const cls = await Class.findByIdAndUpdate(
      req.params.id, 
      { monitorId: studentId },
      { new: true }
    ).populate('monitorId');
    
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    // Also update Student model if needed (isMonitor flag) - Requirement 2.2 implies Student has isMonitor
    if (studentId) {
        // Reset old monitor? Not strictly asked but good practice.
        // Set new monitor
        await Student.findByIdAndUpdate(studentId, { isMonitor: true });
    }

    const s = cls.monitorId;
    res.status(200).json({
      success: true,
      message: 'Class monitor updated',
      monitor: s ? {
        id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        rollNumber: s.rollNumber
      } : null
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Section Management ---

// @desc    Get Class Sections
exports.getClassSections = async (req, res) => {
  try {
    const sections = await Section.find({ classId: req.params.id });
    res.status(200).json({
      sections: sections.map(sec => ({
        id: sec._id,
        classId: sec.classId,
        name: sec.name,
        code: sec.code,
        capacity: sec.capacity,
        currentCount: 0, // Calculate from Students
        status: sec.status,
        createdAt: sec.createdAt,
        updatedAt: sec.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Section
exports.createSection = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, ...schoolAndBranchQuery(req) }).select('branchId');
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    const { name, code, capacity, status } = req.body;
    const section = await Section.create({
      schoolId: req.admin.schoolId,
      branchId: cls.branchId,
      classId: req.params.id,
      name,
      code,
      capacity,
      status
    });
    res.status(201).json({ id: section._id, message: 'Section created successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update Section
exports.updateSection = async (req, res) => {
  try {
    const section = await Section.findOneAndUpdate(
      { _id: req.params.sectionId, classId: req.params.id },
      req.body,
      { new: true }
    );
    if (!section) return res.status(404).json({ message: 'Section not found' });
    res.status(200).json({ id: section._id, message: 'Section updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Archive Section
exports.archiveSection = async (req, res) => {
  try {
    const { isArchived } = req.body;
    const section = await Section.findOneAndUpdate(
      { _id: req.params.sectionId, classId: req.params.id },
      { isArchived, status: isArchived ? 'archived' : 'active' },
      { new: true }
    );
    if (!section) return res.status(404).json({ message: 'Section not found' });
    res.status(200).json({ id: section._id, message: 'Section archived successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Fee Structure ---

exports.getClassFeeStructure = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    // Calculate total from feeStructure array
    const totalFee = (cls.feeStructure || []).reduce((sum, item) => sum + item.amount, 0);

    res.status(200).json({
      feeStructure: (cls.feeStructure || []).map(f => ({
        id: f._id,
        name: f.name,
        amount: f.amount,
        frequency: f.frequency,
        dueDate: f.dueDate,
        description: f.description
      })),
      totalFee
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateClassFeeStructure = async (req, res) => {
  try {
    const { feeStructure } = req.body;
    // Overwrite logic or merge? Requirement 3.2 says "Update Class Fee Structure", usually replaces or updates items. 
    // Simplified: Replace fee structure array for now as it's a subdocument list.
    const cls = await Class.findByIdAndUpdate(
      req.params.id,
      { feeStructure },
      { new: true }
    );
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    res.status(200).json({
      success: true,
      message: 'Fee Structure Updated',
      feeStructure: cls.feeStructure
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Attendance Configuration ---

exports.getClassAttendanceConfig = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    // Return default if not set
    const config = cls.attendanceConfig || {
       markingMethod: 'daily',
       periodsPerDay: 8,
       attendanceRules: { minAttendancePercentage: 75 },
       autoMarkAbsent: true
    };

    res.status(200).json({ config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAttendanceConfig = async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(
      req.params.id,
      { attendanceConfig: req.body }, // Body should match structure
      { new: true }
    );
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.status(200).json({ id: cls._id, message: 'Attendance configuration updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Capacity Management ---

exports.getClassCapacity = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    const sections = await Section.find({ classId: cls._id });
    
    // Calculate occupied from Students
    const occupiedSeats = await Student.countDocuments({ classId: cls._id });
    
    const sectionCapacities = await Promise.all(sections.map(async sec => {
        const secOccupied = await Student.countDocuments({ sectionId: sec._id });
        return {
            sectionId: sec._id,
            sectionName: sec.name,
            totalCapacity: sec.capacity,
            occupiedSeats: secOccupied,
            availableSeats: sec.capacity - secOccupied
        };
    }));

    res.status(200).json({
      capacity: {
        classId: cls._id,
        totalCapacity: cls.maxStudents,
        occupiedSeats,
        availableSeats: cls.maxStudents - occupiedSeats,
        sectionCapacities
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateClassCapacity = async (req, res) => {
  try {
    const { totalCapacity } = req.body;
    const cls = await Class.findByIdAndUpdate(req.params.id, { maxStudents: totalCapacity }, { new: true });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.status(200).json({ message: 'Class capacity updated successfully' });
  } catch (error) {
      res.status(400).json({ message: error.message });
  }
};

exports.updateSectionCapacity = async (req, res) => {
  try {
     const { capacity } = req.body;
     const section = await Section.findOneAndUpdate(
         { _id: req.params.sectionId, classId: req.params.id },
         { capacity },
         { new: true }
     );
     if (!section) return res.status(404).json({ message: 'Section not found' });
     res.status(200).json({ message: 'Section capacity updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Placeholders for Other Modules (Timetable, Resources, Exams, Assignments) ---
// To be fully implemented with dedicated models

exports.getClassTimetable = async (req, res) => res.status(200).json({ timetable: null });
exports.updateClassTimetable = async (req, res) => res.status(200).json({ message: 'Timetable updated' });
exports.getTimetableSlot = async (req, res) => res.status(200).json({});
exports.updateTimetableSlot = async (req, res) => res.status(200).json({});
exports.deleteTimetableSlot = async (req, res) => res.status(200).json({});

exports.getClassResources = async (req, res) => res.status(200).json({ data: [] });
exports.addResource = async (req, res) => res.status(201).json({ message: 'Resource added' });
exports.updateResource = async (req, res) => res.status(200).json({ message: 'Resource updated' });
exports.removeResource = async (req, res) => res.status(200).json({ message: 'Resource removed' });

exports.getClassExams = async (req, res) => res.status(200).json({ data: [] });
exports.scheduleExam = async (req, res) => res.status(201).json({ message: 'Exam scheduled' });
exports.getExamResults = async (req, res) => res.status(200).json({ results: [] });
exports.updateExamStatus = async (req, res) => res.status(200).json({ message: 'Status updated' });

exports.getClassAssignments = async (req, res) => res.status(200).json({ data: [] });
exports.createAssignment = async (req, res) => res.status(201).json({ message: 'Assignment created' });
exports.getAssignmentSubmissions = async (req, res) => res.status(200).json({ submissions: [] });

exports.generateClassReport = async (req, res) => res.status(200).json({ status: 'processing', downloadUrl: 'http://example.com/report.pdf' });
exports.getReportStatus = async (req, res) => res.status(200).json({ status: 'completed', downloadUrl: 'http://example.com/report.pdf' });

exports.bulkImportClasses = async (req, res) => res.status(200).json({ message: 'Bulk import feature pending' });
exports.exportClasses = async (req, res) => res.status(200).json({ message: 'Export feature pending' });

