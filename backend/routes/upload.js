// backend/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateJWT } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/json',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and audio files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// POST /api/upload/single - Upload a single file
router.post('/single', authenticateJWT, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    };

    res.json({ 
      success: true, 
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'File upload failed', 
      error: error.message 
    });
  }
});

// POST /api/upload/multiple - Upload multiple files
router.post('/multiple', authenticateJWT, upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }

    const filesInfo = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }));

    res.json({ 
      success: true, 
      message: `${filesInfo.length} files uploaded successfully`,
      files: filesInfo
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'File upload failed', 
      error: error.message 
    });
  }
});

// GET /api/upload/files - List uploaded files
router.get('/files', authenticateJWT, (req, res) => {
  try {
    const uploadDir = 'uploads/';
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({ 
        success: true, 
        files: [],
        message: 'No uploads directory found' 
      });
    }

    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to read uploads directory', 
          error: err.message 
        });
      }

      const fileList = files.map(filename => {
        const filePath = path.join(uploadDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          uploadedAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      });

      res.json({ 
        success: true, 
        files: fileList,
        count: fileList.length
      });
    });
  } catch (error) {
    console.error('File listing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to list files', 
      error: error.message 
    });
  }
});

// GET /api/upload/file/:filename - Download/access a specific file
router.get('/file/:filename', authenticateJWT, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'File download failed', 
      error: error.message 
    });
  }
});

// DELETE /api/upload/file/:filename - Delete a specific file
router.delete('/file/:filename', authenticateJWT, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to delete file', 
          error: err.message 
        });
      }

      res.json({ 
        success: true, 
        message: 'File deleted successfully',
        filename
      });
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'File deletion failed', 
      error: error.message 
    });
  }
});

// POST /api/upload/avatar - Upload user avatar
router.post('/avatar', authenticateJWT, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No avatar file uploaded' 
      });
    }

    // Check if it's an image file
    if (!req.file.mimetype.startsWith('image/')) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Only image files are allowed for avatars' 
      });
    }

    const avatarInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    };

    res.json({ 
      success: true, 
      message: 'Avatar uploaded successfully',
      avatar: avatarInfo
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Avatar upload failed', 
      error: error.message 
    });
  }
});

// POST /api/upload/document - Upload document files
router.post('/document', authenticateJWT, upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No document file uploaded' 
      });
    }

    // Check if it's a document file
    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/json'
    ];

    if (!allowedDocTypes.includes(req.file.mimetype)) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Only document files are allowed' 
      });
    }

    const documentInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    };

    res.json({ 
      success: true, 
      message: 'Document uploaded successfully',
      document: documentInfo
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Document upload failed', 
      error: error.message 
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File too large. Maximum size is 10MB.' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false, 
        message: 'Too many files. Maximum is 5 files per request.' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Unexpected file field.' 
      });
    }
  }

  if (error.message) {
    return res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }

  res.status(500).json({ 
    success: false, 
    message: 'Upload failed' 
  });
});

module.exports = router;
