import { Request, Response } from 'express';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import User from './userModel';
import { AuthenticatedRequest } from '../types';

const APP_NAME = 'High Point Technology CRM';

export const setup2FA = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (user.twoFactorEnabled) {
      res.status(400).json({ message: '2FA is already enabled. Disable it first to reconfigure.' });
      return;
    }

    const secret = generateSecret();

    // Store the secret temporarily (not yet enabled until verified)
    await User.update({ twoFactorSecret: secret }, { where: { id: user.id } });

    const otpauthUrl = generateURI({
      issuer: APP_NAME,
      label: user.email,
      secret
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.status(200).json({
      message: '2FA setup initiated. Scan the QR code with your authenticator app, then verify with a code.',
      manualEntryKey: secret,
      qrCode: qrCodeDataUrl
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to set up 2FA' });
  }
};

export const verify2FA = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { code } = req.body;
    if (!code) {
      res.status(400).json({ message: 'Verification code is required' });
      return;
    }

    const dbUser = await User.findByPk(user.id);
    if (!dbUser || !dbUser.twoFactorSecret) {
      res.status(400).json({ message: 'Please initiate 2FA setup first' });
      return;
    }

    const result = verifySync({ token: code, secret: dbUser.twoFactorSecret });

    if (!result.valid) {
      res.status(400).json({ message: 'Invalid verification code. Please try again.' });
      return;
    }

    await User.update({ twoFactorEnabled: true }, { where: { id: user.id } });

    res.status(200).json({ message: '2FA has been enabled successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify 2FA' });
  }
};

export const disable2FA = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { code } = req.body;
    if (!code) {
      res.status(400).json({ message: 'Current 2FA code is required to disable' });
      return;
    }

    const dbUser = await User.findByPk(user.id);
    if (!dbUser || !dbUser.twoFactorEnabled || !dbUser.twoFactorSecret) {
      res.status(400).json({ message: '2FA is not enabled' });
      return;
    }

    const result = verifySync({ token: code, secret: dbUser.twoFactorSecret });
    if (!result.valid) {
      res.status(400).json({ message: 'Invalid verification code' });
      return;
    }

    await User.update({ twoFactorEnabled: false, twoFactorSecret: null }, { where: { id: user.id } });

    res.status(200).json({ message: '2FA has been disabled successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
};

export const validateLoginCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ message: 'Email and 2FA code are required' });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      res.status(400).json({ message: 'Invalid request' });
      return;
    }

    const result = verifySync({ token: code, secret: user.twoFactorSecret });

    if (!result.valid) {
      res.status(400).json({ message: 'Invalid 2FA code' });
      return;
    }

    res.status(200).json({ message: '2FA code verified', valid: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate 2FA code' });
  }
};
