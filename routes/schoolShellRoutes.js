const express = require('express');
const router = express.Router();
const { protect, requireApprovedSchool } = require('../middleware/auth');
const shell = require('../controllers/schoolShellController');

router.use(protect, requireApprovedSchool);

router.get('/:schoolId/branches', shell.listSchoolBranches);
router.get('/:schoolId/academic-years', shell.listSchoolAcademicYears);
router.get('/:schoolId/context', shell.getSchoolContext);
router.patch('/:schoolId/preferences', shell.patchSchoolPreferences);

module.exports = router;
