const User = require('../models/User');
const Settings = require('../models/Settings');

// @desc    Add new admin (Super Admin only)
// @route   POST /api/admin/add-admin
// @access  Private (Super Admin)
const addAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    // Check if admin already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const newAdmin = await User.create({
      name,
      email,
      password,
      role: role === 'superadmin' ? 'superadmin' : 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List all admins (Super Admin only)
// @route   GET /api/admin/list-admins
// @access  Private (Super Admin)
const listAdmins = async (req, res) => {
  try {
    const admins = await User.find({}).select('-password');
    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete admin (Super Admin only, cannot delete self or last superadmin)
// @route   DELETE /api/admin/:id
// @access  Private (Super Admin)
const deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;

    // Prevent deleting self
    if (adminId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const adminToDelete = await User.findById(adminId);
    if (!adminToDelete) {
      return res.status(444).json({ success: false, message: 'Admin not found' });
    }

    // If deleting a superadmin, ensure there is at least one other superadmin remaining
    if (adminToDelete.role === 'superadmin') {
      const superAdminCount = await User.countDocuments({ role: 'superadmin' });
      if (superAdminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the only remaining Super Admin account' });
      }
    }

    await User.findByIdAndDelete(adminId);
    res.json({ success: true, message: 'Admin account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle public registrations (Super Admin only)
// @route   PUT /api/admin/toggle-registration
// @access  Private (Super Admin)
const toggleRegistration = async (req, res) => {
  try {
    const { allowPublicRegistration, allowStudentForm } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ 
        allowPublicRegistration: allowPublicRegistration !== undefined ? allowPublicRegistration : false,
        allowStudentForm: allowStudentForm !== undefined ? allowStudentForm : false
      });
    } else {
      if (allowPublicRegistration !== undefined) settings.allowPublicRegistration = allowPublicRegistration;
      if (allowStudentForm !== undefined) settings.allowStudentForm = allowStudentForm;
      await settings.save();
    }

    res.json({
      success: true,
      message: 'System settings updated successfully.',
      data: settings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public registration status
// @route   GET /api/admin/registration-status
// @access  Public
const getRegistrationStatus = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ allowPublicRegistration: false, allowStudentForm: false });
    }
    res.json({
      success: true,
      data: {
        allowPublicRegistration: settings.allowPublicRegistration,
        allowStudentForm: settings.allowStudentForm
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addAdmin,
  listAdmins,
  deleteAdmin,
  toggleRegistration,
  getRegistrationStatus
};
