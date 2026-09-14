import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from './ApiError.js';

export function assertStorageEnabled() {
  if (!env.cloudinaryEnabled) {
    throw ApiError.unavailable('File storage is not configured. Add Cloudinary credentials to the server environment.');
  }
}

export async function uploadImage(buffer, options) {
  try {
    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', overwrite: false, ...options },
        (err, result) => (err ? reject(err) : resolve(result)),
      );
      stream.end(buffer);
    });
  } catch (err) {
    logger.error('Cloudinary upload failed', { error: err.message });
    throw new ApiError(502, 'Image upload failed. Please try again.');
  }
}

export async function destroyImage(publicId) {
  if (!publicId || !env.cloudinaryEnabled) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    // Orphaned remote files are not fatal for the user flow.
    logger.warn('Failed to remove Cloudinary asset', { publicId, error: err.message });
  }
}
