import express from 'express';
import campaignController from './campaignController';
import { authenticateUser } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: Campaign
 *   description: Email campaign management — create, send, templates, analytics
 */

const router = express.Router();

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: List campaigns
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of campaigns
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, campaignController.getCampaigns);

/**
 * @swagger
 * /api/campaigns/templates:
 *   get:
 *     summary: List email templates
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of email templates
 *       500:
 *         description: Server error
 */
router.get('/templates', authenticateUser, campaignController.getTemplates);

/**
 * @swagger
 * /api/campaigns/templates:
 *   post:
 *     summary: Create email template
 *     tags: [Campaign]
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
 *               - subject
 *               - htmlContent
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               htmlContent:
 *                 type: string
 *                 description: HTML template with {{variable}} placeholders
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Variable names used in template
 *     responses:
 *       201:
 *         description: Template created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/templates', authenticateUser, campaignController.createTemplate);

/**
 * @swagger
 * /api/campaigns/templates/{id}:
 *   delete:
 *     summary: Delete email template
 *     tags: [Campaign]
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
 *         description: Template deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/templates/:id', authenticateUser, campaignController.deleteTemplate);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaign]
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
 *         description: Campaign details with recipients
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateUser, campaignController.getCampaignById);

/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create a campaign
 *     tags: [Campaign]
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
 *               - subject
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               htmlContent:
 *                 type: string
 *                 description: HTML email content
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                     name:
 *                       type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, SENDING, SENT]
 *                 default: DRAFT
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Campaign created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, campaignController.create);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   put:
 *     summary: Update a campaign
 *     tags: [Campaign]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               htmlContent:
 *                 type: string
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, SENDING, SENT]
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Campaign updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateUser, campaignController.update);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   delete:
 *     summary: Delete a campaign
 *     tags: [Campaign]
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
 *         description: Campaign deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateUser, campaignController.delete);

/**
 * @swagger
 * /api/campaigns/{id}/send:
 *   post:
 *     summary: Send a campaign
 *     description: Sends the campaign emails to all recipients
 *     tags: [Campaign]
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
 *         description: Campaign sent
 *       400:
 *         description: Campaign has no recipients or already sent
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post('/:id/send', authenticateUser, campaignController.send);

/**
 * @swagger
 * /api/campaigns/{id}/analytics:
 *   get:
 *     summary: Get campaign analytics
 *     description: Returns delivery stats, open rates, and recipient status breakdown
 *     tags: [Campaign]
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
 *         description: Campaign analytics data
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/:id/analytics', authenticateUser, campaignController.getAnalytics);

export default router;
