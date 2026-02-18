const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  vehicleNumber: { type: String, required: true, trim: true },
  type: { type: String, enum: ['bus', 'van', 'car'], default: 'bus' },
  make: { type: String, trim: true },
  model: { type: String, trim: true },
  capacity: { type: Number, default: 0 },
  registrationNumber: { type: String, trim: true },
  status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' }
}, { timestamps: true });

vehicleSchema.index({ schoolId: 1 });
module.exports = mongoose.model('Vehicle', vehicleSchema);
