const express = require('express');
const router = express.Router();
const { 
  getTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate, 
  getNextCertificateNo, 
  recordCertificate, 
  getHistory, 
  deleteHistoryRecord, 
  getStats, 
  verifyCertificate 
} = require('../controllers/certificateController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public verification route
router.get('/verify/:certificateNoOrToken(*)', verifyCertificate);

// Protected routes (require user login)
router.get('/templates', protect, getTemplates);
router.post('/templates', protect, adminOnly, createTemplate);
router.put('/templates/:id', protect, adminOnly, updateTemplate);
router.delete('/templates/:id', protect, adminOnly, deleteTemplate);

router.get('/next-number', protect, getNextCertificateNo);
router.post('/history', protect, recordCertificate);
router.get('/history', protect, getHistory);
router.delete('/history/:id', protect, adminOnly, deleteHistoryRecord);
router.get('/stats', protect, getStats);

module.exports = router;
