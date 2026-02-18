const mongoose = require('mongoose');

const staffHrSettingsSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
  leaveBalance: { type: mongoose.Schema.Types.Mixed },
  payrollCycle: { type: String, default: 'monthly' }
}, { timestamps: true });

module.exports = mongoose.model('StaffHrSettings', staffHrSettingsSchema);
