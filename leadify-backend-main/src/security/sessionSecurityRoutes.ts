import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import sessionSecurityController from './sessionSecurityController';
import { SecurityPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Session Security
 *   description: Session management, login history, IP whitelisting, and security dashboard
 */

// ─── Active Sessions ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/security/session/sessions:
 *   get:
 *     summary: Get active sessions for the current user
 *     tags: [Session Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions with current session flagged
 */
router.get('/sessions', authenticateUser, HasPermission([SecurityPermissionsEnum.VIEW_SESSIONS]), sessionSecurityController.getActiveSessions);

/**
 * @swagger
 * /api/security/session/sessions/{id}:
 *   delete:
 *     summary: Terminate a specific session
 *     tags: [Session Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Session ID to terminate
 *     responses:
 *       200:
 *         description: Session terminated
 *       404:
 *         description: Session not found
 */
router.delete(
  '/sessions/:id',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.MANAGE_SESSIONS]),
  sessionSecurityController.terminateSession
);

/**
 * @swagger
 * /api/security/session/sessions:
 *   delete:
 *     summary: Terminate all sessions except the current one
 *     tags: [Session Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All other sessions terminated (returns count)
 */
router.delete(
  '/sessions',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.MANAGE_SESSIONS]),
  sessionSecurityController.terminateAllSessions
);

// ─── Login History ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/security/session/login-history:
 *   get:
 *     summary: Get login history for the current user
 *     tags: [Session Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by login status (e.g. success, failed)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter up to this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Paginated login history
 */
router.get(
  '/login-history',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.VIEW_LOGIN_HISTORY]),
  sessionSecurityController.getLoginHistory
);

// ─── IP Whitelist ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/security/session/ip-whitelist:
 *   get:
 *     summary: Get IP whitelist entries
 *     tags: [Session Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of whitelisted IP addresses
 */
router.get('/ip-whitelist', authenticateUser, HasPermission([SecurityPermissionsEnum.MANAGE_IP_WHITELIST]), sessionSecurityController.getIPWhitelist);

/**
 * @swagger
 * /api/security/session/ip-whitelist:
 *   post:
 *     summary: Add an IP address to the whitelist
 *     tags: [Session Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ip
 *             properties:
 *               ip:
 *                 type: string
 *                 description: IP address to whitelist
 *               label:
 *                 type: string
 *                 description: Optional label for the IP entry
 *     responses:
 *       201:
 *         description: IP address added to whitelist
 *       400:
 *         description: Invalid IP address
 */
router.post(
  '/ip-whitelist',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.MANAGE_IP_WHITELIST]),
  sessionSecurityController.addIPWhitelist
);

/**
 * @swagger
 * /api/security/session/ip-whitelist/{id}:
 *   delete:
 *     summary: Remove an IP address from the whitelist
 *     tags: [Session Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Whitelist entry ID
 *     responses:
 *       200:
 *         description: IP address removed from whitelist
 *       404:
 *         description: Whitelist entry not found
 */
router.delete(
  '/ip-whitelist/:id',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.MANAGE_IP_WHITELIST]),
  sessionSecurityController.removeIPWhitelist
);

// ─── Security Dashboard ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/security/session/dashboard:
 *   get:
 *     summary: Get security dashboard metrics
 *     tags: [Session Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security dashboard metrics
 */
router.get('/dashboard', authenticateUser, HasPermission([SecurityPermissionsEnum.VIEW_SESSIONS]), sessionSecurityController.getDashboard);

// ─── GDPR Data Export ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/security/session/export-data:
 *   post:
 *     summary: Export user data for GDPR compliance
 *     tags: [Session Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data export
 */
router.post('/export-data', authenticateUser, HasPermission([SecurityPermissionsEnum.EXPORT_DATA]), sessionSecurityController.exportData);

export default router;
