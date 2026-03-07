import express from 'express';
import zatcaController from './zatcaController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ZATCA
 *   description: ZATCA e-invoicing compliance (Saudi tax authority)
 */

/**
 * @swagger
 * /api/zatca/invoices:
 *   get:
 *     summary: List ZATCA e-invoices
 *     tags: [ZATCA]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, REPORTED, CLEARED, REJECTED]
 *         description: Filter by invoice status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by invoice number, buyer name, or seller VAT number
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter invoices from this issue date (YYYY-MM-DD)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter invoices up to this issue date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Paginated list of ZATCA invoices
 */
router.get('/', authenticateUser, zatcaController.getInvoices);
router.get('/invoices', authenticateUser, zatcaController.getInvoices);

/**
 * @swagger
 * /api/zatca/invoices/{id}:
 *   get:
 *     summary: Get a single ZATCA e-invoice
 *     tags: [ZATCA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ZATCA invoice ID
 *     responses:
 *       200:
 *         description: ZATCA invoice details
 *       404:
 *         description: Invoice not found
 */
router.get('/invoices/:id', authenticateUser, zatcaController.getInvoice);

/**
 * @swagger
 * /api/zatca/invoices:
 *   post:
 *     summary: Create a ZATCA e-invoice from internal invoice data
 *     tags: [ZATCA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - invoiceType
 *               - invoiceNumber
 *               - issueDate
 *               - sellerName
 *               - sellerVatNumber
 *               - sellerAddress
 *               - buyerName
 *               - lineItems
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 description: Internal invoice ID reference
 *               invoiceType:
 *                 type: string
 *                 enum: [STANDARD, SIMPLIFIED, DEBIT_NOTE, CREDIT_NOTE]
 *                 description: ZATCA invoice type
 *               invoiceNumber:
 *                 type: string
 *                 description: Invoice number
 *               issueDate:
 *                 type: string
 *                 format: date
 *                 description: Invoice issue date (YYYY-MM-DD)
 *               supplyDate:
 *                 type: string
 *                 format: date
 *                 description: Supply/delivery date (YYYY-MM-DD)
 *               sellerName:
 *                 type: string
 *                 description: Seller company name
 *               sellerVatNumber:
 *                 type: string
 *                 description: Seller VAT number (15 digits, starts and ends with 3)
 *               sellerAddress:
 *                 type: object
 *                 required:
 *                   - street
 *                   - buildingNumber
 *                   - city
 *                   - postalCode
 *                   - district
 *                   - country
 *                 properties:
 *                   street:
 *                     type: string
 *                   buildingNumber:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   district:
 *                     type: string
 *                   country:
 *                     type: string
 *               buyerName:
 *                 type: string
 *                 description: Buyer company name
 *               buyerVatNumber:
 *                 type: string
 *                 description: Buyer VAT number (required for STANDARD invoices)
 *               buyerAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   buildingNumber:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   district:
 *                     type: string
 *                   country:
 *                     type: string
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - description
 *                     - quantity
 *                     - unitPrice
 *                     - taxRate
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *                     discount:
 *                       type: number
 *                       default: 0
 *                     taxCategory:
 *                       type: string
 *                       default: S
 *                     taxRate:
 *                       type: number
 *                       description: Tax rate percentage (e.g. 15 for 15%)
 *               previousInvoiceHash:
 *                 type: string
 *                 description: Hash of the previous invoice in the chain
 *     responses:
 *       201:
 *         description: ZATCA e-invoice created with QR code and XML
 *       400:
 *         description: Validation failed
 */
router.post('/invoices', authenticateUser, zatcaController.createInvoice);

/**
 * @swagger
 * /api/zatca/invoices/{id}/submit:
 *   post:
 *     summary: Submit a ZATCA e-invoice to ZATCA authority
 *     tags: [ZATCA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ZATCA invoice ID
 *     responses:
 *       200:
 *         description: Invoice submitted (REPORTED for simplified, CLEARED for standard)
 *       400:
 *         description: Invoice cannot be submitted (wrong status or missing XML)
 *       404:
 *         description: Invoice not found
 */
router.post('/invoices/:id/submit', authenticateUser, zatcaController.submitInvoice);

/**
 * @swagger
 * /api/zatca/invoices/{id}/qr:
 *   get:
 *     summary: Get QR code for a ZATCA e-invoice
 *     tags: [ZATCA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ZATCA invoice ID
 *     responses:
 *       200:
 *         description: Base64-encoded TLV QR code payload
 *       404:
 *         description: Invoice not found or QR code not generated
 */
router.get('/invoices/:id/qr', authenticateUser, zatcaController.getQRCode);

/**
 * @swagger
 * /api/zatca/invoices/{id}/xml:
 *   get:
 *     summary: Download UBL 2.1 XML for a ZATCA e-invoice
 *     tags: [ZATCA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ZATCA invoice ID
 *     responses:
 *       200:
 *         description: XML file download
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *       404:
 *         description: Invoice not found or XML not generated
 */
router.get('/invoices/:id/xml', authenticateUser, zatcaController.getXML);

/**
 * @swagger
 * /api/zatca/validate:
 *   post:
 *     summary: Validate ZATCA invoice data without persisting
 *     tags: [ZATCA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceNumber:
 *                 type: string
 *               invoiceType:
 *                 type: string
 *                 enum: [STANDARD, SIMPLIFIED, DEBIT_NOTE, CREDIT_NOTE]
 *               issueDate:
 *                 type: string
 *                 format: date
 *               sellerName:
 *                 type: string
 *               sellerVatNumber:
 *                 type: string
 *               sellerAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   buildingNumber:
 *                     type: string
 *                   city:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   district:
 *                     type: string
 *                   country:
 *                     type: string
 *               buyerName:
 *                 type: string
 *               buyerVatNumber:
 *                 type: string
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *                     taxRate:
 *                       type: number
 *     responses:
 *       200:
 *         description: Validation result with valid flag and error list
 */
router.post('/validate', authenticateUser, zatcaController.validateInvoice);

export default router;
