const express = require('express');
const router = express.Router();
const { protect, requireApprovedSchool } = require('../middleware/auth');
const ctrl = require('../controllers/lmsController');

router.use(protect);
router.use(requireApprovedSchool);

router.get('/dashboard', ctrl.getDashboard);
router.get('/courses', ctrl.listCourses);
router.get('/courses/:id', ctrl.getCourse);
router.post('/courses', ctrl.createCourse);
router.put('/courses/:id', ctrl.updateCourse);
router.delete('/courses/:id', ctrl.deleteCourse);
router.post('/courses/:id/publish', ctrl.publishCourse);
router.post('/courses/:id/archive', ctrl.archiveCourse);

router.get('/content', ctrl.listContent);
router.get('/content/:id', ctrl.getContent);
router.post('/content', ctrl.createContent);
router.put('/content/:id', ctrl.updateContent);
router.delete('/content/:id', ctrl.deleteContent);

router.get('/announcements', ctrl.listAnnouncements);
router.post('/announcements', ctrl.createAnnouncement);
router.put('/announcements/:id', ctrl.updateAnnouncement);
router.delete('/announcements/:id', ctrl.deleteAnnouncement);

router.get('/assignments', ctrl.listAssignments);
router.get('/assignments/:id', ctrl.getAssignment);
router.post('/assignments', ctrl.createAssignment);
router.put('/assignments/:id', ctrl.updateAssignment);
router.delete('/assignments/:id', ctrl.deleteAssignment);
router.get('/assignments/:id/submissions', ctrl.getAssignmentSubmissions);
router.put('/assignments/:id/submissions/:submissionId/grade', ctrl.gradeSubmission);
router.post('/assignments/:id/submissions/bulk-grade', ctrl.bulkGradeSubmissions);

router.get('/assessments', ctrl.listAssessments);
router.get('/assessments/:id', ctrl.getAssessment);
router.post('/assessments', ctrl.createAssessment);
router.put('/assessments/:id', ctrl.updateAssessment);
router.delete('/assessments/:id', ctrl.deleteAssessment);
router.post('/assessments/:id/submit', ctrl.submitAssessment);
router.get('/assessments/:id/results', ctrl.getAssessmentResults);

router.get('/live-classes', ctrl.listLiveClasses);
router.post('/live-classes', ctrl.createLiveClass);
router.put('/live-classes/:id', ctrl.updateLiveClass);
router.delete('/live-classes/:id', ctrl.deleteLiveClass);
router.post('/live-classes/:id/start', ctrl.startLiveClass);
router.post('/live-classes/:id/end', ctrl.endLiveClass);

router.get('/recorded-classes', ctrl.listRecordedClasses);
router.post('/recorded-classes', ctrl.createRecordedClass);
router.put('/recorded-classes/:id', ctrl.updateRecordedClass);
router.delete('/recorded-classes/:id', ctrl.deleteRecordedClass);

router.get('/progress', ctrl.getProgress);
router.put('/progress', ctrl.updateProgress);
router.get('/progress/reports', ctrl.getProgressReports);

router.get('/automation/rules', ctrl.getAutomationRules);
router.post('/automation/rules', ctrl.createAutomationRule);
router.put('/automation/rules/:id', ctrl.updateAutomationRule);
router.delete('/automation/rules/:id', ctrl.deleteAutomationRule);

router.get('/settings', ctrl.getLmsSettings);
router.put('/settings', ctrl.updateLmsSettings);

router.get('/virtual-classrooms', ctrl.listVirtualClassrooms);
router.get('/virtual-classrooms/:id', ctrl.getVirtualClassroom);
router.post('/virtual-classrooms', ctrl.createVirtualClassroom);
router.post('/virtual-classrooms/:id/join', ctrl.joinVirtualClassroom);
router.post('/virtual-classrooms/:id/leave', ctrl.leaveVirtualClassroom);

router.get('/attendance', ctrl.getLmsAttendance);
router.post('/attendance', ctrl.markLmsAttendance);

router.get('/analytics/teacher', ctrl.getTeacherAnalytics);

module.exports = router;
