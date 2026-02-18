const LmsCourse = require('../models/LmsCourse');
const LmsContent = require('../models/LmsContent');
const LmsAnnouncement = require('../models/LmsAnnouncement');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const LmsAssessment = require('../models/LmsAssessment');
const LmsAssessmentSubmission = require('../models/LmsAssessmentSubmission');
const LmsLiveClass = require('../models/LmsLiveClass');
const LmsRecordedClass = require('../models/LmsRecordedClass');
const LmsProgress = require('../models/LmsProgress');
const LmsAutomationRule = require('../models/LmsAutomationRule');
const LmsSettings = require('../models/LmsSettings');
const LmsVirtualClassroom = require('../models/LmsVirtualClassroom');
const LmsCourseAttendance = require('../models/LmsCourseAttendance');
const mongoose = require('mongoose');

const getSchoolId = (req) => req.admin.schoolId._id || req.admin.schoolId;

exports.getDashboard = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const totalCourses = await LmsCourse.countDocuments({ schoolId });
    res.json({ success: true, data: { totalCourses, recentActivity: [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching LMS dashboard', error: error.message });
  }
};

exports.listCourses = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await LmsCourse.find({ schoolId }).populate('subjectId classId instructorId', 'name title firstName lastName').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing courses', error: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const course = await LmsCourse.findOne({ _id: req.params.id, schoolId }).populate('subjectId classId instructorId').lean();
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching course', error: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const course = await LmsCourse.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating course', error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const course = await LmsCourse.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating course', error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const course = await LmsCourse.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting course', error: error.message });
  }
};

exports.publishCourse = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const course = await LmsCourse.findOneAndUpdate({ _id: req.params.id, schoolId }, { status: 'published' }, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error publishing course', error: error.message });
  }
};

exports.archiveCourse = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const course = await LmsCourse.findOneAndUpdate({ _id: req.params.id, schoolId }, { status: 'archived' }, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error archiving course', error: error.message });
  }
};

exports.listContent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const data = await LmsContent.find(filter).sort({ order: 1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing content', error: error.message });
  }
};

exports.getContent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const content = await LmsContent.findOne({ _id: req.params.id, schoolId }).lean();
    if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching content', error: error.message });
  }
};

exports.createContent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const content = await LmsContent.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating content', error: error.message });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const content = await LmsContent.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating content', error: error.message });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const content = await LmsContent.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!content) return res.status(404).json({ success: false, message: 'Content not found' });
    res.json({ success: true, message: 'Content deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting content', error: error.message });
  }
};

exports.listAnnouncements = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const data = await LmsAnnouncement.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing announcements', error: error.message });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const announcement = await LmsAnnouncement.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating announcement', error: error.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const announcement = await LmsAnnouncement.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating announcement', error: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const announcement = await LmsAnnouncement.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting announcement', error: error.message });
  }
};

// ---------- Assignments ----------
exports.listAssignments = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.courseId) filter.courseId = req.query.courseId;
    if (req.query.classId) filter.classId = req.query.classId;
    const data = await Assignment.find(filter).populate('classId subjectId teacherId', 'name title firstName lastName').sort({ dueDate: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing assignments', error: error.message });
  }
};

exports.getAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const assignment = await Assignment.findOne({ _id: req.params.id, schoolId }).populate('classId subjectId teacherId').lean();
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching assignment', error: error.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const assignment = await Assignment.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating assignment', error: error.message });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const assignment = await Assignment.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating assignment', error: error.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting assignment', error: error.message });
  }
};

exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await AssignmentSubmission.find({ schoolId, assignmentId: req.params.id }).populate('studentId', 'firstName lastName').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching submissions', error: error.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { score, remarks } = req.body;
    const sub = await AssignmentSubmission.findOneAndUpdate(
      { _id: req.params.submissionId, schoolId },
      { score, remarks, status: 'graded', gradedAt: new Date(), gradedBy: req.admin._id },
      { new: true }
    );
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    res.json({ success: true, data: sub });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error grading', error: error.message });
  }
};

exports.bulkGradeSubmissions = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { grades } = req.body;
    if (!Array.isArray(grades)) return res.status(400).json({ success: false, message: 'grades array required' });
    for (const g of grades) {
      await AssignmentSubmission.findOneAndUpdate(
        { _id: g.submissionId, schoolId },
        { score: g.score, remarks: g.remarks, status: 'graded', gradedAt: new Date(), gradedBy: req.admin._id }
      );
    }
    res.json({ success: true, message: 'Bulk graded' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error bulk grading', error: error.message });
  }
};

// ---------- Assessments ----------
exports.listAssessments = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const data = await LmsAssessment.find(filter).populate('courseId', 'title').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing assessments', error: error.message });
  }
};

exports.getAssessment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const assessment = await LmsAssessment.findOne({ _id: req.params.id, schoolId }).lean();
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching assessment', error: error.message });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const assessment = await LmsAssessment.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating assessment', error: error.message });
  }
};

exports.updateAssessment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const assessment = await LmsAssessment.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating assessment', error: error.message });
  }
};

exports.deleteAssessment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const assessment = await LmsAssessment.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    res.json({ success: true, message: 'Assessment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting assessment', error: error.message });
  }
};

exports.submitAssessment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const sub = await LmsAssessmentSubmission.findOneAndUpdate(
      { assessmentId: req.params.id, studentId: req.body.studentId, schoolId },
      { score: req.body.score, status: 'submitted', submittedAt: new Date() },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, data: sub });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting', error: error.message });
  }
};

exports.getAssessmentResults = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await LmsAssessmentSubmission.find({ schoolId, assessmentId: req.params.id }).populate('studentId', 'firstName lastName').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching results', error: error.message });
  }
};

// ---------- Live Classes ----------
exports.listLiveClasses = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const data = await LmsLiveClass.find(filter).populate('courseId', 'title').sort({ scheduledAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing live classes', error: error.message });
  }
};

exports.createLiveClass = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const liveClass = await LmsLiveClass.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: liveClass });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating live class', error: error.message });
  }
};

exports.updateLiveClass = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const liveClass = await LmsLiveClass.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!liveClass) return res.status(404).json({ success: false, message: 'Live class not found' });
    res.json({ success: true, data: liveClass });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating live class', error: error.message });
  }
};

exports.deleteLiveClass = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const liveClass = await LmsLiveClass.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!liveClass) return res.status(404).json({ success: false, message: 'Live class not found' });
    res.json({ success: true, message: 'Live class deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting live class', error: error.message });
  }
};

exports.startLiveClass = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const liveClass = await LmsLiveClass.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { status: 'live', startedAt: new Date() },
      { new: true }
    );
    if (!liveClass) return res.status(404).json({ success: false, message: 'Live class not found' });
    res.json({ success: true, data: liveClass });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error starting live class', error: error.message });
  }
};

exports.endLiveClass = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const liveClass = await LmsLiveClass.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { status: 'ended', endedAt: new Date() },
      { new: true }
    );
    if (!liveClass) return res.status(404).json({ success: false, message: 'Live class not found' });
    res.json({ success: true, data: liveClass });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error ending live class', error: error.message });
  }
};

// ---------- Recorded Classes ----------
exports.listRecordedClasses = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const data = await LmsRecordedClass.find(filter).populate('courseId', 'title').sort({ recordedAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing recorded classes', error: error.message });
  }
};

exports.createRecordedClass = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const recorded = await LmsRecordedClass.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: recorded });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating recorded class', error: error.message });
  }
};

exports.updateRecordedClass = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const recorded = await LmsRecordedClass.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!recorded) return res.status(404).json({ success: false, message: 'Recorded class not found' });
    res.json({ success: true, data: recorded });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating recorded class', error: error.message });
  }
};

exports.deleteRecordedClass = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const recorded = await LmsRecordedClass.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!recorded) return res.status(404).json({ success: false, message: 'Recorded class not found' });
    res.json({ success: true, message: 'Recorded class deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting recorded class', error: error.message });
  }
};

// ---------- Progress ----------
exports.getProgress = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const data = await LmsProgress.find(filter).populate('studentId courseId', 'firstName lastName title').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching progress', error: error.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { studentId, courseId, contentId, progressPercent } = req.body;
    const progress = await LmsProgress.findOneAndUpdate(
      { schoolId, studentId, courseId },
      { contentId, progressPercent, completedAt: progressPercent >= 100 ? new Date() : null },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating progress', error: error.message });
  }
};

exports.getProgressReports = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const mongoose = require('mongoose');
    const sid = mongoose.Types.ObjectId.isValid(schoolId) ? new mongoose.Types.ObjectId(schoolId) : schoolId;
    const data = await LmsProgress.aggregate([
      { $match: { schoolId: sid } },
      { $group: { _id: '$courseId', avgProgress: { $avg: '$progressPercent' }, count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
};

// ---------- Automation Rules ----------
exports.getAutomationRules = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await LmsAutomationRule.find({ schoolId }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching rules', error: error.message });
  }
};

exports.createAutomationRule = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const rule = await LmsAutomationRule.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating rule', error: error.message });
  }
};

exports.updateAutomationRule = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const rule = await LmsAutomationRule.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating rule', error: error.message });
  }
};

exports.deleteAutomationRule = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const rule = await LmsAutomationRule.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting rule', error: error.message });
  }
};

// ---------- LMS Settings ----------
exports.getLmsSettings = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    let settings = await LmsSettings.findOne({ schoolId }).lean();
    if (!settings) settings = await LmsSettings.create({ schoolId }).then(s => s.toObject());
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
  }
};

exports.updateLmsSettings = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const settings = await LmsSettings.findOneAndUpdate({ schoolId }, { $set: req.body }, { new: true, upsert: true }).lean();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating settings', error: error.message });
  }
};

// ---------- Virtual Classroom ----------
exports.listVirtualClassrooms = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.courseId) filter.courseId = req.query.courseId;
    const data = await LmsVirtualClassroom.find(filter).populate('courseId', 'title').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing virtual classrooms', error: error.message });
  }
};

exports.getVirtualClassroom = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const room = await LmsVirtualClassroom.findOne({ _id: req.params.id, schoolId }).populate('courseId').lean();
    if (!room) return res.status(404).json({ success: false, message: 'Virtual classroom not found' });
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching virtual classroom', error: error.message });
  }
};

exports.createVirtualClassroom = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const room = await LmsVirtualClassroom.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating virtual classroom', error: error.message });
  }
};

exports.joinVirtualClassroom = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { userId } = req.body;
    const room = await LmsVirtualClassroom.findOneAndUpdate(
      { _id: req.params.id, schoolId, status: { $in: ['scheduled', 'live'] } },
      { $push: { participants: { userId: userId || req.admin?._id, joinedAt: new Date() } }, status: 'live' },
      { new: true }
    );
    if (!room) return res.status(404).json({ success: false, message: 'Classroom not found or not joinable' });
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error joining', error: error.message });
  }
};

exports.leaveVirtualClassroom = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { userId } = req.body;
    const room = await LmsVirtualClassroom.findOne({ _id: req.params.id, schoolId });
    if (!room) return res.status(404).json({ success: false, message: 'Classroom not found' });
    const pid = room.participants?.find(p => (p.userId?.toString() === (userId || req.admin?._id)?.toString()));
    if (pid) pid.leftAt = new Date();
    await room.save();
    res.json({ success: true, message: 'Left classroom' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error leaving', error: error.message });
  }
};

// ---------- LMS Attendance ----------
exports.getLmsAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.courseId) filter.courseId = req.query.courseId;
    if (req.query.studentId) filter.studentId = req.query.studentId;
    const data = await LmsCourseAttendance.find(filter).populate('studentId courseId').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
  }
};

exports.markLmsAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { courseId, studentId, sessionId, date, status } = req.body;
    const att = await LmsCourseAttendance.findOneAndUpdate(
      { schoolId, courseId, studentId, date: new Date(date || Date.now()) },
      { sessionId, status: status || 'present' },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: att });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking attendance', error: error.message });
  }
};

// ---------- Teacher Analytics ----------
exports.getTeacherAnalytics = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { teacherId, courseId } = req.query;
    const LmsCourse = require('../models/LmsCourse');
    const filter = { schoolId };
    if (teacherId) filter.instructorId = teacherId;
    if (courseId) filter._id = courseId;
    const courses = await LmsCourse.find(filter).lean();
    const LmsProgress = require('../models/LmsProgress');
    const progress = await LmsProgress.aggregate([
      { $match: { schoolId: mongoose.Types.ObjectId.isValid(schoolId) ? new mongoose.Types.ObjectId(schoolId) : schoolId, courseId: { $in: courses.map(c => c._id) } } },
      { $group: { _id: '$courseId', avgProgress: { $avg: '$progressPercent' }, count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: { courses, progress } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching analytics', error: error.message });
  }
};
