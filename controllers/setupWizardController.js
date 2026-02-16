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
    const school = await findSchoolByIdOrCode(req.params.schoolId, SETUP_WIZARD_SCHOOL_SELECT);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    if (req.admin.schoolId.toString() !== school._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this school' });
    }
    if (school.setupLocked) {
      const [academicYears, classes, sections, branches] = await Promise.all([
        AcademicYear.find({ schoolId: school._id }).lean(),
        Class.find({ schoolId: school._id }).sort({ order: 1 }).lean(),
        Section.find({ schoolId: school._id }).lean(),
        Branch.find({ schoolId: school._id }).lean()
      ]);
      return res.status(200).json({
        success: true,
        data: {
          ...school.toObject(),
          academicYears,
          classes,
          sections,
          branches,
          readOnly: true
        }
      });
    }

    const [academicYears, classes, sections, branches] = await Promise.all([
      AcademicYear.find({ schoolId: school._id }).lean(),
      Class.find({ schoolId: school._id }).sort({ order: 1 }).lean(),
      Section.find({ schoolId: school._id }).lean(),
      Branch.find({ schoolId: school._id }).lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...school.toObject(),
        academicYears,
        classes,
        sections,
        branches
      }
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

    const { academicYear, classesOffered, defaultSections } = req.body;

    let defaultAcademicYearId = null;
    if (academicYear) {
      const parsed = parseAcademicYearLabel(academicYear);
      if (parsed) {
        await AcademicYear.deleteMany({ schoolId: school._id });
        const academicYearDoc = await AcademicYear.create({
          schoolId: school._id,
          label: academicYear.trim(),
          startYear: parsed.startYear,
          endYear: parsed.endYear,
          isDefault: true
        });
        defaultAcademicYearId = academicYearDoc._id;
      }
    }

    // Delete existing classes and sections (sections depend on classes)
    await Section.deleteMany({ schoolId: school._id });
    await Class.deleteMany({ schoolId: school._id });

    if (Array.isArray(classesOffered) && classesOffered.length) {
      const valid = classesOffered.filter((c) => CLASS_OPTIONS.includes(c));
      const sectionNames = Array.isArray(defaultSections) && defaultSections.length
        ? defaultSections.slice(0, 10).map((s) => String(s).trim()).filter(Boolean)
        : [];

      const toInsert = valid.map((name, i) => ({
        schoolId: school._id,
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
    
    // Validate that at least one branch is marked as main, or if not, use the first one
    if (!branches || !Array.isArray(branches) || branches.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one branch in "branches" array' });
    }

    // Prepare branches for insertion.
    // Logic: 
    // 1. Delete all existing branches for this school.
    // 2. Insert new ones.
    // Ensure exactly one main branch. Prioritize user input "isMain": true. 
    // If multiple are main, pick first. If none, pick first index.

    let hasMain = branches.find(b => b.isMain === true);
    
    const toCreate = branches.map((b, index) => {
      let isMain = false;
      if (hasMain) {
        if (b === hasMain) isMain = true; // Use reference equality from find
        // Wait, reference equality might fail if body is parsed fresh? find returns one of them.
        // Safer:
      } else {
        if (index === 0) isMain = true;
      }
      return {
        schoolId: school._id,
        name: b.name.trim(),
        city: (b.city || '').trim(),
        isMain: b.isMain === true || (!hasMain && index === 0) // If user marked this true, or if no main existed and this is first
      };
    });

    // Fix double mains just in case logic above was loose (it's not, but let's be strict):
    // Actually, simply:
    const finalBranches = [];
    let mainFound = false;
    for (const b of branches) {
        const isMain = b.isMain === true;
        if (isMain && !mainFound) {
            mainFound = true;
            finalBranches.push({ schoolId: school._id, name: b.name.trim(), city: (b.city || '').trim(), isMain: true });
        } else {
            finalBranches.push({ schoolId: school._id, name: b.name.trim(), city: (b.city || '').trim(), isMain: false });
        }
    }
    // If none marked main so far, make the first one main
    if (!mainFound && finalBranches.length > 0) {
        finalBranches[0].isMain = true;
    }

    await Branch.deleteMany({ schoolId: school._id });
    await Branch.insertMany(finalBranches);

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
