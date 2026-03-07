import express, { Response, NextFunction } from 'express';
import { authenticateUser } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/rateLimiter';
import { wrapResult } from '../utils/response/responseWrapper';
import { AuthenticatedRequest } from '../types';
import { generateSecret, verifyToken, enable2FA, disable2FA, generateBackupCodes, verifyBackupCode, getSetupData } from './twoFactorService';

const router = express.Router();

/**
 * @swagger
 * /api/security/2fa/setup:
 *   post:
 *     summary: Setup 2FA - generate secret and QR code
 *     description: Generates a TOTP secret and returns a QR code URL for the authenticated user.
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup data returned
 *       400:
 *         description: 2FA already enabled
 */
router.post('/setup', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const result = await generateSecret(req.user.id);
    wrapResult(res, {
      message: 'Scan the QR code with your authenticator app, then verify with a code.',
      secret: result.secret,
      qrUrl: result.qrUrl
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/security/2fa/enable:
 *   post:
 *     summary: Enable 2FA after verifying token
 *     description: Verifies a TOTP code and enables 2FA. Returns backup codes.
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: The 6-digit TOTP code from the authenticator app
 *     responses:
 *       200:
 *         description: 2FA enabled successfully, returns backup codes
 *       400:
 *         description: Invalid code or setup not initiated
 */
router.post('/enable', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ message: 'Verification token is required' });
      return;
    }
    const result = await enable2FA(req.user.id, token);
    wrapResult(res, {
      message: '2FA has been enabled successfully. Save your backup codes securely.',
      backupCodes: result.backupCodes
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/security/2fa/disable:
 *   post:
 *     summary: Disable 2FA
 *     description: Disables 2FA for the authenticated user after verifying a current TOTP code.
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Current 6-digit TOTP code to confirm disable
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 *       400:
 *         description: Invalid code or 2FA not enabled
 */
router.post('/disable', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ message: 'Current 2FA code is required to disable' });
      return;
    }
    await disable2FA(req.user.id, token);
    wrapResult(res, { message: '2FA has been disabled successfully.' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/security/2fa/verify:
 *   post:
 *     summary: Verify 2FA token during login
 *     description: Verifies a TOTP code or backup code during the login process.
 *     tags: [Two-Factor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: The user ID (provided during login flow)
 *               token:
 *                 type: string
 *                 description: The 6-digit TOTP code or backup code
 *               isBackupCode:
 *                 type: boolean
 *                 description: Whether this is a backup code
 *     responses:
 *       200:
 *         description: 2FA code verified
 *       400:
 *         description: Invalid code
 */
router.post('/verify', authLimiter, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, token, isBackupCode } = req.body;
    if (!userId || !token) {
      res.status(400).json({ message: 'User ID and verification token are required' });
      return;
    }

    let valid = false;

    if (isBackupCode) {
      valid = await verifyBackupCode(userId, token);
    } else {
      valid = await verifyToken(userId, token);
    }

    if (!valid) {
      res.status(400).json({ message: 'Invalid verification code' });
      return;
    }

    wrapResult(res, { message: '2FA code verified', valid: true });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/security/2fa/backup-codes:
 *   post:
 *     summary: Generate new backup codes
 *     description: Generates a new set of 10 backup codes. Old codes are invalidated.
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New backup codes generated
 *       400:
 *         description: 2FA not enabled
 */
router.post('/backup-codes', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const codes = await generateBackupCodes(req.user.id);
    wrapResult(res, {
      message: 'New backup codes generated. Previous codes are no longer valid. Store these securely.',
      backupCodes: codes
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/security/2fa/status:
 *   get:
 *     summary: Check 2FA status
 *     description: Returns whether 2FA is enabled for the authenticated user.
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA status returned
 */
router.get('/status', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const setupData = await getSetupData(req.user.id);
    wrapResult(res, {
      isEnabled: setupData.isEnabled,
      method: setupData.method,
      backupCodesRemaining: setupData.backupCodesRemaining
    });
  } catch (error) {
    next(error);
  }
});

export default router;
