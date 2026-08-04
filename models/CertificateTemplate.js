const mongoose = require('mongoose');

const certificateTemplateSchema = new mongoose.Schema({
  templateName: { type: String, required: true, unique: true },
  language: { type: String, required: true, enum: ['English', 'Hindi', 'Urdu'], default: 'English' },
  backgroundImage: { type: String, required: true }, // base64 or URL
  width: { type: Number, default: 842 }, // Standard A4 landscape aspect ratio width
  height: { type: Number, default: 595 }, // Standard A4 landscape aspect ratio height
  textCoordinates: {
    type: Map,
    of: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      fontSize: { type: Number, default: 24 },
      fontWeight: { type: String, default: 'normal' },
      fontFamily: { type: String, default: 'serif' },
      color: { type: String, default: '#000000' },
      align: { type: String, default: 'center' },
      italic: { type: Boolean, default: false },
      rotation: { type: Number, default: 0 },
      letterSpacing: { type: Number, default: 0 },
      lineHeight: { type: Number, default: 1.2 }
    }
  },
  qrSettings: {
    enabled: { type: Boolean, default: true },
    x: { type: Number, default: 720 },
    y: { type: Number, default: 470 },
    size: { type: Number, default: 80 },
    margin: { type: Number, default: 2 }
  }
}, { timestamps: true });

module.exports = mongoose.model('CertificateTemplate', certificateTemplateSchema);
