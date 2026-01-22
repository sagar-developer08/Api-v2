const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const {
  validateSchoolDetails,
  validateAddressContact,
  validateAdminAccount,
  validateLegalSetup
} = require('../validators/schoolValidators');
const { handleValidationErrors } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// Step 1: Create School - School Details
router.post(
  '/',
  validateSchoolDetails,
  handleValidationErrors,
  schoolController.createSchoolDetails
);

// Step 2: Update Address & Contact
router.put(
  '/:schoolId/address-contact',
  validateAddressContact,
  handleValidationErrors,
  schoolController.updateAddressContact
);

// Step 3: Create Admin Account
router.post(
  '/:schoolId/admin',
  validateAdminAccount,
  handleValidationErrors,
  schoolController.createAdminAccount
);

// Step 4: Update Legal & Setup
router.put(
  '/:schoolId/legal-setup',
  protect,
  validateLegalSetup,
  handleValidationErrors,
  schoolController.updateLegalSetup
);

// Step 5: Update Modules & Plan
router.put(
  '/:schoolId/modules-plan',
  protect,
  schoolController.updateModulesPlan
);

// Get school registration status
router.get(
  '/:schoolId/status',
  protect,
  schoolController.getSchoolStatus
);

module.exports = router;
