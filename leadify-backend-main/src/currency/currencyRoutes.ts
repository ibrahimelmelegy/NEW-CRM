import express from 'express';
import currencyController from './currencyController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Currency
 *   description: Currency management, conversion, and tax calculation
 */

router.get('/', authenticateUser, currencyController.getCurrencies);

// Currencies

/**
 * @swagger
 * /api/currency/currencies:
 *   get:
 *     summary: Get all currencies
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of currencies ordered by default status and code
 */
router.get('/currencies', authenticateUser, currencyController.getCurrencies);

/**
 * @swagger
 * /api/currency/currencies:
 *   post:
 *     summary: Create a new currency
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - exchangeRate
 *             properties:
 *               code:
 *                 type: string
 *                 maxLength: 3
 *                 description: ISO 4217 currency code (e.g. USD, SAR)
 *               name:
 *                 type: string
 *                 description: Currency name
 *               symbol:
 *                 type: string
 *                 maxLength: 5
 *                 description: Currency symbol (e.g. $, SR)
 *               exchangeRate:
 *                 type: number
 *                 format: double
 *                 description: Exchange rate relative to base currency
 *               isDefault:
 *                 type: boolean
 *                 description: Set as default currency (unsets previous default)
 *     responses:
 *       201:
 *         description: Currency created
 */
router.post('/currencies', authenticateUser, currencyController.createCurrency);

/**
 * @swagger
 * /api/currency/currencies/{id}:
 *   put:
 *     summary: Update a currency
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Currency ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 maxLength: 3
 *                 description: ISO 4217 currency code
 *               name:
 *                 type: string
 *                 description: Currency name
 *               symbol:
 *                 type: string
 *                 maxLength: 5
 *                 description: Currency symbol
 *               exchangeRate:
 *                 type: number
 *                 format: double
 *                 description: Exchange rate relative to base currency
 *               isDefault:
 *                 type: boolean
 *                 description: Set as default currency (unsets previous default)
 *     responses:
 *       200:
 *         description: Currency updated
 */
router.put('/currencies/:id', authenticateUser, currencyController.updateCurrency);

/**
 * @swagger
 * /api/currency/currencies/{id}:
 *   delete:
 *     summary: Delete a currency
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Currency ID
 *     responses:
 *       200:
 *         description: Currency deleted
 */
router.delete('/currencies/:id', authenticateUser, currencyController.deleteCurrency);

/**
 * @swagger
 * /api/currency/convert:
 *   get:
 *     summary: Convert an amount between two currencies
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Amount to convert
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: Source currency code (e.g. USD)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: Target currency code (e.g. SAR)
 *     responses:
 *       200:
 *         description: Conversion result
 */
router.get('/convert', authenticateUser, currencyController.convert);

// Tax Rules

/**
 * @swagger
 * /api/currency/tax-rules:
 *   get:
 *     summary: Get all tax rules
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tax rules ordered by name
 */
router.get('/tax-rules', authenticateUser, currencyController.getTaxRules);

/**
 * @swagger
 * /api/currency/tax-rules:
 *   post:
 *     summary: Create a new tax rule
 *     tags: [Currency]
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
 *               - rate
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tax rule name
 *               rate:
 *                 type: number
 *                 format: double
 *                 description: Tax rate as a percentage (e.g. 15 for 15%)
 *               region:
 *                 type: string
 *                 description: Geographic region for the tax rule
 *               description:
 *                 type: string
 *                 description: Description of the tax rule
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the tax rule is active
 *               taxType:
 *                 type: string
 *                 enum: [VAT, ZAKAAT, WITHHOLDING, EXCISE]
 *                 default: VAT
 *                 description: Type of tax
 *               isCompound:
 *                 type: boolean
 *                 default: false
 *                 description: Whether tax is compound
 *               isInclusive:
 *                 type: boolean
 *                 default: false
 *                 description: Whether amounts include tax
 *     responses:
 *       201:
 *         description: Tax rule created
 */
router.post('/tax-rules', authenticateUser, currencyController.createTaxRule);

/**
 * @swagger
 * /api/currency/tax-rules/{id}:
 *   put:
 *     summary: Update a tax rule
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tax rule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tax rule name
 *               rate:
 *                 type: number
 *                 format: double
 *                 description: Tax rate as a percentage
 *               region:
 *                 type: string
 *                 description: Geographic region
 *               description:
 *                 type: string
 *                 description: Description
 *               isActive:
 *                 type: boolean
 *                 description: Whether the tax rule is active
 *               taxType:
 *                 type: string
 *                 enum: [VAT, ZAKAAT, WITHHOLDING, EXCISE]
 *                 description: Type of tax
 *               isCompound:
 *                 type: boolean
 *                 description: Whether tax is compound
 *               isInclusive:
 *                 type: boolean
 *                 description: Whether amounts include tax
 *     responses:
 *       200:
 *         description: Tax rule updated
 */
router.put('/tax-rules/:id', authenticateUser, currencyController.updateTaxRule);

/**
 * @swagger
 * /api/currency/tax-rules/{id}:
 *   delete:
 *     summary: Delete a tax rule
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tax rule ID
 *     responses:
 *       200:
 *         description: Tax rule deleted
 */
router.delete('/tax-rules/:id', authenticateUser, currencyController.deleteTaxRule);

/**
 * @swagger
 * /api/currency/calculate-tax:
 *   get:
 *     summary: Calculate tax using a stored tax rule
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Monetary amount
 *       - in: query
 *         name: taxRuleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the tax rule to apply
 *     responses:
 *       200:
 *         description: Tax calculation result with base amount, tax amount, and total
 */
router.get('/calculate-tax', authenticateUser, currencyController.calculateTax);

/**
 * @swagger
 * /api/currency/calculate-vat:
 *   get:
 *     summary: Calculate VAT directly without a stored tax rule
 *     tags: [Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Monetary amount
 *       - in: query
 *         name: rate
 *         required: true
 *         schema:
 *           type: number
 *         description: VAT rate as a percentage (e.g. 15 for 15%)
 *       - in: query
 *         name: isInclusive
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *         description: Whether the amount already includes VAT
 *     responses:
 *       200:
 *         description: VAT calculation result with base amount, VAT amount, and total
 */
router.get('/calculate-vat', authenticateUser, currencyController.calculateVAT);

export default router;
