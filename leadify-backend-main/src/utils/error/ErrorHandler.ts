import { Request, Response, NextFunction } from 'express';
import BaseError from './base-http-exception';

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

  const response = {
    status: statusCode,
    code: internalCode,
    success: false,
    message: message || error.message,
    body: {}
  };

  if (statusCode === 500) {
    console.error('🔥 Server Error:', error.message, error.stack);
  } else if (process.env.NODE_ENV !== 'production') {
    console.warn(`🛑 Client Error (${statusCode}):`, error.message);
  }

  return res.status(statusCode).send(response);
};
