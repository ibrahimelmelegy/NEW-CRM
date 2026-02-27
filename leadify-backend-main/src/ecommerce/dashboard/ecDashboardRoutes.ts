import { Router } from 'express';
import { authenticateUser } from '../../middleware/authMiddleware';
import ecDashboardController from './ecDashboardController';

/**
 * @swagger
 * tags:
 *   name: E-Commerce Dashboard
 *   description: Aggregated e-commerce dashboard statistics
 */

const router = Router();

/**
 * @swagger
 * /api/ecommerce/dashboard:
 *   get:
 *     summary: Get e-commerce dashboard statistics
 *     description: Returns totalRevenue, totalOrders, avgOrderValue, productCount, lowStockCount, topProducts, recentOrders, ordersByStatus
 *     tags: [E-Commerce Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: E-commerce dashboard statistics
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, ecDashboardController.getDashboardStats);

export default router;
