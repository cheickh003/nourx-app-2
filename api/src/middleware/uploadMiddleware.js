import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { AppError } from './errorHandler.js';
import { logSecurityEvent } from './logger.js';

// Allowed file types
const ALLOWED_FILE_TYPES = {
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  archives: ['.zip', '.rar', '.7z'],
  all: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.zip', '.rar', '.7z']
};

// MIME type mapping
const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed'
};

// Ensure upload directory exists
const ensureUploadDir = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Custom storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      const subDir = req.body.type || 'temp';
      const fullPath = path.join(uploadPath, subDir);
      
      await ensureUploadDir(fullPath);
      cb(null, fullPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileName = `${uuidv4()}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter function
const fileFilter = (allowedTypes = 'all') => {
  return (req, file, cb) => {
    try {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = ALLOWED_FILE_TYPES[allowedTypes] || ALLOWED_FILE_TYPES.all;
      
      // Check file extension
      if (!allowedExtensions.includes(fileExtension)) {
        logSecurityEvent('INVALID_FILE_TYPE_UPLOAD', {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          userId: req.user?.id,
          fileName: file.originalname,
          fileExtension,
          allowedTypes
        });
        
        return cb(new AppError(
          `File type ${fileExtension} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
          400
        ));
      }
      
      // Check MIME type consistency
      const expectedMimeType = MIME_TYPES[fileExtension];
      if (expectedMimeType && file.mimetype !== expectedMimeType) {
        logSecurityEvent('MIME_TYPE_MISMATCH', {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          userId: req.user?.id,
          fileName: file.originalname,
          providedMimeType: file.mimetype,
          expectedMimeType
        });
        
        return cb(new AppError('File content does not match file extension', 400));
      }
      
      cb(null, true);
    } catch (error) {
      cb(error);
    }
  };
};

// Create multer instance with configurations
const createUploader = (options = {}) => {
  const {
    allowedTypes = 'all',
    maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    maxFiles = 5
  } = options;
  
  return multer({
    storage,
    fileFilter: fileFilter(allowedTypes),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    onError: (err, next) => {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new AppError(`File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`, 400));
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        next(new AppError(`Too many files. Maximum is ${maxFiles} files`, 400));
      } else {
        next(new AppError('File upload error: ' + err.message, 400));
      }
    }
  });
};

// Default upload middleware
export const uploadMiddleware = createUploader();

// Document upload middleware (strict file types)
export const documentUpload = createUploader({
  allowedTypes: 'documents',
  maxFileSize: 50 * 1024 * 1024, // 50MB for documents
  maxFiles: 1
});

// Image upload middleware
export const imageUpload = createUploader({
  allowedTypes: 'images',
  maxFileSize: 5 * 1024 * 1024, // 5MB for images
  maxFiles: 1
});

// Multiple file upload middleware
export const multipleFileUpload = createUploader({
  allowedTypes: 'all',
  maxFileSize: 10 * 1024 * 1024, // 10MB per file
  maxFiles: 10
});

// Helper function to clean up uploaded files
export const cleanupUploadedFiles = async (files) => {
  if (!files) return;
  
  const filesToDelete = Array.isArray(files) ? files : [files];
  
  for (const file of filesToDelete) {
    try {
      if (file.path) {
        await fs.unlink(file.path);
      }
    } catch (error) {
      console.error('Failed to cleanup uploaded file:', file.path, error);
    }
  }
};

// Middleware to handle upload errors and cleanup
export const handleUploadError = (err, req, res, next) => {
  // Clean up any uploaded files on error
  if (req.file) {
    cleanupUploadedFiles(req.file);
  }
  if (req.files) {
    cleanupUploadedFiles(req.files);
  }
  
  next(err);
};