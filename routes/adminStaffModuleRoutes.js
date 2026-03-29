const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const staffCtrl = require('../controllers/adminStaffController');

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

router.get('/staff/summary', staffCtrl.getSummary);
router.get('/staff/attendance-summary', staffCtrl.getAttendanceSummary);
router.get('/staff/eligible-managers', staffCtrl.getEligibleManagers);
router.get('/staff', staffCtrl.list);
router.post('/staff', staffCtrl.create);
router.get('/staff/:id', staffCtrl.getOne);
router.patch('/staff/:id', staffCtrl.patch);
router.put('/staff/:id', staffCtrl.patch);
router.delete('/staff/:id', staffCtrl.remove);
router.post(
  '/staff/:id/photo',
  staffPhotoUpload.single('photo'),
  multerStaffError,
  staffCtrl.uploadPhoto
);
router.delete('/staff/:id/photo', staffCtrl.deletePhoto);
router.get('/staff/:id/documents', staffCtrl.listDocuments);
router.post(
  '/staff/:id/documents',
  staffDocUpload.single('file'),
  multerStaffError,
  staffCtrl.uploadDocument
);
router.get('/staff/:id/documents/:documentId/download', staffCtrl.downloadDocument);
router.delete('/staff/:id/documents/:documentId', staffCtrl.deleteDocument);

module.exports = router;
