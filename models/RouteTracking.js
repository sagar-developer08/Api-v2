const mongoose = require('mongoose');

const routeTrackingSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportDriver' },
  status: { type: String, enum: ['idle', 'active', 'ended'], default: 'idle' },
  startedAt: { type: Date },
  endedAt: { type: Date },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  }
}, { timestamps: true });

routeTrackingSchema.index({ schoolId: 1, routeId: 1 });
module.exports = mongoose.model('RouteTracking', routeTrackingSchema);
