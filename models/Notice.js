const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storageKey: { type: String, required: true }
  },
  { _id: false }
);

const noticeSchema = new mongoose.Schema(
  {
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
      trim: true,
      default: ''
    },
    category: {
      type: String,
      enum: ['Academic', 'Events', 'Maintenance', 'Arts', 'Finance', 'Notice', 'Training'],
      default: 'Notice'
    },
    audience: {
      type: String,
      trim: true,
      default: ''
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
    targetClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      }
    ],
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    postAt: {
      type: Date
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
      enum: ['draft', 'active', 'scheduled', 'published', 'archived'],
      default: 'active'
    },
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId },
        readAt: { type: Date, default: Date.now }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    createdByOverride: {
      type: String,
      trim: true
    },
    publisherRole: {
      type: String,
      trim: true
    },
    visualKey: {
      type: String,
      enum: ['academic', 'events', 'maintenance', 'arts', 'finance', 'notice', 'training']
    },
    audienceReachCount: {
      type: Number
    },
    attachment: {
      type: attachmentSchema,
      default: null
    }
  },
  { timestamps: true }
);

noticeSchema.index({ schoolId: 1, status: 1 });
noticeSchema.index({ schoolId: 1, target: 1 });
noticeSchema.index({ schoolId: 1, category: 1 });
noticeSchema.index({ publishedAt: -1 });
noticeSchema.index({ postAt: -1 });
noticeSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
