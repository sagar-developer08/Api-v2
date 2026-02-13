const mongoose = require('mongoose');

const subjectMarksSchema = new mongoose.Schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },
    subjectName: {
        type: String,
        trim: true
    },
    marks: {
        type: Number,
        required: true,
        min: 0
    },
    maxMarks: {
        type: Number,
        required: true,
        min: 0
    },
    grade: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    }
}, { _id: false });

const studentAcademicRecordSchema = new mongoose.Schema({
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
    academicYear: {
        type: String,
        required: true,
        trim: true
    },
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    className: {
        type: String,
        trim: true
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    sectionName: {
        type: String,
        trim: true
    },
    examType: {
        type: String,
        required: true,
        trim: true,
        enum: ['unit-test', 'mid-term', 'final', 'quarterly', 'half-yearly', 'annual', 'other']
    },
    examName: {
        type: String,
        required: true,
        trim: true
    },
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam'
    },
    examDate: {
        type: Date,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 0
    },
    obtainedMarks: {
        type: Number,
        required: true,
        min: 0
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    grade: {
        type: String,
        trim: true
    },
    rank: {
        type: Number,
        min: 1
    },
    subjects: [subjectMarksSchema],
    remarks: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Calculate percentage before save
studentAcademicRecordSchema.pre('save', function (next) {
    if (this.totalMarks > 0) {
        this.percentage = parseFloat(((this.obtainedMarks / this.totalMarks) * 100).toFixed(2));
    }
    next();
});

studentAcademicRecordSchema.index({ schoolId: 1, studentId: 1 });
studentAcademicRecordSchema.index({ studentId: 1, academicYear: 1 });
studentAcademicRecordSchema.index({ studentId: 1, examType: 1 });

module.exports = mongoose.model('StudentAcademicRecord', studentAcademicRecordSchema);
