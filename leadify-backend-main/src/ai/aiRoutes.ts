import express from 'express';
import { generateEmail, summarizeMeeting, getChurnDashboard } from './aiController';
import salesCoachController from './salesCoachController';
import { aiChatController, aiDealController, aiEmailController, aiInsightsController } from './aiEnhancedController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { LeadAndSalesWidgetsPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered features — email generation, deal scoring, sales coaching, CRM chat, insights
 */

const router = express.Router();

// ─── Core AI ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/generate-email:
 *   post:
 *     summary: Generate email (basic)
 *     description: Generate an email from a prompt using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               context:
 *                 type: object
 *     responses:
 *       200:
 *         description: Generated email content
 *       400:
 *         description: Prompt is required
 *       500:
 *         description: Server error
 */
router.post('/generate-email', authenticateUser, generateEmail);

/**
 * @swagger
 * /api/ai/summarize-meeting:
 *   post:
 *     summary: Summarize meeting
 *     description: Generate a structured summary from meeting transcript text
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Meeting transcript or notes
 *     responses:
 *       200:
 *         description: Meeting summary with key points and action items
 *       400:
 *         description: Text is required
 *       500:
 *         description: Server error
 */
router.post('/summarize-meeting', authenticateUser, summarizeMeeting);

/**
 * @swagger
 * /api/ai/churn-dashboard:
 *   get:
 *     summary: Get churn prediction dashboard
 *     description: Returns AI-powered churn risk analysis and predictions
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Churn risk data and predictions
 *       500:
 *         description: Server error
 */
router.get(
  '/churn-dashboard',
  authenticateUser,
  HasPermission([LeadAndSalesWidgetsPermissionsEnum.VIEW_GLOBAL_LEAD_SALES_WIDGETS, LeadAndSalesWidgetsPermissionsEnum.VIEW_OWN_LEAD_SALES_WIDGETS]),
  getChurnDashboard
);

// ─── Sales Coach ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/sales-coach/deal/{id}:
 *   get:
 *     summary: Analyze deal (Sales Coach)
 *     description: Get AI-powered analysis and recommendations for a specific deal
 *     tags: [AI]
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
 *         description: Deal analysis with recommendations
 *       404:
 *         description: Deal not found
 *       500:
 *         description: Server error
 */
router.get('/sales-coach/deal/:id', authenticateUser, salesCoachController.analyzeDeal);

/**
 * @swagger
 * /api/ai/sales-coach/pipeline:
 *   get:
 *     summary: Get pipeline health (Sales Coach)
 *     description: AI analysis of overall pipeline health, bottlenecks, and opportunities
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pipeline health analysis
 *       500:
 *         description: Server error
 */
router.get('/sales-coach/pipeline', authenticateUser, salesCoachController.getPipelineHealth);

/**
 * @swagger
 * /api/ai/sales-coach/weekly-summary:
 *   get:
 *     summary: Get weekly sales summary (Sales Coach)
 *     description: AI-generated weekly summary of sales activities and performance
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly sales summary
 *       500:
 *         description: Server error
 */
router.get('/sales-coach/weekly-summary', authenticateUser, salesCoachController.getWeeklySummary);

// ─── AI Chat ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Ask CRM AI
 *     description: Ask questions about your CRM data using natural language
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: Natural language question about CRM data
 *     responses:
 *       200:
 *         description: AI response about CRM data
 *       400:
 *         description: Question is required
 *       500:
 *         description: Server error
 */
router.post('/chat', authenticateUser, aiChatController.askCRM);

/**
 * @swagger
 * /api/ai/chat/clear:
 *   post:
 *     summary: Clear AI chat history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat history cleared
 *       500:
 *         description: Server error
 */
router.post('/chat/clear', authenticateUser, aiChatController.clearChat);

// ─── Deal Scoring ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/score-deal/{dealId}:
 *   post:
 *     summary: Score a deal
 *     description: Get AI-powered win probability score and factors for a deal
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deal score with contributing factors
 *       404:
 *         description: Deal not found
 *       500:
 *         description: Server error
 */
router.post('/score-deal/:dealId', authenticateUser, aiDealController.scoreDeal);

// ─── Email AI ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/email/generate:
 *   post:
 *     summary: Generate email (enhanced)
 *     description: Generate a professional email with purpose, tone, and context
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               purpose:
 *                 type: string
 *                 enum: [follow-up, introduction, proposal, thank-you, meeting-request, custom]
 *               tone:
 *                 type: string
 *                 enum: [professional, friendly, formal, casual]
 *                 default: professional
 *               customInstructions:
 *                 type: string
 *               to:
 *                 type: string
 *               toCompany:
 *                 type: string
 *               dealInfo:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   stage:
 *                     type: string
 *               clientInfo:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   company:
 *                     type: string
 *                   industry:
 *                     type: string
 *               senderName:
 *                 type: string
 *               senderCompany:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated email with subject and body
 *       500:
 *         description: Server error
 */
router.post('/email/generate', authenticateUser, aiEmailController.generateEmail);

/**
 * @swagger
 * /api/ai/email/suggest-reply:
 *   post:
 *     summary: Suggest email reply
 *     description: Generate a suggested reply based on an email thread
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - thread
 *             properties:
 *               thread:
 *                 type: string
 *                 description: Email thread/conversation to reply to
 *               context:
 *                 type: object
 *                 properties:
 *                   purpose:
 *                     type: string
 *                   tone:
 *                     type: string
 *                   senderName:
 *                     type: string
 *     responses:
 *       200:
 *         description: Suggested reply
 *       400:
 *         description: Thread is required
 *       500:
 *         description: Server error
 */
router.post('/email/suggest-reply', authenticateUser, aiEmailController.suggestReply);

/**
 * @swagger
 * /api/ai/email/improve:
 *   post:
 *     summary: Improve email draft
 *     description: Improve an existing email draft based on instructions
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - draft
 *               - instruction
 *             properties:
 *               draft:
 *                 type: string
 *                 description: Email draft to improve
 *               instruction:
 *                 type: string
 *                 description: Instructions for improvement
 *                 example: Make it more concise and add urgency
 *     responses:
 *       200:
 *         description: Improved email draft
 *       400:
 *         description: Draft and instruction are required
 *       500:
 *         description: Server error
 */
router.post('/email/improve', authenticateUser, aiEmailController.improveEmail);

// ─── Daily Insights ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/insights/daily:
 *   get:
 *     summary: Get daily AI insights
 *     description: AI-generated daily insights about your CRM data, trends, and recommendations
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily insights and recommendations
 *       500:
 *         description: Server error
 */
router.get('/insights/daily', authenticateUser, aiInsightsController.getDailyInsights);

export default router;
