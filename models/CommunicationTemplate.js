const mongoose = require('mongoose');

const communicationTemplateSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['sms', 'email', 'notification'], default: 'email' },
  subject: { type: String, trim: true },
  body: { type: String, trim: true },
  variables: [{ type: String }]
}, { timestamps: true });

communicationTemplateSchema.index({ schoolId: 1 });
module.exports = mongoose.model('CommunicationTemplate', communicationTemplateSchema);
