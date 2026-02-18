const Parent = require('../models/Parent');
const Guardian = require('../models/Guardian');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Section = require('../models/Section');
const StudentAttendance = require('../models/StudentAttendance');
const Grade = require('../models/Grade');
const ExamResult = require('../models/ExamResult');
const Exam = require('../models/Exam');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Timetable = require('../models/Timetable');
const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const Notice = require('../models/Notice');
const StudentCommunication = require('../models/StudentCommunication');
const School = require('../models/School');
const mongoose = require('mongoose');

async function getChildIds(parent) {
  const schoolId = parent.schoolId._id || parent.schoolId;
  const guardians = await Guardian.find({
    schoolId,
    email: (parent.email || '').toLowerCase().trim()
  }).select('studentId').lean();
  const studentIds = [...new Set(guardians.map(g => g.studentId.toString()))].map(id => new mongoose.Types.ObjectId(id));
  return { schoolId, studentIds };
}

function ensureParentHasChild(parent, childId, studentIds) {
  if (!studentIds.some(sid => sid.toString() === childId.toString())) {
    return false;
  }
  return true;
}

exports.getDashboard = async (req, res) => {
  try {
    const { schoolId, studentIds } = await getChildIds(req.parent);
    if (studentIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { children: [], summary: { totalChildren: 0 } }
      });
    }
    const students = await Student.find({ _id: { $in: studentIds }, status: 'active' })
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .select('firstName lastName admissionNumber classId sectionId')
      .lean();
    const summary = {
      totalChildren: students.length,
      children: students.map(s => ({
        id: s._id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        admissionNumber: s.admissionNumber,
        className: s.classId?.name,
        sectionName: s.sectionId?.name
      }))
    };
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard', error: error.message });
  }
};

exports.getChildren = async (req, res) => {
  try {
    const { schoolId, studentIds } = await getChildIds(req.parent);
    if (studentIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    const students = await Student.find({ _id: { $in: studentIds }, status: 'active' })
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .select('firstName lastName middleName admissionNumber dateOfBirth classId sectionId rollNumber')
      .lean();
    const list = students.map(s => ({
      _id: s._id,
      firstName: s.firstName,
      lastName: s.lastName,
      middleName: s.middleName,
      admissionNumber: s.admissionNumber,
      dateOfBirth: s.dateOfBirth,
      rollNumber: s.rollNumber,
      class: s.classId?.name,
      section: s.sectionId?.name
    }));
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching children', error: error.message });
  }
};

exports.getChildDetails = async (req, res) => {
  try {
    const { schoolId, studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const student = await Student.findById(req.params.childId)
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .select('-password')
      .lean();
    if (!student) return res.status(404).json({ success: false, message: 'Child not found' });
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching child details', error: error.message });
  }
};

exports.getChildAttendance = async (req, res) => {
  try {
    const { schoolId, studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const { academicYear, fromDate, toDate } = req.query;
    const filter = { schoolId, studentId: req.params.childId };
    if (fromDate) filter.date = { ...(filter.date || {}), $gte: new Date(fromDate) };
    if (toDate) filter.date = { ...(filter.date || {}), $lte: new Date(toDate) };
    const attendance = await StudentAttendance.find(filter).sort({ date: -1 }).limit(100).lean();
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
  }
};

exports.getChildGrades = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const grades = await Grade.find({ studentId: req.params.childId })
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: grades });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching grades', error: error.message });
  }
};

exports.getChildExams = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const results = await ExamResult.find({ studentId: req.params.childId })
      .populate('examId', 'name examDate type')
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching exam results', error: error.message });
  }
};

exports.getChildAssignments = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const student = await Student.findById(req.params.childId).select('classId').lean();
    if (!student) return res.status(404).json({ success: false, message: 'Child not found' });
    const assignments = await Assignment.find({ classId: student.classId, status: 'published' })
      .populate('subjectId', 'name')
      .sort({ dueDate: -1 })
      .limit(50)
      .lean();
    const submissionMap = {};
    const subs = await AssignmentSubmission.find({
      studentId: req.params.childId,
      assignmentId: { $in: assignments.map(a => a._id) }
    }).lean();
    subs.forEach(s => { submissionMap[s.assignmentId.toString()] = s; });
    const list = assignments.map(a => ({
      ...a,
      submission: submissionMap[a._id.toString()] || null
    }));
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching assignments', error: error.message });
  }
};

exports.getChildTimetable = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const student = await Student.findById(req.params.childId).select('classId sectionId').lean();
    if (!student) return res.status(404).json({ success: false, message: 'Child not found' });
    const timetable = await Timetable.find({
      classId: student.classId,
      sectionId: student.sectionId
    })
      .populate('subjectId', 'name')
      .populate('teacherId', 'firstName lastName')
      .lean();
    res.status(200).json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching timetable', error: error.message });
  }
};

exports.getChildFees = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const fees = await StudentFee.find({ studentId: req.params.childId }).lean();
    const payments = await FeePayment.find({ studentId: req.params.childId }).sort({ paymentDate: -1 }).lean();
    res.status(200).json({ success: true, data: { fees, payments } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fees', error: error.message });
  }
};

exports.payChildFee = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const { amount, paymentMethod = 'online', transactionId } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    const fee = await StudentFee.findOne({ studentId: req.params.childId, status: { $in: ['pending', 'partial', 'overdue'] } });
    if (!fee) return res.status(400).json({ success: false, message: 'No pending fee found for this child' });
    const mode = ['cash', 'online', 'cheque', 'dd', 'bank-transfer', 'upi'].includes(paymentMethod) ? paymentMethod : 'online';
    const payment = await FeePayment.create({
      schoolId: req.parent.schoolId._id || req.parent.schoolId,
      studentId: req.params.childId,
      feeId: fee._id,
      amount: Number(amount),
      mode,
      transactionId: transactionId || '',
      paymentDate: new Date(),
      status: 'completed',
      collectedBy: req.parent._id
    });
    fee.paidAmount = (fee.paidAmount || 0) + Number(amount);
    await fee.save();
    res.status(201).json({ success: true, message: 'Payment recorded', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error recording payment', error: error.message });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const schoolId = req.parent.schoolId._id || req.parent.schoolId;
    const notices = await Notice.find({
      schoolId,
      status: 'published',
      target: { $in: ['all', 'parents'] }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.status(200).json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notices', error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    const filter = { schoolId: req.parent.schoolId._id || req.parent.schoolId };
    const comms = await StudentCommunication.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.status(200).json({ success: true, data: comms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching messages', error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const schoolId = req.parent.schoolId._id || req.parent.schoolId;
    const { recipientId, recipientType, subject, message, childId } = req.body;
    const { studentIds } = await getChildIds(req.parent);
    const useStudentId = childId && ensureParentHasChild(req.parent, childId, studentIds) ? childId : (studentIds[0] || null);
    if (!useStudentId) {
      return res.status(400).json({ success: false, message: 'No child linked. Please link a child to your account.' });
    }
    await StudentCommunication.create({
      schoolId,
      studentId: useStudentId,
      type: 'notification',
      subject: subject || 'Message from parent',
      message: message || '',
      sentBy: req.parent._id,
      recipient: { type: 'guardian', email: req.parent.email, name: req.parent.fullName }
    });
    res.status(201).json({ success: true, message: 'Message sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending message', error: error.message });
  }
};

exports.getSchoolInfo = async (req, res) => {
  try {
    const school = await School.findById(req.parent.schoolId._id || req.parent.schoolId)
      .select('schoolName schoolCode primaryEmail primaryPhone address website')
      .lean();
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.status(200).json({ success: true, data: school });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching school info', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const parent = await Parent.findById(req.parent._id).select('-password').populate('schoolId', 'schoolName schoolCode');
    res.status(200).json({ success: true, data: parent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['fullName', 'phone'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const parent = await Parent.findByIdAndUpdate(req.parent._id, updates, { new: true }).select('-password').populate('schoolId', 'schoolName schoolCode');
    res.status(200).json({ success: true, data: parent, message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
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
    const parent = await Parent.findById(req.parent._id).select('+password');
    const isMatch = await parent.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    parent.password = newPassword;
    await parent.save();
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
  }
};

exports.getChildDocuments = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const StudentDocument = require('../models/StudentDocument');
    const docs = await StudentDocument.find({ studentId: req.params.childId }).lean();
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching documents', error: error.message });
  }
};

exports.getChildTransport = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const StudentTransport = require('../models/StudentTransport');
    const transport = await StudentTransport.findOne({ studentId: req.params.childId })
      .populate('routeId')
      .populate('stopId')
      .lean();
    res.status(200).json({ success: true, data: transport || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching transport', error: error.message });
  }
};

exports.getChildLeaveRequests = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const StudentLeave = require('../models/StudentLeave');
    const data = await StudentLeave.find({ studentId: req.params.childId }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leave requests', error: error.message });
  }
};

exports.requestLeaveForChild = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const StudentLeave = require('../models/StudentLeave');
    const { leaveType, fromDate, toDate, reason } = req.body;
    const leave = await StudentLeave.create({
      schoolId: req.parent.schoolId._id || req.parent.schoolId,
      studentId: req.params.childId,
      leaveType: leaveType || 'CL',
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason: reason || '',
      status: 'pending'
    });
    res.status(201).json({ success: true, data: leave, message: 'Leave request submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting leave request', error: error.message });
  }
};

const ParentTeacherMeeting = require('../models/ParentTeacherMeeting');

exports.getMeetings = async (req, res) => {
  try {
    const schoolId = req.parent.schoolId._id || req.parent.schoolId;
    const { childId, status } = req.query;
    const filter = { schoolId, parentId: req.parent._id };
    if (childId) filter.childId = childId;
    if (status) filter.status = status;
    const data = await ParentTeacherMeeting.find(filter)
      .populate('childId', 'firstName lastName')
      .populate('teacherId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching meetings', error: error.message });
  }
};

exports.requestMeeting = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    const { childId, teacherId, preferredDate, preferredTime, reason } = req.body;
    if (!ensureParentHasChild(req.parent, childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const meeting = await ParentTeacherMeeting.create({
      schoolId: req.parent.schoolId._id || req.parent.schoolId,
      parentId: req.parent._id,
      childId,
      teacherId,
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      preferredTime: preferredTime || '',
      reason: reason || '',
      status: 'requested'
    });
    res.status(201).json({ success: true, data: meeting, message: 'Meeting request submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error requesting meeting', error: error.message });
  }
};

exports.getTransportRoute = async (req, res) => {
  try {
    const TransportRoute = require('../models/TransportRoute');
    const route = await TransportRoute.findById(req.params.routeId).populate('vehicleId driverId').lean();
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.status(200).json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching route', error: error.message });
  }
};

exports.getChildTransportAttendance = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    res.status(200).json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching transport attendance', error: error.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const StudentDocument = require('../models/StudentDocument');
    const doc = await StudentDocument.findById(req.params.documentId);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, doc.studentId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.status(200).json({ success: true, data: { downloadUrl: doc.fileUrl || doc.path || '', fileName: doc.fileName || doc.originalName } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error downloading document', error: error.message });
  }
};

exports.getChildLearningResources = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const Content = require('../models/Content');
    const student = await Student.findById(req.params.childId).select('classId').lean();
    if (!student) return res.status(404).json({ success: false, message: 'Child not found' });
    const content = await Content.find({ schoolId: req.parent.schoolId._id || req.parent.schoolId, classId: student.classId }).limit(50).lean();
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching learning resources', error: error.message });
  }
};

exports.getChildSyllabus = async (req, res) => {
  try {
    const { studentIds } = await getChildIds(req.parent);
    if (!ensureParentHasChild(req.parent, req.params.childId, studentIds)) {
      return res.status(403).json({ success: false, message: 'Access denied to this child' });
    }
    const student = await Student.findById(req.params.childId).select('classId').lean();
    if (!student) return res.status(404).json({ success: false, message: 'Child not found' });
    const Class = require('../models/Class');
    const cls = await Class.findById(student.classId).select('subjects').lean();
    res.status(200).json({ success: true, data: cls?.subjects || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching syllabus', error: error.message });
  }
};

exports.getSchoolPolicies = async (req, res) => {
  try {
    const school = await School.findById(req.parent.schoolId._id || req.parent.schoolId).select('policies').lean();
    res.status(200).json({ success: true, data: school?.policies || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching policies', error: error.message });
  }
};

exports.getSchoolContact = async (req, res) => {
  try {
    const school = await School.findById(req.parent.schoolId._id || req.parent.schoolId)
      .select('primaryEmail secondaryEmail primaryPhone secondaryPhone address website')
      .lean();
    res.status(200).json({ success: true, data: school || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching contact', error: error.message });
  }
};
