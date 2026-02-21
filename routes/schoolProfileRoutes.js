const express = require('express');
const router = express.Router();
const schoolProfileController = require('../controllers/schoolProfileController');
const { stepAwareValidation } = require('../validators/schoolProfileValidators');
const { protect, requireApprovedSchool } = require('../middleware/auth');

/**
 * @route   GET /api/v1/school/profile
 * @desc    Fetch complete school profile grouped by wizard steps
 * @access  Private (Requires approved school admin)
 */
router.get(
    '/profile',
    protect,
    requireApprovedSchool,
    schoolProfileController.getSchoolProfile
);

/**
 * @route   GET /api/v1/school/profile/by-branch
 * @desc    Fetch school profile with branch & academic year context
 * @query   branchId? - optional branch ObjectId (falls back to admin.branchId)
 * @query   academicYearId? - optional academic year ObjectId
 * @access  Private (Requires approved school admin)
 */
router.get(
    '/profile/by-branch',
    protect,
    requireApprovedSchool,
    schoolProfileController.getSchoolProfileByBranch
);

/**
 * @route   PUT /api/v1/school/profile
 * @desc    Update school profile (step-aware)
 * @query   step - Optional: basic|contact|administrative|academic|timings|policies|optional
 * @access  Private (Requires approved school admin)
 */
router.put(
    '/profile',
    protect,
    requireApprovedSchool,
    stepAwareValidation,
    schoolProfileController.updateSchoolProfile
);

/**
 * @route   PATCH /api/v1/school/profile
 * @desc    Partially update school profile (step-aware)
 * @query   step - Optional: basic|contact|administrative|academic|timings|policies|optional
 * @access  Private (Requires approved school admin)
 */
router.patch(
    '/profile',
    protect,
    requireApprovedSchool,
    stepAwareValidation,
    schoolProfileController.updateSchoolProfile
);

module.exports = router;
