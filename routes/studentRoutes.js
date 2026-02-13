const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const controller = require('../controllers/studentController');
const validators = require('../validators/studentValidators');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Apply auth middleware to all routes
router.use(protect);

// ============================================
// BULK OPERATIONS (Must be before /:id routes)
// ============================================
router.post('/bulk-import', upload.single('file'), controller.bulkImportStudents);
router.get('/export', controller.exportStudents);

// STATISTICS (Must be before /:id routes)
router.get('/statistics', controller.getStudentStatistics);

// METRICS / DASHBOARD (Must be before /:id routes)
router.get('/metrics', controller.getStudentMetrics);

// ============================================
// STUDENT CRUD
// ============================================
router.route('/')
    .get(validators.validateStudentListQuery, controller.getAllStudents)
    .post(validators.validateCreateStudent, controller.createStudent);

router.route('/:id')
    .get(validators.validateIdParam, controller.getStudentById)
    .put(validators.validateIdParam, validators.validateUpdateStudent, controller.updateStudent)
    .patch(validators.validateIdParam, validators.validateUpdateStudent, controller.updateStudent)
    .delete(validators.validateIdParam, controller.deleteStudent);

// ============================================
// OVERVIEW
// ============================================
router.get('/:id/overview', validators.validateIdParam, controller.getStudentOverview);
router.get('/:id/recent-marks', validators.validateIdParam, controller.getRecentMarks);

// ============================================
// GUARDIANS
// ============================================
router.route('/:id/guardians')
    .get(validators.validateIdParam, controller.getStudentGuardians)
    .post(validators.validateIdParam, validators.validateAddGuardian, controller.addGuardian);

router.route('/:id/guardians/:guardianId')
    .put(validators.validateIdParam, validators.validateGuardianIdParam, validators.validateUpdateGuardian, controller.updateGuardian)
    .patch(validators.validateIdParam, validators.validateGuardianIdParam, validators.validateUpdateGuardian, controller.updateGuardian)
    .delete(validators.validateIdParam, validators.validateGuardianIdParam, controller.removeGuardian);

router.put('/:id/guardians/:guardianId/primary', validators.validateIdParam, validators.validateGuardianIdParam, controller.setPrimaryGuardian);
router.put('/:id/guardians/:guardianId/emergency', validators.validateIdParam, validators.validateGuardianIdParam, controller.setEmergencyContact);

// ============================================
// ACADEMIC INFORMATION
// ============================================
router.get('/:id/academic', validators.validateIdParam, controller.getStudentAcademicDetails);

router.route('/:id/academic-history')
    .get(validators.validateIdParam, controller.getStudentAcademicHistory)
    .post(validators.validateIdParam, validators.validateAddAcademicRecord, controller.addAcademicRecord);

router.route('/:id/academic-history/:recordId')
    .put(validators.validateIdParam, controller.updateAcademicRecord)
    .patch(validators.validateIdParam, controller.updateAcademicRecord)
    .delete(validators.validateIdParam, controller.deleteAcademicRecord);

// ============================================
// ATTENDANCE
// ============================================
router.get('/:id/attendance', validators.validateIdParam, validators.validateAttendanceQuery, controller.getStudentAttendance);
router.get('/:id/attendance/summary', validators.validateIdParam, controller.getStudentAttendanceSummary);

router.route('/:id/attendance/:attendanceId')
    .put(validators.validateIdParam, controller.updateStudentAttendance)
    .patch(validators.validateIdParam, controller.updateStudentAttendance);

// ============================================
// FEES
// ============================================
router.route('/:id/fees')
    .get(validators.validateIdParam, controller.getStudentFees)
    .post(validators.validateIdParam, controller.assignFeeToStudent);

router.get('/:id/fees/summary', validators.validateIdParam, controller.getStudentFeesSummary);
router.post('/:id/fees/:feeId/payments', validators.validateIdParam, validators.validateFeePayment, controller.recordFeePayment);

// ============================================
// DOCUMENTS
// ============================================
router.route('/:id/documents')
    .get(validators.validateIdParam, controller.getStudentDocuments)
    .post(validators.validateIdParam, upload.single('file'), validators.validateUploadDocument, controller.uploadStudentDocument);

router.delete('/:id/documents/:documentId', validators.validateIdParam, controller.deleteStudentDocument);
router.put('/:id/documents/:documentId/verify', validators.validateIdParam, controller.verifyStudentDocument);

// ============================================
// TRANSPORT
// ============================================
router.route('/:id/transport')
    .get(validators.validateIdParam, controller.getStudentTransport)
    .post(validators.validateIdParam, validators.validateAssignTransport, controller.assignTransport)
    .put(validators.validateIdParam, controller.updateStudentTransport)
    .patch(validators.validateIdParam, controller.updateStudentTransport)
    .delete(validators.validateIdParam, controller.removeTransport);

// ============================================
// EXAMS & PERFORMANCE
// ============================================
router.get('/:id/exams', validators.validateIdParam, controller.getStudentExams);
router.get('/:id/performance', validators.validateIdParam, controller.getStudentPerformance);

// ============================================
// COMMUNICATION
// ============================================
router.route('/:id/communication')
    .get(validators.validateIdParam, controller.getCommunicationHistory)
    .post(validators.validateIdParam, validators.validateSendCommunication, controller.sendCommunication);

// ============================================
// TRANSFERS & PROMOTIONS
// ============================================
router.post('/:id/transfer', validators.validateIdParam, validators.validateTransferStudent, controller.transferStudent);
router.post('/:id/promote', validators.validateIdParam, validators.validateTransferStudent, controller.promoteStudent);
router.get('/:id/transfer-history', validators.validateIdParam, controller.getTransferHistory);

// ============================================
// REPORTS
// ============================================
router.post('/:id/reports/generate', validators.validateIdParam, controller.generateStudentReport);
router.get('/:id/reports/:reportId', validators.validateIdParam, controller.getReportStatus);

module.exports = router;
