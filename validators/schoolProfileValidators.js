const { body, validationResult } = require('express-validator');

// Step 1: Basic Information Validators
exports.validateBasicInfo = [
    body('schoolName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('School name must be between 2 and 200 characters'),

    body('schoolCode')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('School code must be between 2 and 50 characters')
        .matches(/^[A-Z0-9]+$/i)
        .withMessage('School code must contain only letters and numbers'),

    body('schoolLogo')
        .optional()
        .trim()
        .isURL()
        .withMessage('School logo must be a valid URL'),

    body('establishmentYear')
        .optional()
        .isISO8601()
        .withMessage('Establishment year must be a valid date'),

    body('schoolType')
        .optional()
        .isIn(['Private', 'Public', 'Government', 'International', 'School', 'College', 'Institute', ''])
        .withMessage('Invalid school type'),

    body('boardAffiliation')
        .optional()
        .isIn(['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Cambridge', 'Other', ''])
        .withMessage('Invalid board affiliation'),

    body('schoolCategory')
        .optional()
        .isIn(['Co-ed', 'Boys', 'Girls', ''])
        .withMessage('Invalid school category'),

    body('recognitionNumber')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Recognition number must be less than 100 characters'),

    body('affiliationNumber')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Affiliation number must be less than 100 characters')
];

// Step 2: Contact Details Validators
exports.validateContactInfo = [
    body('primaryEmail')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Primary email must be a valid email address')
        .normalizeEmail(),

    body('secondaryEmail')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Secondary email must be a valid email address')
        .normalizeEmail(),

    body('primaryPhone')
        .optional()
        .trim()
        .matches(/^[0-9]{10,15}$/)
        .withMessage('Primary phone must be 10-15 digits'),

    body('secondaryPhone')
        .optional()
        .trim()
        .matches(/^[0-9]{10,15}$/)
        .withMessage('Secondary phone must be 10-15 digits'),

    body('website')
        .optional()
        .trim()
        .isURL()
        .withMessage('Website must be a valid URL'),

    body('address.line1')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Address line 1 must be between 1 and 200 characters'),

    body('address.line2')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Address line 2 must be less than 200 characters'),

    body('address.city')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('City must be less than 100 characters'),

    body('address.state')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('State must be less than 100 characters'),

    body('address.country')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Country must be less than 100 characters'),

    body('address.pinCode')
        .optional()
        .trim()
        .matches(/^[0-9]{5,10}$/)
        .withMessage('Pin code must be 5-10 digits')
];

// Step 3: Administrative Validators
exports.validateAdministrativeInfo = [
    body('principal.name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Principal name must be less than 100 characters'),

    body('principal.email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Principal email must be a valid email address'),

    body('principal.contactNumber')
        .optional()
        .trim()
        .matches(/^[0-9]{10,15}$/)
        .withMessage('Principal contact must be 10-15 digits'),

    body('adminOfficer.name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Admin officer name must be less than 100 characters'),

    body('adminOfficer.contactNumber')
        .optional()
        .trim()
        .matches(/^[0-9]{10,15}$/)
        .withMessage('Admin officer contact must be 10-15 digits'),

    body('totalStudentCapacity')
        .optional()
        .isInt({ min: 1, max: 100000 })
        .withMessage('Total student capacity must be between 1 and 100,000'),

    body('currentAcademicYear')
        .optional()
        .trim()
        .matches(/^\d{4}\s*[-–]\s*\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY')
];

// Step 4: Academic Structure Validators
exports.validateAcademicInfo = [
    body('classesOffered')
        .optional()
        .isArray()
        .withMessage('Classes offered must be an array'),

    body('classesOffered.*')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Class name must be less than 50 characters'),

    body('sectionsPerClass')
        .optional()
        .isArray()
        .withMessage('Sections per class must be an array'),

    body('sectionsPerClass.*')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('Section name must be less than 10 characters'),

    body('mediumOfInstruction')
        .optional()
        .isArray()
        .withMessage('Medium of instruction must be an array'),

    body('mediumOfInstruction.*')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Medium name must be less than 50 characters'),

    body('workingDays')
        .optional()
        .isArray()
        .withMessage('Working days must be an array'),

    body('workingDays.*')
        .optional()
        .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
        .withMessage('Invalid working day'),

    body('defaultGradingSystem')
        .optional()
        .isIn(['Percentage', 'GPA', 'CGPA', 'Letter Grade', 'Other', ''])
        .withMessage('Invalid grading system'),

    body('academicYears')
        .optional()
        .isArray()
        .withMessage('Academic years must be an array'),

    body('academicYears.*.year')
        .optional()
        .trim()
        .matches(/^\d{4}\s*[-–]\s*\d{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),

    body('academicYears.*.startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),

    body('academicYears.*.endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),

    body('academicYears.*.status')
        .optional()
        .isIn(['Active', 'Inactive'])
        .withMessage('Status must be Active or Inactive')
];

// Step 5: Timings Validators
exports.validateTimingsInfo = [
    body('schoolStartTime')
        .optional()
        .trim()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i)
        .withMessage('Invalid start time format (e.g., 08:00 AM)'),

    body('schoolEndTime')
        .optional()
        .trim()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i)
        .withMessage('Invalid end time format (e.g., 03:00 PM)'),

    body('periodDuration')
        .optional()
        .isInt({ min: 1, max: 180 })
        .withMessage('Period duration must be between 1 and 180 minutes'),

    body('lunchStartTime')
        .optional()
        .trim()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i)
        .withMessage('Invalid lunch start time format'),

    body('lunchEndTime')
        .optional()
        .trim()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i)
        .withMessage('Invalid lunch end time format')
];

// Step 6: Policies Validators
exports.validatePoliciesInfo = [
    body('minAttendancePercentage')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Minimum attendance must be between 0 and 100'),

    body('policies.attendancePolicy')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Attendance policy must be less than 5000 characters'),

    body('policies.promotionRules')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Promotion rules must be less than 5000 characters'),

    body('policies.examGradingPolicy')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Exam grading policy must be less than 5000 characters'),

    body('policies.leavePolicy')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Leave policy must be less than 5000 characters'),

    body('policies.feePolicy')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Fee policy must be less than 5000 characters'),

    body('policies.disciplineCode')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Discipline code must be less than 5000 characters')
];

// Step 7: Optional Details Validators
exports.validateOptionalInfo = [
    body('schoolMotto')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('School motto must be less than 500 characters'),

    body('taxId')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Tax ID must be less than 50 characters'),

    body('gstNumber')
        .optional()
        .trim()
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$|^$/)
        .withMessage('Invalid GST number format'),

    body('bankDetails.bankName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Bank name must be less than 100 characters'),

    body('bankDetails.accountNumber')
        .optional()
        .trim()
        .matches(/^[0-9]{8,20}$|^$/)
        .withMessage('Account number must be 8-20 digits'),

    body('bankDetails.ifscCode')
        .optional()
        .trim()
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$|^$/i)
        .withMessage('Invalid IFSC code format'),

    body('bankDetails.branch')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Branch name must be less than 100 characters')
];

/**
 * Middleware to apply step-aware validation
 * Dynamically selects validators based on the step query parameter
 */
exports.stepAwareValidation = (req, res, next) => {
    const step = req.query.step?.toLowerCase();
    let validators = [];

    switch (step) {
        case 'basic':
            validators = exports.validateBasicInfo;
            break;
        case 'contact':
            validators = exports.validateContactInfo;
            break;
        case 'administrative':
            validators = exports.validateAdministrativeInfo;
            break;
        case 'academic':
            validators = exports.validateAcademicInfo;
            break;
        case 'timings':
            validators = exports.validateTimingsInfo;
            break;
        case 'policies':
            validators = exports.validatePoliciesInfo;
            break;
        case 'optional':
            validators = exports.validateOptionalInfo;
            break;
        default:
            // No step specified - apply all validators
            validators = [
                ...exports.validateBasicInfo,
                ...exports.validateContactInfo,
                ...exports.validateAdministrativeInfo,
                ...exports.validateAcademicInfo,
                ...exports.validateTimingsInfo,
                ...exports.validatePoliciesInfo,
                ...exports.validateOptionalInfo
            ];
    }

    // Run validators
    Promise.all(validators.map(validator => validator.run(req)))
        .then(() => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            next();
        })
        .catch(next);
};
