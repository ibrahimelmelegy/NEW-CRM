import express from 'express';
import savedViewController from './savedViewController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Static and specific routes MUST come before parameterized routes

// GET /api/saved-views/view/:id - single view by id
router.get('/view/:id', authenticateUser, savedViewController.getViewById);

// POST /api/saved-views - create a new view
router.post('/', authenticateUser, savedViewController.createView);

// PUT /api/saved-views/:id - update an existing view
router.put('/:id', authenticateUser, savedViewController.updateView);

// DELETE /api/saved-views/:id - delete a view
router.delete('/:id', authenticateUser, savedViewController.deleteView);

// PATCH /api/saved-views/:id/default - set a view as default
router.patch('/:id/default', authenticateUser, savedViewController.setDefault);

// GET /api/saved-views/:entityType - list views for entity type (must be last GET with single param)
router.get('/:entityType', authenticateUser, savedViewController.getViews);

export default router;
