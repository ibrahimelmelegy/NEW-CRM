import express from 'express';
import documentController from './documentController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Folder routes
router.get('/folders', documentController.getFolders);
router.get('/folders/tree', documentController.getFolderTree);
router.post('/folders', documentController.createFolder);
router.put('/folders/:id', documentController.updateFolder);
router.delete('/folders/:id', documentController.deleteFolder);

// File routes
router.get('/files', documentController.getFiles);
router.get('/files/recent', documentController.getRecentFiles);
router.get('/files/:id', documentController.getFileById);
router.post('/files', documentController.createFile);
router.put('/files/:id', documentController.updateFile);
router.delete('/files/:id', documentController.deleteFile);

export default router;
