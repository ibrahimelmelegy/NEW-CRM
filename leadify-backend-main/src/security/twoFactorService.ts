import crypto from 'crypto';
import TwoFactorAuth from './twoFactorModel';
import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const APP_NAME = 'Leadify CRM';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

// --- Encryption helpers for secret storage ---

function getEncryptionKey(): Buffer {
  const key = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.SECRET_KEY || 'default-encryption-key-change-me!';
  // Ensure 32-byte key for AES-256
  return crypto.scryptSync(key, 'leadify-2fa-salt', 32);
}

function encryptSecret(plainSecret: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(plainSecret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Store as iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptSecret(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format');
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// --- TOTP Implementation using Node.js crypto ---

function generateRandomBase32(length: number = 20): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result;
}

function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanInput = input.replace(/=+$/, '').toUpperCase();

  let bits = '';
  for (const char of cleanInput) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateHOTP(secret: Buffer, counter: number): string {
  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = Buffer.alloc(8);
  let remaining = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }

  // HMAC-SHA1
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(counterBuffer);
  const hmacResult = hmac.digest();

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  // Get last N digits
  const otp = code % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

function generateTOTP(secret: string, timeOffset: number = 0): string {
  const secretBuffer = base32Decode(secret);
  const timeStep = Math.floor(Date.now() / 1000 / TOTP_PERIOD) + timeOffset;
  return generateHOTP(secretBuffer, timeStep);
}

function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  // Check current time step and +/- window to account for time drift
  for (let offset = -window; offset <= window; offset++) {
    const expectedToken = generateTOTP(secret, offset);
    // Constant-time comparison to prevent timing attacks
    if (
      token.length === expectedToken.length &&
      crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))
    ) {
      return true;
    }
  }
  return false;
}

function generateOtpauthURI(secret: string, email: string): string {
  const issuer = encodeURIComponent(APP_NAME);
  const label = encodeURIComponent(`${APP_NAME}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

// --- Service Functions ---

/**
 * Generate a TOTP secret for a user and store it (encrypted).
 * Returns the plain secret and QR code URL for authenticator app setup.
 */
export async function generateSecret(userId: number): Promise<{ secret: string; qrUrl: string }> {
  const user = await User.findByPk(userId);
  if (!user) throw new BaseError(ERRORS.USER_NOT_FOUND);

  // Check if already has active 2FA
  const existing = await TwoFactorAuth.findOne({ where: { userId } });
  if (existing && existing.isEnabled) {
    throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, '2FA is already enabled. Disable it first to reconfigure.');
  }

  const plainSecret = generateRandomBase32(20);
  const encryptedSecret = encryptSecret(plainSecret);
  const qrUrl = generateOtpauthURI(plainSecret, user.email);

  if (existing) {
    await existing.update({
      secret: encryptedSecret,
      isEnabled: false,
      backupCodes: null,
      verifiedAt: null
    });
  } else {
    await TwoFactorAuth.create({
      userId,
      secret: encryptedSecret,
      isEnabled: false,
      backupCodes: null,
      method: 'TOTP',
      verifiedAt: null
    });
  }

  return { secret: plainSecret, qrUrl };
}

/**
 * Verify a TOTP token against stored secret for a user.
 */
export async function verifyToken(userId: number, token: string): Promise<boolean> {
  const twoFactor = await TwoFactorAuth.findOne({ where: { userId } });
  if (!twoFactor) return false;

  const plainSecret = decryptSecret(twoFactor.secret);
  return verifyTOTP(plainSecret, token);
}

/**
 * Enable 2FA after verifying the TOTP token (first-time activation).
 */
export async function enable2FA(userId: number, token: string): Promise<{ backupCodes: string[] }> {
  const twoFactor = await TwoFactorAuth.findOne({ where: { userId } });
  if (!twoFactor) {
    throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Please initiate 2FA setup first.');
  }
  if (twoFactor.isEnabled) {
    throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, '2FA is already enabled.');
  }

  const plainSecret = decryptSecret(twoFactor.secret);
  const isValid = verifyTOTP(plainSecret, token);
  if (!isValid) {
    throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Invalid verification code. Please try again.');
  }

  // Generate backup codes upon enabling
  const { codes: plainBackupCodes, hashed: hashedBackupCodes } = generateBackupCodesInternal();

  await twoFactor.update({
    isEnabled: true,
    verifiedAt: new Date(),
    backupCodes: hashedBackupCodes
  });

  // Also update the User model's twoFactorEnabled flag for backward compatibility
  await User.update({ twoFactorEnabled: true }, { where: { id: userId } });

  return { backupCodes: plainBackupCodes };
}

/**
 * Disable 2FA after verifying the current TOTP token.
 */
export async function disable2FA(userId: number, token: string): Promise<void> {
  const twoFactor = await TwoFactorAuth.findOne({ where: { userId } });
  if (!twoFactor || !twoFactor.isEnabled) {
    throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, '2FA is not enabled.');
  }

  const plainSecret = decryptSecret(twoFactor.secret);
  const isValid = verifyTOTP(plainSecret, token);
  if (!isValid) {
    throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, 'Invalid verification code.');
  }

  await twoFactor.update({
    isEnabled: false,
    backupCodes: null,
    verifiedAt: null
  });

  // Also update the User model for backward compatibility
  await User.update(
    { twoFactorEnabled: false, twoFactorSecret: null },
    { where: { id: userId } }
  );
}

/**
 * Generate new backup codes. Replaces existing backup codes.
 * Returns the plain-text codes (shown to user once), stores hashed versions.
 */
export async function generateBackupCodes(userId: number): Promise<string[]> {
  const twoFactor = await TwoFactorAuth.findOne({ where: { userId } });
  if (!twoFactor || !twoFactor.isEnabled) {
    throw new BaseError(ERRORS.SOMETHING_WENT_WRONG, 400, '2FA must be enabled to generate backup codes.');
  }

  const { codes: plainCodes, hashed: hashedCodes } = generateBackupCodesInternal();

  await twoFactor.update({ backupCodes: hashedCodes });

  return plainCodes;
}

/**
 * Verify and consume a backup code.
 * Once used, the code is removed from the stored hashed codes.
 */
export async function verifyBackupCode(userId: number, code: string): Promise<boolean> {
  const twoFactor = await TwoFactorAuth.findOne({ where: { userId } });
  if (!twoFactor || !twoFactor.isEnabled || !twoFactor.backupCodes) {
    return false;
  }

  const normalizedCode = code.replace(/[-\s]/g, '').toLowerCase();
  const hashedInput = hashBackupCode(normalizedCode);

  const storedCodes = twoFactor.backupCodes as string[];
  const matchIndex = storedCodes.findIndex(stored => {
    try {
      return crypto.timingSafeEqual(Buffer.from(stored, 'hex'), Buffer.from(hashedInput, 'hex'));
    } catch {
      return false;
    }
  });

  if (matchIndex === -1) return false;

  // Remove used code
  const updatedCodes = [...storedCodes];
  updatedCodes.splice(matchIndex, 1);
  await twoFactor.update({ backupCodes: updatedCodes });

  return true;
}

/**
 * Check whether the user has 2FA enabled.
 */
export async function is2FAEnabled(userId: number): Promise<boolean> {
  const twoFactor = await TwoFactorAuth.findOne({ where: { userId } });
  return twoFactor?.isEnabled === true;
}

/**
 * Get setup data: QR code URL and secret for TOTP app configuration.
 * Useful for displaying setup instructions.
 */
export async function getSetupData(userId: number): Promise<{
  secret: string;
  qrUrl: string;
  method: string;
  isEnabled: boolean;
  backupCodesRemaining: number;
}> {
  const user = await User.findByPk(userId);
  if (!user) throw new BaseError(ERRORS.USER_NOT_FOUND);

  const twoFactor = await TwoFactorAuth.findOne({ where: { userId } });
  if (!twoFactor) {
    return {
      secret: '',
      qrUrl: '',
      method: 'TOTP',
      isEnabled: false,
      backupCodesRemaining: 0
    };
  }

  const plainSecret = decryptSecret(twoFactor.secret);
  const qrUrl = generateOtpauthURI(plainSecret, user.email);
  const backupCodesRemaining = twoFactor.backupCodes
    ? (twoFactor.backupCodes as string[]).length
    : 0;

  return {
    secret: plainSecret,
    qrUrl,
    method: twoFactor.method,
    isEnabled: twoFactor.isEnabled,
    backupCodesRemaining
  };
}

// --- Internal helpers ---

function generateBackupCodesInternal(): { codes: string[]; hashed: string[] } {
  const codes: string[] = [];
  const hashed: string[] = [];

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = crypto.randomBytes(BACKUP_CODE_LENGTH).toString('hex').substring(0, BACKUP_CODE_LENGTH);
    codes.push(code);
    hashed.push(hashBackupCode(code));
  }

  return { codes, hashed };
}

function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}
