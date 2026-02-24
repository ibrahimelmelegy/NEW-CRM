import { Request } from 'express';
import User from './user/userModel';

export interface AuthenticatedRequest extends Request {
  user?: InstanceType<typeof User>; // or just `User` if it's the instance type
  emailApiKey?: InstanceType<typeof String>;
  file?: { fieldname: string; originalname: string; encoding: string; mimetype: string; size: number; destination?: string; filename?: string; path: string; buffer?: Buffer };
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
