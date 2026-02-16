const express = require('express');
const router = express.Router();
const { protectTeacher } = require('../middleware/auth');
const ctrl = require('../controllers/teacherAppController');

// All routes require teacher authentication
router.use(protectTeacher);

// 1. Dashboard
router.get('/dashboard/stats', ctrl.getDashboardStats);

// 2. Profile
router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.get('/profile/qualifications', ctrl.getQualifications);
router.post('/profile/qualifications', ctrl.addQualification);
router.delete('/profile/qualifications/:qualificationId', ctrl.deleteQualification);
router.get('/profile/documents', ctrl.getDocuments);
router.post('/profile/documents', ctrl.uploadDocument);
router.delete('/profile/documents/:documentId', ctrl.deleteDocument);

// 3. Classes
router.get('/classes', ctrl.getMyClasses);
router.get('/classes/:classId', ctrl.getClassDetails);
router.get('/classes/:classId/students', ctrl.getClassStudents);

// 4. Students
router.get('/students', ctrl.getMyStudents);
router.get('/students/:studentId', ctrl.getStudentDetails);
router.get('/students/:studentId/attendance', ctrl.getStudentAttendance);
router.get('/students/:studentId/grades', ctrl.getStudentGrades);

// 5. Assignments
router.get('/assignments', ctrl.getMyAssignments);
router.post('/assignments', ctrl.createAssignment);
router.get('/assignments/:assignmentId', ctrl.getAssignmentDetails);
router.put('/assignments/:assignmentId', ctrl.updateAssignment);
router.delete('/assignments/:assignmentId', ctrl.deleteAssignment);
router.post('/assignments/:assignmentId/publish', ctrl.publishAssignment);
router.post('/assignments/:assignmentId/close', ctrl.closeAssignment);
router.get('/assignments/:assignmentId/submissions', ctrl.getSubmissions);
router.get('/assignments/:assignmentId/submissions/:submissionId', ctrl.getSubmissionDetails);
router.put('/assignments/:assignmentId/submissions/:submissionId/grade', ctrl.gradeSubmission);

// 6. Grades
router.get('/grades', ctrl.getMyGrades);
router.post('/grades', ctrl.createGrade);
router.post('/grades/bulk', ctrl.bulkCreateGrades);
router.put('/grades/:gradeId', ctrl.updateGrade);
router.delete('/grades/:gradeId', ctrl.deleteGrade);

// 7. Attendance
router.get('/attendance', ctrl.getAttendance);
router.post('/attendance/bulk', ctrl.markBulkAttendance);
router.get('/attendance/statistics', ctrl.getAttendanceStats);
router.get('/attendance/class/:classId/date/:date', ctrl.getClassAttendanceForDate);
router.put('/attendance/:attendanceId', ctrl.updateAttendance);
router.delete('/attendance/:attendanceId', ctrl.deleteAttendance);

// 8. Timetable
router.get('/timetable', ctrl.getMyTimetable);
router.get('/timetable/day/:dayOfWeek', ctrl.getTimetableForDay);

// 9. Exams
router.get('/exams', ctrl.getMyExams);
router.get('/exams/:examId', ctrl.getExamDetails);
router.get('/exams/:examId/results', ctrl.getExamResults);
router.post('/exams/:examId/results', ctrl.createExamResult);
router.post('/exams/:examId/results/bulk', ctrl.bulkCreateExamResults);
router.put('/exams/:examId/results/:resultId', ctrl.updateExamResult);

// 10. Content
router.get('/content', ctrl.getContentLibrary);
router.post('/content', ctrl.createContent);
router.get('/content/:contentId', ctrl.getContentDetails);
router.put('/content/:contentId', ctrl.updateContent);
router.delete('/content/:contentId', ctrl.deleteContent);

// 11. Communication
router.get('/communication/notices', ctrl.getNotices);
router.get('/communication/notices/:noticeId', ctrl.getNoticeDetails);
router.post('/communication/messages', ctrl.sendMessage);
router.get('/communication/messages', ctrl.getMessages);

// 12. Leave
router.get('/leave/requests', ctrl.getLeaveRequests);
router.post('/leave/requests', ctrl.createLeaveRequest);
router.put('/leave/requests/:requestId', ctrl.updateLeaveRequest);
router.delete('/leave/requests/:requestId', ctrl.cancelLeaveRequest);
router.get('/leave/balance', ctrl.getLeaveBalance);

// 13. Settings
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

module.exports = router;
