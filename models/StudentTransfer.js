const mongoose = require('mongoose');

const studentTransferSchema = new mongoose.Schema({
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
    transferType: {
        type: String,
        enum: ['promotion', 'transfer', 'section-change'],
        required: true
    },
    fromClassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    fromClassName: {
        type: String,
        trim: true
    },
    toClassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    },
    toClassName: {
        type: String,
        trim: true
    },
    fromSectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    fromSectionName: {
        type: String,
        trim: true
    },
    toSectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    toSectionName: {
        type: String,
        trim: true
    },
    fromAcademicYear: {
        type: String,
        trim: true
    },
    toAcademicYear: {
        type: String,
        trim: true
    },
    fromRollNumber: {
        type: String,
        trim: true
    },
    toRollNumber: {
        type: String,
        trim: true
    },
    transferDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    },
    transferredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, { timestamps: true });

studentTransferSchema.index({ schoolId: 1, studentId: 1 });
studentTransferSchema.index({ studentId: 1, transferDate: -1 });

module.exports = mongoose.model('StudentTransfer', studentTransferSchema);
