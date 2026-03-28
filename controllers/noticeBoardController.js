const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Notice = require('../models/Notice');
const {
  NOTICE_CATEGORIES,
  VISUAL_KEYS,
  ALLOWED_ATTACHMENT_MIMES,
  mapNoticeToResponse,
  buildAdminListFilter,
  countsByEffectiveStatus
} = require('../utils/noticeBoardHelpers');
const multer = require('multer');
const {
  STORED_WRITE_STATUSES
} = require('../validators/noticeBoardValidators');

const MAX_ATTACHMENT_BYTES =
  Number(process.env.NOTICE_MAX_ATTACHMENT_BYTES) || 25 * 1024 * 1024;

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'notices');
const UPLOAD_TMP = path.join(process.cwd(), 'uploads', 'tmp');

function ensureUploadRoot() {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

function schoolIdFromReq(req) {
  const admin = req.admin;
  return admin.schoolId._id || admin.schoolId;
}

function parseDate(v, field, errors) {
  if (v == null || v === '') {
    errors[field] = errors[field] || [];
    errors[field].push(`${field} is required`);
    return null;
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    errors[field] = errors[field] || [];
    errors[field].push(`Invalid ${field}`);
    return null;
  }
  return d;
}

function validateCreatePayload(body) {
  const errors = {};
  const status = body.status;
  if (!status || !STORED_WRITE_STATUSES.includes(status)) {
    errors.status = ['Invalid or missing status'];
  }
  if (!body.title || !String(body.title).trim()) {
    errors.title = ['Title is required'];
  }
  if (body.category && !NOTICE_CATEGORIES.includes(body.category)) {
    errors.category = ['Invalid category'];
  }
  if (body.visualKey && !VISUAL_KEYS.includes(body.visualKey)) {
    errors.visualKey = ['Invalid visualKey'];
  }

  const postAt = parseDate(body.postAt, 'postAt', errors);
  const expiresAt = parseDate(body.expiresAt, 'expiresAt', errors);
  if (postAt && expiresAt && expiresAt <= postAt) {
    errors.expiresAt = errors.expiresAt || [];
    errors.expiresAt.push('expiresAt must be after postAt');
  }

  if (status !== 'draft') {
    if (!body.content || !String(body.content).trim()) {
      errors.content = ['Content is required to publish'];
    }
  }

  return { errors, postAt, expiresAt };
}

function validateUpdatePayload(body) {
  const errors = {};
  if (body.title !== undefined && !String(body.title).trim()) {
    errors.title = ['Title cannot be empty'];
  }
  if (body.status !== undefined && !STORED_WRITE_STATUSES.includes(body.status)) {
    errors.status = ['Invalid status'];
  }
  if (body.category !== undefined && !NOTICE_CATEGORIES.includes(body.category)) {
    errors.category = ['Invalid category'];
  }
  if (body.visualKey !== undefined && body.visualKey !== null && !VISUAL_KEYS.includes(body.visualKey)) {
    errors.visualKey = ['Invalid visualKey'];
  }

  let postAt;
  let expiresAt;
  if (body.postAt !== undefined) {
    postAt = parseDate(body.postAt, 'postAt', errors);
  }
  if (body.expiresAt !== undefined) {
    expiresAt =
      body.expiresAt === null || body.expiresAt === ''
        ? null
        : parseDate(body.expiresAt, 'expiresAt', errors);
  }

  if (
    postAt &&
    expiresAt &&
    !(body.expiresAt === null || body.expiresAt === '') &&
    expiresAt <= postAt
  ) {
    errors.expiresAt = errors.expiresAt || [];
    errors.expiresAt.push('expiresAt must be after postAt');
  }

  return { errors, postAt, expiresAt };
}

function validateUpdateContentStatus(body, existing) {
  const errors = {};
  const nextStatus = body.status !== undefined ? body.status : existing.status;
  const nextContent =
    body.content !== undefined ? body.content : existing.content;
  if (nextStatus !== 'draft' && !String(nextContent || '').trim()) {
    errors.content = ['Content is required to publish'];
  }
  return errors;
}

function mapFileToAttachment(file, schoolId) {
  ensureUploadRoot();
  const sid = String(schoolId);
  const dir = path.join(UPLOAD_ROOT, sid);
  fs.mkdirSync(dir, { recursive: true });
  const id = crypto.randomUUID();
  const safe = path.basename(file.originalname || 'file').replace(/[^\w.\-]+/g, '_');
  const storageKey = path.join(sid, `${id}-${safe}`).replace(/\\/g, '/');
  const dest = path.join(UPLOAD_ROOT, storageKey);
  fs.renameSync(file.path, dest);
  return {
    id,
    fileName: file.originalname || safe,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    storageKey
  };
}

function deleteAttachmentFile(att) {
  if (!att || !att.storageKey) return;
  const abs = path.join(UPLOAD_ROOT, att.storageKey);
  fs.unlink(abs, () => {});
}

function normalizeCreateBody(req) {
  const b = { ...req.body };
  if (typeof b.removeAttachment === 'string') {
    b.removeAttachment = b.removeAttachment === 'true';
  }
  if (b.audienceReachCount !== undefined && b.audienceReachCount !== '') {
    b.audienceReachCount = Number(b.audienceReachCount);
  }
  return b;
}

exports.listNotices = async (req, res) => {
  try {
    const schoolId = schoolIdFromReq(req);
    const page = Number(req.query.page) || 1;
    const pageSize =
      Number(req.query.pageSize) || Number(req.query.limit) || 10;
    const category = req.query.category;
    const status = req.query.status || 'all';
    const q = req.query.q;
    const sort =
      req.query.sort === 'postAt_asc'
        ? { postAt: 1, publishedAt: 1, createdAt: 1 }
        : { postAt: -1, publishedAt: -1, createdAt: -1 };
    const withCounts =
      req.query.counts === '1' ||
      req.query.counts === 'true';

    const filter = buildAdminListFilter({ schoolId, category, status, q });

    const [rows, total] = await Promise.all([
      Notice.find(filter)
        .populate('createdBy', 'fullName')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort(sort)
        .lean(),
      Notice.countDocuments(filter)
    ]);

    let counts = undefined;
    if (withCounts) {
      counts = await countsByEffectiveStatus(Notice, schoolId);
    }

    const data = rows.map((n) =>
      mapNoticeToResponse(n, n.createdBy || null)
    );

    res.json({
      success: true,
      data,
      meta: { total, page, pageSize },
      ...(counts ? { countsByEffectiveStatus: counts } : {})
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notices',
      error: error.message
    });
  }
};

exports.getNotice = async (req, res) => {
  try {
    const schoolId = schoolIdFromReq(req);
    const notice = await Notice.findOne({
      _id: req.params.noticeId,
      schoolId
    })
      .populate('createdBy', 'fullName')
      .lean();

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    res.json({
      success: true,
      data: mapNoticeToResponse(notice, notice.createdBy || null)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notice',
      error: error.message
    });
  }
};

exports.createNotice = async (req, res) => {
  try {
    const schoolId = schoolIdFromReq(req);
    const admin = req.admin;
    const body = normalizeCreateBody(req);

    if (req.file) {
      if (req.file.size > MAX_ATTACHMENT_BYTES) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (_) {}
        return res.status(413).json({
          success: false,
          message: 'Attachment too large',
          errors: { attachment: [`Max size is ${MAX_ATTACHMENT_BYTES} bytes`] }
        });
      }
      if (!ALLOWED_ATTACHMENT_MIMES.has(req.file.mimetype)) {
        fs.unlink(req.file.path, () => {});
        return res.status(415).json({
          success: false,
          message: 'Unsupported media type',
          errors: { attachment: ['Allowed: PDF, DOC/DOCX, PNG, JPEG'] }
        });
      }
    }

    const { errors, postAt, expiresAt } = validateCreatePayload(body);
    if (Object.keys(errors).length) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res
        .status(400)
        .json({ success: false, message: 'Validation failed', errors });
    }

    let attachment = null;
    if (req.file) {
      attachment = mapFileToAttachment(req.file, schoolId);
    }

    const doc = {
      schoolId,
      title: String(body.title).trim(),
      content: body.content != null ? String(body.content) : '',
      category: body.category || 'Notice',
      audience: body.audience != null ? String(body.audience) : '',
      status: body.status,
      postAt,
      publishedAt: postAt || new Date(),
      expiresAt,
      publisherRole: body.publisherRole || undefined,
      visualKey: body.visualKey || undefined,
      audienceReachCount:
        body.audienceReachCount != null && !Number.isNaN(body.audienceReachCount)
          ? body.audienceReachCount
          : null,
      createdBy: admin._id,
      createdByUserId: admin._id,
      createdByOverride: body.createdBy ? String(body.createdBy).trim() : undefined,
      target: body.target || 'all',
      attachment
    };

    const notice = await Notice.create(doc);
    const populated = await Notice.findById(notice._id)
      .populate('createdBy', 'fullName')
      .lean();

    res.status(201).json({
      success: true,
      data: mapNoticeToResponse(populated, populated.createdBy || null),
      message: 'Notice created successfully'
    });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({
      success: false,
      message: 'Error creating notice',
      error: error.message
    });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const schoolId = schoolIdFromReq(req);
    const admin = req.admin;
    const body = normalizeCreateBody(req);

    const existing = await Notice.findOne({
      _id: req.params.noticeId,
      schoolId
    });
    if (!existing) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    if (req.file) {
      if (req.file.size > MAX_ATTACHMENT_BYTES) {
        fs.unlink(req.file.path, () => {});
        return res.status(413).json({
          success: false,
          message: 'Attachment too large',
          errors: { attachment: [`Max size is ${MAX_ATTACHMENT_BYTES} bytes`] }
        });
      }
      if (!ALLOWED_ATTACHMENT_MIMES.has(req.file.mimetype)) {
        fs.unlink(req.file.path, () => {});
        return res.status(415).json({
          success: false,
          message: 'Unsupported media type',
          errors: { attachment: ['Allowed: PDF, DOC/DOCX, PNG, JPEG'] }
        });
      }
    }

    const { errors, postAt, expiresAt } = validateUpdatePayload(body);
    Object.assign(errors, validateUpdateContentStatus(body, existing));
    if (Object.keys(errors).length) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res
        .status(400)
        .json({ success: false, message: 'Validation failed', errors });
    }

    const nextPostAt = postAt !== undefined ? postAt : existing.postAt;
    const nextExpiresAt =
      expiresAt !== undefined ? expiresAt : existing.expiresAt;
    if (
      nextPostAt &&
      nextExpiresAt &&
      nextExpiresAt <= nextPostAt
    ) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: { expiresAt: ['expiresAt must be after postAt'] }
      });
    }

    const patch = {};
    if (body.title !== undefined) patch.title = String(body.title).trim();
    if (body.content !== undefined) patch.content = String(body.content);
    if (body.category !== undefined) patch.category = body.category;
    if (body.audience !== undefined) patch.audience = String(body.audience);
    if (body.status !== undefined) patch.status = body.status;
    if (body.publisherRole !== undefined) {
      patch.publisherRole = body.publisherRole || null;
    }
    if (body.visualKey !== undefined) patch.visualKey = body.visualKey || null;
    if (body.audienceReachCount !== undefined) {
      patch.audienceReachCount = body.audienceReachCount;
    }
    if (body.target !== undefined) patch.target = body.target;
    if (body.createdBy !== undefined) {
      patch.createdByOverride = body.createdBy
        ? String(body.createdBy).trim()
        : '';
    }
    if (postAt !== undefined) {
      patch.postAt = postAt;
      patch.publishedAt = postAt;
    }
    if (expiresAt !== undefined) patch.expiresAt = expiresAt;

    if (req.file) {
      deleteAttachmentFile(existing.attachment);
      patch.attachment = mapFileToAttachment(req.file, schoolId);
    } else if (body.removeAttachment) {
      deleteAttachmentFile(existing.attachment);
      patch.attachment = null;
    }

    const notice = await Notice.findOneAndUpdate(
      { _id: req.params.noticeId, schoolId },
      patch,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName');

    res.json({
      success: true,
      data: mapNoticeToResponse(notice, notice.createdBy || null),
      message: 'Notice updated successfully'
    });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({
      success: false,
      message: 'Error updating notice',
      error: error.message
    });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const schoolId = schoolIdFromReq(req);
    const notice = await Notice.findOneAndDelete({
      _id: req.params.noticeId,
      schoolId
    });

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    deleteAttachmentFile(notice.attachment);

    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notice',
      error: error.message
    });
  }
};

exports.downloadAttachment = async (req, res) => {
  try {
    const schoolId = schoolIdFromReq(req);
    const notice = await Notice.findOne({
      _id: req.params.noticeId,
      schoolId
    }).lean();

    if (!notice || !notice.attachment || !notice.attachment.storageKey) {
      return res.status(404).json({ success: false, message: 'No attachment' });
    }

    const abs = path.join(UPLOAD_ROOT, notice.attachment.storageKey);
    if (!fs.existsSync(abs)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(notice.attachment.fileName)}"`
    );
    res.setHeader('Content-Type', notice.attachment.mimeType || 'application/octet-stream');
    fs.createReadStream(abs).pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downloading attachment',
      error: error.message
    });
  }
};

exports.publishNotice = async (req, res) => {
  try {
    const schoolId = schoolIdFromReq(req);
    const now = new Date();

    const notice = await Notice.findOneAndUpdate(
      { _id: req.params.noticeId, schoolId },
      {
        status: 'active',
        postAt: now,
        publishedAt: now
      },
      { new: true }
    ).populate('createdBy', 'fullName');

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    res.json({
      success: true,
      data: mapNoticeToResponse(notice, notice.createdBy || null),
      message: 'Notice published successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing notice',
      error: error.message
    });
  }
};

exports.multerErrorHandler = (err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Attachment too large',
      errors: { attachment: [`Max size is ${MAX_ATTACHMENT_BYTES} bytes`] }
    });
  }
  next(err);
};

exports.attachUpload = (req, res, next) => {
  fs.mkdirSync(UPLOAD_TMP, { recursive: true });
  multer({
    dest: UPLOAD_TMP,
    limits: { fileSize: MAX_ATTACHMENT_BYTES }
  }).single('attachment')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'Attachment too large',
        errors: { attachment: [`Max size is ${MAX_ATTACHMENT_BYTES} bytes`] }
      });
    }
    return next(err);
  });
};
