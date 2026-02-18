const mongoose = require('mongoose');

const classAuditLogSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  action: { type: String, required: true, trim: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  details: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

classAuditLogSchema.index({ schoolId: 1, classId: 1 });
module.exports = mongoose.model('ClassAuditLog', classAuditLogSchema);
