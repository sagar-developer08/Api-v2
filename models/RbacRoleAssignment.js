const mongoose = require('mongoose');

const ASSIGNMENT_STATUS = ['Assigned', 'Review'];

const rbacRoleAssignmentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'RbacRole', required: true },
  status: { type: String, enum: ASSIGNMENT_STATUS, default: 'Assigned' }
}, { timestamps: true });

rbacRoleAssignmentSchema.index({ schoolId: 1, staffId: 1 });
rbacRoleAssignmentSchema.index({ schoolId: 1, roleId: 1 });

module.exports = mongoose.model('RbacRoleAssignment', rbacRoleAssignmentSchema);
