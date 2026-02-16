const mongoose = require('mongoose');

const teacherLeaveSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    leaveType: {
        type: String,
        enum: ['sick', 'casual', 'earned', 'maternity', 'other'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    days: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileSize: Number
    }],
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    reviewedAt: {
        type: Date
    },
    remarks: {
        type: String,
        trim: true
    }
}, { timestamps: true });

teacherLeaveSchema.index({ schoolId: 1, teacherId: 1 });
teacherLeaveSchema.index({ status: 1 });

module.exports = mongoose.model('TeacherLeave', teacherLeaveSchema);
