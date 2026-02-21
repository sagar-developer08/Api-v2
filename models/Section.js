const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
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
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true,
    required: true
  },
  capacity: {
    type: Number,
    default: 40
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'inactive'],
    default: 'active'
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

sectionSchema.index({ schoolId: 1 });
sectionSchema.index({ branchId: 1 });
sectionSchema.index({ schoolId: 1, branchId: 1 });
sectionSchema.index({ schoolId: 1, branchId: 1, classId: 1 });

module.exports = mongoose.model('Section', sectionSchema);
