import { Router } from 'express';
import couponController from './couponController';
import { authenticateUser, HasPermission } from '../../middleware/authMiddleware';
import { EcCouponPermissionsEnum } from '../../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: E-Commerce Coupons
 *   description: Coupon and discount code management
 */

const router = Router();

/**
 * @swagger
 * /api/ecommerce/coupons:
 *   get:
 *     summary: List coupons
 *     tags: [E-Commerce Coupons]
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
 *         description: Search by code or description
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PERCENTAGE, FIXED, FREE_SHIPPING]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, DISABLED]
 *     responses:
 *       200:
 *         description: Paginated coupon list
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, HasPermission([EcCouponPermissionsEnum.VIEW_EC_COUPONS]), couponController.getCoupons);

/**
 * @swagger
 * /api/ecommerce/coupons/{id}:
 *   get:
 *     summary: Get coupon by ID
 *     tags: [E-Commerce Coupons]
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
 *         description: Coupon details
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateUser, HasPermission([EcCouponPermissionsEnum.VIEW_EC_COUPONS]), couponController.getCouponById);

/**
 * @swagger
 * /api/ecommerce/coupons/validate:
 *   post:
 *     summary: Validate a coupon code
 *     tags: [E-Commerce Coupons]
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
 *               - orderAmount
 *             properties:
 *               code:
 *                 type: string
 *               orderAmount:
 *                 type: number
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Validation result with discount info
 *       500:
 *         description: Server error
 */
router.post('/validate', authenticateUser, HasPermission([EcCouponPermissionsEnum.APPLY_EC_COUPONS]), couponController.validateCoupon);

/**
 * @swagger
 * /api/ecommerce/coupons/apply:
 *   post:
 *     summary: Apply a coupon to an order
 *     tags: [E-Commerce Coupons]
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
 *               - orderAmount
 *             properties:
 *               code:
 *                 type: string
 *               orderAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Coupon applied, returns discount amount
 *       500:
 *         description: Server error
 */
router.post('/apply', authenticateUser, HasPermission([EcCouponPermissionsEnum.APPLY_EC_COUPONS]), couponController.applyCoupon);

/**
 * @swagger
 * /api/ecommerce/coupons:
 *   post:
 *     summary: Create a new coupon
 *     tags: [E-Commerce Coupons]
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
 *               - type
 *               - value
 *             properties:
 *               code:
 *                 type: string
 *                 description: Will be uppercased automatically
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED, FREE_SHIPPING]
 *               value:
 *                 type: number
 *               minOrderAmount:
 *                 type: number
 *                 default: 0
 *               maxDiscountAmount:
 *                 type: number
 *               maxUses:
 *                 type: integer
 *                 default: 0
 *                 description: 0 means unlimited
 *               maxUsesPerCustomer:
 *                 type: integer
 *                 default: 0
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validTo:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, EXPIRED, DISABLED]
 *                 default: ACTIVE
 *               applicableProducts:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               applicableCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Coupon created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, HasPermission([EcCouponPermissionsEnum.CREATE_EC_COUPONS]), couponController.createCoupon);

/**
 * @swagger
 * /api/ecommerce/coupons/{id}:
 *   put:
 *     summary: Update a coupon
 *     tags: [E-Commerce Coupons]
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
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED, FREE_SHIPPING]
 *               value:
 *                 type: number
 *               minOrderAmount:
 *                 type: number
 *               maxDiscountAmount:
 *                 type: number
 *               maxUses:
 *                 type: integer
 *               maxUsesPerCustomer:
 *                 type: integer
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validTo:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, EXPIRED, DISABLED]
 *               applicableProducts:
 *                 type: array
 *                 items:
 *                   type: string
 *               applicableCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Coupon updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateUser, HasPermission([EcCouponPermissionsEnum.EDIT_EC_COUPONS]), couponController.updateCoupon);

/**
 * @swagger
 * /api/ecommerce/coupons/{id}:
 *   delete:
 *     summary: Delete a coupon
 *     tags: [E-Commerce Coupons]
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
 *         description: Coupon deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateUser, HasPermission([EcCouponPermissionsEnum.DELETE_EC_COUPONS]), couponController.deleteCoupon);

export default router;
