import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import PortalUser from './portalUserModel';
import Client from '../client/clientModel';

export interface PortalRequest extends Request {
  portalUser?: InstanceType<typeof PortalUser>;
}

interface JwtPayload {
  id: string;
  type: string;
}

export const authenticatePortalUser = async (req: PortalRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.header('Authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const SECRET_KEY = process.env.SECRET_KEY;
    if (!SECRET_KEY) {
      res.status(500).json({ message: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    if (decoded.type !== 'portal') {
      res.status(401).json({ message: 'Invalid token type' });
      return;
    }

    const portalUser = await PortalUser.findByPk(decoded.id, {
      include: [{ model: Client }]
    });

    if (!portalUser || !portalUser.isActive) {
      res.status(401).json({ message: 'Account not found or disabled' });
      return;
    }

    req.portalUser = portalUser;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};
