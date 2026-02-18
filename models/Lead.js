const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  source: { type: String, enum: ['website', 'referral', 'social_media', 'advertisement', 'other'], default: 'website' },
  interest: { type: String, trim: true },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['new', 'contacted', 'qualified', 'converted', 'lost'], default: 'new' }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
