const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 3600 // Token expires in 1 hour (3600 seconds)
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate reset token
passwordResetSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Indexes
// Note: token already has unique index from unique: true
// Note: expiresAt already has TTL index from expires: 3600 option
passwordResetSchema.index({ email: 1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
