const express = require('express');
const router = express.Router();
const { protect, requireApprovedSchool } = require('../middleware/auth');
const attendanceApi = require('../controllers/adminAttendanceController');

router.use(protect, requireApprovedSchool);

router.get('/:schoolId/attendance/summary', attendanceApi.getSummary);
router.get('/:schoolId/attendance/matrix', attendanceApi.getMatrix);
router.get('/:schoolId/attendance/day', attendanceApi.getDay);
router.put('/:schoolId/attendance/day', attendanceApi.putDay);
router.get('/:schoolId/attendance/staff-day', attendanceApi.getStaffDay);
router.put('/:schoolId/attendance/staff-day', attendanceApi.putStaffDay);
router.get('/:schoolId/attendance/reports/monthly', attendanceApi.getMonthlyReport);

module.exports = router;
