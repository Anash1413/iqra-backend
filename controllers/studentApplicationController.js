const StudentApplication = require('../models/StudentApplication');
const Certificate = require('../models/Certificate');
const Student = require('../models/Student'); // Merit List Student Model
const { uploadFromBuffer } = require('../config/cloudinary');

// Helper to map exam types to secular/islamic categories
const getExamCategory = (examType) => {
  const islamicBoards = ['madrasa', 'hifz'];
  if (examType && islamicBoards.includes(examType.toLowerCase())) {
    return 'islamic';
  }
  return 'secular';
};

// @desc    Submit or update student application/nomination
// @route   POST /api/students/application
// @access  Private (User/Student role)
exports.submitApplication = async (req, res) => {
  try {
    const { 
      studentName, 
      fathersName,
      schoolPartner, 
      studentMobile, 
      parentMobile, 
      rollNo, 
      examType, 
      villageName, 
      percentage 
    } = req.body;

    if (!studentName || !fathersName || !schoolPartner || !studentMobile || !parentMobile || !rollNo || !examType || !villageName || !percentage) {
      return res.status(400).json({ success: false, message: 'All text fields are required.' });
    }

    let markSheetPhoto = req.body.markSheetPhoto;
    let profilePic = req.body.profilePic;

    // Handle files uploads if present
    if (req.files) {
      if (req.files['markSheetPhoto'] && req.files['markSheetPhoto'][0]) {
        const uploadResult = await uploadFromBuffer(req.files['markSheetPhoto'][0].buffer, 'iqra/marksheets');
        markSheetPhoto = uploadResult.secure_url;
      }
      if (req.files['profilePic'] && req.files['profilePic'][0]) {
        const uploadResult = await uploadFromBuffer(req.files['profilePic'][0].buffer, 'iqra/profiles');
        profilePic = uploadResult.secure_url;
      }
    }

    if (!markSheetPhoto) {
      return res.status(400).json({ success: false, message: 'Marksheet photo is required.' });
    }

    if (!profilePic) {
      return res.status(400).json({ success: false, message: 'Profile picture / selfie is required.' });
    }

    // Check if application already exists for this user
    let application = await StudentApplication.findOne({ userId: req.user._id });

    if (application) {
      // Allow editing if status is not already approved
      if (application.status === 'Approved') {
        return res.status(400).json({ success: false, message: 'Approved applications cannot be modified.' });
      }

      application.studentName = studentName;
      application.fathersName = fathersName;
      application.schoolPartner = schoolPartner;
      application.studentMobile = studentMobile;
      application.parentMobile = parentMobile;
      application.markSheetPhoto = markSheetPhoto;
      application.profilePic = profilePic;
      application.rollNo = rollNo;
      application.examType = examType;
      application.villageName = villageName;
      application.percentage = percentage;
      application.status = 'Pending'; // Reset to pending for admin re-verification

      await application.save();
      res.json({ success: true, message: 'Nomination details updated successfully.', data: application });
    } else {
      application = await StudentApplication.create({
        userId: req.user._id,
        studentName,
        fathersName,
        schoolPartner,
        studentMobile,
        parentMobile,
        markSheetPhoto,
        profilePic,
        rollNo,
        examType,
        villageName,
        percentage
      });
      res.status(201).json({ success: true, message: 'Nomination details submitted successfully.', data: application });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's application and linked certificate
// @route   GET /api/students/application/me
// @access  Private (User/Student role)
exports.getApplicationMe = async (req, res) => {
  try {
    const application = await StudentApplication.findOne({ userId: req.user._id });
    if (!application) {
      return res.json({ success: true, data: null });
    }

    let certificate = null;
    if (application.status === 'Approved' && application.certificateNo) {
      certificate = await Certificate.findOne({ certificateNo: application.certificateNo }).populate('templateId');
    }

    res.json({
      success: true,
      data: {
        application,
        certificate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List all student applications (Admin only)
// @route   GET /api/students/application/admin/list
// @access  Private (Admin/Super Admin)
exports.listApplicationsAdmin = async (req, res) => {
  try {
    const list = await StudentApplication.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review/Approve/Reject student application (Admin only)
// @route   PUT /api/students/application/admin/review/:id
// @access  Private (Admin/Super Admin)
exports.reviewApplicationAdmin = async (req, res) => {
  try {
    const { status, certificateNo, remarks } = req.body;

    if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required.' });
    }

    const application = await StudentApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Capture previous status
    const previousStatus = application.status;

    application.status = status;
    if (status === 'Approved') {
      if (!certificateNo) {
        return res.status(400).json({ success: false, message: 'Certificate Number is required for approval.' });
      }
      application.certificateNo = certificateNo;

      // Automatically add user to the Student merit list if transitioning to Approved
      if (previousStatus !== 'Approved') {
        await Student.create({
          name: application.studentName,
          fathersName: application.fathersName,
          studentPhone: application.studentMobile,
          parentsPhone: application.parentMobile,
          schoolName: application.schoolPartner,
          rollNumber: application.rollNo,
          examType: getExamCategory(application.examType),
          board: application.examType,
          score: application.percentage,
          year: new Date().getFullYear(),
          profilePic: application.profilePic,
          visibility: {
            fathersName: true,
            studentPhone: false,
            parentsPhone: false,
            rollNumber: false,
            profilePic: true
          }
        });
      }
    } else {
      application.certificateNo = undefined;
    }
    
    if (remarks !== undefined) application.remarks = remarks;

    await application.save();
    res.json({ success: true, message: `Application status set to ${status}.`, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
