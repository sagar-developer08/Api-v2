const express = require('express');
const router = express.Router();
const setupWizardController = require('../controllers/setupWizardController');
const {
  validateStep1,
  validateStep2,
  validateStep3
} = require('../validators/setupWizardValidators');
const { handleValidationErrors } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

router.get(
  '/:schoolId/setup-wizard',
  protect,
  setupWizardController.getSetupWizard
);

router.put(
  '/:schoolId/setup-wizard/step/1',
  protect,
  validateStep1,
  handleValidationErrors,
  setupWizardController.step1BasicInfo
);

router.put(
  '/:schoolId/setup-wizard/step/2',
  protect,
  validateStep2,
  handleValidationErrors,
  setupWizardController.step2AcademicStructure
);

router.put(
  '/:schoolId/setup-wizard/step/3',
  protect,
  validateStep3,
  handleValidationErrors,
  setupWizardController.step3BranchSetup
);

router.post(
  '/:schoolId/setup-wizard/finish',
  protect,
  setupWizardController.finishSetup
);

module.exports = router;
