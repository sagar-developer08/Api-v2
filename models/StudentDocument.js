const mongoose = require('mongoose');

const studentDocumentSchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true,
        enum: [
            'birth-certificate',
            'aadhaar-card',
            'transfer-certificate',
            'migration-certificate',
            'mark-sheet',
            'character-certificate',
            'medical-certificate',
            'photograph',
            'caste-certificate',
            'income-certificate',
            'residence-proof',
            'other'
        ]
    },
    category: {
        type: String,
        enum: ['mandatory', 'optional'],
        default: 'optional'
    },
    fileUrl: {
        type: String,
        required: true,
        trim: true
    },
    fileSize: {
        type: Number,
        default: 0
    },
    mimeType: {
        type: String,
        trim: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    verificationRemarks: {
        type: String,
        trim: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, { timestamps: true });

studentDocumentSchema.index({ schoolId: 1, studentId: 1 });
studentDocumentSchema.index({ studentId: 1, type: 1 });

module.exports = mongoose.model('StudentDocument', studentDocumentSchema);
