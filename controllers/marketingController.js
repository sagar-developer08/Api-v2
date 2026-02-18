const Lead = require('../models/Lead');
const LeadNote = require('../models/LeadNote');
const MarketingPage = require('../models/MarketingPage');
const Campaign = require('../models/Campaign');
const MarketingOnboarding = require('../models/MarketingOnboarding');

exports.getHome = async (req, res) => {
  res.json({ success: true, data: { heroTitle: '', heroSubtitle: '', features: [], testimonials: [] } });
};

exports.updateHome = async (req, res) => {
  res.json({ success: true, data: req.body, message: 'Updated' });
};

exports.listLeads = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10) || 10);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const [data, total] = await Promise.all([
      Lead.find(filter).skip(skip).limit(l).sort({ createdAt: -1 }).lean(),
      Lead.countDocuments(filter)
    ]);
    res.json({ success: true, data: { data, total, page: parseInt(page, 10) || 1, limit: l, totalPages: Math.ceil(total / l) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing leads', error: error.message });
  }
};

exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).lean();
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching lead', error: error.message });
  }
};

exports.createLead = async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating lead', error: error.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating lead', error: error.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting lead', error: error.message });
  }
};

exports.convertLead = async (req, res) => {
  try {
    const { conversionType, notes } = req.body;
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status: 'converted' }, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead, message: 'Lead converted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error converting lead', error: error.message });
  }
};

exports.addLeadNote = async (req, res) => {
  try {
    const note = await LeadNote.create({ leadId: req.params.id, note: req.body.note || req.body.content || '' });
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding note', error: error.message });
  }
};

exports.getLeadHistory = async (req, res) => {
  try {
    const notes = await LeadNote.find({ leadId: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching history', error: error.message });
  }
};

const getPage = async (key) => {
  const doc = await MarketingPage.findOne({ key }).lean();
  return doc ? doc.content : {};
};

exports.getAbout = async (req, res) => {
  const data = await getPage('about');
  res.json({ success: true, data });
};

exports.updateAbout = async (req, res) => {
  await MarketingPage.findOneAndUpdate({ key: 'about' }, { content: req.body }, { new: true, upsert: true });
  res.json({ success: true, data: req.body });
};

exports.getFeatures = async (req, res) => {
  const data = await getPage('features');
  res.json({ success: true, data });
};

exports.updateFeatures = async (req, res) => {
  await MarketingPage.findOneAndUpdate({ key: 'features' }, { content: req.body }, { new: true, upsert: true });
  res.json({ success: true, data: req.body });
};

exports.getPricing = async (req, res) => {
  const data = await getPage('pricing');
  res.json({ success: true, data });
};

exports.updatePricing = async (req, res) => {
  await MarketingPage.findOneAndUpdate({ key: 'pricing' }, { content: req.body }, { new: true, upsert: true });
  res.json({ success: true, data: req.body });
};

exports.listCampaigns = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const skip = (parseInt(page, 10) - 1) * (parseInt(limit, 10) || 10);
  const l = Math.min(100, parseInt(limit, 10) || 10);
  const [data, total] = await Promise.all([
    Campaign.find(filter).skip(skip).limit(l).sort({ createdAt: -1 }).lean(),
    Campaign.countDocuments(filter)
  ]);
  res.json({ success: true, data: { data, total, page: parseInt(page, 10) || 1, limit: l, totalPages: Math.ceil(total / l) } });
};

exports.getCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).lean();
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
  res.json({ success: true, data: campaign });
};

exports.createCampaign = async (req, res) => {
  const campaign = await Campaign.create(req.body);
  res.status(201).json({ success: true, data: campaign });
};

exports.getAnalytics = async (req, res) => {
  const totalLeads = await Lead.countDocuments();
  const converted = await Lead.countDocuments({ status: 'converted' });
  res.json({
    success: true,
    data: {
      totalLeads,
      convertedLeads: converted,
      conversionRate: totalLeads ? Math.round((converted / totalLeads) * 1000) / 10 : 0
    }
  });
};

exports.getMarketingSettings = async (req, res) => {
  const data = await getPage('settings');
  res.json({ success: true, data });
};

exports.updateMarketingSettings = async (req, res) => {
  await MarketingPage.findOneAndUpdate({ key: 'settings' }, { content: req.body }, { new: true, upsert: true });
  res.json({ success: true, data: req.body });
};

// ---------- Onboarding ----------
exports.getOnboardingSteps = async (req, res) => {
  try {
    let onboarding = await MarketingOnboarding.findOne({ key: 'default' }).lean();
    if (!onboarding) {
      onboarding = await MarketingOnboarding.create({
        key: 'default',
        steps: [
          { name: 'Create first campaign', completed: false },
          { name: 'Add leads', completed: false },
          { name: 'Configure settings', completed: false }
        ]
      }).then(o => o.toObject());
    }
    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching onboarding', error: error.message });
  }
};

exports.updateOnboardingProgress = async (req, res) => {
  try {
    const { stepIndex, completed } = req.body;
    let onboarding = await MarketingOnboarding.findOne({ key: 'default' });
    if (!onboarding) onboarding = await MarketingOnboarding.create({ key: 'default', steps: [] });
    if (stepIndex !== undefined && onboarding.steps[stepIndex]) {
      onboarding.steps[stepIndex].completed = completed !== false;
    }
    if (req.body.currentStep !== undefined) onboarding.currentStep = req.body.currentStep;
    await onboarding.save();
    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating progress', error: error.message });
  }
};

exports.completeOnboarding = async (req, res) => {
  try {
    const onboarding = await MarketingOnboarding.findOneAndUpdate({ key: 'default' }, { completed: true }, { new: true, upsert: true });
    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error completing onboarding', error: error.message });
  }
};

// ---------- Campaign Actions ----------
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating campaign', error: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting campaign', error: error.message });
  }
};

exports.sendCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'sent', sentAt: new Date() },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, data: campaign, message: 'Campaign sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending campaign', error: error.message });
  }
};

exports.scheduleCampaign = async (req, res) => {
  try {
    const { scheduledDate } = req.body;
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'scheduled', scheduledDate: scheduledDate ? new Date(scheduledDate) : null },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error scheduling campaign', error: error.message });
  }
};

exports.cancelCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { status: 'draft', scheduledDate: null },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, data: campaign, message: 'Campaign cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling campaign', error: error.message });
  }
};

exports.getCampaignPerformance = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({
      success: true,
      data: {
        ...campaign,
        opens: 0,
        clicks: 0,
        conversions: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching performance', error: error.message });
  }
};

// ---------- Analytics ----------
exports.getCampaignAnalytics = async (req, res) => {
  try {
    const campaigns = await Campaign.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const sent = await Campaign.countDocuments({ status: 'sent' });
    res.json({ success: true, data: { byStatus: campaigns, totalSent: sent } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching campaign analytics', error: error.message });
  }
};

exports.getLeadsBySource = async (req, res) => {
  try {
    const data = await Lead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leads by source', error: error.message });
  }
};

exports.getLeadsByDate = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const match = {};
    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = new Date(fromDate);
      if (toDate) match.createdAt.$lte = new Date(toDate);
    }
    const data = await Lead.aggregate([
      { $match: Object.keys(match).length ? match : {} },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leads by date', error: error.message });
  }
};
