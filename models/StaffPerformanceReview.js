const mongoose = require('mongoose');

const staffPerformanceReviewSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  period: { type: String, trim: true },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String, trim: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

staffPerformanceReviewSchema.index({ schoolId: 1, staffId: 1 });
module.exports = mongoose.model('StaffPerformanceReview', staffPerformanceReviewSchema);
