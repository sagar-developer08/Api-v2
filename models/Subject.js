const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['Theory', 'Practical', 'Both'],
    default: 'Theory'
  }
}, { timestamps: true });

subjectSchema.index({ schoolId: 1 });
subjectSchema.index({ branchId: 1 });
subjectSchema.index({ schoolId: 1, branchId: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
