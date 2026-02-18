const mongoose = require('mongoose');

const lmsAutomationRuleSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  trigger: { type: String, enum: ['enrollment', 'completion', 'inactivity'], required: true },
  action: { type: String, enum: ['email', 'notification', 'certificate'], required: true },
  config: { type: mongoose.Schema.Types.Mixed },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

lmsAutomationRuleSchema.index({ schoolId: 1 });
module.exports = mongoose.model('LmsAutomationRule', lmsAutomationRuleSchema);
