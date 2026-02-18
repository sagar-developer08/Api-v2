const mongoose = require('mongoose');

const marketingOnboardingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  steps: [{ name: { type: String }, completed: { type: Boolean, default: false } }],
  currentStep: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('MarketingOnboarding', marketingOnboardingSchema);
