const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const registrationController = require('../controllers/registrationController');
const { validateForgotPassword, validateResetPassword } = require('../validators/schoolValidators');
const {
  validateRegister: validateRegisterSpec,
  validateVerifyOtp: validateVerifyOtpSpec,
  validateLogin: validateLoginSpec
} = require('../validators/registrationValidators');
const { handleValidationErrors } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

router.post(
  '/register',
  validateRegisterSpec,
  handleValidationErrors,
  registrationController.register
);

router.post(
  '/verify-otp',
  validateVerifyOtpSpec,
  handleValidationErrors,
  registrationController.verifyOtp
);

router.post(
  '/login',
  validateLoginSpec,
  handleValidationErrors,
  authController.login
);

router.post(
  '/forgot-password',
  validateForgotPassword,
  handleValidationErrors,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validateResetPassword,
  handleValidationErrors,
  authController.resetPassword
);

router.get('/profile', protect, authController.getProfile);

module.exports = router;
