import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { verifySync } from 'otplib';
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import dotenv from 'dotenv';
import User from './userModel';
import LoginFailure from './models/loginFailureModel';
import Session from './models/sessionModel';
import ResetToken from './models/resetTokenModel';
import PasswordResetLog from './models/passwordResetLogModel';
import { wrapResult } from '../utils/response/responseWrapper';
import { setAuthCookie, clearAuthCookie, COOKIE_NAME } from '../utils/auth/cookieHelper';
import Tenant from '../tenant/tenantModel';
import Role from '../role/roleModel';
import { sequelize } from '../config/db';
import { sendEmail } from '../utils/emailHelper';
import logger from '../config/logger';

dotenv.config();

const LOCK_TIME = parseInt(process.env.LOGIN_LOCK_TIME_MS || '900000', 10); // Default: 15 minutes
const MAX_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10);
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error('FATAL: SECRET_KEY environment variable is not set. Server cannot start without it.');
}

export const registerWorkspace = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { workspaceName, userName, email, password } = req.body;
  const transaction = await sequelize.transaction();

  try {
    // 1. Check if email already exists
    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      res.status(400).json({ message: 'Email is already registered.' });
      await transaction.rollback();
      return;
    }

    // 2. Create the Tenant (Workspace)
    const tenant = await Tenant.create(
      {
        name: workspaceName,
        status: 'ACTIVE'
      },
      { transaction }
    );

    // 3. Create a default Admin Role for this new Tenant
    const adminRole = await Role.create(
      {
        name: 'Admin',
        description: 'Workspace Administrator with full access.',
        isAdmin: true,
        tenantId: tenant.id
      },
      { transaction }
    );

    // 4. Create the founding User
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create(
      {
        name: userName,
        email,
        password: hashedPassword,
        roleId: adminRole.id,
        tenantId: tenant.id, // Bind user to the new workspace
        status: 'ACTIVE'
      },
      { transaction }
    );

    // 5. Automatically log them in (Generate JWT)
    const token = jwt.sign({ id: user.id, tenantId: tenant.id }, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRATION_TIME || ('7d' as any) });
    await Session.create(
      {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + (Number(process.env.SESSION_EXPIRATION_TIME) || 7) * 24 * 60 * 60 * 1000)
      },
      { transaction }
    );

    // Commit all changes
    await transaction.commit();

    setAuthCookie(res, token);
    wrapResult(res, {
      message: 'Workspace created successfully!',
      token,
      tenant: { id: tenant.id, name: tenant.name },
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Failed to create workspace', error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const loginUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { email, password } = req.body;
  // Login attempt - sensitive data not logged

  try {
    // Check recent login failures
    const recentFailures = await LoginFailure.count({
      where: {
        email,
        timestamp: { [Op.gte]: new Date(Date.now() - LOCK_TIME) } // Failures within the lock time
      }
    });

    if (recentFailures >= MAX_ATTEMPTS) {
      res.status(429).json({ message: 'Too many failed attempts. Please try again later.' });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      await LoginFailure.create({ email, reason: 'Invalid credentials' });
      // Same response as invalid password to prevent user enumeration
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await LoginFailure.create({ email, reason: 'Invalid credentials' });
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const { twoFactorCode } = req.body;

      if (!twoFactorCode) {
        // Password correct but 2FA required - don't issue token yet
        res.status(206).json({
          message: '2FA verification required',
          requires2FA: true,
          email: user.email
        });
        return;
      }

      // Verify the 2FA code
      const result2FA = verifySync({ token: twoFactorCode, secret: user.twoFactorSecret });
      const is2FAValid = result2FA.valid;
      if (!is2FAValid) {
        await LoginFailure.create({ email, reason: 'Invalid 2FA code' });
        res.status(401).json({ message: 'Invalid 2FA code' });
        return;
      }
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRATION_TIME || ('7d' as any) });
    await Session.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + (Number(process.env.SESSION_EXPIRATION_TIME) || 7) * 24 * 60 * 60 * 1000)
    });

    setAuthCookie(res, token);
    wrapResult(res, { token });
  } catch (error) {
    const err = error as Error;
    logger.error(`Login error for ${email}: ${err.message} | ${err.stack}`);
    res.status(500).json({ status: 500, success: false, message: err.message, body: {} });
  }
};

export const getUserProfile = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.[COOKIE_NAME] || null;

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return; // End function execution here
    }

    const decoded = jwt.verify(token, SECRET_KEY) as { id: string };

    // Check if the session exists and is valid
    const session = await Session.findOne({ where: { userId: decoded.id, token } });
    if (!session) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    // Fetch the user data
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      include: [{ model: require('../role/roleModel').default }] // Dynamically load Role to avoid circular deps
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    wrapResult(res, user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve user data', error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const logoutUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.[COOKIE_NAME] || null;
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return; // End function execution here
    }

    const decoded = jwt.verify(token, SECRET_KEY) as { id: string };
    await Session.destroy({ where: { userId: decoded.id, token } });

    clearAuthCookie(res);
    wrapResult(res, { message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    // Always return the same response regardless of whether the user exists
    // to prevent user enumeration attacks
    if (user) {
      await ResetToken.destroy({ where: { userId: user.id } });

      const resetToken = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
      await ResetToken.create({
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

      // Send password reset email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Reset Request',
          text: `You requested a password reset. Click the following link to reset your password: ${resetLink}\n\nThis link will expire in 24 hours. If you did not request this, please ignore this email.`,
          html: `<div style="font-family: sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <p style="margin: 24px 0;"><a href="${resetLink}" style="background: #7849ff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a></p>
            <p style="color: #666; font-size: 13px;">This link will expire in 24 hours. If you did not request this, please ignore this email.</p>
          </div>`
        });
      } catch (emailError) {
        logger.error({ err: emailError, email: user.email }, 'Failed to send password reset email');
      }
    }

    wrapResult(res, { message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { id: string; email: string };
    const resetToken = await ResetToken.findOne({
      where: {
        userId: decoded.id,
        token: token,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!resetToken) {
      await PasswordResetLog.create({ userId: Number(decoded.id), email: decoded.email, status: 'Failure' });
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      await PasswordResetLog.create({ userId: Number(decoded.id), email: decoded.email, status: 'Failure' });
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await Session.destroy({ where: { userId: user.id } });

    await PasswordResetLog.create({ userId: user.id, email: user.email, status: 'Success' });

    // Send password reset confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Successful',
        text: 'Your password has been reset successfully. If you did not make this change, please contact support immediately.',
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset Successful</h2>
          <p>Your password has been reset successfully.</p>
          <p style="color: #666; font-size: 13px;">If you did not make this change, please contact support immediately.</p>
        </div>`
      });
    } catch (emailError) {
      logger.error({ err: emailError, email: user.email }, 'Failed to send password reset confirmation email');
    }

    wrapResult(res, { message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const checkResetToken = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { id: string };
    const resetToken = await ResetToken.findOne({
      where: {
        userId: decoded.id,
        token: token,
        expiresAt: { [Op.gt]: new Date() }
      }
    });
    if (!resetToken) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    wrapResult(res, { message: 'Token is valid', userId: decoded.id });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token', error: error instanceof Error ? error.message : 'Server error' });
  }
};
