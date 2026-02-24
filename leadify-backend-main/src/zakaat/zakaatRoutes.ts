import express from 'express';
import zakaatController from './zakaatController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Zakaat
 *   description: Zakaat assessment and calculation (Saudi religious tax)
 */

/**
 * @swagger
 * /api/zakaat/assessments:
 *   get:
 *     summary: List Zakaat assessments
 *     tags: [Zakaat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CALCULATED, PAID]
 *         description: Filter by assessment status
 *       - in: query
 *         name: fiscalYear
 *         schema:
 *           type: string
 *         description: Filter by fiscal year
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by fiscal year or company ID
 *     responses:
 *       200:
 *         description: Paginated list of Zakaat assessments
 */
router.get('/assessments', authenticateUser, zakaatController.getAssessments);

/**
 * @swagger
 * /api/zakaat/assessments/{id}:
 *   get:
 *     summary: Get a single Zakaat assessment
 *     tags: [Zakaat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Zakaat assessment details
 *       404:
 *         description: Assessment not found
 */
router.get('/assessments/:id', authenticateUser, zakaatController.getAssessment);

/**
 * @swagger
 * /api/zakaat/assessments:
 *   post:
 *     summary: Create a new Zakaat assessment
 *     tags: [Zakaat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fiscalYear
 *               - assessmentDate
 *               - breakdown
 *             properties:
 *               fiscalYear:
 *                 type: string
 *                 description: Fiscal year (e.g. "2025")
 *               companyId:
 *                 type: string
 *                 description: Optional company ID
 *               assessmentDate:
 *                 type: string
 *                 format: date
 *                 description: Assessment date (YYYY-MM-DD)
 *               breakdown:
 *                 type: object
 *                 description: Asset breakdown for Zakaat calculation
 *                 properties:
 *                   cashAndBank:
 *                     type: number
 *                     description: Cash and bank balances
 *                   receivables:
 *                     type: number
 *                     description: Accounts receivable
 *                   inventory:
 *                     type: number
 *                     description: Inventory value
 *                   investments:
 *                     type: number
 *                     description: Investment holdings
 *                   prepaidExpenses:
 *                     type: number
 *                     description: Prepaid expenses
 *                   fixedAssets:
 *                     type: number
 *                     description: Fixed assets (exempt from Zakaat)
 *                   liabilities:
 *                     type: number
 *                     description: Total liabilities
 *               zakaatRate:
 *                 type: number
 *                 default: 0.025
 *                 description: Zakaat rate (default 2.5%)
 *               notes:
 *                 type: string
 *                 description: Optional notes
 *     responses:
 *       201:
 *         description: Assessment created with calculated Zakaat
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/assessments', authenticateUser, zakaatController.createAssessment);

/**
 * @swagger
 * /api/zakaat/assessments/{id}:
 *   put:
 *     summary: Update a Zakaat assessment
 *     tags: [Zakaat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assessment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fiscalYear:
 *                 type: string
 *                 description: Fiscal year
 *               companyId:
 *                 type: string
 *                 description: Company ID
 *               assessmentDate:
 *                 type: string
 *                 format: date
 *                 description: Assessment date (YYYY-MM-DD)
 *               breakdown:
 *                 type: object
 *                 description: Asset breakdown (triggers recalculation)
 *                 properties:
 *                   cashAndBank:
 *                     type: number
 *                   receivables:
 *                     type: number
 *                   inventory:
 *                     type: number
 *                   investments:
 *                     type: number
 *                   prepaidExpenses:
 *                     type: number
 *                   fixedAssets:
 *                     type: number
 *                   liabilities:
 *                     type: number
 *               zakaatRate:
 *                 type: number
 *                 description: Zakaat rate (triggers recalculation)
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [CALCULATED, PAID]
 *     responses:
 *       200:
 *         description: Assessment updated (recalculated if breakdown or rate changed)
 *       400:
 *         description: Cannot update a paid assessment
 *       404:
 *         description: Assessment not found
 */
router.put('/assessments/:id', authenticateUser, zakaatController.updateAssessment);

/**
 * @swagger
 * /api/zakaat/assessments/{id}/calculate:
 *   post:
 *     summary: Recalculate Zakaat for an existing assessment
 *     tags: [Zakaat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Assessment recalculated using current breakdown
 *       400:
 *         description: Assessment has no breakdown data
 *       404:
 *         description: Assessment not found
 */
router.post('/assessments/:id/calculate', authenticateUser, zakaatController.recalculate);

/**
 * @swagger
 * /api/zakaat/assessments/{id}/report:
 *   get:
 *     summary: Generate Zakaat report data for an assessment
 *     tags: [Zakaat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Zakaat report data for PDF/export
 *       404:
 *         description: Assessment not found
 */
router.get('/assessments/:id/report', authenticateUser, zakaatController.getReport);

export default router;
