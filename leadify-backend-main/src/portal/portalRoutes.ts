import express from 'express';
import portalController from './portalController';
import portalEnhancedController from './portalEnhancedController';
import { authenticatePortalUser } from './portalMiddleware';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Portal
 *   description: Client portal for self-service access to deals, invoices, contracts, tickets, and documents
 */

// ─── Public: auth ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/portal/auth/login:
 *   post:
 *     summary: Login to the client portal
 *     tags: [Portal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 */
router.get('/', authenticatePortalUser, portalController.getDashboard);
router.post('/auth/login', portalController.login);

/**
 * @swagger
 * /api/portal/auth/register:
 *   post:
 *     summary: Register a new portal user
 *     tags: [Portal]
 */
router.post('/auth/register', portalController.register);

/**
 * @swagger
 * /api/portal/request-access:
 *   post:
 *     summary: Request portal access via email (magic link)
 *     tags: [Portal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Portal access link generated and sent
 */
router.post('/request-access', portalController.requestAccess);

/**
 * @swagger
 * /api/portal/verify:
 *   post:
 *     summary: Validate a portal access token and return client data
 *     tags: [Portal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token validated, returns client data
 */
router.post('/verify', portalController.verifyToken);

// ─── Portal user routes (portal JWT auth) ────────────────────────────────────

/**
 * @swagger
 * /api/portal/profile:
 *   get:
 *     summary: Get the current portal user's profile
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/profile', authenticatePortalUser, portalController.getProfile);

/**
 * @swagger
 * /api/portal/dashboard:
 *   get:
 *     summary: Get portal dashboard overview for the current client
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/dashboard', authenticatePortalUser, portalController.getDashboard);

/**
 * @swagger
 * /api/portal/dashboard/stats:
 *   get:
 *     summary: Get dashboard summary stats (invoice count, open tickets, active projects)
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/dashboard/stats', authenticatePortalUser, portalController.getDashboardStats);

/**
 * @swagger
 * /api/portal/deals:
 *   get:
 *     summary: Get deals for the current client
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/deals', authenticatePortalUser, portalController.getDeals);

/**
 * @swagger
 * /api/portal/invoices:
 *   get:
 *     summary: Get invoices for the current client
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/invoices', authenticatePortalUser, portalController.getInvoices);

/**
 * @swagger
 * /api/portal/invoices/{id}/pdf:
 *   get:
 *     summary: Get invoice data for PDF generation
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/invoices/:id/pdf', authenticatePortalUser, portalController.getInvoicePdf);

/**
 * @swagger
 * /api/portal/contracts:
 *   get:
 *     summary: Get contracts for the current client
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/contracts', authenticatePortalUser, portalController.getContracts);

/**
 * @swagger
 * /api/portal/tickets:
 *   get:
 *     summary: Get support tickets for the current portal user
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/tickets', authenticatePortalUser, portalController.getTickets);

/**
 * @swagger
 * /api/portal/tickets:
 *   post:
 *     summary: Create a new support ticket
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, description]
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 */
router.post('/tickets', authenticatePortalUser, portalController.createTicket);

/**
 * @swagger
 * /api/portal/tickets/{id}:
 *   get:
 *     summary: Get a support ticket by ID
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/tickets/:id', authenticatePortalUser, portalController.getTicketById);

/**
 * @swagger
 * /api/portal/tickets/{id}/messages:
 *   get:
 *     summary: Get ticket thread with all messages
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/tickets/:id/messages', authenticatePortalUser, portalController.getTicketMessages);

/**
 * @swagger
 * /api/portal/tickets/{id}/messages:
 *   post:
 *     summary: Reply to a support ticket
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 */
router.post('/tickets/:id/messages', authenticatePortalUser, portalController.addTicketMessage);

/**
 * @swagger
 * /api/portal/projects:
 *   get:
 *     summary: Get projects for the current client
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/projects', authenticatePortalUser, portalController.getProjects);

// ─── Enhanced portal routes ──────────────────────────────────────────────────

router.post('/documents/:id/sign', authenticatePortalUser, portalEnhancedController.signDocument);
router.get('/enhanced/dashboard', authenticatePortalUser, portalEnhancedController.getDashboard);
router.get('/enhanced/invoices', authenticatePortalUser, portalEnhancedController.getInvoices);
router.get('/enhanced/projects', authenticatePortalUser, portalEnhancedController.getProjects);
router.get('/documents/shared', authenticatePortalUser, portalEnhancedController.getSharedDocuments);
router.get('/signatures/:documentId', authenticatePortalUser, portalEnhancedController.getSignatures);

// ─── Admin routes (CRM user auth) ───────────────────────────────────────────

router.get('/admin/users', authenticateUser, portalController.adminGetPortalUsers);
router.post('/admin/users', authenticateUser, portalController.adminCreatePortalUser);
router.patch('/admin/users/:id', authenticateUser, portalController.adminTogglePortalUser);
router.get('/admin/tickets', authenticateUser, portalController.adminGetAllTickets);
router.put('/admin/tickets/:id/respond', authenticateUser, portalController.adminRespondToTicket);

/**
 * @swagger
 * /api/portal/admin/generate-access:
 *   post:
 *     summary: Generate a portal access link for a client (admin)
 *     tags: [Portal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, email]
 *             properties:
 *               clientId:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 */
router.post('/admin/generate-access', authenticateUser, portalController.adminGenerateAccess);

export default router;
