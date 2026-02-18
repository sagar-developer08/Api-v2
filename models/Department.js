const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  description: { type: String, trim: true }
}, { timestamps: true });

departmentSchema.index({ schoolId: 1 });
module.exports = mongoose.model('Department', departmentSchema);
