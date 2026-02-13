import express from 'express';
import portalController from './portalController';
import { authenticatePortalUser } from './portalMiddleware';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Public: auth
router.post('/auth/login', portalController.login);
router.post('/auth/register', portalController.register);

// Portal user routes (portal JWT auth)
router.get('/profile', authenticatePortalUser, portalController.getProfile);
router.get('/dashboard', authenticatePortalUser, portalController.getDashboard);
router.get('/deals', authenticatePortalUser, portalController.getDeals);
router.get('/invoices', authenticatePortalUser, portalController.getInvoices);
router.get('/contracts', authenticatePortalUser, portalController.getContracts);
router.get('/tickets', authenticatePortalUser, portalController.getTickets);
router.post('/tickets', authenticatePortalUser, portalController.createTicket);
router.get('/tickets/:id', authenticatePortalUser, portalController.getTicketById);

// Admin routes (CRM user auth)
router.get('/admin/users', authenticateUser, portalController.adminGetPortalUsers);
router.post('/admin/users', authenticateUser, portalController.adminCreatePortalUser);
router.patch('/admin/users/:id', authenticateUser, portalController.adminTogglePortalUser);
router.get('/admin/tickets', authenticateUser, portalController.adminGetAllTickets);
router.put('/admin/tickets/:id/respond', authenticateUser, portalController.adminRespondToTicket);

export default router;
