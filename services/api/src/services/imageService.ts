import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export interface ImageUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface ImageUploadOptions {
  folder?: string;
  transformation?: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  };
  allowedFormats?: string[];
}

export class ImageService {
  private static instance: ImageService;
  private isConfigured = false;

  constructor() {
    this.configure();
  }

  static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  private configure(): void {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('Cloudinary configuration missing. Image uploads will be disabled.');
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.isConfigured = true;
    console.log('Cloudinary configured successfully');
  }

  async uploadImage(
    imageBuffer: Buffer,
    filename: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    if (!this.isConfigured) {
      throw new Error('Image service not configured. Please check Cloudinary environment variables.');
    }

    const {
      folder = 'partpal',
      transformation = {},
      allowedFormats = ['jpg', 'jpeg', 'png', 'webp'],
    } = options;

    // Validate file format
    const fileExtension = filename.toLowerCase().split('.').pop();
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      throw new Error(`Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`);
    }

    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            format: transformation.format || 'auto',
            quality: transformation.quality || 'auto',
            transformation: [
              {
                width: transformation.width,
                height: transformation.height,
                crop: 'limit',
                fetch_format: 'auto',
                quality: 'auto',
              },
            ],
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        const bufferStream = new Readable();
        bufferStream.push(imageBuffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Failed to upload image to cloud storage');
    }
  }

  async uploadMultipleImages(
    images: Array<{ buffer: Buffer; filename: string }>,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult[]> {
    const uploadPromises = images.map(({ buffer, filename }) =>
      this.uploadImage(buffer, filename, options)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple image upload failed:', error);
      throw new Error('Failed to upload one or more images');
    }
  }

  async deleteImage(publicId: string): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('Image service not configured');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Image deletion failed:', error);
      return false;
    }
  }

  async deleteMultipleImages(publicIds: string[]): Promise<{ deleted: string[]; failed: string[] }> {
    if (!this.isConfigured) {
      throw new Error('Image service not configured');
    }

    const results = await Promise.allSettled(
      publicIds.map(publicId => this.deleteImage(publicId))
    );

    const deleted: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        deleted.push(publicIds[index]);
      } else {
        failed.push(publicIds[index]);
      }
    });

    return { deleted, failed };
  }

  generateOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
      crop?: string;
    } = {}
  ): string {
    if (!this.isConfigured) {
      return publicId; // Return original if not configured
    }

    const {
      width,
      height,
      quality = 'auto',
      format = 'auto',
      crop = 'limit',
    } = options;

    return cloudinary.url(publicId, {
      transformation: [
        {
          width,
          height,
          crop,
          quality,
          fetch_format: format,
        },
      ],
    });
  }

  generateThumbnailUrl(publicId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const sizeMap = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 },
    };

    return this.generateOptimizedUrl(publicId, {
      ...sizeMap[size],
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
    });
  }

  getConfigurationStatus(): boolean {
    return this.isConfigured;
  }
}

export const imageService = ImageService.getInstance();