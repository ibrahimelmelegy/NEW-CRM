import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import communicationController from './communicationController';
import { CommunicationPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// ─── Activities ──────────────────────────────────────────────────────────────

router.post(
  '/activities',
  authenticateUser,
  HasPermission([CommunicationPermissionsEnum.LOG_ACTIVITIES]),
  communicationController.logActivity
);

router.get(
  '/timeline/:contactType/:contactId',
  authenticateUser,
  HasPermission([CommunicationPermissionsEnum.VIEW_ACTIVITIES]),
  communicationController.getTimeline
);

router.put(
  '/activities/:id',
  authenticateUser,
  HasPermission([CommunicationPermissionsEnum.LOG_ACTIVITIES]),
  communicationController.updateActivity
);

router.delete(
  '/activities/:id',
  authenticateUser,
  HasPermission([CommunicationPermissionsEnum.LOG_ACTIVITIES]),
  communicationController.deleteActivity
);

// ─── Calls ───────────────────────────────────────────────────────────────────

router.post(
  '/calls',
  authenticateUser,
  HasPermission([CommunicationPermissionsEnum.LOG_CALLS]),
  communicationController.logCall
);

// ─── Stats & Recent ──────────────────────────────────────────────────────────

router.get(
  '/stats',
  authenticateUser,
  HasPermission([CommunicationPermissionsEnum.VIEW_STATS]),
  communicationController.getStats
);

router.get(
  '/recent',
  authenticateUser,
  HasPermission([CommunicationPermissionsEnum.VIEW_ACTIVITIES]),
  communicationController.getRecent
);

export default router;
