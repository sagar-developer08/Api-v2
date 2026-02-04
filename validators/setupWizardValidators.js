const { body } = require('express-validator');

const CLASS_OPTIONS = [
  'Pre-KG', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

exports.validateStep1 = [
  body('schoolName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('School name must be 2–200 characters'),
  body('schoolType')
    .optional()
    .isIn(['School', 'College', 'Institute'])
    .withMessage('Invalid school type'),
  body('boardCurriculum')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 80 }),
  body('academicYearStartMonth')
    .optional()
    .isIn(MONTHS)
    .withMessage('Invalid month')
];

exports.validateStep2 = [
  body('academicYear')
    .optional()
    .trim()
    .matches(/^\d{4}\s*[-–]\s*\d{4}$/)
    .withMessage('Use format YYYY-YYYY (e.g. 2026-2027)'),
  body('classesOffered')
    .optional()
    .isArray()
    .withMessage('classesOffered must be an array'),
  body('classesOffered.*')
    .optional()
    .isIn(CLASS_OPTIONS)
    .withMessage('Invalid class name'),
  body('defaultSections')
    .optional()
    .isArray()
    .withMessage('defaultSections must be an array'),
  body('defaultSections.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
];

exports.validateStep3 = [
  body('branches')
    .isArray()
    .withMessage('branches must be an array of objects with name, city, and isMain'),
  body('branches.*.name')
    .notEmpty()
    .withMessage('Branch name is required')
    .trim()
    .isLength({ max: 200 }),
  body('branches.*.city')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body('branches.*.isMain')
    .optional()
    .isBoolean()
];
