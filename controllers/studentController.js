const Student = require('../models/Student');
const { uploadFromBuffer } = require('../config/cloudinary');

// Helper to mask sensitive fields for public view based on visibility flags
const maskStudentPublic = (student) => {
  const studentObj = student.toObject();
  
  if (!student.visibility.fathersName) {
    delete studentObj.fathersName;
  }
  if (!student.visibility.studentPhone) {
    delete studentObj.studentPhone;
  }
  if (!student.visibility.parentsPhone) {
    delete studentObj.parentsPhone;
  }
  if (!student.visibility.rollNumber) {
    delete studentObj.rollNumber;
  }
  if (!student.visibility.profilePic) {
    delete studentObj.profilePic;
  }
  
  return studentObj;
};

// @desc    Get all students (Public view with privacy filters)
// @route   GET /api/students
// @access  Public
const getStudents = async (req, res) => {
  try {
    const { year, examType, board, search } = req.query;
    
    // Build query filters
    const query = {};
    if (year) query.year = Number(year);
    if (examType) query.examType = examType;
    if (board) query.board = board;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const students = await Student.find(query).sort({ score: -1, name: 1 });
    
    // Map through students and apply masking
    const publicStudents = students.map(maskStudentPublic);

    res.json({
      success: true,
      count: publicStudents.length,
      data: publicStudents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students with full details (Admin view)
// @route   GET /api/students/admin-list
// @access  Private (Admin/Super Admin)
const getStudentsAdmin = async (req, res) => {
  try {
    const { year, examType, board, search } = req.query;
    
    const query = {};
    if (year) query.year = Number(year);
    if (examType) query.examType = examType;
    if (board) query.board = board;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const students = await Student.find(query).sort({ year: -1, score: -1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student details (Checks authorization dynamically)
// @route   GET /api/students/:id
// @access  Public / Private (Admin gets full details, public gets masked details)
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Try to see if client sent an Admin/SuperAdmin JWT token to retrieve full details
    // (Optional enhancement: checks token dynamically if available in authorization header)
    const authHeader = req.headers.authorization;
    let isAdmin = false;

    if (authHeader && authHeader.startsWith('Bearer')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && (user.role === 'admin' || user.role === 'superadmin')) {
          isAdmin = true;
        }
      } catch (err) {
        // Fall back to public view if token is invalid
        isAdmin = false;
      }
    }

    if (isAdmin) {
      return res.json({ success: true, data: student });
    } else {
      return res.json({ success: true, data: maskStudentPublic(student) });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create student entry (Admin only)
// @route   POST /api/students
// @access  Private (Admin/Super Admin)
const createStudent = async (req, res) => {
  try {
    const {
      name,
      fathersName,
      studentPhone,
      parentsPhone,
      schoolName,
      rollNumber,
      examType,
      board,
      score,
      year,
      visibility // JSON string when sent with multipart form
    } = req.body;

    if (!name || !schoolName || !examType || !board || !score || !year) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    let profilePicUrl = '';
    if (req.file) {
      const uploadResult = await uploadFromBuffer(req.file.buffer, 'iqra/students');
      profilePicUrl = uploadResult.secure_url;
    }

    // Parse visibility settings if provided as JSON string, otherwise use default schema settings
    let visibilitySettings;
    if (visibility) {
      try {
        visibilitySettings = JSON.parse(visibility);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid format for visibility object' });
      }
    }

    const student = await Student.create({
      name,
      fathersName,
      studentPhone,
      parentsPhone,
      schoolName,
      rollNumber,
      examType,
      board,
      score,
      year: Number(year),
      profilePic: profilePicUrl,
      visibility: visibilitySettings
    });

    res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student entry (Admin only)
// @route   PUT /api/students/:id
// @access  Private (Admin/Super Admin)
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const updateData = { ...req.body };

    // Handle new profile pic upload if provided
    if (req.file) {
      const uploadResult = await uploadFromBuffer(req.file.buffer, 'iqra/students');
      updateData.profilePic = uploadResult.secure_url;
    }

    // Parse visibility settings if provided as JSON string
    if (updateData.visibility && typeof updateData.visibility === 'string') {
      try {
        updateData.visibility = JSON.parse(updateData.visibility);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid format for visibility object' });
      }
    }

    if (updateData.year) {
      updateData.year = Number(updateData.year);
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Student record updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete student entry (Admin only)
// @route   DELETE /api/students/:id
// @access  Private (Admin/Super Admin)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudents,
  getStudentsAdmin,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
