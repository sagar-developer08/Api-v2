const { body } = require('express-validator');

// Step 1: School Details Validation
exports.validateSchoolDetails = [
  body('schoolName')
    .trim()
    .notEmpty()
    .withMessage('School name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('School name must be between 2 and 200 characters'),
  
  body('schoolCode')
    .trim()
    .notEmpty()
    .withMessage('School code is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('School code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('School code must contain only uppercase letters and numbers'),
  
  body('schoolType')
    .notEmpty()
    .withMessage('School type is required')
    .isIn(['Primary', 'Secondary', 'Higher Secondary', 'Composite'])
    .withMessage('Invalid school type'),
  
  body('boardAffiliation')
    .notEmpty()
    .withMessage('Board/Affiliation is required')
    .isIn(['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'])
    .withMessage('Invalid board affiliation'),
  
  body('mediumOfInstruction')
    .notEmpty()
    .withMessage('Medium of instruction is required')
    .isIn(['English', 'Hindi', 'Regional', 'Bilingual'])
    .withMessage('Invalid medium of instruction'),
  
  body('academicYearStartMonth')
    .notEmpty()
    .withMessage('Academic year start month is required')
    .isIn(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
    .withMessage('Invalid month'),
  
  body('establishmentYear')
    .notEmpty()
    .withMessage('Establishment year is required')
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage('Invalid establishment year')
];

// Step 2: Address & Contact Validation
exports.validateAddressContact = [
  body('addressLine1')
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters'),
  
  body('addressLine2')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address line 2 must be less than 200 characters'),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('district')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('District must be less than 100 characters'),
  
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('pincode')
    .trim()
    .notEmpty()
    .withMessage('Pincode is required')
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be exactly 6 digits'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone must be less than 50 characters'),
  
  body('officialEmail')
    .trim()
    .notEmpty()
    .withMessage('Official email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('primaryPhoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Primary phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Primary phone number must be exactly 10 digits'),
  
  body('alternatePhoneNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Alternate phone number must be exactly 10 digits'),
  
  body('websiteURL')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL')
];

// Step 3: Admin Account Validation
exports.validateAdminAccount = [
  body('adminFullName')
    .trim()
    .notEmpty()
    .withMessage('Admin full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Admin full name must be between 2 and 100 characters'),
  
  body('adminEmail')
    .trim()
    .notEmpty()
    .withMessage('Admin email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('adminMobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Admin mobile number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Admin mobile number must be exactly 10 digits'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Step 4: Legal & Setup Validation
exports.validateLegalSetup = [
  body('schoolRegistrationNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('School registration number must be less than 100 characters'),
  
  body('affiliationNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Affiliation number must be less than 100 characters'),
  
  body('udiseCode')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('UDISE code must be less than 50 characters'),
  
  body('gstNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST number format'),
  
  body('panNumber')
    .optional()
    .trim()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN number format'),
  
  body('trustSocietyName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Trust/Society name must be less than 200 characters'),
  
  body('classesOffered')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Classes offered must be less than 200 characters'),
  
  body('streams')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Streams must be less than 200 characters'),
  
  body('sectionsPerClass')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Sections per class must be less than 50 characters'),
  
  body('gradingSystem')
    .optional()
    .isIn(['Percentage', 'GPA', 'CGPA', 'Letter Grade', 'Other'])
    .withMessage('Invalid grading system'),
  
  body('examPattern')
    .optional()
    .isIn(['Annual', 'Semester', 'Quarterly', 'Continuous', 'Other'])
    .withMessage('Invalid exam pattern')
];

// Password Reset Validation
exports.validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

exports.validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];
