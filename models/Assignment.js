const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    fileName: { type: String, trim: true },
    fileUrl: { type: String, trim: true },
    fileSize: { type: Number, default: 0 }
}, { _id: true });

const assignmentSchema = new mongoose.Schema({
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
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
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
    dueDate: {
        type: Date,
        required: true
    },
    maxScore: {
        type: Number,
        default: 100
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'closed'],
        default: 'published'
    },
    attachments: [attachmentSchema]
}, { timestamps: true });

assignmentSchema.index({ schoolId: 1, classId: 1 });
assignmentSchema.index({ schoolId: 1, subjectId: 1 });
assignmentSchema.index({ schoolId: 1, teacherId: 1 });
assignmentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
