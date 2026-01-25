const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { requireSuperAdmin } = require('../middleware/auth');

router.post(
  '/login',
  [
    body('email').trim().notEmpty().isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  superAdminController.login
);

router.get('/schools', requireSuperAdmin, superAdminController.listSchools);
router.get('/schools/:schoolId', requireSuperAdmin, superAdminController.getSchool);
router.post('/schools/:schoolId/approve', requireSuperAdmin, superAdminController.approve);
router.post('/schools/:schoolId/reject', requireSuperAdmin, superAdminController.reject);

module.exports = router;
