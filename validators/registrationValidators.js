const { body } = require('express-validator');

const passwordPolicy = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter')
];

exports.validateRegister = [
  body('schoolName')
    .trim()
    .notEmpty()
    .withMessage('School name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('School name must be 2–200 characters'),
  body('adminName')
    .trim()
    .notEmpty()
    .withMessage('Admin name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Admin name must be 2–100 characters'),
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),
  ...passwordPolicy,
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match');
      return true;
    })
];

exports.validateVerifyOtp = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  body('schoolName')
    .trim()
    .notEmpty()
    .withMessage('School name is required'),
  body('adminName')
    .trim()
    .notEmpty()
    .withMessage('Admin name is required'),
  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be 10 digits'),
  ...passwordPolicy
];

exports.validateLogin = [
  body('schoolCode')
    .trim()
    .notEmpty()
    .withMessage('School code is required'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];
