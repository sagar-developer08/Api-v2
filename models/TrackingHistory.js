const mongoose = require('mongoose');

const trackingHistorySchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true },
  trackingId: { type: mongoose.Schema.Types.ObjectId, ref: 'RouteTracking' },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now }
}, { timestamps: true });

trackingHistorySchema.index({ schoolId: 1, routeId: 1, recordedAt: -1 });
module.exports = mongoose.model('TrackingHistory', trackingHistorySchema);
