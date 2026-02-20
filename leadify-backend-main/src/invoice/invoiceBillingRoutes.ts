import express from 'express';
import invoiceBillingController from './invoiceBillingController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { InvoicePermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// Aging report (must be before /:id to avoid route conflict)
router.get(
    '/aging-report',
    authenticateUser,
    HasPermission([InvoicePermissionsEnum.VIEW_AGING, InvoicePermissionsEnum.VIEW_INVOICES]),
    invoiceBillingController.getAgingReport
);

// Create invoice with line items
router.post(
    '/create',
    authenticateUser,
    HasPermission([InvoicePermissionsEnum.CREATE_INVOICES]),
    invoiceBillingController.createInvoice
);

// Create invoice from sales order
router.post(
    '/from-order/:orderId',
    authenticateUser,
    HasPermission([InvoicePermissionsEnum.CREATE_INVOICES]),
    invoiceBillingController.createFromOrder
);

// Get invoice detail with line items
router.get(
    '/:id',
    authenticateUser,
    HasPermission([InvoicePermissionsEnum.VIEW_INVOICES]),
    invoiceBillingController.getInvoiceDetail
);

// Update invoice
router.put(
    '/:id',
    authenticateUser,
    HasPermission([InvoicePermissionsEnum.EDIT_INVOICES]),
    invoiceBillingController.updateInvoice
);

// Mark sent
router.patch(
    '/:id/send',
    authenticateUser,
    HasPermission([InvoicePermissionsEnum.SEND_INVOICES]),
    invoiceBillingController.markSent
);

// Void invoice
router.patch(
    '/:id/void',
    authenticateUser,
    HasPermission([InvoicePermissionsEnum.VOID_INVOICES]),
    invoiceBillingController.voidInvoice
);

// Issue credit note
router.post(
    '/:id/credit-note',
    authenticateUser,
    HasPermission([InvoicePermissionsEnum.CREATE_CREDIT_NOTE]),
    invoiceBillingController.createCreditNote
);

export default router;
