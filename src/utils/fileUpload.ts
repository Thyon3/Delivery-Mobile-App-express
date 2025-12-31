/**
 * File Upload Utilities
 */

import fs from 'fs';
import path from 'path';
import { sanitizeFilename } from './validators';

/**
 * Allowed file types for images
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

/**
 * Maximum file size (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Upload directory
 */
export const UPLOAD_DIR = process.env.UPLOAD_PATH || './uploads';

/**
 * Ensure upload directory exists
 */
export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Validate image file
 */
export function isValidImage(mimetype: string, size: number): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimetype) && size <= MAX_FILE_SIZE;
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const extension = path.extname(originalName);
  const basename = path.basename(originalName, extension);
  
  return `${sanitizeFilename(basename)}_${timestamp}_${randomString}${extension}`;
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Delete file
 */
export function deleteFile(filepath: string): void {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

/**
 * Get file URL
 */
export function getFileURL(filename: string): string {
  const baseURL = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseURL}/uploads/${filename}`;
}
