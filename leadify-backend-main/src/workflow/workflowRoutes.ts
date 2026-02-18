import express from 'express';
import workflowController from './workflowController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { SettingsPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// ── Rules CRUD ──
// Support both /api/workflows and /api/workflows/rules
router.get(
  '/',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]),
  workflowController.getRules
);

router.get(
  '/rules',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]),
  workflowController.getRules
);

router.get(
  '/rules/:id',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]),
  workflowController.getRuleById
);

router.post(
  '/rules',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]),
  workflowController.createRule
);

router.put(
  '/rules/:id',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]),
  workflowController.updateRule
);

router.delete(
  '/rules/:id',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]),
  workflowController.deleteRule
);

// ── Toggle active/inactive ──
router.patch(
  '/rules/:id/toggle',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]),
  workflowController.toggleRule
);

// ── Test rule with sample data ──
router.post(
  '/rules/:id/test',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.EDIT_SETTINGS]),
  workflowController.testRule
);

// ── Execution logs ──
router.get(
  '/executions',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]),
  workflowController.getExecutions
);

router.get(
  '/rules/:id/executions',
  authenticateUser,
  HasPermission([SettingsPermissionsEnum.VIEW_SETTINGS]),
  workflowController.getExecutionsForRule
);

export default router;
