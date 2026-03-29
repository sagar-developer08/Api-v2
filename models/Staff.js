const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const classTeacherOfSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' }
}, { _id: false });

const staffSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  /** Human-readable code; unique per school when set */
  employeeId: { type: String, trim: true },
  firstName: { type: String, required: true, trim: true },
  middleName: { type: String, trim: true, default: '' },
  lastName: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true, default: '' },
  alternatePhone: { type: String, trim: true, default: '' },
  emergencyContactName: { type: String, trim: true, default: '' },
  emergencyContactPhone: { type: String, trim: true, default: '' },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'male', 'female', 'other', ''], default: '' },
  bloodGroup: { type: String, trim: true, default: '' },
  aadhaarMasked: { type: String, trim: true, default: '' },
  pan: { type: String, trim: true, default: '' },
  address: { type: String, trim: true },
  addressLine1: { type: String, trim: true, default: '' },
  addressLine2: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  pincode: { type: String, trim: true, default: '' },
  photoUrl: { type: String, trim: true, default: '' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffRole' },
  designation: { type: String, trim: true, default: '' },
  joinDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'on_leave', 'inactive', 'resigned', 'retired', 'suspended'],
    default: 'active'
  },
  /** Legacy values may exist in DB; treated as non_teaching in API if unset */
  employeeType: {
    type: String,
    enum: ['teaching', 'non_teaching', 'Teaching', 'Non-Teaching', ''],
    default: 'non_teaching'
  },
  employmentType: { type: String, trim: true, default: '' },
  workShift: { type: String, trim: true, default: '' },
  reportingManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
  subjectsTaught: [{ type: String, trim: true }],
  classesAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  sectionsAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  isClassTeacher: { type: Boolean, default: false },
  classTeacherOf: { type: classTeacherOfSchema, default: undefined },
  teachingExperienceYears: { type: Number, default: null },
  salaryType: { type: String, trim: true, default: '' },
  basicSalary: { type: Number, default: null },
  allowances: { type: String, trim: true, default: '' },
  bankName: { type: String, trim: true, default: '' },
  accountNumber: { type: String, trim: true, default: '' },
  ifscCode: { type: String, trim: true, default: '' },
  hasSystemAccess: { type: Boolean, default: false },
  username: { type: String, trim: true, default: '' },
  loginEmail: { type: String, trim: true, lowercase: true, default: '' },
  permissionIds: [{ type: mongoose.Schema.Types.ObjectId }],
  notes: { type: String, trim: true, default: '' },
  password: { type: String, minlength: 6, select: false }
}, { timestamps: true });

staffSchema.index({ schoolId: 1 });
staffSchema.index({ branchId: 1 });
staffSchema.index({ schoolId: 1, branchId: 1 });
staffSchema.index({ schoolId: 1, branchId: 1, email: 1 });
staffSchema.index({ schoolId: 1, branchId: 1, phone: 1 });
staffSchema.index({ schoolId: 1, branchId: 1, loginEmail: 1 }, { sparse: true });
staffSchema.index({ schoolId: 1, branchId: 1, employeeId: 1 }, { sparse: true });

staffSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

staffSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Staff', staffSchema);
