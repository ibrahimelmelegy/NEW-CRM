import { Router } from 'express';
import categoryController from './categoryController';
import { authenticateUser } from '../../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: E-Commerce Categories
 *   description: Product category management
 */

const router = Router();

/**
 * @swagger
 * /api/ecommerce/categories:
 *   get:
 *     summary: List product categories
 *     tags: [E-Commerce Categories]
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
 *         description: Search by name
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Filter by parent category (use "null" for root categories)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated category list
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, categoryController.getCategories);

/**
 * @swagger
 * /api/ecommerce/categories/tree:
 *   get:
 *     summary: Get full category tree (hierarchical)
 *     tags: [E-Commerce Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hierarchical category tree
 *       500:
 *         description: Server error
 */
router.get('/tree', authenticateUser, categoryController.getCategoryTree);

/**
 * @swagger
 * /api/ecommerce/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [E-Commerce Categories]
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
 *         description: Category details with parent and children
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateUser, categoryController.getCategoryById);

/**
 * @swagger
 * /api/ecommerce/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [E-Commerce Categories]
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
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               sortOrder:
 *                 type: integer
 *                 default: 0
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, categoryController.createCategory);

/**
 * @swagger
 * /api/ecommerce/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [E-Commerce Categories]
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
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateUser, categoryController.updateCategory);

/**
 * @swagger
 * /api/ecommerce/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [E-Commerce Categories]
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
 *         description: Category deleted
 *       400:
 *         description: Cannot delete category with subcategories
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateUser, categoryController.deleteCategory);

export default router;
