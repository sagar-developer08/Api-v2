const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  platform: {
    name: { type: String, default: 'Vidhyadhan' },
    domain: { type: String, default: '' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    language: { type: String, default: 'en' }
  },
  email: {
    smtpHost: { type: String, default: '' },
    smtpPort: { type: String, default: '587' },
    smtpUser: { type: String, default: '' },
    fromEmail: { type: String, default: '' }
  },
  security: {
    sessionTimeout: { type: String, default: '7d' },
    passwordMinLength: { type: String, default: '6' },
    requireTwoFactor: { type: Boolean, default: false },
    enableAuditLogs: { type: Boolean, default: true }
  },
  features: {
    enableRegistration: { type: Boolean, default: true },
    enableEmailVerification: { type: Boolean, default: true },
    enablePasswordReset: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false }
  }
}, { timestamps: true });

platformSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc.toObject();
};

platformSettingsSchema.statics.updateSingleton = async function (updates) {
  const allowed = ['platform', 'email', 'security', 'features'];
  const set = {};
  allowed.forEach(k => {
    if (updates[k] && typeof updates[k] === 'object') {
      Object.keys(updates[k]).forEach(f => {
        set[`${k}.${f}`] = updates[k][f];
      });
    }
  });
  const doc = await this.findOneAndUpdate({}, { $set: set }, { new: true, upsert: true });
  return doc.toObject();
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
