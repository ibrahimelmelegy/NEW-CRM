import { Router } from 'express';
import productController from './productController';
import { authenticateUser } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: Product Catalog
 *   description: Product catalog and quote line items
 */

const router = Router();

// ─── Product CRUD ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/catalog/products:
 *   get:
 *     summary: List catalog products
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: searchKey
 *         schema:
 *           type: string
 *         description: Search by name or SKU
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated product list
 *       500:
 *         description: Server error
 */
router.get('/products', authenticateUser, productController.getProducts);

/**
 * @swagger
 * /api/catalog/products:
 *   post:
 *     summary: Create catalog product
 *     tags: [Product Catalog]
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
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *                 description: Unique SKU
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *                 default: 0
 *               currency:
 *                 type: string
 *                 default: SAR
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/products', authenticateUser, productController.createProduct);

/**
 * @swagger
 * /api/catalog/products/{id}:
 *   put:
 *     summary: Update catalog product
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *               currency:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/products/:id', authenticateUser, productController.updateProduct);

/**
 * @swagger
 * /api/catalog/products/{id}:
 *   delete:
 *     summary: Delete catalog product
 *     tags: [Product Catalog]
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
 *         description: Product deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/products/:id', authenticateUser, productController.deleteProduct);

// ─── Quote Line Items ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/catalog/quotes/{quoteId}/lines:
 *   get:
 *     summary: Get quote line items
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quoteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of quote line items
 *       500:
 *         description: Server error
 */
router.get('/quotes/:quoteId/lines', authenticateUser, productController.getQuoteLines);

/**
 * @swagger
 * /api/catalog/quotes/lines:
 *   post:
 *     summary: Add quote line item
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quoteId
 *               - productId
 *               - unitPrice
 *             properties:
 *               quoteId:
 *                 type: string
 *                 format: uuid
 *               productId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: number
 *                 default: 1
 *               unitPrice:
 *                 type: number
 *               discount:
 *                 type: number
 *                 default: 0
 *     responses:
 *       201:
 *         description: Line item added
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/quotes/lines', authenticateUser, productController.addQuoteLine);

/**
 * @swagger
 * /api/catalog/quotes/lines/{id}:
 *   put:
 *     summary: Update quote line item
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *               unitPrice:
 *                 type: number
 *               discount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Line item updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/quotes/lines/:id', authenticateUser, productController.updateQuoteLine);

/**
 * @swagger
 * /api/catalog/quotes/lines/{id}:
 *   delete:
 *     summary: Remove quote line item
 *     tags: [Product Catalog]
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
 *         description: Line item removed
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/quotes/lines/:id', authenticateUser, productController.removeQuoteLine);

export default router;
