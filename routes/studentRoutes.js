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

const {
  submitApplication,
  getApplicationMe,
  listApplicationsAdmin,
  reviewApplicationAdmin
} = require('../controllers/studentApplicationController');

// Public routes
router.get('/', getStudents);
router.get('/:id', getStudentById);

// Student Nomination Form endpoints
router.post('/application', protect, upload.fields([
  { name: 'markSheetPhoto', maxCount: 1 },
  { name: 'profilePic', maxCount: 1 }
]), submitApplication);
router.get('/application/me', protect, getApplicationMe);

// Admin-only protected routes
router.get('/admin/list', protect, adminOnly, getStudentsAdmin);
router.post('/', protect, adminOnly, upload.single('profilePic'), createStudent);
router.put('/:id', protect, adminOnly, upload.single('profilePic'), updateStudent);
router.delete('/:id', protect, adminOnly, deleteStudent);

// Admin-only student applications review endpoints
router.get('/application/admin/list', protect, adminOnly, listApplicationsAdmin);
router.put('/application/admin/review/:id', protect, adminOnly, reviewApplicationAdmin);

module.exports = router;
