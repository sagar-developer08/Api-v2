const express = require('express');
const router = express.Router();
const { protect, requireApprovedSchool } = require('../middleware/auth');
const org = require('../controllers/orgStructureController');

router.use(protect, requireApprovedSchool);

router.get('/:schoolId/departments', org.listDepartments);
router.post('/:schoolId/departments', org.createDepartment);
router.patch('/:schoolId/departments/:departmentId', org.patchDepartment);
router.delete('/:schoolId/departments/:departmentId', org.deleteDepartment);

router.get('/:schoolId/designations', org.listDesignations);
router.post('/:schoolId/designations', org.createDesignation);
router.patch('/:schoolId/designations/:designationId', org.patchDesignation);
router.delete('/:schoolId/designations/:designationId', org.deleteDesignation);

module.exports = router;
