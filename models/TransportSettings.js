const mongoose = require('mongoose');

const transportSettingsSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
  attendanceRequired: { type: Boolean, default: true },
  trackingEnabled: { type: Boolean, default: false },
  notificationsEnabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TransportSettings', transportSettingsSchema);
