import express from 'express';
import contractController from './contractController';
import { authenticateUser } from '../middleware/authMiddleware';

/**
 * @swagger
 * tags:
 *   name: Contract
 *   description: Contract management — create, edit, send for e-signature, public signing
 */

const router = express.Router();

/**
 * @swagger
 * /api/contracts:
 *   get:
 *     summary: List contracts
 *     description: Returns all contracts belonging to the authenticated user
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contracts
 *       500:
 *         description: Server error
 */
// Authenticated routes
router.get('/', authenticateUser, contractController.getAll);

/**
 * @swagger
 * /api/contracts/{id}:
 *   get:
 *     summary: Get contract by ID
 *     tags: [Contract]
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
 *         description: Contract details
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateUser, contractController.getById);

/**
 * @swagger
 * /api/contracts:
 *   post:
 *     summary: Create a contract
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *                 description: Contract body (HTML or rich text)
 *               signerName:
 *                 type: string
 *               signerEmail:
 *                 type: string
 *                 format: email
 *               dealId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Contract created in DRAFT status
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateUser, contractController.create);

/**
 * @swagger
 * /api/contracts/{id}:
 *   put:
 *     summary: Update a contract
 *     tags: [Contract]
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               signerName:
 *                 type: string
 *               signerEmail:
 *                 type: string
 *                 format: email
 *               dealId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Contract updated
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticateUser, contractController.update);

/**
 * @swagger
 * /api/contracts/{id}:
 *   delete:
 *     summary: Delete a contract
 *     tags: [Contract]
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
 *         description: Contract deleted
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateUser, contractController.delete);

/**
 * @swagger
 * /api/contracts/{id}/send:
 *   post:
 *     summary: Send contract for signature
 *     description: Generates a signing token and sends the contract to the signer via email. Status changes to SENT.
 *     tags: [Contract]
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
 *         description: Contract sent for signature
 *       404:
 *         description: Contract not found
 *       500:
 *         description: Server error
 */
router.post('/:id/send', authenticateUser, contractController.sendForSignature);

/**
 * @swagger
 * /api/contracts/sign/{token}:
 *   get:
 *     summary: Get contract by signing token (public)
 *     description: Public endpoint — retrieves the contract for the signer to view before signing
 *     tags: [Contract]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique signing token
 *     responses:
 *       200:
 *         description: Contract details for signing
 *       404:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
// Public signing routes (no auth)
router.get('/sign/:token', contractController.getByToken);

/**
 * @swagger
 * /api/contracts/sign/{token}:
 *   post:
 *     summary: Sign a contract (public)
 *     description: Public endpoint — submits the signer's signature. Status changes to SIGNED.
 *     tags: [Contract]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique signing token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signatureData
 *               - signerName
 *             properties:
 *               signatureData:
 *                 type: string
 *                 description: Base64-encoded signature image
 *               signerName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contract signed successfully
 *       400:
 *         description: Contract already signed or expired
 *       404:
 *         description: Invalid token
 *       500:
 *         description: Server error
 */
router.post('/sign/:token', contractController.sign);

export default router;
