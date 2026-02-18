const Vehicle = require('../models/Vehicle');
const TransportRoute = require('../models/TransportRoute');
const TransportDriver = require('../models/TransportDriver');
const StudentTransport = require('../models/StudentTransport');
const VehicleMaintenance = require('../models/VehicleMaintenance');
const TransportSettings = require('../models/TransportSettings');
const TransportDriverDocument = require('../models/TransportDriverDocument');
const BusAttendance = require('../models/BusAttendance');
const RouteTracking = require('../models/RouteTracking');
const TrackingHistory = require('../models/TrackingHistory');
const Student = require('../models/Student');
const mongoose = require('mongoose');

const getSchoolId = (req) => req.admin.schoolId._id || req.admin.schoolId;

exports.getDashboard = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const [vehicles, routes, drivers, students] = await Promise.all([
      Vehicle.countDocuments({ schoolId }),
      TransportRoute.countDocuments({ schoolId, isActive: true }),
      TransportDriver.countDocuments({ schoolId, status: 'active' }),
      StudentTransport.countDocuments({ schoolId, status: 'active' })
    ]);
    res.json({
      success: true,
      data: { totalVehicles: vehicles, totalRoutes: routes, totalDrivers: drivers, totalStudents: students, platformHealth: 'healthy' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard', error: error.message });
  }
};

exports.listVehicles = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await Vehicle.find({ schoolId }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing vehicles', error: error.message });
  }
};

exports.getVehicle = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const vehicle = await Vehicle.findOne({ _id: req.params.id, schoolId }).lean();
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching vehicle', error: error.message });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const vehicle = await Vehicle.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating vehicle', error: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const vehicle = await Vehicle.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating vehicle', error: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting vehicle', error: error.message });
  }
};

exports.listRoutes = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await TransportRoute.find({ schoolId }).populate('vehicleId driverId').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing routes', error: error.message });
  }
};

exports.getRoute = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const route = await TransportRoute.findOne({ _id: req.params.id, schoolId }).populate('vehicleId driverId').lean();
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching route', error: error.message });
  }
};

exports.createRoute = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const route = await TransportRoute.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating route', error: error.message });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const route = await TransportRoute.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating route', error: error.message });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const route = await TransportRoute.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, message: 'Route deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting route', error: error.message });
  }
};

exports.listDrivers = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await TransportDriver.find({ schoolId }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing drivers', error: error.message });
  }
};

exports.getDriver = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const driver = await TransportDriver.findOne({ _id: req.params.id, schoolId }).lean();
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching driver', error: error.message });
  }
};

exports.createDriver = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const driver = await TransportDriver.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating driver', error: error.message });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const driver = await TransportDriver.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating driver', error: error.message });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const driver = await TransportDriver.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, message: 'Driver deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting driver', error: error.message });
  }
};

exports.getVehicleMaintenance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const vehicle = await Vehicle.findOne({ _id: req.params.id, schoolId });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    const data = await VehicleMaintenance.find({ vehicleId: req.params.id }).sort({ date: -1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching maintenance', error: error.message });
  }
};

exports.addVehicleMaintenance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const vehicle = await Vehicle.findOne({ _id: req.params.id, schoolId });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    const maintenance = await VehicleMaintenance.create({
      schoolId,
      vehicleId: req.params.id,
      ...req.body
    });
    res.status(201).json({ success: true, data: maintenance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding maintenance', error: error.message });
  }
};

exports.getRouteStops = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const route = await TransportRoute.findOne({ _id: req.params.id, schoolId }).select('stops').lean();
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route.stops || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stops', error: error.message });
  }
};

exports.addRouteStop = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const route = await TransportRoute.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { $push: { stops: req.body } },
      { new: true }
    );
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.status(201).json({ success: true, data: route.stops });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding stop', error: error.message });
  }
};

exports.updateRouteStop = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const route = await TransportRoute.findOne({ _id: req.params.id, schoolId });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    const stopId = new mongoose.Types.ObjectId(req.params.stopId);
    const idx = route.stops.findIndex(s => s._id && s._id.toString() === stopId.toString());
    if (idx === -1) return res.status(404).json({ success: false, message: 'Stop not found' });
    Object.assign(route.stops[idx], req.body);
    await route.save();
    res.json({ success: true, data: route.stops });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating stop', error: error.message });
  }
};

exports.deleteRouteStop = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const route = await TransportRoute.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { $pull: { stops: { _id: new mongoose.Types.ObjectId(req.params.stopId) } } },
      { new: true }
    );
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route.stops });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting stop', error: error.message });
  }
};

exports.listStudentMapping = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.routeId) filter.routeId = req.query.routeId;
    if (req.query.studentId) filter.studentId = req.query.studentId;
    const data = await StudentTransport.find(filter).populate('studentId', 'firstName lastName admissionNumber').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing student mapping', error: error.message });
  }
};

exports.assignStudentToRoute = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { studentId, routeId, stopId, pickupTime, dropTime } = req.body;
    const existing = await StudentTransport.findOne({ schoolId, studentId });
    if (existing) {
      await StudentTransport.updateOne(
        { _id: existing._id },
        { $set: { routeId, stopId, pickupPoint: stopId, dropPoint: stopId, pickupTime, dropTime, status: 'active' } }
      );
      const updated = await StudentTransport.findById(existing._id).lean();
      return res.status(200).json({ success: true, data: updated });
    }
    const route = await TransportRoute.findById(routeId).select('name code vehicleId').populate('vehicleId driverId');
    const mapping = await StudentTransport.create({
      schoolId,
      studentId,
      routeId: routeId,
      routeName: route?.name,
      routeCode: route?.code,
      vehicleId: route?.vehicleId?._id?.toString(),
      vehicleNumber: route?.vehicleId?.vehicleNumber,
      pickupTime: pickupTime || '',
      dropTime: dropTime || '',
      status: 'active'
    });
    res.status(201).json({ success: true, data: mapping });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error assigning student', error: error.message });
  }
};

exports.getStudentRoute = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const mapping = await StudentTransport.findOne({ schoolId, studentId: req.params.studentId }).lean();
    if (!mapping) return res.status(404).json({ success: false, message: 'No transport assigned' });
    res.json({ success: true, data: mapping });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching student route', error: error.message });
  }
};

exports.getTransportSettings = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    let settings = await TransportSettings.findOne({ schoolId }).lean();
    if (!settings) settings = await TransportSettings.create({ schoolId }).then(s => s.toObject());
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
  }
};

exports.updateTransportSettings = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const settings = await TransportSettings.findOneAndUpdate({ schoolId }, { $set: req.body }, { new: true, upsert: true }).lean();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating settings', error: error.message });
  }
};

// ---------- Driver Documents ----------
exports.getDriverDocuments = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await TransportDriverDocument.find({ schoolId, driverId: req.params.id }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching documents', error: error.message });
  }
};

exports.uploadDriverDocument = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const doc = await TransportDriverDocument.create({
      ...req.body,
      schoolId,
      driverId: req.params.id,
      fileUrl: req.body.fileUrl || '/uploads/placeholder.pdf'
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading document', error: error.message });
  }
};

// ---------- Driver Assignments ----------
exports.getDriverAssignments = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const routes = await TransportRoute.find({ schoolId, driverId: req.params.id }).populate('vehicleId').lean();
    res.json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching assignments', error: error.message });
  }
};

// ---------- Student Mapping Update/Remove/Bulk ----------
exports.updateStudentMapping = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const mapping = await StudentTransport.findOneAndUpdate(
      { schoolId, studentId: req.params.studentId },
      { $set: req.body },
      { new: true }
    );
    if (!mapping) return res.status(404).json({ success: false, message: 'Mapping not found' });
    res.json({ success: true, data: mapping });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating mapping', error: error.message });
  }
};

exports.removeStudentMapping = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const mapping = await StudentTransport.findOneAndUpdate(
      { schoolId, studentId: req.params.studentId },
      { status: 'inactive' },
      { new: true }
    );
    if (!mapping) return res.status(404).json({ success: false, message: 'Mapping not found' });
    res.json({ success: true, message: 'Mapping removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing mapping', error: error.message });
  }
};

exports.bulkAssignStudents = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { studentIds, routeId, pickupTime, dropTime } = req.body;
    if (!Array.isArray(studentIds) || !routeId) return res.status(400).json({ success: false, message: 'studentIds and routeId required' });
    const route = await TransportRoute.findById(routeId).select('name code vehicleId').populate('vehicleId');
    const created = [];
    for (const studentId of studentIds) {
      const existing = await StudentTransport.findOne({ schoolId, studentId });
      const data = existing
        ? await StudentTransport.findOneAndUpdate(
            { _id: existing._id },
            { routeId, routeName: route?.name, routeCode: route?.code, vehicleId: route?.vehicleId?._id?.toString(), pickupTime, dropTime, status: 'active' },
            { new: true }
          )
        : await StudentTransport.create({
            schoolId,
            studentId,
            routeId,
            routeName: route?.name,
            routeCode: route?.code,
            vehicleId: route?.vehicleId?._id?.toString(),
            pickupTime: pickupTime || '',
            dropTime: dropTime || '',
            status: 'active'
          });
      created.push(data);
    }
    res.status(201).json({ success: true, data: created, message: `${created.length} students assigned` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error bulk assigning', error: error.message });
  }
};

// ---------- Bus Attendance ----------
exports.markBusAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { studentId, routeId, date, tripType, status } = req.body;
    const att = await BusAttendance.findOneAndUpdate(
      { schoolId, studentId, date: new Date(date), tripType },
      { routeId, status: status || 'present', markedBy: req.admin._id },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: att });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking attendance', error: error.message });
  }
};

exports.getBusAttendance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { date, routeId, tripType } = req.query;
    const filter = { schoolId };
    if (date) filter.date = new Date(date);
    if (routeId) filter.routeId = routeId;
    if (tripType) filter.tripType = tripType;
    const data = await BusAttendance.find(filter).populate('studentId', 'firstName lastName').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
  }
};

exports.getBusAttendanceStatistics = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { date, routeId } = req.query;
    const filter = { schoolId };
    if (date) filter.date = new Date(date);
    if (routeId) filter.routeId = routeId;
    const total = await BusAttendance.countDocuments(filter);
    const present = await BusAttendance.countDocuments({ ...filter, status: 'present' });
    res.json({ success: true, data: { total, present, absent: total - present } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
  }
};

exports.getBusAttendanceReports = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { fromDate, toDate, routeId } = req.query;
    const filter = { schoolId };
    if (routeId) filter.routeId = routeId;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    const data = await BusAttendance.find(filter).populate('studentId routeId').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
};

// ---------- Tracking ----------
exports.startTracking = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { routeId, vehicleId, driverId } = req.body;
    const tracking = await RouteTracking.findOneAndUpdate(
      { schoolId, routeId, status: { $in: ['idle'] } },
      { vehicleId, driverId, status: 'active', startedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error starting tracking', error: error.message });
  }
};

exports.updateTrackingLocation = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { routeId, lat, lng } = req.body;
    const tracking = await RouteTracking.findOneAndUpdate(
      { schoolId, routeId, status: 'active' },
      { currentLocation: { lat, lng, updatedAt: new Date() } },
      { new: true }
    );
    if (tracking) await TrackingHistory.create({ schoolId, routeId, trackingId: tracking._id, lat, lng });
    res.json({ success: true, data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating location', error: error.message });
  }
};

exports.getTrackingLocation = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { routeId } = req.query;
    const tracking = await RouteTracking.findOne({ schoolId, routeId, status: 'active' }).lean();
    res.json({ success: true, data: tracking?.currentLocation || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching location', error: error.message });
  }
};

exports.endTracking = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { routeId } = req.body;
    const tracking = await RouteTracking.findOneAndUpdate(
      { schoolId, routeId, status: 'active' },
      { status: 'ended', endedAt: new Date() },
      { new: true }
    );
    if (!tracking) return res.status(404).json({ success: false, message: 'No active tracking' });
    res.json({ success: true, data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error ending tracking', error: error.message });
  }
};

exports.getTrackingHistory = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { routeId, fromDate, toDate } = req.query;
    const filter = { schoolId };
    if (routeId) filter.routeId = routeId;
    if (fromDate || toDate) {
      filter.recordedAt = {};
      if (fromDate) filter.recordedAt.$gte = new Date(fromDate);
      if (toDate) filter.recordedAt.$lte = new Date(toDate);
    }
    const data = await TrackingHistory.find(filter).sort({ recordedAt: -1 }).limit(500).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching history', error: error.message });
  }
};

exports.getRouteTrackingStatus = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { routeId } = req.query;
    const filter = { schoolId };
    if (routeId) filter.routeId = routeId;
    const data = await RouteTracking.find(filter).populate('routeId vehicleId driverId').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching status', error: error.message });
  }
};
