const mongoose = require('mongoose');

const feeRuleSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['discount', 'waiver', 'installment', 'late_fee'], default: 'discount' },
  conditions: { type: mongoose.Schema.Types.Mixed },
  value: { type: Number, default: 0 },
  valueType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

feeRuleSchema.index({ schoolId: 1 });
module.exports = mongoose.model('FeeRule', feeRuleSchema);
