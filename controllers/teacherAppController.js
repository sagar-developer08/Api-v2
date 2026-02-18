const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Guardian = require('../models/Guardian');
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
const Notice = require('../models/Notice');
const Content = require('../models/Content');
const TeacherLeave = require('../models/TeacherLeave');
const StudentCommunication = require('../models/StudentCommunication');
const mongoose = require('mongoose');

// ============================================
// SECTION 1: DASHBOARD
// ============================================
exports.getDashboardStats = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { academicYear } = req.query;

        const classQuery = { schoolId, 'subjects.teacherId': teacher._id };
        const classes = await Class.find(classQuery);
        const classIds = classes.map(c => c._id);

        const [totalStudents, totalAssignments, pendingGradings, upcomingExams] = await Promise.all([
            Student.countDocuments({ schoolId, classId: { $in: classIds }, status: 'active' }),
            Assignment.countDocuments({ schoolId, teacherId: teacher._id }),
            AssignmentSubmission.countDocuments({ schoolId, status: 'submitted' }),
            Exam.countDocuments({ schoolId, subjectId: { $in: classes.flatMap(c => c.subjects.filter(s => s.teacherId?.toString() === teacher._id.toString()).map(s => s.subjectId)) }, status: { $in: ['scheduled', 'upcoming'] } })
        ]);

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);
        const attendanceToday = await StudentAttendance.countDocuments({ schoolId, date: { $gte: today, $lte: todayEnd }, markedBy: teacher._id });

        res.status(200).json({
            success: true,
            data: {
                totalClasses: classes.length,
                totalStudents,
                totalAssignments,
                pendingGradings,
                todayClasses: 0,
                upcomingExams,
                attendanceToday: { marked: attendanceToday, pending: classes.length - attendanceToday },
                recentAnnouncements: 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching dashboard', error: error.message });
    }
};

// ============================================
// SECTION 2: PROFILE
// ============================================
exports.getProfile = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher._id).populate('schoolId', 'schoolName schoolCode');
        res.status(200).json({ success: true, data: teacher });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const allowed = ['firstName', 'lastName', 'phone', 'address', 'profilePhoto', 'dateOfBirth', 'gender'];
        const updates = {};
        allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
        const teacher = await Teacher.findByIdAndUpdate(req.teacher._id, updates, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: teacher, message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
    }
};

exports.getQualifications = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher._id).select('qualifications');
        res.status(200).json({ success: true, data: teacher.qualifications || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching qualifications', error: error.message });
    }
};

exports.addQualification = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher._id);
        teacher.qualifications.push(req.body);
        await teacher.save();
        res.status(201).json({ success: true, data: teacher.qualifications, message: 'Qualification added' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding qualification', error: error.message });
    }
};

exports.deleteQualification = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher._id);
        teacher.qualifications = teacher.qualifications.filter(q => q._id.toString() !== req.params.qualificationId);
        await teacher.save();
        res.status(200).json({ success: true, message: 'Qualification removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting qualification', error: error.message });
    }
};

exports.getDocuments = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher._id).select('documents');
        res.status(200).json({ success: true, data: teacher.documents || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching documents', error: error.message });
    }
};

exports.uploadDocument = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher._id);
        const doc = {
            name: req.body.documentType || req.body.name || 'Document',
            type: req.body.documentType || 'other',
            description: req.body.description || '',
            fileUrl: req.file ? req.file.path : req.body.fileUrl || '',
            uploadedAt: new Date()
        };
        teacher.documents.push(doc);
        await teacher.save();
        res.status(201).json({ success: true, data: doc, message: 'Document uploaded' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher._id);
        teacher.documents = teacher.documents.filter(d => d._id.toString() !== req.params.documentId);
        await teacher.save();
        res.status(200).json({ success: true, message: 'Document removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting document', error: error.message });
    }
};

// ============================================
// SECTION 3: CLASSES
// ============================================
exports.getMyClasses = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { academicYear, page = 1, limit = 10 } = req.query;

        const query = { schoolId, 'subjects.teacherId': teacher._id };
        const classes = await Class.find(query)
            .populate('subjects.subjectId', 'name code')
            .skip((page - 1) * limit).limit(Number(limit));

        const total = await Class.countDocuments(query);
        const data = classes.map(c => ({
            id: c._id, name: c.name, code: c.code, grade: c.grade, section: c.section,
            academicYear: c.academicYear, studentCount: c.studentCount || 0, maxStudents: c.maxStudents || 0,
            subjects: c.subjects.filter(s => s.teacherId?.toString() === teacher._id.toString()).map(s => ({
                id: s.subjectId?._id || s.subjectId, name: s.subjectId?.name || '', code: s.subjectId?.code || '',
                isClassTeacher: c.classTeacher?.toString() === teacher._id.toString()
            })),
            roomNumber: c.roomNumber
        }));

        res.status(200).json({ success: true, data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching classes', error: error.message });
    }
};

exports.getClassDetails = async (req, res) => {
    try {
        const cls = await Class.findById(req.params.classId)
            .populate('subjects.subjectId', 'name code')
            .populate('subjects.teacherId', 'firstName lastName');
        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

        const students = await Student.find({ classId: cls._id, status: 'active' })
            .select('studentId firstName lastName rollNumber profilePhoto email');

        res.status(200).json({ success: true, data: { ...cls.toObject(), students } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching class details', error: error.message });
    }
};

exports.getClassStudents = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query = { classId: req.params.classId, status: 'active' };
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } }
            ];
        }
        const students = await Student.find(query)
            .select('studentId firstName lastName rollNumber email phone profilePhoto')
            .skip((page - 1) * limit).limit(Number(limit));
        const total = await Student.countDocuments(query);
        res.status(200).json({ success: true, data: students, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching students', error: error.message });
    }
};

// ============================================
// SECTION 4: STUDENTS
// ============================================
exports.getMyStudents = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { page = 1, limit = 10, search, classId, sectionId } = req.query;

        const classes = await Class.find({ schoolId, 'subjects.teacherId': teacher._id });
        const classIds = classId ? [classId] : classes.map(c => c._id);

        const query = { schoolId, classId: { $in: classIds }, status: 'active' };
        if (sectionId) query.sectionId = sectionId;
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } }
            ];
        }

        const students = await Student.find(query)
            .populate('classId', 'name').populate('sectionId', 'name')
            .select('studentId firstName lastName rollNumber email phone profilePhoto classId sectionId')
            .skip((page - 1) * limit).limit(Number(limit));
        const total = await Student.countDocuments(query);

        res.status(200).json({ success: true, data: students, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching students', error: error.message });
    }
};

exports.getStudentDetails = async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId)
            .populate('classId', 'name').populate('sectionId', 'name');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const guardians = await Guardian.find({ studentId: student._id });
        res.status(200).json({ success: true, data: { ...student.toObject(), guardians } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching student', error: error.message });
    }
};

exports.getStudentAttendance = async (req, res) => {
    try {
        const { startDate, endDate, subjectId } = req.query;
        const query = { studentId: req.params.studentId };
        if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        if (subjectId) query.subjectId = subjectId;

        const records = await StudentAttendance.find(query).populate('subjectId', 'name').sort({ date: -1 });
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;

        res.status(200).json({
            success: true,
            data: records,
            summary: { totalDays: total, present, absent: total - present, percentage: total ? ((present / total) * 100).toFixed(1) : 0 }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
    }
};

exports.getStudentGrades = async (req, res) => {
    try {
        const { subjectId, gradeType } = req.query;
        const query = { studentId: req.params.studentId };
        if (subjectId) query.subjectId = subjectId;
        if (gradeType) query.gradeType = gradeType;

        const grades = await Grade.find(query).populate('subjectId', 'name').sort({ date: -1 });
        const avg = grades.length ? (grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: grades,
            summary: { averageScore: avg, totalGrades: grades.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching grades', error: error.message });
    }
};

// ============================================
// SECTION 5: ASSIGNMENTS
// ============================================
exports.getMyAssignments = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { page = 1, limit = 10, search, classId, subjectId, status } = req.query;
        const query = { schoolId, teacherId: teacher._id };
        if (classId) query.classId = classId;
        if (subjectId) query.subjectId = subjectId;
        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: 'i' };

        const assignments = await Assignment.find(query)
            .populate('classId', 'name').populate('subjectId', 'name')
            .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
        const total = await Assignment.countDocuments(query);

        res.status(200).json({ success: true, data: assignments, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching assignments', error: error.message });
    }
};

exports.getAssignmentDetails = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.assignmentId)
            .populate('classId', 'name').populate('subjectId', 'name');
        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

        const submissions = await AssignmentSubmission.find({ assignmentId: assignment._id })
            .populate('studentId', 'firstName lastName studentId');
        res.status(200).json({ success: true, data: { ...assignment.toObject(), submissions } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching assignment', error: error.message });
    }
};

exports.createAssignment = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const assignment = await Assignment.create({
            ...req.body, schoolId, teacherId: teacher._id, status: req.body.status || 'draft'
        });
        res.status(201).json({ success: true, data: assignment, message: 'Assignment created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating assignment', error: error.message });
    }
};

exports.updateAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findOneAndUpdate(
            { _id: req.params.assignmentId, teacherId: req.teacher._id },
            req.body, { new: true, runValidators: true }
        );
        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
        res.status(200).json({ success: true, data: assignment, message: 'Assignment updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating assignment', error: error.message });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findOneAndDelete({ _id: req.params.assignmentId, teacherId: req.teacher._id });
        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
        await AssignmentSubmission.deleteMany({ assignmentId: assignment._id });
        res.status(200).json({ success: true, message: 'Assignment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting assignment', error: error.message });
    }
};

exports.publishAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findOneAndUpdate(
            { _id: req.params.assignmentId, teacherId: req.teacher._id },
            { status: 'published' }, { new: true }
        );
        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
        res.status(200).json({ success: true, data: assignment, message: 'Assignment published' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error publishing assignment', error: error.message });
    }
};

exports.closeAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findOneAndUpdate(
            { _id: req.params.assignmentId, teacherId: req.teacher._id },
            { status: 'closed' }, { new: true }
        );
        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
        res.status(200).json({ success: true, data: assignment, message: 'Assignment closed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error closing assignment', error: error.message });
    }
};

exports.getSubmissions = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = { assignmentId: req.params.assignmentId };
        if (status) query.status = status;

        const submissions = await AssignmentSubmission.find(query)
            .populate('studentId', 'firstName lastName studentId')
            .skip((page - 1) * limit).limit(Number(limit));
        const total = await AssignmentSubmission.countDocuments(query);

        res.status(200).json({ success: true, data: submissions, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching submissions', error: error.message });
    }
};

exports.getSubmissionDetails = async (req, res) => {
    try {
        const submission = await AssignmentSubmission.findById(req.params.submissionId)
            .populate('studentId', 'firstName lastName studentId email');
        if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching submission', error: error.message });
    }
};

exports.gradeSubmission = async (req, res) => {
    try {
        const { score, remarks } = req.body;
        const submission = await AssignmentSubmission.findByIdAndUpdate(
            req.params.submissionId,
            { score, remarks, gradedBy: req.teacher._id, gradedAt: new Date(), status: 'graded' },
            { new: true }
        );
        if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
        res.status(200).json({ success: true, data: submission, message: 'Submission graded' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error grading submission', error: error.message });
    }
};

// ============================================
// SECTION 6: GRADES
// ============================================
exports.getMyGrades = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { page = 1, limit = 10, search, classId, subjectId, gradeType, studentId } = req.query;
        const query = { schoolId, teacherId: teacher._id };
        if (classId) query.classId = classId;
        if (subjectId) query.subjectId = subjectId;
        if (gradeType) query.gradeType = gradeType;
        if (studentId) query.studentId = studentId;
        if (search) query.title = { $regex: search, $options: 'i' };

        const grades = await Grade.find(query)
            .populate('studentId', 'firstName lastName studentId')
            .populate('classId', 'name').populate('subjectId', 'name')
            .sort({ date: -1 }).skip((page - 1) * limit).limit(Number(limit));
        const total = await Grade.countDocuments(query);

        res.status(200).json({ success: true, data: grades, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching grades', error: error.message });
    }
};

exports.createGrade = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const grade = await Grade.create({ ...req.body, schoolId, teacherId: teacher._id });
        res.status(201).json({ success: true, data: grade, message: 'Grade created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating grade', error: error.message });
    }
};

exports.updateGrade = async (req, res) => {
    try {
        const grade = await Grade.findOneAndUpdate(
            { _id: req.params.gradeId, teacherId: req.teacher._id },
            req.body, { new: true, runValidators: true }
        );
        if (!grade) return res.status(404).json({ success: false, message: 'Grade not found' });
        res.status(200).json({ success: true, data: grade, message: 'Grade updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating grade', error: error.message });
    }
};

exports.deleteGrade = async (req, res) => {
    try {
        const grade = await Grade.findOneAndDelete({ _id: req.params.gradeId, teacherId: req.teacher._id });
        if (!grade) return res.status(404).json({ success: false, message: 'Grade not found' });
        res.status(200).json({ success: true, message: 'Grade deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting grade', error: error.message });
    }
};

exports.bulkCreateGrades = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { classId, subjectId, gradeType, title, maxScore, date, grades } = req.body;

        const gradeRecords = grades.map(g => ({
            ...g, schoolId, teacherId: teacher._id, classId, subjectId, gradeType, title, maxScore, date,
            percentage: maxScore ? ((g.obtainedScore / maxScore) * 100).toFixed(1) : 0
        }));
        const created = await Grade.insertMany(gradeRecords);
        res.status(201).json({ success: true, data: created, message: `${created.length} grades created` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating grades', error: error.message });
    }
};

// ============================================
// SECTION 7: ATTENDANCE
// ============================================
exports.getAttendance = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { page = 1, limit = 10, date, startDate, endDate, classId, sectionId, subjectId, status } = req.query;
        const query = { schoolId, markedBy: teacher._id };
        if (date) query.date = new Date(date);
        else if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        if (classId) query.classId = classId;
        if (sectionId) query.sectionId = sectionId;
        if (subjectId) query.subjectId = subjectId;
        if (status) query.status = status;

        const records = await StudentAttendance.find(query)
            .populate('studentId', 'firstName lastName studentId')
            .populate('classId', 'name').populate('subjectId', 'name')
            .sort({ date: -1 }).skip((page - 1) * limit).limit(Number(limit));
        const total = await StudentAttendance.countDocuments(query);

        res.status(200).json({ success: true, data: records, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
    }
};

exports.markBulkAttendance = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { classId, sectionId, subjectId, date, attendances } = req.body;

        const records = attendances.map(a => ({
            ...a, schoolId, classId, sectionId, subjectId, date: new Date(date), markedBy: teacher._id
        }));

        // Upsert: remove existing records for the same date/class/subject and re-insert
        await StudentAttendance.deleteMany({ schoolId, classId, subjectId, date: new Date(date) });
        const created = await StudentAttendance.insertMany(records);
        res.status(201).json({ success: true, data: created, message: `Attendance marked for ${created.length} students` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error marking attendance', error: error.message });
    }
};

exports.updateAttendance = async (req, res) => {
    try {
        const record = await StudentAttendance.findByIdAndUpdate(
            req.params.attendanceId, req.body, { new: true, runValidators: true }
        );
        if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found' });
        res.status(200).json({ success: true, data: record, message: 'Attendance updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating attendance', error: error.message });
    }
};

exports.deleteAttendance = async (req, res) => {
    try {
        const record = await StudentAttendance.findByIdAndDelete(req.params.attendanceId);
        if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found' });
        res.status(200).json({ success: true, message: 'Attendance record deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting attendance', error: error.message });
    }
};

exports.getAttendanceStats = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { classId, sectionId, subjectId, startDate, endDate } = req.query;
        const query = { schoolId, markedBy: teacher._id };
        if (classId) query.classId = classId;
        if (sectionId) query.sectionId = sectionId;
        if (subjectId) query.subjectId = subjectId;
        if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };

        const records = await StudentAttendance.find(query);
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const excused = records.filter(r => r.status === 'excused').length;

        res.status(200).json({
            success: true,
            data: { totalDays: total, present, absent, late, excused, percentage: total ? ((present / total) * 100).toFixed(1) : 0 }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
    }
};

exports.getClassAttendanceForDate = async (req, res) => {
    try {
        const { classId, date } = req.params;
        const { subjectId } = req.query;
        const query = { classId, date: new Date(date) };
        if (subjectId) query.subjectId = subjectId;

        const records = await StudentAttendance.find(query)
            .populate('studentId', 'firstName lastName studentId rollNumber');
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;

        res.status(200).json({
            success: true,
            data: {
                date, classId, attendances: records,
                summary: { total, present, absent: total - present, percentage: total ? ((present / total) * 100).toFixed(1) : 0 }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching class attendance', error: error.message });
    }
};

// ============================================
// SECTION 8: TIMETABLE
// ============================================
exports.getMyTimetable = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { academicYear, dayOfWeek } = req.query;

        const timetables = await Timetable.find({ schoolId })
            .populate('classId', 'name section').populate('slots.subjectId', 'name code');

        const periods = [];
        timetables.forEach(tt => {
            tt.slots.forEach(slot => {
                if (slot.teacherId?.toString() === teacher._id.toString()) {
                    if (!dayOfWeek || slot.day.toLowerCase() === dayOfWeek.toLowerCase()) {
                        periods.push({
                            id: slot._id, dayOfWeek: slot.day, period: slot.period,
                            startTime: slot.startTime, endTime: slot.endTime,
                            classId: tt.classId?._id, className: tt.classId?.name,
                            subjectId: slot.subjectId?._id, subjectName: slot.subjectId?.name,
                            roomNumber: slot.roomNumber || ''
                        });
                    }
                }
            });
        });

        res.status(200).json({ success: true, data: { teacherId: teacher._id, periods, totalPeriods: periods.length } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching timetable', error: error.message });
    }
};

exports.getTimetableForDay = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { dayOfWeek } = req.params;

        const timetables = await Timetable.find({ schoolId })
            .populate('classId', 'name section').populate('slots.subjectId', 'name code');

        const periods = [];
        timetables.forEach(tt => {
            tt.slots.forEach(slot => {
                if (slot.teacherId?.toString() === teacher._id.toString() && slot.day.toLowerCase() === dayOfWeek.toLowerCase()) {
                    periods.push({
                        id: slot._id, period: slot.period,
                        startTime: slot.startTime, endTime: slot.endTime,
                        classId: tt.classId?._id, className: tt.classId?.name,
                        subjectId: slot.subjectId?._id, subjectName: slot.subjectId?.name,
                        roomNumber: slot.roomNumber || ''
                    });
                }
            });
        });

        res.status(200).json({ success: true, data: { dayOfWeek, periods } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching timetable', error: error.message });
    }
};

// ============================================
// SECTION 9: EXAMS
// ============================================
exports.getMyExams = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { page = 1, limit = 10, search, classId, subjectId, examType, status } = req.query;

        const classes = await Class.find({ schoolId, 'subjects.teacherId': teacher._id });
        const subjectIds = classes.flatMap(c => c.subjects.filter(s => s.teacherId?.toString() === teacher._id.toString()).map(s => s.subjectId));

        const query = { schoolId, subjectId: { $in: subjectIds } };
        if (classId) query.classId = classId;
        if (subjectId) query.subjectId = subjectId;
        if (examType) query.examType = examType;
        if (status) query.status = status;
        if (search) query.name = { $regex: search, $options: 'i' };

        const exams = await Exam.find(query)
            .populate('classId', 'name').populate('subjectId', 'name')
            .sort({ examDate: -1 }).skip((page - 1) * limit).limit(Number(limit));
        const total = await Exam.countDocuments(query);

        res.status(200).json({ success: true, data: exams, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching exams', error: error.message });
    }
};

exports.getExamDetails = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId)
            .populate('classId', 'name').populate('subjectId', 'name');
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
        res.status(200).json({ success: true, data: exam });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching exam', error: error.message });
    }
};

exports.getExamResults = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query = { examId: req.params.examId };
        const results = await ExamResult.find(query)
            .populate('studentId', 'firstName lastName studentId')
            .populate('examId', 'name maxMarks')
            .skip((page - 1) * limit).limit(Number(limit));
        const total = await ExamResult.countDocuments(query);

        res.status(200).json({ success: true, data: results, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching results', error: error.message });
    }
};

exports.createExamResult = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const exam = await Exam.findById(req.params.examId);
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

        const result = await ExamResult.create({
            ...req.body, schoolId, examId: exam._id, classId: exam.classId, subjectId: exam.subjectId,
            maxMarks: exam.maxMarks, percentage: exam.maxMarks ? ((req.body.marksObtained / exam.maxMarks) * 100).toFixed(1) : 0
        });
        res.status(201).json({ success: true, data: result, message: 'Result created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating result', error: error.message });
    }
};

exports.updateExamResult = async (req, res) => {
    try {
        const result = await ExamResult.findByIdAndUpdate(req.params.resultId, req.body, { new: true, runValidators: true });
        if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
        res.status(200).json({ success: true, data: result, message: 'Result updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating result', error: error.message });
    }
};

exports.bulkCreateExamResults = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const exam = await Exam.findById(req.params.examId);
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

        const records = req.body.results.map(r => ({
            ...r, schoolId, examId: exam._id, classId: exam.classId, subjectId: exam.subjectId,
            maxMarks: exam.maxMarks, percentage: exam.maxMarks ? ((r.marksObtained / exam.maxMarks) * 100).toFixed(1) : 0
        }));
        const created = await ExamResult.insertMany(records);
        res.status(201).json({ success: true, data: created, message: `${created.length} results created` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating results', error: error.message });
    }
};

// ============================================
// SECTION 10: CONTENT
// ============================================
exports.getContentLibrary = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { page = 1, limit = 10, search, subjectId, contentType, classId } = req.query;
        const query = { schoolId };
        if (subjectId) query.subjectId = subjectId;
        if (contentType) query.contentType = contentType;
        if (classId) query.classId = classId;
        if (search) query.title = { $regex: search, $options: 'i' };

        const content = await Content.find(query)
            .populate('subjectId', 'name').populate('classId', 'name')
            .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
        const total = await Content.countDocuments(query);

        res.status(200).json({ success: true, data: content, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching content', error: error.message });
    }
};

exports.getContentDetails = async (req, res) => {
    try {
        const content = await Content.findById(req.params.contentId)
            .populate('subjectId', 'name').populate('classId', 'name');
        if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
        res.status(200).json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching content', error: error.message });
    }
};

exports.createContent = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const content = await Content.create({ ...req.body, schoolId, createdBy: teacher._id });
        res.status(201).json({ success: true, data: content, message: 'Content created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating content', error: error.message });
    }
};

exports.updateContent = async (req, res) => {
    try {
        const content = await Content.findOneAndUpdate(
            { _id: req.params.contentId, createdBy: req.teacher._id },
            req.body, { new: true, runValidators: true }
        );
        if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
        res.status(200).json({ success: true, data: content, message: 'Content updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating content', error: error.message });
    }
};

exports.deleteContent = async (req, res) => {
    try {
        const content = await Content.findOneAndDelete({ _id: req.params.contentId, createdBy: req.teacher._id });
        if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
        res.status(200).json({ success: true, message: 'Content deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting content', error: error.message });
    }
};

// ============================================
// SECTION 11: COMMUNICATION
// ============================================
exports.getNotices = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { page = 1, limit = 10, type, status } = req.query;
        const query = { schoolId, target: { $in: ['teachers', 'all'] } };
        if (type) query.type = type;
        if (status) query.status = status;

        const notices = await Notice.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
        const total = await Notice.countDocuments(query);

        res.status(200).json({ success: true, data: notices, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notices', error: error.message });
    }
};

exports.getNoticeDetails = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.noticeId);
        if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
        // Mark as read
        if (!notice.readBy.includes(req.teacher._id)) {
            notice.readBy.push(req.teacher._id);
            await notice.save();
        }
        res.status(200).json({ success: true, data: notice });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notice', error: error.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { recipientId, recipientType, subject, message, priority } = req.body;

        const comm = await StudentCommunication.create({
            schoolId, studentId: recipientId, type: 'notification',
            subject, message, priority: priority || 'normal',
            sentBy: teacher._id, sentAt: new Date(), status: 'sent'
        });
        res.status(201).json({ success: true, data: comm, message: 'Message sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sending message', error: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { page = 1, limit = 10, type, status } = req.query;
        const query = { schoolId, sentBy: teacher._id };
        if (status) query.status = status;

        const messages = await StudentCommunication.find(query)
            .populate('studentId', 'firstName lastName')
            .sort({ sentAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
        const total = await StudentCommunication.countDocuments(query);

        res.status(200).json({ success: true, data: messages, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching messages', error: error.message });
    }
};

// ============================================
// SECTION 12: LEAVE
// ============================================
exports.getLeaveRequests = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;
        const query = { schoolId, teacherId: teacher._id };
        if (status) query.status = status;
        if (startDate && endDate) query.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };

        const leaves = await TeacherLeave.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
        const total = await TeacherLeave.countDocuments(query);

        res.status(200).json({ success: true, data: leaves, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching leave requests', error: error.message });
    }
};

exports.createLeaveRequest = async (req, res) => {
    try {
        const teacher = req.teacher;
        const schoolId = teacher.schoolId._id || teacher.schoolId;
        const { leaveType, startDate, endDate, reason, attachments } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const leave = await TeacherLeave.create({
            schoolId, teacherId: teacher._id, leaveType, startDate: start, endDate: end, days, reason,
            attachments: attachments || [], status: 'pending'
        });
        res.status(201).json({ success: true, data: leave, message: 'Leave request submitted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating leave request', error: error.message });
    }
};

exports.updateLeaveRequest = async (req, res) => {
    try {
        const leave = await TeacherLeave.findOneAndUpdate(
            { _id: req.params.requestId, teacherId: req.teacher._id, status: 'pending' },
            req.body, { new: true, runValidators: true }
        );
        if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found or already processed' });
        res.status(200).json({ success: true, data: leave, message: 'Leave request updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating leave request', error: error.message });
    }
};

exports.cancelLeaveRequest = async (req, res) => {
    try {
        const leave = await TeacherLeave.findOneAndDelete(
            { _id: req.params.requestId, teacherId: req.teacher._id, status: 'pending' }
        );
        if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found or already processed' });
        res.status(200).json({ success: true, message: 'Leave request cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error cancelling leave request', error: error.message });
    }
};

exports.getLeaveBalance = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher._id).select('leaveBalance');
        const balance = teacher.leaveBalance || {
            sick: { total: 12, used: 0 },
            casual: { total: 10, used: 0 },
            earned: { total: 15, used: 0 }
        };

        res.status(200).json({
            success: true,
            data: {
                sick: { ...balance.sick.toObject?.() || balance.sick, remaining: (balance.sick.total || 12) - (balance.sick.used || 0) },
                casual: { ...balance.casual.toObject?.() || balance.casual, remaining: (balance.casual.total || 10) - (balance.casual.used || 0) },
                earned: { ...balance.earned.toObject?.() || balance.earned, remaining: (balance.earned.total || 15) - (balance.earned.used || 0) }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching leave balance', error: error.message });
    }
};

// ============================================
// SECTION 13: SETTINGS
// ============================================
exports.getSettings = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher._id).select('settings');
        res.status(200).json({
            success: true,
            data: teacher.settings || {
                notifications: { email: true, sms: false, push: true },
                preferences: { language: 'en', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY' }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const updates = {};
        if (req.body.notifications) updates['settings.notifications'] = req.body.notifications;
        if (req.body.preferences) updates['settings.preferences'] = req.body.preferences;

        const teacher = await Teacher.findByIdAndUpdate(req.teacher._id, { $set: updates }, { new: true }).select('settings');
        res.status(200).json({ success: true, data: teacher.settings, message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating settings', error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'Current password, new password and confirm password are required' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const teacher = await Teacher.findById(req.teacher._id).select('+password');
        const isMatch = await teacher.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        teacher.password = newPassword;
        await teacher.save();
        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
    }
};

