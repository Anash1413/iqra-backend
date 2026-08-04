const CertificateTemplate = require('../models/CertificateTemplate');
const Certificate = require('../models/Certificate');
const Student = require('../models/Student');
const crypto = require('crypto');

// Helper to check if a date is today
const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// @desc    Get all certificate templates
// @route   GET /api/certificates/templates
// @access  Private
exports.getTemplates = async (req, res) => {
  try {
    const templates = await CertificateTemplate.find({});
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new certificate template
// @route   POST /api/certificates/templates
// @access  Private (Super Admin / Admin)
exports.createTemplate = async (req, res) => {
  try {
    const { templateName, language, backgroundImage, width, height, textCoordinates, qrSettings } = req.body;

    if (!templateName || !backgroundImage) {
      return res.status(400).json({ success: false, message: 'Template name and background image are required.' });
    }

    const templateExists = await CertificateTemplate.findOne({ templateName });
    if (templateExists) {
      return res.status(400).json({ success: false, message: 'A template with this name already exists.' });
    }

    const template = await CertificateTemplate.create({
      templateName,
      language,
      backgroundImage,
      width,
      height,
      textCoordinates,
      qrSettings
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a certificate template
// @route   PUT /api/certificates/templates/:id
// @access  Private (Super Admin / Admin)
exports.updateTemplate = async (req, res) => {
  try {
    const { templateName, language, backgroundImage, width, height, textCoordinates, qrSettings } = req.body;

    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    template.templateName = templateName || template.templateName;
    template.language = language || template.language;
    template.backgroundImage = backgroundImage || template.backgroundImage;
    template.width = width !== undefined ? width : template.width;
    template.height = height !== undefined ? height : template.height;
    if (textCoordinates) template.textCoordinates = textCoordinates;
    if (qrSettings) template.qrSettings = qrSettings;

    const updatedTemplate = await template.save();
    res.json({ success: true, data: updatedTemplate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a certificate template
// @route   DELETE /api/certificates/templates/:id
// @access  Private (Super Admin / Admin)
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    await template.deleteOne();
    res.json({ success: true, message: 'Template deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get next auto-incremented certificate number
// @route   GET /api/certificates/next-number
// @access  Private
exports.getNextCertificateNo = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const prefix = `IQRA/${year}/`;
    
    // Find the latest certificate with the prefix
    const latestCert = await Certificate.findOne({
      certificateNo: new RegExp(`^${prefix}`)
    }).sort({ createdAt: -1 });

    let nextNum = 1;
    if (latestCert) {
      const parts = latestCert.certificateNo.split('/');
      const lastIndex = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastIndex)) {
        nextNum = lastIndex + 1;
      }
    }

    // Format as IQRA/YEAR/001
    const nextCertificateNo = `${prefix}${String(nextNum).padStart(3, '0')}`;
    res.json({ success: true, nextCertificateNo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record generated certificate
// @route   POST /api/certificates/history
// @access  Private
exports.recordCertificate = async (req, res) => {
  try {
    const payload = req.body;

    // Handle Bulk Array payload
    if (Array.isArray(payload)) {
      if (payload.length === 0) {
        return res.status(400).json({ success: false, message: 'Payload array cannot be empty.' });
      }

      // Check validations
      const certNumbers = payload.map(c => c.certificateNo);
      
      // Look for DB duplicates
      const existingCerts = await Certificate.find({ certificateNo: { $in: certNumbers } });
      if (existingCerts.length > 0) {
        const dupNumbers = existingCerts.map(c => c.certificateNo).join(', ');
        return res.status(400).json({ success: false, message: `The following certificate numbers already exist: ${dupNumbers}` });
      }

      // Format documents to insert
      const documents = payload.map(item => {
        if (!item.studentName || !item.certificateNo || !item.templateId) {
          throw new Error('Student Name, Certificate Number, and Template ID are required for all entries.');
        }
        return {
          studentName: item.studentName,
          fatherName: item.fatherName,
          class: item.class,
          board: item.board,
          percentage: item.percentage,
          awardName: item.awardName,
          awardYear: item.awardYear,
          certificateNo: item.certificateNo,
          issueDate: item.issueDate || new Date(),
          language: item.language || 'English',
          templateId: item.templateId,
          verificationToken: crypto.randomBytes(16).toString('hex'),
          generatedBy: req.user ? req.user._id : null
        };
      });

      const inserted = await Certificate.insertMany(documents);
      return res.status(201).json({ success: true, count: inserted.length, data: inserted });
    }

    // Handle Single Certificate payload
    const { studentName, fatherName, class: className, board, percentage, awardName, awardYear, certificateNo, issueDate, language, templateId } = payload;

    if (!studentName || !certificateNo || !templateId) {
      return res.status(400).json({ success: false, message: 'Student Name, Certificate Number, and Template ID are required.' });
    }

    const certExists = await Certificate.findOne({ certificateNo });
    if (certExists) {
      return res.status(400).json({ success: false, message: `Certificate number ${certificateNo} is already allocated.` });
    }

    const verificationToken = crypto.randomBytes(16).toString('hex');

    const certificate = await Certificate.create({
      studentName,
      fatherName,
      class: className,
      board,
      percentage,
      awardName,
      awardYear,
      certificateNo,
      issueDate: issueDate || new Date(),
      language: language || 'English',
      templateId,
      verificationToken,
      generatedBy: req.user ? req.user._id : null
    });

    res.status(201).json({ success: true, data: certificate });
  } catch (error) {
    res.status(550).json({ success: false, message: error.message });
  }
};

// @desc    Get certificate audit history
// @route   GET /api/certificates/history
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const { search, language, awardYear } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { certificateNo: { $regex: search, $options: 'i' } }
      ];
    }
    if (language) query.language = language;
    if (awardYear) query.awardYear = Number(awardYear);

    const history = await Certificate.find(query)
      .populate('templateId')
      .populate('generatedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a certificate audit history record
// @route   DELETE /api/certificates/history/:id
// @access  Private (Super Admin / Admin)
exports.deleteHistoryRecord = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate record not found.' });
    }

    await certificate.deleteOne();
    res.json({ success: true, message: 'Certificate record removed from history logs.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics for certificate generation module
// @route   GET /api/certificates/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const totalCertificates = await Certificate.countDocuments({});
    
    // Calculated generated today count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const generatedToday = await Certificate.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    const totalStudents = await Student.countDocuments({});
    const templatesAvailable = await CertificateTemplate.countDocuments({});

    // Simulated downloads today (incremental audits can track this later)
    const downloadedToday = Math.max(0, generatedToday);

    res.json({
      success: true,
      data: {
        totalCertificates,
        generatedToday,
        totalStudents,
        downloadedToday,
        templatesAvailable,
        pending: 0 // Stub for future workflow processes
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public verification of certificate
// @route   GET /api/certificates/verify/:certificateNoOrToken
// @access  Public
exports.verifyCertificate = async (req, res) => {
  try {
    const rawIdentifier = req.params.certificateNoOrToken;
    const identifier = rawIdentifier ? decodeURIComponent(rawIdentifier) : '';
    
    // Find either by token or certificateNo
    const certificate = await Certificate.findOne({
      $or: [
        { certificateNo: identifier },
        { verificationToken: identifier }
      ]
    }).populate('templateId');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate Not Found.' });
    }

    res.json({
      success: true,
      verified: true,
      data: certificate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
