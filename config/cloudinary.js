const cloudinary = require('cloudinary').v2;

// Configure Cloudinary credentials from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an in-memory file buffer directly to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer from multer memoryStorage
 * @param {String} folderName - Cloudinary folder name
 * @returns {Promise<Object>} Cloudinary API response
 */
const uploadFromBuffer = (fileBuffer, folderName = 'iqra') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    stream.write(fileBuffer);
    stream.end();
  });
};

module.exports = {
  cloudinary,
  uploadFromBuffer
};
