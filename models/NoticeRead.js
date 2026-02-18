const mongoose = require('mongoose');

const noticeReadSchema = new mongoose.Schema({
  noticeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notice', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, refPath: 'recipientModel', required: true },
  recipientModel: { type: String, enum: ['Parent', 'Student', 'Teacher', 'Guardian'], required: true },
  readAt: { type: Date, default: Date.now }
}, { timestamps: true });

noticeReadSchema.index({ noticeId: 1, recipientId: 1 }, { unique: true });
module.exports = mongoose.model('NoticeRead', noticeReadSchema);
