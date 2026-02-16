const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    marksObtained: {
        type: Number,
        required: true
    },
    maxMarks: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number
    },
    grade: {
        type: String,
        trim: true
    },
    rank: {
        type: Number
    },
    percentile: {
        type: Number
    },
    publishedAt: {
        type: Date
    },
    // Hall ticket info
    seatNumber: {
        type: String,
        trim: true
    },
    hallTicketInstructions: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Auto-calculate percentage before save
examResultSchema.pre('save', function (next) {
    if (this.maxMarks > 0) {
        this.percentage = Math.round((this.marksObtained / this.maxMarks) * 100);
    }
    next();
});

examResultSchema.index({ schoolId: 1, examId: 1, studentId: 1 }, { unique: true });
examResultSchema.index({ studentId: 1 });
examResultSchema.index({ examId: 1 });

module.exports = mongoose.model('ExamResult', examResultSchema);
