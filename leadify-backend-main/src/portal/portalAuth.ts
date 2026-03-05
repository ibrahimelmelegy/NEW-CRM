import { Request, Response, NextFunction } from 'express';
import PortalToken from './portalTokenModel';
import Client from '../client/clientModel';

/**
 * Portal token-based auth middleware.
 * Validates Bearer token from the portal_tokens table (magic-link tokens).
 * Attaches clientId and client info to the request.
 */
export interface PortalTokenRequest extends Request {
  portalClientId?: string;
  portalClient?: InstanceType<typeof Client>;
  portalTokenRecord?: InstanceType<typeof PortalToken>;
}

export const authenticatePortalToken = async (req: PortalTokenRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.header('Authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token is required' });
    return;
  }

  try {
    const portalToken = await PortalToken.findOne({
      where: { token, isActive: true },
      include: [{ model: Client }]
    });

    if (!portalToken) {
      res.status(401).json({ success: false, message: 'Invalid or expired access token' });
      return;
    }

    // Check expiration
    if (portalToken.expiresAt && new Date(portalToken.expiresAt) < new Date()) {
      await portalToken.update({ isActive: false });
      res.status(401).json({ success: false, message: 'Access token has expired' });
      return;
    }

    // Update last access
    await portalToken.update({ lastAccessAt: new Date() });

    req.portalClientId = portalToken.clientId;
    req.portalClient = portalToken.client;
    req.portalTokenRecord = portalToken;

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};
