const mongoose = require('mongoose');

const lmsContentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['video', 'document', 'link', 'note'], default: 'document' },
  description: { type: String, trim: true },
  fileUrl: { type: String, trim: true },
  url: { type: String, trim: true },
  order: { type: Number, default: 0 },
  isRequired: { type: Boolean, default: false }
}, { timestamps: true });

lmsContentSchema.index({ courseId: 1 });
module.exports = mongoose.model('LmsContent', lmsContentSchema);
