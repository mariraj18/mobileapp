const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FILE_UPLOAD } = require('../../config/constants');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: ' + FILE_UPLOAD.ALLOWED_TYPES.join(', ')), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE,
  },
  fileFilter,
});

const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports = {
  upload,
  deleteFile,
};
