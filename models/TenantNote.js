const mongoose = require('mongoose');

const tenantNoteSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  note: { type: String, required: true, trim: true },
  type: { type: String, trim: true, default: 'general' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' }
}, { timestamps: true });

tenantNoteSchema.index({ tenantId: 1 });
module.exports = mongoose.model('TenantNote', tenantNoteSchema);
