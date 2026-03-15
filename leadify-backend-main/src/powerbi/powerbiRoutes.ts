import express from 'express';
import powerbiController from './powerbiController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// All Power BI endpoints require authentication
router.use(authenticateUser);

/**
 * @swagger
 * tags:
 *   name: PowerBI
 *   description: Data export endpoints for Power BI integration
 */

// GET /api/powerbi/leads
router.get('/leads', (req, res, next) => powerbiController.getLeads(req, res, next));

// GET /api/powerbi/deals
router.get('/deals', (req, res, next) => powerbiController.getDeals(req, res, next));

// GET /api/powerbi/clients
router.get('/clients', (req, res, next) => powerbiController.getClients(req, res, next));

// GET /api/powerbi/tasks
router.get('/tasks', (req, res, next) => powerbiController.getTasks(req, res, next));

// GET /api/powerbi/invoices
router.get('/invoices', (req, res, next) => powerbiController.getInvoices(req, res, next));

// GET /api/powerbi/summary
router.get('/summary', (req, res, next) => powerbiController.getSummary(req, res, next));

export default router;
