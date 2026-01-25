const mongoose = require('mongoose');
const crypto = require('crypto');

const OTP_EXPIRY_MINUTES = 10;

const otpVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

otpVerificationSchema.index({ email: 1 });
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpVerificationSchema.statics.generateOTP = function () {
  return crypto.randomInt(100000, 999999).toString();
};

otpVerificationSchema.statics.createForRegistration = async function (email, mobileNumber) {
  const otp = this.generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await this.deleteMany({ email: email.toLowerCase() });
  const doc = await this.create({
    email: email.toLowerCase(),
    mobileNumber,
    otp,
    expiresAt
  });
  return { otp, expiresAt };
};

module.exports = mongoose.model('OTPVerification', otpVerificationSchema);
