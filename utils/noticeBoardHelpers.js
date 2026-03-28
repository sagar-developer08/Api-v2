const mongoose = require('mongoose');

const NOTICE_CATEGORIES = [
  'Academic',
  'Events',
  'Maintenance',
  'Arts',
  'Finance',
  'Notice',
  'Training'
];

const VISUAL_KEYS = [
  'academic',
  'events',
  'maintenance',
  'arts',
  'finance',
  'notice',
  'training'
];

const ALLOWED_ATTACHMENT_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg'
]);

function normalizeStoredStatus(status) {
  if (!status) return 'draft';
  if (status === 'published') return 'active';
  if (status === 'archived') return 'draft';
  return status;
}

/**
 * Effective status for admin UI: draft | active | scheduled | expired
 */
function effectiveStatus(doc) {
  const now = new Date();
  const raw = doc.status || 'draft';
  if (raw === 'draft' || raw === 'archived') return 'draft';

  const postAt = doc.postAt || doc.publishedAt;
  if (raw === 'scheduled' && postAt && postAt > now) return 'scheduled';

  if (doc.expiresAt && now > doc.expiresAt && raw !== 'draft') {
    return 'expired';
  }

  if (postAt && postAt > now && (raw === 'active' || raw === 'published')) {
    return 'scheduled';
  }

  if (raw === 'scheduled' && postAt && postAt <= now) return 'active';
  if (raw === 'published' || raw === 'active') return 'active';
  return 'draft';
}

function postAtForQuery(doc) {
  return doc.postAt || doc.publishedAt || doc.createdAt;
}

function mapNoticeToResponse(doc, adminPopulated = null) {
  const o = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const createdByAdmin = adminPopulated || o.createdBy;
  let createdByName = '';
  let createdByUserId = null;
  if (createdByAdmin && typeof createdByAdmin === 'object') {
    createdByName = createdByAdmin.fullName || '';
    createdByUserId = createdByAdmin._id ? String(createdByAdmin._id) : null;
  }
  if (!createdByName && o.createdByOverride) {
    createdByName = o.createdByOverride;
  }

  const att = o.attachment;
  const attachment = att && att.id
    ? {
        id: att.id,
        fileName: att.fileName,
        mimeType: att.mimeType,
        sizeBytes: att.sizeBytes
      }
    : null;

  const eff = effectiveStatus(o);

  return {
    id: String(o._id),
    title: o.title,
    category: o.category || 'Notice',
    audience: o.audience != null ? o.audience : '',
    content: o.content || '',
    status: o.status === 'archived' ? 'draft' : o.status === 'published' ? 'active' : o.status,
    effectiveStatus: eff,
    postAt: (o.postAt || o.publishedAt || o.createdAt || new Date()).toISOString(),
    expiresAt: o.expiresAt ? o.expiresAt.toISOString() : null,
    createdBy: createdByName || 'Admin',
    publisherRole: o.publisherRole != null ? o.publisherRole : null,
    createdByUserId: o.createdByUserId
      ? String(o.createdByUserId)
      : createdByAdmin && createdByAdmin._id
        ? String(createdByAdmin._id)
        : null,
    attachment,
    visualKey: o.visualKey != null ? o.visualKey : null,
    audienceReachCount:
      o.audienceReachCount != null ? o.audienceReachCount : null,
    createdAt: o.createdAt ? o.createdAt.toISOString() : null,
    updatedAt: o.updatedAt ? o.updatedAt.toISOString() : null
  };
}

function buildAdminListFilter({ schoolId, category, status, q, now = new Date() }) {
  const filter = { schoolId: new mongoose.Types.ObjectId(String(schoolId)) };

  if (category && category !== 'all') {
    filter.category = category;
  }

  if (q && String(q).trim()) {
    const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { title: rx },
      { audience: rx },
      { category: rx },
      { createdByOverride: rx }
    ];
  }

  if (!status || status === 'all') {
    return filter;
  }

  if (status === 'draft') {
    filter.status = { $in: ['draft', 'archived'] };
    return filter;
  }

  if (status === 'scheduled') {
    filter.status = 'scheduled';
    filter.$and = [
      ...(filter.$and || []),
      { $or: [{ postAt: { $gt: now } }, { $and: [{ postAt: null }, { publishedAt: { $gt: now } }] }] }
    ];
    return filter;
  }

  if (status === 'expired') {
    filter.status = { $in: ['active', 'scheduled', 'published'] };
    filter.expiresAt = { $lt: now };
    return filter;
  }

  if (status === 'active') {
    filter.status = { $in: ['active', 'published', 'scheduled'] };
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [{ postAt: { $lte: now } }, { $and: [{ postAt: null }, { publishedAt: { $lte: now } }] }]
      },
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }]
      }
    ];
    return filter;
  }

  return filter;
}

async function countsByEffectiveStatus(Notice, schoolId) {
  const sid = new mongoose.Types.ObjectId(String(schoolId));
  const now = new Date();

  const [all, draft, scheduled, active, expired] = await Promise.all([
    Notice.countDocuments({ schoolId: sid }),
    Notice.countDocuments({ schoolId: sid, status: { $in: ['draft', 'archived'] } }),
    Notice.countDocuments({
      schoolId: sid,
      status: 'scheduled',
      $or: [{ postAt: { $gt: now } }, { $and: [{ postAt: null }, { publishedAt: { $gt: now } }] }]
    }),
    Notice.countDocuments({
      schoolId: sid,
      status: { $in: ['active', 'published', 'scheduled'] },
      $and: [
        {
          $or: [{ postAt: { $lte: now } }, { $and: [{ postAt: null }, { publishedAt: { $lte: now } }] }]
        },
        { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] }
      ]
    }),
    Notice.countDocuments({
      schoolId: sid,
      status: { $in: ['active', 'scheduled', 'published'] },
      expiresAt: { $lt: now }
    })
  ]);

  return { all, draft, scheduled, active, expired };
}

function buildPortalNoticeFilter(schoolId, audienceTargets) {
  const sid = new mongoose.Types.ObjectId(String(schoolId));
  const now = new Date();
  return {
    schoolId: sid,
    target: { $in: audienceTargets },
    status: { $nin: ['draft', 'archived'] },
    $and: [
      {
        $or: [{ postAt: { $lte: now } }, { $and: [{ postAt: null }, { publishedAt: { $lte: now } }] }]
      },
      { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] }
    ]
  };
}

module.exports = {
  NOTICE_CATEGORIES,
  VISUAL_KEYS,
  ALLOWED_ATTACHMENT_MIMES,
  normalizeStoredStatus,
  effectiveStatus,
  postAtForQuery,
  mapNoticeToResponse,
  buildAdminListFilter,
  countsByEffectiveStatus,
  buildPortalNoticeFilter
};
