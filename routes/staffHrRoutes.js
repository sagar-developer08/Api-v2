const express = require('express');
const router = express.Router();
const { protect, requireApprovedSchool } = require('../middleware/auth');
const ctrl = require('../controllers/staffHrController');

router.use(protect);
router.use(requireApprovedSchool);

router.get('/departments', ctrl.listDepartments);
router.post('/departments', ctrl.createDepartment);
router.get('/roles', ctrl.listRoles);
router.post('/roles', ctrl.createRole);

router.post('/attendance', ctrl.markStaffAttendance);
router.get('/attendance', ctrl.getStaffAttendance);
router.get('/attendance/statistics', ctrl.getStaffAttendanceStatistics);
router.get('/attendance/reports', ctrl.getAttendanceReports);

router.post('/leave', ctrl.requestStaffLeave);
router.get('/leave', ctrl.getStaffLeaveRequests);
router.put('/leave/:id/status', ctrl.updateStaffLeaveStatus);
router.get('/leave-balance', ctrl.getStaffLeaveBalance);

router.get('/payroll', ctrl.getStaffPayroll);
router.post('/payroll/generate', ctrl.generateStaffPayroll);
router.get('/payroll/:id', ctrl.getStaffPayrollById);
router.put('/payroll/:id', ctrl.updateStaffPayroll);

router.get('/settings', ctrl.getStaffSettings);
router.put('/settings', ctrl.updateStaffSettings);

router.post('/bulk-import', ctrl.bulkImportStaff);

router.get('/', ctrl.listStaff);
router.get('/:id', ctrl.getStaff);
router.post('/', ctrl.createStaff);
router.put('/:id', ctrl.updateStaff);
router.delete('/:id', ctrl.deleteStaff);

router.get('/:id/documents', ctrl.getStaffDocuments);
router.post('/:id/documents', ctrl.uploadStaffDocument);

router.get('/:id/qualifications', ctrl.getStaffQualifications);
router.post('/:id/qualifications', ctrl.addStaffQualification);

router.get('/:id/reviews', ctrl.getPerformanceReviews);
router.get('/:id/appraisals', ctrl.getStaffAppraisals);

router.get('/advances', ctrl.getStaffAdvances);
router.post('/advances', ctrl.createStaffAdvance);
router.get('/loans', ctrl.getStaffLoans);
router.post('/loans', ctrl.createStaffLoan);
router.get('/reimbursements', ctrl.getStaffReimbursements);
router.post('/reimbursements', ctrl.createStaffReimbursement);
router.get('/performance/reviews', ctrl.getPerformanceReviews);
router.post('/performance/reviews', ctrl.createPerformanceReview);
router.get('/training/sessions', ctrl.listTrainingSessions);
router.post('/training/sessions', ctrl.createTrainingSession);
router.get('/training/sessions/:sessionId/records', ctrl.getTrainingRecords);
router.post('/training/attendance', ctrl.markTrainingAttendance);

router.get('/', ctrl.listStaff);
router.get('/:id', ctrl.getStaff);
router.post('/', ctrl.createStaff);
router.put('/:id', ctrl.updateStaff);
router.delete('/:id', ctrl.deleteStaff);
router.get('/:id/documents', ctrl.getStaffDocuments);
router.post('/:id/documents', ctrl.uploadStaffDocument);
router.get('/:id/qualifications', ctrl.getStaffQualifications);
router.post('/:id/qualifications', ctrl.addStaffQualification);
router.get('/:id/reviews', ctrl.getPerformanceReviews);
router.get('/:id/appraisals', ctrl.getStaffAppraisals);

module.exports = router;
