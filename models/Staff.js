const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  employeeId: { type: String, trim: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''] },
  address: { type: String, trim: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffRole' },
  designation: { type: String, trim: true },
  joinDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive', 'resigned', 'suspended'], default: 'active' },
  password: { type: String, minlength: 6, select: false }
}, { timestamps: true });

staffSchema.index({ schoolId: 1 });
staffSchema.index({ branchId: 1 });
staffSchema.index({ schoolId: 1, branchId: 1 });
staffSchema.index({ schoolId: 1, branchId: 1, email: 1 });
staffSchema.index({ schoolId: 1, branchId: 1, employeeId: 1 }, { sparse: true });

module.exports = mongoose.model('Staff', staffSchema);
