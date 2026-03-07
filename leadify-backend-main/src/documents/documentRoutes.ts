import express from 'express';
import documentController from './documentController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Document
 *   description: Document folders and file management
 */

// All routes require authentication
router.use(authenticateUser);

router.get('/', documentController.getFiles);

// Folder routes

/**
 * @swagger
 * /api/documents/folders:
 *   get:
 *     summary: Get folders by parent ID
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: integer
 *         description: Parent folder ID (omit for root folders)
 *     responses:
 *       200:
 *         description: List of folders
 */
router.get('/folders', documentController.getFolders);

/**
 * @swagger
 * /api/documents/folders/tree:
 *   get:
 *     summary: Get the complete folder tree
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hierarchical folder tree
 */
router.get('/folders/tree', documentController.getFolderTree);

/**
 * @swagger
 * /api/documents/folders:
 *   post:
 *     summary: Create a new folder
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               parentId:
 *                 type: integer
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Folder created
 */
router.post('/folders', documentController.createFolder);

/**
 * @swagger
 * /api/documents/folders/{id}:
 *   put:
 *     summary: Update a folder
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parentId:
 *                 type: integer
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Folder updated
 */
router.put('/folders/:id', documentController.updateFolder);

/**
 * @swagger
 * /api/documents/folders/{id}:
 *   delete:
 *     summary: Delete a folder
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Folder deleted
 */
router.delete('/folders/:id', documentController.deleteFolder);

// File routes

/**
 * @swagger
 * /api/documents/files:
 *   get:
 *     summary: Get files with filtering and pagination
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: integer
 *         description: Filter by folder ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by file name
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags to filter by
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated file list
 */
router.get('/files', documentController.getFiles);

/**
 * @swagger
 * /api/documents/files/recent:
 *   get:
 *     summary: Get recently uploaded files
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of recent files
 */
router.get('/files/recent', documentController.getRecentFiles);

/**
 * @swagger
 * /api/documents/files/{id}:
 *   get:
 *     summary: Get a file by ID
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: File details
 */
router.get('/files/:id', documentController.getFileById);

/**
 * @swagger
 * /api/documents/files:
 *   post:
 *     summary: Create a new file record
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - originalName
 *               - path
 *             properties:
 *               name:
 *                 type: string
 *               originalName:
 *                 type: string
 *               path:
 *                 type: string
 *               mimeType:
 *                 type: string
 *               size:
 *                 type: number
 *               folderId:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: File record created
 */
router.post('/files', documentController.createFile);

/**
 * @swagger
 * /api/documents/files/{id}:
 *   put:
 *     summary: Update a file record
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               folderId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: File updated
 */
router.put('/files/:id', documentController.updateFile);

/**
 * @swagger
 * /api/documents/files/{id}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: File deleted
 */
router.delete('/files/:id', documentController.deleteFile);

export default router;
