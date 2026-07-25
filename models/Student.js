const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fathersName: { type: String },
  studentPhone: { type: String },
  parentsPhone: { type: String },
  schoolName: { type: String, required: true },
  rollNumber: { type: String },
  examType: { type: String, enum: ['secular', 'islamic'], required: true },
  board: { type: String, required: true },
  score: { type: String, required: true },
  year: { type: Number, required: true },
  profilePic: { type: String },
  
  // Privacy configuration: what is visible to the public
  visibility: {
    fathersName: { type: Boolean, default: true },
    studentPhone: { type: Boolean, default: false },
    parentsPhone: { type: Boolean, default: false },
    rollNumber: { type: Boolean, default: false },
    profilePic: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
