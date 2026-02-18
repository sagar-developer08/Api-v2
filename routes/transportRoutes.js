const express = require('express');
const router = express.Router();
const { protect, requireApprovedSchool } = require('../middleware/auth');
const ctrl = require('../controllers/transportController');

router.use(protect);
router.use(requireApprovedSchool);

router.get('/dashboard', ctrl.getDashboard);

router.get('/vehicles', ctrl.listVehicles);
router.get('/vehicles/:id', ctrl.getVehicle);
router.get('/vehicles/:id/maintenance', ctrl.getVehicleMaintenance);
router.post('/vehicles/:id/maintenance', ctrl.addVehicleMaintenance);
router.post('/vehicles', ctrl.createVehicle);
router.put('/vehicles/:id', ctrl.updateVehicle);
router.delete('/vehicles/:id', ctrl.deleteVehicle);

router.get('/routes', ctrl.listRoutes);
router.get('/routes/:id', ctrl.getRoute);
router.get('/routes/:id/stops', ctrl.getRouteStops);
router.post('/routes/:id/stops', ctrl.addRouteStop);
router.put('/routes/:id/stops/:stopId', ctrl.updateRouteStop);
router.delete('/routes/:id/stops/:stopId', ctrl.deleteRouteStop);
router.post('/routes', ctrl.createRoute);
router.put('/routes/:id', ctrl.updateRoute);
router.delete('/routes/:id', ctrl.deleteRoute);

router.get('/student-mapping', ctrl.listStudentMapping);
router.post('/student-mapping', ctrl.assignStudentToRoute);
router.get('/students/:studentId/route', ctrl.getStudentRoute);

router.get('/drivers', ctrl.listDrivers);
router.get('/drivers/:id', ctrl.getDriver);
router.get('/drivers/:id/documents', ctrl.getDriverDocuments);
router.post('/drivers/:id/documents', ctrl.uploadDriverDocument);
router.get('/drivers/:id/assignments', ctrl.getDriverAssignments);
router.post('/drivers', ctrl.createDriver);
router.put('/drivers/:id', ctrl.updateDriver);
router.delete('/drivers/:id', ctrl.deleteDriver);

router.put('/student-mapping/:studentId', ctrl.updateStudentMapping);
router.delete('/student-mapping/:studentId', ctrl.removeStudentMapping);
router.post('/student-mapping/bulk', ctrl.bulkAssignStudents);

router.post('/bus-attendance', ctrl.markBusAttendance);
router.get('/bus-attendance', ctrl.getBusAttendance);
router.get('/bus-attendance/statistics', ctrl.getBusAttendanceStatistics);
router.get('/bus-attendance/reports', ctrl.getBusAttendanceReports);

router.post('/tracking/start', ctrl.startTracking);
router.post('/tracking/update-location', ctrl.updateTrackingLocation);
router.get('/tracking/location', ctrl.getTrackingLocation);
router.post('/tracking/end', ctrl.endTracking);
router.get('/tracking/history', ctrl.getTrackingHistory);
router.get('/tracking/status', ctrl.getRouteTrackingStatus);

router.get('/settings', ctrl.getTransportSettings);
router.put('/settings', ctrl.updateTransportSettings);

module.exports = router;
