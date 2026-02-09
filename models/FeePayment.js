const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
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
    feeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentFee',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentDate: {
        type: Date,
        required: true
    },
    mode: {
        type: String,
        enum: ['cash', 'online', 'cheque', 'dd', 'bank-transfer', 'upi'],
        required: true
    },
    transactionId: {
        type: String,
        trim: true
    },
    receiptNumber: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'failed', 'refunded'],
        default: 'completed'
    },
    remarks: {
        type: String,
        trim: true
    },
    collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, { timestamps: true });

feePaymentSchema.index({ schoolId: 1, studentId: 1 });
feePaymentSchema.index({ feeId: 1 });
feePaymentSchema.index({ paymentDate: 1 });

module.exports = mongoose.model('FeePayment', feePaymentSchema);
