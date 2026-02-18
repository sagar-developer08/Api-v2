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

router.get('/dashboard', requireSuperAdmin, superAdminController.getDashboard);
router.get('/schools', requireSuperAdmin, superAdminController.listSchools);
router.post('/schools', requireSuperAdmin, superAdminController.createSchool);
router.get('/schools/:schoolId', requireSuperAdmin, superAdminController.getSchool);
router.put('/schools/:schoolId', requireSuperAdmin, superAdminController.updateSchool);
router.delete('/schools/:schoolId', requireSuperAdmin, superAdminController.deleteSchool);
router.post('/schools/:schoolId/approve', requireSuperAdmin, superAdminController.approve);
router.post('/schools/:schoolId/reject', requireSuperAdmin, superAdminController.reject);

router.get('/users', requireSuperAdmin, superAdminController.listUsers);
router.get('/users/:id', requireSuperAdmin, superAdminController.getUser);
router.post('/users', requireSuperAdmin, superAdminController.createUser);
router.put('/users/:id', requireSuperAdmin, superAdminController.updateUser);
router.delete('/users/:id', requireSuperAdmin, superAdminController.deleteUser);

router.get('/feature-config/:tenantId', requireSuperAdmin, superAdminController.getFeatureConfig);
router.put('/feature-config/:tenantId', requireSuperAdmin, superAdminController.updateFeatureConfig);

router.get('/settings', requireSuperAdmin, superAdminController.getSettings);
router.put('/settings', requireSuperAdmin, superAdminController.updateSettings);

// Platform Operations
router.get('/platform-ops/jobs', requireSuperAdmin, superAdminController.getPlatformOpsJobs);
router.post('/platform-ops/jobs/:jobId/retry', requireSuperAdmin, superAdminController.retryPlatformJob);
router.get('/platform-ops/queues', requireSuperAdmin, superAdminController.getPlatformOpsQueues);
router.get('/platform-ops/cron-jobs', requireSuperAdmin, superAdminController.getPlatformOpsCronJobs);
router.get('/platform-ops/maintenance', requireSuperAdmin, superAdminController.getMaintenance);
router.post('/platform-ops/maintenance', requireSuperAdmin, superAdminController.setMaintenance);

// Audit Logs
router.get('/audit-logs', requireSuperAdmin, superAdminController.getAuditLogs);

// Support
router.get('/support/health', requireSuperAdmin, superAdminController.getSupportHealth);
router.get('/support/issues', requireSuperAdmin, superAdminController.getSupportIssues);
router.get('/support/notes/:tenantId', requireSuperAdmin, superAdminController.getSupportNotes);
router.post('/support/notes', requireSuperAdmin, superAdminController.createSupportNote);
router.get('/support/impersonations', requireSuperAdmin, superAdminController.getImpersonations);
router.post('/support/impersonations', requireSuperAdmin, superAdminController.startImpersonation);

module.exports = router;
