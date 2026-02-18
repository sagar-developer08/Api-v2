const mongoose = require('mongoose');

const classStationarySchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  items: [{ name: { type: String }, quantity: { type: Number }, unit: { type: String } }]
}, { timestamps: true });

classStationarySchema.index({ schoolId: 1, classId: 1 });
module.exports = mongoose.model('ClassStationary', classStationarySchema);
