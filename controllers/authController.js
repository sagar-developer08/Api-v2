const Admin = require('../models/Admin');
const School = require('../models/School');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail } = require('../config/email');
const generateToken = require('../utils/generateToken');

exports.login = async (req, res) => {
  try {
    const { schoolCode, email, password } = req.body;

    const school = await School.findOne({
      schoolCode: (schoolCode || '').toString().trim().toUpperCase()
    });
    if (!school) {
      return res.status(401).json({
        success: false,
        message: 'Invalid school code or credentials'
      });
    }

    if (school.status !== 'Approved' && school.status !== 'Pending Setup') {
      const msg =
        school.status === 'Pending Admin Approval'
          ? 'Your school is awaiting admin approval. You will be notified once approved.'
          : school.status === 'Rejected'
            ? 'Your school registration was rejected. Please contact support.'
            : 'Login not allowed for your school at this time.';
      return res.status(403).json({
        success: false,
        message: msg,
        status: school.status
      });
    }

    const admin = await Admin.findOne({
      email: (email || '').toLowerCase().trim(),
      schoolId: school._id
    }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid school code or credentials'
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid school code or credentials'
      });
    }

    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          mobileNumber: admin.mobileNumber,
          schoolCode: school.schoolCode,
          schoolId: school._id,
          schoolName: school.schoolName,
          isSetup: school.isSetup
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    const resetToken = PasswordReset.generateToken();
    await PasswordReset.create({
      email: email.toLowerCase(),
      token: resetToken,
      expiresAt: new Date(Date.now() + 3600000)
    });

    const emailSent = await sendPasswordResetEmail(email, resetToken);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Error sending email. Please try again later'
      });
    }

    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const passwordReset = await PasswordReset.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const admin = await Admin.findOne({ email: passwordReset.email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    admin.password = password;
    await admin.save();

    passwordReset.used = true;
    await passwordReset.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id)
      .select('-password')
      .populate('schoolId', 'schoolName schoolCode status');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};
