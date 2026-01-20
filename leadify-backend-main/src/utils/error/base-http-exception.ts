// BaseError.ts
import { ERRORS } from './errors';

class BaseError extends Error {
  public code: number; // Internal error code
  public statusCode: number; // HTTP status code

  constructor(code: number, statusCode: number = 400, message?: string) {
    // If code is < 600, it's likely a standard HTTP status code
    const actualStatusCode = code < 600 ? code : statusCode;

    // Use the enum key as the default message for translation
    const translationKey = ERRORS[code] || 'SOMETHING_WENT_WRONG';

    super(message || translationKey);
    this.code = code;
    this.statusCode = actualStatusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default BaseError;
