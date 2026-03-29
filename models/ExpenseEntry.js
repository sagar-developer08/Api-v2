const mongoose = require('mongoose');

const CATEGORIES = ['Supplies', 'Maintenance', 'Events', 'Transport', 'Other'];

const expenseEntrySchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  date: { type: Date, required: true },
  department: { type: String, required: true, trim: true },
  category: { type: String, enum: CATEGORIES, default: 'Other' },
  description: { type: String, required: true, trim: true },
  quantity: { type: mongoose.Schema.Types.Mixed, default: 1 },
  amount: { type: Number, required: true, min: 0 }
}, { timestamps: true });

expenseEntrySchema.index({ schoolId: 1, date: -1 });

module.exports = mongoose.model('ExpenseEntry', expenseEntrySchema);
