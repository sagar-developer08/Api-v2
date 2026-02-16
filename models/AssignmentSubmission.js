const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    fileName: { type: String, trim: true },
    fileUrl: { type: String, trim: true },
    fileSize: { type: Number, default: 0 }
}, { _id: true });

const assignmentSubmissionSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    submissionText: {
        type: String,
        trim: true
    },
    attachments: [attachmentSchema],
    submittedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['submitted', 'graded', 'late', 'resubmitted'],
        default: 'submitted'
    },
    score: {
        type: Number,
        default: null
    },
    gradedAt: {
        type: Date,
        default: null
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

assignmentSubmissionSchema.index({ schoolId: 1, assignmentId: 1, studentId: 1 }, { unique: true });
assignmentSubmissionSchema.index({ studentId: 1 });
assignmentSubmissionSchema.index({ assignmentId: 1 });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
