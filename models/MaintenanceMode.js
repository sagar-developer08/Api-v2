const mongoose = require('mongoose');

const maintenanceModeSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  enabled: { type: Boolean, default: false },
  message: { type: String, trim: true }
}, { timestamps: true });

maintenanceModeSchema.index({ tenantId: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('MaintenanceMode', maintenanceModeSchema);
