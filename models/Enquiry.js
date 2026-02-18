const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, required: true, trim: true },
  class: { type: String, trim: true },
  message: { type: String, trim: true },
  status: { type: String, enum: ['new', 'contacted', 'converted', 'lost'], default: 'new' },
  source: { type: String, trim: true }
}, { timestamps: true });

enquirySchema.index({ schoolId: 1 });
module.exports = mongoose.model('Enquiry', enquirySchema);
