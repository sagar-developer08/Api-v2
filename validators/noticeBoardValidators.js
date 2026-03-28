const { query, param, validationResult } = require('express-validator');

function handleNoticeValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = {};
  for (const e of result.array()) {
    const key = e.path || e.param || 'form';
    if (!errors[key]) errors[key] = [];
    errors[key].push(e.msg);
  }
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors
  });
}

const listQuery = [
  query('category').optional().isString(),
  query('status')
    .optional()
    .isIn(['all', 'draft', 'active', 'scheduled', 'expired']),
  query('q').optional().isString(),
  query('sort').optional().isIn(['postAt_desc', 'postAt_asc']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('counts').optional().isString()
];

const noticeIdParam = [
  param('noticeId').isMongoId().withMessage('Invalid notice id')
];

const schoolIdParam = [
  param('schoolId').isMongoId().withMessage('Invalid school id')
];

const STORED_WRITE_STATUSES = ['draft', 'active', 'scheduled'];

module.exports = {
  handleNoticeValidationErrors,
  listQuery,
  noticeIdParam,
  schoolIdParam,
  STORED_WRITE_STATUSES
};
