const mongoose = require('mongoose');

const busAttendanceSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute' },
  date: { type: Date, required: true },
  tripType: { type: String, enum: ['pickup', 'drop'], required: true },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

busAttendanceSchema.index({ schoolId: 1, date: 1 });
busAttendanceSchema.index({ schoolId: 1, studentId: 1, date: 1 });
module.exports = mongoose.model('BusAttendance', busAttendanceSchema);
