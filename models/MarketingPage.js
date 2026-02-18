const mongoose = require('mongoose');

const marketingPageSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  content: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('MarketingPage', marketingPageSchema);
