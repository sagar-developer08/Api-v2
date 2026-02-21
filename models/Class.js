const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
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
  grade: {
    type: String,
    trim: true
  },
  section: {
    type: String,
    trim: true
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear'
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  maxStudents: {
    type: Number,
    default: 50
  },
  roomNumber: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: String, // e.g., "08:00"
    trim: true
  },
  endTime: {
    type: String, // e.g., "14:00"
    trim: true
  },
  weeklyOffDay: {
    type: String,
    default: 'Sunday',
    trim: true
  },
  workingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  order: { 
    type: Number, 
    default: 0 
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'inactive'],
    default: 'active'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  subjects: [{
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    type: {
      type: String,
      enum: ['core', 'elective'],
      default: 'core'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  monitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  feeStructure: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    frequency: { 
      type: String, 
      enum: ['one-time', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly' 
    },
    dueDate: { type: Date },
    description: String
  }],
  attendanceConfig: {
    markingMethod: { type: String, enum: ['period-wise', 'daily'], default: 'daily' },
    periodsPerDay: { type: Number, default: 8 },
    attendanceRules: {
      minAttendancePercentage: { type: Number, default: 75 },
      lateArrivalThreshold: { type: String, default: "09:00" },
      halfDayThreshold: { type: Number, default: 4 }
    },
    autoMarkAbsent: { type: Boolean, default: true },
    notifyOnLowAttendance: { type: Boolean, default: true },
    lowAttendanceThreshold: { type: Number, default: 70 }
  }
}, { timestamps: true });

classSchema.index({ schoolId: 1 });
classSchema.index({ branchId: 1 });
classSchema.index({ schoolId: 1, branchId: 1 });
classSchema.index({ schoolId: 1, branchId: 1, name: 1 });

module.exports = mongoose.model('Class', classSchema);
