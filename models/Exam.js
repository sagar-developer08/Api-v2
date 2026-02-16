const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    examType: {
        type: String,
        enum: ['unit_test', 'midterm', 'final', 'quiz'],
        required: true
    },
    academicYear: {
        type: String,
        trim: true
    },
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    },
    examDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        trim: true
    },
    endTime: {
        type: String,
        trim: true
    },
    duration: {
        type: Number // in minutes
    },
    maxMarks: {
        type: Number,
        required: true
    },
    passingMarks: {
        type: Number,
        default: 40
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    venue: {
        type: String,
        trim: true
    },
    instructions: {
        type: String,
        trim: true
    },
    hallTicketsGenerated: {
        type: Boolean,
        default: false
    },
    resultsPublished: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

examSchema.index({ schoolId: 1, classId: 1 });
examSchema.index({ schoolId: 1, subjectId: 1 });
examSchema.index({ examDate: 1 });
examSchema.index({ status: 1 });

module.exports = mongoose.model('Exam', examSchema);
