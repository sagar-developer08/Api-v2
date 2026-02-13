const Student = require('../models/Student');
const Guardian = require('../models/Guardian');
const Class = require('../models/Class');
const Section = require('../models/Section');
const AcademicYear = require('../models/AcademicYear');
const StudentAttendance = require('../models/StudentAttendance');
const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const StudentDocument = require('../models/StudentDocument');
const StudentTransport = require('../models/StudentTransport');
const StudentAcademicRecord = require('../models/StudentAcademicRecord');
const StudentCommunication = require('../models/StudentCommunication');
const StudentTransfer = require('../models/StudentTransfer');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            error: 'Validation Error',
            message: 'Invalid input data',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    return null;
};

// Generate student ID
const generateStudentId = async (schoolId) => {
    const year = new Date().getFullYear();
    const count = await Student.countDocuments({ schoolId }) + 1;
    return `STU-${year}-${String(count).padStart(3, '0')}`;
};

// ============================================
// SECTION 1: STUDENT CRUD OPERATIONS
// ============================================

// @desc    Get All Students
// @route   GET /api/admin/students
// @access  Private
exports.getAllStudents = async (req, res) => {
    try {
        const schoolId = req.admin.schoolId;
        const {
            page = 1,
            limit = 10,
            search,
            classId,
            sectionId,
            status,
            academicYear,
            sortBy = 'firstName',
            sortOrder = 'asc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query = { schoolId };

        if (classId) query.classId = classId;
        if (sectionId) query.sectionId = sectionId;
        if (status) query.status = status;
        if (academicYear) query.academicYearId = academicYear;

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [students, total] = await Promise.all([
            Student.find(query)
                .populate('classId', 'name')
                .populate('sectionId', 'name')
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Student.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limitNum);

        const data = students.map(s => ({
            id: s._id,
            studentId: s.studentId,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            phone: s.phone,
            dateOfBirth: s.dateOfBirth,
            gender: s.gender,
            avatar: s.avatar,
            className: s.classId?.name,
            classId: s.classId?._id,
            sectionName: s.sectionId?.name,
            sectionId: s.sectionId?._id,
            rollNumber: s.rollNumber,
            status: s.status,
            admissionDate: s.admissionDate,
            academicYear: s.academicYear,
            address: s.address
        }));

        res.json({
            data,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        });
    } catch (error) {
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

// @desc    Get Student by ID
// @route   GET /api/admin/students/:id
// @access  Private
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findOne({
            _id: req.params.id,
            schoolId: req.admin.schoolId
        })
            .populate('classId', 'name')
            .populate('sectionId', 'name')
            .lean();

        if (!student) {
            return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
        }

        res.json({
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
            academicYear: student.academicYear,
            address: student.address,
            communicationAddress: student.communicationAddress,
            createdAt: student.createdAt,
            updatedAt: student.updatedAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

// @desc    Create Student
// @route   POST /api/admin/students
// @access  Private
exports.createStudent = async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    try {
        const schoolId = req.admin.schoolId;
        const studentId = await generateStudentId(schoolId);

        const student = new Student({
            ...req.body,
            schoolId,
            studentId
        });

        await student.save();

        res.status(201).json({
            id: student._id,
            studentId: student.studentId,
            message: 'Student created successfully'
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Student with this admission number already exists'
            });
        }
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

// @desc    Update Student
// @route   PUT/PATCH /api/admin/students/:id
// @access  Private
exports.updateStudent = async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    try {
        const student = await Student.findOneAndUpdate(
            { _id: req.params.id, schoolId: req.admin.schoolId },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!student) {
            return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
        }

        res.json({ id: student._id, message: 'Student updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

// @desc    Delete Student
// @route   DELETE /api/admin/students/:id
// @access  Private
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({
            _id: req.params.id,
            schoolId: req.admin.schoolId
        });

        if (!student) {
            return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
        }

        // Clean up related records
        await Promise.all([
            Guardian.deleteMany({ studentId: req.params.id }),
            StudentAttendance.deleteMany({ studentId: req.params.id }),
            StudentFee.deleteMany({ studentId: req.params.id }),
            FeePayment.deleteMany({ studentId: req.params.id }),
            StudentDocument.deleteMany({ studentId: req.params.id }),
            StudentTransport.deleteMany({ studentId: req.params.id }),
            StudentAcademicRecord.deleteMany({ studentId: req.params.id }),
            StudentCommunication.deleteMany({ studentId: req.params.id }),
            StudentTransfer.deleteMany({ studentId: req.params.id })
        ]);

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

// @desc    Get Student Statistics
// @route   GET /api/admin/students/statistics
// @access  Private
exports.getStudentStatistics = async (req, res) => {
    try {
        const schoolId = req.admin.schoolId;
        const { academicYear, classId } = req.query;

        const matchQuery = { schoolId: new mongoose.Types.ObjectId(schoolId) };
        if (classId) matchQuery.classId = new mongoose.Types.ObjectId(classId);

        const [statusCounts, byClass, monthlyAdmissions] = await Promise.all([
            Student.aggregate([
                { $match: matchQuery },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Student.aggregate([
                { $match: matchQuery },
                { $group: { _id: '$classId', count: { $sum: 1 } } },
                { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
                { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
                { $project: { classId: '$_id', className: '$class.name', count: 1 } }
            ]),
            Student.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: -1 } },
                { $limit: 12 }
            ])
        ]);

        const byStatus = {};
        let totalStudents = 0;
        statusCounts.forEach(s => {
            byStatus[s._id] = s.count;
            totalStudents += s.count;
        });

        res.json({
            totalStudents,
            activeStudents: byStatus.active || 0,
            inactiveStudents: byStatus.inactive || 0,
            graduatedStudents: byStatus.graduated || 0,
            transferredStudents: byStatus.transferred || 0,
            byClass: byClass.map(c => ({
                classId: c.classId,
                className: c.className,
                count: c.count
            })),
            byStatus,
            admissionTrend: monthlyAdmissions.map(m => ({
                month: m._id,
                count: m.count
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

// @desc    Get Student Metrics (Dashboard)
// @route   GET /api/admin/students/metrics
// @access  Private
exports.getStudentMetrics = async (req, res) => {
    try {
        const schoolId = req.admin.schoolId;
        const { academicYear } = req.query;
        const matchQuery = { schoolId: new mongoose.Types.ObjectId(schoolId) };

        let refDate = new Date();

        if (academicYear) {
            matchQuery.academicYearId = new mongoose.Types.ObjectId(academicYear);
            const ayDoc = await AcademicYear.findById(academicYear);
            if (ayDoc) {
                if (ayDoc.endDate && ayDoc.endDate < refDate) {
                    refDate = ayDoc.endDate;
                } else if (ayDoc.endYear) {
                    const endD = new Date(`${ayDoc.endYear}-12-31`);
                    if (endD < refDate) refDate = endD;
                }
            }
        }

        // Calculate the date 6 months ago from refDate
        const sixMonthsAgo = new Date(refDate);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1); // Start from the 1st of that month
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const [statusCounts, byClass, admissionTrend] = await Promise.all([
            // 1. Students by status (active / inactive)
            Student.aggregate([
                { $match: matchQuery },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            // 2. Students count class-wise
            Student.aggregate([
                { $match: matchQuery },
                { $group: { _id: '$classId', count: { $sum: 1 } } },
                { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
                { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
                { $project: { classId: '$_id', className: '$class.name', section: '$class.section', count: 1, _id: 0 } },
                { $sort: { className: 1 } }
            ]),

            // 3. Admission trend - last 6 months based on admissionDate
            Student.aggregate([
                { $match: { ...matchQuery, admissionDate: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$admissionDate' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        // Process status counts
        const byStatus = {};
        let totalStudents = 0;
        statusCounts.forEach(s => {
            byStatus[s._id] = s.count;
            totalStudents += s.count;
        });

        // Build the last 6 months labels with counts (fill missing months with 0)
        const admissionTrendMap = {};
        admissionTrend.forEach(m => { admissionTrendMap[m._id] = m.count; });

        const months = [];
        const now = refDate;
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString('default', { month: 'short' });
            months.push({
                month: key,
                label,
                count: admissionTrendMap[key] || 0
            });
        }

        res.json({
            totalStudents,
            studentsByClass: byClass,
            studentsByStatus: {
                active: byStatus.active || 0,
                inactive: byStatus.inactive || 0,
                graduated: byStatus.graduated || 0,
                transferred: byStatus.transferred || 0,
                suspended: byStatus.suspended || 0
            },
            admissionTrend: months
        });
    } catch (error) {
        res.status(500).json({ error: 'Server Error', message: error.message });
    }
};

// ============================================
// SECTION 2: STUDENT OVERVIEW
// ============================================

exports.getStudentOverview = async (req, res) => {
    try {
        const schoolId = req.admin.schoolId;
        const studentId = req.params.id;

        const [student, guardian, attSum, feeSum, recentMarks] = await Promise.all([
            Student.findOne({ _id: studentId, schoolId }).populate('classId', 'name').populate('sectionId', 'name').lean(),
            Guardian.findOne({ studentId, isEmergencyContact: true }).lean(),
            StudentAttendance.aggregate([
                { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
                { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } }
            ]),
            StudentFee.aggregate([
                { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
                { $group: { _id: null, totalFees: { $sum: '$amount' }, paidFees: { $sum: '$paidAmount' }, pendingFees: { $sum: '$pendingAmount' } } }
            ]),
            StudentAcademicRecord.find({ studentId }).sort({ examDate: -1 }).limit(1).lean()
        ]);

        if (!student) return res.status(404).json({ error: 'Not Found', message: 'Student not found' });

        const att = attSum[0] || { total: 0, present: 0 };
        const fee = feeSum[0] || { totalFees: 0, paidFees: 0, pendingFees: 0 };

        res.json({
            student: { id: student._id, studentId: student.studentId, firstName: student.firstName, lastName: student.lastName, avatar: student.avatar, className: student.classId?.name, sectionName: student.sectionId?.name, rollNumber: student.rollNumber, status: student.status },
            metrics: { attendancePercentage: att.total > 0 ? parseFloat(((att.present / att.total) * 100).toFixed(1)) : 0, pendingFees: fee.pendingFees, totalFees: fee.totalFees, paidFees: fee.paidFees, recentMarks: recentMarks[0] || null },
            emergencyContact: guardian ? { id: guardian._id, name: guardian.name, phone: guardian.phone, relation: guardian.type } : null
        });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

// ============================================
// SECTION 3: GUARDIANS
// ============================================

exports.getStudentGuardians = async (req, res) => {
    try {
        const guardians = await Guardian.find({ studentId: req.params.id, schoolId: req.admin.schoolId }).lean();
        res.json({ guardians: guardians.map(g => ({ id: g._id, studentId: g.studentId, type: g.type, name: g.name, relationship: g.relationship, phone: g.phone, email: g.email, address: g.address, occupation: g.occupation, qualification: g.qualification, income: g.income, isPrimary: g.isPrimary, isEmergencyContact: g.isEmergencyContact, createdAt: g.createdAt })) });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.addGuardian = async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;
    try {
        const student = await Student.findOne({ _id: req.params.id, schoolId: req.admin.schoolId });
        if (!student) return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
        const guardian = new Guardian({ ...req.body, studentId: req.params.id, schoolId: req.admin.schoolId });
        await guardian.save();
        res.status(201).json({ id: guardian._id, message: 'Guardian added successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.updateGuardian = async (req, res) => {
    try {
        const guardian = await Guardian.findOneAndUpdate({ _id: req.params.guardianId, studentId: req.params.id, schoolId: req.admin.schoolId }, { $set: req.body }, { new: true });
        if (!guardian) return res.status(404).json({ error: 'Not Found', message: 'Guardian not found' });
        res.json({ id: guardian._id, message: 'Guardian updated successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.removeGuardian = async (req, res) => {
    try {
        const guardian = await Guardian.findOneAndDelete({ _id: req.params.guardianId, studentId: req.params.id, schoolId: req.admin.schoolId });
        if (!guardian) return res.status(404).json({ error: 'Not Found', message: 'Guardian not found' });
        res.json({ message: 'Guardian removed successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.setPrimaryGuardian = async (req, res) => {
    try {
        await Guardian.updateMany({ studentId: req.params.id, schoolId: req.admin.schoolId }, { $set: { isPrimary: false } });
        const guardian = await Guardian.findOneAndUpdate({ _id: req.params.guardianId, studentId: req.params.id }, { $set: { isPrimary: true } }, { new: true });
        if (!guardian) return res.status(404).json({ error: 'Not Found', message: 'Guardian not found' });
        res.json({ message: 'Primary guardian updated successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.setEmergencyContact = async (req, res) => {
    try {
        await Guardian.updateMany({ studentId: req.params.id, schoolId: req.admin.schoolId }, { $set: { isEmergencyContact: false } });
        const guardian = await Guardian.findOneAndUpdate({ _id: req.params.guardianId, studentId: req.params.id }, { $set: { isEmergencyContact: true } }, { new: true });
        if (!guardian) return res.status(404).json({ error: 'Not Found', message: 'Guardian not found' });
        res.json({ message: 'Emergency contact updated successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

// ============================================
// SECTION 4: ATTENDANCE
// ============================================

exports.getStudentAttendance = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        const query = { studentId: req.params.id, schoolId: req.admin.schoolId, date: { $gte: new Date(startDate), $lte: new Date(endDate) } };
        if (status) query.status = status;
        const attendance = await StudentAttendance.find(query).sort({ date: -1 }).lean();
        const summary = { totalDays: attendance.length, presentDays: attendance.filter(a => a.status === 'present').length, absentDays: attendance.filter(a => a.status === 'absent').length, lateArrivals: attendance.filter(a => a.status === 'late').length, onLeave: attendance.filter(a => a.status === 'on-leave').length, halfDays: attendance.filter(a => a.status === 'half-day').length };
        summary.attendancePercentage = summary.totalDays > 0 ? parseFloat(((summary.presentDays / summary.totalDays) * 100).toFixed(1)) : 0;
        res.json({ attendance: attendance.map(a => ({ id: a._id, date: a.date, status: a.status, markedBy: a.markedBy, markedAt: a.markedAt, remarks: a.remarks, periods: a.periods })), summary });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.getStudentAttendanceSummary = async (req, res) => {
    try {
        const attendance = await StudentAttendance.find({ studentId: req.params.id }).lean();
        const summary = { totalDays: attendance.length, presentDays: attendance.filter(a => a.status === 'present').length, absentDays: attendance.filter(a => a.status === 'absent').length, lateArrivals: attendance.filter(a => a.status === 'late').length, onLeave: attendance.filter(a => a.status === 'on-leave').length, halfDays: attendance.filter(a => a.status === 'half-day').length };
        summary.attendancePercentage = summary.totalDays > 0 ? parseFloat(((summary.presentDays / summary.totalDays) * 100).toFixed(1)) : 0;
        res.json(summary);
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.updateStudentAttendance = async (req, res) => {
    try {
        const attendance = await StudentAttendance.findOneAndUpdate({ _id: req.params.attendanceId, studentId: req.params.id }, { $set: req.body }, { new: true });
        if (!attendance) return res.status(404).json({ error: 'Not Found', message: 'Attendance record not found' });
        res.json({ id: attendance._id, message: 'Attendance updated successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

// ============================================
// SECTION 5: FEES
// ============================================

exports.getStudentFees = async (req, res) => {
    try {
        const { academicYear, status } = req.query;
        const query = { studentId: req.params.id, schoolId: req.admin.schoolId };
        if (academicYear) query.academicYear = academicYear;
        if (status) query.status = status;
        const fees = await StudentFee.find(query).lean();
        const payments = await FeePayment.find({ studentId: req.params.id }).lean();
        const feesWithPayments = fees.map(f => ({ id: f._id, feeType: f.feeType, amount: f.amount, dueDate: f.dueDate, paidAmount: f.paidAmount, pendingAmount: f.pendingAmount, status: f.status, payments: payments.filter(p => p.feeId?.toString() === f._id.toString()) }));
        const summary = { totalFees: fees.reduce((s, f) => s + f.amount, 0), paidFees: fees.reduce((s, f) => s + f.paidAmount, 0), pendingFees: fees.reduce((s, f) => s + f.pendingAmount, 0), overdueFees: fees.filter(f => f.status === 'overdue').reduce((s, f) => s + f.pendingAmount, 0) };
        res.json({ fees: feesWithPayments, summary });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.getStudentFeesSummary = async (req, res) => {
    try {
        const fees = await StudentFee.find({ studentId: req.params.id }).lean();
        const recentPayments = await FeePayment.find({ studentId: req.params.id }).sort({ paymentDate: -1 }).limit(5).lean();
        const upcomingDue = fees.filter(f => f.status !== 'paid' && new Date(f.dueDate) > new Date()).slice(0, 5).map(f => ({ feeType: f.feeType, amount: f.pendingAmount, dueDate: f.dueDate }));
        res.json({ totalFees: fees.reduce((s, f) => s + f.amount, 0), paidFees: fees.reduce((s, f) => s + f.paidAmount, 0), pendingFees: fees.reduce((s, f) => s + f.pendingAmount, 0), overdueFees: fees.filter(f => f.status === 'overdue').reduce((s, f) => s + f.pendingAmount, 0), upcomingDue, recentPayments: recentPayments.map(p => ({ id: p._id, amount: p.amount, date: p.paymentDate, mode: p.mode, status: p.status })) });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.recordFeePayment = async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;
    try {
        const fee = await StudentFee.findOne({ _id: req.params.feeId, studentId: req.params.id });
        if (!fee) return res.status(404).json({ error: 'Not Found', message: 'Fee record not found' });
        const payment = new FeePayment({ ...req.body, feeId: req.params.feeId, studentId: req.params.id, schoolId: req.admin.schoolId, collectedBy: req.admin._id });
        await payment.save();
        fee.paidAmount += payment.amount;
        await fee.save();
        res.status(201).json({ id: payment._id, message: 'Payment recorded successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.assignFeeToStudent = async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, schoolId: req.admin.schoolId });
        if (!student) return res.status(404).json({ error: 'Not Found', message: 'Student not found' });

        const fee = new StudentFee({
            ...req.body,
            studentId: req.params.id,
            schoolId: req.admin.schoolId
        });
        await fee.save();
        res.status(201).json({ id: fee._id, message: 'Fee assigned successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

// ============================================
// SECTION 6: DOCUMENTS
// ============================================

exports.getStudentDocuments = async (req, res) => {
    try {
        const { type, category } = req.query;
        const query = { studentId: req.params.id, schoolId: req.admin.schoolId };
        if (type) query.type = type;
        if (category) query.category = category;
        const documents = await StudentDocument.find(query).lean();
        res.json({ documents: documents.map(d => ({ id: d._id, name: d.name, type: d.type, category: d.category, fileUrl: d.fileUrl, fileSize: d.fileSize, mimeType: d.mimeType, uploadedAt: d.createdAt, verified: d.verified, verifiedAt: d.verifiedAt })) });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.uploadStudentDocument = async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, schoolId: req.admin.schoolId });
        if (!student) return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl;
        const doc = new StudentDocument({ ...req.body, fileUrl, studentId: req.params.id, schoolId: req.admin.schoolId, uploadedBy: req.admin._id, fileSize: req.file?.size || 0, mimeType: req.file?.mimetype });
        await doc.save();
        res.status(201).json({ id: doc._id, fileUrl: doc.fileUrl, message: 'Document uploaded successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.deleteStudentDocument = async (req, res) => {
    try {
        const doc = await StudentDocument.findOneAndDelete({ _id: req.params.documentId, studentId: req.params.id, schoolId: req.admin.schoolId });
        if (!doc) return res.status(404).json({ error: 'Not Found', message: 'Document not found' });
        res.json({ message: 'Document deleted successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.verifyStudentDocument = async (req, res) => {
    try {
        const doc = await StudentDocument.findOneAndUpdate({ _id: req.params.documentId, studentId: req.params.id }, { $set: { verified: req.body.verified, verifiedAt: new Date(), verifiedBy: req.admin._id, verificationRemarks: req.body.remarks } }, { new: true });
        if (!doc) return res.status(404).json({ error: 'Not Found', message: 'Document not found' });
        res.json({ message: 'Document verified successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

// ============================================
// SECTION 7: TRANSPORT
// ============================================

exports.getStudentTransport = async (req, res) => {
    try {
        const transport = await StudentTransport.findOne({ studentId: req.params.id, schoolId: req.admin.schoolId }).lean();
        if (!transport) return res.json({ hasTransport: false });
        res.json({ hasTransport: true, route: { id: transport.routeId, name: transport.routeName, code: transport.routeCode, pickupPoint: transport.pickupPoint, pickupTime: transport.pickupTime, dropPoint: transport.dropPoint, dropTime: transport.dropTime, distance: transport.distance, fare: transport.fare }, vehicle: { id: transport.vehicleId, number: transport.vehicleNumber, type: transport.vehicleType, driver: transport.driver }, enrollmentDate: transport.enrollmentDate, status: transport.status });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.assignTransport = async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, schoolId: req.admin.schoolId });
        if (!student) return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
        const existing = await StudentTransport.findOne({ studentId: req.params.id });
        if (existing) return res.status(409).json({ error: 'Conflict', message: 'Transport already assigned' });
        const transport = new StudentTransport({ ...req.body, studentId: req.params.id, schoolId: req.admin.schoolId });
        await transport.save();
        res.status(201).json({ message: 'Transport assigned successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.updateStudentTransport = async (req, res) => {
    try {
        const transport = await StudentTransport.findOneAndUpdate({ studentId: req.params.id, schoolId: req.admin.schoolId }, { $set: req.body }, { new: true });
        if (!transport) return res.status(404).json({ error: 'Not Found', message: 'Transport record not found' });
        res.json({ message: 'Transport updated successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.removeTransport = async (req, res) => {
    try {
        const transport = await StudentTransport.findOneAndDelete({ studentId: req.params.id, schoolId: req.admin.schoolId });
        if (!transport) return res.status(404).json({ error: 'Not Found', message: 'Transport record not found' });
        res.json({ message: 'Transport removed successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

// ============================================
// SECTION 8: ACADEMIC RECORDS
// ============================================

exports.getStudentAcademicDetails = async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, schoolId: req.admin.schoolId }).populate('classId').populate('sectionId').lean();
        if (!student) return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
        res.json({ currentAcademic: { academicYear: student.academicYear, classId: student.classId?._id, className: student.classId?.name, sectionId: student.sectionId?._id, sectionName: student.sectionId?.name, rollNumber: student.rollNumber, admissionDate: student.admissionDate, admissionNumber: student.admissionNumber } });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.getStudentAcademicHistory = async (req, res) => {
    try {
        const records = await StudentAcademicRecord.find({ studentId: req.params.id }).sort({ examDate: -1 }).lean();
        res.json({ academicYears: records });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.addAcademicRecord = async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;
    try {
        const student = await Student.findOne({ _id: req.params.id, schoolId: req.admin.schoolId });
        if (!student) return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
        const record = new StudentAcademicRecord({ ...req.body, studentId: req.params.id, schoolId: req.admin.schoolId });
        await record.save();
        res.status(201).json({ id: record._id, message: 'Academic record added successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.updateAcademicRecord = async (req, res) => {
    try {
        const record = await StudentAcademicRecord.findOneAndUpdate({ _id: req.params.recordId, studentId: req.params.id }, { $set: req.body }, { new: true });
        if (!record) return res.status(404).json({ error: 'Not Found', message: 'Academic record not found' });
        res.json({ id: record._id, message: 'Academic record updated successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.deleteAcademicRecord = async (req, res) => {
    try {
        const record = await StudentAcademicRecord.findOneAndDelete({ _id: req.params.recordId, studentId: req.params.id });
        if (!record) return res.status(404).json({ error: 'Not Found', message: 'Academic record not found' });
        res.json({ message: 'Academic record deleted successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.getRecentMarks = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const marks = await StudentAcademicRecord.find({ studentId: req.params.id }).sort({ examDate: -1 }).limit(limit).lean();
        const avg = marks.length > 0 ? marks.reduce((s, m) => s + (m.percentage || 0), 0) / marks.length : 0;
        res.json({ marks, averagePercentage: parseFloat(avg.toFixed(1)) });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

// ============================================
// SECTION 9: EXAMS & PERFORMANCE
// ============================================

exports.getStudentExams = async (req, res) => {
    try {
        const { academicYear, examType, status } = req.query;
        const query = { studentId: req.params.id };
        if (academicYear) query.academicYear = academicYear;
        if (examType) query.examType = examType;
        const exams = await StudentAcademicRecord.find(query).sort({ examDate: -1 }).lean();
        res.json({ exams });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.getStudentPerformance = async (req, res) => {
    try {
        const records = await StudentAcademicRecord.find({ studentId: req.params.id }).lean();
        const overallPercentage = records.length > 0 ? records.reduce((s, r) => s + (r.percentage || 0), 0) / records.length : 0;
        res.json({ academicYear: req.query.academicYear, overallPercentage: parseFloat(overallPercentage.toFixed(1)), examHistory: records.map(r => ({ examId: r._id, examName: r.examName, percentage: r.percentage, rank: r.rank, date: r.examDate })) });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

// ============================================
// SECTION 10: COMMUNICATION
// ============================================

exports.getCommunicationHistory = async (req, res) => {
    try {
        const { type, page = 1, limit = 10 } = req.query;
        const query = { studentId: req.params.id, schoolId: req.admin.schoolId };
        if (type) query.type = type;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [data, total] = await Promise.all([StudentCommunication.find(query).sort({ sentAt: -1 }).skip(skip).limit(parseInt(limit)).lean(), StudentCommunication.countDocuments(query)]);
        res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.sendCommunication = async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;
    try {
        const comm = new StudentCommunication({ ...req.body, studentId: req.params.id, schoolId: req.admin.schoolId, sentBy: req.admin._id, status: 'sent' });
        await comm.save();
        res.status(201).json({ id: comm._id, message: 'Communication sent successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

// ============================================
// SECTION 11: TRANSFERS & PROMOTIONS
// ============================================

exports.transferStudent = async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;
    try {
        const student = await Student.findOne({ _id: req.params.id, schoolId: req.admin.schoolId }).populate('classId', 'name').populate('sectionId', 'name');
        if (!student) return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
        const transfer = new StudentTransfer({ studentId: req.params.id, schoolId: req.admin.schoolId, transferType: 'transfer', fromClassId: student.classId?._id, fromClassName: student.classId?.name, fromSectionId: student.sectionId?._id, fromSectionName: student.sectionId?.name, fromRollNumber: student.rollNumber, toClassId: req.body.targetClassId, toSectionId: req.body.targetSectionId, toAcademicYear: req.body.targetAcademicYear, transferDate: req.body.transferDate, reason: req.body.reason, remarks: req.body.remarks, transferredBy: req.admin._id });
        await transfer.save();
        student.classId = req.body.targetClassId;
        student.sectionId = req.body.targetSectionId;
        if (req.body.targetAcademicYear) student.academicYear = req.body.targetAcademicYear;
        await student.save();
        res.json({ message: 'Student transferred successfully', newRollNumber: student.rollNumber });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.promoteStudent = async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;
    try {
        const student = await Student.findOne({ _id: req.params.id, schoolId: req.admin.schoolId }).populate('classId', 'name').populate('sectionId', 'name');
        if (!student) return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
        const transfer = new StudentTransfer({ studentId: req.params.id, schoolId: req.admin.schoolId, transferType: 'promotion', fromClassId: student.classId?._id, fromClassName: student.classId?.name, fromSectionId: student.sectionId?._id, fromSectionName: student.sectionId?.name, toClassId: req.body.targetClassId, toSectionId: req.body.targetSectionId, toAcademicYear: req.body.targetAcademicYear, transferDate: req.body.promotionDate || new Date(), remarks: req.body.remarks, transferredBy: req.admin._id });
        await transfer.save();
        student.classId = req.body.targetClassId;
        student.sectionId = req.body.targetSectionId;
        if (req.body.targetAcademicYear) student.academicYear = req.body.targetAcademicYear;
        await student.save();
        res.json({ message: 'Student promoted successfully' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.getTransferHistory = async (req, res) => {
    try {
        const transfers = await StudentTransfer.find({ studentId: req.params.id }).sort({ transferDate: -1 }).lean();
        res.json({ transfers: transfers.map(t => ({ id: t._id, fromClass: t.fromClassName, toClass: t.toClassName, fromSection: t.fromSectionName, toSection: t.toSectionName, transferDate: t.transferDate, reason: t.reason, transferredBy: t.transferredBy })) });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

// ============================================
// SECTION 12: REPORTS (Placeholder)
// ============================================

exports.generateStudentReport = async (req, res) => {
    try {
        // Placeholder - would integrate with a report generation service
        res.json({ reportId: `report-${Date.now()}`, status: 'processing', message: 'Report generation started' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.getReportStatus = async (req, res) => {
    try {
        res.json({ reportId: req.params.reportId, status: 'completed', downloadUrl: null });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

// ============================================
// SECTION 13: BULK OPERATIONS
// ============================================

exports.bulkImportStudents = async (req, res) => {
    try {
        // Placeholder - would use csv-parser to parse uploaded file
        res.json({ success: 0, failed: 0, errors: [], message: 'Bulk import endpoint - implement with CSV file upload' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};

exports.exportStudents = async (req, res) => {
    try {
        const students = await Student.find({ schoolId: req.admin.schoolId }).populate('classId', 'name').populate('sectionId', 'name').lean();
        // For now, return JSON - would generate CSV/Excel/PDF based on format param
        res.json({ data: students, format: req.query.format || 'json' });
    } catch (error) { res.status(500).json({ error: 'Server Error', message: error.message }); }
};
