const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllTeachers,
  createTeacher,
  getTeacherById,
  updateTeacher,
  deleteTeacher
} = require('../controllers/teacherController');

router.use(protect);

router.route('/')
  .get(getAllTeachers)
  .post(createTeacher);

router.route('/:id')
  .get(getTeacherById)
  .put(updateTeacher)
  .delete(deleteTeacher);

module.exports = router;
