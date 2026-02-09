const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['student', 'guardian'],
        required: true
    },
    name: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    }
}, { _id: false });

const studentCommunicationSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ['sms', 'email', 'notification', 'whatsapp'],
        required: true
    },
    subject: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'failed', 'pending'],
        default: 'sent'
    },
    recipient: recipientSchema,
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    metadata: {
        messageId: String,
        provider: String,
        cost: Number
    }
}, { timestamps: true });

studentCommunicationSchema.index({ schoolId: 1, studentId: 1 });
studentCommunicationSchema.index({ studentId: 1, type: 1 });
studentCommunicationSchema.index({ sentAt: -1 });

module.exports = mongoose.model('StudentCommunication', studentCommunicationSchema);
