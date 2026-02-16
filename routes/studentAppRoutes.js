const express = require('express');
const router = express.Router();
const { protectStudent } = require('../middleware/auth');
const ctrl = require('../controllers/studentAppController');

// All routes require student authentication
router.use(protectStudent);

// 1. Dashboard
router.get('/dashboard', ctrl.getDashboardStats);

// 2. Profile
router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);

// 3. Classes
router.get('/classes', ctrl.getMyClasses);
router.get('/classes/:classId', ctrl.getClassDetails);
router.get('/classes/:classId/students', ctrl.getClassStudents);
router.get('/classes/:classId/teacher', ctrl.getClassTeacher);

// 4. Subjects
router.get('/subjects', ctrl.getMySubjects);
router.get('/subjects/:subjectId', ctrl.getSubjectDetails);

// 5. Assignments
router.get('/assignments', ctrl.getMyAssignments);
router.get('/assignments/:assignmentId', ctrl.getAssignmentDetails);
router.get('/assignments/:assignmentId/submission', ctrl.getMySubmission);
router.post('/assignments/:assignmentId/submit', ctrl.submitAssignment);
router.put('/assignments/:assignmentId/submission', ctrl.updateSubmission);

// 6. Grades
router.get('/grades', ctrl.getMyGrades);
router.get('/grades/summary', ctrl.getGradesSummary);
router.get('/grades/:gradeId', ctrl.getGradeDetails);

// 7. Attendance
router.get('/attendance', ctrl.getMyAttendance);
router.get('/attendance/summary', ctrl.getAttendanceSummary);
router.get('/attendance/calendar', ctrl.getAttendanceCalendar);

// 8. Timetable
router.get('/timetable', ctrl.getMyTimetable);
router.get('/timetable/:dayOfWeek', ctrl.getTimetableForDay);

// 9. Exams
router.get('/exams', ctrl.getMyExams);
router.get('/exams/results', ctrl.getMyExamResults);
router.get('/exams/:examId', ctrl.getExamDetails);
router.get('/exams/:examId/hall-ticket', ctrl.getHallTicket);
router.get('/exams/results/:resultId', ctrl.getExamResultDetails);

// 10. Fees
router.get('/fees', ctrl.getMyFees);
router.get('/fees/payments', ctrl.getPayments);
router.get('/fees/:feeId', ctrl.getFeeDetails);
router.get('/fees/payments/:paymentId/receipt', ctrl.getPaymentReceipt);

// 11. Documents
router.get('/documents', ctrl.getMyDocuments);
router.get('/documents/:documentId', ctrl.getDocumentDetails);
router.post('/documents', ctrl.uploadDocument);
router.delete('/documents/:documentId', ctrl.deleteDocument);

// 12. Content Library
router.get('/content', ctrl.getContentLibrary);
router.get('/content/:contentId', ctrl.getContentDetails);
router.post('/content/:contentId/progress', ctrl.trackContentProgress);

// 13. Communication
router.get('/notices', ctrl.getNotices);
router.get('/notices/:noticeId', ctrl.getNoticeDetails);
router.post('/notices/:noticeId/read', ctrl.markNoticeAsRead);
router.get('/messages', ctrl.getMessages);
router.get('/messages/:messageId', ctrl.getMessageDetails);
router.post('/messages', ctrl.sendMessage);
router.post('/messages/:messageId/read', ctrl.markMessageAsRead);

// 14. Settings
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

module.exports = router;
