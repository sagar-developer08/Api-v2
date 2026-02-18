const mongoose = require('mongoose');

const featureConfigSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    unique: true
  },
  features: {
    attendance: { type: Boolean, default: true },
    homework: { type: Boolean, default: true },
    timetable: { type: Boolean, default: true },
    notices: { type: Boolean, default: true },
    fees: { type: Boolean, default: true },
    exams: { type: Boolean, default: true },
    transport: { type: Boolean, default: true },
    lms: { type: Boolean, default: true },
    staffHr: { type: Boolean, default: true },
    admissions: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('FeatureConfig', featureConfigSchema);
