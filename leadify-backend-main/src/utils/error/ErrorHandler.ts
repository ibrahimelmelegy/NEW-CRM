import { Request, Response, NextFunction } from 'express';
import BaseError from './base-http-exception';
import logger from '../../config/logger';

export default (error: Error, req: Request, res: Response, _next: NextFunction): Response => {
  const isBaseError = error instanceof BaseError;

  const statusCode = isBaseError ? error.statusCode : 500;
  const internalCode = isBaseError ? error.code : 500;

  // Try translating the error message (which is usually the Enum Key)
  let message = req.t(error.message);

  // Fallback for generic errors
  if (message === error.message && !isBaseError) {
    message = req.t('SOMETHING_WENT_WRONG');
  }

  const response: { status: number; code: number; success: boolean; message: string; body: Record<string, never> } = {
    status: statusCode,
    code: internalCode,
    success: false,
    message: message || error.message,
    body: {}
  };

  // Always log 500 errors (even in production)
  if (statusCode === 500) {
    logger.error({ err: error }, 'Server Error');
  }
  if (process.env.NODE_ENV !== 'production' && statusCode !== 500) {
    logger.warn({ statusCode, message: error.message }, `Client Error (${statusCode})`);
  }

  return res.status(statusCode).send(response);
};
