const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  licenseNumber: { type: String, trim: true },
  licenseExpiry: { type: Date },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' }
}, { timestamps: true });

driverSchema.index({ schoolId: 1 });
module.exports = mongoose.model('TransportDriver', driverSchema);
