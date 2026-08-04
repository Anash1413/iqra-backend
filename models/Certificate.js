const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  fatherName: { type: String },
  class: { type: String },
  board: { type: String },
  percentage: { type: String },
  awardName: { type: String },
  awardYear: { type: Number },
  certificateNo: { type: String, required: true, unique: true },
  issueDate: { type: Date, default: Date.now },
  language: { type: String, required: true, default: 'English' },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'CertificateTemplate', required: true },
  verificationToken: { type: String, required: true, unique: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
