const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  order: { type: Number, default: 0 }
}, { timestamps: true });

classSchema.index({ schoolId: 1 });

module.exports = mongoose.model('Class', classSchema);
