const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
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
    contentType: {
        type: String,
        enum: ['video', 'document', 'link', 'quiz'],
        required: true
    },
    url: {
        type: String,
        trim: true
    },
    thumbnail: {
        type: String,
        trim: true
    },
    duration: {
        type: Number // in seconds
    },
    views: {
        type: Number,
        default: 0
    },
    progress: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        progress: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        lastAccessedAt: { type: Date, default: Date.now }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    status: {
        type: String,
        enum: ['active', 'draft', 'archived'],
        default: 'active'
    }
}, { timestamps: true });

contentSchema.index({ schoolId: 1, classId: 1 });
contentSchema.index({ schoolId: 1, subjectId: 1 });
contentSchema.index({ schoolId: 1, contentType: 1 });

module.exports = mongoose.model('Content', contentSchema);
