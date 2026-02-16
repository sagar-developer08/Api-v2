const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
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
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    gradeType: {
        type: String,
        enum: ['exam', 'assignment', 'quiz', 'project'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    maxScore: {
        type: Number,
        required: true
    },
    obtainedScore: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number
    },
    letterGrade: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    remarks: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Auto-calculate percentage before save
gradeSchema.pre('save', function (next) {
    if (this.maxScore > 0) {
        this.percentage = Math.round((this.obtainedScore / this.maxScore) * 100);
    }
    next();
});

gradeSchema.index({ schoolId: 1, studentId: 1 });
gradeSchema.index({ studentId: 1, subjectId: 1 });
gradeSchema.index({ studentId: 1, gradeType: 1 });
gradeSchema.index({ date: -1 });

module.exports = mongoose.model('Grade', gradeSchema);
