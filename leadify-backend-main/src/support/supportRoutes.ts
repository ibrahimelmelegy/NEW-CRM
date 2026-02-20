import express from 'express';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import supportController from './supportController';
import { SupportPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// ─── Tickets ──────────────────────────────────────────────────────────────────

router.post(
  '/tickets',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.CREATE_TICKETS]),
  supportController.createTicket
);

router.get(
  '/tickets',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.VIEW_TICKETS]),
  supportController.getTickets
);

router.get(
  '/tickets/:id',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.VIEW_TICKETS]),
  supportController.getTicketById
);

router.patch(
  '/tickets/:id/assign',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.ASSIGN_TICKETS]),
  supportController.assignTicket
);

router.patch(
  '/tickets/:id/resolve',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.RESOLVE_TICKETS]),
  supportController.resolveTicket
);

router.patch(
  '/tickets/:id/close',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.RESOLVE_TICKETS]),
  supportController.closeTicket
);

router.post(
  '/tickets/:id/messages',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.EDIT_TICKETS]),
  supportController.addMessage
);

router.post(
  '/tickets/:id/csat',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.VIEW_TICKETS]),
  supportController.submitCSAT
);

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get(
  '/dashboard',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.VIEW_TICKETS]),
  supportController.getDashboard
);

// ─── Canned Responses ─────────────────────────────────────────────────────────

router.get(
  '/canned-responses',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.VIEW_TICKETS]),
  supportController.getCannedResponses
);

router.post(
  '/canned-responses',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.MANAGE_CANNED_RESPONSES]),
  supportController.createCannedResponse
);

router.put(
  '/canned-responses/:id',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.MANAGE_CANNED_RESPONSES]),
  supportController.updateCannedResponse
);

router.delete(
  '/canned-responses/:id',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.MANAGE_CANNED_RESPONSES]),
  supportController.deleteCannedResponse
);

// ─── Categories ───────────────────────────────────────────────────────────────

router.get(
  '/categories',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.VIEW_TICKETS]),
  supportController.getCategories
);

router.post(
  '/categories',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.EDIT_TICKETS]),
  supportController.createCategory
);

router.put(
  '/categories/:id',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.EDIT_TICKETS]),
  supportController.updateCategory
);

router.delete(
  '/categories/:id',
  authenticateUser,
  HasPermission([SupportPermissionsEnum.EDIT_TICKETS]),
  supportController.deleteCategory
);

export default router;
