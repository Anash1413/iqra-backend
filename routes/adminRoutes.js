const express = require('express');
const router = express.Router();
const {
  addAdmin,
  listAdmins,
  deleteAdmin,
  toggleRegistration,
  getRegistrationStatus
} = require('../controllers/adminController');
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

// Super Admin restricted routes
router.post('/add-admin', protect, superAdminOnly, addAdmin);
router.get('/list-admins', protect, superAdminOnly, listAdmins);
router.delete('/:id', protect, superAdminOnly, deleteAdmin);
router.put('/toggle-registration', protect, superAdminOnly, toggleRegistration);

// Public routes
router.get('/registration-status', getRegistrationStatus);

module.exports = router;
