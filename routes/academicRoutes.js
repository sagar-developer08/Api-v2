const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentStatistics,
  getStudentGuardians,
  addGuardian,
  // getAllTeachers,
  // createTeacher,
  getAllSections,
  createSection,
  getAllSubjects,
  createSubject
} = require('../controllers/academicController');

router.use(protect);

// Student Statistics (Must be before :id route)
router.get('/students/statistics', getStudentStatistics);

// Student Routes
router.route('/students')
  .get(getAllStudents)
  .post(createStudent);

router.route('/students/:id')
  .get(getStudentById)
  .put(updateStudent)
  .patch(updateStudent)
  .delete(deleteStudent);

// Student Guardian Routes
router.route('/students/:id/guardians')
  .get(getStudentGuardians)
  .post(addGuardian);

// Other Academic Routes
// Teacher routes moved to teacherRoutes.js
// router.route('/teachers') ...

router.route('/sections')
  .get(getAllSections)
  .post(createSection);

router.route('/subjects')
  .get(getAllSubjects)
  .post(createSubject);

module.exports = router;
