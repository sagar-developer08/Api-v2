const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['email', 'sms', 'push', 'social'], default: 'email' },
  subject: { type: String, trim: true },
  content: { type: String, trim: true },
  status: { type: String, enum: ['draft', 'scheduled', 'sent'], default: 'draft' },
  scheduledDate: { type: Date },
  sentAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
