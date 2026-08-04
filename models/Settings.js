const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  allowPublicRegistration: { type: Boolean, default: false },
  allowStudentForm: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
