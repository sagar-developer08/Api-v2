const mongoose = require('mongoose');

const platformAuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel' },
  userModel: { type: String, enum: ['SuperAdmin', 'Admin'], default: 'SuperAdmin' },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  action: { type: String, required: true, trim: true },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String }
}, { timestamps: true });

platformAuditLogSchema.index({ tenantId: 1, createdAt: -1 });
platformAuditLogSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model('PlatformAuditLog', platformAuditLogSchema);
