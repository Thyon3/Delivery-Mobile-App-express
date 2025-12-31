/**
 * Upload Controller
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';
import { getFileURL } from '@/utils/fileUpload';

export class UploadController {
  /**
   * Upload single image
   */
  static uploadImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return ResponseHelper.error(res, 'No file uploaded', 400);
    }

    const fileUrl = getFileURL(req.file.filename);

    return ResponseHelper.success(
      res,
      {
        filename: req.file.filename,
        url: fileUrl,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      'File uploaded successfully'
    );
  });

  /**
   * Upload multiple images
   */
  static uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return ResponseHelper.error(res, 'No files uploaded', 400);
    }

    const files = (req.files as Express.Multer.File[]).map((file) => ({
      filename: file.filename,
      url: getFileURL(file.filename),
      mimetype: file.mimetype,
      size: file.size,
    }));

    return ResponseHelper.success(res, files, 'Files uploaded successfully');
  });
}
