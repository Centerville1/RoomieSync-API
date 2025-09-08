import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    // Configure Cloudinary with environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: Express.Multer.File, 
    folder: string,
    transformation?: any
  ): Promise<string> {
    try {
      // Convert buffer to base64 for Cloudinary upload
      const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      // Upload to Cloudinary with options
      const result = await cloudinary.uploader.upload(base64File, {
        folder: `roomiesync/${folder}`, // Organize images in folders
        resource_type: 'image',
        quality: 'auto', // Automatic quality optimization
        fetch_format: 'auto', // Automatic format optimization (WebP, etc.)
        transformation: transformation || [
          { width: 500, height: 500, crop: 'limit' }, // Max dimensions
          { quality: 'auto' }
        ]
      });

      return result.secure_url;
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      // Log but don't fail - image might already be deleted
      console.warn(`Failed to delete image ${publicId}:`, error.message);
    }
  }

  // Extract public ID from Cloudinary URL for deletion
  extractPublicId(url: string): string {
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    return matches ? matches[1] : '';
  }
}