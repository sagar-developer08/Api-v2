const Student = require('../models/Student');
const Guardian = require('../models/Guardian');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const AcademicYear = require('../models/AcademicYear');
const StudentAttendance = require('../models/StudentAttendance');
const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const StudentDocument = require('../models/StudentDocument');
const StudentCommunication = require('../models/StudentCommunication');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Grade = require('../models/Grade');
const Timetable = require('../models/Timetable');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Notice = require('../models/Notice');
const Content = require('../models/Content');
const mongoose = require('mongoose');

// ============================================
// SECTION 1: DASHBOARD
// ============================================
exports.getDashboardStats = async (req, res) => {
    try {
        const student = req.student;
        const schoolId = student.schoolId._id || student.schoolId;
        const filter = { schoolId, studentId: student._id };

        const [assignmentCount, pendingSubmissions, grades, attendance, upcomingExams, pendingFees, notices] = await Promise.all([
            Assignment.countDocuments({ schoolId, classId: student.classId, status: 'published' }),
            Assignment.countDocuments({ schoolId, classId: student.classId, status: 'published', dueDate: { $gte: new Date() } }),
            Grade.find({ ...filter }).select('obtainedScore maxScore'),
            StudentAttendance.find(filter).select('status'),
            Exam.countDocuments({ schoolId, classId: student.classId, status: 'scheduled', examDate: { $gte: new Date() } }),
            StudentFee.find({ ...filter, status: { $in: ['pending', 'partial', 'overdue'] } }).select('pendingAmount'),
            Notice.countDocuments({ schoolId, status: 'published', target: { $in: ['all', 'students'] } })
        ]);

        const totalGrades = grades.length;
        const avgGrade = totalGrades > 0 ? Math.round(grades.reduce((sum, g) => sum + (g.obtainedScore / g.maxScore * 100), 0) / totalGrades * 10) / 10 : 0;
        const totalAtt = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
        const attPercentage = totalAtt > 0 ? Math.round(presentCount / totalAtt * 1000) / 10 : 0;

        const subjects = await Class.findById(student.classId).select('subjects');
        const totalSubjects = subjects ? subjects.subjects.length : 0;

        res.json({
            success: true,
            data: {
                totalClasses: 1,
                totalSubjects,
                totalAssignments: assignmentCount,
                pendingAssignments: pendingSubmissions,
                averageGrade: avgGrade,
                attendancePercentage: attPercentage,
                upcomingExams,
                pendingFees: { count: pendingFees.length, amount: pendingFees.reduce((s, f) => s + (f.pendingAmount || 0), 0) },
                recentAnnouncements: notices
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching dashboard stats', error: error.message });
    }
};

// ============================================
// SECTION 2: PROFILE
// ============================================
exports.getProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.student._id)
            .populate('classId', 'name code grade section')
            .populate('sectionId', 'name code')
            .populate('academicYearId', 'label startYear endYear');

        const guardian = await Guardian.findOne({ studentId: student._id, isPrimary: true });

        res.json({
            success: true,
            data: {
                id: student._id,
                studentId: student.studentId,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                phone: student.phone,
                dateOfBirth: student.dateOfBirth,
                gender: student.gender,
                address: student.address,
                classId: student.classId?._id,
                className: student.classId?.name,
                sectionId: student.sectionId?._id,
                sectionName: student.sectionId?.name,
                rollNumber: student.rollNumber,
                academicYear: student.academicYearId?.label,
                parentName: guardian?.name || student.parentName,
                parentEmail: guardian?.email,
                parentPhone: guardian?.phone || student.parentPhone,
                admissionDate: student.admissionDate,
                status: student.status,
                profilePhoto: student.avatar,
                createdAt: student.createdAt,
                updatedAt: student.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const allowed = ['phone', 'address', 'communicationAddress', 'avatar'];
        const updates = {};
        allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
        if (req.body.profilePhoto) updates.avatar = req.body.profilePhoto;

        const student = await Student.findByIdAndUpdate(req.student._id, updates, { new: true, runValidators: true })
            .populate('classId', 'name').populate('sectionId', 'name');

        res.json({ success: true, data: student, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
    }
};

// ============================================
// SECTION 3: CLASSES
// ============================================
exports.getMyClasses = async (req, res) => {
    try {
        const student = req.student;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const cls = await Class.findById(student.classId)
            .populate('teacherId', 'firstName lastName email phone designation')
            .populate('subjects.subjectId', 'name code')
            .populate('subjects.teacherId', 'firstName lastName');

        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

        const studentCount = await Student.countDocuments({ classId: cls._id, status: 'active' });

        const classData = {
            id: cls._id,
            name: cls.name,
            code: cls.code,
            grade: cls.grade,
            section: cls.section,
            academicYear: cls.academicYearId,
            teacherId: cls.teacherId?._id,
            teacherName: cls.teacherId ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}` : null,
            studentCount,
            maxStudents: cls.maxStudents,
            subjects: cls.subjects.map(s => ({
                id: s.subjectId?._id,
                name: s.subjectId?.name,
                code: s.subjectId?.code,
                teacherId: s.teacherId?._id,
                teacherName: s.teacherId ? `${s.teacherId.firstName} ${s.teacherId.lastName}` : null
            })),
            roomNumber: cls.roomNumber,
            createdAt: cls.createdAt,
            updatedAt: cls.updatedAt
        };

        res.json({ success: true, data: [classData], total: 1, page, limit, totalPages: 1 });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching classes', error: error.message });
    }
};

exports.getClassDetails = async (req, res) => {
    try {
        const cls = await Class.findById(req.params.classId)
            .populate('teacherId', 'firstName lastName email phone designation')
            .populate('subjects.subjectId', 'name code')
            .populate('subjects.teacherId', 'firstName lastName');

        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

        const [studentCount, students] = await Promise.all([
            Student.countDocuments({ classId: cls._id, status: 'active' }),
            Student.find({ classId: cls._id, status: 'active' }).select('firstName lastName rollNumber admissionNumber avatar').limit(50)
        ]);

        res.json({
            success: true,
            data: {
                id: cls._id, name: cls.name, code: cls.code, grade: cls.grade, section: cls.section,
                teacherId: cls.teacherId?._id,
                teacherName: cls.teacherId ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}` : null,
                studentCount, maxStudents: cls.maxStudents,
                subjects: cls.subjects.map(s => ({
                    id: s.subjectId?._id, name: s.subjectId?.name, code: s.subjectId?.code,
                    teacherId: s.teacherId?._id,
                    teacherName: s.teacherId ? `${s.teacherId.firstName} ${s.teacherId.lastName}` : null
                })),
                roomNumber: cls.roomNumber,
                classTeacher: cls.teacherId ? {
                    id: cls.teacherId._id, name: `${cls.teacherId.firstName} ${cls.teacherId.lastName}`,
                    email: cls.teacherId.email, phone: cls.teacherId.phone,
                    designation: cls.teacherId.designation
                } : null,
                students: students.map(s => ({
                    id: s._id, name: `${s.firstName} ${s.lastName}`,
                    rollNumber: s.rollNumber, admissionNumber: s.admissionNumber, profilePhoto: s.avatar
                })),
                createdAt: cls.createdAt, updatedAt: cls.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching class details', error: error.message });
    }
};

exports.getClassStudents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { classId: req.params.classId, status: 'active' };
        if (req.query.search) {
            query.$or = [
                { firstName: new RegExp(req.query.search, 'i') },
                { lastName: new RegExp(req.query.search, 'i') }
            ];
        }
        const [students, total] = await Promise.all([
            Student.find(query).select('firstName lastName rollNumber admissionNumber avatar email phone')
                .skip((page - 1) * limit).limit(limit).sort({ rollNumber: 1 }),
            Student.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: students.map(s => ({
                id: s._id, name: `${s.firstName} ${s.lastName}`, rollNumber: s.rollNumber,
                admissionNumber: s.admissionNumber, profilePhoto: s.avatar, email: s.email, phone: s.phone
            })),
            total, page, limit, totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching class students', error: error.message });
    }
};

exports.getClassTeacher = async (req, res) => {
    try {
        const cls = await Class.findById(req.params.classId).populate('teacherId', 'firstName lastName email phone designation');
        if (!cls || !cls.teacherId) return res.status(404).json({ success: false, message: 'Teacher not found' });
        const t = cls.teacherId;
        res.json({
            success: true,
            data: { id: t._id, name: `${t.firstName} ${t.lastName}`, email: t.email, phone: t.phone, designation: t.designation }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching class teacher', error: error.message });
    }
};

// ============================================
// SECTION 4: SUBJECTS
// ============================================
exports.getMySubjects = async (req, res) => {
    try {
        const student = req.student;
        const cls = await Class.findById(student.classId)
            .populate('subjects.subjectId', 'name code type')
            .populate('subjects.teacherId', 'firstName lastName email phone designation');

        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const subjects = cls.subjects.map(s => ({
            id: s.subjectId?._id, name: s.subjectId?.name, code: s.subjectId?.code,
            description: s.subjectId?.type,
            teacherId: s.teacherId?._id,
            teacherName: s.teacherId ? `${s.teacherId.firstName} ${s.teacherId.lastName}` : null,
            status: 'active',
            createdAt: s.assignedAt
        }));

        res.json({ success: true, data: subjects, total: subjects.length, page, limit, totalPages: 1 });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching subjects', error: error.message });
    }
};

exports.getSubjectDetails = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.subjectId);
        if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

        const cls = await Class.findById(req.student.classId);
        const subjectEntry = cls?.subjects.find(s => s.subjectId?.toString() === req.params.subjectId);
        let teacher = null;
        if (subjectEntry?.teacherId) {
            teacher = await Teacher.findById(subjectEntry.teacherId).select('firstName lastName email phone designation');
        }

        res.json({
            success: true,
            data: {
                id: subject._id, name: subject.name, code: subject.code, description: subject.type,
                status: 'active',
                teacher: teacher ? {
                    id: teacher._id, name: `${teacher.firstName} ${teacher.lastName}`,
                    email: teacher.email, phone: teacher.phone, designation: teacher.designation
                } : null,
                createdAt: subject.createdAt, updatedAt: subject.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching subject details', error: error.message });
    }
};

// ============================================
// SECTION 5: ASSIGNMENTS
// ============================================
exports.getMyAssignments = async (req, res) => {
    try {
        const student = req.student;
        const schoolId = student.schoolId._id || student.schoolId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const query = { schoolId, classId: student.classId };
        if (req.query.subjectId) query.subjectId = req.query.subjectId;
        if (req.query.search) query.title = new RegExp(req.query.search, 'i');
        if (req.query.status === 'published' || !req.query.status) query.status = 'published';

        const [assignments, total] = await Promise.all([
            Assignment.find(query)
                .populate('subjectId', 'name code').populate('teacherId', 'firstName lastName')
                .populate('classId', 'name')
                .skip((page - 1) * limit).limit(limit).sort({ dueDate: -1 }),
            Assignment.countDocuments(query)
        ]);

        const assignmentIds = assignments.map(a => a._id);
        const submissions = await AssignmentSubmission.find({ studentId: student._id, assignmentId: { $in: assignmentIds } });
        const subMap = {};
        submissions.forEach(s => { subMap[s.assignmentId.toString()] = s; });

        const data = assignments.map(a => ({
            id: a._id, title: a.title, description: a.description,
            classId: a.classId?._id, className: a.classId?.name,
            subjectId: a.subjectId?._id, subjectName: a.subjectId?.name,
            teacherId: a.teacherId?._id, teacherName: a.teacherId ? `${a.teacherId.firstName} ${a.teacherId.lastName}` : null,
            dueDate: a.dueDate, maxScore: a.maxScore, status: a.status,
            mySubmission: subMap[a._id.toString()] ? {
                id: subMap[a._id.toString()]._id, status: subMap[a._id.toString()].status,
                submittedAt: subMap[a._id.toString()].submittedAt,
                score: subMap[a._id.toString()].score, gradedAt: subMap[a._id.toString()].gradedAt
            } : null,
            createdAt: a.createdAt, updatedAt: a.updatedAt
        }));

        // Filter by student-side status if requested
        let filtered = data;
        if (req.query.status === 'pending') filtered = data.filter(d => !d.mySubmission);
        else if (req.query.status === 'submitted') filtered = data.filter(d => d.mySubmission?.status === 'submitted');
        else if (req.query.status === 'graded') filtered = data.filter(d => d.mySubmission?.status === 'graded');

        res.json({ success: true, data: filtered, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching assignments', error: error.message });
    }
};

exports.getAssignmentDetails = async (req, res) => {
    try {
        const a = await Assignment.findById(req.params.assignmentId)
            .populate('subjectId', 'name code').populate('teacherId', 'firstName lastName')
            .populate('classId', 'name');
        if (!a) return res.status(404).json({ success: false, message: 'Assignment not found' });

        const sub = await AssignmentSubmission.findOne({ assignmentId: a._id, studentId: req.student._id });

        res.json({
            success: true,
            data: {
                id: a._id, title: a.title, description: a.description,
                classId: a.classId?._id, className: a.classId?.name,
                subjectId: a.subjectId?._id, subjectName: a.subjectId?.name,
                teacherId: a.teacherId?._id, teacherName: a.teacherId ? `${a.teacherId.firstName} ${a.teacherId.lastName}` : null,
                dueDate: a.dueDate, maxScore: a.maxScore, status: a.status, attachments: a.attachments,
                mySubmission: sub ? {
                    id: sub._id, submissionText: sub.submissionText, attachments: sub.attachments,
                    submittedAt: sub.submittedAt, status: sub.status, score: sub.score,
                    gradedAt: sub.gradedAt, remarks: sub.remarks
                } : null,
                createdAt: a.createdAt, updatedAt: a.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching assignment details', error: error.message });
    }
};

exports.getMySubmission = async (req, res) => {
    try {
        const sub = await AssignmentSubmission.findOne({ assignmentId: req.params.assignmentId, studentId: req.student._id });
        if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
        res.json({ success: true, data: sub });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching submission', error: error.message });
    }
};

exports.submitAssignment = async (req, res) => {
    try {
        const student = req.student;
        const assignment = await Assignment.findById(req.params.assignmentId);
        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

        const existing = await AssignmentSubmission.findOne({ assignmentId: assignment._id, studentId: student._id });
        if (existing) return res.status(409).json({ success: false, message: 'Already submitted' });

        const isLate = new Date() > assignment.dueDate;
        const submission = await AssignmentSubmission.create({
            schoolId: student.schoolId._id || student.schoolId,
            assignmentId: assignment._id, studentId: student._id,
            submissionText: req.body.submissionText, attachments: req.body.attachments || [],
            status: isLate ? 'late' : 'submitted'
        });

        res.status(201).json({ success: true, data: submission, message: 'Assignment submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error submitting assignment', error: error.message });
    }
};

exports.updateSubmission = async (req, res) => {
    try {
        const sub = await AssignmentSubmission.findOne({ assignmentId: req.params.assignmentId, studentId: req.student._id });
        if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
        if (sub.status === 'graded') return res.status(400).json({ success: false, message: 'Cannot update graded submission' });

        const assignment = await Assignment.findById(req.params.assignmentId);
        if (assignment && new Date() > assignment.dueDate) return res.status(400).json({ success: false, message: 'Due date has passed' });

        if (req.body.submissionText !== undefined) sub.submissionText = req.body.submissionText;
        if (req.body.attachments) sub.attachments = req.body.attachments;
        sub.submittedAt = new Date();
        sub.status = 'resubmitted';
        await sub.save();

        res.json({ success: true, data: sub, message: 'Submission updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating submission', error: error.message });
    }
};

// ============================================
// SECTION 6: GRADES
// ============================================
exports.getMyGrades = async (req, res) => {
    try {
        const student = req.student;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { studentId: student._id, schoolId: student.schoolId._id || student.schoolId };
        if (req.query.subjectId) query.subjectId = req.query.subjectId;
        if (req.query.gradeType) query.gradeType = req.query.gradeType;
        if (req.query.search) query.title = new RegExp(req.query.search, 'i');

        const [grades, total] = await Promise.all([
            Grade.find(query).populate('subjectId', 'name').populate('classId', 'name').populate('gradedBy', 'firstName lastName')
                .skip((page - 1) * limit).limit(limit).sort({ date: -1 }),
            Grade.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: grades.map(g => ({
                id: g._id, classId: g.classId?._id, className: g.classId?.name,
                subjectId: g.subjectId?._id, subjectName: g.subjectId?.name,
                gradeType: g.gradeType, title: g.title, description: g.description,
                maxScore: g.maxScore, obtainedScore: g.obtainedScore, percentage: g.percentage,
                letterGrade: g.letterGrade, date: g.date,
                gradedBy: g.gradedBy?._id, gradedByName: g.gradedBy ? `${g.gradedBy.firstName} ${g.gradedBy.lastName}` : null,
                remarks: g.remarks, createdAt: g.createdAt, updatedAt: g.updatedAt
            })),
            total, page, limit, totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching grades', error: error.message });
    }
};

exports.getGradeDetails = async (req, res) => {
    try {
        const g = await Grade.findOne({ _id: req.params.gradeId, studentId: req.student._id })
            .populate('subjectId', 'name').populate('classId', 'name').populate('gradedBy', 'firstName lastName');
        if (!g) return res.status(404).json({ success: false, message: 'Grade not found' });
        res.json({ success: true, data: g });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching grade details', error: error.message });
    }
};

exports.getGradesSummary = async (req, res) => {
    try {
        const student = req.student;
        const query = { studentId: student._id, schoolId: student.schoolId._id || student.schoolId };
        if (req.query.subjectId) query.subjectId = req.query.subjectId;

        const grades = await Grade.find(query).populate('subjectId', 'name');
        const totalGrades = grades.length;
        const avgScore = totalGrades > 0 ? Math.round(grades.reduce((s, g) => s + g.percentage, 0) / totalGrades * 10) / 10 : 0;

        const bySubject = {};
        grades.forEach(g => {
            const sid = g.subjectId?._id?.toString() || 'unknown';
            if (!bySubject[sid]) bySubject[sid] = { subjectId: sid, subjectName: g.subjectId?.name, scores: [], totalGrades: 0 };
            bySubject[sid].scores.push(g.percentage);
            bySubject[sid].totalGrades++;
        });

        const byType = {};
        grades.forEach(g => {
            if (!byType[g.gradeType]) byType[g.gradeType] = { gradeType: g.gradeType, scores: [], totalGrades: 0 };
            byType[g.gradeType].scores.push(g.percentage);
            byType[g.gradeType].totalGrades++;
        });

        res.json({
            success: true,
            data: {
                overall: { averageScore: avgScore, totalGrades },
                bySubject: Object.values(bySubject).map(s => ({
                    ...s, averageScore: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length * 10) / 10, scores: undefined
                })),
                byGradeType: Object.values(byType).map(t => ({
                    ...t, averageScore: Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length * 10) / 10, scores: undefined
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching grades summary', error: error.message });
    }
};

// ============================================
// SECTION 7: ATTENDANCE
// ============================================
exports.getMyAttendance = async (req, res) => {
    try {
        const student = req.student;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { studentId: student._id, schoolId: student.schoolId._id || student.schoolId };
        if (req.query.startDate) query.date = { ...query.date, $gte: new Date(req.query.startDate) };
        if (req.query.endDate) query.date = { ...query.date, $lte: new Date(req.query.endDate) };
        if (req.query.status) query.status = req.query.status;

        const [records, total, allRecords] = await Promise.all([
            StudentAttendance.find(query).populate('classId', 'name').populate('markedBy', 'firstName lastName')
                .skip((page - 1) * limit).limit(limit).sort({ date: -1 }),
            StudentAttendance.countDocuments(query),
            StudentAttendance.find({ studentId: student._id, schoolId: student.schoolId._id || student.schoolId }).select('status')
        ]);

        const summary = {
            totalDays: allRecords.length,
            present: allRecords.filter(r => r.status === 'present').length,
            absent: allRecords.filter(r => r.status === 'absent').length,
            late: allRecords.filter(r => r.status === 'late').length,
            excused: allRecords.filter(r => r.status === 'on-leave').length,
            percentage: allRecords.length > 0 ? Math.round(allRecords.filter(r => r.status === 'present' || r.status === 'late').length / allRecords.length * 1000) / 10 : 0
        };

        res.json({
            success: true,
            data: records.map(r => ({
                id: r._id, date: r.date, status: r.status,
                classId: r.classId?._id, className: r.classId?.name,
                remarks: r.remarks,
                markedBy: r.markedBy?._id, markedByName: r.markedBy ? `${r.markedBy.firstName} ${r.markedBy.lastName}` : null,
                createdAt: r.createdAt, updatedAt: r.updatedAt
            })),
            total, page, limit, totalPages: Math.ceil(total / limit), summary
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
    }
};

exports.getAttendanceSummary = async (req, res) => {
    try {
        const student = req.student;
        const query = { studentId: student._id, schoolId: student.schoolId._id || student.schoolId };
        if (req.query.startDate) query.date = { ...query.date, $gte: new Date(req.query.startDate) };
        if (req.query.endDate) query.date = { ...query.date, $lte: new Date(req.query.endDate) };

        const records = await StudentAttendance.find(query).select('status date');
        const total = records.length;
        const present = records.filter(r => r.status === 'present' || r.status === 'late').length;

        const byMonth = {};
        records.forEach(r => {
            const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
            if (!byMonth[key]) byMonth[key] = { month: key, totalDays: 0, present: 0, absent: 0 };
            byMonth[key].totalDays++;
            if (r.status === 'present' || r.status === 'late') byMonth[key].present++;
            else byMonth[key].absent++;
        });

        res.json({
            success: true,
            data: {
                overall: {
                    totalDays: total, present, absent: records.filter(r => r.status === 'absent').length,
                    late: records.filter(r => r.status === 'late').length,
                    excused: records.filter(r => r.status === 'on-leave').length,
                    percentage: total > 0 ? Math.round(present / total * 1000) / 10 : 0
                },
                byMonth: Object.values(byMonth).map(m => ({ ...m, percentage: m.totalDays > 0 ? Math.round(m.present / m.totalDays * 1000) / 10 : 0 }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching attendance summary', error: error.message });
    }
};

exports.getAttendanceCalendar = async (req, res) => {
    try {
        if (!req.query.month) return res.status(400).json({ success: false, message: 'month parameter required (YYYY-MM)' });
        const [year, month] = req.query.month.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const student = req.student;
        const query = { studentId: student._id, schoolId: student.schoolId._id || student.schoolId, date: { $gte: startDate, $lte: endDate } };

        const records = await StudentAttendance.find(query).select('date status').sort({ date: 1 });
        const present = records.filter(r => r.status === 'present' || r.status === 'late').length;

        res.json({
            success: true,
            data: {
                month: req.query.month,
                attendance: records.map(r => ({ date: r.date, status: r.status })),
                summary: {
                    totalDays: records.length, present, absent: records.filter(r => r.status === 'absent').length,
                    percentage: records.length > 0 ? Math.round(present / records.length * 1000) / 10 : 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching attendance calendar', error: error.message });
    }
};

// ============================================
// SECTION 8: TIMETABLE
// ============================================
exports.getMyTimetable = async (req, res) => {
    try {
        const student = req.student;
        const query = { schoolId: student.schoolId._id || student.schoolId, classId: student.classId, status: 'active' };

        const timetable = await Timetable.findOne(query)
            .populate('classId', 'name')
            .populate('slots.subjectId', 'name code')
            .populate('slots.teacherId', 'firstName lastName');

        if (!timetable) return res.json({ success: true, data: { classId: student.classId, periods: [], totalPeriods: 0 } });

        let slots = timetable.slots;
        if (req.query.dayOfWeek) slots = slots.filter(s => s.dayOfWeek === req.query.dayOfWeek.toLowerCase());

        res.json({
            success: true,
            data: {
                classId: timetable.classId?._id, className: timetable.classId?.name,
                academicYear: timetable.academicYearId,
                periods: slots.map(s => ({
                    id: s._id, dayOfWeek: s.dayOfWeek, period: s.period,
                    startTime: s.startTime, endTime: s.endTime,
                    subjectId: s.subjectId?._id, subjectName: s.subjectId?.name,
                    teacherId: s.teacherId?._id, teacherName: s.teacherId ? `${s.teacherId.firstName} ${s.teacherId.lastName}` : null,
                    roomNumber: s.roomNumber
                })),
                totalPeriods: timetable.slots.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching timetable', error: error.message });
    }
};

exports.getTimetableForDay = async (req, res) => {
    try {
        const student = req.student;
        const dayOfWeek = req.params.dayOfWeek.toLowerCase();
        const query = { schoolId: student.schoolId._id || student.schoolId, classId: student.classId, status: 'active' };

        const timetable = await Timetable.findOne(query)
            .populate('slots.subjectId', 'name code')
            .populate('slots.teacherId', 'firstName lastName');

        if (!timetable) return res.json({ success: true, data: { dayOfWeek, periods: [] } });

        const slots = timetable.slots.filter(s => s.dayOfWeek === dayOfWeek);

        res.json({
            success: true,
            data: {
                dayOfWeek,
                periods: slots.sort((a, b) => a.period - b.period).map(s => ({
                    id: s._id, period: s.period, startTime: s.startTime, endTime: s.endTime,
                    subjectId: s.subjectId?._id, subjectName: s.subjectId?.name,
                    teacherId: s.teacherId?._id, teacherName: s.teacherId ? `${s.teacherId.firstName} ${s.teacherId.lastName}` : null,
                    roomNumber: s.roomNumber
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching timetable for day', error: error.message });
    }
};

// ============================================
// SECTION 9: EXAMS
// ============================================
exports.getMyExams = async (req, res) => {
    try {
        const student = req.student;
        const schoolId = student.schoolId._id || student.schoolId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { schoolId, classId: student.classId };
        if (req.query.status) query.status = req.query.status;
        if (req.query.examType) query.examType = req.query.examType;
        if (req.query.search) query.name = new RegExp(req.query.search, 'i');

        const [exams, total] = await Promise.all([
            Exam.find(query).populate('subjectId', 'name code').populate('classId', 'name')
                .skip((page - 1) * limit).limit(limit).sort({ examDate: -1 }),
            Exam.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: exams.map(e => ({
                id: e._id, name: e.name, examType: e.examType, examDate: e.examDate,
                startTime: e.startTime, endTime: e.endTime, duration: e.duration,
                subjectId: e.subjectId?._id, subjectName: e.subjectId?.name,
                classId: e.classId?._id, className: e.classId?.name,
                maxMarks: e.maxMarks, passingMarks: e.passingMarks, status: e.status,
                venue: e.venue, createdAt: e.createdAt
            })),
            total, page, limit, totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching exams', error: error.message });
    }
};

exports.getExamDetails = async (req, res) => {
    try {
        const e = await Exam.findById(req.params.examId)
            .populate('subjectId', 'name code').populate('classId', 'name');
        if (!e) return res.status(404).json({ success: false, message: 'Exam not found' });
        res.json({ success: true, data: e });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching exam details', error: error.message });
    }
};

exports.getMyExamResults = async (req, res) => {
    try {
        const student = req.student;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { studentId: student._id, schoolId: student.schoolId._id || student.schoolId };

        const [results, total] = await Promise.all([
            ExamResult.find(query).populate({ path: 'examId', populate: [{ path: 'subjectId', select: 'name code' }, { path: 'classId', select: 'name' }] })
                .skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
            ExamResult.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: results.map(r => ({
                id: r._id, examId: r.examId?._id, examName: r.examId?.name,
                subjectName: r.examId?.subjectId?.name, className: r.examId?.classId?.name,
                marksObtained: r.marksObtained, maxMarks: r.maxMarks, percentage: r.percentage,
                grade: r.grade, rank: r.rank, percentile: r.percentile, publishedAt: r.publishedAt
            })),
            total, page, limit, totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching exam results', error: error.message });
    }
};

exports.getExamResultDetails = async (req, res) => {
    try {
        const r = await ExamResult.findOne({ _id: req.params.resultId, studentId: req.student._id })
            .populate({ path: 'examId', populate: [{ path: 'subjectId', select: 'name code' }, { path: 'classId', select: 'name' }] });
        if (!r) return res.status(404).json({ success: false, message: 'Result not found' });
        res.json({ success: true, data: r });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching result details', error: error.message });
    }
};

exports.getHallTicket = async (req, res) => {
    try {
        const student = req.student;
        const exam = await Exam.findById(req.params.examId).populate('subjectId', 'name').populate('classId', 'name');
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

        const result = await ExamResult.findOne({ examId: exam._id, studentId: student._id });

        res.json({
            success: true,
            data: {
                student: { id: student._id, name: `${student.firstName} ${student.lastName}`, admissionNumber: student.admissionNumber, rollNumber: student.rollNumber, photo: student.avatar },
                exam: { id: exam._id, name: exam.name, examType: exam.examType, examDate: exam.examDate, startTime: exam.startTime, endTime: exam.endTime, venue: exam.venue, instructions: exam.instructions },
                subject: { name: exam.subjectId?.name },
                seatNumber: result?.seatNumber || null,
                instructions: result?.hallTicketInstructions || exam.instructions
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching hall ticket', error: error.message });
    }
};

// ============================================
// SECTION 10: FEES
// ============================================
exports.getMyFees = async (req, res) => {
    try {
        const student = req.student;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { studentId: student._id, schoolId: student.schoolId._id || student.schoolId };
        if (req.query.status) query.status = req.query.status;
        if (req.query.search) query.feeType = new RegExp(req.query.search, 'i');

        const [fees, total] = await Promise.all([
            StudentFee.find(query).skip((page - 1) * limit).limit(limit).sort({ dueDate: -1 }),
            StudentFee.countDocuments(query)
        ]);

        const allFees = await StudentFee.find({ studentId: student._id, schoolId: student.schoolId._id || student.schoolId });
        const summary = {
            totalFees: allFees.reduce((s, f) => s + f.amount, 0),
            totalPaid: allFees.reduce((s, f) => s + f.paidAmount, 0),
            totalPending: allFees.reduce((s, f) => s + (f.pendingAmount || 0), 0),
            totalOverdue: allFees.filter(f => f.status === 'overdue').reduce((s, f) => s + (f.pendingAmount || 0), 0)
        };

        res.json({
            success: true,
            data: fees.map(f => ({
                id: f._id, feeType: f.feeType, description: f.description,
                amount: f.amount, paidAmount: f.paidAmount, pendingAmount: f.pendingAmount,
                dueDate: f.dueDate, status: f.status, academicYear: f.academicYearId,
                createdAt: f.createdAt
            })),
            total, page, limit, totalPages: Math.ceil(total / limit), summary
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching fees', error: error.message });
    }
};

exports.getFeeDetails = async (req, res) => {
    try {
        const fee = await StudentFee.findOne({ _id: req.params.feeId, studentId: req.student._id });
        if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });
        const payments = await FeePayment.find({ feeId: fee._id }).sort({ paymentDate: -1 });
        res.json({ success: true, data: { ...fee.toObject(), payments } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching fee details', error: error.message });
    }
};

exports.getPayments = async (req, res) => {
    try {
        const student = req.student;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { studentId: student._id, schoolId: student.schoolId._id || student.schoolId };

        const [payments, total] = await Promise.all([
            FeePayment.find(query).populate('feeId', 'feeType amount')
                .skip((page - 1) * limit).limit(limit).sort({ paymentDate: -1 }),
            FeePayment.countDocuments(query)
        ]);

        res.json({ success: true, data: payments, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching payments', error: error.message });
    }
};

exports.getPaymentReceipt = async (req, res) => {
    try {
        const payment = await FeePayment.findOne({ _id: req.params.paymentId, studentId: req.student._id })
            .populate('feeId', 'feeType amount description');
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
        const student = req.student;
        res.json({
            success: true,
            data: {
                receiptNumber: payment.transactionId || payment._id,
                student: { id: student._id, name: `${student.firstName} ${student.lastName}`, admissionNumber: student.admissionNumber },
                fee: payment.feeId,
                payment: { amount: payment.amount, mode: payment.mode, date: payment.paymentDate, transactionId: payment.transactionId, status: payment.status },
                school: { id: student.schoolId._id || student.schoolId, name: student.schoolId?.schoolName }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching payment receipt', error: error.message });
    }
};

// ============================================
// SECTION 11: DOCUMENTS
// ============================================
exports.getMyDocuments = async (req, res) => {
    try {
        const student = req.student;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { studentId: student._id, schoolId: student.schoolId._id || student.schoolId };
        if (req.query.type) query.type = req.query.type;
        if (req.query.search) query.name = new RegExp(req.query.search, 'i');

        const [docs, total] = await Promise.all([
            StudentDocument.find(query).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
            StudentDocument.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: docs.map(d => ({
                id: d._id, name: d.name, type: d.type, fileUrl: d.fileUrl,
                fileSize: d.fileSize, mimeType: d.mimeType,
                verificationStatus: d.verificationStatus, remarks: d.remarks,
                createdAt: d.createdAt, updatedAt: d.updatedAt
            })),
            total, page, limit, totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching documents', error: error.message });
    }
};

exports.getDocumentDetails = async (req, res) => {
    try {
        const doc = await StudentDocument.findOne({ _id: req.params.documentId, studentId: req.student._id });
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
        res.json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching document details', error: error.message });
    }
};

exports.uploadDocument = async (req, res) => {
    try {
        const student = req.student;
        const { name, type, fileUrl, fileSize, mimeType } = req.body;
        if (!name || !type) return res.status(400).json({ success: false, message: 'name and type are required' });

        const doc = await StudentDocument.create({
            schoolId: student.schoolId._id || student.schoolId,
            studentId: student._id,
            name, type, fileUrl: fileUrl || '', fileSize: fileSize || 0, mimeType: mimeType || '',
            verificationStatus: 'pending'
        });

        res.status(201).json({ success: true, data: doc, message: 'Document uploaded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const doc = await StudentDocument.findOneAndDelete({ _id: req.params.documentId, studentId: req.student._id, verificationStatus: { $ne: 'verified' } });
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found or already verified' });
        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting document', error: error.message });
    }
};

// ============================================
// SECTION 12: CONTENT LIBRARY
// ============================================
exports.getContentLibrary = async (req, res) => {
    try {
        const student = req.student;
        const schoolId = student.schoolId._id || student.schoolId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { schoolId, status: 'active' };
        if (req.query.subjectId) query.subjectId = req.query.subjectId;
        if (req.query.contentType) query.contentType = req.query.contentType;
        if (req.query.search) query.title = new RegExp(req.query.search, 'i');

        // Only show content for student's class or no class (school-wide)
        query.$or = [{ classId: student.classId }, { classId: null }, { classId: { $exists: false } }];

        const [content, total] = await Promise.all([
            Content.find(query).populate('subjectId', 'name code').populate('classId', 'name').populate('createdBy', 'firstName lastName')
                .skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
            Content.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: content.map(c => {
                const myProgress = c.progress.find(p => p.studentId?.toString() === student._id.toString());
                return {
                    id: c._id, title: c.title, description: c.description, contentType: c.contentType,
                    url: c.url, thumbnail: c.thumbnail, duration: c.duration, views: c.views,
                    subjectId: c.subjectId?._id, subjectName: c.subjectId?.name,
                    classId: c.classId?._id, className: c.classId?.name,
                    createdBy: c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}` : null,
                    myProgress: myProgress ? { progress: myProgress.progress, completed: myProgress.completed, lastAccessedAt: myProgress.lastAccessedAt } : null,
                    createdAt: c.createdAt
                };
            }),
            total, page, limit, totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching content library', error: error.message });
    }
};

exports.getContentDetails = async (req, res) => {
    try {
        const c = await Content.findById(req.params.contentId)
            .populate('subjectId', 'name code').populate('classId', 'name').populate('createdBy', 'firstName lastName');
        if (!c) return res.status(404).json({ success: false, message: 'Content not found' });

        // Increment views
        c.views = (c.views || 0) + 1;
        await c.save();

        const myProgress = c.progress.find(p => p.studentId?.toString() === req.student._id.toString());

        res.json({
            success: true,
            data: {
                id: c._id, title: c.title, description: c.description, contentType: c.contentType,
                url: c.url, thumbnail: c.thumbnail, duration: c.duration, views: c.views,
                subjectId: c.subjectId?._id, subjectName: c.subjectId?.name,
                classId: c.classId?._id, className: c.classId?.name,
                createdBy: c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}` : null,
                myProgress: myProgress ? { progress: myProgress.progress, completed: myProgress.completed, lastAccessedAt: myProgress.lastAccessedAt } : null,
                createdAt: c.createdAt, updatedAt: c.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching content details', error: error.message });
    }
};

exports.trackContentProgress = async (req, res) => {
    try {
        const student = req.student;
        const { progress, completed } = req.body;
        const c = await Content.findById(req.params.contentId);
        if (!c) return res.status(404).json({ success: false, message: 'Content not found' });

        const idx = c.progress.findIndex(p => p.studentId?.toString() === student._id.toString());
        if (idx >= 0) {
            if (progress !== undefined) c.progress[idx].progress = progress;
            if (completed !== undefined) c.progress[idx].completed = completed;
            c.progress[idx].lastAccessedAt = new Date();
        } else {
            c.progress.push({ studentId: student._id, progress: progress || 0, completed: completed || false });
        }
        await c.save();

        res.json({ success: true, message: 'Progress updated successfully', data: { progress: progress || 0, completed: completed || false } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error tracking content progress', error: error.message });
    }
};

// ============================================
// SECTION 13: COMMUNICATION
// ============================================
exports.getNotices = async (req, res) => {
    try {
        const student = req.student;
        const schoolId = student.schoolId._id || student.schoolId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { schoolId, status: 'published', target: { $in: ['all', 'students'] } };
        if (req.query.type) query.type = req.query.type;
        if (req.query.search) query.title = new RegExp(req.query.search, 'i');

        const [notices, total] = await Promise.all([
            Notice.find(query).populate('createdBy', 'name')
                .skip((page - 1) * limit).limit(limit).sort({ publishedAt: -1 }),
            Notice.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: notices.map(n => ({
                id: n._id, title: n.title, content: n.content, type: n.type,
                priority: n.priority, publishedAt: n.publishedAt, expiresAt: n.expiresAt,
                isRead: n.readBy.some(r => r.userId?.toString() === student._id.toString()),
                createdAt: n.createdAt
            })),
            total, page, limit, totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notices', error: error.message });
    }
};

exports.getNoticeDetails = async (req, res) => {
    try {
        const n = await Notice.findById(req.params.noticeId).populate('createdBy', 'name');
        if (!n) return res.status(404).json({ success: false, message: 'Notice not found' });
        res.json({
            success: true,
            data: {
                id: n._id, title: n.title, content: n.content, type: n.type,
                priority: n.priority, publishedAt: n.publishedAt, expiresAt: n.expiresAt,
                isRead: n.readBy.some(r => r.userId?.toString() === req.student._id.toString()),
                createdAt: n.createdAt, updatedAt: n.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching notice details', error: error.message });
    }
};

exports.markNoticeAsRead = async (req, res) => {
    try {
        const n = await Notice.findById(req.params.noticeId);
        if (!n) return res.status(404).json({ success: false, message: 'Notice not found' });
        const alreadyRead = n.readBy.some(r => r.userId?.toString() === req.student._id.toString());
        if (!alreadyRead) {
            n.readBy.push({ userId: req.student._id });
            await n.save();
        }
        res.json({ success: true, message: 'Notice marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error marking notice as read', error: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const student = req.student;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = { studentId: student._id, schoolId: student.schoolId._id || student.schoolId };
        if (req.query.type) query.type = req.query.type;

        const [messages, total] = await Promise.all([
            StudentCommunication.find(query).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
            StudentCommunication.countDocuments(query)
        ]);

        res.json({ success: true, data: messages, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching messages', error: error.message });
    }
};

exports.getMessageDetails = async (req, res) => {
    try {
        const msg = await StudentCommunication.findOne({ _id: req.params.messageId, studentId: req.student._id });
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
        res.json({ success: true, data: msg });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching message details', error: error.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const student = req.student;
        const { subject, message, type } = req.body;
        if (!subject || !message) return res.status(400).json({ success: false, message: 'subject and message are required' });

        const msg = await StudentCommunication.create({
            schoolId: student.schoolId._id || student.schoolId,
            studentId: student._id,
            type: type || 'notification',
            subject, message,
            sentAt: new Date(),
            status: 'sent',
            recipientDetails: { name: `${student.firstName} ${student.lastName}`, email: student.email, phone: student.phone }
        });

        res.status(201).json({ success: true, data: msg, message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sending message', error: error.message });
    }
};

exports.markMessageAsRead = async (req, res) => {
    try {
        const msg = await StudentCommunication.findOneAndUpdate(
            { _id: req.params.messageId, studentId: req.student._id },
            { status: 'read' },
            { new: true }
        );
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error marking message as read', error: error.message });
    }
};

// ============================================
// SECTION 14: SETTINGS
// ============================================
exports.getSettings = async (req, res) => {
    try {
        const student = await Student.findById(req.student._id).select('settings');
        res.json({
            success: true,
            data: student.settings || {
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
        if (req.body.notifications) {
            if (req.body.notifications.email !== undefined) updates['settings.notifications.email'] = req.body.notifications.email;
            if (req.body.notifications.sms !== undefined) updates['settings.notifications.sms'] = req.body.notifications.sms;
            if (req.body.notifications.push !== undefined) updates['settings.notifications.push'] = req.body.notifications.push;
        }
        if (req.body.preferences) {
            if (req.body.preferences.language) updates['settings.preferences.language'] = req.body.preferences.language;
            if (req.body.preferences.timezone) updates['settings.preferences.timezone'] = req.body.preferences.timezone;
            if (req.body.preferences.dateFormat) updates['settings.preferences.dateFormat'] = req.body.preferences.dateFormat;
        }

        const student = await Student.findByIdAndUpdate(req.student._id, { $set: updates }, { new: true }).select('settings');
        res.json({ success: true, data: student.settings, message: 'Settings updated successfully' });
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

        const student = await Student.findById(req.student._id).select('+password');
        if (!student.password) {
            return res.status(400).json({ success: false, message: 'Password not set. Please contact your school administrator.' });
        }
        const isMatch = await student.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        student.password = newPassword;
        await student.save();
        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
    }
};
