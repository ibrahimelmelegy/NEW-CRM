import { Router } from 'express';
import InventoryController from './inventoryController';
import { authenticateUser } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management — products, stock levels, movements, warehouses
 */

const router = Router();

// ─── Product routes (specific routes before parameterized) ────────────────────

/**
 * @swagger
 * /api/inventory/products/low-stock:
 *   get:
 *     summary: Get low-stock products
 *     description: Returns products where current stock is at or below minimum stock level
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low-stock products
 *       500:
 *         description: Server error
 */
router.get('/products/low-stock', authenticateUser, InventoryController.getLowStock);

/**
 * @swagger
 * /api/inventory/products/categories:
 *   get:
 *     summary: Get product categories
 *     description: Returns distinct product categories for filtering
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of category names
 *       500:
 *         description: Server error
 */
router.get('/products/categories', authenticateUser, InventoryController.getCategories);

/**
 * @swagger
 * /api/inventory/products/warehouses:
 *   get:
 *     summary: Get warehouses
 *     description: Returns distinct warehouse names for filtering
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of warehouse names
 *       500:
 *         description: Server error
 */
router.get('/products/warehouses', authenticateUser, InventoryController.getWarehouses);

// ─── Product CRUD ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/inventory/products:
 *   get:
 *     summary: List inventory products
 *     tags: [Inventory]
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
 *         name: warehouse
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
router.get('/products', authenticateUser, InventoryController.getProducts);

/**
 * @swagger
 * /api/inventory/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/products/:id', authenticateUser, InventoryController.getProductById);

/**
 * @swagger
 * /api/inventory/products:
 *   post:
 *     summary: Create inventory product
 *     tags: [Inventory]
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
 *               - sku
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *                 description: Unique stock-keeping unit
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *                 default: 0
 *               costPrice:
 *                 type: number
 *                 default: 0
 *               currentStock:
 *                 type: integer
 *                 default: 0
 *               minStockLevel:
 *                 type: integer
 *                 default: 0
 *               unit:
 *                 type: string
 *                 description: Unit of measure (e.g. pcs, kg, box)
 *               warehouse:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Duplicate SKU or validation error
 *       500:
 *         description: Server error
 */
router.post('/products', authenticateUser, InventoryController.createProduct);

/**
 * @swagger
 * /api/inventory/products/{id}:
 *   put:
 *     summary: Update inventory product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *               costPrice:
 *                 type: number
 *               currentStock:
 *                 type: integer
 *               minStockLevel:
 *                 type: integer
 *               unit:
 *                 type: string
 *               warehouse:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/products/:id', authenticateUser, InventoryController.updateProduct);

/**
 * @swagger
 * /api/inventory/products/{id}:
 *   delete:
 *     summary: Delete inventory product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/products/:id', authenticateUser, InventoryController.deleteProduct);

// ─── Stock Movements ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/inventory/products/{id}/movements:
 *   get:
 *     summary: Get stock movements for a product
 *     description: Returns the history of stock in/out/adjustments for a specific product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of stock movements
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/products/:id/movements', authenticateUser, InventoryController.getMovements);

/**
 * @swagger
 * /api/inventory/movements:
 *   post:
 *     summary: Add stock movement
 *     description: Record a stock movement (in, out, adjustment, or transfer) and update product stock accordingly
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - type
 *               - quantity
 *             properties:
 *               productId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [IN, OUT, ADJUSTMENT, TRANSFER]
 *               quantity:
 *                 type: integer
 *               reason:
 *                 type: string
 *               reference:
 *                 type: string
 *                 description: External reference number
 *     responses:
 *       201:
 *         description: Stock movement recorded and product stock updated
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post('/movements', authenticateUser, InventoryController.addMovement);

export default router;
