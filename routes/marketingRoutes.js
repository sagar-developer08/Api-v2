const express = require('express');
const router = express.Router();
const { requireSuperAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/marketingController');

router.get('/home', ctrl.getHome);
router.put('/home', requireSuperAdmin, ctrl.updateHome);
router.get('/about', ctrl.getAbout);
router.put('/about', requireSuperAdmin, ctrl.updateAbout);
router.get('/features', ctrl.getFeatures);
router.put('/features', requireSuperAdmin, ctrl.updateFeatures);
router.get('/pricing', ctrl.getPricing);
router.put('/pricing', requireSuperAdmin, ctrl.updatePricing);

router.get('/leads', requireSuperAdmin, ctrl.listLeads);
router.get('/leads/:id', requireSuperAdmin, ctrl.getLead);
router.post('/leads', ctrl.createLead);
router.put('/leads/:id', requireSuperAdmin, ctrl.updateLead);
router.delete('/leads/:id', requireSuperAdmin, ctrl.deleteLead);
router.post('/leads/:id/convert', requireSuperAdmin, ctrl.convertLead);
router.post('/leads/:id/notes', requireSuperAdmin, ctrl.addLeadNote);
router.get('/leads/:id/history', requireSuperAdmin, ctrl.getLeadHistory);

router.get('/onboarding', requireSuperAdmin, ctrl.getOnboardingSteps);
router.put('/onboarding', requireSuperAdmin, ctrl.updateOnboardingProgress);
router.post('/onboarding/complete', requireSuperAdmin, ctrl.completeOnboarding);

router.get('/campaigns', requireSuperAdmin, ctrl.listCampaigns);
router.get('/campaigns/:id', requireSuperAdmin, ctrl.getCampaign);
router.post('/campaigns', requireSuperAdmin, ctrl.createCampaign);
router.put('/campaigns/:id', requireSuperAdmin, ctrl.updateCampaign);
router.delete('/campaigns/:id', requireSuperAdmin, ctrl.deleteCampaign);
router.post('/campaigns/:id/send', requireSuperAdmin, ctrl.sendCampaign);
router.post('/campaigns/:id/schedule', requireSuperAdmin, ctrl.scheduleCampaign);
router.post('/campaigns/:id/cancel', requireSuperAdmin, ctrl.cancelCampaign);
router.get('/campaigns/:id/performance', requireSuperAdmin, ctrl.getCampaignPerformance);

router.get('/analytics/overall', ctrl.getAnalytics);
router.get('/analytics/campaigns', requireSuperAdmin, ctrl.getCampaignAnalytics);
router.get('/analytics/leads/source', requireSuperAdmin, ctrl.getLeadsBySource);
router.get('/analytics/leads/date', requireSuperAdmin, ctrl.getLeadsByDate);
router.get('/settings', requireSuperAdmin, ctrl.getMarketingSettings);
router.put('/settings', requireSuperAdmin, ctrl.updateMarketingSettings);

module.exports = router;
