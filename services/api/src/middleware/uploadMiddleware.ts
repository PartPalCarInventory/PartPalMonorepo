import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@partpal/shared-types';
import { imageService } from '../services/imageService';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadOptions {
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

export class UploadMiddleware {
  private static readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly DEFAULT_MAX_FILES = 10;
  private static readonly DEFAULT_ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private static readonly DEFAULT_ALLOWED_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
  ];

  static createUploadMiddleware(options: UploadOptions = {}) {
    const {
      maxFileSize = UploadMiddleware.DEFAULT_MAX_FILE_SIZE,
      maxFiles = UploadMiddleware.DEFAULT_MAX_FILES,
      allowedMimeTypes = UploadMiddleware.DEFAULT_ALLOWED_MIME_TYPES,
      allowedExtensions = UploadMiddleware.DEFAULT_ALLOWED_EXTENSIONS,
    } = options;

    const storage = multer.memoryStorage();

    const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      // Check MIME type
      if (!allowedMimeTypes.includes(file.mimetype)) {
        const error = new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
        (error as any).code = 'INVALID_FILE_TYPE';
        return cb(error);
      }

      // Check file extension
      const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        const error = new Error(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`);
        (error as any).code = 'INVALID_FILE_EXTENSION';
        return cb(error);
      }

      cb(null, true);
    };

    const upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: maxFileSize,
        files: maxFiles,
      },
    });

    return upload;
  }

  static handleUploadErrors(error: any, _req: Request, res: Response, next: NextFunction): void {
    if (!error) {
      return next();
    }

    let message = 'File upload failed';
    let statusCode = 400;

    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          message = `File too large. Maximum size is ${UploadMiddleware.DEFAULT_MAX_FILE_SIZE / (1024 * 1024)}MB`;
          break;
        case 'LIMIT_FILE_COUNT':
          message = `Too many files. Maximum is ${UploadMiddleware.DEFAULT_MAX_FILES} files`;
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = 'Unexpected file field';
          break;
        default:
          message = `Upload error: ${error.message}`;
      }
    } else if (error.code === 'INVALID_FILE_TYPE') {
      message = error.message;
    } else if (error.code === 'INVALID_FILE_EXTENSION') {
      message = error.message;
    } else {
      message = error.message || 'Unknown upload error';
      statusCode = 500;
    }

    const response: ApiResponse<null> = {
      success: false,
      error: 'Upload failed',
      message,
    };

    res.status(statusCode).json(response);
  }

  static validateImageDimensions(minWidth?: number, minHeight?: number, maxWidth?: number, maxHeight?: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return next();
        }

        // Dynamic import for sharp
        const sharp = await import('sharp');

        for (const file of files) {
          const metadata = await sharp.default(file.buffer).metadata();
          const { width = 0, height = 0 } = metadata;

          if (minWidth && width < minWidth) {
            throw new Error(`Image width must be at least ${minWidth}px`);
          }
          if (minHeight && height < minHeight) {
            throw new Error(`Image height must be at least ${minHeight}px`);
          }
          if (maxWidth && width > maxWidth) {
            throw new Error(`Image width must not exceed ${maxWidth}px`);
          }
          if (maxHeight && height > maxHeight) {
            throw new Error(`Image height must not exceed ${maxHeight}px`);
          }
        }

        next();
      } catch (error) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Image validation failed',
          message: error instanceof Error ? error.message : 'Invalid image dimensions',
        };
        res.status(400).json(response);
      }
    };
  }

  static async processImages(files: Express.Multer.File[], folder: string) {
    if (!files || files.length === 0) {
      return [];
    }

    try {
      const uploadPromises = files.map(file =>
        imageService.uploadImage(file.buffer, file.originalname, {
          folder,
          transformation: {
            width: 1200,
            height: 1200,
            quality: 'auto',
            format: 'auto',
          },
        })
      );

      const results = await Promise.all(uploadPromises);
      return results.map(result => result.url);
    } catch (error) {
      console.error('Image processing failed:', error);
      throw new Error('Failed to process uploaded images');
    }
  }

  static compressImage(options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return next();
        }

        const sharp = await import('sharp');
        const {
          width = 1200,
          height = 1200,
          quality = 80,
          format = 'jpeg',
        } = options;

        const compressedFiles = await Promise.all(
          files.map(async file => {
            let processor = sharp.default(file.buffer)
              .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true,
              });

            if (format === 'jpeg') {
              processor = processor.jpeg({ quality });
            } else if (format === 'png') {
              processor = processor.png({ quality });
            } else if (format === 'webp') {
              processor = processor.webp({ quality });
            }

            const compressedBuffer = await processor.toBuffer();

            return {
              ...file,
              buffer: compressedBuffer,
              size: compressedBuffer.length,
              originalname: file.originalname.replace(/\.[^/.]+$/, `.${format}`),
              mimetype: `image/${format}`,
            };
          })
        );

        // Replace files in request
        (req as any).files = compressedFiles;
        next();
      } catch (error) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Image compression failed',
          message: error instanceof Error ? error.message : 'Failed to compress images',
        };
        res.status(500).json(response);
      }
    };
  }
}

// Pre-configured middleware for different use cases
export const partImageUpload = UploadMiddleware.createUploadMiddleware({
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
});

export const profileImageUpload = UploadMiddleware.createUploadMiddleware({
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 1,
});

export const documentUpload = UploadMiddleware.createUploadMiddleware({
  maxFileSize: 20 * 1024 * 1024, // 20MB
  maxFiles: 5,
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
});