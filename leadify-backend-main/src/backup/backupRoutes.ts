import express, { Response, NextFunction } from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { wrapResult } from '../utils/response/responseWrapper';
import { AuthenticatedRequest } from '../types';
import { BackupType } from './backupModel';
import {
  createBackup,
  restoreBackup,
  listBackups,
  getBackupById,
  deleteBackup,
  getBackupFilePath,
  getBackupStats,
  cleanupOldBackups,
  scheduleAutoBackup,
  stopAutoBackup,
  isAutoBackupRunning
} from './backupService';

const router = express.Router();

// All routes require authentication + MANAGE_SETTINGS permission (admin only)

/**
 * @swagger
 * /api/backups/stats:
 *   get:
 *     summary: Get backup statistics
 *     tags: [Backup]
 *     responses:
 *       200:
 *         description: Backup statistics
 */
router.get('/stats', authenticateUser, HasPermission(['MANAGE_SETTINGS']), async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getBackupStats();
    const autoBackupActive = isAutoBackupRunning();
    wrapResult(res, { ...stats, autoBackupActive });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/backups:
 *   get:
 *     summary: List all backups with pagination
 *     tags: [Backup]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, failed]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full, incremental, manual]
 *     responses:
 *       200:
 *         description: Paginated list of backups
 */
router.get('/', authenticateUser, HasPermission(['MANAGE_SETTINGS']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    const result = await listBackups(page, limit, status, type);
    wrapResult(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/backups:
 *   post:
 *     summary: Create a new manual backup
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [full, manual]
 *     responses:
 *       201:
 *         description: Backup creation initiated
 */
router.post('/', authenticateUser, HasPermission(['MANAGE_SETTINGS']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const type = (req.body.type as BackupType) || BackupType.MANUAL;
    const userId = req.user?.id ? Number(req.user.id) : undefined;

    const backup = await createBackup(type, userId);
    wrapResult(res, backup, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/backups/cleanup:
 *   post:
 *     summary: Cleanup old backups
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               retentionDays:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       200:
 *         description: Cleanup result
 */
router.post(
  '/cleanup',
  authenticateUser,
  HasPermission(['MANAGE_SETTINGS']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const retentionDays = req.body.retentionDays ? Number(req.body.retentionDays) : 30;
      const result = await cleanupOldBackups(retentionDays);
      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/backups/schedule:
 *   post:
 *     summary: Configure auto-backup schedule
 *     tags: [Backup]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               cronExpression:
 *                 type: string
 *                 default: "0 2 * * *"
 *     responses:
 *       200:
 *         description: Schedule updated
 */
router.post(
  '/schedule',
  authenticateUser,
  HasPermission(['MANAGE_SETTINGS']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { enabled, cronExpression } = req.body;

      if (enabled === false) {
        stopAutoBackup();
        wrapResult(res, { autoBackupActive: false, message: 'Auto-backup disabled' });
      } else {
        const schedule = cronExpression || '0 2 * * *';
        scheduleAutoBackup(schedule);
        wrapResult(res, { autoBackupActive: true, cronExpression: schedule, message: 'Auto-backup enabled' });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/backups/{id}:
 *   get:
 *     summary: Get backup details
 *     tags: [Backup]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Backup details
 */
router.get('/:id', authenticateUser, HasPermission(['MANAGE_SETTINGS']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const backup = await getBackupById(id);
    if (!backup) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }
    wrapResult(res, backup);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/backups/{id}/download:
 *   get:
 *     summary: Download a backup file
 *     tags: [Backup]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Backup file stream
 */
router.get(
  '/:id/download',
  authenticateUser,
  HasPermission(['MANAGE_SETTINGS']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const fileInfo = await getBackupFilePath(id);

      if (!fileInfo) {
        return res.status(404).json({ success: false, message: 'Backup file not found' });
      }

      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fileStream = require('fs').createReadStream(fileInfo.filePath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/backups/{id}/restore:
 *   post:
 *     summary: Restore from a backup
 *     tags: [Backup]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Restore result
 */
router.post(
  '/:id/restore',
  authenticateUser,
  HasPermission(['MANAGE_SETTINGS']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const result = await restoreBackup(id);

      if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
      }

      wrapResult(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/backups/{id}:
 *   delete:
 *     summary: Delete a backup
 *     tags: [Backup]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Backup deleted
 */
router.delete('/:id', authenticateUser, HasPermission(['MANAGE_SETTINGS']), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const result = await deleteBackup(id);

    if (!result.success) {
      return res.status(404).json({ success: false, message: result.message });
    }

    wrapResult(res, result);
  } catch (error) {
    next(error);
  }
});

export default router;
