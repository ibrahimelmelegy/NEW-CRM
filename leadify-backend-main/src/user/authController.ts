import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { verifySync } from 'otplib';
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from './userModel';
import LoginFailure from './models/loginFailureModel';
import Session from './models/sessionModel';
import ResetToken from './models/resetTokenModel';
import PasswordResetLog from './models/passwordResetLogModel';
import { wrapResult } from '../utils/response/responseWrapper';

dotenv.config();

const LOCK_TIME = parseInt(process.env.LOGIN_LOCK_TIME_MS || '900000', 10); // Default: 15 minutes
const MAX_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10);
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error('FATAL: SECRET_KEY environment variable is not set. Server cannot start without it.');
}

// Email configuration (using nodemailer)
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com', // Microsoft 365 or Outlook SMTP server
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER as string,
    pass: process.env.EMAIL_PASS as string
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    wrapResult(res, { token });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

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

export const logoutUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return; // End function execution here
    }

    const decoded = jwt.verify(token, SECRET_KEY) as { id: string };
    await Session.destroy({ where: { userId: decoded.id, token } });

    wrapResult(res, { message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await ResetToken.destroy({ where: { userId: user.id } });

    const resetToken = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
    await ResetToken.create({
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

    // const mailOptions = {
    //     from: process.env.EMAIL_USER as string,
    //     to: user.email,
    //     subject: 'Password Reset Request',
    //     html: `
    //         <p>Hi,</p>
    //         <p>It looks like you requested a password reset. Don’t worry, we’ve got you covered!</p>
    //         <p>Please click on the button below to reset your password. The link is valid for 24 hours:</p>
    //         <a href="${resetLink}" style="background-color:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
    //         <p>If you didn’t request this, you can safely ignore this email.</p>
    //         <p>Best Regards,</p>
    //     `
    // };

    // await transporter.sendMail(mailOptions);

    wrapResult(res, { message: 'Password reset link sent to your email.', resetLink });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // const mailOptions = {
    //     from: process.env.EMAIL_USER as string,
    //     to: user.email,
    //     subject: 'Password Reset Notification',
    //     html: `<p>The user with email <b>${user.email}</b> has successfully reset their password.</p>`
    // };

    // await transporter.sendMail(mailOptions);

    wrapResult(res, { message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error instanceof Error ? error.message : 'Server error' });
  }
};

export const checkResetToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
