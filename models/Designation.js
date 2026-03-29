const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    name: { type: String, required: true, trim: true },
    level: { type: String, trim: true, default: null },
    description: { type: String, trim: true, default: null },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: true }
);

designationSchema.index({ schoolId: 1, departmentId: 1 });
designationSchema.index({ schoolId: 1, name: 1 });

module.exports = mongoose.model('Designation', designationSchema);
