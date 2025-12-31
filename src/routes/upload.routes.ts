/**
 * Upload Routes
 */

import { Router } from 'express';
import { UploadController } from '@/controllers/upload.controller';
import { authenticate } from '@/middlewares/auth';
import { upload } from '@/config/multer';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/image', upload.single('image'), UploadController.uploadImage);
router.post('/images', upload.array('images', 5), UploadController.uploadMultipleImages);

export default router;
