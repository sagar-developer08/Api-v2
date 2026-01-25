const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

sectionSchema.index({ schoolId: 1 });

module.exports = mongoose.model('Section', sectionSchema);
