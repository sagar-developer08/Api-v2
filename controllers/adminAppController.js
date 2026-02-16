const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Guardian = require('../models/Guardian');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Grade = require('../models/Grade');
const StudentAttendance = require('../models/StudentAttendance');
const Timetable = require('../models/Timetable');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const StudentDocument = require('../models/StudentDocument');
const Notice = require('../models/Notice');
const Content = require('../models/Content');
const School = require('../models/School');
const mongoose = require('mongoose');

// ============================================
// SECTION 1: DASHBOARD
// ============================================
exports.getDashboardStats = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { academicYear, classId } = req.query;

        const filter = { schoolId };
        if (academicYear) filter.academicYearId = academicYear;
        if (classId) filter.classId = classId;

        const [
            totalStudents,
            totalTeachers,
            totalClasses,
            activeStudents,
            activeTeachers,
            pendingAdmissions,
            attendanceToday,
            pendingFees,
            upcomingExams,
            recentAnnouncements
        ] = await Promise.all([
            Student.countDocuments({ schoolId, status: { $ne: 'deleted' } }),
            Teacher.countDocuments({ schoolId, status: { $ne: 'deleted' } }),
            Class.countDocuments({ schoolId, status: 'active' }),
            Student.countDocuments({ schoolId, status: 'active' }),
            Teacher.countDocuments({ schoolId, status: 'active' }),
            Student.countDocuments({ schoolId, status: 'pending' }),
            StudentAttendance.countDocuments({
                schoolId,
                date: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
            }),
            StudentFee.countDocuments({ schoolId, status: { $in: ['pending', 'partial', 'overdue'] } }),
            Exam.countDocuments({
                schoolId,
                status: { $in: ['scheduled', 'upcoming'] },
                examDate: { $gte: new Date() }
            }),
            Notice.countDocuments({ schoolId, status: 'published', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
        ]);

        const totalPendingFees = await StudentFee.aggregate([
            { $match: { schoolId: mongoose.Types.ObjectId(schoolId), status: { $in: ['pending', 'partial', 'overdue'] } } },
            { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
        ]);

        res.json({
            success: true,
            data: {
                totalStudents,
                totalTeachers,
                totalClasses,
                activeStudents,
                activeTeachers,
                inactiveStudents: totalStudents - activeStudents,
                inactiveTeachers: totalTeachers - activeTeachers,
                pendingAdmissions,
                attendanceToday,
                pendingFees: {
                    count: pendingFees,
                    amount: totalPendingFees[0]?.total || 0
                },
                upcomingExams,
                recentAnnouncements
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching dashboard stats', error: error.message });
    }
};

// ============================================
// SECTION 2: SCHOOL PROFILE
// ============================================
exports.getSchoolProfile = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const school = await School.findById(schoolId);
        if (!school) return res.status(404).json({ success: false, message: 'School not found' });

        res.json({ success: true, data: school });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching school profile', error: error.message });
    }
};

exports.updateSchoolProfile = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const school = await School.findByIdAndUpdate(schoolId, req.body, {
            new: true,
            runValidators: true
        });

        res.json({ success: true, data: school, message: 'School profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating school profile', error: error.message });
    }
};

// ============================================
// SECTION 3: STUDENTS
// ============================================
exports.getStudents = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { page = 1, limit = 10, search, classId, sectionId, status, academicYear } = req.query;

        const filter = { schoolId };
        if (classId) filter.classId = classId;
        if (sectionId) filter.sectionId = sectionId;
        if (status) filter.status = status;
        if (academicYear) filter.academicYearId = academicYear;
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const [students, total] = await Promise.all([
            Student.find(filter)
                .populate('classId', 'name code grade')
                .populate('sectionId', 'name')
                .populate('academicYearId', 'label')
                .select('studentId firstName lastName email phone dateOfBirth gender address rollNumber status admissionDate profilePhoto')
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ createdAt: -1 }),
            Student.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: students,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching students', error: error.message });
    }
};

exports.getStudentDetails = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const student = await Student.findOne({ _id: req.params.studentId, schoolId })
            .populate('classId', 'name code grade section')
            .populate('sectionId', 'name code')
            .populate('academicYearId', 'label startYear endYear');

        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const guardians = await Guardian.find({ studentId: student._id });

        res.json({
            success: true,
            data: {
                ...student.toObject(),
                guardians
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching student details', error: error.message });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const studentData = {
            ...req.body,
            schoolId,
            createdBy: admin._id
        };

        const student = await Student.create(studentData);

        res.status(201).json({
            success: true,
            data: student,
            message: 'Student created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating student', error: error.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const student = await Student.findOneAndUpdate(
            { _id: req.params.studentId, schoolId },
            { ...req.body, updatedBy: admin._id },
            { new: true, runValidators: true }
        );

        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        res.json({
            success: true,
            data: student,
            message: 'Student updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating student', error: error.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const student = await Student.findOneAndUpdate(
            { _id: req.params.studentId, schoolId },
            { status: 'deleted', deletedBy: admin._id, deletedAt: new Date() },
            { new: true }
        );

        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting student', error: error.message });
    }
};

exports.bulkDeleteStudents = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { studentIds } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Student IDs are required' });
        }

        await Student.updateMany(
            { _id: { $in: studentIds }, schoolId },
            { status: 'deleted', deletedBy: admin._id, deletedAt: new Date() }
        );

        res.json({ success: true, message: `${studentIds.length} students deleted successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting students', error: error.message });
    }
};

exports.getStudentAttendance = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { startDate, endDate, subjectId } = req.query;

        const filter = { schoolId, studentId: req.params.studentId };
        if (startDate && endDate) {
            filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (subjectId) filter.subjectId = subjectId;

        const records = await StudentAttendance.find(filter)
            .populate('subjectId', 'name code')
            .populate('markedBy', 'firstName lastName')
            .sort({ date: -1 });

        const total = records.length;
        const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const excused = records.filter(r => r.status === 'excused').length;

        res.json({
            success: true,
            data: records,
            summary: {
                totalDays: total,
                present,
                absent,
                late,
                excused,
                percentage: total ? ((present / total) * 100).toFixed(1) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching student attendance', error: error.message });
    }
};

exports.getStudentAcademicDetails = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const student = await Student.findOne({ _id: req.params.studentId, schoolId })
            .populate('classId', 'name code grade')
            .populate('sectionId', 'name');

        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const [grades, attendance, assignments] = await Promise.all([
            Grade.find({ schoolId, studentId: student._id })
                .populate('subjectId', 'name')
                .sort({ date: -1 })
                .limit(10),
            StudentAttendance.find({ schoolId, studentId: student._id })
                .sort({ date: -1 })
                .limit(30),
            AssignmentSubmission.find({ schoolId, studentId: student._id })
                .populate('assignmentId', 'title dueDate')
                .sort({ submittedAt: -1 })
                .limit(10)
        ]);

        const avgGrade = grades.length > 0
            ? (grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length).toFixed(1)
            : 0;

        const attPercentage = attendance.length > 0
            ? ((attendance.filter(a => a.status === 'present' || a.status === 'late').length / attendance.length) * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                currentClassId: student.classId?._id,
                currentClassName: student.classId?.name,
                currentSectionId: student.sectionId?._id,
                currentSectionName: student.sectionId?.name,
                rollNumber: student.rollNumber,
                averageGrade: Number(avgGrade),
                attendancePercentage: Number(attPercentage),
                recentGrades: grades,
                recentAttendance: attendance,
                recentAssignments: assignments
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching academic details', error: error.message });
    }
};

exports.getStudentFees = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const fees = await StudentFee.find({ schoolId, studentId: req.params.studentId })
            .populate('feeStructureId', 'name academicYear')
            .sort({ createdAt: -1 });

        const payments = await FeePayment.find({
            schoolId,
            studentFeeId: { $in: fees.map(f => f._id) }
        }).sort({ paymentDate: -1 });

        const summary = {
            totalDue: fees.reduce((sum, f) => sum + (f.pendingAmount || 0), 0),
            totalPaid: fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0),
            totalAmount: fees.reduce((sum, f) => sum + (f.totalAmount || 0), 0)
        };

        res.json({
            success: true,
            data: fees.map(f => ({
                ...f.toObject(),
                payments: payments.filter(p => p.studentFeeId.toString() === f._id.toString())
            })),
            summary
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching student fees', error: error.message });
    }
};

exports.getStudentGuardians = async (req, res) => {
    try {
        const guardians = await Guardian.find({ studentId: req.params.studentId });
        res.json({ success: true, data: guardians });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching guardians', error: error.message });
    }
};

exports.addStudentGuardian = async (req, res) => {
    try {
        const guardianData = {
            ...req.body,
            studentId: req.params.studentId
        };

        const guardian = await Guardian.create(guardianData);
        res.status(201).json({ success: true, data: guardian, message: 'Guardian added successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding guardian', error: error.message });
    }
};

exports.deleteStudentGuardian = async (req, res) => {
    try {
        const guardian = await Guardian.findOneAndDelete({
            _id: req.params.guardianId,
            studentId: req.params.studentId
        });

        if (!guardian) return res.status(404).json({ success: false, message: 'Guardian not found' });

        res.json({ success: true, message: 'Guardian deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting guardian', error: error.message });
    }
};

exports.getStudentDocuments = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const documents = await StudentDocument.find({ schoolId, studentId: req.params.studentId })
            .sort({ uploadedAt: -1 });

        res.json({ success: true, data: documents });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching documents', error: error.message });
    }
};

exports.uploadStudentDocument = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const documentData = {
            ...req.body,
            schoolId,
            studentId: req.params.studentId,
            uploadedBy: admin._id
        };

        const document = await StudentDocument.create(documentData);
        res.status(201).json({ success: true, data: document, message: 'Document uploaded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
    }
};

exports.deleteStudentDocument = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const document = await StudentDocument.findOneAndDelete({
            _id: req.params.documentId,
            schoolId,
            studentId: req.params.studentId
        });

        if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting document', error: error.message });
    }
};

// ============================================
// SECTION 4: TEACHERS
// ============================================
exports.getTeachers = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { page = 1, limit = 10, search, departmentId, status } = req.query;

        const filter = { schoolId };
        if (departmentId) filter.departmentId = departmentId;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const [teachers, total] = await Promise.all([
            Teacher.find(filter)
                .select('employeeId firstName lastName email phone designation department subjects status joiningDate profilePhoto')
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ createdAt: -1 }),
            Teacher.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: teachers,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching teachers', error: error.message });
    }
};

exports.getTeacherDetails = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const teacher = await Teacher.findOne({ _id: req.params.teacherId, schoolId });

        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        res.json({ success: true, data: teacher });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching teacher details', error: error.message });
    }
};

exports.createTeacher = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const teacherData = {
            ...req.body,
            schoolId,
            createdBy: admin._id
        };

        const teacher = await Teacher.create(teacherData);

        res.status(201).json({
            success: true,
            data: teacher,
            message: 'Teacher created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating teacher', error: error.message });
    }
};

exports.updateTeacher = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const teacher = await Teacher.findOneAndUpdate(
            { _id: req.params.teacherId, schoolId },
            { ...req.body, updatedBy: admin._id },
            { new: true, runValidators: true }
        );

        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        res.json({
            success: true,
            data: teacher,
            message: 'Teacher updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating teacher', error: error.message });
    }
};

exports.deleteTeacher = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const teacher = await Teacher.findOneAndUpdate(
            { _id: req.params.teacherId, schoolId },
            { status: 'deleted', deletedBy: admin._id, deletedAt: new Date() },
            { new: true }
        );

        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        res.json({ success: true, message: 'Teacher deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting teacher', error: error.message });
    }
};

exports.bulkDeleteTeachers = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { teacherIds } = req.body;

        if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Teacher IDs are required' });
        }

        await Teacher.updateMany(
            { _id: { $in: teacherIds }, schoolId },
            { status: 'deleted', deletedBy: admin._id, deletedAt: new Date() }
        );

        res.json({ success: true, message: `${teacherIds.length} teachers deleted successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting teachers', error: error.message });
    }
};

// ============================================
// SECTION 5: CLASSES
// ============================================
exports.getClasses = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { page = 1, limit = 10, search, grade, academicYear } = req.query;

        const filter = { schoolId };
        if (grade) filter.grade = grade;
        if (academicYear) filter.academicYearId = academicYear;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        const [classes, total] = await Promise.all([
            Class.find(filter)
                .populate('teacherId', 'firstName lastName email')
                .populate('academicYearId', 'label')
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ createdAt: -1 }),
            Class.countDocuments(filter)
        ]);

        // Add student count to each class
        const classesWithCount = await Promise.all(
            classes.map(async (cls) => {
                const studentCount = await Student.countDocuments({
                    schoolId,
                    classId: cls._id,
                    status: 'active'
                });
                return {
                    ...cls.toObject(),
                    studentCount
                };
            })
        );

        res.json({
            success: true,
            data: classesWithCount,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching classes', error: error.message });
    }
};

exports.getClassDetails = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const cls = await Class.findOne({ _id: req.params.classId, schoolId })
            .populate('teacherId', 'firstName lastName email phone')
            .populate('subjects.subjectId', 'name code')
            .populate('subjects.teacherId', 'firstName lastName')
            .populate('academicYearId', 'label');

        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

        const studentCount = await Student.countDocuments({
            schoolId,
            classId: cls._id,
            status: 'active'
        });

        res.json({
            success: true,
            data: {
                ...cls.toObject(),
                studentCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching class details', error: error.message });
    }
};

exports.createClass = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const classData = {
            ...req.body,
            schoolId,
            createdBy: admin._id
        };

        const cls = await Class.create(classData);

        res.status(201).json({
            success: true,
            data: cls,
            message: 'Class created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating class', error: error.message });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const cls = await Class.findOneAndUpdate(
            { _id: req.params.classId, schoolId },
            { ...req.body, updatedBy: admin._id },
            { new: true, runValidators: true }
        );

        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

        res.json({
            success: true,
            data: cls,
            message: 'Class updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating class', error: error.message });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        // Check if class has students
        const studentCount = await Student.countDocuments({
            schoolId,
            classId: req.params.classId,
            status: 'active'
        });

        if (studentCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete class with active students'
            });
        }

        const cls = await Class.findOneAndDelete({ _id: req.params.classId, schoolId });

        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

        res.json({ success: true, message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting class', error: error.message });
    }
};

exports.archiveClass = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const cls = await Class.findOneAndUpdate(
            { _id: req.params.classId, schoolId },
            { status: 'archived', archivedBy: admin._id, archivedAt: new Date() },
            { new: true }
        );

        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

        res.json({ success: true, data: cls, message: 'Class archived successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error archiving class', error: error.message });
    }
};

exports.getClassStudents = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { page = 1, limit = 10, search } = req.query;

        const filter = { schoolId, classId: req.params.classId, status: 'active' };
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } }
            ];
        }

        const [students, total] = await Promise.all([
            Student.find(filter)
                .select('studentId firstName lastName rollNumber email phone profilePhoto')
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ rollNumber: 1 }),
            Student.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: students,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching class students', error: error.message });
    }
};

exports.getClassSubjects = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const cls = await Class.findOne({ _id: req.params.classId, schoolId })
            .populate('subjects.subjectId', 'name code type')
            .populate('subjects.teacherId', 'firstName lastName email');

        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

        res.json({ success: true, data: cls.subjects });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching class subjects', error: error.message });
    }
};

exports.getClassAttendance = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { date, startDate, endDate } = req.query;

        const filter = { schoolId, classId: req.params.classId };
        
        if (date) {
            filter.date = new Date(date);
        } else if (startDate && endDate) {
            filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const attendance = await StudentAttendance.find(filter)
            .populate('studentId', 'firstName lastName rollNumber')
            .populate('subjectId', 'name')
            .sort({ date: -1, rollNumber: 1 });

        res.json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching class attendance', error: error.message });
    }
};

exports.getClassTimetable = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const timetable = await Timetable.find({ schoolId, classId: req.params.classId })
            .populate('subjectId', 'name code')
            .populate('teacherId', 'firstName lastName')
            .sort({ dayOfWeek: 1, startTime: 1 });

        res.json({ success: true, data: timetable });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching class timetable', error: error.message });
    }
};

// ============================================
// SECTION 6: SUBJECTS
// ============================================
exports.getSubjects = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { page = 1, limit = 10, search, departmentId, gradeLevel, status } = req.query;

        const filter = { schoolId };
        if (departmentId) filter.departmentId = departmentId;
        if (gradeLevel) filter.gradeLevel = gradeLevel;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        const [subjects, total] = await Promise.all([
            Subject.find(filter)
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ name: 1 }),
            Subject.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: subjects,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching subjects', error: error.message });
    }
};

exports.getSubjectDetails = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const subject = await Subject.findOne({ _id: req.params.subjectId, schoolId });

        if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

        res.json({ success: true, data: subject });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching subject details', error: error.message });
    }
};

exports.createSubject = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const subjectData = {
            ...req.body,
            schoolId,
            createdBy: admin._id
        };

        const subject = await Subject.create(subjectData);

        res.status(201).json({
            success: true,
            data: subject,
            message: 'Subject created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating subject', error: error.message });
    }
};

exports.updateSubject = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const subject = await Subject.findOneAndUpdate(
            { _id: req.params.subjectId, schoolId },
            { ...req.body, updatedBy: admin._id },
            { new: true, runValidators: true }
        );

        if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

        res.json({
            success: true,
            data: subject,
            message: 'Subject updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating subject', error: error.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const subject = await Subject.findOneAndDelete({ _id: req.params.subjectId, schoolId });

        if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

        res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting subject', error: error.message });
    }
};

exports.bulkDeleteSubjects = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { subjectIds } = req.body;

        if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Subject IDs are required' });
        }

        await Subject.deleteMany({ _id: { $in: subjectIds }, schoolId });

        res.json({ success: true, message: `${subjectIds.length} subjects deleted successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting subjects', error: error.message });
    }
};

// ============================================
// SECTION 7: ATTENDANCE
// ============================================
exports.getAttendance = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const {
            page = 1,
            limit = 10,
            date,
            startDate,
            endDate,
            classId,
            sectionId,
            subjectId,
            studentId,
            status
        } = req.query;

        const filter = { schoolId };
        if (date) filter.date = new Date(date);
        if (startDate && endDate) filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        if (classId) filter.classId = classId;
        if (sectionId) filter.sectionId = sectionId;
        if (subjectId) filter.subjectId = subjectId;
        if (studentId) filter.studentId = studentId;
        if (status) filter.status = status;

        const [records, total] = await Promise.all([
            StudentAttendance.find(filter)
                .populate('studentId', 'firstName lastName rollNumber')
                .populate('classId', 'name')
                .populate('subjectId', 'name')
                .populate('markedBy', 'firstName lastName')
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ date: -1 }),
            StudentAttendance.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: records,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
    }
};

exports.markAttendanceBulk = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { classId, sectionId, subjectId, date, attendance } = req.body;

        if (!attendance || !Array.isArray(attendance)) {
            return res.status(400).json({ success: false, message: 'Attendance data is required' });
        }

        const attendanceRecords = attendance.map(record => ({
            schoolId,
            studentId: record.studentId,
            classId,
            sectionId,
            subjectId,
            date: new Date(date),
            status: record.status,
            remarks: record.remarks,
            markedBy: admin._id
        }));

        // Delete existing attendance for the same date, class, and subject
        await StudentAttendance.deleteMany({
            schoolId,
            classId,
            date: new Date(date),
            subjectId
        });

        const savedRecords = await StudentAttendance.insertMany(attendanceRecords);

        res.status(201).json({
            success: true,
            data: savedRecords,
            message: 'Attendance marked successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error marking attendance', error: error.message });
    }
};

exports.updateAttendance = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const attendance = await StudentAttendance.findOneAndUpdate(
            { _id: req.params.attendanceId, schoolId },
            { ...req.body, updatedBy: admin._id },
            { new: true, runValidators: true }
        );

        if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found' });

        res.json({
            success: true,
            data: attendance,
            message: 'Attendance updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating attendance', error: error.message });
    }
};

exports.deleteAttendance = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const attendance = await StudentAttendance.findOneAndDelete({
            _id: req.params.attendanceId,
            schoolId
        });

        if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found' });

        res.json({ success: true, message: 'Attendance deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting attendance', error: error.message });
    }
};

exports.bulkDeleteAttendance = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { attendanceIds } = req.body;

        if (!attendanceIds || !Array.isArray(attendanceIds) || attendanceIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Attendance IDs are required' });
        }

        await StudentAttendance.deleteMany({ _id: { $in: attendanceIds }, schoolId });

        res.json({ success: true, message: `${attendanceIds.length} attendance records deleted successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting attendance', error: error.message });
    }
};

exports.getAttendanceStatistics = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { classId, sectionId, studentId, startDate, endDate } = req.query;

        const filter = { schoolId };
        if (classId) filter.classId = classId;
        if (sectionId) filter.sectionId = sectionId;
        if (studentId) filter.studentId = studentId;
        if (startDate && endDate) {
            filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const records = await StudentAttendance.find(filter);

        const totalDays = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const excused = records.filter(r => r.status === 'excused').length;
        const percentage = totalDays > 0 ? ((present + late) / totalDays * 100).toFixed(1) : 0;

        // Group by class
        const byClass = await StudentAttendance.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$classId',
                    total: { $sum: 1 },
                    present: {
                        $sum: {
                            $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalDays,
                present,
                absent,
                late,
                excused,
                percentage: Number(percentage),
                byClass
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching attendance statistics', error: error.message });
    }
};

// ============================================
// SECTION 8: TIMETABLE
// ============================================
exports.getTimetable = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { classId, sectionId, subjectId, teacherId, dayOfWeek, academicYear } = req.query;

        const filter = { schoolId };
        if (classId) filter.classId = classId;
        if (sectionId) filter.sectionId = sectionId;
        if (subjectId) filter.subjectId = subjectId;
        if (teacherId) filter.teacherId = teacherId;
        if (dayOfWeek) filter.dayOfWeek = dayOfWeek;
        if (academicYear) filter.academicYearId = academicYear;

        const timetable = await Timetable.find(filter)
            .populate('classId', 'name code')
            .populate('sectionId', 'name')
            .populate('subjectId', 'name code')
            .populate('teacherId', 'firstName lastName')
            .sort({ dayOfWeek: 1, startTime: 1 });

        res.json({ success: true, data: timetable });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching timetable', error: error.message });
    }
};

exports.createTimetableSlot = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const slotData = {
            ...req.body,
            schoolId,
            createdBy: admin._id
        };

        const slot = await Timetable.create(slotData);

        res.status(201).json({
            success: true,
            data: slot,
            message: 'Timetable slot created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating timetable slot', error: error.message });
    }
};

exports.updateTimetableSlot = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const slot = await Timetable.findOneAndUpdate(
            { _id: req.params.slotId, schoolId },
            { ...req.body, updatedBy: admin._id },
            { new: true, runValidators: true }
        );

        if (!slot) return res.status(404).json({ success: false, message: 'Timetable slot not found' });

        res.json({
            success: true,
            data: slot,
            message: 'Timetable slot updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating timetable slot', error: error.message });
    }
};

exports.deleteTimetableSlot = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const slot = await Timetable.findOneAndDelete({ _id: req.params.slotId, schoolId });

        if (!slot) return res.status(404).json({ success: false, message: 'Timetable slot not found' });

        res.json({ success: true, message: 'Timetable slot deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting timetable slot', error: error.message });
    }
};

exports.bulkDeleteTimetableSlots = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { slotIds } = req.body;

        if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Slot IDs are required' });
        }

        await Timetable.deleteMany({ _id: { $in: slotIds }, schoolId });

        res.json({ success: true, message: `${slotIds.length} timetable slots deleted successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting timetable slots', error: error.message });
    }
};

// ============================================
// SECTION 9: EXAMS
// ============================================
exports.getExams = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const {
            page = 1,
            limit = 10,
            search,
            classId,
            subjectId,
            examType,
            status,
            academicYear
        } = req.query;

        const filter = { schoolId };
        if (classId) filter.classId = classId;
        if (subjectId) filter.subjectId = subjectId;
        if (examType) filter.examType = examType;
        if (status) filter.status = status;
        if (academicYear) filter.academicYearId = academicYear;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { examId: { $regex: search, $options: 'i' } }
            ];
        }

        const [exams, total] = await Promise.all([
            Exam.find(filter)
                .populate('classId', 'name code')
                .populate('subjectId', 'name code')
                .populate('academicYearId', 'label')
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ examDate: -1 }),
            Exam.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: exams,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching exams', error: error.message });
    }
};

exports.getExamDetails = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const exam = await Exam.findOne({ _id: req.params.examId, schoolId })
            .populate('classId', 'name code')
            .populate('subjectId', 'name code')
            .populate('academicYearId', 'label');

        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

        res.json({ success: true, data: exam });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching exam details', error: error.message });
    }
};

exports.createExam = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const examData = {
            ...req.body,
            schoolId,
            createdBy: admin._id
        };

        const exam = await Exam.create(examData);

        res.status(201).json({
            success: true,
            data: exam,
            message: 'Exam created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating exam', error: error.message });
    }
};

exports.updateExam = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const exam = await Exam.findOneAndUpdate(
            { _id: req.params.examId, schoolId },
            { ...req.body, updatedBy: admin._id },
            { new: true, runValidators: true }
        );

        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

        res.json({
            success: true,
            data: exam,
            message: 'Exam updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating exam', error: error.message });
    }
};

exports.deleteExam = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const exam = await Exam.findOneAndDelete({ _id: req.params.examId, schoolId });

        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

        res.json({ success: true, message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting exam', error: error.message });
    }
};

exports.getExamResults = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { page = 1, limit = 10 } = req.query;

        const filter = { schoolId, examId: req.params.examId };

        const [results, total] = await Promise.all([
            ExamResult.find(filter)
                .populate('studentId', 'firstName lastName rollNumber studentId')
                .populate('classId', 'name')
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ rank: 1 }),
            ExamResult.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: results,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching exam results', error: error.message });
    }
};

exports.createExamResult = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const resultData = {
            ...req.body,
            schoolId,
            examId: req.params.examId,
            createdBy: admin._id
        };

        // Calculate percentage
        const exam = await Exam.findById(req.params.examId);
        if (exam) {
            resultData.percentage = (req.body.marksObtained / exam.maxMarks * 100).toFixed(2);
        }

        const result = await ExamResult.create(resultData);

        res.status(201).json({
            success: true,
            data: result,
            message: 'Exam result created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating exam result', error: error.message });
    }
};

exports.updateExamResult = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const result = await ExamResult.findOneAndUpdate(
            { _id: req.params.resultId, schoolId, examId: req.params.examId },
            { ...req.body, updatedBy: admin._id },
            { new: true, runValidators: true }
        );

        if (!result) return res.status(404).json({ success: false, message: 'Exam result not found' });

        res.json({
            success: true,
            data: result,
            message: 'Exam result updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating exam result', error: error.message });
    }
};

exports.publishExamResults = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const exam = await Exam.findOneAndUpdate(
            { _id: req.params.examId, schoolId },
            { resultsPublished: true, publishedBy: admin._id, publishedAt: new Date() },
            { new: true }
        );

        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

        await ExamResult.updateMany(
            { examId: req.params.examId, schoolId },
            { publishedAt: new Date() }
        );

        res.json({
            success: true,
            data: exam,
            message: 'Exam results published successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error publishing exam results', error: error.message });
    }
};

// ============================================
// SECTION 10: FEES
// ============================================
exports.getFeeStructures = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { page = 1, limit = 10, academicYear, gradeLevel, isActive } = req.query;

        const filter = { schoolId };
        if (academicYear) filter.academicYear = academicYear;
        if (gradeLevel) filter.gradeLevel = gradeLevel;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const feeStructures = await Class.find(filter)
            .select('name feeStructure')
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Class.countDocuments(filter);

        res.json({
            success: true,
            data: feeStructures,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching fee structures', error: error.message });
    }
};

exports.getStudentFees = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { page = 1, limit = 10, studentId, classId, status, academicYear } = req.query;

        const filter = { schoolId };
        if (studentId) filter.studentId = studentId;
        if (classId) filter.classId = classId;
        if (status) filter.status = status;
        if (academicYear) filter.academicYear = academicYear;

        const [fees, total] = await Promise.all([
            StudentFee.find(filter)
                .populate('studentId', 'firstName lastName studentId rollNumber')
                .populate('classId', 'name')
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ createdAt: -1 }),
            StudentFee.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: fees,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching student fees', error: error.message });
    }
};

exports.assignFeeToStudent = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const feeData = {
            ...req.body,
            schoolId,
            createdBy: admin._id
        };

        const fee = await StudentFee.create(feeData);

        res.status(201).json({
            success: true,
            data: fee,
            message: 'Fee assigned to student successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error assigning fee', error: error.message });
    }
};

exports.getPayments = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { page = 1, limit = 10, studentId, paymentMethod, startDate, endDate } = req.query;

        const filter = { schoolId };
        if (studentId) filter.studentId = studentId;
        if (paymentMethod) filter.paymentMethod = paymentMethod;
        if (startDate && endDate) {
            filter.paymentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const [payments, total] = await Promise.all([
            FeePayment.find(filter)
                .populate('studentId', 'firstName lastName studentId')
                .populate('studentFeeId', 'academicYear')
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ paymentDate: -1 }),
            FeePayment.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: payments,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching payments', error: error.message });
    }
};

exports.recordPayment = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const paymentData = {
            ...req.body,
            schoolId,
            collectedBy: admin._id
        };

        const payment = await FeePayment.create(paymentData);

        // Update student fee
        const studentFee = await StudentFee.findById(req.body.studentFeeId);
        if (studentFee) {
            studentFee.paidAmount = (studentFee.paidAmount || 0) + payment.amount;
            studentFee.pendingAmount = studentFee.totalAmount - studentFee.paidAmount;
            
            if (studentFee.pendingAmount <= 0) {
                studentFee.status = 'paid';
            } else if (studentFee.paidAmount > 0) {
                studentFee.status = 'partial';
            }
            
            await studentFee.save();
        }

        res.status(201).json({
            success: true,
            data: payment,
            message: 'Payment recorded successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error recording payment', error: error.message });
    }
};

exports.getPaymentReceipt = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const payment = await FeePayment.findOne({ _id: req.params.paymentId, schoolId })
            .populate('studentId', 'firstName lastName studentId')
            .populate('studentFeeId')
            .populate('collectedBy', 'firstName lastName');

        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

        const school = await School.findById(schoolId);

        res.json({
            success: true,
            data: {
                payment,
                school
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching payment receipt', error: error.message });
    }
};

// ============================================
// SECTION 11: GRADES
// ============================================
exports.getGrades = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const {
            page = 1,
            limit = 10,
            studentId,
            classId,
            subjectId,
            gradeType,
            academicYear
        } = req.query;

        const filter = { schoolId };
        if (studentId) filter.studentId = studentId;
        if (classId) filter.classId = classId;
        if (subjectId) filter.subjectId = subjectId;
        if (gradeType) filter.gradeType = gradeType;
        if (academicYear) filter.academicYear = academicYear;

        const [grades, total] = await Promise.all([
            Grade.find(filter)
                .populate('studentId', 'firstName lastName rollNumber studentId')
                .populate('classId', 'name')
                .populate('subjectId', 'name code')
                .populate('gradedBy', 'firstName lastName')
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ date: -1 }),
            Grade.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: grades,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching grades', error: error.message });
    }
};

exports.createGrade = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const gradeData = {
            ...req.body,
            schoolId,
            gradedBy: admin._id
        };

        // Calculate percentage
        if (req.body.obtainedScore && req.body.maxScore) {
            gradeData.percentage = (req.body.obtainedScore / req.body.maxScore * 100).toFixed(2);
        }

        const grade = await Grade.create(gradeData);

        res.status(201).json({
            success: true,
            data: grade,
            message: 'Grade created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating grade', error: error.message });
    }
};

exports.updateGrade = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const updateData = { ...req.body, updatedBy: admin._id };

        // Recalculate percentage if scores are updated
        if (req.body.obtainedScore || req.body.maxScore) {
            const grade = await Grade.findById(req.params.gradeId);
            const obtainedScore = req.body.obtainedScore || grade.obtainedScore;
            const maxScore = req.body.maxScore || grade.maxScore;
            updateData.percentage = (obtainedScore / maxScore * 100).toFixed(2);
        }

        const grade = await Grade.findOneAndUpdate(
            { _id: req.params.gradeId, schoolId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!grade) return res.status(404).json({ success: false, message: 'Grade not found' });

        res.json({
            success: true,
            data: grade,
            message: 'Grade updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating grade', error: error.message });
    }
};

exports.deleteGrade = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const grade = await Grade.findOneAndDelete({ _id: req.params.gradeId, schoolId });

        if (!grade) return res.status(404).json({ success: false, message: 'Grade not found' });

        res.json({ success: true, message: 'Grade deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting grade', error: error.message });
    }
};

// ============================================
// SECTION 12: COMMUNICATION (NOTICES)
// ============================================
exports.getNotices = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;
        const { page = 1, limit = 10, type, status } = req.query;

        const filter = { schoolId };
        if (type) filter.type = type;
        if (status) filter.status = status;

        const [notices, total] = await Promise.all([
            Notice.find(filter)
                .populate('createdBy', 'firstName lastName')
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .sort({ createdAt: -1 }),
            Notice.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: notices,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notices', error: error.message });
    }
};

exports.getNoticeDetails = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const notice = await Notice.findOne({ _id: req.params.noticeId, schoolId })
            .populate('createdBy', 'firstName lastName email');

        if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

        res.json({ success: true, data: notice });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notice details', error: error.message });
    }
};

exports.createNotice = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const noticeData = {
            ...req.body,
            schoolId,
            createdBy: admin._id
        };

        const notice = await Notice.create(noticeData);

        res.status(201).json({
            success: true,
            data: notice,
            message: 'Notice created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating notice', error: error.message });
    }
};

exports.updateNotice = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const notice = await Notice.findOneAndUpdate(
            { _id: req.params.noticeId, schoolId },
            { ...req.body, updatedBy: admin._id },
            { new: true, runValidators: true }
        );

        if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

        res.json({
            success: true,
            data: notice,
            message: 'Notice updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating notice', error: error.message });
    }
};

exports.deleteNotice = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const notice = await Notice.findOneAndDelete({ _id: req.params.noticeId, schoolId });

        if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

        res.json({ success: true, message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting notice', error: error.message });
    }
};

exports.publishNotice = async (req, res) => {
    try {
        const admin = req.admin;
        const schoolId = admin.schoolId._id || admin.schoolId;

        const notice = await Notice.findOneAndUpdate(
            { _id: req.params.noticeId, schoolId },
            { status: 'published', publishedBy: admin._id, publishedAt: new Date() },
            { new: true }
        );

        if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

        res.json({
            success: true,
            data: notice,
            message: 'Notice published successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error publishing notice', error: error.message });
    }
};
