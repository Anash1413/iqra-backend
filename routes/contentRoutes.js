const express = require('express');
const router = express.Router();
const {
  getPageContent,
  updatePageContent,
  uploadMedia
} = require('../controllers/contentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public route to fetch page configurations
router.get('/:page', getPageContent);

// Admin-only updates and asset uploads
router.put('/:page', protect, adminOnly, updatePageContent);
router.post('/upload-media', protect, adminOnly, upload.single('media'), uploadMedia);

module.exports = router;
