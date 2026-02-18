const mongoose = require('mongoose');

const vehicleMaintenanceSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  type: { type: String, enum: ['service', 'repair', 'inspection'], default: 'service' },
  date: { type: Date, required: true },
  description: { type: String, trim: true },
  cost: { type: Number, default: 0 },
  nextServiceDate: { type: Date }
}, { timestamps: true });

vehicleMaintenanceSchema.index({ vehicleId: 1 });
module.exports = mongoose.model('VehicleMaintenance', vehicleMaintenanceSchema);
