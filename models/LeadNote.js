const mongoose = require('mongoose');

const leadNoteSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  note: { type: String, required: true, trim: true }
}, { timestamps: true });

leadNoteSchema.index({ leadId: 1 });
module.exports = mongoose.model('LeadNote', leadNoteSchema);
