const mongoose = require('mongoose');

const studentApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  studentName: { type: String, required: true },
  fathersName: { type: String, required: true }, // Added Father's Name for Merit List compatibility
  schoolPartner: { type: String, required: true },
  studentMobile: { type: String, required: true },
  parentMobile: { type: String, required: true },
  profilePic: { type: String, required: true }, // Added Profile Picture / Selfie
  markSheetPhoto: { type: String, required: true }, // Cloudinary URL
  rollNo: { type: String, required: true },
  examType: { type: String, required: true }, // e.g. CBSE, MPBSE
  villageName: { type: String, required: true },
  percentage: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  certificateNo: { type: String }, // Populated upon approval
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StudentApplication', studentApplicationSchema);
