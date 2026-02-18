const mongoose = require('mongoose');

const staffRoleSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }
}, { timestamps: true });

staffRoleSchema.index({ schoolId: 1 });
module.exports = mongoose.model('StaffRole', staffRoleSchema);
