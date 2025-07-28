const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middlewares/verifytoken');
const { checkRole } = require('../middlewares/checkRole');

// Get All Students
router.get(
  '/',
  verifyToken,
  checkRole(['manager', 'student']),
  studentController.getAllStudents
);

// Get Student by ID
router.get(
  '/:id',
  verifyToken,
  checkRole(['manager', 'student']),
  studentController.getStudentById
);

// Update Student 
router.put(
  '/:id',
  verifyToken,
  checkRole(['manager', 'student']),
  studentController.updateStudent
);

// Delete Student 
router.delete(
  '/:id',
  verifyToken,
  checkRole(['manager']),
  studentController.deleteStudent
);

module.exports = router;