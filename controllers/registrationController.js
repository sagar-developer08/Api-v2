const Admin = require('../models/Admin');
const School = require('../models/School');
const OTPVerification = require('../models/OTPVerification');
const { sendOTPEmail } = require('../config/email');
const generateToken = require('../utils/generateToken');
const generateSchoolCode = require('../utils/generateSchoolCode');

exports.register = async (req, res) => {
  try {
    const { schoolName, adminName, mobileNumber, email, password } = req.body;
    const emailLower = email.toLowerCase().trim();
    const mobile = String(mobileNumber).trim();

    const existingAdmin = await Admin.findOne({
      $or: [{ email: emailLower }, { mobileNumber: mobile }]
    });
    if (existingAdmin) {
      const field = existingAdmin.email === emailLower ? 'email' : 'mobile number';
      return res.status(400).json({
        success: false,
        message: `${field === 'email' ? 'Email' : 'Mobile number'} already registered`
      });
    }

    const { otp, expiresAt } = await OTPVerification.createForRegistration(emailLower, mobile);
    const emailSent = await sendOTPEmail(emailLower, otp);
    if (!emailSent) {
      await OTPVerification.deleteOne({ email: emailLower });
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Verify to complete registration.',
      data: {
        email: emailLower,
        mobileNumber: mobile,
        expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const emailLower = (email || '').toLowerCase().trim();

    const record = await OTPVerification.findOne({
      email: emailLower,
      verified: false,
      expiresAt: { $gt: new Date() }
    });
    if (!record || record.otp !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    record.verified = true;
    await record.save();

    const { schoolName, adminName, mobileNumber, password } = req.body;
    if (!schoolName || !adminName || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'schoolName, adminName, mobileNumber and password are required for verification'
      });
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ email: emailLower }, { mobileNumber: String(mobileNumber).trim() }]
    });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile already registered'
      });
    }

    const schoolCode = await generateSchoolCode();
    const school = await School.create({
      schoolName: schoolName.trim(),
      schoolCode,
      status: 'Pending Setup',
      setupWizardStep: 1,
      isSetup: false
    });

    const admin = await Admin.create({
      fullName: adminName.trim(),
      email: emailLower,
      mobileNumber: String(mobileNumber).trim(),
      password,
      schoolId: school._id,
      isEmailVerified: true,
      isMobileVerified: true
    });

    school.adminId = admin._id;
    await school.save();

    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Registration complete. Proceed to Setup Wizard.',
      data: {
        schoolId: school._id,
        schoolCode: school.schoolCode,
        schoolName: school.schoolName,
        isSetup: school.isSetup,
        admin: {
          id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          mobileNumber: admin.mobileNumber
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const emailLower = (email || '').toLowerCase().trim();
    if (!emailLower) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const existingAdmin = await Admin.findOne({ email: emailLower });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login.'
      });
    }

    const record = await OTPVerification.findOne({ email: emailLower, verified: false });
    const mobileNumber = (record && record.mobileNumber) ? record.mobileNumber : (req.body.mobileNumber || '');
    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration found for this email. Please use the register endpoint first, or provide mobileNumber.'
      });
    }

    const { otp, expiresAt } = await OTPVerification.createForRegistration(emailLower, mobileNumber);
    const emailSent = await sendOTPEmail(emailLower, otp);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email.',
      data: { email: emailLower, expiresAt }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Resend OTP failed',
      error: error.message
    });
  }
};
