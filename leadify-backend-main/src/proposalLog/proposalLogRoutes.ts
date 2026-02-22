import express from 'express';
import proposalLogController from './proposalLogController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { validateQuery } from '../middleware/validation';
import { GetProposalLogsInput } from './inputs/getProposalLogsInput';
import { ProposalPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Proposal Log
 *   description: Proposal activity and change logs
 */

const router = express.Router();

/**
 * @swagger
 * /api/proposal-log:
 *   get:
 *     summary: Get proposal logs
 *     description: Returns paginated activity logs for a specific proposal
 *     tags: [Proposal Log]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: searchKey
 *         schema:
 *           type: string
 *         description: Search key for filtering logs
 *     responses:
 *       200:
 *         description: Paginated list of proposal logs
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateUser,
  HasPermission([ProposalPermissionsEnum.VIEW_OWN_PROPOSALS, ProposalPermissionsEnum.VIEW_GLOBAL_PROPOSALS]),
  validateQuery(GetProposalLogsInput),
  proposalLogController.getProposalLogs
);

export default router;
