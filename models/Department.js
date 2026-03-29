const mongoose = require('mongoose');

// branchId optional: null = school-wide, set = branch-specific (per our multi-branch design)
const departmentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: null },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

departmentSchema.index({ schoolId: 1 });
departmentSchema.index({ schoolId: 1, branchId: 1 });
module.exports = mongoose.model('Department', departmentSchema);
