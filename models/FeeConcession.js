const mongoose = require('mongoose');

const feeConcessionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeStructureId: { type: String, trim: true },
  type: { type: String, enum: ['scholarship', 'discount', 'waiver'], default: 'discount' },
  amount: { type: Number, default: 0 },
  percentage: { type: Number },
  reason: { type: String, trim: true },
  validFrom: { type: Date },
  validTo: { type: Date },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

feeConcessionSchema.index({ schoolId: 1, studentId: 1 });
module.exports = mongoose.model('FeeConcession', feeConcessionSchema);
