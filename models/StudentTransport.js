const mongoose = require('mongoose');

const studentTransportSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    routeId: {
        type: String,
        trim: true
    },
    routeName: {
        type: String,
        trim: true
    },
    routeCode: {
        type: String,
        trim: true
    },
    vehicleId: {
        type: String,
        trim: true
    },
    vehicleNumber: {
        type: String,
        trim: true
    },
    vehicleType: {
        type: String,
        enum: ['bus', 'van', 'auto', 'other'],
        default: 'bus'
    },
    pickupPoint: {
        type: String,
        trim: true
    },
    pickupTime: {
        type: String,
        trim: true
    },
    dropPoint: {
        type: String,
        trim: true
    },
    dropTime: {
        type: String,
        trim: true
    },
    distance: {
        type: Number,
        default: 0
    },
    fare: {
        type: Number,
        default: 0
    },
    driver: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        licenseNumber: { type: String, trim: true }
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    }
}, { timestamps: true });

studentTransportSchema.index({ schoolId: 1, studentId: 1 }, { unique: true });
studentTransportSchema.index({ schoolId: 1, routeId: 1 });

module.exports = mongoose.model('StudentTransport', studentTransportSchema);
