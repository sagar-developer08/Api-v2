const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  address: { type: String, trim: true },
  order: { type: Number, default: 0 },
  pickupTime: { type: String, trim: true },
  dropTime: { type: String, trim: true }
}, { _id: true });

const routeSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportDriver' },
  stops: [stopSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

routeSchema.index({ schoolId: 1 });
module.exports = mongoose.model('TransportRoute', routeSchema);
