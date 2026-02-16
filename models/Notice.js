const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['notice', 'announcement', 'circular'],
        default: 'notice'
    },
    target: {
        type: String,
        enum: ['all', 'students', 'teachers', 'parents'],
        default: 'all'
    },
    targetClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    },
    readBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId },
        readAt: { type: Date, default: Date.now }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, { timestamps: true });

noticeSchema.index({ schoolId: 1, status: 1 });
noticeSchema.index({ schoolId: 1, target: 1 });
noticeSchema.index({ publishedAt: -1 });
noticeSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
