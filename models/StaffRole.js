const mongoose = require('mongoose');

// branchId optional: null = school-wide, set = branch-specific (per our multi-branch design)
const staffRoleSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  name: { type: String, required: true, trim: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }
}, { timestamps: true });

staffRoleSchema.index({ schoolId: 1 });
staffRoleSchema.index({ schoolId: 1, branchId: 1 });
module.exports = mongoose.model('StaffRole', staffRoleSchema);
