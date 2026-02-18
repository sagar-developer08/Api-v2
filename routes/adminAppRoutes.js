const express = require('express');
const router = express.Router();
const { protect, requireApprovedSchool } = require('../middleware/auth');
const ctrl = require('../controllers/adminAppController');
const ext = require('../controllers/adminExtendedController');

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
router.put('/students/:studentId/guardians/:guardianId', ctrl.updateStudentGuardian);
router.delete('/students/:studentId/guardians/:guardianId', ctrl.deleteStudentGuardian);

// Student Documents
router.get('/students/:studentId/documents', ctrl.getStudentDocuments);
router.post('/students/:studentId/documents', ctrl.uploadStudentDocument);
router.delete('/students/:studentId/documents/:documentId', ctrl.deleteStudentDocument);

// Student Notes
router.get('/students/:studentId/notes', ext.getStudentNotes);
router.post('/students/:studentId/notes', ext.createStudentNote);

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
router.get('/classes/:classId/capacity', ext.getClassCapacity);
router.put('/classes/:classId/capacity', ext.updateClassCapacity);
router.get('/classes/:classId/fees', ext.getClassFeeStructure);
router.put('/classes/:classId/fees', ext.updateClassFeeStructure);
router.get('/classes/:classId/promotions', ext.getClassPromotions);
router.post('/classes/:classId/promote', ext.promoteClassStudents);
router.get('/classes/:classId/subject-mapping', ext.getClassSubjectMapping);
router.put('/classes/:classId/subject-mapping', ext.updateClassSubjectMapping);
router.get('/classes/:classId/permissions', ext.getClassPermissions);
router.put('/classes/:classId/permissions', ext.updateClassPermissions);
router.get('/classes/:classId/audit-log', ext.getClassAuditLog);
router.get('/classes/:classId/stationary', ext.getClassStationary);
router.put('/classes/:classId/stationary', ext.updateClassStationary);
router.post('/classes/:classId/roll-numbers/manage', ext.manageClassRollNumbers);
router.get('/classes/:classId/attendance-config', ext.getClassAttendanceConfig);
router.put('/classes/:classId/attendance-config', ext.updateClassAttendanceConfig);
router.get('/classes/:classId/exams', ext.getClassExams);
router.get('/classes/:classId/assignments', ext.getClassAssignments);

// ============================================
// 5b. SECTIONS (standalone)
// ============================================
router.get('/sections', ext.listSections);
router.post('/sections', ext.createSection);
router.get('/sections/:id', ext.getSection);
router.put('/sections/:id', ext.updateSection);
router.delete('/sections/:id', ext.deleteSection);
router.get('/sections/:id/students', ext.getSectionStudents);
router.get('/sections/:id/teachers', ext.getSectionTeachers);
router.get('/sections/:id/attendance', ext.getSectionAttendance);
router.get('/sections/:id/timetable', ext.getSectionTimetable);
router.get('/sections/:id/exams', ext.getSectionExams);
router.get('/sections/:id/capacity', ext.getSectionCapacity);
router.put('/sections/:id/capacity', ext.updateSectionCapacity);
router.get('/sections/:id/fees', ext.getSectionFees);
router.get('/sections/:id/reports', ext.getSectionReports);
router.get('/sections/:id/overview', ext.getSectionOverview);

// ============================================
// 6. SUBJECTS
// ============================================
router.get('/subjects', ctrl.getSubjects);
router.post('/subjects', ctrl.createSubject);
router.get('/subjects/:subjectId', ctrl.getSubjectDetails);
router.put('/subjects/:subjectId', ctrl.updateSubject);
router.delete('/subjects/:subjectId', ctrl.deleteSubject);
router.delete('/subjects/bulk/delete', ctrl.bulkDeleteSubjects);
router.get('/subjects/:subjectId/class-mappings', ext.getSubjectClassMappings);
router.get('/subjects/:subjectId/teachers', ext.getSubjectTeachers);
router.post('/subjects/:subjectId/teachers', ext.assignTeacherToSubject);
router.get('/subjects/:subjectId/attendance', ext.getSubjectAttendance);
router.get('/subjects/:subjectId/timetable', ext.getSubjectTimetable);
router.get('/subjects/:subjectId/exams', ext.getSubjectExams);
router.get('/subjects/:subjectId/section-config', ext.getSubjectSectionConfig);
router.put('/subjects/:subjectId/section-config', ext.updateSubjectSectionConfig);
router.get('/subjects/:subjectId/lms-content', ext.getSubjectLmsContent);
router.get('/subjects/:subjectId/metadata', ext.getSubjectMetadata);
router.put('/subjects/:subjectId/metadata', ext.updateSubjectMetadata);
router.get('/subjects/:subjectId/overview', ext.getSubjectOverview);
router.get('/subjects/:subjectId/reports', ext.getSubjectReports);

// ============================================
// 7. ATTENDANCE
// ============================================
router.get('/attendance', ctrl.getAttendance);
router.get('/attendance/config', ext.getAttendanceConfig);
router.put('/attendance/config', ext.updateAttendanceConfig);
router.get('/attendance/teachers', ext.getTeacherAttendance);
router.post('/attendance/teachers', ext.markTeacherAttendance);
router.get('/attendance/staff', ext.getStaffAttendance);
router.post('/attendance/staff', ext.markStaffAttendance);
router.post('/attendance/bulk', ctrl.markAttendanceBulk);
router.post('/attendance/daily', ext.markAttendanceDaily);
router.post('/attendance/period', ext.markAttendancePeriod);
router.put('/attendance/:attendanceId', ctrl.updateAttendance);
router.delete('/attendance/:attendanceId', ctrl.deleteAttendance);
router.delete('/attendance/bulk/delete', ctrl.bulkDeleteAttendance);
router.get('/attendance/statistics', ctrl.getAttendanceStatistics);
router.get('/attendance/locks', ext.getAttendanceLocks);
router.post('/attendance/lock', ext.lockAttendance);
router.post('/attendance/unlock', ext.unlockAttendance);
router.get('/attendance/leave', ext.getLeaveRequests);
router.post('/attendance/leave', ext.createLeaveRequest);
router.put('/attendance/leave/:type/:id/status', ext.updateLeaveStatus);
router.get('/attendance/leave-balance', ext.getLeaveBalance);
router.get('/attendance/corrections', ext.getAttendanceCorrections);
router.post('/attendance/corrections', ext.requestAttendanceCorrection);
router.put('/attendance/corrections/:id/status', ext.updateCorrectionStatus);
router.get('/attendance/notifications', ext.getAttendanceNotifications);
router.post('/attendance/notifications', ext.sendAttendanceNotification);
router.get('/attendance/reports', ext.getAttendanceReportsByType);

// ============================================
// 8. TIMETABLE
// ============================================
router.get('/timetable', ctrl.getTimetable);
router.get('/timetable/conflicts', ext.getTimetableConflicts);
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
router.post('/exams/:examId/hall-tickets/generate', ext.generateHallTickets);
router.get('/exams/:examId/hall-tickets', ext.getHallTickets);

// ============================================
// 9b. ADMISSIONS
// ============================================
router.get('/admissions/dashboard', ext.getAdmissionsDashboard);
router.get('/admissions/enquiries', ext.listEnquiries);
router.post('/admissions/enquiries', ext.createEnquiry);
router.get('/admissions/enquiries/:id', ext.getEnquiry);
router.put('/admissions/enquiries/:id', ext.updateEnquiry);
router.get('/admissions/applications', ext.listApplications);
router.get('/admissions/applications/:id', ext.getApplication);
router.put('/admissions/applications/:id/status', ext.updateApplicationStatus);
router.post('/admissions/enquiries/:id/convert', ext.convertEnquiryToApplication);
router.post('/admissions/enroll', ext.enrollStudent);
router.get('/admissions/seat-capacity', ext.getSeatCapacity);
router.put('/admissions/seat-capacity', ext.updateSeatCapacity);
router.get('/admissions/applications/:id/documents', ext.getApplicationDocuments);
router.post('/admissions/applications/:id/documents', ext.uploadApplicationDocument);
router.put('/admissions/applications/:id/documents/:documentId/verify', ext.verifyApplicationDocument);
router.get('/admissions/applications/:id/academic-history', ext.getApplicationAcademicHistory);
router.put('/admissions/applications/:id/academic-history', ext.updateApplicationAcademicHistory);
router.post('/admissions/applications/:id/entrance-test', ext.scheduleEntranceTest);
router.post('/admissions/applications/:id/entrance-test/result', ext.recordEntranceTestResult);
router.post('/admissions/applications/:id/interview', ext.scheduleInterview);
router.post('/admissions/applications/:id/interview/result', ext.recordInterviewResult);
router.put('/admissions/applications/:id/review', ext.updateApplicationReview);
router.get('/admissions/settings', ext.getAdmissionSettings);
router.put('/admissions/settings', ext.updateAdmissionSettings);
router.post('/admissions/forms/publish', ext.publishAdmissionForms);
router.get('/admissions/reports', ext.getAdmissionsReports);

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
router.put('/communication/notices/:noticeId/read', ext.markNoticeAsRead);
router.get('/communication/templates', ext.getTemplates);
router.post('/communication/templates', ext.createTemplate);
router.put('/communication/templates/:id', ext.updateTemplate);
router.delete('/communication/templates/:id', ext.deleteTemplate);
router.post('/communication/sms', ext.sendSms);
router.post('/communication/email', ext.sendEmail);
router.get('/communication/history', ext.getCommunicationHistory);
router.get('/communication/sms/balance', ext.getSmsBalance);

// ============================================
// 14. REPORTS
// ============================================
router.post('/reports/generate', ext.generateReport);
router.get('/reports/:reportId/status', ext.getReportStatus);
router.get('/reports/:reportId/download', ext.downloadReport);
router.get('/reports/types', ext.getReportTypes);
router.get('/reports/templates', ext.getReportTemplates);
router.post('/reports/templates', ext.createReportTemplate);
router.post('/reports/schedule', ext.scheduleReport);
router.get('/reports/scheduled', ext.getScheduledReports);
router.put('/reports/scheduled/:id/cancel', ext.cancelScheduledReport);

// ============================================
// 13. SETTINGS
// ============================================
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

module.exports = router;
