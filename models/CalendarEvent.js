const mongoose = require('mongoose');

const CATEGORY = ['academic', 'event', 'finance', 'admin'];
const VISIBILITY = ['school', 'staff', 'public'];

const calendarEventSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: CATEGORY, default: 'academic' },
  startAt: { type: Date, required: true },
  endAt: { type: Date, default: null },
  allDay: { type: Boolean, default: false },
  location: { type: String, trim: true, default: null },
  description: { type: String, trim: true, default: null },
  visibility: { type: String, enum: VISIBILITY, default: 'school' },
  relatedExamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
  relatedFeeDueId: { type: String, trim: true, default: null }
}, { timestamps: true });

calendarEventSchema.index({ schoolId: 1, startAt: 1 });
calendarEventSchema.index({ schoolId: 1, category: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
module.exports.CALENDAR_CATEGORIES = CATEGORY;
