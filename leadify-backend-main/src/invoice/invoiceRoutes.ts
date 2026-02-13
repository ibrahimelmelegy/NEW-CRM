import express from 'express';
import invoiceController from './invoiceController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { DealPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

router.get('/', authenticateUser, invoiceController.getInvoices);
router.get('/summary', authenticateUser, invoiceController.getSummary);
router.get('/:id', authenticateUser, invoiceController.getInvoiceById);
router.put('/:id/collect', authenticateUser, HasPermission([DealPermissionsEnum.EDIT_DEALS]), invoiceController.markCollected);
router.put('/:id/uncollect', authenticateUser, HasPermission([DealPermissionsEnum.EDIT_DEALS]), invoiceController.markUncollected);

export default router;
