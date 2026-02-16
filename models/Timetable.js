const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema({
    dayOfWeek: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true
    },
    period: {
        type: Number,
        required: true
    },
    startTime: {
        type: String,
        required: true,
        trim: true
    },
    endTime: {
        type: String,
        required: true,
        trim: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    roomNumber: {
        type: String,
        trim: true
    }
}, { _id: true });

const timetableSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    },
    slots: [timetableSlotSchema],
    status: {
        type: String,
        enum: ['active', 'draft', 'archived'],
        default: 'active'
    }
}, { timestamps: true });

timetableSchema.index({ schoolId: 1, classId: 1 });
timetableSchema.index({ schoolId: 1, classId: 1, academicYearId: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
