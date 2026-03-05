import { Request } from 'express';
import User from './user/userModel';
import Tenant from './tenant/tenantModel';

export interface AuthenticatedRequest extends Request {
  user?: InstanceType<typeof User>; // or just `User` if it's the instance type
  /** Populated by validateTenant middleware — the full tenant record */
  tenant?: InstanceType<typeof Tenant>;
  emailApiKey?: InstanceType<typeof String>;
  file?: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path: string;
    buffer?: Buffer;
  };
}

export interface IPaginationRes<T> {
  docs: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
