const { body, query, param } = require('express-validator');

// Validation for creating a student
exports.validateCreateStudent = [
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('First name must be between 1 and 100 characters'),

    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name must be between 1 and 100 characters'),

    body('middleName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Middle name must be less than 100 characters'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('phone')
        .optional()
        .trim()
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Phone number must be 10-15 digits'),

    body('alternatePhone')
        .optional()
        .trim()
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Alternate phone number must be 10-15 digits'),

    body('dateOfBirth')
        .notEmpty()
        .withMessage('Date of birth is required')
        .isISO8601()
        .withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),

    body('gender')
        .notEmpty()
        .withMessage('Gender is required')
        .isIn(['male', 'female', 'other', 'Male', 'Female', 'Other'])
        .withMessage('Gender must be male, female, or other'),

    body('bloodGroup')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''])
        .withMessage('Invalid blood group'),

    body('aadhaarNumber')
        .optional()
        .trim()
        .matches(/^[0-9]{4}-?[0-9]{4}-?[0-9]{4}$/)
        .withMessage('Aadhaar number must be 12 digits'),

    body('classId')
        .notEmpty()
        .withMessage('Class ID is required')
        .isMongoId()
        .withMessage('Invalid class ID'),

    body('sectionId')
        .notEmpty()
        .withMessage('Section ID is required')
        .isMongoId()
        .withMessage('Invalid section ID'),

    body('rollNumber')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Roll number must be less than 50 characters'),

    body('admissionNumber')
        .notEmpty()
        .withMessage('Admission number is required')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Admission number must be between 1 and 50 characters'),

    body('admissionDate')
        .optional()
        .isISO8601()
        .withMessage('Admission date must be a valid date'),

    body('academicYear')
        .optional()
        .trim()
        .matches(/^[0-9]{4}-[0-9]{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),

    body('address')
        .optional()
        .isObject()
        .withMessage('Address must be an object'),

    body('address.line1')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Address line 1 must be less than 200 characters'),

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

    body('address.pincode')
        .optional()
        .trim()
        .matches(/^[0-9]{5,10}$/)
        .withMessage('Pincode must be 5-10 digits'),

    body('address.country')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Country must be less than 100 characters')
];

// Validation for updating a student
exports.validateUpdateStudent = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name must be between 1 and 100 characters'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name must be between 1 and 100 characters'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('phone')
        .optional()
        .trim()
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Phone number must be 10-15 digits'),

    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date'),

    body('gender')
        .optional()
        .isIn(['male', 'female', 'other', 'Male', 'Female', 'Other'])
        .withMessage('Gender must be male, female, or other'),

    body('classId')
        .optional()
        .isMongoId()
        .withMessage('Invalid class ID'),

    body('sectionId')
        .optional()
        .isMongoId()
        .withMessage('Invalid section ID'),

    body('status')
        .optional()
        .isIn(['active', 'inactive', 'graduated', 'transferred', 'suspended'])
        .withMessage('Invalid status')
];

// Validation for student list query params
exports.validateStudentListQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('search')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Search term must be less than 100 characters'),

    query('classId')
        .optional()
        .isMongoId()
        .withMessage('Invalid class ID'),

    query('sectionId')
        .optional()
        .isMongoId()
        .withMessage('Invalid section ID'),

    query('status')
        .optional()
        .isIn(['active', 'inactive', 'graduated', 'transferred', 'suspended'])
        .withMessage('Invalid status'),

    query('academicYear')
        .optional()
        .trim()
        .matches(/^[0-9]{4}-[0-9]{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),

    query('sortBy')
        .optional()
        .isIn(['firstName', 'lastName', 'rollNumber', 'admissionDate', 'createdAt'])
        .withMessage('Invalid sort field'),

    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc')
];

// Validation for adding a guardian
exports.validateAddGuardian = [
    body('type')
        .notEmpty()
        .withMessage('Guardian type is required')
        .isIn(['father', 'mother', 'guardian'])
        .withMessage('Type must be father, mother, or guardian'),

    body('name')
        .trim()
        .notEmpty()
        .withMessage('Guardian name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),

    body('relationship')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Relationship must be less than 50 characters'),

    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Phone number must be 10-15 digits'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address must be less than 500 characters'),

    body('occupation')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Occupation must be less than 100 characters'),

    body('qualification')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Qualification must be less than 100 characters'),

    body('income')
        .optional()
        .isNumeric()
        .withMessage('Income must be a number'),

    body('isPrimary')
        .optional()
        .isBoolean()
        .withMessage('isPrimary must be true or false'),

    body('isEmergencyContact')
        .optional()
        .isBoolean()
        .withMessage('isEmergencyContact must be true or false')
];

// Validation for updating a guardian
exports.validateUpdateGuardian = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^\+?[0-9]{10,15}$/)
        .withMessage('Phone number must be 10-15 digits'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('isPrimary')
        .optional()
        .isBoolean()
        .withMessage('isPrimary must be true or false'),

    body('isEmergencyContact')
        .optional()
        .isBoolean()
        .withMessage('isEmergencyContact must be true or false')
];

// Validation for recording fee payment
exports.validateFeePayment = [
    body('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isNumeric()
        .withMessage('Amount must be a number')
        .custom(value => value > 0)
        .withMessage('Amount must be greater than 0'),

    body('paymentDate')
        .notEmpty()
        .withMessage('Payment date is required')
        .isISO8601()
        .withMessage('Payment date must be a valid date'),

    body('mode')
        .notEmpty()
        .withMessage('Payment mode is required')
        .isIn(['cash', 'online', 'cheque', 'dd', 'bank-transfer', 'upi'])
        .withMessage('Invalid payment mode'),

    body('transactionId')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Transaction ID must be less than 100 characters'),

    body('remarks')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Remarks must be less than 500 characters')
];

// Validation for adding academic record
exports.validateAddAcademicRecord = [
    body('academicYear')
        .notEmpty()
        .withMessage('Academic year is required')
        .matches(/^[0-9]{4}-[0-9]{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),

    body('examType')
        .notEmpty()
        .withMessage('Exam type is required')
        .isIn(['unit-test', 'mid-term', 'final', 'quarterly', 'half-yearly', 'annual', 'other'])
        .withMessage('Invalid exam type'),

    body('examName')
        .trim()
        .notEmpty()
        .withMessage('Exam name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Exam name must be between 1 and 100 characters'),

    body('examDate')
        .notEmpty()
        .withMessage('Exam date is required')
        .isISO8601()
        .withMessage('Exam date must be a valid date'),

    body('totalMarks')
        .notEmpty()
        .withMessage('Total marks is required')
        .isNumeric()
        .withMessage('Total marks must be a number')
        .custom(value => value > 0)
        .withMessage('Total marks must be greater than 0'),

    body('obtainedMarks')
        .notEmpty()
        .withMessage('Obtained marks is required')
        .isNumeric()
        .withMessage('Obtained marks must be a number')
        .custom(value => value >= 0)
        .withMessage('Obtained marks cannot be negative'),

    body('subjects')
        .optional()
        .isArray()
        .withMessage('Subjects must be an array'),

    body('subjects.*.subjectId')
        .optional()
        .isMongoId()
        .withMessage('Invalid subject ID'),

    body('subjects.*.marks')
        .optional()
        .isNumeric()
        .withMessage('Marks must be a number'),

    body('subjects.*.maxMarks')
        .optional()
        .isNumeric()
        .withMessage('Max marks must be a number')
];

// Validation for attendance query
exports.validateAttendanceQuery = [
    query('startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Start date must be a valid date'),

    query('endDate')
        .notEmpty()
        .withMessage('End date is required')
        .isISO8601()
        .withMessage('End date must be a valid date'),

    query('status')
        .optional()
        .isIn(['present', 'absent', 'late', 'on-leave', 'half-day'])
        .withMessage('Invalid attendance status')
];

// Validation for uploading document
exports.validateUploadDocument = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Document name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Document name must be between 1 and 100 characters'),

    body('type')
        .notEmpty()
        .withMessage('Document type is required')
        .isIn([
            'birth-certificate', 'aadhaar-card', 'transfer-certificate',
            'migration-certificate', 'mark-sheet', 'character-certificate',
            'medical-certificate', 'photograph', 'caste-certificate',
            'income-certificate', 'residence-proof', 'other'
        ])
        .withMessage('Invalid document type'),

    body('category')
        .optional()
        .isIn(['mandatory', 'optional'])
        .withMessage('Category must be mandatory or optional')
];

// Validation for assigning transport
exports.validateAssignTransport = [
    body('routeId')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Route ID must be less than 50 characters'),

    body('vehicleId')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Vehicle ID must be less than 50 characters'),

    body('pickupPoint')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Pickup point must be less than 200 characters'),

    body('dropPoint')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Drop point must be less than 200 characters')
];

// Validation for transfer/promote student
exports.validateTransferStudent = [
    body('targetClassId')
        .notEmpty()
        .withMessage('Target class ID is required')
        .isMongoId()
        .withMessage('Invalid target class ID'),

    body('targetSectionId')
        .notEmpty()
        .withMessage('Target section ID is required')
        .isMongoId()
        .withMessage('Invalid target section ID'),

    body('targetAcademicYear')
        .optional()
        .matches(/^[0-9]{4}-[0-9]{4}$/)
        .withMessage('Academic year must be in format YYYY-YYYY'),

    body('transferDate')
        .notEmpty()
        .withMessage('Transfer date is required')
        .isISO8601()
        .withMessage('Transfer date must be a valid date'),

    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Reason must be less than 500 characters'),

    body('remarks')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Remarks must be less than 500 characters')
];

// Validation for sending communication
exports.validateSendCommunication = [
    body('type')
        .notEmpty()
        .withMessage('Communication type is required')
        .isIn(['sms', 'email', 'notification', 'whatsapp'])
        .withMessage('Invalid communication type'),

    body('subject')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Subject must be less than 200 characters'),

    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters'),

    body('recipients')
        .optional()
        .isObject()
        .withMessage('Recipients must be an object'),

    body('recipients.student')
        .optional()
        .isBoolean()
        .withMessage('recipients.student must be true or false'),

    body('recipients.guardians')
        .optional()
        .isArray()
        .withMessage('recipients.guardians must be an array')
];

// Validation for MongoDB ObjectId param
exports.validateIdParam = [
    param('id')
        .isMongoId()
        .withMessage('Invalid student ID')
];

// Validation for guardian ID param
exports.validateGuardianIdParam = [
    param('guardianId')
        .isMongoId()
        .withMessage('Invalid guardian ID')
];
