import express from 'express';
import duplicateController from './duplicateController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// List duplicate sets with filters
router.get('/', authenticateUser, duplicateController.getDuplicateSets);

// Check for duplicates before creating a record
router.post('/check/:entityType', authenticateUser, duplicateController.checkForDuplicates);

// Trigger batch scan for duplicates
router.post('/scan/:entityType', authenticateUser, duplicateController.scanForDuplicates);

// Confirm a duplicate set
router.patch('/:id/confirm', authenticateUser, duplicateController.confirmDuplicate);

// Dismiss a duplicate set
router.patch('/:id/dismiss', authenticateUser, duplicateController.dismissDuplicate);

// Merge duplicate records
router.post('/:id/merge', authenticateUser, duplicateController.mergeRecords);

export default router;
