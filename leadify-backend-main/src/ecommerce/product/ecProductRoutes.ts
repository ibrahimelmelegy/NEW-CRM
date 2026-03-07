import { Router } from 'express';
import { authenticateUser } from '../../middleware/authMiddleware';
import ecProductController from './ecProductController';

/**
 * @swagger
 * tags:
 *   name: E-Commerce Products
 *   description: E-Commerce product sub-resources — reviews, price rules, activity
 */

const router = Router();

// ─── Product Reviews ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ecommerce/products/{id}/reviews:
 *   get:
 *     summary: Get reviews for a product
 *     tags: [E-Commerce Products]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateUser, (_req, res) => res.json({ docs: [], message: 'Use /api/catalog for product listing' }));
router.get('/:id/reviews', authenticateUser, ecProductController.getProductReviews);

// ─── Product Price Rules ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ecommerce/products/{id}/price-rules:
 *   get:
 *     summary: Get price rules for a product
 *     tags: [E-Commerce Products]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/price-rules', authenticateUser, ecProductController.getProductPriceRules);

/**
 * @swagger
 * /api/ecommerce/products/{id}/price-rules:
 *   post:
 *     summary: Create a price rule for a product
 *     tags: [E-Commerce Products]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/price-rules', authenticateUser, ecProductController.createPriceRule);

// ─── Product Activity ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ecommerce/products/{id}/activity:
 *   get:
 *     summary: Get activity log for a product
 *     tags: [E-Commerce Products]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/activity', authenticateUser, ecProductController.getProductActivity);

export default router;
