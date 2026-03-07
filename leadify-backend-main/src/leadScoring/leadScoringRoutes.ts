import express from 'express';
import leadScoringController from './leadScoringController';
import { authenticateUser } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: Lead Scoring
 *   description: Lead scoring rules, score calculation, and grade thresholds
 */

const router = express.Router();

/**
 * @swagger
 * /api/lead-scoring/grades:
 *   get:
 *     summary: Get grade thresholds
 *     description: Returns the score thresholds for each grade (A, B, C, D, F)
 *     tags: [Lead Scoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grade threshold configuration
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, leadScoringController.getRules);
router.get('/grades', authenticateUser, leadScoringController.getGradeThresholds);

/**
 * @swagger
 * /api/lead-scoring/rules:
 *   get:
 *     summary: List scoring rules
 *     tags: [Lead Scoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of scoring rules
 *       500:
 *         description: Server error
 */
router.get('/rules', authenticateUser, leadScoringController.getRules);

/**
 * @swagger
 * /api/lead-scoring/rules:
 *   post:
 *     summary: Create a scoring rule
 *     tags: [Lead Scoring]
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
 *               - criteria
 *             properties:
 *               name:
 *                 type: string
 *               entityType:
 *                 type: string
 *                 default: lead
 *               criteria:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     operator:
 *                       type: string
 *                       enum: [equals, not_equals, in, not_in, contains, is_empty, is_not_empty, greater_than, less_than, between]
 *                     value: {}
 *                     points:
 *                       type: number
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Rule created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/rules', authenticateUser, leadScoringController.createRule);

/**
 * @swagger
 * /api/lead-scoring/rules/{id}:
 *   put:
 *     summary: Update a scoring rule
 *     tags: [Lead Scoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               entityType:
 *                 type: string
 *               criteria:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     operator:
 *                       type: string
 *                       enum: [equals, not_equals, in, not_in, contains, is_empty, is_not_empty, greater_than, less_than, between]
 *                     value: {}
 *                     points:
 *                       type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Rule updated
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.put('/rules/:id', authenticateUser, leadScoringController.updateRule);

/**
 * @swagger
 * /api/lead-scoring/rules/{id}:
 *   delete:
 *     summary: Delete a scoring rule
 *     tags: [Lead Scoring]
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
 *         description: Rule deleted
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.delete('/rules/:id', authenticateUser, leadScoringController.deleteRule);

/**
 * @swagger
 * /api/lead-scoring/calculate/{entityType}/{entityId}:
 *   post:
 *     summary: Calculate score for a single entity
 *     tags: [Lead Scoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity type (e.g. lead, contact)
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Calculated score with grade and breakdown
 *       500:
 *         description: Server error
 */
router.post('/calculate/:entityType/:entityId', authenticateUser, leadScoringController.calculateScore);

/**
 * @swagger
 * /api/lead-scoring/calculate/{entityType}:
 *   post:
 *     summary: Bulk calculate scores for all entities of a type
 *     tags: [Lead Scoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity type (e.g. lead, contact)
 *     responses:
 *       200:
 *         description: Bulk calculation results
 *       500:
 *         description: Server error
 */
router.post('/calculate/:entityType', authenticateUser, leadScoringController.bulkCalculateScores);

/**
 * @swagger
 * /api/lead-scoring/scores/{entityType}/{entityId}:
 *   get:
 *     summary: Get score for a specific entity
 *     tags: [Lead Scoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entity score with grade (A/B/C/D/F) and breakdown
 *       500:
 *         description: Server error
 */
router.get('/scores/:entityType/:entityId', authenticateUser, leadScoringController.getScore);

/**
 * @swagger
 * /api/lead-scoring/top/{entityType}:
 *   get:
 *     summary: Get top scored entities
 *     tags: [Lead Scoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Top scored entities sorted by score descending
 *       500:
 *         description: Server error
 */
router.get('/top/:entityType', authenticateUser, leadScoringController.getTopScored);

export default router;
