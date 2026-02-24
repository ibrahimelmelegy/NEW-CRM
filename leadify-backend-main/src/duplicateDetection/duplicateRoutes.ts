import express from 'express';
import duplicateController from './duplicateController';
import { authenticateUser } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: Duplicate Detection
 *   description: Duplicate record detection, merging, and management
 */

const router = express.Router();

/**
 * @swagger
 * /api/duplicates:
 *   get:
 *     summary: List duplicate sets
 *     description: Returns paginated duplicate sets with optional filters
 *     tags: [Duplicate Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type (e.g. lead, contact, company)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DETECTED, CONFIRMED, MERGED, DISMISSED]
 *     responses:
 *       200:
 *         description: Paginated list of duplicate sets
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, duplicateController.getDuplicateSets);

/**
 * @swagger
 * /api/duplicates/check/{entityType}:
 *   post:
 *     summary: Check for duplicates before creating a record
 *     description: Checks whether a record with similar fields already exists
 *     tags: [Duplicate Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity type to check (e.g. lead, contact, company)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Entity-specific fields to check for duplicates (e.g. email, phone, name)
 *     responses:
 *       200:
 *         description: Duplicate check results
 *       500:
 *         description: Server error
 */
router.post('/check/:entityType', authenticateUser, duplicateController.checkForDuplicates);

/**
 * @swagger
 * /api/duplicates/scan/{entityType}:
 *   post:
 *     summary: Trigger batch scan for duplicates
 *     description: Scans all records of the given entity type to find duplicates
 *     tags: [Duplicate Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity type to scan (e.g. lead, contact, company)
 *     responses:
 *       200:
 *         description: Scan results with detected duplicate sets
 *       500:
 *         description: Server error
 */
router.post('/scan/:entityType', authenticateUser, duplicateController.scanForDuplicates);

/**
 * @swagger
 * /api/duplicates/{id}/confirm:
 *   patch:
 *     summary: Confirm a duplicate set
 *     description: Marks a detected duplicate set as confirmed
 *     tags: [Duplicate Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Duplicate set confirmed
 *       404:
 *         description: Duplicate set not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/confirm', authenticateUser, duplicateController.confirmDuplicate);

/**
 * @swagger
 * /api/duplicates/{id}/dismiss:
 *   patch:
 *     summary: Dismiss a duplicate set
 *     description: Marks a duplicate set as dismissed (not actual duplicates)
 *     tags: [Duplicate Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Duplicate set dismissed
 *       404:
 *         description: Duplicate set not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/dismiss', authenticateUser, duplicateController.dismissDuplicate);

/**
 * @swagger
 * /api/duplicates/{id}/merge:
 *   post:
 *     summary: Merge duplicate records
 *     description: Merges duplicate records into the master record
 *     tags: [Duplicate Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - masterRecordId
 *             properties:
 *               masterRecordId:
 *                 type: string
 *                 format: uuid
 *                 description: The record to keep as the master
 *     responses:
 *       200:
 *         description: Records merged successfully
 *       404:
 *         description: Duplicate set not found
 *       500:
 *         description: Server error
 */
router.post('/:id/merge', authenticateUser, duplicateController.mergeRecords);

export default router;
