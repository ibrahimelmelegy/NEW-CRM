import { Router } from 'express';
import VendorController from './vendorController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { VendorPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Vendor
 *   description: Vendor management — suppliers, distributors, showrooms
 */

const router = Router();

/**
 * @swagger
 * /api/vendor:
 *   post:
 *     summary: Create a vendor
 *     tags: [Vendor]
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
 *               type:
 *                 type: string
 *                 enum: [Vendor, Distributor, LocalSupplier, Showroom]
 *                 default: Vendor
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               taxId:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   street2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zip:
 *                     type: string
 *               principalContact:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *               commercialRegistration:
 *                 type: string
 *               taxFile:
 *                 type: string
 *               evaluation:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               defaultPaymentMethod:
 *                 type: string
 *                 enum: [Cash, Credit]
 *                 default: Cash
 *               serviceType:
 *                 type: string
 *                 enum: [Hardware, Software, Both]
 *               brands:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Vendor created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, HasPermission([VendorPermissionsEnum.CREATE_VENDORS]), VendorController.createVendor);

/**
 * @swagger
 * /api/vendor/all:
 *   get:
 *     summary: Get all vendors (no pagination)
 *     description: Returns all vendors without pagination, useful for dropdowns
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all vendors
 *       500:
 *         description: Server error
 */
router.get('/all', authenticateUser, HasPermission([VendorPermissionsEnum.VIEW_VENDORS]), VendorController.getAllVendors);

/**
 * @swagger
 * /api/vendor:
 *   get:
 *     summary: List vendors with pagination
 *     tags: [Vendor]
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
 *         description: Search by vendor name
 *     responses:
 *       200:
 *         description: Paginated vendor list
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, HasPermission([VendorPermissionsEnum.VIEW_VENDORS]), VendorController.getVendors);

/**
 * @swagger
 * /api/vendor/{id}:
 *   get:
 *     summary: Get vendor by ID
 *     tags: [Vendor]
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
 *         description: Vendor details
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateUser, HasPermission([VendorPermissionsEnum.VIEW_VENDORS]), VendorController.getVendorById);

/**
 * @swagger
 * /api/vendor/{id}:
 *   put:
 *     summary: Update a vendor
 *     tags: [Vendor]
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
 *               type:
 *                 type: string
 *                 enum: [Vendor, Distributor, LocalSupplier, Showroom]
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               taxId:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   street2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zip:
 *                     type: string
 *               principalContact:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *               commercialRegistration:
 *                 type: string
 *               taxFile:
 *                 type: string
 *               evaluation:
 *                 type: integer
 *               defaultPaymentMethod:
 *                 type: string
 *                 enum: [Cash, Credit]
 *               serviceType:
 *                 type: string
 *                 enum: [Hardware, Software, Both]
 *               brands:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Vendor updated
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateUser, HasPermission([VendorPermissionsEnum.EDIT_VENDORS]), VendorController.updateVendor);

/**
 * @swagger
 * /api/vendor/{id}:
 *   delete:
 *     summary: Delete a vendor
 *     tags: [Vendor]
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
 *         description: Vendor deleted
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateUser, HasPermission([VendorPermissionsEnum.DELETE_VENDORS]), VendorController.deleteVendor);

export default router;
