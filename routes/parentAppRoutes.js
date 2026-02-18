const express = require('express');
const router = express.Router();
const { protectParent } = require('../middleware/auth');
const ctrl = require('../controllers/parentAppController');
const ext = require('../controllers/adminExtendedController');

router.use(protectParent);

router.get('/dashboard', ctrl.getDashboard);
router.get('/children', ctrl.getChildren);
router.get('/children/:childId', ctrl.getChildDetails);
router.get('/children/:childId/attendance', ctrl.getChildAttendance);
router.get('/children/:childId/grades', ctrl.getChildGrades);
router.get('/children/:childId/exams', ctrl.getChildExams);
router.get('/children/:childId/assignments', ctrl.getChildAssignments);
router.get('/children/:childId/timetable', ctrl.getChildTimetable);
router.get('/children/:childId/fees', ctrl.getChildFees);
router.post('/children/:childId/fees/pay', ctrl.payChildFee);
router.get('/children/:childId/documents', ctrl.getChildDocuments);
router.get('/children/:childId/transport/attendance', ctrl.getChildTransportAttendance);
router.get('/children/:childId/transport', ctrl.getChildTransport);
router.get('/children/:childId/learning-resources', ctrl.getChildLearningResources);
router.get('/children/:childId/syllabus', ctrl.getChildSyllabus);
router.get('/children/:childId/leave', ctrl.getChildLeaveRequests);
router.post('/children/:childId/leave', ctrl.requestLeaveForChild);

router.get('/notices', ctrl.getNotices);
router.put('/notices/:noticeId/read', ext.markNoticeAsRead);
router.get('/messages', ctrl.getMessages);
router.post('/messages', ctrl.sendMessage);

router.get('/school-info', ctrl.getSchoolInfo);
router.get('/school-info/policies', ctrl.getSchoolPolicies);
router.get('/school-info/contact', ctrl.getSchoolContact);
router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.post('/change-password', ctrl.changePassword);

router.get('/meetings', ctrl.getMeetings);
router.post('/meetings', ctrl.requestMeeting);
router.get('/transport/routes/:routeId', ctrl.getTransportRoute);
router.get('/documents/:documentId/download', ctrl.downloadDocument);

module.exports = router;
