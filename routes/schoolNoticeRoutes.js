const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, requireApprovedSchool } = require('../middleware/auth');
const matchSchoolIdParam = require('../middleware/matchSchoolIdParam');
const noticeCtrl = require('../controllers/noticeBoardController');
const {
  listQuery,
  noticeIdParam,
  handleNoticeValidationErrors
} = require('../validators/noticeBoardValidators');

const adminSchool = [protect, requireApprovedSchool, matchSchoolIdParam];

router.get(
  '/:schoolId/notices',
  ...adminSchool,
  listQuery,
  handleNoticeValidationErrors,
  noticeCtrl.listNotices
);

router.post('/:schoolId/notices', ...adminSchool, noticeCtrl.attachUpload, noticeCtrl.createNotice);

router.get(
  '/:schoolId/notices/:noticeId',
  ...adminSchool,
  noticeIdParam,
  handleNoticeValidationErrors,
  noticeCtrl.getNotice
);

router.patch(
  '/:schoolId/notices/:noticeId',
  ...adminSchool,
  noticeIdParam,
  handleNoticeValidationErrors,
  noticeCtrl.attachUpload,
  noticeCtrl.updateNotice
);

router.put(
  '/:schoolId/notices/:noticeId',
  ...adminSchool,
  noticeIdParam,
  handleNoticeValidationErrors,
  noticeCtrl.attachUpload,
  noticeCtrl.updateNotice
);

router.delete(
  '/:schoolId/notices/:noticeId',
  ...adminSchool,
  noticeIdParam,
  handleNoticeValidationErrors,
  noticeCtrl.deleteNotice
);

router.get(
  '/:schoolId/notices/:noticeId/attachment',
  ...adminSchool,
  noticeIdParam,
  handleNoticeValidationErrors,
  noticeCtrl.downloadAttachment
);

router.post(
  '/:schoolId/notices/:noticeId/publish',
  ...adminSchool,
  noticeIdParam,
  handleNoticeValidationErrors,
  noticeCtrl.publishNotice
);

module.exports = router;
