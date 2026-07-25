const PageContent = require('../models/PageContent');
const { uploadFromBuffer } = require('../config/cloudinary');

// Starter data templates for automatic database bootstrapping
const DEFAULT_CONTENT = {
  home: {
    heroTitle: 'IQRA Foundation',
    heroSubtitle: 'Rewarding Academic Excellence in Secular & Religious Education',
    welcomeText: 'The IQRA Foundation stands to promote and reward academic excellence. Every year, we recognize outstanding student achievers in both secular boards (CBSE, ICSE, MP Board) and traditional Islamic curricula.',
    stats: [
      { label: 'Total Awards given', value: '500+' },
      { label: 'Covered Boards', value: '5+' },
      { label: 'Active Years', value: '3+' }
    ]
  },
  about: {
    title: 'About Our Foundation',
    mission: 'To inspire, support, and motivate students toward higher academic achievement and robust moral character, creating a balanced future generation.',
    vision: 'To build an educational support system that bridges the gap between secular achievements and spiritual scholarship.',
    history: 'Established to create healthy motivation in student circles, IQRA Foundation has been rewarding top achievers annually, building a legacy of excellence.',
    team: [
      { name: 'Founder Name', role: 'President & Chairman', photo: '' }
    ]
  },
  contact: {
    phone: '+91 9685244563',
    email: 'info@iqrafoundation.org',
    address: 'Station Road Amdara District Maihar',
    workingHours: 'Mon - Sat: 9:00 AM - 5:00 PM',
    socialLinks: {
      facebook: 'https://facebook.com/iqrafoundation',
      instagram: 'https://instagram.com/iqrafoundation',
      youtube: 'https://youtube.com/iqrafoundation'
    }
  },
  global: {
    logoUrl: '',
    footerText: '© 2026 IQRA Foundation. Empowering Student Growth.'
  }
};

// @desc    Get dynamic page content (bootstraps defaults if missing)
// @route   GET /api/content/:page
// @access  Public
const getPageContent = async (req, res) => {
  try {
    const pageName = req.params.page;
    
    if (!['home', 'about', 'contact', 'global'].includes(pageName)) {
      return res.status(400).json({ success: false, message: 'Invalid page name parameter' });
    }

    let pageContent = await PageContent.findOne({ page: pageName });
    
    // Bootstrap default content if first time loading
    if (!pageContent) {
      pageContent = await PageContent.create({
        page: pageName,
        content: DEFAULT_CONTENT[pageName]
      });
    }

    res.json({
      success: true,
      data: pageContent.content
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update dynamic page content
// @route   PUT /api/content/:page
// @access  Private (Admin/Super Admin)
const updatePageContent = async (req, res) => {
  try {
    const pageName = req.params.page;

    if (!['home', 'about', 'contact', 'global'].includes(pageName)) {
      return res.status(400).json({ success: false, message: 'Invalid page name parameter' });
    }

    let pageContent = await PageContent.findOne({ page: pageName });

    if (!pageContent) {
      pageContent = await PageContent.create({
        page: pageName,
        content: req.body
      });
    } else {
      pageContent.content = req.body;
      await pageContent.save();
    }

    res.json({
      success: true,
      message: `${pageName} content updated successfully`,
      data: pageContent.content
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload media assets for CMS dynamically (Admin only)
// @route   POST /api/content/upload-media
// @access  Private (Admin/Super Admin)
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const uploadResult = await uploadFromBuffer(req.file.buffer, 'iqra/assets');
    
    res.json({
      success: true,
      message: 'Media asset uploaded successfully',
      url: uploadResult.secure_url
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPageContent,
  updatePageContent,
  uploadMedia
};
