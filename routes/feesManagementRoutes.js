const express = require('express');
const router = express.Router();
const { protect, requireApprovedSchool } = require('../middleware/auth');
const ctrl = require('../controllers/feesManagementController');

// Gateway callback - no auth (called by payment gateway)
router.post('/payments/gateway-callback', ctrl.gatewayCallback);

router.use(protect);
router.use(requireApprovedSchool);

router.get('/dashboard', ctrl.getFeesDashboard);

router.get('/assignments', ctrl.listFeeAssignments);
router.post('/assignments', ctrl.assignFee);
router.post('/assignments/bulk', ctrl.bulkAssignFee);
router.put('/assignments/:id', ctrl.updateFeeAssignment);

router.get('/student-fees', ctrl.listStudentFees);
router.get('/student-fees/summary', ctrl.getStudentFeeSummary);
router.get('/student-fees/:id', ctrl.getStudentFeeDetails);

router.get('/heads', ctrl.listFeeHeads);
router.post('/heads', ctrl.createFeeHead);
router.put('/heads/:id', ctrl.updateFeeHead);
router.delete('/heads/:id', ctrl.deleteFeeHead);

router.get('/rules', ctrl.listFeeRules);
router.post('/rules', ctrl.createFeeRule);
router.put('/rules/:id', ctrl.updateFeeRule);
router.delete('/rules/:id', ctrl.deleteFeeRule);

router.get('/concessions', ctrl.listConcessions);
router.post('/concessions', ctrl.createConcession);
router.put('/concessions/:id/status', ctrl.updateConcessionStatus);

router.get('/refunds', ctrl.listRefunds);
router.post('/refunds', ctrl.processRefund);
router.put('/refunds/:id/status', ctrl.updateRefundStatus);

router.get('/settings', ctrl.getFeeSettings);
router.put('/settings', ctrl.updateFeeSettings);

router.post('/payments/:id/cancel', ctrl.cancelPayment);
router.post('/payments/:id/receipt/send', ctrl.sendPaymentReceipt);

router.get('/refunds/:id', ctrl.getRefundDetails);
router.post('/refunds/:id/receipt', ctrl.generateRefundReceipt);

router.get('/reports', ctrl.getReportsByType);
router.get('/reports/export', ctrl.exportReports);

module.exports = router;
