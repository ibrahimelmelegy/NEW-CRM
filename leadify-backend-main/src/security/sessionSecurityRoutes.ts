import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import sessionSecurityController from './sessionSecurityController';
import { SecurityPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// ─── Active Sessions ─────────────────────────────────────────────────────────

router.get(
  '/sessions',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.VIEW_SESSIONS]),
  sessionSecurityController.getActiveSessions
);

router.delete(
  '/sessions/:id',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.MANAGE_SESSIONS]),
  sessionSecurityController.terminateSession
);

router.delete(
  '/sessions',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.MANAGE_SESSIONS]),
  sessionSecurityController.terminateAllSessions
);

// ─── Login History ───────────────────────────────────────────────────────────

router.get(
  '/login-history',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.VIEW_LOGIN_HISTORY]),
  sessionSecurityController.getLoginHistory
);

// ─── IP Whitelist ────────────────────────────────────────────────────────────

router.get(
  '/ip-whitelist',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.MANAGE_IP_WHITELIST]),
  sessionSecurityController.getIPWhitelist
);

router.post(
  '/ip-whitelist',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.MANAGE_IP_WHITELIST]),
  sessionSecurityController.addIPWhitelist
);

router.delete(
  '/ip-whitelist/:id',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.MANAGE_IP_WHITELIST]),
  sessionSecurityController.removeIPWhitelist
);

// ─── Security Dashboard ──────────────────────────────────────────────────────

router.get(
  '/dashboard',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.VIEW_SESSIONS]),
  sessionSecurityController.getDashboard
);

// ─── GDPR Data Export ────────────────────────────────────────────────────────

router.post(
  '/export-data',
  authenticateUser,
  HasPermission([SecurityPermissionsEnum.EXPORT_DATA]),
  sessionSecurityController.exportData
);

export default router;
