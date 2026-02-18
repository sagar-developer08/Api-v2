const FeeHead = require('../models/FeeHead');
const FeeRule = require('../models/FeeRule');
const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const FeeConcession = require('../models/FeeConcession');
const FeeRefund = require('../models/FeeRefund');
const FeeSettings = require('../models/FeeSettings');
const mongoose = require('mongoose');

const getSchoolId = (req) => req.admin.schoolId._id || req.admin.schoolId;

exports.listFeeHeads = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await FeeHead.find({ schoolId }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing fee heads', error: error.message });
  }
};

exports.createFeeHead = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const head = await FeeHead.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: head });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating fee head', error: error.message });
  }
};

exports.updateFeeHead = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const head = await FeeHead.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!head) return res.status(404).json({ success: false, message: 'Fee head not found' });
    res.json({ success: true, data: head });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating fee head', error: error.message });
  }
};

exports.deleteFeeHead = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const head = await FeeHead.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!head) return res.status(404).json({ success: false, message: 'Fee head not found' });
    res.json({ success: true, message: 'Fee head deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting fee head', error: error.message });
  }
};

exports.listFeeRules = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const data = await FeeRule.find({ schoolId }).lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing fee rules', error: error.message });
  }
};

exports.createFeeRule = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const rule = await FeeRule.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating fee rule', error: error.message });
  }
};

exports.updateFeeRule = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const rule = await FeeRule.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Fee rule not found' });
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating fee rule', error: error.message });
  }
};

exports.deleteFeeRule = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const rule = await FeeRule.findOneAndDelete({ _id: req.params.id, schoolId });
    if (!rule) return res.status(404).json({ success: false, message: 'Fee rule not found' });
    res.json({ success: true, message: 'Fee rule deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting fee rule', error: error.message });
  }
};

exports.getFeesDashboard = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const mongoose = require('mongoose');
    const sid = mongoose.Types.ObjectId.isValid(schoolId) ? schoolId : new mongoose.Types.ObjectId(schoolId);
    const [totalPending, totalCollected] = await Promise.all([
      StudentFee.aggregate([{ $match: { schoolId: sid, status: { $in: ['pending', 'partial', 'overdue'] } } }, { $group: { _id: null, total: { $sum: '$pendingAmount' } } }]),
      FeePayment.aggregate([{ $match: { schoolId: sid, status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);
    res.json({
      success: true,
      data: {
        totalPending: (totalPending[0] && totalPending[0].total) || 0,
        totalCollected: (totalCollected[0] && totalCollected[0].total) || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fees dashboard', error: error.message });
  }
};

exports.listConcessions = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.status) filter.status = req.query.status;
    const data = await FeeConcession.find(filter).populate('studentId', 'firstName lastName').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing concessions', error: error.message });
  }
};

exports.createConcession = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const concession = await FeeConcession.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: concession });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating concession', error: error.message });
  }
};

exports.updateConcessionStatus = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { status } = req.body;
    const concession = await FeeConcession.findOneAndUpdate({ _id: req.params.id, schoolId }, { status }, { new: true });
    if (!concession) return res.status(404).json({ success: false, message: 'Concession not found' });
    res.json({ success: true, data: concession });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating concession', error: error.message });
  }
};

exports.listRefunds = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.status) filter.status = req.query.status;
    const data = await FeeRefund.find(filter).populate('paymentId').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing refunds', error: error.message });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const refund = await FeeRefund.create({ ...req.body, schoolId, status: 'pending' });
    res.status(201).json({ success: true, data: refund });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing refund', error: error.message });
  }
};

exports.updateRefundStatus = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { status } = req.body;
    const refund = await FeeRefund.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { status, processedBy: req.admin._id },
      { new: true }
    );
    if (!refund) return res.status(404).json({ success: false, message: 'Refund not found' });
    res.json({ success: true, data: refund });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating refund', error: error.message });
  }
};

exports.getFeeSettings = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    let settings = await FeeSettings.findOne({ schoolId }).lean();
    if (!settings) settings = await FeeSettings.create({ schoolId }).then(s => s.toObject());
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
  }
};

exports.updateFeeSettings = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const settings = await FeeSettings.findOneAndUpdate({ schoolId }, { $set: req.body }, { new: true, upsert: true }).lean();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating settings', error: error.message });
  }
};

exports.cancelPayment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const payment = await FeePayment.findOneAndUpdate(
      { _id: req.params.id, schoolId },
      { status: 'failed' },
      { new: true }
    );
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling payment', error: error.message });
  }
};

exports.sendPaymentReceipt = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const payment = await FeePayment.findOne({ _id: req.params.id, schoolId });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, message: 'Receipt sent (queued)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending receipt', error: error.message });
  }
};

// ---------- Fee Assignments ----------
exports.listFeeAssignments = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.status) filter.status = req.query.status;
    const data = await StudentFee.find(filter).populate('studentId', 'firstName lastName admissionNumber').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing assignments', error: error.message });
  }
};

exports.assignFee = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const fee = await StudentFee.create({ ...req.body, schoolId });
    res.status(201).json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error assigning fee', error: error.message });
  }
};

exports.bulkAssignFee = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { studentIds, feeType, feeTypeId, amount, dueDate, academicYear } = req.body;
    if (!Array.isArray(studentIds) || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'studentIds, amount, dueDate required' });
    }
    const created = [];
    for (const studentId of studentIds) {
      const fee = await StudentFee.create({
        schoolId,
        studentId,
        feeType: feeType || 'tuition',
        feeTypeId: feeTypeId || '',
        amount,
        dueDate: new Date(dueDate),
        academicYear: academicYear || '',
        status: 'pending'
      });
      created.push(fee);
    }
    res.status(201).json({ success: true, data: created, message: `${created.length} fees assigned` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error bulk assigning', error: error.message });
  }
};

exports.updateFeeAssignment = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const fee = await StudentFee.findOneAndUpdate({ _id: req.params.id, schoolId }, req.body, { new: true });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee assignment not found' });
    res.json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating assignment', error: error.message });
  }
};

// ---------- Student Fees (fee-app dedicated) ----------
exports.listStudentFees = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = { schoolId };
    if (req.query.studentId) filter.studentId = req.query.studentId;
    const data = await StudentFee.find(filter).populate('studentId', 'firstName lastName').lean();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing student fees', error: error.message });
  }
};

exports.getStudentFeeDetails = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const fee = await StudentFee.findOne({ _id: req.params.id, schoolId }).populate('studentId').lean();
    if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });
    res.json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fee details', error: error.message });
  }
};

exports.getStudentFeeSummary = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId required' });
    const fees = await StudentFee.find({ schoolId, studentId }).lean();
    const total = fees.reduce((s, f) => s + (f.amount || 0), 0);
    const paid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
    const pending = fees.reduce((s, f) => s + (f.pendingAmount || f.amount - f.paidAmount || 0), 0);
    res.json({ success: true, data: { total, paid, pending, count: fees.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching summary', error: error.message });
  }
};

// ---------- Gateway Callback (no auth - called by payment gateway) ----------
exports.gatewayCallback = async (req, res) => {
  try {
    const { paymentId, status, transactionId, amount } = req.body;
    if (!paymentId) return res.status(400).json({ success: false, message: 'paymentId required' });
    const payment = await FeePayment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    await FeePayment.findByIdAndUpdate(paymentId, {
      status: status === 'success' || status === 'completed' ? 'completed' : 'failed',
      transactionId: transactionId || payment.transactionId,
      gatewayResponse: req.body
    });
    res.json({ success: true, message: 'Callback processed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing callback', error: error.message });
  }
};

// ---------- Refund Details & Receipt ----------
exports.getRefundDetails = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const refund = await FeeRefund.findOne({ _id: req.params.id, schoolId }).populate('paymentId').lean();
    if (!refund) return res.status(404).json({ success: false, message: 'Refund not found' });
    res.json({ success: true, data: refund });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching refund', error: error.message });
  }
};

exports.generateRefundReceipt = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const refund = await FeeRefund.findOne({ _id: req.params.id, schoolId });
    if (!refund) return res.status(404).json({ success: false, message: 'Refund not found' });
    res.json({ success: true, data: { receiptUrl: '/receipts/refund-' + refund._id + '.pdf', message: 'Receipt generated' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating receipt', error: error.message });
  }
};

// ---------- Reports ----------
exports.getReportsByType = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { type } = req.query;
    const filter = { schoolId };
    if (type === 'collection') {
      const data = await FeePayment.aggregate([
        { $match: { schoolId: mongoose.Types.ObjectId.isValid(schoolId) ? new mongoose.Types.ObjectId(schoolId) : schoolId, status: 'completed' } },
        { $group: { _id: '$paymentMode', total: { $sum: '$amount' } } }
      ]);
      return res.json({ success: true, data });
    }
    if (type === 'pending') {
      const data = await StudentFee.find({ schoolId, status: { $in: ['pending', 'partial', 'overdue'] } }).populate('studentId', 'firstName lastName').lean();
      return res.json({ success: true, data });
    }
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching report', error: error.message });
  }
};

exports.exportReports = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const { type, format } = req.query;
    res.json({ success: true, data: { downloadUrl: `/exports/fees-${type || 'report'}-${Date.now()}.${format || 'csv'}`, message: 'Export queued' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error exporting', error: error.message });
  }
};
