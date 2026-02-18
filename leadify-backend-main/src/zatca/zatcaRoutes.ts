import express from 'express';
import zatcaController from './zatcaController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// List e-invoices
router.get('/invoices', authenticateUser, zatcaController.getInvoices);

// Get single e-invoice
router.get('/invoices/:id', authenticateUser, zatcaController.getInvoice);

// Create e-invoice from internal invoice
router.post('/invoices', authenticateUser, zatcaController.createInvoice);

// Submit to ZATCA
router.post('/invoices/:id/submit', authenticateUser, zatcaController.submitInvoice);

// Get QR code
router.get('/invoices/:id/qr', authenticateUser, zatcaController.getQRCode);

// Download XML
router.get('/invoices/:id/xml', authenticateUser, zatcaController.getXML);

// Validate invoice data
router.post('/validate', authenticateUser, zatcaController.validateInvoice);

export default router;
