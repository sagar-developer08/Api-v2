const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  validateForgotPassword,
  validateResetPassword
} = require('../validators/schoolValidators');
const { handleValidationErrors } = require('../middleware/validation');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

// Login
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  handleValidationErrors,
  authController.login
);

// Forgot Password
router.post(
  '/forgot-password',
  validateForgotPassword,
  handleValidationErrors,
  authController.forgotPassword
);

// Reset Password
router.post(
  '/reset-password',
  validateResetPassword,
  handleValidationErrors,
  authController.resetPassword
);

// Get current admin profile
router.get(
  '/profile',
  protect,
  authController.getProfile
);

module.exports = router;
