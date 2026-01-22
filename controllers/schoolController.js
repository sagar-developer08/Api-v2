const School = require('../models/School');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');


// Step 1: Create School - School Details
exports.createSchoolDetails = async (req, res) => {
  try {
    const {
      schoolName,
      schoolCode,
      schoolType,
      boardAffiliation,
      mediumOfInstruction,
      academicYearStartMonth,
      establishmentYear
    } = req.body;

    // Check if school code already exists
    const existingSchool = await School.findOne({ schoolCode: schoolCode.toUpperCase() });
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'School code already exists'
      });
    }

    const school = await School.create({
      schoolName,
      schoolCode: schoolCode.toUpperCase(),
      schoolType,
      boardAffiliation,
      mediumOfInstruction,
      academicYearStartMonth,
      establishmentYear,
      registrationStep: 1
    });

    res.status(201).json({
      success: true,
      message: 'School details saved successfully',
      data: {
        schoolId: school._id,
        registrationStep: school.registrationStep
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating school details',
      error: error.message
    });
  }
};

// Step 2: Update Address & Contact
exports.updateAddressContact = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      addressLine1,
      addressLine2,
      city,
      district,
      state,
      pincode,
      country,
      timezone,
      officialEmail,
      primaryPhoneNumber,
      alternatePhoneNumber,
      websiteURL
    } = req.body;

    // Check if official email already exists
    if (officialEmail) {
      const existingSchool = await School.findOne({
        officialEmail: officialEmail.toLowerCase(),
        _id: { $ne: schoolId }
      });
      if (existingSchool) {
        return res.status(400).json({
          success: false,
          message: 'Official email already exists'
        });
      }
    }

    const school = await School.findByIdAndUpdate(
      schoolId,
      {
        addressLine1,
        addressLine2,
        city,
        district,
        state,
        pincode,
        country: country || 'India',
        timezone: timezone || 'Asia/Kolkata',
        officialEmail: officialEmail?.toLowerCase(),
        primaryPhoneNumber,
        alternatePhoneNumber,
        websiteURL,
        registrationStep: 2
      },
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Address and contact details saved successfully',
      data: {
        schoolId: school._id,
        registrationStep: school.registrationStep
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating address and contact',
      error: error.message
    });
  }
};

// Step 3: Create Admin Account
exports.createAdminAccount = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      adminFullName,
      adminEmail,
      adminMobileNumber,
      password
    } = req.body;

    // Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Check if admin email already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin email already exists'
      });
    }

    // Check if mobile number already exists
    const existingMobile = await Admin.findOne({ mobileNumber: adminMobileNumber });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already exists'
      });
    }

    // Create admin
    const admin = await Admin.create({
      fullName: adminFullName,
      email: adminEmail.toLowerCase(),
      mobileNumber: adminMobileNumber,
      password,
      schoolId
    });

    // Update school with admin reference
    school.adminId = admin._id;
    school.registrationStep = 3;
    await school.save();

    // Generate token
    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        admin: {
          id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          mobileNumber: admin.mobileNumber
        },
        schoolId: school._id,
        registrationStep: school.registrationStep,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating admin account',
      error: error.message
    });
  }
};

// Step 4: Update Legal & Setup
exports.updateLegalSetup = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      schoolRegistrationNumber,
      affiliationNumber,
      udiseCode,
      gstNumber,
      panNumber,
      trustSocietyName,
      classesOffered,
      streams,
      sectionsPerClass,
      gradingSystem,
      examPattern
    } = req.body;

    const school = await School.findByIdAndUpdate(
      schoolId,
      {
        schoolRegistrationNumber,
        affiliationNumber,
        udiseCode,
        gstNumber: gstNumber?.toUpperCase(),
        panNumber: panNumber?.toUpperCase(),
        trustSocietyName,
        classesOffered,
        streams,
        sectionsPerClass,
        gradingSystem,
        examPattern,
        registrationStep: 4
      },
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Legal and setup details saved successfully',
      data: {
        schoolId: school._id,
        registrationStep: school.registrationStep
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating legal and setup details',
      error: error.message
    });
  }
};

// Step 5: Update Modules & Plan (Optional - can be added later)
exports.updateModulesPlan = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { modules, plan } = req.body;

    const school = await School.findByIdAndUpdate(
      schoolId,
      {
        modules: modules || [],
        plan: plan || 'Basic',
        registrationStep: 5,
        isRegistrationComplete: true,
        isActive: true
      },
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Registration completed successfully',
      data: {
        schoolId: school._id,
        registrationStep: school.registrationStep,
        isRegistrationComplete: school.isRegistrationComplete
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating modules and plan',
      error: error.message
    });
  }
};

// Get school registration status
exports.getSchoolStatus = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const school = await School.findById(schoolId)
      .select('-__v')
      .populate('adminId', 'fullName email mobileNumber');

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.status(200).json({
      success: true,
      data: school
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching school status',
      error: error.message
    });
  }
};
