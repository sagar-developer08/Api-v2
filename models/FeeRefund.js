const mongoose = require('mongoose');

const feeRefundSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePayment', required: true },
  studentFeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentFee' },
  amount: { type: Number, required: true },
  reason: { type: String, trim: true },
  refundMethod: { type: String, enum: ['cash', 'bank_transfer', 'cheque'], default: 'bank_transfer' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending' },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

feeRefundSchema.index({ schoolId: 1, status: 1 });
module.exports = mongoose.model('FeeRefund', feeRefundSchema);
