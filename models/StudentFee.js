const mongoose = require('mongoose');

const studentFeeSchema = new mongoose.Schema({
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
    feeType: {
        type: String,
        required: true,
        trim: true
    },
    feeTypeId: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: {
        type: Date,
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    pendingAmount: {
        type: Number,
        default: function () {
            return this.amount - this.paidAmount;
        }
    },
    status: {
        type: String,
        enum: ['paid', 'pending', 'overdue', 'partial'],
        default: 'pending'
    },
    academicYear: {
        type: String,
        trim: true
    },
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    },
    description: {
        type: String,
        trim: true
    }
}, { timestamps: true });

studentFeeSchema.index({ schoolId: 1, studentId: 1 });
studentFeeSchema.index({ schoolId: 1, status: 1 });
studentFeeSchema.index({ studentId: 1, status: 1 });
studentFeeSchema.index({ dueDate: 1 });

// Update pending amount before save
studentFeeSchema.pre('save', function (next) {
    this.pendingAmount = this.amount - this.paidAmount;
    if (this.pendingAmount <= 0) {
        this.status = 'paid';
    } else if (this.paidAmount > 0) {
        this.status = 'partial';
    } else if (new Date() > this.dueDate) {
        this.status = 'overdue';
    }
    next();
});

module.exports = mongoose.model('StudentFee', studentFeeSchema);
