const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  qualification: {
    type: String,
    trim: true
  },
  topics: [{
    type: String
  }],
  address: {
    type: String
  },
  joiningDate: {
    type: Date
  }
}, { timestamps: true });

teacherSchema.index({ schoolId: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
