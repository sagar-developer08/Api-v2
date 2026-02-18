const AttendanceLock = require('../models/AttendanceLock');
const StudentLeave = require('../models/StudentLeave');
const TeacherLeave = require('../models/TeacherLeave');
const AttendanceCorrection = require('../models/AttendanceCorrection');
const StudentAttendance = require('../models/StudentAttendance');
const StudentNote = require('../models/StudentNote');
const HallTicket = require('../models/HallTicket');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');
const Enquiry = require('../models/Enquiry');
const AdmissionApplication = require('../models/AdmissionApplication');
const AdmissionDocument = require('../models/AdmissionDocument');
const AdmissionSettings = require('../models/AdmissionSettings');
const CommunicationTemplate = require('../models/CommunicationTemplate');
const ReportJob = require('../models/ReportJob');
const ReportTemplate = require('../models/ReportTemplate');
const ScheduledReport = require('../models/ScheduledReport');
const Notice = require('../models/Notice');
const NoticeRead = require('../models/NoticeRead');
const StudentCommunication = require('../models/StudentCommunication');
const Section = require('../models/Section');
const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const ClassAuditLog = require('../models/ClassAuditLog');
const ClassStationary = require('../models/ClassStationary');
const AttendanceNotification = require('../models/AttendanceNotification');
const StudentTransfer = require('../models/StudentTransfer');
const FeeRule = require('../models/FeeRule');
const StudentFee = require('../models/StudentFee');
const Assignment = require('../models/Assignment');
const LmsContent = require('../models/LmsContent');
const TeacherAttendance = require('../models/TeacherAttendance');
const StaffAttendance = require('../models/StaffAttendance');
const AttendanceConfig = require('../models/AttendanceConfig');
const FeePayment = require('../models/FeePayment');
const mongoose = require('mongoose');

const getSchoolId = (req) => req.admin.schoolId._id || req.admin.schoolId;

// ---------- Attendance Lock / Unlock ----------
exports.getAttendanceLocks = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId, fromDate, toDate } = req.query;
    const filter = { schoolId };
    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    const data = await AttendanceLock.find(filter).populate('classId sectionId', 'name').sort({ date: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching locks', error: error.message });
  }
};

exports.lockAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId, date } = req.body;
    const lock = await AttendanceLock.create({
      schoolId,
      classId: classId || undefined,
      sectionId: sectionId || undefined,
      date: new Date(date),
      lockedBy: req.admin._id
    });
    res.status(201).json({ success: true, data: lock, message: 'Attendance locked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error locking attendance', error: error.message });
  }
};

exports.unlockAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId, date, unlockReason } = req.body;
    const result = await AttendanceLock.deleteMany({
      schoolId,
      ...(classId && { classId }),
      ...(sectionId && { sectionId }),
      date: new Date(date)
    });
    res.json({ success: true, message: 'Attendance unlocked', deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error unlocking attendance', error: error.message });
  }
};

// ---------- Leave (Student + Teacher) ----------
exports.getLeaveRequests = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { status, studentId, teacherId, fromDate, toDate } = req.query;
    const [studentLeaves, teacherLeaves] = await Promise.all([
      StudentLeave.find({ schoolId, ...(status && { status }), ...(studentId && { studentId }) })
        .populate('studentId', 'firstName lastName admissionNumber')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      TeacherLeave.find({ schoolId, ...(status && { status }), ...(teacherId && { teacherId }) })
        .populate('teacherId', 'firstName lastName employeeId')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
    ]);
    res.json({
      success: true,
      data: {
        student: studentLeaves,
        teacher: teacherLeaves
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leave requests', error: error.message });
  }
};

exports.createLeaveRequest = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { studentId, teacherId, leaveType, fromDate, toDate, reason } = req.body;
    if (studentId) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const days = Math.ceil((to - from) / (24 * 60 * 60 * 1000)) + 1;
      const leave = await StudentLeave.create({
        schoolId,
        studentId,
        leaveType: leaveType || 'CL',
        fromDate: from,
        toDate: to,
        reason: reason || ''
      });
      return res.status(201).json({ success: true, data: leave, message: 'Leave request created' });
    }
    if (teacherId) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const days = Math.ceil((to - from) / (24 * 60 * 60 * 1000)) + 1;
      const leave = await TeacherLeave.create({
        schoolId,
        teacherId,
        leaveType: leaveType || 'casual',
        startDate: from,
        endDate: to,
        days,
        reason: reason || 'Required'
      });
      return res.status(201).json({ success: true, data: leave, message: 'Leave request created' });
    }
    res.status(400).json({ success: false, message: 'Provide studentId or teacherId' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating leave request', error: error.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { status, remarks } = req.body;
    const { type, id } = req.params; // type = student | teacher
    if (type === 'student') {
      const leave = await StudentLeave.findOneAndUpdate(
        { _id: id, schoolId },
        { status, remarks, reviewedBy: req.admin._id },
        { new: true }
      );
      if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
      return res.json({ success: true, data: leave, message: 'Leave status updated' });
    }
    if (type === 'teacher') {
      const leave = await TeacherLeave.findOneAndUpdate(
        { _id: id, schoolId },
        { status, remarks, reviewedBy: req.admin._id, reviewedAt: new Date() },
        { new: true }
      );
      if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
      return res.json({ success: true, data: leave, message: 'Leave status updated' });
    }
    res.status(400).json({ success: false, message: 'Invalid type' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating leave status', error: error.message });
  }
};

exports.getLeaveBalance = async (req, res) => {
  try {
    res.json({ success: true, data: { studentId: req.query.studentId, teacherId: req.query.teacherId, balance: {} } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leave balance', error: error.message });
  }
};

// ---------- Attendance Corrections ----------
exports.getAttendanceCorrections = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { status } = req.query;
    const filter = { schoolId };
    if (status) filter.status = status;
    const data = await AttendanceCorrection.find(filter)
      .populate('attendanceId')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching corrections', error: error.message });
  }
};

exports.requestAttendanceCorrection = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { attendanceId, requestedStatus, reason } = req.body;
    const correction = await AttendanceCorrection.create({
      schoolId,
      attendanceId,
      requestedStatus,
      reason: reason || '',
      status: 'pending'
    });
    res.status(201).json({ success: true, data: correction, message: 'Correction requested' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error requesting correction', error: error.message });
  }
};

exports.updateCorrectionStatus = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { status, remarks } = req.body;
    const correction = await AttendanceCorrection.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { status, remarks, reviewedBy: req.admin._id },
      { new: true }
    );
    if (!correction) return res.status(404).json({ success: false, message: 'Correction not found' });
    res.json({ success: true, data: correction, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating correction', error: error.message });
  }
};

// ---------- Hall Tickets ----------
exports.generateHallTickets = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const exam = await Exam.findById(req.params.examId);
    if (!exam || exam.schoolId.toString() !== schoolId.toString()) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    const students = await Student.find({ schoolId, classId: exam.classId, status: 'active' }).select('_id rollNumber').lean();
    const tickets = await Promise.all(
      students.map(s =>
        HallTicket.findOneAndUpdate(
          { examId: exam._id, studentId: s._id },
          { schoolId, examId: exam._id, studentId: s._id, rollNumber: s.rollNumber },
          { new: true, upsert: true }
        )
      )
    );
    res.status(201).json({ success: true, data: tickets, message: 'Hall tickets generated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating hall tickets', error: error.message });
  }
};

exports.getHallTickets = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const tickets = await HallTicket.find({ examId: req.params.examId })
      .populate('studentId', 'firstName lastName rollNumber admissionNumber')
      .lean();
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching hall tickets', error: error.message });
  }
};

// ---------- Admissions ----------
exports.listEnquiries = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 10, search, status } = req.query;
    const filter = { schoolId };
    if (status) filter.status = status;
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }];
    const skip = (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 10);
    const l = Math.min(100, parseInt(limit, 10) || 10);
    const [data, total] = await Promise.all([
      Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      Enquiry.countDocuments(filter)
    ]);
    res.json({ success: true, data: { data, total, page: parseInt(page, 10) || 1, limit: l, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing enquiries', error: error.message });
  }
};

exports.createEnquiry = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const enquiry = await Enquiry.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: enquiry, message: 'Enquiry created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating enquiry', error: error.message });
  }
};

exports.getEnquiry = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const enquiry = await Enquiry.findOne({ _id: req.params.id, schoolId }).lean();
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching enquiry', error: error.message });
  }
};

exports.updateEnquiry = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const enquiry = await Enquiry.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, data: enquiry, message: 'Enquiry updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating enquiry', error: error.message });
  }
};

exports.listApplications = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 10, status } = req.query;
    const filter = { schoolId };
    if (status) filter.status = status;
    const skip = (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 10);
    const l = Math.min(100, parseInt(limit, 10) || 10);
    const [data, total] = await Promise.all([
      AdmissionApplication.find(filter).populate('classId', 'name').sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      AdmissionApplication.countDocuments(filter)
    ]);
    res.json({ success: true, data: { data, total, page: parseInt(page, 10) || 1, limit: l, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing applications', error: error.message });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const app = await AdmissionApplication.findOne({ _id: req.params.id, schoolId }).populate('classId enquiryId').lean();
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching application', error: error.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { status } = req.body;
    const app = await AdmissionApplication.findOneAndUpdate({ _id: req.params.id, schoolId }, { status }, { new: true });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating application', error: error.message });
  }
};

exports.getAdmissionsDashboard = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const [enquiriesCount, applicationsCount] = await Promise.all([
      Enquiry.countDocuments({ schoolId }),
      AdmissionApplication.countDocuments({ schoolId })
    ]);
    res.json({ success: true, data: { totalEnquiries: enquiriesCount, totalApplications: applicationsCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard', error: error.message });
  }
};

// ---------- Communication (templates, SMS, email, history) ----------
exports.getTemplates = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { type } = req.query;
    const filter = { schoolId };
    if (type) filter.type = type;
    const data = await CommunicationTemplate.find(filter).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching templates', error: error.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const template = await CommunicationTemplate.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: template, message: 'Template created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating template', error: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const template = await CommunicationTemplate.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template, message: 'Template updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating template', error: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const template = await CommunicationTemplate.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting template', error: error.message });
  }
};

exports.sendSms = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { to, message } = req.body; // to = [studentIds] or single id
    const ids = Array.isArray(to) ? to : (to ? [to] : []);
    if (!message || ids.length === 0) return res.status(400).json({ success: false, message: 'to and message required' });
    await Promise.all(
      ids.map(studentId =>
        StudentCommunication.create({
          schoolId,
          studentId,
          type: 'sms',
          message,
          sentBy: req.admin._id,
          recipient: { type: 'student' }
        })
      )
    );
    res.json({ success: true, message: 'SMS sent (queued)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending SMS', error: error.message });
  }
};

exports.sendEmail = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { to, subject, body } = req.body; // to = [studentIds] or single id
    const ids = Array.isArray(to) ? to : (to ? [to] : []);
    if (!body || ids.length === 0) return res.status(400).json({ success: false, message: 'to and body required' });
    await Promise.all(
      ids.map(studentId =>
        StudentCommunication.create({
          schoolId,
          studentId,
          type: 'email',
          subject: subject || '',
          message: body,
          sentBy: req.admin._id,
          recipient: { type: 'student' }
        })
      )
    );
    res.json({ success: true, message: 'Email sent (queued)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending email', error: error.message });
  }
};

exports.getCommunicationHistory = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 20, type, fromDate, toDate } = req.query;
    const filter = { schoolId };
    if (type) filter.type = type;
    if (fromDate || toDate) {
      filter.sentAt = {};
      if (fromDate) filter.sentAt.$gte = new Date(fromDate);
      if (toDate) filter.sentAt.$lte = new Date(toDate);
    }
    const skip = (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 20);
    const l = Math.min(100, parseInt(limit, 10) || 20);
    const [data, total] = await Promise.all([
      StudentCommunication.find(filter).sort({ sentAt: -1 }).skip(skip).limit(l).lean(),
      StudentCommunication.countDocuments(filter)
    ]);
    res.json({ success: true, data: { data, total, page: parseInt(page, 10) || 1, limit: l, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching history', error: error.message });
  }
};

exports.getSmsBalance = async (req, res) => {
  try {
    res.json({ success: true, data: { balance: 0, unit: 'credits' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching balance', error: error.message });
  }
};

// ---------- Reports ----------
exports.generateReport = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { type, format, filters } = req.body;
    const job = await ReportJob.create({
      schoolId,
      type: type || 'attendance',
      format: format || 'pdf',
      filters: filters || {},
      status: 'pending',
      requestedBy: req.admin._id
    });
    res.status(201).json({ success: true, data: { reportId: job._id }, message: 'Report generation started' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating report', error: error.message });
  }
};

exports.getReportStatus = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const job = await ReportJob.findOne({ _id: req.params.reportId, schoolId }).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: { status: job.status, fileUrl: job.fileUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching report status', error: error.message });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const job = await ReportJob.findOne({ _id: req.params.reportId, schoolId });
    if (!job) return res.status(404).json({ success: false, message: 'Report not found' });
    if (job.status !== 'completed' || !job.fileUrl) {
      return res.status(400).json({ success: false, message: 'Report not ready for download' });
    }
    res.json({ success: true, data: { downloadUrl: job.fileUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error downloading report', error: error.message });
  }
};

exports.getReportTypes = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        { id: 'attendance', name: 'Attendance Report' },
        { id: 'fees', name: 'Fees Report' },
        { id: 'exam', name: 'Exam Report' },
        { id: 'student', name: 'Student Report' },
        { id: 'teacher', name: 'Teacher Report' }
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching report types', error: error.message });
  }
};

exports.getReportTemplates = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.type) filter.type = req.query.type;
    const data = await ReportTemplate.find(filter).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching templates', error: error.message });
  }
};

exports.createReportTemplate = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const template = await ReportTemplate.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating template', error: error.message });
  }
};

exports.scheduleReport = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { type, format, schedule, recipients, filters } = req.body;
    const scheduled = await ScheduledReport.create({
      schoolId,
      type: type || 'attendance',
      format: format || 'pdf',
      schedule: schedule || 'weekly',
      recipients: recipients || [],
      filters: filters || {},
      status: 'active'
    });
    res.status(201).json({ success: true, data: scheduled });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error scheduling report', error: error.message });
  }
};

exports.getScheduledReports = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.status) filter.status = req.query.status;
    const data = await ScheduledReport.find(filter).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching scheduled reports', error: error.message });
  }
};

exports.cancelScheduledReport = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const scheduled = await ScheduledReport.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { status: 'cancelled' },
      { new: true }
    );
    if (!scheduled) return res.status(404).json({ success: false, message: 'Scheduled report not found' });
    res.json({ success: true, data: scheduled });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling report', error: error.message });
  }
};

// ---------- Student Notes ----------
exports.getStudentNotes = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { type, page = 1, limit = 10 } = req.query;
    const filter = { schoolId, studentId: req.params.studentId };
    if (type) filter.type = type;
    const skip = (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 10);
    const l = Math.min(100, parseInt(limit, 10) || 10);
    const [data, total] = await Promise.all([
      StudentNote.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      StudentNote.countDocuments(filter)
    ]);
    res.json({ success: true, data: { data, total, page: parseInt(page, 10) || 1, limit: l, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notes', error: error.message });
  }
};

exports.createStudentNote = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { type, title, content, isPrivate } = req.body;
    const note = await StudentNote.create({
      schoolId,
      studentId: req.params.studentId,
      type: type || 'admin_remark',
      title: title || '',
      content: content || '',
      isPrivate: isPrivate || false,
      createdBy: req.admin._id,
      createdByModel: 'Admin'
    });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating note', error: error.message });
  }
};

// ---------- Attendance Daily / Period ----------
exports.markAttendanceDaily = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId, date, attendance } = req.body;
    if (!classId || !date || !Array.isArray(attendance)) {
      return res.status(400).json({ success: false, message: 'classId, date and attendance array required' });
    }
    const ops = attendance.map(a => ({
      updateOne: {
        filter: { schoolId, studentId: a.studentId, classId, sectionId: sectionId || null, date: new Date(date) },
        update: { $set: { status: a.status || 'present', schoolId, classId, sectionId: sectionId || null, date: new Date(date) } },
        upsert: true
      }
    }));
    await StudentAttendance.bulkWrite(ops);
    res.status(200).json({ success: true, message: 'Attendance marked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking attendance', error: error.message });
  }
};

exports.markAttendancePeriod = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId, subjectId, period, date, attendance } = req.body;
    if (!classId || !sectionId || !subjectId || !period || !date || !Array.isArray(attendance)) {
      return res.status(400).json({ success: false, message: 'classId, sectionId, subjectId, period, date and attendance array required' });
    }
    for (const a of attendance) {
      let doc = await StudentAttendance.findOne({ schoolId, studentId: a.studentId, classId, sectionId, date: new Date(date) });
      if (!doc) doc = await StudentAttendance.create({ schoolId, studentId: a.studentId, classId, sectionId, date: new Date(date), status: 'present' });
      const periods = doc.periods || [];
      const idx = periods.findIndex(p => p.period === period);
      const slot = { period, status: a.status || 'present', subjectId };
      if (idx >= 0) periods[idx] = slot;
      else periods.push(slot);
      await StudentAttendance.findByIdAndUpdate(doc._id, { $set: { periods } });
    }
    res.status(200).json({ success: true, message: 'Period attendance marked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking period attendance', error: error.message });
  }
};

// ---------- Timetable Conflicts ----------
exports.getTimetableConflicts = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId } = req.query;
    const filter = { schoolId };
    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    const timetables = await Timetable.find(filter).populate('classId sectionId').lean();
    const allSlots = [];
    timetables.forEach(tt => {
      (tt.slots || []).forEach(slot => {
        allSlots.push({ ...slot, timetableId: tt._id, classId: tt.classId, sectionId: tt.sectionId });
      });
    });
    const conflicts = [];
    const byTeacherDay = {};
    allSlots.forEach(s => {
      const tid = s.teacherId?._id || s.teacherId;
      if (!tid) return;
      const key = `${tid}-${s.dayOfWeek}-${s.period}`;
      if (byTeacherDay[key]) conflicts.push({ type: 'teacher', slot1: byTeacherDay[key], slot2: s });
      else byTeacherDay[key] = s;
    });
    res.json({ success: true, data: conflicts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching conflicts', error: error.message });
  }
};

// ---------- Sections (standalone) ----------
exports.listSections = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.classId) filter.classId = req.query.classId;
    const data = await Section.find(filter).populate('classId', 'name').sort({ name: 1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing sections', error: error.message });
  }
};

exports.getSection = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const section = await Section.findOne({ _id: req.params.id, schoolId }).populate('classId').lean();
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    res.json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching section', error: error.message });
  }
};

exports.createSection = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const section = await Section.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating section', error: error.message });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const section = await Section.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    res.json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating section', error: error.message });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const section = await Section.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    res.json({ success: true, message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting section', error: error.message });
  }
};

exports.getSectionStudents = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const students = await Student.find({ schoolId, sectionId: req.params.id, status: 'active' }).lean();
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching section students', error: error.message });
  }
};

// ---------- Admissions extended ----------
exports.convertEnquiryToApplication = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const enquiry = await Enquiry.findOne({ _id: req.params.id, schoolId });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    const app = await AdmissionApplication.create({
      schoolId,
      enquiryId: enquiry._id,
      studentName: enquiry.name,
      status: 'submitted',
      academicYear: req.body.academicYear || ''
    });
    res.status(201).json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error converting enquiry', error: error.message });
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { applicationId, classId, sectionId, rollNumber, admissionDate } = req.body;
    const app = await AdmissionApplication.findOne({ _id: applicationId, schoolId });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    const student = await Student.create({
      schoolId,
      firstName: app.studentName.split(' ')[0] || app.studentName,
      lastName: app.studentName.split(' ').slice(1).join(' ') || '',
      dateOfBirth: new Date('2000-01-01'),
      gender: 'Male',
      classId,
      sectionId: sectionId || null,
      admissionNumber: `ADM-${Date.now()}`,
      admissionDate: new Date(admissionDate || Date.now()),
      rollNumber: rollNumber || '',
      status: 'active'
    });
    await AdmissionApplication.findByIdAndUpdate(applicationId, { status: 'enrolled' });
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error enrolling student', error: error.message });
  }
};

exports.getSeatCapacity = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, academicYear } = req.query;
    const filter = { schoolId };
    if (classId) filter.classId = classId;
    const sections = await Section.find(filter).populate('classId', 'name').lean();
    const data = sections.map(s => ({ sectionId: s._id, sectionName: s.name, capacity: s.capacity || 40 }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching seat capacity', error: error.message });
  }
};

exports.updateSeatCapacity = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId, totalSeats, academicYear } = req.body;
    const filter = { schoolId };
    if (sectionId) filter._id = sectionId;
    else if (classId) filter.classId = classId;
    const section = await Section.findOneAndUpdate(filter, { capacity: totalSeats }, { new: true });
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    res.json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating seat capacity', error: error.message });
  }
};

exports.markNoticeAsRead = async (req, res) => {
  try {
    const noticeId = req.params.noticeId || req.params.id;
    const recipientId = req.admin?._id || req.parent?._id || req.teacher?._id || req.student?._id || req.user?._id;
    const recipientModel = req.admin ? 'Admin' : (req.parent ? 'Parent' : req.teacher ? 'Teacher' : req.student ? 'Student' : 'Student');
    if (!recipientId || !noticeId) return res.status(400).json({ success: false, message: 'Notice and recipient required' });
    await NoticeRead.findOneAndUpdate(
      { noticeId, recipientId },
      { recipientModel, readAt: new Date() },
      { upsert: true }
    );
    res.json({ success: true, message: 'Notice marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking notice', error: error.message });
  }
};

// ---------- Class Extras ----------
exports.getClassCapacity = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const cls = await Class.findOne({ _id: req.params.classId, schoolId }).select('maxStudents').lean();
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    const currentStudents = await Student.countDocuments({ schoolId, classId: req.params.classId, status: 'active' });
    res.json({ success: true, data: { maxStudents: cls.maxStudents || 50, currentStudents } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching capacity', error: error.message });
  }
};

exports.updateClassCapacity = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.classId, schoolId },
      { maxStudents: req.body.maxStudents },
      { new: true }
    );
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating capacity', error: error.message });
  }
};

exports.getClassFeeStructure = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const cls = await Class.findOne({ _id: req.params.classId, schoolId }).select('feeStructure').lean();
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: cls.feeStructure || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fee structure', error: error.message });
  }
};

exports.getClassPromotions = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { academicYear } = req.query;
    const filter = { schoolId, transferType: 'promotion', fromClassId: req.params.classId };
    if (academicYear) filter.toAcademicYear = academicYear;
    const data = await StudentTransfer.find(filter).populate('studentId', 'firstName lastName').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching promotions', error: error.message });
  }
};

exports.promoteClassStudents = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { toClassId, studentIds, academicYear } = req.body;
    if (!toClassId || !Array.isArray(studentIds)) return res.status(400).json({ success: false, message: 'toClassId and studentIds required' });
    const created = [];
    for (const studentId of studentIds) {
      const student = await Student.findOne({ _id: studentId, schoolId }).populate('classId sectionId');
      if (!student) continue;
      const transfer = await StudentTransfer.create({
        schoolId,
        studentId,
        transferType: 'promotion',
        fromClassId: student.classId?._id,
        fromClassName: student.classId?.name,
        fromSectionId: student.sectionId?._id,
        toClassId,
        toAcademicYear: academicYear || '',
        transferDate: new Date(),
        transferredBy: req.admin._id
      });
      await Student.findByIdAndUpdate(studentId, { classId: toClassId });
      created.push(transfer);
    }
    res.status(201).json({ success: true, data: created, message: `${created.length} students promoted` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error promoting students', error: error.message });
  }
};

exports.getClassSubjectMapping = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const cls = await Class.findOne({ _id: req.params.classId, schoolId }).select('subjects').populate('subjects.subjectId subjects.teacherId').lean();
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: cls.subjects || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subject mapping', error: error.message });
  }
};

exports.updateClassSubjectMapping = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { subjects } = req.body;
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.classId, schoolId },
      { subjects: subjects || [] },
      { new: true }
    );
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: cls.subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating subject mapping', error: error.message });
  }
};

exports.getClassPermissions = async (req, res) => {
  try {
    res.json({ success: true, data: { canEdit: true, canDelete: false, canArchive: true } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching permissions', error: error.message });
  }
};

exports.updateClassPermissions = async (req, res) => {
  try {
    res.json({ success: true, data: req.body });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating permissions', error: error.message });
  }
};

exports.getClassAuditLog = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 10, action, fromDate, toDate } = req.query;
    const filter = { schoolId, classId: req.params.classId };
    if (action) filter.action = action;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }
    const skip = (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 10);
    const l = Math.min(100, parseInt(limit, 10) || 10);
    const [data, total] = await Promise.all([
      ClassAuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      ClassAuditLog.countDocuments(filter)
    ]);
    res.json({ success: true, data: { data, total, page: parseInt(page, 10) || 1, limit: l, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching audit log', error: error.message });
  }
};

exports.getClassStationary = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    let stationary = await ClassStationary.findOne({ schoolId, classId: req.params.classId }).lean();
    if (!stationary) stationary = { items: [] };
    res.json({ success: true, data: stationary.items || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stationary', error: error.message });
  }
};

exports.updateClassStationary = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const stationary = await ClassStationary.findOneAndUpdate(
      { schoolId, classId: req.params.classId },
      { items: req.body.items || req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: stationary.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating stationary', error: error.message });
  }
};

exports.manageClassRollNumbers = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { studentRollNumbers } = req.body;
    if (!Array.isArray(studentRollNumbers)) return res.status(400).json({ success: false, message: 'studentRollNumbers array required' });
    for (const { studentId, rollNumber } of studentRollNumbers) {
      await Student.findOneAndUpdate({ _id: studentId, schoolId }, { rollNumber });
    }
    res.json({ success: true, message: 'Roll numbers updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating roll numbers', error: error.message });
  }
};

exports.getClassAttendanceConfig = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const cls = await Class.findOne({ _id: req.params.classId, schoolId }).select('attendanceConfig').lean();
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: cls.attendanceConfig || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching config', error: error.message });
  }
};

exports.updateClassAttendanceConfig = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.classId, schoolId },
      { attendanceConfig: req.body },
      { new: true }
    );
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: cls.attendanceConfig });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating config', error: error.message });
  }
};

exports.getClassExams = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { academicYear, status } = req.query;
    const filter = { schoolId, classId: req.params.classId };
    if (academicYear) filter.academicYearId = academicYear;
    if (status) filter.status = status;
    const data = await Exam.find(filter).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching exams', error: error.message });
  }
};

exports.getClassAssignments = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId, classId: req.params.classId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    const data = await Assignment.find(filter).populate('subjectId teacherId').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching assignments', error: error.message });
  }
};

// ---------- Section Extras ----------
exports.getSectionTeachers = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const section = await Section.findOne({ _id: req.params.id, schoolId }).populate('classId').lean();
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    const cls = await Class.findOne({ _id: section.classId?._id, schoolId }).select('subjects').populate('subjects.teacherId').lean();
    const teachers = [...new Set((cls?.subjects || []).map(s => s.teacherId).filter(Boolean))];
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching teachers', error: error.message });
  }
};

exports.getSectionAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { date, fromDate, toDate } = req.query;
    const filter = { schoolId, sectionId: req.params.id };
    if (date) filter.date = new Date(date);
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    const data = await StudentAttendance.find(filter).populate('studentId', 'firstName lastName').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
  }
};

exports.getSectionTimetable = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const section = await Section.findOne({ _id: req.params.id, schoolId }).lean();
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    const { academicYear, day } = req.query;
    const filter = { schoolId, classId: section.classId, $or: [{ sectionId: req.params.id }, { sectionId: null }] };
    if (academicYear) filter.academicYearId = academicYear;
    const data = await Timetable.find(filter).populate('teacherId subjectId').lean();
    const result = day ? data.filter(s => s.slots?.some(sl => sl.dayOfWeek === day)) : data;
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching timetable', error: error.message });
  }
};

exports.getSectionExams = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const section = await Section.findOne({ _id: req.params.id, schoolId }).lean();
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    const filter = { schoolId, classId: section.classId };
    if (req.query.status) filter.status = req.query.status;
    const data = await Exam.find(filter).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching exams', error: error.message });
  }
};

exports.getSectionCapacity = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const section = await Section.findOne({ _id: req.params.id, schoolId }).lean();
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    const current = await Student.countDocuments({ schoolId, sectionId: req.params.id, status: 'active' });
    res.json({ success: true, data: { capacity: section.capacity || 40, currentStudents: current } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching capacity', error: error.message });
  }
};

exports.updateSectionCapacity = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const section = await Section.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { capacity: req.body.capacity || req.body.totalSeats },
      { new: true }
    );
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    res.json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating capacity', error: error.message });
  }
};

exports.getSectionFees = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const students = await Student.find({ schoolId, sectionId: req.params.id }).select('_id').lean();
    const studentIds = students.map(s => s._id);
    const fees = await StudentFee.find({ schoolId, studentId: { $in: studentIds } }).populate('studentId', 'firstName lastName').lean();
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching section fees', error: error.message });
  }
};

exports.getSectionReports = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { type, academicYear } = req.query;
    const section = await Section.findOne({ _id: req.params.id, schoolId }).populate('classId').lean();
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    const students = await Student.countDocuments({ schoolId, sectionId: req.params.id, status: 'active' });
    const attendance = await StudentAttendance.find({ schoolId, sectionId: req.params.id }).lean();
    res.json({ success: true, data: { section, studentCount: students, attendanceSummary: attendance.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
};

exports.getSectionOverview = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const section = await Section.findOne({ _id: req.params.id, schoolId }).populate('classId').lean();
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    const [studentCount, examCount] = await Promise.all([
      Student.countDocuments({ schoolId, sectionId: req.params.id, status: 'active' }),
      Exam.countDocuments({ schoolId, sectionId: req.params.id })
    ]);
    res.json({ success: true, data: { ...section, studentCount, examCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching overview', error: error.message });
  }
};

// ---------- Subject Extras ----------
exports.getSubjectClassMappings = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const classes = await Class.find({ schoolId, 'subjects.subjectId': req.params.subjectId }).select('name subjects').lean();
    const data = classes.map(c => ({ classId: c._id, className: c.name, mapping: c.subjects?.find(s => s.subjectId?.toString() === req.params.subjectId) }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching class mappings', error: error.message });
  }
};

exports.getSubjectTeachers = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const classes = await Class.find({ schoolId, 'subjects.subjectId': req.params.subjectId }).select('subjects').populate('subjects.teacherId').lean();
    const teachers = [...new Set(classes.flatMap(c => (c.subjects || []).filter(s => s.subjectId?.toString() === req.params.subjectId).map(s => s.teacherId).filter(Boolean)))];
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching teachers', error: error.message });
  }
};

exports.assignTeacherToSubject = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { teacherId, classId, sectionId } = req.body;
    const cls = await Class.findOne({ _id: classId, schoolId });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    const subjects = cls.subjects || [];
    const idx = subjects.findIndex(s => s.subjectId?.toString() === req.params.subjectId);
    if (idx >= 0) subjects[idx].teacherId = teacherId;
    else subjects.push({ subjectId: req.params.subjectId, teacherId });
    cls.subjects = subjects;
    await cls.save();
    res.json({ success: true, data: cls.subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error assigning teacher', error: error.message });
  }
};

exports.getSubjectAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId, fromDate, toDate } = req.query;
    const filter = { schoolId };
    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    const data = await StudentAttendance.find(filter).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
  }
};

exports.getSubjectTimetable = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.sectionId) filter.sectionId = req.query.sectionId;
    const data = await Timetable.find(filter).populate('teacherId subjectId').lean();
    const result = data.filter(s => s.slots?.some(sl => sl.subjectId?.toString() === req.params.subjectId));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching timetable', error: error.message });
  }
};

exports.getSubjectExams = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.classId) filter.classId = req.query.classId;
    const exams = await Exam.find(filter).lean();
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching exams', error: error.message });
  }
};

exports.getSubjectSectionConfig = async (req, res) => {
  try {
    res.json({ success: true, data: { sections: [], config: {} } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching section config', error: error.message });
  }
};

exports.updateSubjectSectionConfig = async (req, res) => {
  try {
    res.json({ success: true, data: req.body });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating section config', error: error.message });
  }
};

exports.getSubjectLmsContent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const LmsCourse = require('../models/LmsCourse');
    const courses = await LmsCourse.find({ schoolId, subjectId: req.params.subjectId }).lean();
    const content = await LmsContent.find({ schoolId, courseId: { $in: courses.map(c => c._id) } }).lean();
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching LMS content', error: error.message });
  }
};

exports.getSubjectMetadata = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const subject = await Subject.findOne({ _id: req.params.subjectId, schoolId }).select('name code description').lean();
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching metadata', error: error.message });
  }
};

exports.updateSubjectMetadata = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const subject = await Subject.findOneAndUpdate({ _id: req.params.subjectId, schoolId }, req.body, { new: true });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating metadata', error: error.message });
  }
};

exports.getSubjectOverview = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const subject = await Subject.findOne({ _id: req.params.subjectId, schoolId }).lean();
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    const classCount = await Class.countDocuments({ schoolId, 'subjects.subjectId': req.params.subjectId });
    res.json({ success: true, data: { ...subject, classCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching overview', error: error.message });
  }
};

exports.getSubjectReports = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, academicYear } = req.query;
    const filter = { schoolId, subjectId: req.params.subjectId };
    if (classId) filter.classId = classId;
    const [assignments, exams] = await Promise.all([
      Assignment.find(filter).populate('classId').lean(),
      Exam.find({ schoolId, subjectId: req.params.subjectId }).lean()
    ]);
    res.json({ success: true, data: { assignments, exams } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
};

// ---------- Attendance Config & Teacher/Staff ----------
exports.getAttendanceConfig = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId } = req.query;
    const filter = { schoolId };
    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    let config = await AttendanceConfig.findOne(filter).lean();
    if (!config) config = await AttendanceConfig.create({ schoolId, ...filter }).then(c => c.toObject());
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching config', error: error.message });
  }
};

exports.updateAttendanceConfig = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { classId, sectionId } = req.body;
    const filter = { schoolId };
    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    const config = await AttendanceConfig.findOneAndUpdate(filter, { $set: req.body }, { new: true, upsert: true }).lean();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating config', error: error.message });
  }
};

exports.getTeacherAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { date, fromDate, toDate } = req.query;
    const filter = { schoolId };
    if (date) filter.date = new Date(date);
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    const data = await TeacherAttendance.find(filter).populate('teacherId', 'firstName lastName').sort({ date: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching teacher attendance', error: error.message });
  }
};

exports.markTeacherAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { teacherId, date, status, checkInTime, checkOutTime, remarks } = req.body;
    const att = await TeacherAttendance.findOneAndUpdate(
      { schoolId, teacherId, date: new Date(date) },
      { status: status || 'present', checkInTime, checkOutTime, remarks },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: att });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking teacher attendance', error: error.message });
  }
};

exports.getStaffAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { date, fromDate, toDate, staffId } = req.query;
    const filter = { schoolId };
    if (staffId) filter.staffId = staffId;
    if (date) filter.date = new Date(date);
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    const data = await StaffAttendance.find(filter).populate('staffId', 'firstName lastName').sort({ date: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching staff attendance', error: error.message });
  }
};

exports.markStaffAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { staffId, date, status, checkInTime, checkOutTime, shift } = req.body;
    const att = await StaffAttendance.findOneAndUpdate(
      { schoolId, staffId, date: new Date(date) },
      { status: status || 'present', checkInTime, checkOutTime, shift },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: att });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking staff attendance', error: error.message });
  }
};

// ---------- Attendance Notifications & Reports ----------
exports.getAttendanceNotifications = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { page = 1, limit = 10, type } = req.query;
    const filter = { schoolId };
    if (type) filter.type = type;
    const skip = (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 10);
    const l = Math.min(100, parseInt(limit, 10) || 10);
    const [data, total] = await Promise.all([
      AttendanceNotification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
      AttendanceNotification.countDocuments(filter)
    ]);
    res.json({ success: true, data: { data, total, page: parseInt(page, 10) || 1, limit: l, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
};

exports.sendAttendanceNotification = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const notif = await AttendanceNotification.create({
      schoolId,
      ...req.body,
      sentAt: new Date(),
      status: 'sent'
    });
    res.status(201).json({ success: true, data: notif, message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending notification', error: error.message });
  }
};

exports.getAttendanceReportsByType = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { type, classId, sectionId, fromDate, toDate } = req.query;
    const filter = { schoolId };
    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    const data = await StudentAttendance.find(filter).populate('studentId classId sectionId').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
};

// ---------- Admissions Extended ----------
exports.getApplicationDocuments = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await AdmissionDocument.find({ schoolId, applicationId: req.params.id }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching documents', error: error.message });
  }
};

exports.uploadApplicationDocument = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const doc = await AdmissionDocument.create({
      schoolId,
      applicationId: req.params.id,
      ...req.body,
      fileUrl: req.body.fileUrl || '/uploads/placeholder.pdf'
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
  }
};

exports.verifyApplicationDocument = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const doc = await AdmissionDocument.findOneAndUpdate(
      { _id: req.params.documentId, schoolId, applicationId: req.params.id },
      { verified: true, verifiedBy: req.admin._id, verifiedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error verifying document', error: error.message });
  }
};

exports.scheduleEntranceTest = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { scheduledDate, venue } = req.body;
    const app = await AdmissionApplication.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { $set: { 'entranceTest.scheduledDate': new Date(scheduledDate), 'entranceTest.venue': venue } },
      { new: true }
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error scheduling test', error: error.message });
  }
};

exports.recordEntranceTestResult = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { result, score, remarks } = req.body;
    const app = await AdmissionApplication.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { $set: { 'entranceTest.result': result, 'entranceTest.score': score, 'entranceTest.remarks': remarks } },
      { new: true }
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error recording result', error: error.message });
  }
};

exports.scheduleInterview = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { interviewDate, interviewTime, interviewerName } = req.body;
    const app = await AdmissionApplication.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { $set: { 'interview.scheduledDate': new Date(interviewDate), 'interview.scheduledTime': interviewTime, 'interview.interviewerName': interviewerName } },
      { new: true }
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error scheduling interview', error: error.message });
  }
};

exports.recordInterviewResult = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { result, remarks } = req.body;
    const app = await AdmissionApplication.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { $set: { 'interview.result': result, 'interview.remarks': remarks } },
      { new: true }
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error recording result', error: error.message });
  }
};

exports.getApplicationAcademicHistory = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const app = await AdmissionApplication.findOne({ _id: req.params.id, schoolId }).select('academicHistory').lean();
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app.academicHistory || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching academic history', error: error.message });
  }
};

exports.updateApplicationAcademicHistory = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const app = await AdmissionApplication.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { $set: { academicHistory: req.body.academicHistory || req.body } },
      { new: true }
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app.academicHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating academic history', error: error.message });
  }
};

exports.updateApplicationReview = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { reviewNotes, status } = req.body;
    const update = { reviewNotes };
    if (status) update.status = status;
    const app = await AdmissionApplication.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { $set: update },
      { new: true }
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating review', error: error.message });
  }
};

exports.getAdmissionSettings = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    let settings = await AdmissionSettings.findOne({ schoolId }).lean();
    if (!settings) settings = await AdmissionSettings.create({ schoolId }).then(s => s.toObject());
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
  }
};

exports.updateAdmissionSettings = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const settings = await AdmissionSettings.findOneAndUpdate({ schoolId }, { $set: req.body }, { new: true, upsert: true }).lean();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating settings', error: error.message });
  }
};

exports.publishAdmissionForms = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { formPublished, formOpenDate, formCloseDate } = req.body;
    const settings = await AdmissionSettings.findOneAndUpdate(
      { schoolId },
      { $set: { formPublished: formPublished !== false, formOpenDate: formOpenDate ? new Date(formOpenDate) : undefined, formCloseDate: formCloseDate ? new Date(formCloseDate) : undefined } },
      { new: true, upsert: true }
    ).lean();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error publishing forms', error: error.message });
  }
};

exports.getAdmissionsReports = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { academicYear, status } = req.query;
    const filter = { schoolId };
    if (academicYear) filter.academicYear = academicYear;
    if (status) filter.status = status;
    const [enquiries, applications, byStatus] = await Promise.all([
      Enquiry.countDocuments({ schoolId }),
      AdmissionApplication.countDocuments(filter),
      AdmissionApplication.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);
    res.json({ success: true, data: { totalEnquiries: enquiries, totalApplications: applications, byStatus } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
};

exports.updateClassFeeStructure = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.classId, schoolId },
      { $set: { feeStructure: req.body.feeStructure || req.body } },
      { new: true }
    );
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: cls.feeStructure });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating fee structure', error: error.message });
  }
};
