import express from 'express';
import { ApiResponse } from '@partpal/shared-types';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  UploadMiddleware,
  partImageUpload,
  profileImageUpload,
  documentUpload,
} from '../middleware/uploadMiddleware';
import { imageService } from '../services/imageService';

const router: express.Router = express.Router();

// Part images upload
router.post('/parts/images',
  authenticateToken,
  requireRole(['SELLER', 'ADMIN']),
  partImageUpload.array('images', 10),
  UploadMiddleware.compressImage({
    width: 1200,
    height: 1200,
    quality: 85,
    format: 'webp',
  }),
  UploadMiddleware.handleUploadErrors,
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No files uploaded',
          message: 'Please select at least one image to upload',
        };
        return res.status(400).json(response);
      }

      const imageUrls = await UploadMiddleware.processImages(files, 'parts');

      const response: ApiResponse<{ images: string[] }> = {
        success: true,
        data: { images: imageUrls },
        message: `Successfully uploaded ${imageUrls.length} image(s)`,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Profile image upload
router.post('/profile/image',
  authenticateToken,
  profileImageUpload.single('image'),
  UploadMiddleware.compressImage({
    width: 400,
    height: 400,
    quality: 90,
    format: 'webp',
  }),
  UploadMiddleware.validateImageDimensions(100, 100, 2000, 2000),
  UploadMiddleware.handleUploadErrors,
  async (req, res, next) => {
    try {
      const file = req.file;

      if (!file) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No file uploaded',
          message: 'Please select an image to upload',
        };
        return res.status(400).json(response);
      }

      const result = await imageService.uploadImage(file.buffer, file.originalname, {
        folder: 'profiles',
        transformation: {
          width: 400,
          height: 400,
          quality: 'auto',
          format: 'auto',
        },
      });

      const response: ApiResponse<{ imageUrl: string; publicId: string }> = {
        success: true,
        data: {
          imageUrl: result.url,
          publicId: result.publicId,
        },
        message: 'Profile image uploaded successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Business documents upload
router.post('/business/documents',
  authenticateToken,
  requireRole(['SELLER', 'ADMIN']),
  documentUpload.array('documents', 5),
  UploadMiddleware.handleUploadErrors,
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No files uploaded',
          message: 'Please select at least one document to upload',
        };
        return res.status(400).json(response);
      }

      // Process only image files through image service
      const imageFiles = files.filter(file => file.mimetype.startsWith('image/'));
      const documentFiles = files.filter(file => !file.mimetype.startsWith('image/'));

      const results: Array<{ filename: string; url: string; type: string }> = [];

      // Process images
      if (imageFiles.length > 0) {
        const imageUrls = await UploadMiddleware.processImages(imageFiles, 'documents');
        imageFiles.forEach((file, index) => {
          results.push({
            filename: file.originalname,
            url: imageUrls[index],
            type: 'image',
          });
        });
      }

      // For non-image documents, you would typically upload to a file storage service
      // For now, we'll simulate this
      documentFiles.forEach(file => {
        results.push({
          filename: file.originalname,
          url: `${process.env.API_BASE_URL || 'http://localhost:3333'}/uploads/documents/${file.filename}`,
          type: 'document',
        });
      });

      const response: ApiResponse<{ documents: typeof results }> = {
        success: true,
        data: { documents: results },
        message: `Successfully uploaded ${results.length} document(s)`,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Vehicle images upload
router.post('/vehicles/images',
  authenticateToken,
  requireRole(['SELLER', 'ADMIN']),
  partImageUpload.array('images', 20),
  UploadMiddleware.compressImage({
    width: 1600,
    height: 1200,
    quality: 85,
    format: 'webp',
  }),
  UploadMiddleware.handleUploadErrors,
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No files uploaded',
          message: 'Please select at least one image to upload',
        };
        return res.status(400).json(response);
      }

      const imageUrls = await UploadMiddleware.processImages(files, 'vehicles');

      const response: ApiResponse<{ images: string[] }> = {
        success: true,
        data: { images: imageUrls },
        message: `Successfully uploaded ${imageUrls.length} vehicle image(s)`,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Delete uploaded image
router.delete('/images/:publicId',
  authenticateToken,
  requireRole(['SELLER', 'ADMIN']),
  async (req, res, next) => {
    try {
      const { publicId } = req.params;

      // Decode the public ID (it might be URL encoded)
      const decodedPublicId = decodeURIComponent(publicId);

      const success = await imageService.deleteImage(decodedPublicId);

      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Delete failed',
          message: 'Failed to delete image or image not found',
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Image deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Get optimized image URL
router.get('/images/optimize/:publicId',
  async (req, res, next) => {
    try {
      const { publicId } = req.params;
      const { width, height, quality, format, crop } = req.query;

      const decodedPublicId = decodeURIComponent(publicId);

      const optimizedUrl = imageService.generateOptimizedUrl(decodedPublicId, {
        width: width ? parseInt(width as string) : undefined,
        height: height ? parseInt(height as string) : undefined,
        quality: quality as string,
        format: format as string,
        crop: crop as string,
      });

      const response: ApiResponse<{ url: string }> = {
        success: true,
        data: { url: optimizedUrl },
        message: 'Optimized image URL generated',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Generate thumbnail
router.get('/images/thumbnail/:publicId',
  async (req, res, next) => {
    try {
      const { publicId } = req.params;
      const { size } = req.query;

      const decodedPublicId = decodeURIComponent(publicId);
      const thumbnailSize = (size as 'small' | 'medium' | 'large') || 'medium';

      const thumbnailUrl = imageService.generateThumbnailUrl(decodedPublicId, thumbnailSize);

      const response: ApiResponse<{ url: string }> = {
        success: true,
        data: { url: thumbnailUrl },
        message: 'Thumbnail URL generated',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Bulk delete images
router.delete('/images/bulk',
  authenticateToken,
  requireRole(['SELLER', 'ADMIN']),
  async (req, res, next) => {
    try {
      const { publicIds } = req.body;

      if (!Array.isArray(publicIds) || publicIds.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid input',
          message: 'Please provide an array of public IDs to delete',
        };
        return res.status(400).json(response);
      }

      const result = await imageService.deleteMultipleImages(publicIds);

      const response: ApiResponse<{
        deleted: string[];
        failed: string[];
        summary: string;
      }> = {
        success: true,
        data: {
          ...result,
          summary: `Deleted ${result.deleted.length} images, ${result.failed.length} failed`,
        },
        message: 'Bulk delete operation completed',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;