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

exports.getSetupWizard = async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId)
      .select('schoolName schoolCode status setupWizardStep setupLocked schoolType boardCurriculum country state city timezone academicYearStartMonth');
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    if (school.adminId?.toString() !== req.admin._id.toString()) {
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
    const school = await School.findById(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    if (school.adminId?.toString() !== req.admin._id.toString()) {
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
    const school = await School.findById(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    if (school.adminId?.toString() !== req.admin._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (school.setupLocked) {
      return res.status(400).json({ success: false, message: 'Setup is locked' });
    }

    const { academicYear, classesOffered, defaultSections } = req.body;

    if (academicYear) {
      const parsed = parseAcademicYearLabel(academicYear);
      if (parsed) {
        await AcademicYear.deleteMany({ schoolId: school._id });
        await AcademicYear.create({
          schoolId: school._id,
          label: academicYear.trim(),
          startYear: parsed.startYear,
          endYear: parsed.endYear,
          isDefault: true
        });
      }
    }

    if (Array.isArray(classesOffered) && classesOffered.length) {
      const valid = classesOffered.filter((c) => CLASS_OPTIONS.includes(c));
      await Class.deleteMany({ schoolId: school._id });
      const toInsert = valid.map((name, i) => ({
        schoolId: school._id,
        name,
        order: i
      }));
      await Class.insertMany(toInsert);
    }

    if (Array.isArray(defaultSections) && defaultSections.length) {
      await Section.deleteMany({ schoolId: school._id });
      await Section.insertMany(
        defaultSections.slice(0, 10).map((name) => ({
          schoolId: school._id,
          name: String(name).trim()
        }))
      );
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
    const school = await School.findById(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    if (school.adminId?.toString() !== req.admin._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (school.setupLocked) {
      return res.status(400).json({ success: false, message: 'Setup is locked' });
    }

    const { mainBranchName, branchCity } = req.body;
    const name = (mainBranchName !== undefined ? String(mainBranchName).trim() : null) || school.schoolName;
    const city = branchCity !== undefined ? String(branchCity || '').trim() : '';

    let main = await Branch.findOne({ schoolId: school._id, isMain: true });
    if (main) {
      main.name = name;
      main.city = city;
      await main.save();
    } else {
      await Branch.create({
        schoolId: school._id,
        name,
        city,
        isMain: true
      });
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

exports.finishSetup = async (req, res) => {
  try {
    const school = await School.findById(req.params.schoolId);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    if (school.adminId?.toString() !== req.admin._id.toString()) {
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
    await school.save();

    res.status(200).json({
      success: true,
      message: 'Setup submitted. Waiting for admin approval.',
      data: {
        schoolId: school._id,
        status: school.status
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
