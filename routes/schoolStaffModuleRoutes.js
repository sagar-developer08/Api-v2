const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const staffCtrl = require('../controllers/adminStaffController');
const { protect, requireApprovedSchool } = require('../middleware/auth');

const photosDir = path.join(__dirname, '..', 'uploads', 'staff', 'photos');
const docsDir = path.join(__dirname, '..', 'uploads', 'staff', 'documents');
fs.mkdirSync(photosDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, photosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `staff-${req.params.id}-${Date.now()}${ext}`);
  }
});

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, docsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `doc-${req.params.id}-${Date.now()}${ext}`);
  }
});

const imageFilter = (_req, file, cb) => {
  const ok =
    /\.(jpe?g|png|webp)$/i.test(file.originalname) ||
    /^image\/(jpeg|png|webp)$/i.test(file.mimetype);
  if (ok) cb(null, true);
  else cb(new Error('UNSUPPORTED_MEDIA'));
};

const staffPhotoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter
});

const staffDocUpload = multer({
  storage: docStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

function multerStaffError(err, _req, res, next) {
  if (!err) return next();
  if (err.message === 'UNSUPPORTED_MEDIA') {
    return res.status(415).json({ success: false, message: 'Only JPEG, PNG, or WebP images allowed' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large' });
  }
  next(err);
}

const router = express.Router();
router.use(protect, requireApprovedSchool);

router.get('/:schoolId/staff/summary', staffCtrl.getSummary);
router.get('/:schoolId/staff/attendance-summary', staffCtrl.getAttendanceSummary);
router.get('/:schoolId/staff/eligible-managers', staffCtrl.getEligibleManagers);
router.get('/:schoolId/staff', staffCtrl.list);
router.post('/:schoolId/staff', staffCtrl.create);
router.get('/:schoolId/staff/:id', staffCtrl.getOne);
router.patch('/:schoolId/staff/:id', staffCtrl.patch);
router.put('/:schoolId/staff/:id', staffCtrl.patch);
router.delete('/:schoolId/staff/:id', staffCtrl.remove);
router.post(
  '/:schoolId/staff/:id/photo',
  staffPhotoUpload.single('photo'),
  multerStaffError,
  staffCtrl.uploadPhoto
);
router.delete('/:schoolId/staff/:id/photo', staffCtrl.deletePhoto);
router.get('/:schoolId/staff/:id/documents', staffCtrl.listDocuments);
router.post(
  '/:schoolId/staff/:id/documents',
  staffDocUpload.single('file'),
  multerStaffError,
  staffCtrl.uploadDocument
);
router.get('/:schoolId/staff/:id/documents/:documentId/download', staffCtrl.downloadDocument);
router.delete('/:schoolId/staff/:id/documents/:documentId', staffCtrl.deleteDocument);

module.exports = router;
