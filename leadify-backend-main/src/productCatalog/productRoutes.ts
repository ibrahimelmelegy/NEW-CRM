import { Router } from 'express';
import productController from './productController';
import { authenticateUser } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: Product Catalog
 *   description: Product catalog, inventory, price rules, reviews, and quote line items
 */

const router = Router();

router.get('/', authenticateUser, productController.getProducts);

// ─── Product Analytics ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/catalog/products/analytics:
 *   get:
 *     summary: Get product analytics
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product analytics data
 */
router.get('/products/analytics', authenticateUser, productController.getProductAnalytics);

/**
 * @swagger
 * /api/catalog/products/low-stock:
 *   get:
 *     summary: Get low-stock products
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
 *     responses:
 *       200:
 *         description: Low stock products list
 */
router.get('/products/low-stock', authenticateUser, productController.getLowStockProducts);

/**
 * @swagger
 * /api/catalog/products/bulk-import:
 *   post:
 *     summary: Bulk import products
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
 *               - products
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Import results
 */
router.post('/products/bulk-import', authenticateUser, productController.bulkImport);

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
 *         description: Search by name, SKU, or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter products below low stock threshold
 *     responses:
 *       200:
 *         description: Paginated product list
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
 *               stockQuantity:
 *                 type: integer
 *                 default: 0
 *               lowStockThreshold:
 *                 type: integer
 *                 default: 10
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/products', authenticateUser, productController.createProduct);

/**
 * @swagger
 * /api/catalog/products/{id}:
 *   get:
 *     summary: Get a single product by ID
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
 *         description: Product detail with price rules
 *       404:
 *         description: Not found
 */
router.get('/products/:id', authenticateUser, productController.getProductById);

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
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Not found
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
 */
router.delete('/products/:id', authenticateUser, productController.deleteProduct);

// ─── Inventory ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/catalog/products/{id}/stock:
 *   patch:
 *     summary: Update product stock quantity
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *               operation:
 *                 type: string
 *                 enum: [set, add, subtract]
 *                 default: set
 *     responses:
 *       200:
 *         description: Stock updated
 */
router.patch('/products/:id/stock', authenticateUser, productController.updateStock);

// ─── Price Rules ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/catalog/products/{id}/price-rules:
 *   get:
 *     summary: Get price rules for a product
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 */
router.get('/products/:id/price-rules', authenticateUser, productController.getProductPriceRules);

/**
 * @swagger
 * /api/catalog/products/{id}/price-rules:
 *   post:
 *     summary: Create a price rule for a product
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 */
router.post('/products/:id/price-rules', authenticateUser, productController.createPriceRule);

/**
 * @swagger
 * /api/catalog/products/{id}/price-rules/{ruleId}:
 *   put:
 *     summary: Update a price rule
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 */
router.put('/products/:id/price-rules/:ruleId', authenticateUser, productController.updatePriceRule);

/**
 * @swagger
 * /api/catalog/products/{id}/price-rules/{ruleId}:
 *   delete:
 *     summary: Delete a price rule
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/products/:id/price-rules/:ruleId', authenticateUser, productController.deletePriceRule);

// ─── Product Reviews ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/catalog/products/{id}/reviews:
 *   get:
 *     summary: Get reviews for a specific product
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 */
router.get('/products/:id/reviews', authenticateUser, productController.getProductReviews);

// ─── Product Activity ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/catalog/products/{id}/activity:
 *   get:
 *     summary: Get activity log for a specific product
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
 */
router.get('/products/:id/activity', authenticateUser, productController.getProductActivity);

// ─── Quote Line Items ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/catalog/quotes/{quoteId}/lines:
 *   get:
 *     summary: Get quote line items
 *     tags: [Product Catalog]
 *     security:
 *       - bearerAuth: []
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
 */
router.delete('/quotes/lines/:id', authenticateUser, productController.removeQuoteLine);

export default router;
