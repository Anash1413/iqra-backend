const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema({
  page: { type: String, enum: ['home', 'about', 'contact', 'global'], unique: true, required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PageContent', pageContentSchema);
