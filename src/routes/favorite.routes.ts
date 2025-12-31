/**
 * Favorite Routes
 */

import { Router } from 'express';
import { FavoriteController } from '@/controllers/favorite.controller';
import { authenticate } from '@/middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', FavoriteController.getFavorites);
router.post('/', FavoriteController.addFavorite);
router.delete('/:restaurantId', FavoriteController.removeFavorite);
router.get('/check/:restaurantId', FavoriteController.checkFavorite);

export default router;
