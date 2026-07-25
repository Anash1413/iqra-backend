const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentsAdmin,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getStudents);
router.get('/:id', getStudentById);

// Admin-only protected routes
router.get('/admin/list', protect, adminOnly, getStudentsAdmin);
router.post('/', protect, adminOnly, upload.single('profilePic'), createStudent);
router.put('/:id', protect, adminOnly, upload.single('profilePic'), updateStudent);
router.delete('/:id', protect, adminOnly, deleteStudent);

module.exports = router;
