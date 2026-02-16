const express = require('express');
const router = express.Router();
const { protect, requireApprovedSchool } = require('../middleware/auth');
const ctrl = require('../controllers/adminAppController');

// All routes require admin authentication
router.use(protect);
router.use(requireApprovedSchool);

// ============================================
// 1. DASHBOARD
// ============================================
router.get('/dashboard/stats', ctrl.getDashboardStats);

// ============================================
// 2. SCHOOL PROFILE
// ============================================
router.get('/school/profile', ctrl.getSchoolProfile);
router.put('/school/profile', ctrl.updateSchoolProfile);

// ============================================
// 3. STUDENTS
// ============================================
router.get('/students', ctrl.getStudents);
router.post('/students', ctrl.createStudent);
router.get('/students/:studentId', ctrl.getStudentDetails);
router.put('/students/:studentId', ctrl.updateStudent);
router.delete('/students/:studentId', ctrl.deleteStudent);
router.delete('/students/bulk/delete', ctrl.bulkDeleteStudents);

// Student Attendance
router.get('/students/:studentId/attendance', ctrl.getStudentAttendance);

// Student Academic Details
router.get('/students/:studentId/academic', ctrl.getStudentAcademicDetails);

// Student Fees
router.get('/students/:studentId/fees', ctrl.getStudentFees);

// Student Guardians
router.get('/students/:studentId/guardians', ctrl.getStudentGuardians);
router.post('/students/:studentId/guardians', ctrl.addStudentGuardian);
router.delete('/students/:studentId/guardians/:guardianId', ctrl.deleteStudentGuardian);

// Student Documents
router.get('/students/:studentId/documents', ctrl.getStudentDocuments);
router.post('/students/:studentId/documents', ctrl.uploadStudentDocument);
router.delete('/students/:studentId/documents/:documentId', ctrl.deleteStudentDocument);

// ============================================
// 4. TEACHERS
// ============================================
router.get('/teachers', ctrl.getTeachers);
router.post('/teachers', ctrl.createTeacher);
router.get('/teachers/:teacherId', ctrl.getTeacherDetails);
router.put('/teachers/:teacherId', ctrl.updateTeacher);
router.delete('/teachers/:teacherId', ctrl.deleteTeacher);
router.delete('/teachers/bulk/delete', ctrl.bulkDeleteTeachers);

// ============================================
// 5. CLASSES
// ============================================
router.get('/classes', ctrl.getClasses);
router.post('/classes', ctrl.createClass);
router.get('/classes/:classId', ctrl.getClassDetails);
router.put('/classes/:classId', ctrl.updateClass);
router.delete('/classes/:classId', ctrl.deleteClass);
router.post('/classes/:classId/archive', ctrl.archiveClass);

// Class Students
router.get('/classes/:classId/students', ctrl.getClassStudents);

// Class Subjects
router.get('/classes/:classId/subjects', ctrl.getClassSubjects);

// Class Attendance
router.get('/classes/:classId/attendance', ctrl.getClassAttendance);

// Class Timetable
router.get('/classes/:classId/timetable', ctrl.getClassTimetable);

// ============================================
// 6. SUBJECTS
// ============================================
router.get('/subjects', ctrl.getSubjects);
router.post('/subjects', ctrl.createSubject);
router.get('/subjects/:subjectId', ctrl.getSubjectDetails);
router.put('/subjects/:subjectId', ctrl.updateSubject);
router.delete('/subjects/:subjectId', ctrl.deleteSubject);
router.delete('/subjects/bulk/delete', ctrl.bulkDeleteSubjects);

// ============================================
// 7. ATTENDANCE
// ============================================
router.get('/attendance', ctrl.getAttendance);
router.post('/attendance/bulk', ctrl.markAttendanceBulk);
router.put('/attendance/:attendanceId', ctrl.updateAttendance);
router.delete('/attendance/:attendanceId', ctrl.deleteAttendance);
router.delete('/attendance/bulk/delete', ctrl.bulkDeleteAttendance);
router.get('/attendance/statistics', ctrl.getAttendanceStatistics);

// ============================================
// 8. TIMETABLE
// ============================================
router.get('/timetable', ctrl.getTimetable);
router.post('/timetable', ctrl.createTimetableSlot);
router.put('/timetable/:slotId', ctrl.updateTimetableSlot);
router.delete('/timetable/:slotId', ctrl.deleteTimetableSlot);
router.delete('/timetable/bulk/delete', ctrl.bulkDeleteTimetableSlots);

// ============================================
// 9. EXAMS
// ============================================
router.get('/exams', ctrl.getExams);
router.post('/exams', ctrl.createExam);
router.get('/exams/:examId', ctrl.getExamDetails);
router.put('/exams/:examId', ctrl.updateExam);
router.delete('/exams/:examId', ctrl.deleteExam);

// Exam Results
router.get('/exams/:examId/results', ctrl.getExamResults);
router.post('/exams/:examId/results', ctrl.createExamResult);
router.put('/exams/:examId/results/:resultId', ctrl.updateExamResult);
router.post('/exams/:examId/results/publish', ctrl.publishExamResults);

// ============================================
// 10. FEES
// ============================================
router.get('/fees/structures', ctrl.getFeeStructures);
router.get('/fees/students', ctrl.getStudentFees);
router.post('/fees/students/assign', ctrl.assignFeeToStudent);

// Payments
router.get('/fees/payments', ctrl.getPayments);
router.post('/fees/payments', ctrl.recordPayment);
router.get('/fees/payments/:paymentId/receipt', ctrl.getPaymentReceipt);

// ============================================
// 11. GRADES
// ============================================
router.get('/grades', ctrl.getGrades);
router.post('/grades', ctrl.createGrade);
router.put('/grades/:gradeId', ctrl.updateGrade);
router.delete('/grades/:gradeId', ctrl.deleteGrade);

// ============================================
// 12. COMMUNICATION (NOTICES)
// ============================================
router.get('/communication/notices', ctrl.getNotices);
router.post('/communication/notices', ctrl.createNotice);
router.get('/communication/notices/:noticeId', ctrl.getNoticeDetails);
router.put('/communication/notices/:noticeId', ctrl.updateNotice);
router.delete('/communication/notices/:noticeId', ctrl.deleteNotice);
router.post('/communication/notices/:noticeId/publish', ctrl.publishNotice);

module.exports = router;
