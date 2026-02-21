const School = require('../models/School');
const AcademicYear = require('../models/AcademicYear');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Branch = require('../models/Branch');

const CLASS_OPTIONS = [
  'Pre-KG', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

function parseAcademicYearLabel(label) {
  const match = (label || '').match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
  if (match) return { startYear: parseInt(match[1], 10), endYear: parseInt(match[2], 10) };
  return null;
}

/** Resolve school by ObjectId (24 hex chars) or schoolCode (e.g. I0F5HAZZ). Returns Mongoose query (thenable). Optional select fields for projection. */
function findSchoolByIdOrCode(param, selectFields = null) {
  if (!param || typeof param !== 'string') return null;
  const trimmed = param.trim();
  let query;
  if (/^[a-fA-F0-9]{24}$/.test(trimmed)) {
    query = School.findById(trimmed);
  } else {
    query = School.findOne({ schoolCode: trimmed.toUpperCase() });
  }
  if (selectFields) {
    query = query.select(selectFields);
  }
  return query;
}

const SETUP_WIZARD_SCHOOL_SELECT = 'schoolName schoolCode status setupWizardStep setupLocked isSetup schoolType boardCurriculum country state city timezone academicYearStartMonth adminId';

exports.getSetupWizard = async (req, res) => {
  try {
    const schoolQuery = findSchoolByIdOrCode(req.params.schoolId, SETUP_WIZARD_SCHOOL_SELECT);
    const school = schoolQuery
      ? await schoolQuery.populate('adminId', 'fullName email mobileNumber')
      : null;
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    if (req.admin.schoolId.toString() !== school._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this school' });
    }
    const [academicYears, classes, sections, branches] = await Promise.all([
      AcademicYear.find({
        schoolId: school._id,
        branchId: { $ne: null }
      })
        .populate('schoolId', 'schoolName schoolCode')
        .populate('branchId', 'name city isMain')
        .lean(),
      Class.find({
        schoolId: school._id,
        branchId: { $ne: null }
      })
        .sort({ order: 1 })
        .populate('schoolId', 'schoolName schoolCode')
        .populate('branchId', 'name city isMain')
        .populate('academicYearId', 'label startYear endYear')
        .lean(),
      Section.find({
        schoolId: school._id,
        branchId: { $ne: null },
        classId: { $ne: null }
      })
        .populate('schoolId', 'schoolName schoolCode')
        .populate('branchId', 'name city isMain')
        .populate('classId', 'name code')
        .lean(),
      Branch.find({
        schoolId: school._id
      })
        .populate('schoolId', 'schoolName schoolCode')
        .lean()
    ]);

    const responseData = {
      ...school.toObject(),
      academicYears,
      classes,
      sections,
      branches
    };

    if (school.setupLocked) {
      responseData.readOnly = true;
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching setup wizard',
      error: error.message
    });
  }
};

exports.step1BasicInfo = async (req, res) => {
  try {
    const school = await findSchoolByIdOrCode(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    if (req.admin.schoolId.toString() !== school._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (school.setupLocked) {
      return res.status(400).json({ success: false, message: 'Setup is locked' });
    }

    const {
      schoolName,
      schoolType,
      boardCurriculum,
      country,
      state,
      city,
      timezone,
      academicYearStartMonth
    } = req.body;

    school.schoolName = schoolName !== undefined ? schoolName : school.schoolName;
    school.schoolType = schoolType !== undefined ? schoolType : school.schoolType;
    school.boardCurriculum = boardCurriculum !== undefined ? boardCurriculum : school.boardCurriculum;
    school.country = country !== undefined ? country : school.country;
    school.state = state !== undefined ? state : school.state;
    school.city = city !== undefined ? city : school.city;
    school.timezone = timezone !== undefined ? timezone : school.timezone;
    school.academicYearStartMonth = academicYearStartMonth !== undefined ? academicYearStartMonth : school.academicYearStartMonth;
    school.setupWizardStep = Math.max(school.setupWizardStep, 1);
    await school.save();

    res.status(200).json({
      success: true,
      message: 'Basic information saved',
      data: { schoolId: school._id, setupWizardStep: school.setupWizardStep }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving basic info',
      error: error.message
    });
  }
};

exports.step2AcademicStructure = async (req, res) => {
  try {
    const school = await findSchoolByIdOrCode(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    if (req.admin.schoolId.toString() !== school._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (school.setupLocked) {
      return res.status(400).json({ success: false, message: 'Setup is locked' });
    }

    // Ensure at least one branch exists (main) for academic structure; step3 can add more later
    let mainBranch = await Branch.findOne({ schoolId: school._id, isMain: true });
    if (!mainBranch) {
      mainBranch = await Branch.create({
        schoolId: school._id,
        name: 'Main',
        city: '',
        isMain: true
      });
    }
    const branchId = mainBranch._id;

    const { academicYear, classesOffered, defaultSections } = req.body;

    let defaultAcademicYearId = null;
    if (academicYear) {
      const parsed = parseAcademicYearLabel(academicYear);
      if (parsed) {
        await AcademicYear.deleteMany({ schoolId: school._id, branchId });
        const academicYearDoc = await AcademicYear.create({
          schoolId: school._id,
          branchId,
          label: academicYear.trim(),
          startYear: parsed.startYear,
          endYear: parsed.endYear,
          isDefault: true
        });
        defaultAcademicYearId = academicYearDoc._id;
      }
    }

    // Delete existing classes and sections (sections depend on classes) for this branch
    await Section.deleteMany({ schoolId: school._id, branchId });
    await Class.deleteMany({ schoolId: school._id, branchId });

    if (Array.isArray(classesOffered) && classesOffered.length) {
      const valid = classesOffered.filter((c) => CLASS_OPTIONS.includes(c));
      const sectionNames = Array.isArray(defaultSections) && defaultSections.length
        ? defaultSections.slice(0, 10).map((s) => String(s).trim()).filter(Boolean)
        : [];

      const toInsert = valid.map((name, i) => ({
        schoolId: school._id,
        branchId,
        name,
        order: i,
        academicYearId: defaultAcademicYearId
      }));
      const createdClasses = await Class.insertMany(toInsert);

      // Create sections for each class (each class gets sections A, B, C, etc.)
      const sectionsToInsert = [];
      for (const cls of createdClasses) {
        for (const sectionName of sectionNames) {
          sectionsToInsert.push({
            schoolId: school._id,
            branchId,
            classId: cls._id,
            name: sectionName,
            code: sectionName
          });
        }
      }
      if (sectionsToInsert.length) {
        await Section.insertMany(sectionsToInsert);
      }
    }

    school.setupWizardStep = Math.max(school.setupWizardStep, 2);
    await school.save();

    res.status(200).json({
      success: true,
      message: 'Academic structure saved',
      data: { schoolId: school._id, setupWizardStep: school.setupWizardStep }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving academic structure',
      error: error.message
    });
  }
};

exports.step3BranchSetup = async (req, res) => {
  try {
    const school = await findSchoolByIdOrCode(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    if (req.admin.schoolId.toString() !== school._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (school.setupLocked) {
      return res.status(400).json({ success: false, message: 'Setup is locked' });
    }

    const { branches } = req.body;

    // Validate that at least one branch is provided
    if (!branches || !Array.isArray(branches) || branches.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one branch in "branches" array' });
    }

    // Find existing main branch created in step 2 (used by academic years / classes / sections)
    let mainBranch = await Branch.findOne({ schoolId: school._id, isMain: true });

    // Determine which incoming branch should be main (prefer explicit isMain, otherwise first)
    let mainIndex = branches.findIndex(b => b.isMain === true);
    if (mainIndex === -1) mainIndex = 0;

    const mainBranchPayload = branches[mainIndex];

    if (!mainBranch) {
      // If somehow no main branch exists (edge case), create one now
      mainBranch = new Branch({
        schoolId: school._id,
        name: mainBranchPayload.name.trim(),
        city: (mainBranchPayload.city || '').trim(),
        isMain: true
      });
    } else {
      // Reuse existing main branch so that all academic data referencing it remains valid
      mainBranch.name = mainBranchPayload.name.trim();
      mainBranch.city = (mainBranchPayload.city || '').trim();
      mainBranch.isMain = true;
    }

    await mainBranch.save();

    // Remove all non-main branches; we'll recreate them from the payload
    await Branch.deleteMany({ schoolId: school._id, _id: { $ne: mainBranch._id } });

    // Create secondary branches (all except the chosen main index)
    const secondaryBranches = branches
      .map((b, index) => ({ b, index }))
      .filter(({ index }) => index !== mainIndex)
      .map(({ b }) => ({
        schoolId: school._id,
        name: b.name.trim(),
        city: (b.city || '').trim(),
        isMain: false
      }));

    if (secondaryBranches.length > 0) {
      await Branch.insertMany(secondaryBranches);
    }

    school.setupWizardStep = Math.max(school.setupWizardStep, 3);
    await school.save();

    res.status(200).json({
      success: true,
      message: 'Branch setup saved',
      data: { schoolId: school._id, setupWizardStep: school.setupWizardStep }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving branch setup',
      error: error.message
    });
  }
};

/**
 * Create academic structure (academic year, classes, default sections) for a specific branch.
 * Use this for second or other branches after initial setup.
 * Body: { academicYear?, classesOffered, defaultSections } (same as Step 2).
 */
exports.createBranchAcademicStructure = async (req, res) => {
  try {
    const school = await findSchoolByIdOrCode(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    if (req.admin.schoolId.toString() !== school._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const branchId = req.params.branchId;
    const branch = await Branch.findOne({ _id: branchId, schoolId: school._id });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    if (req.branchFilter && req.branchFilter.branchId && req.branchFilter.branchId.toString() !== branchId) {
      return res.status(403).json({ success: false, message: 'You can only set up academic structure for your branch' });
    }

    const { academicYear, classesOffered, defaultSections } = req.body;

    if (!Array.isArray(classesOffered) || classesOffered.length === 0) {
      return res.status(400).json({ success: false, message: 'classesOffered array is required and must not be empty' });
    }

    let defaultAcademicYearId = null;
    if (academicYear) {
      const parsed = parseAcademicYearLabel(academicYear);
      if (parsed) {
        await AcademicYear.deleteMany({ schoolId: school._id, branchId });
        const academicYearDoc = await AcademicYear.create({
          schoolId: school._id,
          branchId,
          label: academicYear.trim(),
          startYear: parsed.startYear,
          endYear: parsed.endYear,
          isDefault: true
        });
        defaultAcademicYearId = academicYearDoc._id;
      }
    }

    await Section.deleteMany({ schoolId: school._id, branchId });
    await Class.deleteMany({ schoolId: school._id, branchId });

    const valid = classesOffered.filter((c) => CLASS_OPTIONS.includes(c));
    const sectionNames = Array.isArray(defaultSections) && defaultSections.length
      ? defaultSections.slice(0, 10).map((s) => String(s).trim()).filter(Boolean)
      : [];

    const toInsert = valid.map((name, i) => ({
      schoolId: school._id,
      branchId,
      name,
      order: i,
      academicYearId: defaultAcademicYearId
    }));
    const createdClasses = await Class.insertMany(toInsert);

    const sectionsToInsert = [];
    for (const cls of createdClasses) {
      for (const sectionName of sectionNames) {
        sectionsToInsert.push({
          schoolId: school._id,
          branchId,
          classId: cls._id,
          name: sectionName,
          code: sectionName
        });
      }
    }
    if (sectionsToInsert.length) {
      await Section.insertMany(sectionsToInsert);
    }

    res.status(201).json({
      success: true,
      message: 'Academic structure created for branch',
      data: {
        branchId,
        branchName: branch.name,
        classesCreated: createdClasses.length,
        sectionsCreated: sectionsToInsert.length,
        academicYearId: defaultAcademicYearId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating branch academic structure',
      error: error.message
    });
  }
};

exports.finishSetup = async (req, res) => {
  try {
    const school = await findSchoolByIdOrCode(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    if (req.admin.schoolId.toString() !== school._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (school.setupLocked) {
      return res.status(400).json({ success: false, message: 'Setup already submitted' });
    }

    const mainBranch = await Branch.findOne({ schoolId: school._id, isMain: true });
    if (!mainBranch) {
      return res.status(400).json({
        success: false,
        message: 'At least one branch (main) is required. Complete Step 3.'
      });
    }

    school.status = 'Pending Admin Approval';
    school.setupWizardStep = 4;
    school.setupLocked = true;
    school.isSetup = true;
    await school.save();

    res.status(200).json({
      success: true,
      message: 'Setup submitted. Waiting for admin approval.',
      data: {
        schoolId: school._id,
        status: school.status,
        isSetup: school.isSetup
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting setup',
      error: error.message
    });
  }
};
