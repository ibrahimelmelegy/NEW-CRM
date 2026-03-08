import express from 'express';
import { loginUser, logoutUser, forgotPassword, resetPassword, checkResetToken, getUserProfile, registerWorkspace } from './authController';
import { authenticateUser } from '../middleware/authMiddleware';
import { setup2FA, verify2FA, disable2FA, validateLoginCode } from './twoFactorController';
import { authLimiter } from '../middleware/rateLimiter';
import { validateBody } from '../middleware/validation';
import { LoginInput } from './inputs/loginInput';
import { ForgotPasswordInput } from './inputs/forgotPasswordInput';
import { ResetPasswordInput } from './inputs/resetPasswordInput';
import { RegisterInput } from './inputs/registerInput';
import { TwoFactorCodeInput, ValidateLoginCodeInput } from './inputs/twoFactorInput';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Logs in a user and provides a token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       429:
 *         description: Too many failed attempts. Try again in 1 minute.
 *       200:
 *         description: Login successful, returns token
 *       401:
 *         description: Unauthorized, invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// Authentication route for login (rate-limited to prevent brute force)
router.post('/login', authLimiter, validateBody(LoginInput), loginUser);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new Workspace
 *     description: Creates a new Workspace (Tenant), an Admin Role, and the founding User. returns a token.
 *     tags: [Authentication]
 */
router.post('/register', authLimiter, validateBody(RegisterInput), registerWorkspace);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get user profile
 *     description: Returns the user profile associated with the provided token.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Unauthorized, token is missing or invalid
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/me', getUserProfile);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logs out an authenticated user by invalidating their session.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: No token provided
 *       500:
 *         description: Server error
 */
// Logout route (authenticated users only)
router.post('/logout', authenticateUser, logoutUser);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Sends a password reset email to the user with a reset link.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user requesting password reset
 *     responses:
 *       200:
 *         description: Password reset link sent
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// Forgot password route (rate-limited)
router.post('/forgot-password', authLimiter, validateBody(ForgotPasswordInput), forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Resets the user’s password using a valid token sent in the password reset email.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: The password reset token
 *               newPassword:
 *                 type: string
 *                 description: The new password to set
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
// Reset password route (rate-limited)
router.post('/reset-password', authLimiter, validateBody(ResetPasswordInput), resetPassword);

/**
 * @swagger
 * /api/auth/check-reset-token:
 *   post:
 *     summary: Check reset token
 *     description: Verifies if a password reset token is valid.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: The password reset token to verify
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid or expired token
 */
// Route to verify the reset token (optional for frontend validation)
router.post('/check-reset-token', authLimiter, checkResetToken);

/**
 * @swagger
 * /api/auth/2fa/setup:
 *   post:
 *     summary: Setup 2FA
 *     description: Generates a TOTP secret and QR code for the authenticated user.
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup initiated, returns QR code and secret
 *       400:
 *         description: 2FA already enabled
 *       401:
 *         description: Unauthorized
 */
router.post('/2fa/setup', authenticateUser, setup2FA);

/**
 * @swagger
 * /api/auth/2fa/verify:
 *   post:
 *     summary: Verify and enable 2FA
 *     description: Verifies a TOTP code and enables 2FA for the authenticated user.
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
 *               code:
 *                 type: string
 *                 description: The 6-digit TOTP code from the authenticator app
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *       400:
 *         description: Invalid code or 2FA not set up
 */
router.post('/2fa/verify', authenticateUser, validateBody(TwoFactorCodeInput), verify2FA);

/**
 * @swagger
 * /api/auth/2fa/disable:
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
 *               code:
 *                 type: string
 *                 description: Current 6-digit TOTP code to confirm disable
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
 *       400:
 *         description: Invalid code or 2FA not enabled
 */
router.post('/2fa/disable', authenticateUser, validateBody(TwoFactorCodeInput), disable2FA);

/**
 * @swagger
 * /api/auth/2fa/validate:
 *   post:
 *     summary: Validate 2FA code during login
 *     description: Validates a TOTP code during the login process (when 2FA is enabled).
 *     tags: [Two-Factor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA code is valid
 *       400:
 *         description: Invalid code
 */
router.post('/2fa/validate', authLimiter, validateBody(ValidateLoginCodeInput), validateLoginCode);

export default router;
