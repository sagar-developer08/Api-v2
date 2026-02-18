const mongoose = require('mongoose');

const impersonationSessionSchema = new mongoose.Schema({
  superAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userRole: { type: String, enum: ['admin', 'teacher', 'student', 'parent'] },
  reason: { type: String, trim: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('ImpersonationSession', impersonationSessionSchema);
