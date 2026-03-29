const mongoose = require('mongoose');

const CATEGORY = ['Leadership', 'Academic', 'Operations', 'Support'];

const rbacRoleSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  slug: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: CATEGORY, default: 'Academic' },
  description: { type: String, default: '' },
  active: { type: Boolean, default: true },
  isSystem: { type: Boolean, default: false },
  permissions: { type: Map, of: Boolean, default: {} }
}, { timestamps: true });

rbacRoleSchema.index({ schoolId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('RbacRole', rbacRoleSchema);
