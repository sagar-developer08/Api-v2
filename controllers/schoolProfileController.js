const School = require('../models/School');
const AcademicYear = require('../models/AcademicYear');

/**
 * Helper function to format school data into wizard step groups
 */
function formatSchoolProfile(school, academicYears = []) {
    return {
        basicInfo: {
            schoolLogo: school.schoolLogo || null,
            schoolName: school.schoolName || null,
            schoolCode: school.schoolCode || null,
            establishmentYear: school.establishmentYear || null,
            schoolType: school.schoolType || null,
            boardAffiliation: school.boardAffiliation || null,
            schoolCategory: school.schoolCategory || null,
            recognitionNumber: school.recognitionNumber || null,
            affiliationNumber: school.affiliationNumber || null
        },
        contactInfo: {
            primaryEmail: school.primaryEmail || null,
            secondaryEmail: school.secondaryEmail || null,
            primaryPhone: school.primaryPhone || null,
            secondaryPhone: school.secondaryPhone || null,
            website: school.website || null,
            address: {
                line1: school.address?.line1 || null,
                line2: school.address?.line2 || null,
                city: school.address?.city || school.city || null,
                state: school.address?.state || school.state || null,
                country: school.address?.country || school.country || null,
                pinCode: school.address?.pinCode || null
            }
        },
        administrativeInfo: {
            principal: {
                name: school.principal?.name || null,
                email: school.principal?.email || null,
                contactNumber: school.principal?.contactNumber || null
            },
            adminOfficer: {
                name: school.adminOfficer?.name || null,
                contactNumber: school.adminOfficer?.contactNumber || null
            },
            totalStudentCapacity: school.totalStudentCapacity || null,
            currentAcademicYear: school.currentAcademicYear || null
        },
        academicInfo: {
            classesOffered: school.classesOffered?.length ? school.classesOffered : [],
            sectionsPerClass: school.sectionsPerClass?.length ? school.sectionsPerClass : [],
            mediumOfInstruction: school.mediumOfInstruction?.length ? school.mediumOfInstruction : [],
            workingDays: school.workingDays?.length ? school.workingDays : [],
            defaultGradingSystem: school.defaultGradingSystem || null,
            academicYears: academicYears.map(ay => ({
                _id: ay._id,
                year: ay.label,
                startDate: ay.startDate || null,
                endDate: ay.endDate || null,
                status: ay.status || 'Active'
            }))
        },
        timingsInfo: {
            schoolStartTime: school.schoolStartTime || null,
            schoolEndTime: school.schoolEndTime || null,
            periodDuration: school.periodDuration || null,
            lunchStartTime: school.lunchStartTime || null,
            lunchEndTime: school.lunchEndTime || null
        },
        policiesInfo: {
            minAttendancePercentage: school.minAttendancePercentage || null,
            policies: {
                attendancePolicy: school.policies?.attendancePolicy || null,
                promotionRules: school.policies?.promotionRules || null,
                examGradingPolicy: school.policies?.examGradingPolicy || null,
                leavePolicy: school.policies?.leavePolicy || null,
                feePolicy: school.policies?.feePolicy || null,
                disciplineCode: school.policies?.disciplineCode || null
            }
        },
        optionalInfo: {
            schoolMotto: school.schoolMotto || null,
            taxId: school.taxId || null,
            gstNumber: school.gstNumber || null,
            bankDetails: {
                bankName: school.bankDetails?.bankName || null,
                accountNumber: school.bankDetails?.accountNumber || null,
                ifscCode: school.bankDetails?.ifscCode || null,
                branch: school.bankDetails?.branch || null
            }
        }
    };
}

/**
 * GET /api/v1/school/profile
 * Fetch the complete school profile grouped by wizard steps
 */
exports.getSchoolProfile = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin || !admin.schoolId) {
            return res.status(403).json({
                success: false,
                message: 'School admin access required'
            });
        }

        const school = await School.findById(admin.schoolId);
        if (!school) {
            return res.status(404).json({
                success: false,
                message: 'School not found'
            });
        }

        // Fetch academic years for this school
        const academicYears = await AcademicYear.find({ schoolId: school._id })
            .sort({ startYear: -1 })
            .lean();

        const profileData = formatSchoolProfile(school, academicYears);

        res.status(200).json({
            success: true,
            data: {
                ...profileData,
                meta: {
                    schoolId: school._id,
                    status: school.status,
                    setupWizardStep: school.setupWizardStep,
                    isSetup: school.isSetup,
                    updatedAt: school.updatedAt
                }
            }
        });
    } catch (error) {
        console.error('Error fetching school profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching school profile',
            error: error.message
        });
    }
};

/**
 * PUT/PATCH /api/v1/school/profile
 * Update school profile - supports step-based partial updates
 * Query param: ?step=basic|contact|administrative|academic|timings|policies|optional
 */
exports.updateSchoolProfile = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin || !admin.schoolId) {
            return res.status(403).json({
                success: false,
                message: 'School admin access required'
            });
        }

        const school = await School.findById(admin.schoolId);
        if (!school) {
            return res.status(404).json({
                success: false,
                message: 'School not found'
            });
        }

        // Pre-condition: Verify school is approved
        if (school.status !== 'Approved') {
            return res.status(403).json({
                success: false,
                message: 'School profile can only be updated after approval',
                currentStatus: school.status
            });
        }

        const step = req.query.step?.toLowerCase();
        const body = req.body;
        let updateMessage = 'School profile updated successfully';

        // Handle step-based updates
        switch (step) {
            case 'basic':
                await updateBasicInfo(school, body);
                updateMessage = 'Basic information updated successfully';
                break;

            case 'contact':
                await updateContactInfo(school, body);
                updateMessage = 'Contact information updated successfully';
                break;

            case 'administrative':
                await updateAdministrativeInfo(school, body);
                updateMessage = 'Administrative information updated successfully';
                break;

            case 'academic':
                await updateAcademicInfo(school, body);
                updateMessage = 'Academic information updated successfully';
                break;

            case 'timings':
                await updateTimingsInfo(school, body);
                updateMessage = 'Timings information updated successfully';
                break;

            case 'policies':
                await updatePoliciesInfo(school, body);
                updateMessage = 'Policies updated successfully';
                break;

            case 'optional':
                await updateOptionalInfo(school, body);
                updateMessage = 'Optional details updated successfully';
                break;

            default:
                // No step specified - update all provided fields (PATCH behavior)
                await updateAllFields(school, body);
                updateMessage = 'School profile updated successfully';
        }

        await school.save();

        res.status(200).json({
            success: true,
            message: updateMessage,
            data: {
                step: step || 'all',
                schoolId: school._id,
                updatedAt: school.updatedAt
            }
        });
    } catch (error) {
        console.error('Error updating school profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating school profile',
            error: error.message
        });
    }
};

// Step update helper functions
async function updateBasicInfo(school, data) {
    if (data.schoolLogo !== undefined) school.schoolLogo = data.schoolLogo;
    if (data.schoolName !== undefined) school.schoolName = data.schoolName;
    if (data.schoolCode !== undefined) school.schoolCode = data.schoolCode;
    if (data.establishmentYear !== undefined) school.establishmentYear = data.establishmentYear;
    if (data.schoolType !== undefined) school.schoolType = data.schoolType;
    if (data.boardAffiliation !== undefined) school.boardAffiliation = data.boardAffiliation;
    if (data.schoolCategory !== undefined) school.schoolCategory = data.schoolCategory;
    if (data.recognitionNumber !== undefined) school.recognitionNumber = data.recognitionNumber;
    if (data.affiliationNumber !== undefined) school.affiliationNumber = data.affiliationNumber;
}

async function updateContactInfo(school, data) {
    if (data.primaryEmail !== undefined) school.primaryEmail = data.primaryEmail;
    if (data.secondaryEmail !== undefined) school.secondaryEmail = data.secondaryEmail;
    if (data.primaryPhone !== undefined) school.primaryPhone = data.primaryPhone;
    if (data.secondaryPhone !== undefined) school.secondaryPhone = data.secondaryPhone;
    if (data.website !== undefined) school.website = data.website;

    // Handle address object
    if (data.address) {
        if (!school.address) school.address = {};
        if (data.address.line1 !== undefined) school.address.line1 = data.address.line1;
        if (data.address.line2 !== undefined) school.address.line2 = data.address.line2;
        if (data.address.city !== undefined) school.address.city = data.address.city;
        if (data.address.state !== undefined) school.address.state = data.address.state;
        if (data.address.country !== undefined) school.address.country = data.address.country;
        if (data.address.pinCode !== undefined) school.address.pinCode = data.address.pinCode;
    }
}

async function updateAdministrativeInfo(school, data) {
    // Handle principal object
    if (data.principal) {
        if (!school.principal) school.principal = {};
        if (data.principal.name !== undefined) school.principal.name = data.principal.name;
        if (data.principal.email !== undefined) school.principal.email = data.principal.email;
        if (data.principal.contactNumber !== undefined) school.principal.contactNumber = data.principal.contactNumber;
    }

    // Handle adminOfficer object
    if (data.adminOfficer) {
        if (!school.adminOfficer) school.adminOfficer = {};
        if (data.adminOfficer.name !== undefined) school.adminOfficer.name = data.adminOfficer.name;
        if (data.adminOfficer.contactNumber !== undefined) school.adminOfficer.contactNumber = data.adminOfficer.contactNumber;
    }

    if (data.totalStudentCapacity !== undefined) school.totalStudentCapacity = data.totalStudentCapacity;
    if (data.currentAcademicYear !== undefined) school.currentAcademicYear = data.currentAcademicYear;
}

async function updateAcademicInfo(school, data) {
    if (data.classesOffered !== undefined) school.classesOffered = data.classesOffered;
    if (data.sectionsPerClass !== undefined) school.sectionsPerClass = data.sectionsPerClass;
    if (data.mediumOfInstruction !== undefined) school.mediumOfInstruction = data.mediumOfInstruction;
    if (data.workingDays !== undefined) school.workingDays = data.workingDays;
    if (data.defaultGradingSystem !== undefined) school.defaultGradingSystem = data.defaultGradingSystem;

    // Handle academicYears array - update in AcademicYear collection
    if (data.academicYears && Array.isArray(data.academicYears)) {
        for (const ay of data.academicYears) {
            if (ay._id) {
                // Update existing academic year
                await AcademicYear.findByIdAndUpdate(ay._id, {
                    startDate: ay.startDate,
                    endDate: ay.endDate,
                    status: ay.status || 'Active'
                });
            } else if (ay.year) {
                // Create new academic year
                const match = ay.year.match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
                if (match) {
                    await AcademicYear.create({
                        schoolId: school._id,
                        label: ay.year,
                        startYear: parseInt(match[1], 10),
                        endYear: parseInt(match[2], 10),
                        startDate: ay.startDate || null,
                        endDate: ay.endDate || null,
                        status: ay.status || 'Active',
                        isDefault: false
                    });
                }
            }
        }
    }
}

async function updateTimingsInfo(school, data) {
    if (data.schoolStartTime !== undefined) school.schoolStartTime = data.schoolStartTime;
    if (data.schoolEndTime !== undefined) school.schoolEndTime = data.schoolEndTime;
    if (data.periodDuration !== undefined) school.periodDuration = data.periodDuration;
    if (data.lunchStartTime !== undefined) school.lunchStartTime = data.lunchStartTime;
    if (data.lunchEndTime !== undefined) school.lunchEndTime = data.lunchEndTime;
}

async function updatePoliciesInfo(school, data) {
    if (data.minAttendancePercentage !== undefined) school.minAttendancePercentage = data.minAttendancePercentage;

    // Handle policies object
    if (data.policies) {
        if (!school.policies) school.policies = {};
        if (data.policies.attendancePolicy !== undefined) school.policies.attendancePolicy = data.policies.attendancePolicy;
        if (data.policies.promotionRules !== undefined) school.policies.promotionRules = data.policies.promotionRules;
        if (data.policies.examGradingPolicy !== undefined) school.policies.examGradingPolicy = data.policies.examGradingPolicy;
        if (data.policies.leavePolicy !== undefined) school.policies.leavePolicy = data.policies.leavePolicy;
        if (data.policies.feePolicy !== undefined) school.policies.feePolicy = data.policies.feePolicy;
        if (data.policies.disciplineCode !== undefined) school.policies.disciplineCode = data.policies.disciplineCode;
    }
}

async function updateOptionalInfo(school, data) {
    if (data.schoolMotto !== undefined) school.schoolMotto = data.schoolMotto;
    if (data.taxId !== undefined) school.taxId = data.taxId;
    if (data.gstNumber !== undefined) school.gstNumber = data.gstNumber;

    // Handle bankDetails object
    if (data.bankDetails) {
        if (!school.bankDetails) school.bankDetails = {};
        if (data.bankDetails.bankName !== undefined) school.bankDetails.bankName = data.bankDetails.bankName;
        if (data.bankDetails.accountNumber !== undefined) school.bankDetails.accountNumber = data.bankDetails.accountNumber;
        if (data.bankDetails.ifscCode !== undefined) school.bankDetails.ifscCode = data.bankDetails.ifscCode;
        if (data.bankDetails.branch !== undefined) school.bankDetails.branch = data.bankDetails.branch;
    }
}

async function updateAllFields(school, data) {
    // Update all steps with provided data
    await updateBasicInfo(school, data);
    await updateContactInfo(school, data);
    await updateAdministrativeInfo(school, data);
    await updateAcademicInfo(school, data);
    await updateTimingsInfo(school, data);
    await updatePoliciesInfo(school, data);
    await updateOptionalInfo(school, data);
}
