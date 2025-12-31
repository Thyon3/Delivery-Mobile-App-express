/**
 * Search Routes
 */

import { Router } from 'express';
import { SearchController } from '@/controllers/search.controller';
import { optionalAuth } from '@/middlewares/auth';

const router = Router();

// Public routes with optional authentication
router.get('/restaurants', optionalAuth, SearchController.searchRestaurants);
router.get('/menu-items', optionalAuth, SearchController.searchMenuItems);
router.get('/popular', SearchController.getPopularSearches);

export default router;
