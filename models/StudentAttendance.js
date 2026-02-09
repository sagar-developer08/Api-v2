const mongoose = require('mongoose');

const periodAttendanceSchema = new mongoose.Schema({
    period: { type: Number, required: true },
    status: {
        type: String,
        enum: ['present', 'absent', 'late'],
        default: 'present'
    },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    subjectName: { type: String, trim: true }
}, { _id: false });

const studentAttendanceSchema = new mongoose.Schema({
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
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'on-leave', 'half-day'],
        required: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    markedAt: {
        type: Date,
        default: Date.now
    },
    remarks: {
        type: String,
        trim: true
    },
    periods: [periodAttendanceSchema]
}, { timestamps: true });

studentAttendanceSchema.index({ schoolId: 1, studentId: 1, date: 1 }, { unique: true });
studentAttendanceSchema.index({ schoolId: 1, classId: 1, date: 1 });
studentAttendanceSchema.index({ studentId: 1, date: 1 });

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema);
