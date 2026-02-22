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

// Public: auth

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
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 */
router.post('/auth/login', portalController.login);

/**
 * @swagger
 * /api/portal/auth/register:
 *   post:
 *     summary: Register a new portal user
 *     tags: [Portal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - clientId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               clientId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Email already registered or client not found
 */
router.post('/auth/register', portalController.register);

// Portal user routes (portal JWT auth)

/**
 * @swagger
 * /api/portal/profile:
 *   get:
 *     summary: Get the current portal user's profile
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portal user profile
 */
router.get('/profile', authenticatePortalUser, portalController.getProfile);

/**
 * @swagger
 * /api/portal/dashboard:
 *   get:
 *     summary: Get portal dashboard overview for the current client
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', authenticatePortalUser, portalController.getDashboard);

/**
 * @swagger
 * /api/portal/deals:
 *   get:
 *     summary: Get deals for the current client
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of deals
 */
router.get('/deals', authenticatePortalUser, portalController.getDeals);

/**
 * @swagger
 * /api/portal/invoices:
 *   get:
 *     summary: Get invoices for the current client
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get('/invoices', authenticatePortalUser, portalController.getInvoices);

/**
 * @swagger
 * /api/portal/contracts:
 *   get:
 *     summary: Get contracts for the current client
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contracts
 */
router.get('/contracts', authenticatePortalUser, portalController.getContracts);

/**
 * @swagger
 * /api/portal/tickets:
 *   get:
 *     summary: Get support tickets for the current portal user
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of support tickets
 */
router.get('/tickets', authenticatePortalUser, portalController.getTickets);

/**
 * @swagger
 * /api/portal/tickets:
 *   post:
 *     summary: Create a new support ticket
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       201:
 *         description: Ticket created
 */
router.post('/tickets', authenticatePortalUser, portalController.createTicket);

/**
 * @swagger
 * /api/portal/tickets/{id}:
 *   get:
 *     summary: Get a support ticket by ID
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket details
 *       404:
 *         description: Ticket not found
 */
router.get('/tickets/:id', authenticatePortalUser, portalController.getTicketById);

// Enhanced portal routes: e-signatures, payments, projects, documents

/**
 * @swagger
 * /api/portal/documents/{id}/sign:
 *   post:
 *     summary: Sign a document (contract) with e-signature
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signatureData
 *               - signatureType
 *             properties:
 *               signatureData:
 *                 type: string
 *                 description: Base64-encoded signature image or typed signature data
 *               signatureType:
 *                 type: string
 *                 enum: [DRAWN, TYPED]
 *               typedName:
 *                 type: string
 *                 description: Required when signatureType is TYPED
 *     responses:
 *       201:
 *         description: Document signed successfully
 *       400:
 *         description: Invalid signature data or type
 */
router.post('/documents/:id/sign', authenticatePortalUser, portalEnhancedController.signDocument);

/**
 * @swagger
 * /api/portal/enhanced/dashboard:
 *   get:
 *     summary: Get enhanced dashboard with invoice totals, projects, signatures, and documents
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enhanced dashboard data
 */
router.get('/enhanced/dashboard', authenticatePortalUser, portalEnhancedController.getDashboard);

/**
 * @swagger
 * /api/portal/enhanced/invoices:
 *   get:
 *     summary: Get client invoices with payment status and pagination
 *     tags: [Portal]
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
 *     responses:
 *       200:
 *         description: Paginated list of invoices
 */
router.get('/enhanced/invoices', authenticatePortalUser, portalEnhancedController.getInvoices);

/**
 * @swagger
 * /api/portal/enhanced/projects:
 *   get:
 *     summary: Get client projects with progress and milestones
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of client projects
 */
router.get('/enhanced/projects', authenticatePortalUser, portalEnhancedController.getProjects);

/**
 * @swagger
 * /api/portal/documents/shared:
 *   get:
 *     summary: Get documents shared with the client
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shared documents
 */
router.get('/documents/shared', authenticatePortalUser, portalEnhancedController.getSharedDocuments);

/**
 * @swagger
 * /api/portal/signatures/{documentId}:
 *   get:
 *     summary: Get all signatures for a document
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: List of signatures for the document
 */
router.get('/signatures/:documentId', authenticatePortalUser, portalEnhancedController.getSignatures);

// Admin routes (CRM user auth)

/**
 * @swagger
 * /api/portal/admin/users:
 *   get:
 *     summary: List all portal users (admin)
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of portal users
 */
router.get('/admin/users', authenticateUser, portalController.adminGetPortalUsers);

/**
 * @swagger
 * /api/portal/admin/users:
 *   post:
 *     summary: Create a new portal user (admin)
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - clientId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               clientId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Portal user created
 *       400:
 *         description: Email already registered or client not found
 */
router.post('/admin/users', authenticateUser, portalController.adminCreatePortalUser);

/**
 * @swagger
 * /api/portal/admin/users/{id}:
 *   patch:
 *     summary: Toggle a portal user's active status (admin)
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Portal user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Portal user status updated
 *       404:
 *         description: Portal user not found
 */
router.patch('/admin/users/:id', authenticateUser, portalController.adminTogglePortalUser);

/**
 * @swagger
 * /api/portal/admin/tickets:
 *   get:
 *     summary: Get all support tickets across all portal users (admin)
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all support tickets
 */
router.get('/admin/tickets', authenticateUser, portalController.adminGetAllTickets);

/**
 * @swagger
 * /api/portal/admin/tickets/{id}/respond:
 *   put:
 *     summary: Respond to a support ticket (admin)
 *     tags: [Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *                 description: Admin response text
 *               status:
 *                 type: string
 *                 description: Updated ticket status
 *     responses:
 *       200:
 *         description: Ticket response recorded
 */
router.put('/admin/tickets/:id/respond', authenticateUser, portalController.adminRespondToTicket);

export default router;
