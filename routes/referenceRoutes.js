const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const shell = require('../controllers/schoolShellController');

/** Global academic year catalog (platform reference data) */
router.get('/academic-years', protect, shell.listReferenceAcademicYears);

module.exports = router;
