const mongoose = require('mongoose');

const approvalLogSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['approved', 'rejected']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    required: true
  },
  remarks: { type: String, trim: true }
}, { timestamps: true });

approvalLogSchema.index({ schoolId: 1 });

module.exports = mongoose.model('ApprovalLog', approvalLogSchema);
