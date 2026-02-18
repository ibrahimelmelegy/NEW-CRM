import express from 'express';
import searchController from './searchController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/search?q=term&entityTypes=lead,deal&page=1&limit=10
router.get('/', authenticateUser, searchController.search);

// POST /api/search/advanced/:entityType
router.post('/advanced/:entityType', authenticateUser, searchController.advancedSearch);

// GET /api/search/fields/:entityType
router.get('/fields/:entityType', authenticateUser, searchController.getSearchableFields);

export default router;
