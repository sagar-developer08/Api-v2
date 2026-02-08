const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  type: {
    type: String,
    enum: ['father', 'mother', 'guardian'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  relationship: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  occupation: {
    type: String,
    trim: true
  },
  qualification: {
    type: String,
    trim: true
  },
  income: {
    type: Number
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  isEmergencyContact: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

guardianSchema.index({ studentId: 1 });
guardianSchema.index({ schoolId: 1 });

module.exports = mongoose.model('Guardian', guardianSchema);
